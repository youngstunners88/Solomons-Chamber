"""Tests for the decision cascade.

The break-even maths is the reason this module exists, so it carries the most
tests. A cascade that cannot tell you it is a pessimisation is worse than no
cascade, because it looks like an optimisation in the architecture diagram.
"""

from __future__ import annotations

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))

from backends import LAYA_MLX_PLATFORM_NOTE, calibrate_latency, probe  # noqa: E402
from cascade import (  # noqa: E402
    Cascade,
    Decision,
    Gate,
    Resolution,
    Tier,
    break_even_escalation_rate,
)

GATE = Gate(min_margin=0.25, min_confidence=0.40)


def fixed(choice: str, probs: dict[str, float]):
    return lambda state, question: Decision(choice=choice, probabilities=probs)


CONFIDENT = {"A": 0.80, "B": 0.15, "C": 0.05}   # margin 0.65 -> clears
UNSURE = {"A": 0.40, "B": 0.38, "C": 0.22}      # margin 0.02 -> escalates


# ===================== the break-even maths ================================


def test_break_even_is_one_minus_the_latency_ratio():
    assert break_even_escalation_rate(10, 100) == pytest.approx(0.90)
    assert break_even_escalation_rate(50, 100) == pytest.approx(0.50)
    assert break_even_escalation_rate(90, 100) == pytest.approx(0.10)


def test_a_cheap_tier_at_half_the_latency_must_resolve_over_half():
    """The blunt consequence, pinned: 50% latency ratio -> 50% break-even."""
    assert break_even_escalation_rate(50, 100) == pytest.approx(0.5)


def test_break_even_goes_negative_when_the_cheap_tier_is_not_cheaper():
    """Our actual situation: CPU-local Laya (~400ms) in front of remote Jev
    (~347ms). No escalation rate redeems it and the number says so."""
    assert break_even_escalation_rate(400, 347) < 0


def test_break_even_rejects_nonsense_latencies():
    with pytest.raises(ValueError):
        break_even_escalation_rate(0, 100)
    with pytest.raises(ValueError):
        break_even_escalation_rate(10, -1)


def test_verdict_says_delete_when_the_cheap_tier_is_slower():
    cheap = Tier("laya_cpu", fixed("A", UNSURE), expected_latency_ms=400)
    dear = Tier("jev", fixed("A", CONFIDENT), expected_latency_ms=347)
    casc = Cascade([cheap, dear], GATE)
    casc.decide("s", {})
    assert "DELETE" in casc.stats.verdict(cheap, dear)


def test_verdict_calls_out_a_pessimisation():
    """Cheap tier is 10x faster, so break-even is 90%. Escalating every time is
    well past that."""
    cheap = Tier("local", fixed("A", UNSURE), expected_latency_ms=10)
    dear = Tier("remote", fixed("A", CONFIDENT), expected_latency_ms=100)
    casc = Cascade([cheap, dear], GATE)
    for _ in range(10):
        casc.decide("s", {})
    verdict = casc.stats.verdict(cheap, dear)
    assert "PESSIMISATION" in verdict
    assert "100%" in verdict


def test_verdict_says_worth_it_when_the_cheap_tier_carries_its_weight():
    cheap = Tier("local", fixed("A", CONFIDENT), expected_latency_ms=10)
    dear = Tier("remote", fixed("A", CONFIDENT), expected_latency_ms=100)
    casc = Cascade([cheap, dear], GATE)
    for _ in range(10):
        casc.decide("s", {})
    assert "WORTH IT" in casc.stats.verdict(cheap, dear)


def test_verdict_reports_no_data_rather_than_guessing():
    cheap = Tier("never", fixed("A", CONFIDENT), expected_latency_ms=10,
                 can_answer=lambda s, q: False)
    dear = Tier("remote", fixed("A", CONFIDENT), expected_latency_ms=100)
    casc = Cascade([cheap, dear], GATE)
    casc.decide("s", {})
    assert "NO DATA" in casc.stats.verdict(cheap, dear)


# ===================== routing ==============================================


