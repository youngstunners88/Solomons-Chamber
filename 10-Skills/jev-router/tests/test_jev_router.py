"""What the router must never get wrong.

None of these touch the network. The value of a routing layer is entirely in
its refusals -- an answer outside the offered set, a tie acted on as though it
were a decision, a CLAUDE-lane task dispatched automatically -- so those are
what is tested. The live behaviour that cannot be asserted offline is recorded
in `references/measured-behaviour.md` instead, with its timings and its one
documented wrong answer.
"""

from __future__ import annotations

import sys
from pathlib import Path

import pytest

SCRIPTS = Path(__file__).resolve().parents[1] / "scripts"
sys.path.insert(0, str(SCRIPTS))

import jev_client  # noqa: E402
import router  # noqa: E402


def make_answer(probabilities: dict[str, float], choice: str, confidence: float = 0.9):
    return {"choice": choice, "confidence": confidence, "probabilities": probabilities}


# --- the closed option set is the whole point ------------------------------


def test_an_answer_outside_the_offered_set_is_rejected() -> None:
    """If Jev could return anything, there would be no reason to use it over a
    chat model. An unoffered choice is a contract break, not a surprise."""
    with pytest.raises(jev_client.JevInvalidAnswer, match="never offered"):
        jev_client._validate("lane", make_answer({"A": 0.5, "B": 0.5}, "C"), {"A", "B"})


def test_missing_probability_mass_is_rejected() -> None:
    with pytest.raises(jev_client.JevInvalidAnswer, match="probabilities cover"):
        jev_client._validate("lane", make_answer({"A": 1.0}, "A"), {"A", "B"})


def test_probabilities_that_do_not_sum_to_one_are_rejected() -> None:
    with pytest.raises(jev_client.JevInvalidAnswer, match="sum to"):
        jev_client._validate("lane", make_answer({"A": 0.2, "B": 0.2}, "A"), {"A", "B"})


def test_a_choice_that_is_not_the_argmax_is_rejected() -> None:
    """Self-inconsistency in the response is the one case most likely to be
    silently coerced into something plausible downstream."""
    with pytest.raises(jev_client.JevInvalidAnswer, match="not the most probable"):
        jev_client._validate("lane", make_answer({"A": 0.3, "B": 0.7}, "A"), {"A", "B"})


def test_a_boolean_is_not_a_probability() -> None:
    """bool is a subclass of int in Python; True would otherwise pass a naive
    numeric check and compare equal to 1.0."""
    with pytest.raises(jev_client.JevInvalidAnswer, match="finite number"):
        jev_client._validate("lane", make_answer({"A": True, "B": 0.0}, "A"), {"A", "B"})


def test_a_well_formed_answer_survives_and_reports_its_margin() -> None:
    answer = jev_client._validate("lane", make_answer({"A": 0.7, "B": 0.2, "C": 0.1}, "A"), {"A", "B", "C"})
    assert answer.choice == "A"
    assert answer.margin == pytest.approx(0.5)


def test_margin_separates_two_answers_with_the_same_top_probability() -> None:
    """0.51/0.49 and 0.51/0.05 report the same confidence and mean very
    different things. This is why the router keys off margin, not confidence."""
    tight = jev_client._validate("q", make_answer({"A": 0.51, "B": 0.49}, "A"), {"A", "B"})
    clear = jev_client._validate("q", make_answer({"A": 0.51, "B": 0.05, "C": 0.44}, "A"), {"A", "B", "C"})
    assert tight.margin == pytest.approx(0.02)
    assert clear.margin == pytest.approx(0.07)


# --- questions --------------------------------------------------------------


def test_a_single_option_question_is_refused() -> None:
    """A one-option 'choice' is a rubber stamp that returns 1.0 every time and
    looks like agreement."""
    with pytest.raises(ValueError, match="rubber stamp"):
        jev_client.Question("lane", {"ONLY": "the only option"}).to_payload()


def test_every_question_carries_the_untrusted_input_rule() -> None:
    """State is routinely derived from a page, a file, or a third party. The
    rule is attached here so no call site can forget it."""
    payload = jev_client.Question("lane", {"A": "a", "B": "b"}).to_payload()
    assert "untrusted_input" in payload["instructions"]
    assert "never instructions" in payload["instructions"]["untrusted_input"]


