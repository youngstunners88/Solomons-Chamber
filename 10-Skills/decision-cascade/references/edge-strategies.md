# Where the edges actually are: Minara, Senpi, Laya, and our own ledger

The brief was to find the best edges available to us across the three systems.
This is that analysis. It starts with the two findings that eliminate most of
the obvious answers, because a strategy list that ignores them is decoration.

---

## Finding 1 — speed is not an edge we can buy

TradeCC's edge inventory records `LATENCY_RACE` as the binding constraint on
**7 of 14** candidate strategies: cross-DEX arbitrage, sniping new launches,
liquidation hunting, stablecoin depeg, CEX-DEX listing arbitrage, routing/fee-tier
arbitrage, and MEV/sandwiching. Its recorded definition:

> *"Applies where being FIRST is the edge — the winner is decided by physical
> proximity and execution speed, not by analysis. A $5-$10 retail trader on
> public RPC is structurally last in queue."*

The best decision latency in the laya-mlx repository is **~7–18 ms, on hardware
we do not have**. A co-located HFT path is microseconds. We are three to four
orders of magnitude away, and the gap is *physical* — it is about where the
machine sits, not how fast the model thinks.

**So: a faster decision model does not unlock a single one of those seven.** Any
plan that starts "now that we have a 10ms model, we can compete on speed"
contradicts our own measured ledger. The honest version of "high frequency" for
us is **high throughput** — assessing many candidates per second — which is a
different capability and is not blocked by proximity.

## Finding 2 — a decision model cannot manufacture an edge that is not in its input

Measured in this vault, not asserted:

- Jev answered the copy-trading constraint question **wrong three times at
  0.76–0.84 confidence** when the deciding measurement was absent from the
  prompt. Not a hard question — an unanswerable one, asked as though it were
  answerable.
- Supplying the measured evidence inside each option took the same 14-case task
  from **59% → 86%**.
- Two of those 14 cases stayed wrong in *every* evidenced arm, because their
  recorded answers **are not derivable from the candidate description**. That
  was a flaw in the eval, not the model.

**The classifier is not the edge. The data is.** The model's job is to judge what
you give it, fast and calibrated. Everything below respects that.

---

## What each system actually contributes

| System | Tradeable edge? | What it really contributes |
|---|---|---|
| **Minara** | No | Safety machinery: two-turn confirmation, analysis/execution boundary, anti-loop, scam/address checks. Already harvested into `irreversibility-harness`. |
| **Senpi** | **Partly — the exit and risk layer** | The DSL ratchet, risk guard rails with reason codes, telemetry-driven self-review, and the "scanner proposes, runtime disposes" split. |
| **Laya** | No, but it changes the economics | Free, pinnable, local, no egress. Makes volume and calibration cheap. |

Senpi is the only one of the three with a claim to an actual trading edge, and
it is worth being precise about *where* that claim sits. From their README:

> *"Phase 1 — survive… Phase 2 — lock… That asymmetry — lose small, let winners
> run — is the engine behind every strategy template."*

**The edge they name is the exit, not the entry.** 114 strategy packages, and
the thing they say drives all of them is a stop-loss ladder. That is a strong
signal about where effort pays.

---

## The five edges that survive

### 1. Exit asymmetry — the highest-confidence, lowest-cost edge available

**Already built**: `irreversibility-harness/scripts/ratchet.py`, pure function,
24 tests, mutation-verified.

Phase 1 cuts losers at a hard floor from entry; phase 2 ratchets a floor up a
share of the high-water mark as a winner runs. It requires **no speed, no
proprietary data, and no model**. It is arithmetic over a series.

Two footguns already encoded as construction-time refusals, both from Senpi's
own warnings: a tier locking 0% *"exits flat while still paying both fees"*, and
an unsorted ladder silently applies the wrong rung.

> **Do this first.** It is the only item on this list with no external
> dependency, and Senpi — with 114 live strategies — says it is what makes them
> work.

### 2. Turnover braking — because fees are the quiet killer

