"""A two-phase ratchet: lose small, let winners run.

Ported from the exit engine Senpi calls the DSL (Dynamic Stop-Loss), which every
one of its 114 strategy packages exits through. Their README states the shape
plainly: "Phase 1 - survive. A hard stop cuts losers fast from entry. Phase 2 -
lock. As a winner runs, a ratcheting ladder of tiers trails the stop upward,
banking a growing share of the high-water mark while keeping the tail alive."

It is generalised here because nothing about that is financial. It is a rule for
any quantity you watch over time where you want to bail out early on a bad run
and progressively protect a good one:

  * a long-running optimisation -- abandon a bad seed, checkpoint a good one
  * a scraped-data quality score -- stop on collapse, lock in a good corpus
  * a rollout's success rate -- roll back fast, harden as confidence grows

The tick function is PURE. Given a state and a new value it returns the next
state and an optional typed close reason. No I/O, no clock of its own, no
mutation of the input. That is what makes it testable, and it is the same split
Senpi enforces between `scan.py` (reads) and `scoring.py` (numbers).

TWO CONSTRUCTION-TIME REFUSALS, both taken from a warning in Senpi's own
runtime.yaml reference:

  "trailing is OFF fleet-wide and no tier locks 0 -- a floor that starts below
   entry can ratchet a WINNING trade into a loss, and a breakeven rung exits
   flat while still paying both fees."

  1. A tier locking 0% is refused. It exits flat after costs, which is a loss.
  2. Unsorted tiers are refused. A ladder that is not ascending silently applies
     the wrong rung.

Both raise when the ladder is built rather than when a position is open, for the
reason router.py refuses a badly-gated irreversible action at construction: the
combination is a mistake in the table every time, and discovering it at tick
time means discovering it with something at stake.
"""

from __future__ import annotations

from dataclasses import dataclass, replace
from enum import Enum
from typing import Sequence

__all__ = ["CloseReason", "Ladder", "RatchetState", "Tier", "open_position", "tick"]


class CloseReason(str, Enum):
    """Typed exits. A bare boolean tells you it closed, not why.

    Senpi's value here is downstream: because every close carries a reason, its
    telemetry can be mined afterwards for exit quality -- which reasons made
    money and which ones were premature.
    """

    PHASE1_STOP = "phase1_stop"          # hard floor from entry, before any tier armed
    TIER_BREACH = "tier_breach"          # fell back through a locked rung
    WEAK_PEAK = "weak_peak"              # never got going within the grace window
    HARD_TIMEOUT = "hard_timeout"        # ran out of time regardless of value


@dataclass(frozen=True)
class Tier:
    """When `trigger_pct` is reached, lock `lock_hw_pct` percent of the peak."""

    trigger_pct: float
    lock_hw_pct: float


@dataclass(frozen=True)
class Ladder:
    """The exit configuration. Validated on construction.

    `max_loss_pct`   phase-1 floor, as a positive percentage below entry.
    `tiers`          ascending by trigger_pct; each locks a share of the peak.
    `hard_timeout`   ticks after which the position closes regardless.
    `weak_peak_after`/`weak_peak_min_pct`
                     if by tick N the peak never cleared M%, it is dead weight.
    """

    max_loss_pct: float
    tiers: tuple[Tier, ...] = ()
    hard_timeout: int | None = None
    weak_peak_after: int | None = None
    weak_peak_min_pct: float = 0.0

    def __post_init__(self) -> None:
        if self.max_loss_pct <= 0:
            raise ValueError(
                "max_loss_pct is a positive distance below entry; "
                f"got {self.max_loss_pct}"
            )
        triggers = [t.trigger_pct for t in self.tiers]
        if triggers != sorted(triggers):
            raise ValueError(
                "tiers must be sorted ascending by trigger_pct -- an unsorted "
                f"ladder applies the wrong rung silently; got {triggers}"
            )
        if len(set(triggers)) != len(triggers):
            raise ValueError(f"duplicate trigger_pct in ladder: {triggers}")
        for t in self.tiers:
            if t.lock_hw_pct <= 0:
                raise ValueError(
                    f"tier at {t.trigger_pct}% locks {t.lock_hw_pct}% of the peak. "
                    "A rung that locks 0 exits flat while still paying both "
                    "sides' costs, which is a loss dressed as breakeven."
                )
            if t.lock_hw_pct > 100:
                raise ValueError(
                    f"tier at {t.trigger_pct}% locks {t.lock_hw_pct}% -- a floor "
                    "above the high-water mark closes instantly on arrival."
                )
            if t.trigger_pct <= 0:
                raise ValueError(
                    f"trigger_pct must be above entry; got {t.trigger_pct}"
                )
        if self.weak_peak_after is not None and self.weak_peak_after < 1:
            raise ValueError("weak_peak_after must be at least one tick")
        if self.hard_timeout is not None and self.hard_timeout < 1:
            raise ValueError("hard_timeout must be at least one tick")


