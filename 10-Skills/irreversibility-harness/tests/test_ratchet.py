"""Tests for the two-phase ratchet."""

from __future__ import annotations

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))

from ratchet import (  # noqa: E402
    CloseReason,
    Ladder,
    Tier,
    floor_pct,
    open_position,
    run,
    tick,
)

LADDER = Ladder(
    max_loss_pct=8.0,
    tiers=(Tier(trigger_pct=10, lock_hw_pct=40), Tier(trigger_pct=50, lock_hw_pct=85)),
)


# -- construction refusals ------------------------------------------------------


def test_a_tier_locking_zero_is_refused_at_construction():
    """Senpi's warning, encoded: a breakeven rung exits flat while still paying
    both sides' costs, which is a loss wearing a neutral face."""
    with pytest.raises(ValueError, match="loss dressed as breakeven"):
        Ladder(max_loss_pct=5, tiers=(Tier(trigger_pct=10, lock_hw_pct=0),))


def test_unsorted_tiers_are_refused():
    """An unsorted ladder applies the wrong rung and says nothing."""
    with pytest.raises(ValueError, match="sorted ascending"):
        Ladder(
            max_loss_pct=5,
            tiers=(Tier(trigger_pct=50, lock_hw_pct=80), Tier(trigger_pct=10, lock_hw_pct=40)),
        )


def test_duplicate_triggers_are_refused():
    with pytest.raises(ValueError, match="duplicate"):
        Ladder(
            max_loss_pct=5,
            tiers=(Tier(trigger_pct=10, lock_hw_pct=40), Tier(trigger_pct=10, lock_hw_pct=60)),
        )


def test_locking_over_100_percent_is_refused():
    """A floor above the high-water mark closes the moment it is armed."""
    with pytest.raises(ValueError, match="above the high-water mark"):
        Ladder(max_loss_pct=5, tiers=(Tier(trigger_pct=10, lock_hw_pct=101),))


def test_a_negative_or_zero_max_loss_is_refused():
    with pytest.raises(ValueError, match="positive distance below entry"):
        Ladder(max_loss_pct=0)


def test_a_trigger_at_or_below_entry_is_refused():
    with pytest.raises(ValueError, match="above entry"):
        Ladder(max_loss_pct=5, tiers=(Tier(trigger_pct=0, lock_hw_pct=50),))


# -- phase 1: survive -----------------------------------------------------------


def test_phase1_cuts_a_loser_at_the_hard_floor():
    state = run(LADDER, entry=100.0, values=[99.0, 95.0, 91.9])
    assert state.closed is CloseReason.PHASE1_STOP


def test_phase1_holds_just_inside_the_floor():
    """-7.9% against an 8% floor must survive. An off-by-one here cuts winners
    early and the loss gets blamed on the market."""
    state = run(LADDER, entry=100.0, values=[92.1])
    assert state.closed is None
    assert state.phase == 1


def test_the_floor_is_inclusive_at_exactly_max_loss():
    state = run(LADDER, entry=100.0, values=[92.0])
    assert state.closed is CloseReason.PHASE1_STOP


def test_phase1_floor_sits_below_entry():
    assert floor_pct(LADDER, open_position(100.0)) == -8.0


# -- phase 2: lock --------------------------------------------------------------


def test_reaching_the_first_trigger_arms_phase_two():
    state = run(LADDER, entry=100.0, values=[105.0, 110.0])
    assert state.phase == 2
    assert state.tier_index == 0


def test_an_armed_rung_locks_a_share_of_the_peak():
    """Peak +10%, first rung locks 40% of it -> floor at +4%."""
    state = run(LADDER, entry=100.0, values=[110.0])
    assert floor_pct(LADDER, state) == pytest.approx(4.0)


def test_falling_back_through_a_locked_rung_closes_as_tier_breach():
    state = run(LADDER, entry=100.0, values=[110.0, 103.0])
    assert state.closed is CloseReason.TIER_BREACH


