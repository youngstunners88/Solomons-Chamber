"""Numbers in code, words to the model: a tested discretiser.

The model never sees a decimal. Code does the arithmetic against cut points
that live in code, are reviewed like code, and are tested like code; the
model gets one word per band.

Two reasons, one vendor-stated and one measured here:
  * TypeSafe documents Jev as unreliable at maths, counting and date ordering
    (model-jaggedness/jev-1.13). The classic failure: 9.11 judged larger than
    9.9 because the suffix tokenises as its own number.
  * Every word is a dimension the answer can flip on, and a flip in a trading
    loop is a fee. So the encoder can hold a band's previous label inside a
    deadband around each cut (hysteresis), and flip_rate() measures what a
    state actually costs instead of guessing at a word budget.
"""
from __future__ import annotations

import math
import re
from dataclasses import dataclass
from typing import Mapping, Sequence

__all__ = ["Band", "EncodeError", "Encoder", "flip_rate"]

_WORD = re.compile(r"^[a-z][a-z0-9_]*$")


class EncodeError(ValueError):
    pass


@dataclass(frozen=True)
class Band:
    """One input -> one word.

    `cuts` strictly increasing; `labels` has one more entry than `cuts`.
    A value v gets labels[i] where i = number of cuts <= v. So with cuts
    [0.006] and labels ["deep", "thin"], 0.006 itself is "thin" -- the cut
    belongs to the band above, stated once here rather than per call site.

    `deadband` is an absolute margin around every cut: with a previous label,
    the value must cross a cut by more than `deadband` before the label moves.
    """

    name: str
    cuts: tuple[float, ...]
    labels: tuple[str, ...]
    deadband: float = 0.0

    def __post_init__(self) -> None:
        if not self.cuts:
            raise EncodeError(f"{self.name}: a band needs at least one cut")
        if len(self.labels) != len(self.cuts) + 1:
            raise EncodeError(f"{self.name}: {len(self.cuts)} cuts need {len(self.cuts) + 1} labels")
        if any(not math.isfinite(c) for c in self.cuts):
            raise EncodeError(f"{self.name}: cuts must be finite")
        if any(b <= a for a, b in zip(self.cuts, self.cuts[1:])):
            raise EncodeError(f"{self.name}: cuts must be strictly increasing")
        if len(set(self.labels)) != len(self.labels):
            raise EncodeError(f"{self.name}: labels must be distinct")
        for w in self.labels:
            if not _WORD.match(w):
                raise EncodeError(f"{self.name}: label {w!r} is not one lowercase word")
        if self.deadband < 0:
            raise EncodeError(f"{self.name}: deadband must be >= 0")
        gaps = [b - a for a, b in zip(self.cuts, self.cuts[1:])]
        if gaps and self.deadband * 2 >= min(gaps):
            raise EncodeError(f"{self.name}: deadband overlaps between adjacent cuts")

    def label(self, v: float, prev: str | None = None) -> str:
        if not isinstance(v, (int, float)) or isinstance(v, bool) or not math.isfinite(v):
            # Never default. A NaN that quietly becomes the lowest band is a
            # confident answer built on a missing input.
            raise EncodeError(f"{self.name}: value {v!r} is not a finite number")
        raw = self.labels[sum(1 for c in self.cuts if v >= c)]
        if prev is None or self.deadband == 0 or prev == raw:
            return raw
        if prev not in self.labels:
            raise EncodeError(f"{self.name}: previous label {prev!r} is not one of {self.labels}")
        i_prev, i_raw = self.labels.index(prev), self.labels.index(raw)
        # Moving up means crossing cuts[i_prev] (the cut above prev); down
        # means crossing cuts[i_prev - 1]. Stay put unless the move clears
        # that cut by more than the deadband.
        if i_raw > i_prev and v < self.cuts[i_prev] + self.deadband:
            return prev
        if i_raw < i_prev and v > self.cuts[i_prev - 1] - self.deadband:
            return prev
        return raw


class Encoder:
    """An ordered set of bands. The state is their words, space-joined."""

    def __init__(self, bands: Sequence[Band], max_words: int | None = None) -> None:
        names = [b.name for b in bands]
        if len(set(names)) != len(names):
            raise EncodeError("band names must be distinct")
        if max_words is not None and len(bands) > max_words:
            raise EncodeError(f"{len(bands)} bands exceed the word budget of {max_words}")
        self.bands = tuple(bands)

    def encode(self, values: Mapping[str, float], prev: Sequence[str] | None = None) -> list[str]:
        missing = [b.name for b in self.bands if b.name not in values]
        if missing:
            raise EncodeError(f"missing inputs: {missing}")
        extra = sorted(set(values) - {b.name for b in self.bands})
        if extra:
            # An input with no band is an input the model silently never sees.
            raise EncodeError(f"inputs with no band: {extra}")
        if prev is not None and len(prev) != len(self.bands):
            raise EncodeError("previous state has the wrong number of words")
        return [b.label(values[b.name], prev[i] if prev else None) for i, b in enumerate(self.bands)]

    def state(self, values: Mapping[str, float], prev: Sequence[str] | None = None) -> str:
        return " ".join(self.encode(values, prev))


def flip_rate(states: Sequence[Sequence[str]]) -> list[float]:
    """Per-word fraction of consecutive ticks on which that word changed.

    This is the measured cost of a state, one number per word. A word that
    flips on 40% of ticks is a fee generator; drop it, widen its deadband, or
    move its cut -- and decide from this number, not from a word budget.
    """
    if len(states) < 2:
        raise EncodeError("need at least two states to measure flips")
    width = len(states[0])
    if any(len(s) != width for s in states):
        raise EncodeError("states have different widths")
    ticks = len(states) - 1
    return [sum(1 for a, b in zip(states, states[1:]) if a[i] != b[i]) / ticks for i in range(width)]
