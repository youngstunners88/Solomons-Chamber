"""Tests for the measured capacity envelope.

Each test names the wasted round trip it prevents. The API returns HTTP 400
`max_tokens_exceeded` rather than truncating, so every shape the planner gets
wrong costs a full request.
"""

from __future__ import annotations

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))

from budget import (  # noqa: E402
    MAX_OPTIONS_PER_QUESTION,
    MEASURED_ENVELOPE,
    SAFE_OPTION_JUDGEMENTS,
    BudgetError,
    RequestShape,
    best_shape,
    describe_plan,
    max_options_for,
    plan_ranking,
    requests_needed,
)


# ---------------- the two ceilings ----------------


def test_the_documented_255_cap_is_enforced():
    """Measured: every shape from 1 to 8 questions accepted 255 and refused 256."""
    RequestShape(1, 255).validate()
    with pytest.raises(BudgetError, match="hard cap"):
        RequestShape(1, 256).validate()


def test_the_token_budget_is_enforced_separately_from_the_option_cap():
    """16x159 is legal on options (159 < 255) but was found by binary search
    to be the token ceiling. A planner that only knew the 255 cap would send
    16x255 and get a 400."""
    with pytest.raises(BudgetError, match="max_tokens_exceeded"):
        RequestShape(16, 255).validate()


def test_a_shape_inside_both_ceilings_passes():
    RequestShape(8, 250).validate()


def test_a_one_option_question_is_refused():
    with pytest.raises(BudgetError, match="rubber stamp"):
        RequestShape(1, 1).validate()


def test_zero_questions_is_refused():
    with pytest.raises(BudgetError):
        RequestShape(0, 10).validate()


# ---------------- max_options_for ----------------


def test_few_questions_are_capped_by_the_option_limit_not_tokens():
    """At 1-8 questions the binding constraint is the documented 255."""
    for q in (1, 2, 4):
        assert max_options_for(q) == MAX_OPTIONS_PER_QUESTION


def test_many_questions_are_capped_by_tokens_not_the_option_limit():
    """At 16 the token budget bites first -- which is exactly what the
    measurement showed (159 accepted, 160+ refused)."""
    assert max_options_for(16) < MAX_OPTIONS_PER_QUESTION
    assert max_options_for(16) == SAFE_OPTION_JUDGEMENTS // 16


def test_max_options_shrinks_monotonically_as_questions_grow():
    values = [max_options_for(q) for q in (1, 2, 4, 8, 16, 32)]
    assert values == sorted(values, reverse=True)


def test_max_options_for_rejects_nonsense():
    with pytest.raises(BudgetError):
        max_options_for(0)


# ---------------- best_shape ----------------


def test_best_shape_caps_questions_at_the_measured_cliff():
    """32 questions fit the same total work as 16 and took 5.7x longer
    (8,897ms vs 1,551ms). Asking for 32 dimensions must not produce a
    32-question request."""
    assert best_shape(1000, dimensions=32).questions == 16


def test_best_shape_never_offers_more_options_than_candidates():
    shape = best_shape(10, dimensions=1)
    assert shape.options_per_question == 10


def test_best_shape_result_always_validates():
    for candidates in (2, 50, 255, 1000):
        for dims in (1, 2, 8, 16, 40):
            best_shape(candidates, dims).validate()


def test_best_shape_refuses_a_degenerate_ranking():
    with pytest.raises(BudgetError, match="at least 2 candidates"):
        best_shape(1)


# ---------------- plan_ranking ----------------


def test_a_small_set_fits_one_request():
    assert len(plan_ranking(list(range(100)))) == 1


def test_a_large_set_is_split_and_nothing_is_lost():
    candidates = list(range(1000))
    chunks = plan_ranking(candidates)
    assert sum(len(c) for c in chunks) == 1000
    assert [x for c in chunks for x in c] == candidates


def test_no_chunk_exceeds_either_ceiling():
    for dims in (1, 2, 4, 8, 16):
        for chunk in plan_ranking(list(range(2000)), dimensions=dims):
            RequestShape(min(dims, 16), len(chunk)).validate()


def test_more_dimensions_means_smaller_chunks():
    """Each extra dimension multiplies the token cost of every option."""
    one = len(plan_ranking(list(range(2000)), dimensions=1)[0])
    many = len(plan_ranking(list(range(2000)), dimensions=8)[0])
    assert many < one


def test_asking_too_many_dimensions_at_once_is_refused_with_advice():
    with pytest.raises(BudgetError, match="ask fewer things at once"):
        plan_ranking(list(range(100)), dimensions=1500)


def test_plan_refuses_a_single_candidate():
    with pytest.raises(BudgetError, match="at least 2"):
        plan_ranking([1])


def test_requests_needed_matches_the_plan():
    for n in (2, 100, 255, 256, 1000):
        assert requests_needed(n) == len(plan_ranking(list(range(n))))


# ---------------- the envelope table itself ----------------


def test_the_envelope_records_the_latency_cliff():
    """This is the surprising measurement and it should not be quietly edited
    away: 32 questions is far slower than 16 for the same total work."""
    table = {q: ms for q, _, ms in MEASURED_ENVELOPE}
    assert table[32] > 5 * table[16]


def test_the_envelope_shows_the_total_plateau():
    """Totals flat from 16 upward is what proves the ceiling is tokens rather
    than a count of questions or options."""
    totals = {q: q * k for q, k, _ in MEASURED_ENVELOPE}
    assert abs(totals[16] - totals[32]) / totals[16] < 0.05


def test_the_safe_budget_sits_below_every_measured_total_at_the_ceiling():
    """Headroom is deliberate: measured option descriptions were ~8 tokens, and
    longer ones consume the budget faster."""
    ceiling_totals = [q * k for q, k, _ in MEASURED_ENVELOPE if q >= 16]
    assert SAFE_OPTION_JUDGEMENTS < min(ceiling_totals)


def test_estimated_ms_interpolates_within_the_table():
    mid = RequestShape(3, 100).estimated_ms()
    assert 715.0 <= mid <= 730.0


def test_estimated_ms_is_clamped_outside_the_table():
    assert RequestShape(1, 2).estimated_ms() == 507.0
    assert RequestShape(64, 2).estimated_ms() == 8897.0


def test_describe_plan_mentions_that_the_timing_is_indicative():
    """Absolute latency moved ~2.5x between runs. Anyone reading a number out
    of this should see the warning attached to it."""
    assert "re-measure" in describe_plan(list(range(500)))
