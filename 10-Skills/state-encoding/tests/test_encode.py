import math
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
from encode import Band, EncodeError, Encoder, flip_rate  # noqa: E402

DEPTH = Band("slippage", (0.006,), ("deep", "thin"))
MOVE = Band("ret15", (-0.02, 0.02), ("dumping", "flat", "pumping"), deadband=0.004)


def test_the_article_example_encodes_to_words_not_numbers():
    e = Encoder([DEPTH, MOVE])
    assert e.state({"slippage": 0.0087, "ret15": 0.034}) == "thin pumping"


def test_a_cut_belongs_to_the_band_above():
    assert DEPTH.label(0.006) == "thin"
    assert DEPTH.label(0.0059999) == "deep"


def test_nan_is_refused_never_defaulted_to_the_lowest_band():
    for bad in (math.nan, math.inf, None, "0.01", True):
        with pytest.raises(EncodeError):
            DEPTH.label(bad)


def test_missing_input_is_refused():
    with pytest.raises(EncodeError, match="missing"):
        Encoder([DEPTH, MOVE]).encode({"slippage": 0.001})


def test_an_input_with_no_band_is_refused():
    """It would be an input the model silently never sees."""
    with pytest.raises(EncodeError, match="no band"):
        Encoder([DEPTH]).encode({"slippage": 0.001, "fees": 3.2})


@pytest.mark.parametrize("kw,msg", [
    (dict(cuts=(), labels=("a",)), "at least one cut"),
    (dict(cuts=(1.0,), labels=("a",)), "labels"),
    (dict(cuts=(2.0, 1.0), labels=("a", "b", "c")), "increasing"),
    (dict(cuts=(1.0,), labels=("a", "a")), "distinct"),
    (dict(cuts=(1.0,), labels=("Big", "b")), "one lowercase word"),
    (dict(cuts=(1.0,), labels=("two words", "b")), "one lowercase word"),
    (dict(cuts=(1.0, 1.1), labels=("a", "b", "c"), deadband=0.06), "overlaps"),
])
def test_bad_bands_are_refused_at_construction(kw, msg):
    with pytest.raises(EncodeError, match=msg):
        Band("x", **kw)


def test_hysteresis_holds_the_label_inside_the_deadband():
    # prev "flat"; 0.021 crosses the 0.02 cut but not by more than 0.004.
    assert MOVE.label(0.021, prev="flat") == "flat"
    assert MOVE.label(0.025, prev="flat") == "pumping"


def test_hysteresis_works_downward_too():
    assert MOVE.label(0.018, prev="pumping") == "pumping"
    assert MOVE.label(0.015, prev="pumping") == "flat"


def test_hysteresis_never_blocks_a_multi_band_jump():
    assert MOVE.label(-0.5, prev="pumping") == "dumping"


def test_no_prev_means_no_hysteresis():
    assert MOVE.label(0.021) == "pumping"


def test_word_budget_is_enforced_when_given():
    with pytest.raises(EncodeError, match="budget"):
        Encoder([DEPTH, MOVE], max_words=1)


def test_flip_rate_measures_per_word_changes():
    states = [["thin", "flat"], ["thin", "pumping"], ["deep", "flat"], ["deep", "flat"]]
    assert flip_rate(states) == [1 / 3, 2 / 3]


def test_hysteresis_measurably_reduces_flips_on_a_noisy_series():
    series = [0.019, 0.021, 0.019, 0.022, 0.018, 0.021, 0.03]
    plain = Band("r", (-0.02, 0.02), ("dumping", "flat", "pumping"))
    raw = [[plain.label(v)] for v in series]
    held, prev = [], None
    for v in series:
        prev = MOVE.label(v, prev)
        held.append([prev])
    assert flip_rate(held)[0] < flip_rate(raw)[0]


def test_flip_rate_refuses_one_state():
    with pytest.raises(EncodeError):
        flip_rate([["a"]])
