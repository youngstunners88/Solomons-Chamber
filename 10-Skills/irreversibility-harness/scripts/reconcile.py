"""Absence detection: find what is missing, not what is wrong.

The insight is stated exactly once in Senpi's docs, and it is the most valuable
sentence in the repository:

  "An open position that is *missing* from that list is UNPROTECTED. That is the
   whole trap: an unprotected position shows up as an *absence*, not a warning,
   so you have to look for what's *not* there."

Every monitoring system reports the rows it has. Nothing reports the rows it
should have had. So the check that matters is a DIFF between an authoritative
list of things that need covering and the list of things actually covered.

This vault has hit the same class of failure twice already, in domains nowhere
near trading:

  * Five phantom git submodules broke `clone --recursive` for five months. No
    error was ever raised in normal use; the directories were simply empty.
  * The CI workflow here carries a step that FAILS when zero test suites are
    discovered, because a green tick on nothing collected reports "tests pass"
    while testing nothing.

Both are absences. `vacuous` below is the generalisation of the second one: a
reconciliation over an empty expected set trivially passes, and a trivial pass
is the most dangerous output this module can produce.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Callable, Iterable, Sequence

__all__ = ["Coverage", "reconcile"]


@dataclass(frozen=True)
class Coverage:
    """The result of a diff between what needs covering and what is covered."""

    uncovered: tuple[str, ...]   # expected, absent from actual -- THE failure
    degraded: tuple[str, ...]    # present but failed the health predicate
    orphaned: tuple[str, ...]    # covered but nothing expects it
    healthy: tuple[str, ...]
    vacuous: bool                # nothing was expected; the pass means nothing
    notes: dict[str, str] = field(default_factory=dict)

    @property
    def ok(self) -> bool:
        """True only on a pass that actually checked something.

        `vacuous` forces False deliberately. An empty expected set usually means
        the query that built it was wrong, not that there is nothing to protect,
        and returning True there is how a broken check goes unnoticed for months.
        """
        return not self.vacuous and not self.uncovered and not self.degraded

    def summary(self) -> str:
        if self.vacuous:
            return (
                "VACUOUS: nothing was expected, so this check proves nothing. "
                "Verify the source of the expected set before trusting a pass."
            )
        if self.ok:
            return f"OK: {len(self.healthy)} covered, nothing missing."
        bits = []
        if self.uncovered:
            bits.append(f"UNCOVERED ({len(self.uncovered)}): {', '.join(self.uncovered)}")
        if self.degraded:
            bits.append(f"DEGRADED ({len(self.degraded)}): {', '.join(self.degraded)}")
        if self.orphaned:
            bits.append(f"orphaned ({len(self.orphaned)}): {', '.join(self.orphaned)}")
        return " | ".join(bits)


def reconcile(
    expected: Iterable[Any],
    actual: Iterable[Any],
    *,
    key: Callable[[Any], str] = str,
    healthy: Callable[[Any], bool] | None = None,
    why_unhealthy: Callable[[Any], str] | None = None,
) -> Coverage:
    """Diff an authoritative set against an observed set.

    `expected`  what MUST be covered -- open positions, required checks, hosts
                that should report in. Build this from the source of truth, not
                from the same system that produced `actual`; a diff of a list
                against itself always passes.
    `actual`    what IS covered, as observed.
    `key`       identity. Both sides are keyed through it so dissimilar record
                shapes can be compared.
    `healthy`   optional per-item predicate over the ACTUAL record. Senpi's
                version is "does this tracked position have a floorPrice" -- an
                entry that exists but carries no stop is present and useless.
    `why_unhealthy` optional explanation, recorded per key in `notes`.

    Duplicate keys on either side collapse to one entry; the last record wins
    for health purposes.
    """
    exp: dict[str, Any] = {key(e): e for e in expected}
    act: dict[str, Any] = {key(a): a for a in actual}

    uncovered = sorted(set(exp) - set(act))
    orphaned = sorted(set(act) - set(exp))
    present = sorted(set(exp) & set(act))

    degraded: list[str] = []
    healthy_keys: list[str] = []
    notes: dict[str, str] = {}
    for k in present:
        if healthy is not None and not healthy(act[k]):
            degraded.append(k)
            if why_unhealthy is not None:
                notes[k] = why_unhealthy(act[k])
        else:
            healthy_keys.append(k)

    return Coverage(
        uncovered=tuple(uncovered),
        degraded=tuple(degraded),
        orphaned=tuple(orphaned),
        healthy=tuple(healthy_keys),
        vacuous=not exp,
        notes=notes,
    )


def require_covered(coverage: Coverage, context: str = "") -> None:
    """Raise unless the reconciliation passed non-vacuously.

    For the top of a deploy script or the end of a CI job, where the right
    response to a gap is to stop rather than to print.
    """
    if coverage.ok:
        return
    where = f" ({context})" if context else ""
    raise AssertionError(f"coverage check failed{where}: {coverage.summary()}")