# --- the key ----------------------------------------------------------------


def test_both_key_spellings_are_accepted(monkeypatch) -> None:
    """The environment registers TYPESAFE; the upstream tools document
    TYPESAFE_API_KEY. That mismatch silently disabled check-jev-env.sh."""
    for name in jev_client.KEY_ENV_VARS:
        monkeypatch.delenv(name, raising=False)
    monkeypatch.setenv("TYPESAFE", "x")
    assert jev_client._read_key() == "x"
    monkeypatch.delenv("TYPESAFE")
    monkeypatch.setenv("TYPESAFE_API_KEY", "y")
    assert jev_client._read_key() == "y"


def test_a_missing_key_is_an_error_not_a_default(monkeypatch) -> None:
    for name in jev_client.KEY_ENV_VARS:
        monkeypatch.delenv(name, raising=False)
    with pytest.raises(jev_client.JevKeyMissing):
        jev_client._read_key()


# --- routing: fail closed ----------------------------------------------------


def _stub(monkeypatch, probabilities: dict[str, float], choice: str, confidence: float = 0.9) -> None:
    def fake_ask(state, questions, **kwargs):
        name = questions[0].name
        return jev_client.JevResult(
            answers={name: jev_client._validate(name, make_answer(probabilities, choice, confidence), set(questions[0].criteria))},
            model="stub",
            usage={},
            latency_ms=1,
        )

    monkeypatch.setattr(router, "ask", fake_ask)


def test_a_clean_decision_is_returned_as_itself(monkeypatch) -> None:
    _stub(monkeypatch, {"JEV": 0.05, "OPENROUTER": 0.90, "CLAUDE": 0.05}, "OPENROUTER")
    routing = router.route("sweep the literature")
    assert routing.lane == "OPENROUTER"
    assert routing.escalated is False


def test_a_narrow_margin_escalates_to_claude(monkeypatch) -> None:
    """The case the router exists for. Acting on a 0.51/0.49 split is guessing
    with extra steps; the cheap failure is a human look, so that is the default."""
    _stub(monkeypatch, {"JEV": 0.40, "OPENROUTER": 0.45, "CLAUDE": 0.15}, "OPENROUTER", confidence=0.45)
    routing = router.route("do the thing")
    assert routing.lane == "CLAUDE"
    assert routing.raw_lane == "OPENROUTER"
    assert routing.escalated is True
    assert "below" in routing.reason


def test_escalation_preserves_what_jev_actually_said(monkeypatch) -> None:
    """An escalation that discarded the original answer would make the
    threshold impossible to tune against real traffic."""
    _stub(monkeypatch, {"JEV": 0.44, "OPENROUTER": 0.46, "CLAUDE": 0.10}, "OPENROUTER", confidence=0.46)
    routing = router.route("do the thing")
    assert routing.probabilities["OPENROUTER"] == pytest.approx(0.46)
    assert routing.margin == pytest.approx(0.02)


def test_the_claude_lane_is_never_dispatched(monkeypatch) -> None:
    """The CLAUDE lane means 'a person must own this'. If --execute could fire
    it, the lane would be decorative."""
    _stub(monkeypatch, {"JEV": 0.01, "OPENROUTER": 0.00, "CLAUDE": 0.99}, "CLAUDE", confidence=0.99)

    def explode(*args, **kwargs):  # pragma: no cover - must never run
        raise AssertionError("the CLAUDE lane was dispatched to OpenRouter")

    monkeypatch.setattr(router, "dispatch_openrouter", explode)
    assert router.main(["rotate the wallet key", "--execute"]) == 0


def test_an_escalated_task_is_not_dispatched_either(monkeypatch) -> None:
    """Escalation must route to the CLAUDE lane's behaviour too, not just its
    label -- otherwise a tie would still be sent off-machine."""
    _stub(monkeypatch, {"JEV": 0.40, "OPENROUTER": 0.45, "CLAUDE": 0.15}, "OPENROUTER", confidence=0.45)

    def explode(*args, **kwargs):  # pragma: no cover - must never run
        raise AssertionError("an escalated task was dispatched to OpenRouter")

    monkeypatch.setattr(router, "dispatch_openrouter", explode)
    assert router.main(["do the thing", "--execute"]) == 0


