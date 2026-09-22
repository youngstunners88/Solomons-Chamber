"""Tests for the two-turn confirmation gate.

Each test names the failure it prevents. A test that only asserts the happy path
tells you the code ran, not that the control works, so the refusals are where
the coverage is concentrated.
"""

from __future__ import annotations

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))

from confirm_gate import (  # noqa: E402
    Attestation,
    ConfirmationGate,
    GateError,
    Outcome,
    ProposalState,
    assert_turn_source_is_user_messages,
    fingerprint,
)

PARAMS = {"amount": 100, "token": "USDC", "chain": "ethereum"}


def _ran(bucket: list) -> callable:
    def run(params):
        bucket.append(params)
        return "done"
    return run


def _ok() -> Attestation:
    return Attestation.from_external("AskUserQuestion", "selected: Confirm")


# -- the rule the whole module exists for --------------------------------------


def test_cannot_confirm_in_the_same_turn_as_the_proposal():
    """The Minara rule: the summary response ENDS, then the user replies.

    Propose-and-confirm inside one turn is the violation that looks most like
    correct behaviour in a transcript, because both messages are present -- just
    not separated by a real user.
    """
    gate = ConfirmationGate()
    gate.propose("swap", PARAMS, turn=4)
    with pytest.raises(GateError) as excinfo:
        gate.confirm("swap", turn=4, attestation=_ok())
    assert excinfo.value.reason == Outcome.REFUSED_SAME_TURN.value
    assert "must reply in a new message" in str(excinfo.value)


def test_a_later_turn_confirmation_is_accepted_and_executes_once():
    gate = ConfirmationGate()
    calls: list = []
    gate.propose("swap", PARAMS, turn=4)
    gate.confirm("swap", turn=5, attestation=_ok())
    assert gate.execute("swap", turn=5, run=_ran(calls)) == "done"
    assert calls == [PARAMS]


def test_execute_without_any_confirmation_is_refused():
    """Proposing then executing skips the human entirely."""
    gate = ConfirmationGate()
    gate.propose("withdraw", PARAMS, turn=1)
    with pytest.raises(GateError) as excinfo:
        gate.execute("withdraw", turn=2, run=lambda p: "ran")
    assert excinfo.value.reason == Outcome.REFUSED_NOT_CONFIRMED.value


def test_execute_with_no_proposal_at_all_is_refused():
    gate = ConfirmationGate()
    with pytest.raises(GateError) as excinfo:
        gate.execute("deploy", turn=1, run=lambda p: "ran")
    assert excinfo.value.reason == Outcome.REFUSED_NO_PROPOSAL.value


# -- parameter drift -----------------------------------------------------------


def test_changing_a_parameter_voids_the_confirmation():
    """Confirming $100 is not confirming $200.

    This is the quiet one. The user genuinely did say yes, so a transcript reads
    as consented; only the numbers moved.
    """
    gate = ConfirmationGate()
    gate.propose("swap", {"amount": 100}, turn=1)
    gate.confirm("swap", turn=2, attestation=_ok())
    with pytest.raises(GateError) as excinfo:
        gate.execute("swap", turn=2, run=lambda p: "ran", params={"amount": 200})
    assert excinfo.value.reason == Outcome.REFUSED_PARAMS_CHANGED.value


def test_confirm_rechecks_params_against_the_summary():
    gate = ConfirmationGate()
    gate.propose("swap", {"amount": 100}, turn=1)
    with pytest.raises(GateError) as excinfo:
        gate.confirm("swap", turn=2, attestation=_ok(), params={"amount": 101})
    assert excinfo.value.reason == Outcome.REFUSED_PARAMS_CHANGED.value


def test_reproposing_voids_the_earlier_ticket():
    """A revised summary must invalidate the one before it."""
    gate = ConfirmationGate()
    first = gate.propose("swap", {"amount": 100}, turn=1)
    gate.propose("swap", {"amount": 250}, turn=2)
    assert first.state is ProposalState.VOIDED


