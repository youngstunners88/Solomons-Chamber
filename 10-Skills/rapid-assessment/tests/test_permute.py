import sys
from dataclasses import dataclass
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))

from budget import BudgetError, SAFE_OPTION_JUDGEMENTS
from permute import (
    DEFAULT_PERMUTATIONS,
    aggregate,
    max_permutations_for,
    orderings,
)


@dataclass
class FakeAnswer:
    choice: str
    probabilities: dict


# --- orderings -------------------------------------------------------------

def test_first_ordering_is_the_callers_own():
    """m=1 must be exactly the call you would have made anyway."""
    labels = ["a", "b", "c", "d"]
    assert orderings(labels, 1) == [("a", "b", "c", "d")]
    assert orderings(labels, 5, seed=1)[0] == ("a", "b", "c", "d")


def test_orderings_are_distinct():
    got = orderings(["a", "b", "c", "d", "e"], 6, seed=7)
    assert len(got) == 6
    assert len(set(got)) == 6


def test_orderings_are_capped_at_factorial_not_padded():
    """3 options have 6 orderings; asking for 20 must not loop forever."""
    got = orderings(["a", "b", "c"], 20)
    assert len(got) == 6


def test_two_options_have_exactly_two_orderings():
    assert len(orderings(["a", "b"], 10)) == 2


def test_seed_is_reproducible_and_different_seeds_differ():
    a = orderings(list("abcdefgh"), 6, seed=3)
    assert a == orderings(list("abcdefgh"), 6, seed=3)
    assert a != orderings(list("abcdefgh"), 6, seed=4)


def test_orderings_refuses_a_batch_that_would_400():
    """The constraint pijev does not model: M x width against the token ceiling."""
    width = 100
    fits = max_permutations_for(width)
    labels = [f"o{i}" for i in range(width)]
    orderings(labels, fits, seed=0)  # exactly at the ceiling is allowed
    with pytest.raises(BudgetError, match="safe budget"):
        orderings(labels, fits + 1, seed=0)


def test_max_permutations_respects_the_measured_ceiling():
    for width in (5, 25, 100, 255):
        assert max_permutations_for(width) * width <= SAFE_OPTION_JUDGEMENTS


def test_default_permutations_fit_at_the_widths_we_measured():
    for width in (5, 25):
        assert DEFAULT_PERMUTATIONS <= max_permutations_for(width)


def test_default_permutations_do_NOT_fit_at_maximum_width():
    """255 options x 6 orderings = 1,530 -- fits. x 8 (pijev's default) = 2,040 -- does not.

    Recorded as a test because it is the exact trap: adopting pijev's default
    budget at our maximum width would exceed the measured token ceiling.
    """
    assert DEFAULT_PERMUTATIONS * 255 <= SAFE_OPTION_JUDGEMENTS
    assert 8 * 255 > SAFE_OPTION_JUDGEMENTS
    assert max_permutations_for(255) < 8


def test_orderings_rejects_duplicate_labels():
    with pytest.raises(BudgetError, match="duplicate"):
        orderings(["a", "a", "b"], 2)


def test_orderings_rejects_a_single_option():
    with pytest.raises(BudgetError, match="at least 2"):
        orderings(["only"], 2)


# --- aggregate -------------------------------------------------------------

def test_averages_label_aligned_not_position_aligned():
    """The whole point: same labels, different order, must still line up."""
    answers = [
        FakeAnswer("a", {"a": 0.6, "b": 0.3, "c": 0.1}),
        FakeAnswer("a", {"c": 0.1, "b": 0.3, "a": 0.6}),
    ]
    got = aggregate(answers, ["a", "b", "c"])
    assert got.choice == "a"
    assert got.probabilities["a"] == pytest.approx(0.6)
    assert got.probabilities["c"] == pytest.approx(0.1)


def test_averaging_can_overturn_a_majority_of_picks():
    """Two weak votes for 'a' lose to one strong vote for 'b'.

    This is the behaviour change permutation averaging actually makes, and it
    is not a vote count. Worth a test precisely because it is surprising.
    """
    answers = [
        FakeAnswer("a", {"a": 0.40, "b": 0.35, "c": 0.25}),
        FakeAnswer("a", {"a": 0.40, "b": 0.35, "c": 0.25}),
        FakeAnswer("b", {"a": 0.05, "b": 0.90, "c": 0.05}),
    ]
    got = aggregate(answers, ["a", "b", "c"])
    assert got.picks.count("a") == 2
    assert got.choice == "b"
    assert got.flipped is True


