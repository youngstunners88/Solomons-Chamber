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


# --- ask_stable: the round trip ------------------------------------------

@dataclass
class FakeQuestion:
    name: str
    criteria: dict
    instructions: dict


@dataclass
class FakeResult:
    answers: dict


class FakeAsk:
    """Records what was sent, and answers with a per-ORDER-dependent bias.

    The bias is the point: it returns a higher probability for whichever label
    happens to be listed FIRST. That is a caricature of the real order
    sensitivity measured on 2026-09-22, and it makes the averaging observable.
    """

    def __init__(self):
        self.calls = []

    def __call__(self, state, questions, **kwargs):
        self.calls.append((state, questions, kwargs))
        answers = {}
        for q in questions:
            labels = list(q.criteria)
            first = labels[0]
            n = len(labels)
            bonus = 0.30
            rest = (1.0 - bonus) / n
            probs = {lab: rest + (bonus if lab == first else 0.0) for lab in labels}
            answers[q.name] = FakeAnswer(max(probs, key=probs.__getitem__), probs)
        return FakeResult(answers)


def _stable(**kw):
    from permute import ask_stable
    ask = FakeAsk()
    q = FakeQuestion("cause", {"a": "A", "b": "B", "c": "C"}, {"task": "pick"})
    got = ask_stable({"s": 1}, q, ask=ask, question_cls=FakeQuestion, **kw)
    return got, ask


def test_ask_stable_sends_exactly_one_request():
    """Batching is what makes this affordable; N requests would not be."""
    _, ask = _stable(m=6)
    assert len(ask.calls) == 1


def test_ask_stable_sends_one_question_per_ordering():
    _, ask = _stable(m=6)
    _, questions, _ = ask.calls[0]
    assert len(questions) == 6
    assert len({q.name for q in questions}) == 6


def test_ask_stable_sends_every_ordering_with_the_same_option_set():
    _, ask = _stable(m=6)
    _, questions, _ = ask.calls[0]
    assert all(set(q.criteria) == {"a", "b", "c"} for q in questions)
    # ...and they are genuinely different ORDERS, not the same dict six times.
    assert len({tuple(q.criteria) for q in questions}) == 6


def test_ask_stable_shares_one_state_across_orderings():
    _, ask = _stable(m=6)
    state, _, _ = ask.calls[0]
    assert state == {"s": 1}


def test_ask_stable_carries_instructions_to_every_ordering():
    _, ask = _stable(m=4)
    _, questions, _ = ask.calls[0]
    assert all(q.instructions == {"task": "pick"} for q in questions)


def test_ask_stable_detects_the_flip_a_first_position_bias_creates():
    """With a first-position bias and all 6 orderings, every label wins twice."""
    got, _ = _stable(m=6)
    assert got.flipped is True
    assert got.orderings == 6
    # Averaging over all orderings cancels the bias exactly.
    assert got.probabilities["a"] == pytest.approx(got.probabilities["b"])
    assert got.probabilities["c"] == pytest.approx(got.probabilities["a"])


def test_ask_stable_at_m1_is_the_canonical_single_call():
    got, ask = _stable(m=1)
    _, questions, _ = ask.calls[0]
    assert len(questions) == 1
    assert tuple(questions[0].criteria) == ("a", "b", "c")
    assert got.choice == "a"          # the caller's own first option, unbiased
    assert got.flipped is False


def test_ask_stable_forwards_kwargs_to_ask():
    from permute import ask_stable
    ask = FakeAsk()
    q = FakeQuestion("cause", {"a": "A", "b": "B"}, {})
    ask_stable({}, q, m=2, ask=ask, question_cls=FakeQuestion, timeout=99)
    assert ask.calls[0][2]["timeout"] == 99


def test_ask_stable_returns_PermutedChoice_not_Answer():
    """The two carry different KINDS of number and must not be interchangeable.

    `Answer.confidence` is Jev's own confidence; `mean_confidence` is the
    winner's mean probability. A shared type invites mixing them in one
    calibration bucket, which measures the mixture rather than the model.
    """
    from permute import PermutedChoice
    got, _ = _stable(m=2)
    assert isinstance(got, PermutedChoice)
    assert not hasattr(got, "confidence")


def test_ask_stable_refuses_zero_orderings():
    with pytest.raises(BudgetError):
        _stable(m=0)


def test_ask_stable_refuses_a_batch_over_the_token_ceiling():
    from permute import ask_stable
    wide = {f"o{i}": "x" for i in range(200)}
    q = FakeQuestion("q", wide, {})
    with pytest.raises(BudgetError, match="safe budget"):
        ask_stable({}, q, m=11, ask=FakeAsk(), question_cls=FakeQuestion)


# --- pass-through questions ----------------------------------------------

def test_extra_questions_ride_the_same_request():
    """A boolean has no option order to vary, so permuting it is meaningless.

    It still belongs in the SAME request -- one round trip is the entire cost
    argument for permutation averaging, and a second call would spend it.
    """
    from permute import ask_stable
    ask = FakeAsk()
    q = FakeQuestion("cause", {"a": "A", "b": "B"}, {})
    extra = [FakeQuestion("is_blocked", {"yes": "Y", "no": "N"}, {})]
    got = ask_stable({}, q, m=2, extra=extra, ask=ask, question_cls=FakeQuestion)
    assert len(ask.calls) == 1
    _, questions, _ = ask.calls[0]
    assert len(questions) == 3          # 2 orderings + 1 pass-through
    assert "is_blocked" in got.extra


def test_extra_questions_are_NOT_permuted():
    from permute import ask_stable
    ask = FakeAsk()
    q = FakeQuestion("cause", {"a": "A", "b": "B"}, {})
    extra = [FakeQuestion("is_blocked", {"yes": "Y", "no": "N"}, {})]
    ask_stable({}, q, m=2, extra=extra, ask=ask, question_cls=FakeQuestion)
    _, questions, _ = ask.calls[0]
    assert sum(1 for x in questions if x.name == "is_blocked") == 1


def test_extra_is_empty_when_none_passed():
    got, _ = _stable(m=2)
    assert got.extra == {}


def test_extra_name_colliding_with_a_generated_ordering_is_refused():
    """Generated names are derived from the question name; a collision would
    silently overwrite an ordering's answer and skew the mean."""
    from permute import ask_stable
    q = FakeQuestion("cause", {"a": "A", "b": "B"}, {})
    clash = [FakeQuestion("cause__ord0", {"yes": "Y", "no": "N"}, {})]
    with pytest.raises(BudgetError, match="collides"):
        ask_stable({}, q, m=2, extra=clash, ask=FakeAsk(), question_cls=FakeQuestion)
