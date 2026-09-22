"""Permutation averaging for Jev choices, sized to OUR measured envelope.

WHY THIS EXISTS

pijev (TypeLLM, Apache-2.0) showed that Jev's probabilities move when you
reorder the options. Its own README is careful about what that does and does
not prove: "The live examples demonstrate probability differences, not accuracy
or calibration gains." Its headline example changes the winner's probability by
20pp while the winner itself stays put.

So it was worth measuring on our own cases, at our own widths, before adopting.
Measured 2026-09-22, 14 TradeCC intake cases with recorded answers, 6 orderings
each, all six in one request (168 answers total):

    width   argmax flips   canonical acc   averaged acc   prob spread (mean/max)
        5      5/14 (36%)         85.7%          92.9%          0.186 / 0.310
       25      4/14 (29%)         92.9%          92.9%          0.170 / 0.340

PRE-REGISTERED, 2 of 3 FALSIFIED:
  P1 argmax flips in >=20% of cases at width 25.   HELD (29%).
  P2 averaging beats canonical by >=5pts at w25.   FALSIFIED -- identical, +0.0.
  P3 recorded answer's probability spans >=20pp.   FALSIFIED -- 0.17 mean.

WHAT THIS BUYS, STATED HONESTLY

NOT accuracy. At width 25 averaging changed nothing (92.9% either way). At
width 5 it gained 7.1 points, but that is ONE case out of fourteen and is not
evidence of anything at that sample size. Do not sell this as an accuracy win.

What it buys is REPRODUCIBILITY. On 29% of cases the answer we ship depends on
the arbitrary order we happened to list the options in. That is a defect
whether or not the flipped answers are wrong: the same question, same evidence
and same model returns a different verdict because of a dict literal's
ordering. Averaging removes the dependence on a choice nobody made deliberately.

That matters most where an answer is recorded and scored later. The decision
journal's calibration reads `confidence`; a confidence that moves 17pp on
option order is 17pp of noise in every Brier score computed from it.

COST: essentially nothing inside the envelope. Six orderings of 25 options in
ONE request measured 496ms, against ~507ms for a single 255-option request.
The batching envelope already paid for this.

TWO THINGS TO KNOW BEFORE USING IT

1. `mean_confidence` is NOT Jev's native confidence. It is the winning label's
   mean probability. pijev has the same caveat and it is easy to miss. If you
   record it in the decision journal, record it as the same KIND of number
   every time -- do not mix averaged and single-order confidences in one
   calibration bucket, or the bucket measures the mixture, not the model.

2. Averaging takes argmax of the means and discards Jev's own `choice` field.
   Those normally agree. In 168 measured answers they agreed 168 times -- but
   the very first run of this experiment hit one answer where Jev's `choice`
   was NOT its own most probable option, at width 25. Once in roughly 250
   observed answers, not zero. `jev_client._validate` rejects that case
   outright, which is the right production behaviour; here it means argmax and
   `choice` are not interchangeable, just usually equal.
"""
from __future__ import annotations

import random
import statistics
from dataclasses import dataclass
from typing import Any, Mapping, Sequence

from budget import MAX_OPTIONS_PER_QUESTION, SAFE_OPTION_JUDGEMENTS, BudgetError

__all__ = ["PermutedChoice", "orderings", "max_permutations_for", "aggregate"]

# pijev's default is 8. Ours is 6 because 6 is what was actually measured here,
# and because M interacts with our token ceiling in a way pijev's 720-question
# cap does not express: M x width must stay under SAFE_OPTION_JUDGEMENTS.
DEFAULT_PERMUTATIONS = 6