def test_flipped_is_false_and_stable_true_when_every_ordering_agrees():
    answers = [
        FakeAnswer("a", {"a": 0.7, "b": 0.3}),
        FakeAnswer("a", {"a": 0.6, "b": 0.4}),
    ]
    got = aggregate(answers, ["a", "b"])
    assert got.flipped is False
    assert got.stable is True
    assert got.spread == pytest.approx(0.1)


def test_spread_reports_the_disagreement_it_absorbed():
    """Averaging hides the wobble; `spread` is how it stays visible."""
    answers = [
        FakeAnswer("a", {"a": 0.9, "b": 0.1}),
        FakeAnswer("a", {"a": 0.5, "b": 0.5}),
    ]
    got = aggregate(answers, ["a", "b"])
    assert got.spread == pytest.approx(0.4)
    assert got.mean_confidence == pytest.approx(0.7)


def test_mean_confidence_is_the_winners_mean_probability():
    answers = [
        FakeAnswer("a", {"a": 0.8, "b": 0.2}),
        FakeAnswer("a", {"a": 0.6, "b": 0.4}),
    ]
    got = aggregate(answers, ["a", "b"])
    assert got.mean_confidence == pytest.approx(got.probabilities["a"])
    assert got.mean_confidence == pytest.approx(0.7)


def test_probabilities_are_renormalised_per_ordering_before_averaging():
    """Jev's mass sums to 1 only within tolerance.

    Without renormalising, the ordering with the most mass would be weighted
    highest -- a silent bias toward whichever ordering the model was sloppiest on.
    """
    answers = [
        FakeAnswer("a", {"a": 0.6, "b": 0.4}),      # mass 1.0
        FakeAnswer("a", {"a": 1.2, "b": 0.8}),      # same SHAPE, mass 2.0
    ]
    got = aggregate(answers, ["a", "b"])
    assert got.probabilities["a"] == pytest.approx(0.6)
    assert sum(got.probabilities.values()) == pytest.approx(1.0)


def test_aggregate_output_is_a_distribution():
    answers = [
        FakeAnswer("a", {"a": 0.5, "b": 0.3, "c": 0.2}),
        FakeAnswer("b", {"a": 0.2, "b": 0.6, "c": 0.2}),
    ]
    got = aggregate(answers, ["a", "b", "c"])
    assert sum(got.probabilities.values()) == pytest.approx(1.0)


def test_margin_is_top_minus_runner_up_of_the_MEANS():
    answers = [
        FakeAnswer("a", {"a": 0.5, "b": 0.3, "c": 0.2}),
        FakeAnswer("a", {"a": 0.5, "b": 0.3, "c": 0.2}),
    ]
    got = aggregate(answers, ["a", "b", "c"])
    assert got.margin == pytest.approx(0.2)


def test_single_ordering_reduces_to_the_plain_answer():
    """Adopting this at m=1 must be a no-op, or adoption is not safe."""
    answers = [FakeAnswer("b", {"a": 0.3, "b": 0.7})]
    got = aggregate(answers, ["a", "b"])
    assert got.choice == "b"
    assert got.probabilities == pytest.approx({"a": 0.3, "b": 0.7})
    assert got.flipped is False
    assert got.spread == pytest.approx(0.0)


def test_aggregate_refuses_a_mismatched_option_set():
    """Label alignment IS the mechanism; a mismatch cannot be papered over."""
    answers = [
        FakeAnswer("a", {"a": 0.6, "b": 0.4}),
        FakeAnswer("a", {"a": 0.6, "z": 0.4}),
    ]
    with pytest.raises(BudgetError, match="aligning by label"):
        aggregate(answers, ["a", "b"])


def test_aggregate_refuses_zero_mass():
    with pytest.raises(BudgetError, match="zero total probability"):
        aggregate([FakeAnswer("a", {"a": 0.0, "b": 0.0})], ["a", "b"])


def test_aggregate_refuses_an_empty_batch():
    with pytest.raises(BudgetError, match="nothing to aggregate"):
        aggregate([], ["a", "b"])
