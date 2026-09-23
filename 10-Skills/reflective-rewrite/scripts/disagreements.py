"""Pick what the night shift reads: the confident mistakes, not the whole log.

A raw day is ~300k tokens and mostly the loop agreeing with itself. The
signal is where confidence was HIGH and the outcome went the OTHER way
(GEPA, ICLR 2026 oral: reflect on your own traces in plain language, rewrite
the instructions; beats RL by up to 19 points using up to 35x fewer rollouts).

Only RESOLVED decisions are eligible. An unresolved row has no "other way"
yet, and feeding it to a rewriter invents a mistake.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Sequence

__all__ = ["Row", "Digest", "select"]


@dataclass(frozen=True)
class Row:
    id: str
    state: str                 # the words the model saw
    answer: str
    confidence: float
    correct: bool | None       # None = unresolved


@dataclass(frozen=True)
class Digest:
    confident_wrong: tuple[Row, ...]
    total: int
    resolved: int
    wrong: int
    threshold: float

    def summary(self) -> str:
        acc = (self.resolved - self.wrong) / self.resolved if self.resolved else float("nan")
        return (f"{self.total} decisions, {self.resolved} resolved, accuracy {acc:.1%}; "
                f"{len(self.confident_wrong)} confident mistakes at conf >= {self.threshold}")


def select(rows: Sequence[Row], threshold: float = 0.8, budget: int = 50) -> Digest:
    """The most confident mistakes first, capped at `budget` rows."""
    if not 0.0 < threshold <= 1.0:
        raise ValueError("threshold must be in (0, 1]")
    if budget < 1:
        raise ValueError("budget must be at least 1")
    resolved = [r for r in rows if r.correct is not None]
    wrong = [r for r in resolved if r.correct is False]
    cw = sorted((r for r in wrong if r.confidence >= threshold), key=lambda r: (-r.confidence, r.id))
    return Digest(tuple(cw[:budget]), len(rows), len(resolved), len(wrong), threshold)
