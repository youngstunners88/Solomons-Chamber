"""A tiered decision cascade with an explicit break-even test.

The idea is old: try something cheap first, escalate only when the cheap answer
is not good enough. The part that is usually skipped is checking whether the
cascade actually pays, and that is what this module is built around.

THE BREAK-EVEN

A two-tier cascade costs `L1 + p * L2` on average, where `p` is the fraction of
calls that escalate. Calling the good tier directly costs `L2`. So the cascade
wins only when:

    L1 + p*L2  <  L2        <=>        p  <  1 - L1/L2

`break_even_escalation_rate()` is that formula. It is not a heuristic; it falls
out of the arithmetic, and it has a blunt consequence:

    A cheap tier that is HALF the latency of the expensive one must resolve more
    than half of all calls or it is a pessimisation -- strictly slower AND
    strictly more expensive than not having it.

`CascadeStats.verdict()` compares the measured escalation rate against that
line. This matters here because of a specific measured fact: on our x86_64 Linux
box, a CPU-local Laya (193-464 ms, upstream figures) is NOT faster than Jev over
OpenRouter (347 ms, our own measurement). Put local in front of remote on this
hardware and L1/L2 >= 1, the break-even rate goes negative, and NO escalation
rate makes it worthwhile. The cascade must be able to say that out loud rather
than quietly costing time.

WHY BUDGETS AND NOT JUST ORDERING

Every tier declares an expected latency. Before entering a tier the cascade
checks whether the remaining deadline can afford it, and abstains if not. A
cascade without deadline accounting turns a fast path into a slow one exactly
when it is under pressure, which is the worst possible time.

WHAT THIS DOES NOT DO

It does not make anything competitive in a latency race. TradeCC's edge
inventory records LATENCY_RACE as the binding constraint on 7 of 14 candidate
strategies, and defines it as decided by "physical proximity and execution
speed, not by analysis". A 10 ms decision is three to four orders of magnitude
away from a co-located path. This module buys throughput and cost, not
proximity. See SKILL.md.
"""

from __future__ import annotations

import time
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Callable, Protocol, Sequence

__all__ = [
    "Cascade",
    "CascadeError",
    "CascadeStats",
    "Decision",
    "Gate",
    "Resolution",
    "Tier",
    "break_even_escalation_rate",
]


class CascadeError(RuntimeError):
    def __init__(self, reason: str, message: str) -> None:
        super().__init__(f"[{reason}] {message}")
        self.reason = reason


class Resolution(str, Enum):
    RESOLVED = "resolved"              # a tier cleared the gate
    ESCALATED_OUT = "escalated_out"    # every tier ran, none cleared
    DEADLINE = "deadline"              # ran out of budget before a tier could run
    NO_TIER_CAPABLE = "no_tier_capable"
    ABSTAINED = "abstained"            # a tier declined and none remained


@dataclass(frozen=True)
class Gate:
    """What a decision must clear to be acted on without escalating.

    Mirrors `jev_router.ActionGate`: margin AND confidence, because margin alone
    misses a leader that wins a wide race with 35% of the mass, and confidence
    alone misses a 0.51/0.49 split.
    """

    min_margin: float
    min_confidence: float

    # 0.45 - 0.40 == 0.04999999999999999. Comparisons are inclusive within this
    # or a value sitting exactly on its threshold is refused by float noise --
    # and that refusal gets blamed on the model.
    tolerance: float = 1e-9

    def clears(self, confidence: float, margin: float) -> bool:
        return (
            confidence >= self.min_confidence - self.tolerance
            and margin >= self.min_margin - self.tolerance
        )


@dataclass(frozen=True)
class Decision:
    """What a backend returned."""

    choice: str
    probabilities: dict[str, float]
    tier: str = ""
    latency_ms: float = 0.0
    cost_usd: float = 0.0

    @property
    def confidence(self) -> float:
        return max(self.probabilities.values()) if self.probabilities else 0.0

    @property
    def margin(self) -> float:
        if len(self.probabilities) < 2:
            return self.confidence
        top_two = sorted(self.probabilities.values(), reverse=True)[:2]
        return top_two[0] - top_two[1]