Senpi: *"max-entries-per-day plus consecutive-loss and per-asset cooldowns
throttle overtrading, because fees are the quiet killer of every bot."*

This compounds directly with our own `DETECTION_FLOOR` finding: detecting any
edge at 95/80 takes `7.8489 × (σ/μ)²` round trips, and our measured noise ratio
is **1.33–1.55**. Every unnecessary round trip pays fees *and* adds variance to
a measurement that is already underpowered. A turnover brake is a variance
reduction technique that happens to look like a risk control.

**Not yet built.** Natural next module, and it composes with the ratchet.

### 3. Reason codes on every rejection — the compounding one

Senpi logs every blocked signal with `no_slots`, `no_margin`, `risk_gate_*`,
`asset_banned`, and every exit with a typed close reason. That is what makes
`senpi-improve-trades` possible — an agent mining its own telemetry for exit
quality, leaks and protection gaps.

**A rejection without a reason code is a decision you cannot learn from.** This is
the cheapest thing on the list to add and the only one whose value *grows* with
time. `ratchet.py` already emits typed `CloseReason`s; `cascade.py` emits typed
`Resolution`s; `confirm_gate.py` emits typed `Outcome`s. The pattern is
established — extend it to entries.

### 4. Throughput screening — the honest reading of "high frequency"

Batched: **402 q/s** on the multilingual checkpoint versus 81.7 single-shot, a
~5x gain that only appears at volume. Plus `shortlist.py`, which exists because
*"choice options share one head_max_len budget, so a large label set leaves only
a few tokens per label"* — embed, keep top-k, then run one typed decision over
the reduced set.

That is a **coarse-to-fine screen over a universe**: cheap embedding filter →
typed decision on the survivors. It is the right shape for "rank 2,000
candidates", and it is not blocked by `LATENCY_RACE` because nobody is racing us
to an opinion.

**Blocked on hardware** (see landscape doc): needs a GPU or Apple Silicon to beat
the remote path at all.

### 5. Calibration as the edge itself

The unglamorous one. Most systems that emit a confidence have never checked
whether 0.78 means 78%. We have `calibration.py`, which refuses to certify below
a derived floor of `(1.96/(2·tolerance))²` per bin — 97 for a 10-point error.

Local weights are what make clearing that floor affordable: free inference and
no rate limit turn a 385-sample-per-bin requirement from a budget line into a
loop. **Knowing what your probabilities mean is worth more than a slightly better
classifier**, because it is what lets you size positions off them.

---

## What NOT to do

- **Do not build toward co-located execution.** Seven of our fourteen recorded
  strategies die on proximity, and no model fixes that.
- **Do not port Senpi's strategy packages.** Inert without their closed-source
  supervisor, and pointed at live perps trading which our rules forbid before
  the validation gate. Jev scored this 0.000.
- **Do not install local weights before establishing hardware.** On CPU it is a
  latency *regression* against what we already use.
- **Do not treat Laya's AG News accuracy as accuracy on our task.** The repo
  itself notes AG News is in upstream's training mix.
- **Do not quote the 59/60 back-test figure.** It excludes two cases chosen
  *after* seeing which failed — the cherry-picking TradeCC's protocol forbids by
  name. It is a hypothesis for a pre-registered re-run.

---

## Recommended order

| # | Edge | Depends on | Status |
|---|---|---|---|
| 1 | Exit ratchet | nothing | **built**, 24 tests |
| 2 | Reason codes on entries | nothing | pattern established, not extended |
| 3 | Turnover brake | nothing | not built |
| 4 | Calibration at volume | local weights → hardware | harness built, samples blocked |
| 5 | Throughput screening | GPU / Apple Silicon | blocked |

The first three need no hardware, no vendor, and no egress decision. They are
also, per Senpi's own account, where the edge in 114 live strategies actually
comes from.

**One open question that is yours, not mine:** is there a GPU or an Apple Silicon
machine available? Items 4 and 5 turn on that single fact, and everything above
them proceeds regardless.
