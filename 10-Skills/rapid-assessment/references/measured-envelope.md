# The measured capacity envelope — 2026-09-22

Method, raw numbers, and the prediction I got wrong. Run against `jev-latest`
over OpenRouter from an x86_64 Linux container, 3 repeats per shape, medians
reported.

## Why this was measured at all

`ryana/jevify` is not a codebase — it is a one-file investigation methodology.
Its instruction that drove this work:

> *"Do not assume that more questions are free, that batching scales
> indefinitely, or that provider-side parallelism eliminates client-visible
> costs."*

Against TypeSafe's own fan-out documentation:

> *"All questions are evaluated in parallel, so adding more questions usually
> has little effect on response time."*

One is a vendor claim, the other a warning not to trust it. Neither had been
tested on our workload, so this measured it.

## Pre-registered predictions

Written before running, in the script header:

| | Prediction | Outcome |
|---|---|---|
| **P1** | Latency at N=32 will exceed **1.5×** that of N=1 — the vendor claim is too strong | **FALSIFIED** — 1.05× |
| **P2** | Growth will be strongly sub-linear, under 8× | **HELD** — 1.05× |
| **P3** | Option count also costs latency: K=200 slower than K=2 | HELD, but weakly — 1.19× |

**Decision rule, fixed in advance:** batching is worth using if per-question
latency at N=16 is below 50% of per-question latency at N=1. Measured: **6.4%**.
Adopted.

**P1 is the interesting one.** I expected the vendor to be overselling and said
so in writing first. They were not. The instinct to discount a marketing claim
is not itself evidence, and pre-registering is what turned that from a vague
prior into a recorded miss.

## Arm A — question count (2 options each)

| N | p50 | per-question | cost |
|---|---|---|---|
| 1 | 996.1 ms | 996.1 ms | $0.000017 |
| 2 | 1095.4 ms | 547.7 ms | $0.000021 |
| 4 | 1081.2 ms | 270.3 ms | $0.000029 |
| 8 | 967.7 ms | 121.0 ms | $0.000045 |
| 16 | 1012.9 ms | 63.3 ms | $0.000078 |
| 32 | 1045.6 ms | 32.7 ms | $0.000143 |

**32× the questions for 1.05× the latency and 8.5× the cost.** Cost grows
sub-linearly too — the state is sent once and amortised across every question.

## Arm B — option count (one choice question)

| K | p50 |
|---|---|
| 2 | 386.4 ms |
| 5 | 480.7 ms |
| 10 | 430.3 ms |
| 25 | 439.6 ms |
| 50 | 468.4 ms |
| 100 | 439.9 ms |
| 200 | 459.4 ms |

100× the options for **1.19×** the latency, and the curve is flat enough that
the ordering between K=5 and K=100 is inside the noise.

## The ceiling — binary search per question count

Composition failed where neither arm predicted: 32 questions × 100 options
returned **HTTP 400 `max_tokens_exceeded`**. Binary searching each row:

| Questions | Max options | Total judgements | p50 at that shape |
|---|---|---|---|
| 1 | 255 | 255 | 507 ms |
| 2 | 255 | 510 | 715 ms |
| 4 | 255 | 1,020 | 730 ms |
| 8 | 255 | 2,040 | 1,806 ms |
| 16 | 159 | 2,544 | 1,551 ms |
| 32 | 79 | 2,528 | 8,897 ms |

Three conclusions:

1. **Rows 1–8 hit the documented 255 cap**, not the token budget — 255 accepted,
   256 refused, every time.
2. **Rows 16 and 32 hit a token budget.** Totals flat at ~2,530 across both is
   what proves it is tokens rather than any count.
3. **The 32-question row is a trap.** Same total work as 16, **5.7× the
   latency**. The latency cliff is not at either ceiling, which is why
   `best_shape()` caps questions at 16 rather than at what merely fits.

Throughput optimum: **16 × 159 = 2,544 judgements in 1,551 ms ≈ 1,640/second.**

## Planner validated against the live API

Both directions, 8 shapes:

| Shape | Planner | Live API | |
|---|---|---|---|
| 1 × 255 | OK | OK | ✓ |
| 4 × 255 | OK | OK | ✓ |
| 8 × 250 | OK | OK | ✓ |
| 16 × 125 | OK | OK | ✓ |
| 16 × 200 | REFUSED | 400 | ✓ |
| 16 × 255 | REFUSED | 400 | ✓ |
| 32 × 120 | REFUSED | 400 | ✓ |
| 32 × 79 | REFUSED | OK | ✓ conservative |

**Never let a 400 through: 8/8.** The one disagreement is the planner refusing a
shape that works — deliberately, because it is the latency-cliff shape.

## What is NOT established

- **Accuracy at width.** This is a capacity envelope, not a quality one. Whether
  Jev discriminates as well across 255 options as across 5 is **unmeasured**,
  and it is the obvious next experiment: re-run the existing three-arm intake
  back-test at varying option widths. Until then a 255-way ranking is a screen,
  not a verdict.
- **Stability of absolute latency.** The same 1×2 shape measured 386 ms, 557 ms
  and 996 ms in three different runs — ~2.5× spread. Token ceilings were stable
  across runs; timings were not. Only within-run ratios are used anywhere.
- **Longer option descriptions.** All of these used ~8-token descriptions.
  Realistic descriptions will hit the token ceiling sooner, which is why the
  safe budget is set to 2,000 against a measured ~2,540.
- **Whether OpenRouter or TypeSafe-direct differ here.** Only the OpenRouter
  route was measured.

## A defect this surfaced in our own client

`jev_client.Question` requires at least 2 criteria, so it can express `choice`
but **not `noul` or `score`** — two of Jev's three documented primitives. The
batching experiment had to be rewritten to use two-option choice questions
standing in for yes/no. Worth fixing; it means a third of the API is currently
unreachable from this vault.