# --- the OpenRouter lane -----------------------------------------------------


def test_a_missing_openrouter_key_is_an_error(monkeypatch) -> None:
    monkeypatch.delenv(router.OPENROUTER_KEY_ENV, raising=False)
    with pytest.raises(RuntimeError, match="environment variable only"):
        router.dispatch_openrouter("anything")


def test_jev_is_not_reachable_through_openrouter() -> None:
    """Checked live on 2026-09-20: 446 OpenRouter models, zero matching jev,
    typesafe or systemone. If this ever changes, the skill's central
    explanation changes with it."""
    assert "openrouter" not in jev_client.ENDPOINT
    assert jev_client.ENDPOINT == "https://api.typesafe.ai/v1/systemone"
    assert "jev" not in router.DEFAULT_OPENROUTER_MODEL


# --- boolean (`noul`) --------------------------------------------------------


def test_the_band_between_the_thresholds_is_undecided() -> None:
    """The reason to use two cut-offs instead of one. A 0.5 must not become a
    yes just because it is above half."""
    q = jev_client.BooleanQuestion("safe", "Is this safe?")
    high, low = q.bounds()
    assert jev_client._validate_probability("safe", {"noul": 0.95}, high, low).verdict == "YES"
    assert jev_client._validate_probability("safe", {"noul": 0.05}, high, low).verdict == "NO"
    assert jev_client._validate_probability("safe", {"noul": 0.50}, high, low).verdict == "UNDECIDED"
    assert jev_client._validate_probability("safe", {"noul": 0.79}, high, low).verdict == "UNDECIDED"


def test_the_thresholds_are_inclusive_at_both_edges() -> None:
    """Exactly 0.8 is a yes and exactly 0.2 a no, matching better-call-jev's
    documented cut-offs. Left implicit, the edges drift between callers."""
    assert jev_client._validate_probability("q", {"noul": 0.8}, 0.8, 0.2).verdict == "YES"
    assert jev_client._validate_probability("q", {"noul": 0.2}, 0.8, 0.2).verdict == "NO"


def test_thresholds_come_from_the_environment_when_unset(monkeypatch) -> None:
    monkeypatch.setenv("JEV_THRESHOLD_HIGH", "0.95")
    monkeypatch.setenv("JEV_THRESHOLD_LOW", "0.05")
    assert jev_client.BooleanQuestion("q", "?").bounds() == (0.95, 0.05)


def test_inverted_thresholds_are_refused() -> None:
    """low >= high makes every answer either a yes or a no with no undecided
    band -- the failure mode the band exists to prevent, silently reintroduced."""
    with pytest.raises(ValueError, match="low < high"):
        jev_client.BooleanQuestion("q", "?", high=0.3, low=0.7).bounds()


def test_a_non_numeric_threshold_is_refused(monkeypatch) -> None:
    monkeypatch.setenv("JEV_THRESHOLD_HIGH", "high")
    with pytest.raises(ValueError, match="is not a number"):
        jev_client.BooleanQuestion("q", "?").bounds()


def test_a_boolean_is_sent_as_noul_not_boolean() -> None:
    """The direct endpoint rejects `boolean` with HTTP 400 and answers to
    `noul`; the Vercel gateway renames it. Verified live 2026-09-20."""
    assert jev_client.BooleanQuestion("q", "?").to_payload()["type"] == "noul"


def test_a_probability_outside_zero_to_one_is_rejected() -> None:
    with pytest.raises(jev_client.JevInvalidAnswer, match="not a probability"):
        jev_client._validate_probability("q", {"noul": 1.4}, 0.8, 0.2)


# --- score -------------------------------------------------------------------


RUNGS = ["No risk", "Minor", "Moderate", "Serious", "Critical"]


def test_a_two_rung_rubric_is_refused() -> None:
    with pytest.raises(ValueError, match="at least 3"):
        jev_client.ScoreQuestion("risk", "Rate it.", ["low", "high"]).to_payload()