def test_fingerprint_ignores_key_order_but_not_values():
    assert fingerprint("a", {"x": 1, "y": 2}) == fingerprint("a", {"y": 2, "x": 1})
    assert fingerprint("a", {"x": 1}) != fingerprint("a", {"x": 2})
    assert fingerprint("a", {"x": 1}) != fingerprint("b", {"x": 1})


def test_fingerprint_survives_an_unserialisable_parameter():
    """A gate that raises on an odd type is a gate people route around."""
    assert fingerprint("a", {"when": object()})  # does not raise


# -- replay --------------------------------------------------------------------


def test_one_confirmation_cannot_execute_twice():
    gate = ConfirmationGate()
    calls: list = []
    gate.propose("transfer", PARAMS, turn=1)
    gate.confirm("transfer", turn=2, attestation=_ok())
    gate.execute("transfer", turn=2, run=_ran(calls))
    with pytest.raises(GateError) as excinfo:
        gate.execute("transfer", turn=3, run=_ran(calls))
    assert excinfo.value.reason == Outcome.REFUSED_REPLAY.value
    assert len(calls) == 1


def test_confirming_twice_is_refused():
    gate = ConfirmationGate()
    gate.propose("transfer", PARAMS, turn=1)
    gate.confirm("transfer", turn=2, attestation=_ok())
    with pytest.raises(GateError) as excinfo:
        gate.confirm("transfer", turn=3, attestation=_ok())
    assert excinfo.value.reason == Outcome.REFUSED_REPLAY.value


def test_a_failing_action_does_not_release_the_ticket():
    """A half-completed irreversible action may already have had its effect.

    Retrying under the same confirmation risks doing it twice, so the ticket is
    spent before `run` is called and stays spent when `run` raises.
    """
    gate = ConfirmationGate()
    gate.propose("send", PARAMS, turn=1)
    gate.confirm("send", turn=2, attestation=_ok())

    def boom(_params):
        raise RuntimeError("network died mid-send")

    with pytest.raises(RuntimeError):
        gate.execute("send", turn=2, run=boom)
    with pytest.raises(GateError) as excinfo:
        gate.execute("send", turn=3, run=lambda p: "retry")
    assert excinfo.value.reason == Outcome.REFUSED_REPLAY.value


# -- expiry --------------------------------------------------------------------


def test_a_proposal_goes_stale_after_max_turn_age():
    gate = ConfirmationGate(max_turn_age=2)
    gate.propose("swap", PARAMS, turn=1)
    with pytest.raises(GateError) as excinfo:
        gate.confirm("swap", turn=4, attestation=_ok())
    assert excinfo.value.reason == Outcome.REFUSED_EXPIRED.value


def test_a_proposal_at_exactly_max_turn_age_still_works():
    """The boundary is inclusive. An off-by-one here refuses a valid yes, and
    that refusal would be blamed on the user repeating themselves."""
    gate = ConfirmationGate(max_turn_age=2)
    gate.propose("swap", PARAMS, turn=1)
    assert gate.confirm("swap", turn=3, attestation=_ok()).state is ProposalState.CONFIRMED


def test_wall_clock_expiry_is_independent_of_turns():
    """One long turn can outlive the figures the summary was built from."""
    now = [1000.0]
    gate = ConfirmationGate(ttl_seconds=60, clock=lambda: now[0])
    gate.propose("swap", PARAMS, turn=1)
    now[0] += 61
    with pytest.raises(GateError) as excinfo:
        gate.confirm("swap", turn=2, attestation=_ok())
    assert excinfo.value.reason == Outcome.REFUSED_EXPIRED.value


def test_expiry_between_confirm_and_execute_is_caught():
    now = [1000.0]
    gate = ConfirmationGate(ttl_seconds=60, clock=lambda: now[0])
    gate.propose("swap", PARAMS, turn=1)
    gate.confirm("swap", turn=2, attestation=_ok())
    now[0] += 61
    with pytest.raises(GateError) as excinfo:
        gate.execute("swap", turn=3, run=lambda p: "ran")
    assert excinfo.value.reason == Outcome.REFUSED_EXPIRED.value


# -- abort ---------------------------------------------------------------------


