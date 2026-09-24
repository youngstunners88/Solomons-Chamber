"""Tests for absence detection and the anti-loop preflight."""

from __future__ import annotations

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))

from preflight import (  # noqa: E402
    CommandSpec,
    PreflightError,
    Registry,
    RetryBudget,
)
from reconcile import reconcile, require_covered  # noqa: E402


# ============================= reconcile ====================================


def test_the_headline_case_an_open_item_with_no_cover_is_uncovered():
    """Senpi's trap: the failure is a row that is not there."""
    cov = reconcile(["BTC", "ETH", "SOL"], ["BTC", "SOL"])
    assert cov.uncovered == ("ETH",)
    assert not cov.ok


def test_full_cover_passes():
    cov = reconcile(["BTC", "ETH"], ["ETH", "BTC"])
    assert cov.ok
    assert cov.healthy == ("BTC", "ETH")


def test_an_empty_expected_set_is_vacuous_and_never_ok():
    """The most dangerous output this module can produce is a trivial pass.

    Same failure as a CI job reporting green on zero collected tests, which is
    why this repo's workflow fails that case explicitly.
    """
    cov = reconcile([], [])
    assert cov.vacuous
    assert not cov.ok
    assert "proves nothing" in cov.summary()


def test_vacuous_is_not_triggered_by_an_empty_actual_set():
    """Expected three, covered none. That is a total failure, not a vacuous one."""
    cov = reconcile(["a", "b", "c"], [])
    assert not cov.vacuous
    assert cov.uncovered == ("a", "b", "c")


def test_present_but_unhealthy_is_degraded_not_healthy():
    """A tracked position with no stop price is listed and useless."""
    expected = [{"id": "BTC"}, {"id": "ETH"}]
    actual = [{"id": "BTC", "floor": 90.0}, {"id": "ETH", "floor": None}]
    cov = reconcile(
        expected, actual,
        key=lambda r: r["id"],
        healthy=lambda r: r.get("floor") is not None,
        why_unhealthy=lambda r: "tracked but carries no floor price",
    )
    assert cov.degraded == ("ETH",)
    assert cov.healthy == ("BTC",)
    assert cov.notes["ETH"] == "tracked but carries no floor price"
    assert not cov.ok


def test_orphans_are_reported_but_do_not_fail_the_check():
    """Cover for something nobody expects is worth knowing about and is not a
    safety gap the way an absence is."""
    cov = reconcile(["BTC"], ["BTC", "DOGE"])
    assert cov.orphaned == ("DOGE",)
    assert cov.ok


def test_dissimilar_record_shapes_compare_through_the_key():
    cov = reconcile(
        [{"asset": "BTC"}],
        [{"coin": "BTC", "floor": 1}],
        key=lambda r: r.get("asset") or r["coin"],
    )
    assert cov.ok


def test_require_covered_raises_on_a_gap_and_names_it():
    with pytest.raises(AssertionError, match="ETH"):
        require_covered(reconcile(["ETH"], []), context="deploy")


def test_require_covered_raises_on_a_vacuous_pass():
    with pytest.raises(AssertionError, match="VACUOUS"):
        require_covered(reconcile([], []))


def test_require_covered_is_silent_on_a_real_pass():
    require_covered(reconcile(["a"], ["a"]))


# ============================= preflight ====================================


REG = Registry([
    CommandSpec("tool discover", required_flags=("--type",),
                alternative="tool discover --type tokens"),
    CommandSpec("tool perps close", required_flags=("--all",),
                alternative="tool perps close --all"),
    CommandSpec("tool limit-order create", always_interactive=True,
                note="no non-interactive mode; walk the user through the TUI"),
    CommandSpec("tool balance"),
])


def test_a_command_missing_its_flags_is_refused_before_it_can_hang():
    with pytest.raises(PreflightError) as excinfo:
        REG.preflight("tool discover")
    assert excinfo.value.reason == "needs_flags"
    assert "--type" in str(excinfo.value)


def test_supplying_the_flags_makes_it_safe():
    assert REG.preflight("tool discover --type tokens").safe


def test_the_advice_names_the_non_interactive_alternative():
    risk = REG.inspect("tool perps close")
    assert "tool perps close --all" in risk.advice


def test_an_unregistered_command_is_unknown_not_safe():
    """Defaulting to safe means the guard silently stops guarding the first time
    someone forgets to register a command."""
    risk = REG.inspect("othertool do-something")
    assert risk.verdict == "unknown"
    assert not risk.safe
    with pytest.raises(PreflightError):
        REG.preflight("othertool do-something")


def test_an_always_interactive_command_is_refused_without_a_pty():
    with pytest.raises(PreflightError) as excinfo:
        REG.preflight("tool limit-order create")
    assert excinfo.value.reason == "pty_required"


def test_an_always_interactive_command_is_allowed_with_an_explicit_pty():
    assert REG.preflight("tool limit-order create", allow_pty=True).verdict == "pty_required"


def test_a_pty_does_not_excuse_missing_flags():
    """Those have a non-interactive answer, so a pty is the wrong fix."""
    with pytest.raises(PreflightError) as excinfo:
        REG.preflight("tool discover", allow_pty=True)
    assert excinfo.value.reason == "needs_flags"


def test_longest_prefix_wins_so_a_subcommand_beats_its_parent():
    reg = Registry([
        CommandSpec("tool perps", required_flags=("--x",)),
        CommandSpec("tool perps close", required_flags=("--all",)),
    ])
    assert reg.inspect("tool perps close").missing == ("--all",)


def test_a_flag_written_with_equals_still_counts_as_supplied():
    assert REG.preflight("tool discover --type=tokens").safe


def test_a_contradictory_spec_is_refused_at_registration():
    with pytest.raises(ValueError, match="not always interactive"):
        Registry([CommandSpec("x", required_flags=("--a",), always_interactive=True)])


def test_an_empty_command_raises():
    with pytest.raises(PreflightError):
        REG.inspect("   ")


# -- retry budget --------------------------------------------------------------


def test_one_retry_is_allowed_and_a_second_failure_stops_everything():
    budget = RetryBudget(limit=1)
    budget.record_failure("timeout")
    budget.check()                      # one failure: a retry is still allowed
    budget.record_failure("timeout again")
    with pytest.raises(PreflightError) as excinfo:
        budget.check()
    assert excinfo.value.reason == "retry_exhausted"


def test_the_exhausted_message_carries_both_failures_for_the_report():
    budget = RetryBudget(limit=1)
    budget.record_failure("first")
    budget.record_failure("second")
    with pytest.raises(PreflightError, match="first; second"):
        budget.check()


def test_a_hang_is_detected_at_the_threshold():
    budget = RetryBudget()
    assert not budget.is_hang(14.9)
    assert budget.is_hang(15.0)


def test_a_hang_burns_the_budget_immediately_and_is_never_retried():
    """Retrying a command that is waiting for input just waits again."""
    budget = RetryBudget(limit=1)
    with pytest.raises(PreflightError) as excinfo:
        budget.record_hang("tool discover")
    assert excinfo.value.reason == "hang_detected"
    assert not budget.may_retry()