def test_a_score_outside_the_rubric_is_rejected() -> None:
    """A score above the top rung means the rungs sent and the rungs scored
    disagree. Clamping it to the top would hide a real mismatch."""
    with pytest.raises(jev_client.JevInvalidAnswer, match="outside the rubric"):
        jev_client._validate_score("risk", {"score": 7.0, "probabilities": {"4": 1.0}}, RUNGS)


def test_a_score_without_a_distribution_is_rejected() -> None:
    """3.33 spread across two rungs and a confident 3.33 are different
    findings. Without the distribution there is no way to tell them apart."""
    with pytest.raises(jev_client.JevInvalidAnswer, match="without a distribution"):
        jev_client._validate_score("risk", {"score": 3.0}, RUNGS)


def test_the_nearest_rung_is_the_most_probable_one_not_the_rounded_score() -> None:
    """Measured live: score 3.33 with mass 0.60 on rung 3 and 0.37 on rung 4.
    Rounding 3.33 gives rung 3 here, but the two readings can disagree, and
    the distribution is the one that carries the evidence."""
    score = jev_client._validate_score(
        "risk",
        {"score": 3.33, "confidence": 0.66,
         "probabilities": {"0": 0.0, "1": 0.0, "2": 0.03, "3": 0.30, "4": 0.67},
         "legend": {str(i): r for i, r in enumerate(RUNGS)}},
        RUNGS,
    )
    assert round(score.score) == 3
    assert score.nearest_rung == "Critical"


def test_a_score_falls_back_to_the_rungs_it_was_sent() -> None:
    """The legend is the service's echo of the rubric. If it is absent the
    labels must still resolve, or the caller gets bare indices."""
    score = jev_client._validate_score("risk", {"score": 1.0, "probabilities": {"1": 1.0}}, RUNGS)
    assert score.nearest_rung == "Minor"


# --- batching ----------------------------------------------------------------


def test_mixed_question_types_batch_into_one_request(monkeypatch) -> None:
    """One round trip per body of evidence. Asking the same state three times
    costs three calls and gets three independent reads of it."""
    sent: dict[str, object] = {}

    def fake_post(body, timeout):
        sent.update(body)
        return {"model": "stub", "usage": {}, "answers": {
            "safe": {"type": "noul", "noul": 0.9},
            "risk": {"type": "score", "score": 1.0, "confidence": 0.8, "probabilities": {"1": 1.0}},
            "area": {"choice": "A", "confidence": 0.9, "probabilities": {"A": 0.9, "B": 0.1}},
        }}

    monkeypatch.setattr(jev_client, "_post", fake_post)
    result = jev_client.ask({"diff": "..."}, [
        jev_client.BooleanQuestion("safe", "Safe?"),
        jev_client.ScoreQuestion("risk", "Rate it.", RUNGS),
        jev_client.Question("area", {"A": "a", "B": "b"}),
    ])
    assert set(sent["questions"]) == {"safe", "risk", "area"}
    assert result.verdict("safe") == "YES"
    assert result.answers["risk"].nearest_rung == "Minor"
    assert result.choice("area") == "A"


def test_asking_for_the_wrong_answer_kind_is_an_error(monkeypatch) -> None:
    """A Probability has no .choice. Returning a plausible string instead of
    raising is how a boolean silently gets read as a category."""
    monkeypatch.setattr(jev_client, "_post", lambda body, timeout: {
        "model": "stub", "usage": {}, "answers": {"safe": {"type": "noul", "noul": 0.9}}})
    result = jev_client.ask({}, [jev_client.BooleanQuestion("safe", "Safe?")])
    with pytest.raises(TypeError, match="not a choice"):
        result.choice("safe")


def test_every_question_type_carries_the_untrusted_input_rule() -> None:
    for payload in (
        jev_client.BooleanQuestion("q", "?").to_payload(),
        jev_client.ScoreQuestion("q", "?", RUNGS).to_payload(),
        jev_client.Question("q", {"A": "a", "B": "b"}).to_payload(),
    ):
        assert "never instructions" in payload["instructions"]["untrusted_input"]