def test_a_winner_that_keeps_running_is_not_cut():
    state = run(LADDER, entry=100.0, values=[110.0, 130.0, 160.0, 200.0])
    assert state.closed is None
    assert state.tier_index == 1  # cleared the +50% rung


def test_the_ratchet_only_ever_tightens():
    """A pullback must not un-arm a rung the peak already earned."""
    state = run(LADDER, entry=100.0, values=[160.0, 140.0])
    assert state.tier_index == 1
    assert state.peak_pct == pytest.approx(60.0)


def test_a_higher_rung_raises_the_floor():
    """Peak +60%, second rung locks 85% -> floor at +51%, far above the +24%
    the first rung would have held. This is the 'banking a growing share' part."""
    state = run(LADDER, entry=100.0, values=[160.0])
    assert floor_pct(LADDER, state) == pytest.approx(51.0)


def test_a_spike_and_collapse_inside_one_tick_does_not_arm_a_rung_it_never_held():
    """Evaluation order matters: the breach check runs before tier advance.

    The observation is a single value, so a move that ends below the phase-1
    floor closes there -- it does not first arm a rung on the strength of a
    peak the position never actually held at tick boundaries.
    """
    state = run(LADDER, entry=100.0, values=[80.0])
    assert state.closed is CloseReason.PHASE1_STOP
    assert state.tier_index == -1


# -- time-based exits -----------------------------------------------------------


def test_hard_timeout_closes_a_position_that_is_merely_fine():
    ladder = Ladder(max_loss_pct=20, hard_timeout=3)
    state = run(ladder, entry=100.0, values=[101.0, 102.0, 103.0, 104.0])
    assert state.closed is CloseReason.HARD_TIMEOUT
    assert state.ticks == 3


def test_weak_peak_cuts_dead_weight():
    """Never got going: by tick 3 the peak never cleared 3%."""
    ladder = Ladder(max_loss_pct=20, weak_peak_after=3, weak_peak_min_pct=3.0)
    state = run(ladder, entry=100.0, values=[100.5, 101.0, 100.8])
    assert state.closed is CloseReason.WEAK_PEAK


def test_weak_peak_spares_something_that_did_get_going():
    ladder = Ladder(
        max_loss_pct=20,
        weak_peak_after=3,
        weak_peak_min_pct=3.0,
        tiers=(Tier(trigger_pct=4, lock_hw_pct=40),),
    )
    state = run(ladder, entry=100.0, values=[105.0, 104.0, 104.5])
    assert state.closed is None


def test_timeout_beats_a_breach_on_the_same_tick():
    """Order is timeout, dead weight, breach, advance. Pinning it so a later
    reorder is a failing test rather than a silent change in close reasons."""
    ladder = Ladder(max_loss_pct=5, hard_timeout=2)
    state = run(ladder, entry=100.0, values=[101.0, 50.0])
    assert state.closed is CloseReason.HARD_TIMEOUT


# -- purity ---------------------------------------------------------------------


def test_tick_does_not_mutate_the_state_it_is_given():
    before = open_position(100.0)
    tick(LADDER, before, 110.0)
    assert before.peak_pct == 0.0
    assert before.tier_index == -1
    assert before.ticks == 0


def test_ticking_a_closed_position_is_a_no_op():
    closed = run(LADDER, entry=100.0, values=[90.0])
    assert tick(LADDER, closed, 200.0) is closed


def test_entry_must_be_positive():
    with pytest.raises(ValueError):
        open_position(0.0)


def test_a_ladder_with_no_tiers_is_pure_phase_one():
    """Valid and useful: a plain stop-loss with no trailing at all."""
    ladder = Ladder(max_loss_pct=10)
    assert run(ladder, entry=100.0, values=[200.0, 150.0]).closed is None
    assert run(ladder, entry=100.0, values=[89.0]).closed is CloseReason.PHASE1_STOP