class Backend(Protocol):
    def __call__(self, state: Any, question: Any) -> Decision: ...


@dataclass
class Tier:
    """One rung. `expected_latency_ms` is used for budgeting BEFORE the call.

    It must be a measured number, not a hope. An optimistic figure here makes
    the cascade enter a tier it cannot afford and blow the deadline, which is
    precisely the failure budgeting exists to prevent.
    """

    name: str
    backend: Backend
    expected_latency_ms: float
    cost_per_call_usd: float = 0.0
    can_answer: Callable[[Any, Any], bool] | None = None

    def __post_init__(self) -> None:
        if self.expected_latency_ms <= 0:
            raise ValueError(
                f"tier {self.name!r}: expected_latency_ms must be positive and "
                "measured -- budgeting against a placeholder is how a deadline "
                "gets blown"
            )
        if self.cost_per_call_usd < 0:
            raise ValueError(f"tier {self.name!r}: cost cannot be negative")


def break_even_escalation_rate(cheap_ms: float, dear_ms: float) -> float:
    """`1 - cheap/dear`. Above this escalation rate the cheap tier is a net loss.

    Returns a NEGATIVE number when the cheap tier is not actually cheaper, which
    is the honest answer: no escalation rate redeems it. Callers should treat
    any value <= 0 as "delete this tier".
    """
    if cheap_ms <= 0 or dear_ms <= 0:
        raise ValueError("latencies must be positive")
    return 1.0 - (cheap_ms / dear_ms)


@dataclass
class CascadeStats:
    """Measured behaviour. The point of the module.

    A cascade is a performance claim, and an unmeasured performance claim is
    just a layout preference.
    """

    calls: int = 0
    resolved_at: dict[str, int] = field(default_factory=dict)
    escalations_from: dict[str, int] = field(default_factory=dict)
    total_latency_ms: float = 0.0
    total_cost_usd: float = 0.0
    outcomes: dict[str, int] = field(default_factory=dict)

    def escalation_rate(self, tier: str) -> float:
        """Fraction of calls that entered `tier` and did NOT resolve there."""
        entered = self.resolved_at.get(tier, 0) + self.escalations_from.get(tier, 0)
        if entered == 0:
            return 0.0
        return self.escalations_from.get(tier, 0) / entered

    def mean_latency_ms(self) -> float:
        return self.total_latency_ms / self.calls if self.calls else 0.0

    def verdict(self, cheap: Tier, dear: Tier) -> str:
        """Is the cheap tier earning its place in front of the dear one?"""
        threshold = break_even_escalation_rate(
            cheap.expected_latency_ms, dear.expected_latency_ms
        )
        if threshold <= 0:
            return (
                f"DELETE {cheap.name!r}: at {cheap.expected_latency_ms:.0f}ms it is not "
                f"cheaper than {dear.name!r} at {dear.expected_latency_ms:.0f}ms. No "
                "escalation rate makes it pay."
            )
        entered = self.resolved_at.get(cheap.name, 0) + self.escalations_from.get(cheap.name, 0)
        if entered == 0:
            return f"NO DATA for {cheap.name!r}: it was never entered."
        rate = self.escalation_rate(cheap.name)
        if rate > threshold:
            return (
                f"PESSIMISATION: {cheap.name!r} escalates {rate:.0%} of the time but "
                f"break-even is {threshold:.0%}. It is adding latency and cost. "
                f"Either tighten what reaches it or remove it."
            )
        return (
            f"WORTH IT: {cheap.name!r} escalates {rate:.0%} against a {threshold:.0%} "
            f"break-even, over {entered} calls."
        )


@dataclass(frozen=True)
class CascadeResult:
    resolution: Resolution
    decision: Decision | None
    tiers_tried: tuple[str, ...]
    elapsed_ms: float
    cost_usd: float
    note: str = ""

    @property
    def ok(self) -> bool:
        return self.resolution is Resolution.RESOLVED