def test_a_confident_cheap_answer_resolves_without_touching_the_dear_tier():
    dear_calls = []

    def dear_backend(state, question):
        dear_calls.append(1)
        return Decision("A", CONFIDENT)

    casc = Cascade(
        [Tier("local", fixed("A", CONFIDENT), expected_latency_ms=10),
         Tier("remote", dear_backend, expected_latency_ms=100, cost_per_call_usd=0.0001)],
        GATE,
    )
    result = casc.decide("s", {})
    assert result.ok
    assert result.decision.tier == "local"
    assert dear_calls == []
    assert result.cost_usd == 0.0


def test_an_unsure_cheap_answer_escalates():
    casc = Cascade(
        [Tier("local", fixed("A", UNSURE), expected_latency_ms=10),
         Tier("remote", fixed("B", CONFIDENT), expected_latency_ms=100)],
        GATE,
    )
    result = casc.decide("s", {})
    assert result.ok
    assert result.decision.tier == "remote"
    assert result.tiers_tried == ("local", "remote")


def test_when_no_tier_clears_the_gate_the_result_is_escalated_out():
    casc = Cascade(
        [Tier("local", fixed("A", UNSURE), expected_latency_ms=10),
         Tier("remote", fixed("A", UNSURE), expected_latency_ms=100)],
        GATE,
    )
    result = casc.decide("s", {})
    assert result.resolution is Resolution.ESCALATED_OUT
    assert not result.ok
    assert "human" in result.note


def test_a_tier_that_cannot_answer_is_skipped_not_called():
    called = []
    casc = Cascade(
        [Tier("specialist", lambda s, q: called.append(1) or Decision("A", CONFIDENT),
              expected_latency_ms=10, can_answer=lambda s, q: False),
         Tier("general", fixed("A", CONFIDENT), expected_latency_ms=100)],
        GATE,
    )
    result = casc.decide("s", {})
    assert called == []
    assert result.decision.tier == "general"


def test_no_capable_tier_is_its_own_outcome():
    casc = Cascade(
        [Tier("a", fixed("A", CONFIDENT), expected_latency_ms=10,
              can_answer=lambda s, q: False)],
        GATE,
    )
    assert casc.decide("s", {}).resolution is Resolution.NO_TIER_CAPABLE


# ===================== deadlines ============================================


def test_a_tier_is_not_started_when_the_budget_cannot_finish_it():
    """The failure budgeting exists to prevent: turning the fast path slow
    exactly when it is under pressure."""
    casc = Cascade(
        [Tier("local", fixed("A", UNSURE), expected_latency_ms=10),
         Tier("remote", fixed("A", CONFIDENT), expected_latency_ms=100)],
        GATE,
    )
    result = casc.decide("s", {}, deadline_ms=50)
    assert result.resolution is Resolution.DEADLINE
    assert result.tiers_tried == ("local",)
    assert "needs 100ms" in result.note


def test_a_sufficient_deadline_lets_the_whole_cascade_run():
    casc = Cascade(
        [Tier("local", fixed("A", UNSURE), expected_latency_ms=10),
         Tier("remote", fixed("A", CONFIDENT), expected_latency_ms=100)],
        GATE,
    )
    assert casc.decide("s", {}, deadline_ms=500).ok


def test_the_deadline_result_still_carries_the_best_answer_so_far():
    """Timing out should not throw away what the cheap tier already found."""
    casc = Cascade(
        [Tier("local", fixed("A", UNSURE), expected_latency_ms=10),
         Tier("remote", fixed("A", CONFIDENT), expected_latency_ms=100)],
        GATE,
    )
    result = casc.decide("s", {}, deadline_ms=50)
    assert result.decision is not None
    assert result.decision.tier == "local"


# ===================== gate semantics =======================================


def test_margin_and_confidence_are_both_required():
    """A wide race with a 35% leader has a big margin and low confidence."""
    wide = {"A": 0.35, **{chr(66 + i): 0.05 for i in range(13)}}
    gate = Gate(min_margin=0.10, min_confidence=0.40)
    assert not gate.clears(max(wide.values()), 0.30)


def test_a_coin_flip_is_refused_on_margin_despite_high_confidence():
    assert not Gate(0.25, 0.40).clears(0.51, 0.02)