@dataclass(frozen=True)
class RatchetState:
    entry: float
    peak_pct: float = 0.0
    tier_index: int = -1          # -1 = phase 1, no rung armed yet
    ticks: int = 0
    closed: CloseReason | None = None

    @property
    def phase(self) -> int:
        return 1 if self.tier_index < 0 else 2


def open_position(entry: float) -> RatchetState:
    if entry <= 0:
        raise ValueError("entry must be positive")
    return RatchetState(entry=entry)


def floor_pct(ladder: Ladder, state: RatchetState) -> float:
    """The live stop, as a percentage move from entry.

    Phase 1 returns a negative number (below entry). Phase 2 returns a share of
    the peak, which the validation above guarantees is positive.
    """
    if state.tier_index < 0:
        return -ladder.max_loss_pct
    tier = ladder.tiers[state.tier_index]
    return state.peak_pct * tier.lock_hw_pct / 100.0


def tick(ladder: Ladder, state: RatchetState, value: float) -> RatchetState:
    """Advance one observation. Returns a NEW state; never mutates the input.

    Order of evaluation matters and mirrors Senpi's engine: timeout, then dead
    weight, then the floor breach, then tier advance. Checking advance first
    would let a position that spiked and collapsed within one tick arm a rung it
    never held.
    """
    if state.closed is not None:
        return state

    ticks = state.ticks + 1
    pct = (value - state.entry) / state.entry * 100.0
    peak = max(state.peak_pct, pct)
    nxt = replace(state, ticks=ticks, peak_pct=peak)

    if ladder.hard_timeout is not None and ticks >= ladder.hard_timeout:
        return replace(nxt, closed=CloseReason.HARD_TIMEOUT)

    if (
        ladder.weak_peak_after is not None
        and ticks >= ladder.weak_peak_after
        and peak < ladder.weak_peak_min_pct
        and state.tier_index < 0
    ):
        return replace(nxt, closed=CloseReason.WEAK_PEAK)

    if pct <= floor_pct(ladder, nxt):
        reason = (
            CloseReason.PHASE1_STOP if nxt.tier_index < 0 else CloseReason.TIER_BREACH
        )
        return replace(nxt, closed=reason)

    # Advance to the highest rung the PEAK has earned. Using peak rather than
    # the current value means a ratchet only ever tightens -- a pullback cannot
    # un-arm a rung that was already reached.
    index = nxt.tier_index
    for i, t in enumerate(ladder.tiers):
        if peak >= t.trigger_pct:
            index = max(index, i)
    return replace(nxt, tier_index=index)


def run(ladder: Ladder, entry: float, values: Sequence[float]) -> RatchetState:
    """Replay a whole series. Convenience for tests and back-fills."""
    state = open_position(entry)
    for v in values:
        state = tick(ladder, state, v)
        if state.closed:
            break
    return state
