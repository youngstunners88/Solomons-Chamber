---
name: rapid-assessment
description: |
  Evaluate many candidates against many criteria in ONE request, using the
  measured capacity envelope of Jev's batching rather than guessing at it.

  Load this before scoring, ranking, screening, triaging or filtering more than
  a handful of things — and before assuming you need a GPU to do it fast.

  Headline, measured 2026-09-22: **2,544 option-judgements in 1,551 ms from a
  single request** — about 1,640 judgements/second, on an ordinary Linux box
  with no accelerator of any kind.

allowed-tools: Bash Read

usage: |
  # Plan a batch that will actually fit
  python3 -c "import sys; sys.path.insert(0,'10-Skills/rapid-assessment/scripts'); \
              from budget import describe_plan; print(describe_plan(list(range(5000)), 3))"

  python3 -m pytest 10-Skills/rapid-assessment/tests -q

  # The full measurement, including the prediction I got wrong
  cat 10-Skills/rapid-assessment/references/measured-envelope.md
---

# Rapid assessment

## The finding

Jev's latency is **almost flat** in the amount of work you give it, right up to
a hard ceiling where the request fails outright.

| What I varied | From | To | Latency change |
|---|---|---|---|
| Questions per request (2 options each) | 1 | 32 | **1.05×** |
| Options in one question | 2 | 200 | **1.19×** |

32 questions cost 5% more wall-clock than one. Per-question latency fell to
**6.4%** of the single-question figure. That is not a marginal optimisation —
it is the difference between assessing one thing and assessing a universe for
the same money and the same second.

> **I predicted this was vendor overreach and I was wrong.** TypeSafe's fan-out
> doc claims *"adding more questions usually has little effect on response
> time"*, and jevify's methodology says explicitly not to assume batching scales.
> So I pre-registered: *latency at N=32 will exceed 1.5× that of N=1.* It came
> in at **1.05×**. Prediction falsified; the vendor claim held. Recorded in
> `references/measured-envelope.md` rather than quietly dropped.

## But it does NOT scale indefinitely

Jevify was right to warn, just not where I expected. Push past the envelope and
the API returns **HTTP 400 `max_tokens_exceeded`** — no truncation, no
degradation, a wasted round trip.

Binary search found the real shape of it:

| Questions | Max options each | Option-judgements | p50 |
|---|---|---|---|
| 1 | 255 | 255 | 507 ms |
| 2 | 255 | 510 | 715 ms |
| 4 | 255 | 1,020 | 730 ms |
| 8 | 255 | 2,040 | 1,806 ms |
| **16** | **159** | **2,544** | **1,551 ms** |
| 32 | 79 | 2,528 | **8,897 ms** |

**Two separate ceilings:**

1. **255 options per choice question** — documented, hard, per question.
2. **~2,500 option-judgements per request** — undocumented, and a *token*
   budget. The total going flat from 16 questions upward is what proves it is
   tokens and not a count of anything.

**And a trap that is not at either ceiling:** 32 questions fits the same total
work as 16 and takes **5.7× longer**. More questions is not monotonically
better. `best_shape()` caps at 16 for this reason.

## Use it

```python
from budget import best_shape, plan_ranking, describe_plan

plan_ranking(candidates, dimensions=3)   # chunks that each fit one request
best_shape(len(candidates), dimensions=3)
describe_plan(candidates, dimensions=3)
```

`RequestShape.validate()` refuses anything that would 400. **Validated against
the live API in both directions, 8/8**: every shape it passes succeeded, every
shape the API rejected it had already refused. Where it is wrong it is
conservative — it refuses 32×79, which works but sits on the latency cliff.

## About the GPU you don't have

You don't need one for this.

The reason to want local weights was latency. Measured on this hardware, with
no accelerator: **1,640 option-judgements/second** through batching. An NVIDIA
T4 running Laya gives 32.8 ms per *unbatched* decision — roughly 30 decisions/s.
Batching the remote model already beats buying a GPU for throughput work.

**What a GPU would still buy you** is the one thing batching cannot: keeping
data off the wire. That is the Hydra blocker, and it is an egress question, not
a speed question. `references/onnx-cpu-workaround.md` has the fork path for it —
int8 ONNX on CPU, because these are single-pass BERT-family encoders, not
autoregressive decoders. **That path is designed but NOT measured**; say the
word and I'll install the toolchain and get real numbers.

## What to reach for

| Need | Shape |
|---|---|
| Rank/screen a universe | 1 question × up to 255 options, chunked by `plan_ranking` |
| Score one thing on many axes | up to 16 questions × few options |
| Both | ≤16 questions, options from `max_options_for()` |

**Speculative fan-out is nearly free inside the envelope.** Ask the questions you
*might* need in the same request and let ordinary code discard the irrelevant
ones — a conditional second round trip costs more than the extra questions do.

## Caveats that matter

- **Absolute latency moved ~2.5× between runs** on identical shapes (386 / 557 /
  996 ms for the same 1×2 call). Only within-run ratios are trustworthy. Every
  millisecond here is indicative; re-measure before you budget against one.
  `decision_cascade.calibrate_latency` is how.
- **Option descriptions were short (~8 tokens).** Longer ones eat the token
  budget faster, which is why `SAFE_OPTION_JUDGEMENTS` is 2,000 against a
  measured ~2,540.
- **Jev is documented as unreliable at maths, counting, and date ordering**
  (`model-jaggedness/jev-1.13`). Do not put arithmetic in a rubric and expect it
  to hold.
- **Accuracy at 255 options is UNMEASURED.** Everything above is capacity, not
  quality. Wide option sets plausibly degrade discrimination, and the honest
  test is the existing three-arm back-test harness run at varying widths. Until
  then, treat a 255-way ranking as a screen, not a verdict.

## See also

- `references/measured-envelope.md` — full method, raw numbers, falsified prediction.
- `references/jevify-audit.md` — the jevify methodology run against this workspace.
- `10-Skills/decision-cascade/` — tiering and the break-even test.
- `10-Skills/jev-prompt-design/` — evidence in option descriptions was worth 27 points.