def test_a_margin_exactly_on_the_threshold_clears():
    """`0.45 - 0.40` is `0.04999999999999999`, which is `< 0.05`.

    Without the tolerance this refuses a decision that is exactly good enough,
    and the refusal gets blamed on the model. The threshold is written as the
    literal `0.05` and the margin as the subtraction, so the two differ by one
    ulp — comparing a value against itself would prove nothing.
    """
    assert (0.45 - 0.40) < 0.05, "premise: the subtraction lands below the literal"
    assert Gate(min_margin=0.05, min_confidence=0.0).clears(0.9, 0.45 - 0.40)


def test_a_confidence_exactly_on_the_threshold_clears():
    """The same boundary on the OTHER field.

    The first version of this test set `min_confidence=0.0`, so it asserted the
    right verdict for the wrong reason and never exercised the confidence
    tolerance at all — a mutation that inverted that comparison survived it.
    """
    assert (0.70 - 0.40) < 0.30, "premise: the subtraction lands below the literal"
    assert Gate(min_margin=0.0, min_confidence=0.30).clears(0.70 - 0.40, 0.9)


def test_a_value_genuinely_below_the_threshold_is_still_refused():
    """The tolerance must not become a free pass. 0.04 is really below 0.05."""
    assert not Gate(min_margin=0.05, min_confidence=0.0).clears(0.9, 0.04)
    assert not Gate(min_margin=0.0, min_confidence=0.30).clears(0.29, 0.9)


def test_margin_of_a_single_option_is_its_confidence():
    assert Decision("A", {"A": 0.7}).margin == pytest.approx(0.7)


def test_an_empty_distribution_has_zero_confidence_and_does_not_crash():
    assert Decision("A", {}).confidence == 0.0


# ===================== construction =========================================


def test_a_tier_without_a_measured_latency_is_refused():
    with pytest.raises(ValueError, match="measured"):
        Tier("x", fixed("A", CONFIDENT), expected_latency_ms=0)


def test_duplicate_tier_names_are_refused():
    with pytest.raises(ValueError, match="duplicate"):
        Cascade(
            [Tier("a", fixed("A", CONFIDENT), expected_latency_ms=1),
             Tier("a", fixed("A", CONFIDENT), expected_latency_ms=2)],
            GATE,
        )


def test_an_empty_cascade_is_refused():
    with pytest.raises(ValueError):
        Cascade([], GATE)


def test_audit_reports_each_adjacent_pair():
    casc = Cascade(
        [Tier("local", fixed("A", UNSURE), expected_latency_ms=10),
         Tier("remote", fixed("A", CONFIDENT), expected_latency_ms=100)],
        GATE,
    )
    casc.decide("s", {})
    report = casc.audit()
    assert "calls=1" in report
    assert "local" in report


# ===================== the honesty probe ====================================


def test_probe_reports_laya_mlx_unavailable_on_this_non_apple_host():
    """This test is a fact about the machine CI runs on. If it ever fails
    because CI moved to Apple Silicon, that is information, not a bug."""
    import platform

    caps = probe()
    if not (platform.system() == "Darwin" and platform.machine() == "arm64"):
        assert not caps["laya_mlx"].available
        assert "darwin" in caps["laya_mlx"].reason or "Linux" in caps["laya_mlx"].reason


def test_the_platform_note_names_the_portable_alternative():
    assert "PyTorch" in LAYA_MLX_PLATFORM_NOTE
    assert "CUDA" in LAYA_MLX_PLATFORM_NOTE


def test_require_raises_with_the_reason_attached():
    caps = probe()
    cap = caps["laya_mlx"]
    if not cap.available:
        with pytest.raises(RuntimeError, match="unavailable"):
            cap.require()


def test_probe_never_suggests_a_latency_it_did_not_measure():
    """A budget copied from someone else's README is how a deadline gets blown."""
    assert all(c.suggested_latency_ms is None for c in probe().values())


def test_calibrate_discards_warmup_and_reports_p95():
    calls = []

    def slow_first():
        calls.append(1)
        if len(calls) <= 2:
            import time as _t
            _t.sleep(0.005)

    stats = calibrate_latency(slow_first, samples=5, warmup=2)
    assert stats["n"] == 5
    assert stats["p95"] >= stats["p50"]
    assert len(calls) == 7  # 2 warmup + 5 measured


def test_calibrate_needs_at_least_one_sample():
    with pytest.raises(ValueError):
        calibrate_latency(lambda: None, samples=0)
