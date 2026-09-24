"""Calibration scoring — and, mostly, its refusals.

The value of this module is not that it computes Brier. Any three lines do
that. It is that it declines to conclude from a sample too small to support a
conclusion, which is the failure mode every calibration write-up in the wild
walks straight into. So most of what follows tests the refusal.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import pytest

SCRIPTS = Path(__file__).resolve().parents[1] / "scripts"
sys.path.insert(0, str(SCRIPTS))

import calibration as cal  # noqa: E402


def rec(p: float, outcome: bool | None = None, q: str = "q") -> cal.DecisionRecord:
    return cal.DecisionRecord(question=q, predicted=p, outcome=outcome)


def many(p: float, outcome: bool, count: int) -> list[cal.DecisionRecord]:
    return [rec(p, outcome) for _ in range(count)]


# --- the sample-size floor, which is the point of the module ----------------


def test_the_floor_is_derived_not_picked() -> None:
    """(1.96 / (2 * 0.10))^2 = 96.04 -> 97. Hand-checked, not trusted."""
    assert cal.minimum_samples_per_bin(0.10) == 97
    assert cal.minimum_samples_per_bin(0.05) == 385


def test_a_tighter_tolerance_costs_quadratically() -> None:
    """Halving the error you want to resolve quadruples the sample. This is
    why calibration work is slow and why claiming it cheaply is a tell."""
    assert cal.minimum_samples_per_bin(0.05) == pytest.approx(
        4 * cal.minimum_samples_per_bin(0.10), rel=0.01)


def test_an_empty_log_reports_no_data_not_a_score() -> None:
    report = cal.assess([])
    assert report.verdict == "NO_DATA"
    assert report.brier is None and report.ece is None


def test_unresolved_decisions_do_not_count_as_evidence() -> None:
    """A decision with no outcome is not a data point. Counting it as one
    would let a log look large while resolving nothing."""
    assert cal.assess([rec(0.9), rec(0.8), rec(0.7)]).verdict == "NO_DATA"


def test_a_small_but_perfect_sample_is_still_underpowered() -> None:
    """The case this module exists for. Twenty flawless decisions look like
    proof and are not: a perfectly calibrated model and a lucky one are
    indistinguishable at n=20."""
    report = cal.assess(many(0.9, True, 10) + many(0.1, False, 10))
    assert report.verdict == "UNDERPOWERED"
    assert report.ece == pytest.approx(0.1, abs=0.001)
    assert "NOT yet evidence" in report.summary


def test_one_powered_bin_is_not_calibration() -> None:
    """Being right at one probability is a coincidence with a sample size.
    Calibration is a claim about the whole curve."""
    report = cal.assess(many(0.9, True, 200))
    assert report.verdict == "UNDERPOWERED"
    assert sum(1 for b in report.bins if not b.underpowered) == 1


def test_two_powered_bins_let_a_verdict_through() -> None:
    hi = many(0.9, True, 90) + many(0.9, False, 10)
    lo = many(0.1, True, 10) + many(0.1, False, 90)
    report = cal.assess(hi + lo)
    assert report.verdict == "CALIBRATED"
    assert report.ece == pytest.approx(0.0, abs=0.001)


def test_a_confidently_wrong_model_is_called_miscalibrated() -> None:
    """Promising 0.9 and delivering 0.3 is the failure a gate must catch."""
    hi = many(0.9, True, 30) + many(0.9, False, 70)
    lo = many(0.1, True, 10) + many(0.1, False, 90)
    report = cal.assess(hi + lo)
    assert report.verdict == "MISCALIBRATED"
    assert report.ece > 0.10
    assert "Platt scaling" in report.summary


# --- the metrics themselves --------------------------------------------------


def test_brier_is_hand_checkable() -> None:
    # (0.9-1)^2 + (0.2-0)^2 = 0.01 + 0.04 = 0.05, over 2 -> 0.025
    assert cal.brier_score([rec(0.9, True), rec(0.2, False)]) == pytest.approx(0.025)


def test_log_loss_punishes_a_confident_miss_far_harder_than_brier() -> None:
    """Brier is bounded at 1 per item; log loss is not. A gate that fires on
    high confidence needs the metric that notices confident mistakes."""
    near_miss = [rec(0.6, False)]
    howler = [rec(0.999, False)]
    assert cal.brier_score(howler) / cal.brier_score(near_miss) < 3
    assert cal.log_loss(howler) / cal.log_loss(near_miss) > 7


def test_log_loss_is_finite_on_a_certain_miss() -> None:
    """Unclipped this is infinity, and one such record would erase every other
    number in the report."""
    assert math_isfinite(cal.log_loss([rec(0.0, True)]))


def math_isfinite(x: float) -> bool:
    import math
    return math.isfinite(x)


def test_the_baseline_is_the_base_rate_not_one_quarter() -> None:
    """Always-0.5 scores 0.25, but the free baseline is predicting the actual
    base rate. On skewed outcomes that is much harder to beat, and using 0.25
    would flatter the model."""
    records = many(0.5, True, 90) + many(0.5, False, 10)
    assert cal.base_rate(records) == pytest.approx(0.9)
    assert cal.baseline_brier(records) == pytest.approx(0.09)
    assert cal.brier_score(records) == pytest.approx(0.25)
    assert cal.assess(records).beats_baseline is False


def test_empty_bins_are_omitted_not_reported_as_zero() -> None:
    """'No evidence' and 'never happened' are different claims; conflating
    them bends the reliability curve toward whatever is missing."""
    ranges = {(b.low, b.high) for b in cal.reliability(many(0.95, True, 5), bins=10)}
    assert ranges == {(0.9, 1.0)}


# --- the log ------------------------------------------------------------------


def test_a_probability_outside_zero_to_one_is_refused() -> None:
    with pytest.raises(ValueError, match=r"\[0, 1\]"):
        cal.DecisionRecord(question="q", predicted=1.4)


def test_a_boolean_is_not_a_probability() -> None:
    """bool subclasses int, so True would otherwise sail through as 1.0."""
    with pytest.raises(ValueError, match="must be a number"):
        cal.DecisionRecord(question="q", predicted=True)


def test_the_log_round_trips(tmp_path) -> None:
    log = cal.DecisionLog(tmp_path / "d.jsonl")
    log.append(rec(0.8, True, q="regime"))
    log.append(rec(0.3, None, q="toxic"))
    assert len(list(log.records())) == 2
    assert len(log.resolved()) == 1
    assert log.resolved()[0].question == "regime"


def test_a_missing_log_is_empty_not_an_error(tmp_path) -> None:
    assert list(cal.DecisionLog(tmp_path / "nope.jsonl").records()) == []


def test_a_corrupt_line_raises_rather_than_shrinking_the_sample(tmp_path) -> None:
    """Skipping bad lines silently would drop records from the denominator,
    and a calibration score computed on an unknown subset is worthless."""
    path = tmp_path / "d.jsonl"
    path.write_text(json.dumps({"question": "q", "predicted": 0.5, "outcome": True})
                    + "\n{ this is not json\n")
    with pytest.raises(ValueError, match="unreadable line"):
        list(cal.DecisionLog(path).records())


def test_the_report_serialises(tmp_path) -> None:
    report = cal.assess(many(0.9, True, 90) + many(0.9, False, 10)
                        + many(0.1, False, 100))
    payload = json.loads(json.dumps(report.to_dict()))
    assert payload["verdict"] in {"CALIBRATED", "MISCALIBRATED", "UNDERPOWERED", "NO_DATA"}
    assert payload["bins"] and "underpowered" in payload["bins"][0]
    assert "calibration:" in cal.format_report(report)
