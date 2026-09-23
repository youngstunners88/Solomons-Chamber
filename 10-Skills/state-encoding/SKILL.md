---
name: state-encoding
description: |
  Turn numbers into a small, stable set of words before they reach a decision
  model. Code does the arithmetic against cut points that live in code; the
  model sees one word per band. Load before sending ANY numeric state to Jev
  or another closed-set model, and before adding a field to a model's state.
allowed-tools: Bash Read
usage: |
  python3 -m pytest 10-Skills/state-encoding/tests -q
---

# State encoding: numbers in code, words to the model

## Why

- **Models read tokens, not numbers.** The same number splits differently
  depending on its neighbours; the classic failure is 9.11 judged larger than
  9.9. TypeSafe documents Jev as unreliable at maths, counting and date
  ordering.
- **Every word is a dimension the answer can flip on**, and a flip in a
  trading loop is a fee.

## The mechanism (`scripts/encode.py`)

```python
depth = Band("slippage", cuts=(0.006,), labels=("deep", "thin"))
move  = Band("ret15", cuts=(-0.02, 0.02), labels=("dumping", "flat", "pumping"),
             deadband=0.004)
Encoder([depth, move]).state({"slippage": 0.0087, "ret15": 0.034})  # "thin pumping"
```

Enforced at construction or on every call:

| Rule | Why |
|---|---|
| Cuts strictly increasing, one more label than cuts | an unordered band is a silent bug |
| Labels: one lowercase word, distinct | the state is words, not phrases |
| A cut belongs to the band **above** it | stated once, not per call site |
| NaN / inf / None / strings **refused** | a missing input quietly becoming the lowest band is a confident answer built on nothing |
| Every input must have a band, and every band an input | an unbanded input is one the model silently never sees |
| **Hysteresis** (`deadband`) | a value hovering at a cut must clear it by the margin before the word moves |

## Measure the state's cost; don't guess a word budget

`flip_rate(states)` gives, per word, the fraction of ticks it changed on. A
test shows hysteresis measurably cuts flips on a noisy series. Pick cuts,
deadbands and the number of words from **this number**. "Twelve words" is one
person's anecdote; your flip rate is a measurement.

## Where this bites us already

Hydra's sealed experiment `permutation-brier-v1` sends Jev three **raw
decimals** (`value_pls`, `balance_pls`, `fraction_sent`). It is sealed and
stays as it is. An encoded-state arm is a candidate **v2**: new rule id, new
journal action, sealed before its first row. It is then directly comparable
against v1's Brier.