class Cascade:
    """Ordered tiers, cheapest first, with deadline accounting."""

    def __init__(
        self,
        tiers: Sequence[Tier],
        gate: Gate,
        *,
        clock: Callable[[], float] = time.monotonic,
    ) -> None:
        if not tiers:
            raise ValueError("a cascade needs at least one tier")
        names = [t.name for t in tiers]
        if len(set(names)) != len(names):
            raise ValueError(f"duplicate tier names: {names}")
        self.tiers = list(tiers)
        self.gate = gate
        self._clock = clock
        self.stats = CascadeStats()

    def decide(
        self, state: Any, question: Any, *, deadline_ms: float | None = None
    ) -> CascadeResult:
        started = self._clock()
        tried: list[str] = []
        cost = 0.0
        last: Decision | None = None
        capable_seen = False

        for i, tier in enumerate(self.tiers):
            if tier.can_answer is not None and not tier.can_answer(state, question):
                continue
            capable_seen = True

            elapsed_ms = (self._clock() - started) * 1000.0
            if deadline_ms is not None:
                remaining = deadline_ms - elapsed_ms
                if remaining < tier.expected_latency_ms:
                    # Do not start something the budget cannot finish.
                    return CascadeResult(
                        resolution=Resolution.DEADLINE,
                        decision=last,
                        tiers_tried=tuple(tried),
                        elapsed_ms=elapsed_ms,
                        cost_usd=cost,
                        note=(
                            f"{remaining:.0f}ms left, {tier.name!r} needs "
                            f"{tier.expected_latency_ms:.0f}ms"
                        ),
                    )

            tier_start = self._clock()
            decision = tier.backend(state, question)
            tier_ms = (self._clock() - tier_start) * 1000.0
            decision = Decision(
                choice=decision.choice,
                probabilities=decision.probabilities,
                tier=tier.name,
                latency_ms=tier_ms,
                cost_usd=tier.cost_per_call_usd,
            )
            tried.append(tier.name)
            cost += tier.cost_per_call_usd
            last = decision

            if self.gate.clears(decision.confidence, decision.margin):
                self._record(tier.name, resolved=True)
                return self._finish(
                    Resolution.RESOLVED, decision, tried, started, cost
                )

            self._record(tier.name, resolved=False)
            if i == len(self.tiers) - 1:
                return self._finish(
                    Resolution.ESCALATED_OUT, decision, tried, started, cost,
                    note="no tier cleared the gate; escalate to a human",
                )

        if not capable_seen:
            return self._finish(
                Resolution.NO_TIER_CAPABLE, None, tried, started, cost,
                note="no tier declared itself able to answer this question",
            )
        return self._finish(Resolution.ABSTAINED, last, tried, started, cost)

    def _record(self, tier: str, *, resolved: bool) -> None:
        bucket = self.stats.resolved_at if resolved else self.stats.escalations_from
        bucket[tier] = bucket.get(tier, 0) + 1

    def _finish(
        self,
        resolution: Resolution,
        decision: Decision | None,
        tried: list[str],
        started: float,
        cost: float,
        note: str = "",
    ) -> CascadeResult:
        elapsed = (self._clock() - started) * 1000.0
        self.stats.calls += 1
        self.stats.total_latency_ms += elapsed
        self.stats.total_cost_usd += cost
        self.stats.outcomes[resolution.value] = (
            self.stats.outcomes.get(resolution.value, 0) + 1
        )
        return CascadeResult(
            resolution=resolution,
            decision=decision,
            tiers_tried=tuple(tried),
            elapsed_ms=elapsed,
            cost_usd=cost,
            note=note,
        )

    def audit(self) -> str:
        """Break-even verdict for each adjacent tier pair."""
        lines = [
            f"calls={self.stats.calls} mean={self.stats.mean_latency_ms():.1f}ms "
            f"cost=${self.stats.total_cost_usd:.6f}"
        ]
        for outcome, n in sorted(self.stats.outcomes.items()):
            lines.append(f"  {outcome}: {n}")
        for cheap, dear in zip(self.tiers, self.tiers[1:]):
            lines.append("  " + self.stats.verdict(cheap, dear))
        return "\n".join(lines)