def max_permutations_for(width: int) -> int:
    """How many orderings of `width` options fit in ONE request.

    This is the constraint pijev does not model. Its cap is 720 expanded
    questions, which at any useful width is far beyond the ~2,500
    option-judgement token ceiling measured in `budget.py` -- a 720-question
    request would return HTTP 400 max_tokens_exceeded, not a degraded answer.
    """
    if width < 2:
        raise BudgetError("a choice needs at least 2 options")
    if width > MAX_OPTIONS_PER_QUESTION:
        raise BudgetError(
            f"{width} options exceeds the hard cap of {MAX_OPTIONS_PER_QUESTION}"
        )
    return max(0, SAFE_OPTION_JUDGEMENTS // width)


def orderings(
    labels: Sequence[str], m: int = DEFAULT_PERMUTATIONS, *, seed: int | None = None
) -> list[tuple[str, ...]]:
    """`m` distinct orderings, the FIRST of which is the caller's own order.

    Keeping the canonical order as ordering 0 means a run with m=1 is exactly
    the call you would have made anyway, so adopting this cannot silently
    change behaviour at the bottom of the range.
    """
    if m < 1:
        raise BudgetError("need at least one ordering")
    width = len(labels)
    if width < 2:
        raise BudgetError("a choice needs at least 2 options")
    if len(set(labels)) != width:
        raise BudgetError("duplicate option labels")

    fits = max_permutations_for(width)
    if m > fits:
        raise BudgetError(
            f"{m} orderings x {width} options = {m * width} option-judgements "
            f"exceeds the measured safe budget of {SAFE_OPTION_JUDGEMENTS}. "
            f"At this width at most {fits} orderings fit in one request."
        )

    total = 1
    for i in range(2, width + 1):
        total *= i
        if total >= m:
            break
    m = min(m, total)

    rng = random.Random(seed)
    seen: dict[tuple[str, ...], None] = {tuple(labels): None}
    while len(seen) < m:
        shuffled = list(labels)
        rng.shuffle(shuffled)
        seen[tuple(shuffled)] = None
    return list(seen)


@dataclass(frozen=True)
class PermutedChoice:
    """An aggregate over orderings, carrying the disagreement it absorbed."""

    choice: str
    probabilities: dict[str, float]
    mean_confidence: float
    orderings: int
    flipped: bool                  # the orderings did not all agree
    picks: tuple[str, ...]         # each ordering's own pick, in order
    spread: float                  # max-min probability of the winning label

    @property
    def margin(self) -> float:
        ranked = sorted(self.probabilities.values(), reverse=True)
        return ranked[0] - ranked[1] if len(ranked) > 1 else ranked[0]

    @property
    def stable(self) -> bool:
        """Every ordering reached the same verdict.

        An unstable answer is not necessarily wrong -- measured accuracy was
        identical either way -- but it IS one whose verdict depended on the
        option order. Surface it rather than averaging it out of sight.
        """
        return not self.flipped


def aggregate(answers: Sequence[Any], labels: Sequence[str]) -> PermutedChoice:
    """Label-align and average. `answers` are one per ordering, same question.

    Each answer needs `.choice` and `.probabilities` -- `jev_client.Answer`
    satisfies this, as does a plain tuple-free stand-in in tests.

    Probabilities are renormalised per ordering before averaging, because Jev's
    mass sums to 1 only within a tolerance and an un-normalised average
    silently weights the sloppiest ordering highest.
    """
    if not answers:
        raise BudgetError("nothing to aggregate")
    labels = list(labels)
    if len(set(labels)) != len(labels):
        raise BudgetError("duplicate option labels")

    rows: list[dict[str, float]] = []
    for a in answers:
        probs = dict(a.probabilities)
        if set(probs) != set(labels):
            raise BudgetError(
                f"an ordering returned {sorted(probs)}, expected {sorted(labels)}; "
                "aligning by label is the whole mechanism and it cannot proceed "
                "on a mismatched option set"
            )
        mass = sum(probs.values())
        if mass <= 0:
            raise BudgetError("an ordering returned zero total probability mass")
        rows.append({lab: probs[lab] / mass for lab in labels})

    means = {lab: statistics.fmean(row[lab] for row in rows) for lab in labels}
    winner = max(labels, key=means.__getitem__)
    picks = tuple(a.choice for a in answers)
    winner_probs = [row[winner] for row in rows]
    return PermutedChoice(
        choice=winner,
        probabilities=means,
        mean_confidence=means[winner],
        orderings=len(rows),
        flipped=len(set(picks)) > 1,
        picks=picks,
        spread=max(winner_probs) - min(winner_probs),
    )
