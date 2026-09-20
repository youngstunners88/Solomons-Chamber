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
