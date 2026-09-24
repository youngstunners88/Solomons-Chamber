---
name: decision-cascade
description: |
  Route a typed decision through tiers — deterministic filter, local model,
  remote model, human — with explicit latency and cost budgets, and a
  break-even test that tells you when the cascade is making things WORSE.

  Load this before adding a "fast local model in front of the good one", before
  promising a latency improvement, or when deciding where a decision model can
  and cannot buy an edge.

  Built after finding that Laya (open-weight, Apache-2.0) and Jev/TypeSafe are
  the same architecture family — identical `choice`/`score`/`noul` primitives,
  same RLCD training. The thing we rent per call has an open-weight twin.

allowed-tools: Bash Read

usage: |
  # What this machine can actually run
  python3 10-Skills/decision-cascade/scripts/backends.py

  # The tests, including the break-even maths
  python3 -m pytest 10-Skills/decision-cascade/tests -q

  # The landscape, the numbers, and where the edges actually are
  cat 10-Skills/decision-cascade/references/decision-model-landscape.md
  cat 10-Skills/decision-cascade/references/edge-strategies.md
---

# The decision cascade

## The one formula

A two-tier cascade costs `L1 + p·L2`. Calling the good tier directly costs `L2`.
So the cheap tier only earns its place when:

```
p  <  1 − L1/L2          # p = fraction of calls that escalate
```

**A cheap tier at half the latency must resolve more than half of all calls, or
it is strictly slower AND strictly more expensive than not existing.** That is
arithmetic, not a heuristic, and `CascadeStats.verdict()` checks it against
measured traffic.

Most "add a fast model in front" designs are never tested against this line. Run
it before you claim a speedup.

## Why this exists: the number that kills the obvious plan

The obvious plan is "run Laya locally, it's 10ms instead of 347ms." Here is what
the measurements actually say:

| Path | Latency | Runs here? |
|---|---|---|
| Jev via OpenRouter | **347 ms** median (our own 5-call measurement) | yes |
| Laya PyTorch, CPU | 193–464 ms (upstream) | yes, with `pip install laya` |
| Laya PyTorch, T4 GPU | 32.8 ms (upstream) | needs CUDA |
| laya-mlx FP16, M3 Max | 10.9–17.8 ms (`BENCHMARKS.md`) | **no — Apple Silicon only** |
| laya-mlx FP16, M3 Max | 7.4–13.4 ms (`README.md`) | same config, **different number** |

Three things follow, and none of them is the obvious plan:

1. **On CPU, local is not faster than remote.** 193–464 ms against 347 ms. Put
   CPU-local in front of Jev and `break_even_escalation_rate` returns a
   **negative** number — no escalation rate redeems it. The cascade says
   `DELETE`.
2. **The speed win needs a GPU**, and the headline win needs Apple Silicon,
   which this environment is not. `probe()` reports that instead of assuming.
3. **The repo's own two numbers disagree** for the same configuration. Neither
   is a default here. Budget from `calibrate_latency()` on your own hardware,
   against **p95, not p50** — a tier budgeted at its median blows its deadline
   half the time.

## Where the real win is, and it is not latency

Local open weights buy three things that matter more than milliseconds:

- **Cost → zero, rate limit → none.** This is what makes *calibration* possible.
  `calibration.py` needs ~97 samples per bin for a 10-point error and 385 for 5.
  At metered per-call pricing over a network that is a project; locally it is a
  loop.
- **A pinned checkpoint.** The remote route asks for the floating alias
  `jev-latest`. A silent upstream upgrade moves every calibrated threshold
  without a line of code changing. Local weights have a hash.
- **No egress.** Candidate data never leaves the machine — which is exactly the
  blocker that has Hydra wallet scoring stalled.

## What it will NOT do

It will not win a latency race. TradeCC's own edge inventory records
`LATENCY_RACE` as the binding constraint on **7 of 14** candidate strategies,
defined as decided by *"physical proximity and execution speed, not by
analysis"*. A 10 ms decision is three to four orders of magnitude from a
co-located path. Making the analysis faster does not touch a constraint that is
about where your machine physically is.

**A decision model cannot manufacture an edge that is not in its input.** Our own
back-test is the proof: Jev answered one question wrong three times at 0.76–0.84
confidence because the deciding measurement was absent from the prompt, and
supplying evidence moved the same task from 59% to 86%. The model judges what
you give it. The edge lives in the data, not the classifier.

See `references/edge-strategies.md` for what that leaves, which is more than it
sounds.

## Using it

```python
from cascade import Cascade, Gate, Tier

casc = Cascade(
    tiers=[
        Tier("rules",  rules_backend,  expected_latency_ms=0.2),
        Tier("local",  laya_backend,   expected_latency_ms=14.0),
        Tier("remote", jev_backend,    expected_latency_ms=347.0,
             cost_per_call_usd=0.000056),
    ],
    gate=Gate(min_margin=0.25, min_confidence=0.40),
)

result = casc.decide(state, question, deadline_ms=500)
if not result.ok:
    escalate_to_human(result)

print(casc.audit())   # break-even verdict per adjacent pair
```

Every `expected_latency_ms` must be **measured**. `Tier` refuses a
non-positive value, because budgeting against a placeholder is how a deadline
gets blown.

## Design notes worth keeping

- **Deadline accounting happens before the call, not after.** The cascade
  refuses to *start* a tier the remaining budget cannot finish, and returns
  `DEADLINE` carrying the best answer it already has. A cascade without this
  turns the fast path slow exactly when it is under pressure.
- **Margin AND confidence**, same as `jev_router.ActionGate`. Margin alone
  misses a leader winning a wide race with 35% of the mass; confidence alone
  misses a 0.51/0.49 split.
- **Float tolerance of 1e-9**, inclusive. `0.45 - 0.40` is `0.04999999999999999`
  and would otherwise be refused at its own threshold — a refusal that gets
  blamed on the model. Both the margin and confidence paths are
  mutation-verified; an early version of that test set `min_confidence=0.0` and
  so asserted the right verdict for the wrong reason, and a mutation survived it.
- **`probe()` never suggests a latency it did not measure.** Every
  `suggested_latency_ms` is `None` by construction, with a test pinning it.

33 tests. Seven guards mutation-verified, all caught.

## See also

- `references/decision-model-landscape.md` — Laya vs Jev, the shared lineage,
  the licence position, and what is actually installable.
- `references/edge-strategies.md` — the deep analysis of Minara and Senpi, and
  the five edges that survive contact with our own ledger.
- `10-Skills/jev-router/` — the lane router and per-action gates this extends.
- `10-Skills/irreversibility-harness/` — what happens after a gate passes and
  something irreversible is about to run.
