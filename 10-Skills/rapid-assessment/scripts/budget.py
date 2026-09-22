"""Plan Jev requests that fit, from a measured capacity envelope.

Everything here is derived from measurements taken on 2026-09-22 against
`jev-latest` over OpenRouter, not from the vendor's documentation. The
documentation says only that a choice question takes at most 255 options; the
rest of the envelope had to be found by binary search until the API returned
`max_tokens_exceeded`.

THE MEASURED ENVELOPE

    questions   max options each   option-judgements   p50 latency
        1              255                 255            507 ms
        2              255                 510            715 ms
        4              255               1,020            730 ms
        8              255               2,040          1,806 ms
       16              159               2,544          1,551 ms
       32               79               2,528          8,897 ms

Two separate ceilings, and they bind in different places:

  1. **255 options per choice question** -- documented, hard, per question.
  2. **~2,500 option-judgements per request** -- undocumented, a TOKEN budget.
     The total is flat from 16 questions upward, which is what proves it is
     tokens rather than a count of anything.

Past that, the API returns HTTP 400 `max_tokens_exceeded`. It does not
degrade gracefully, so a planner that guesses wrong wastes a whole round trip.

THE SHAPE THAT WINS

16 questions x 159 options = 2,544 judgements in 1,551 ms -- about **1,640
option-judgements per second**. Note the trap at 32 questions: it fits almost
exactly the same total work but takes **5.7x longer** (8,897 ms). More
questions is not monotonically better, and the cliff is not where the token
budget is.

WHAT THIS CORRECTS

TypeSafe's fan-out doc says "adding more questions usually has little effect on
response time". Within the envelope that is **true and I predicted it was not** --
32 two-option questions cost 1.05x the latency of one, and per-question latency
fell to 6.4%. Outside the envelope it is false twice over: the request fails
outright, and the 32-question shape is 5.7x slower for the same work.

CAVEAT ON ABSOLUTE NUMBERS

Latency varied about 2.5x between runs on the same shapes (a 1-question,
2-option call measured 386 ms, 557 ms and 996 ms in three different runs).
Only WITHIN-run ratios are trustworthy here. Token ceilings were stable across
runs; timings were not. Re-measure before treating any millisecond figure as a
budget.
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Sequence

__all__ = [
    "MAX_OPTIONS_PER_QUESTION",
    "MEASURED_ENVELOPE",
    "SAFE_OPTION_JUDGEMENTS",
    "BudgetError",
    "RequestShape",
    "best_shape",
    "max_options_for",
    "plan_ranking",
]

# Documented by TypeSafe, and confirmed by binary search: every shape from 1 to
# 8 questions accepted exactly 255 and refused 256.
MAX_OPTIONS_PER_QUESTION = 255

# Measured: (questions, max options each, p50 ms at that shape).
MEASURED_ENVELOPE: tuple[tuple[int, int, float], ...] = (
    (1, 255, 507.0),
    (2, 255, 715.0),
    (4, 255, 730.0),
    (8, 255, 1806.0),
    (16, 159, 1551.0),
    (32, 79, 8897.0),
)

# The token ceiling expressed as total option-judgements, with headroom.
# Measured totals plateau at 2,528-2,544; option DESCRIPTIONS here were short
# (~8 tokens). Longer descriptions consume the same budget faster, so this is
# deliberately conservative -- a failed request costs a whole round trip.
SAFE_OPTION_JUDGEMENTS = 2000

# Beyond this the measured latency cliff appears: 32 questions took 5.7x longer
# than 16 for the same total work.
MAX_QUESTIONS_BEFORE_CLIFF = 16


class BudgetError(ValueError):
    """A shape that would be rejected, or is knowably a bad idea."""


@dataclass(frozen=True)
class RequestShape:
    questions: int
    options_per_question: int

    @property
    def option_judgements(self) -> int:
        return self.questions * self.options_per_question

    def validate(self) -> None:
        if self.questions < 1:
            raise BudgetError("a request needs at least one question")
        if self.options_per_question < 2:
            raise BudgetError(
                "a choice needs at least 2 options; a one-option question is a "
                "rubber stamp, not a decision"
            )
        if self.options_per_question > MAX_OPTIONS_PER_QUESTION:
            raise BudgetError(
                f"{self.options_per_question} options exceeds the documented "
                f"hard cap of {MAX_OPTIONS_PER_QUESTION} per choice question"
            )
        if self.option_judgements > SAFE_OPTION_JUDGEMENTS:
            raise BudgetError(
                f"{self.questions}x{self.options_per_question} = "
                f"{self.option_judgements} option-judgements exceeds the measured "
                f"safe budget of {SAFE_OPTION_JUDGEMENTS}. The API returns HTTP 400 "
                "max_tokens_exceeded rather than degrading, so this would waste a "
                "round trip. Split it with plan_ranking()."
            )

    def estimated_ms(self) -> float:
        """Interpolate from the measured table. Indicative only.

        Absolute latency moved ~2.5x between runs, so treat this as an ordering
        signal, not a deadline. `decision_cascade.calibrate_latency` is how you
        get a number you can budget against.
        """
        table = sorted(MEASURED_ENVELOPE, key=lambda r: r[0])
        if self.questions <= table[0][0]:
            return table[0][2]
        for (q0, _, ms0), (q1, _, ms1) in zip(table, table[1:]):
            if q0 <= self.questions <= q1:
                span = q1 - q0
                t = (self.questions - q0) / span if span else 0.0
                return ms0 + t * (ms1 - ms0)
        return table[-1][2]


def max_options_for(questions: int) -> int:
    """Largest option count per question that fits, at this question count."""
    if questions < 1:
        raise BudgetError("questions must be at least 1")
    return max(0, min(MAX_OPTIONS_PER_QUESTION, SAFE_OPTION_JUDGEMENTS // questions))


def best_shape(total_candidates: int, dimensions: int = 1) -> RequestShape:
    """The throughput-optimal shape for ranking `total_candidates`.

    `dimensions` is how many separate judgements you want about each candidate
    set (e.g. "which is most relevant" AND "which is riskiest").

    Caps questions at 16 because of the measured cliff: 32 questions fit
    essentially the same total work and took 5.7x longer.
    """
    if total_candidates < 2:
        raise BudgetError("ranking needs at least 2 candidates")
    if dimensions < 1:
        raise BudgetError("dimensions must be at least 1")
    questions = min(dimensions, MAX_QUESTIONS_BEFORE_CLIFF)
    options = min(total_candidates, max_options_for(questions))
    shape = RequestShape(questions=questions, options_per_question=options)
    shape.validate()
    return shape


def plan_ranking(
    candidates: Sequence[object], dimensions: int = 1
) -> list[list[object]]:
    """Split candidates into chunks that each fit one request.

    Returns the chunks, not the requests -- building the actual `Question`
    objects is the caller's job, because only they know the descriptions, and
    description length is what actually consumes the token budget.

    A single chunk is capped by BOTH ceilings at once: the 255 hard cap and the
    token budget divided by the number of dimensions.
    """
    if dimensions < 1:
        raise BudgetError("dimensions must be at least 1")
    n = len(candidates)
    if n < 2:
        raise BudgetError("ranking needs at least 2 candidates")

    per_chunk = min(MAX_OPTIONS_PER_QUESTION, max_options_for(dimensions))
    if per_chunk < 2:
        raise BudgetError(
            f"{dimensions} dimensions leaves only {per_chunk} options per "
            "request; ask fewer things at once"
        )
    return [list(candidates[i : i + per_chunk]) for i in range(0, n, per_chunk)]


def describe_plan(candidates: Sequence[object], dimensions: int = 1) -> str:
    chunks = plan_ranking(candidates, dimensions)
    shape = RequestShape(dimensions if dimensions <= MAX_QUESTIONS_BEFORE_CLIFF
                         else MAX_QUESTIONS_BEFORE_CLIFF, len(chunks[0]))
    total_ms = len(chunks) * shape.estimated_ms()
    return (
        f"{len(candidates)} candidates x {dimensions} dimension(s) -> "
        f"{len(chunks)} request(s) of up to {len(chunks[0])} options each; "
        f"~{total_ms:.0f}ms total (indicative -- re-measure before budgeting)"
    )


def requests_needed(candidates: int, dimensions: int = 1) -> int:
    per_chunk = min(MAX_OPTIONS_PER_QUESTION, max_options_for(dimensions))
    if per_chunk < 2:
        raise BudgetError("too many dimensions to fit any options")
    return math.ceil(candidates / per_chunk)