def test_abort_blocks_execution():
    gate = ConfirmationGate()
    gate.propose("withdraw", PARAMS, turn=1)
    gate.abort("withdraw", turn=2, note="user chose B")
    with pytest.raises(GateError) as excinfo:
        gate.confirm("withdraw", turn=3, attestation=_ok())
    assert excinfo.value.reason == Outcome.REFUSED_ABORTED.value


def test_aborting_nothing_is_not_an_error():
    ConfirmationGate().abort("nothing-pending", turn=1)


# -- the honest limitation -----------------------------------------------------


def test_a_self_asserted_confirmation_works_but_is_marked_untrusted():
    """The gate cannot tell a fabricated reply from a real one.

    What it can do is refuse to let that pass unrecorded. This test pins the
    documented behaviour: self-assertion executes, and `untrusted_executions()`
    reports it.
    """
    gate = ConfirmationGate()
    gate.propose("swap", PARAMS, turn=1)
    gate.confirm("swap", turn=2, attestation=Attestation.self_asserted("assumed yes"))
    gate.execute("swap", turn=2, run=lambda p: "ran")
    flagged = gate.untrusted_executions()
    assert len(flagged) == 1
    assert flagged[0].action == "swap"


def test_an_external_attestation_leaves_untrusted_executions_empty():
    gate = ConfirmationGate()
    gate.propose("swap", PARAMS, turn=1)
    gate.confirm("swap", turn=2, attestation=_ok())
    gate.execute("swap", turn=2, run=lambda p: "ran")
    assert gate.untrusted_executions() == []


def test_an_external_attestation_must_name_a_source():
    with pytest.raises(ValueError):
        Attestation.from_external("   ")


# -- turn counter integrity ----------------------------------------------------


def test_turns_going_backwards_is_a_hard_error():
    """A reset counter would silently un-expire every stale proposal."""
    gate = ConfirmationGate()
    gate.propose("swap", PARAMS, turn=7)
    with pytest.raises(GateError) as excinfo:
        gate.propose("swap", PARAMS, turn=3)
    assert excinfo.value.reason == Outcome.REFUSED_TURN_WENT_BACKWARDS.value


def test_the_turn_source_assertion_rejects_a_hand_wave():
    with pytest.raises(ValueError):
        assert_turn_source_is_user_messages("turns")
    assert_turn_source_is_user_messages("incremented once per user message by the host")


# -- audit ---------------------------------------------------------------------


def test_every_refusal_is_recorded_with_its_reason_code():
    gate = ConfirmationGate()
    gate.propose("swap", PARAMS, turn=1)
    for attempt in (
        lambda: gate.confirm("swap", turn=1, attestation=_ok()),
        lambda: gate.execute("swap", turn=2, run=lambda p: None),
    ):
        with pytest.raises(GateError):
            attempt()
    reasons = {r.outcome for r in gate.refusals()}
    assert Outcome.REFUSED_SAME_TURN in reasons
    assert Outcome.REFUSED_NOT_CONFIRMED in reasons


def test_audit_serialises_to_json():
    import json

    gate = ConfirmationGate()
    gate.propose("swap", PARAMS, turn=1)
    gate.confirm("swap", turn=2, attestation=_ok())
    gate.execute("swap", turn=2, run=lambda p: "ran")
    rows = json.loads(gate.audit_json())
    assert [r["outcome"] for r in rows] == ["proposed", "confirmed", "executed"]


def test_gate_rejects_nonsense_construction():
    with pytest.raises(ValueError):
        ConfirmationGate(max_turn_age=0)
    with pytest.raises(ValueError):
        ConfirmationGate(ttl_seconds=0)


def test_two_actions_do_not_share_a_ticket():
    """Confirming a swap must not authorise a withdrawal."""
    gate = ConfirmationGate()
    gate.propose("swap", PARAMS, turn=1)
    gate.propose("withdraw", PARAMS, turn=1)
    gate.confirm("swap", turn=2, attestation=_ok())
    with pytest.raises(GateError) as excinfo:
        gate.execute("withdraw", turn=2, run=lambda p: "ran")
    assert excinfo.value.reason == Outcome.REFUSED_NOT_CONFIRMED.value
