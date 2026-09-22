# The decision-model landscape: Laya, Jev, and what we can actually run

Research date **2026-09-22**. Facts are separated from conclusions throughout.

## The finding

`laya-mlx` is an MLX port of **Laya** (Convai Innovations, Apache-2.0). Reading
its source next to what we already measured about Jev/TypeSafe, the two are the
**same architecture family**:

| | Jev / TypeSafe | Laya |
|---|---|---|
| Primitives | `choice`, `score`, `noul` | `choice`, `score`, `noul` — `QTYPES = {"choice": 0, "score": 1, "noul": 2}` |
| Framing | "System One" — endpoint `/v1/systemone` | "System 1 decision engine" — method `system_one()` |
| Training | RLCD | *"reinforcement learning against strictly proper scoring rules (RLCD)"* |
| Output | calibrated probabilities over a closed set, no generated tokens | same; *"0 output tokens"* |
| Weights | closed, metered per call | **open, Apache-2.0, on Hugging Face** |

`noul` is not a word anyone arrives at independently. Same lineage.

**What this means practically:** the decision lane we currently rent per call
has an open-weight equivalent we can run in-process. That is the whole reason
this was worth a day.

> **Not claimed:** that Laya and Jev are the *same model*, or that one is a fork
> of the other. Jev's weights are closed and its exact training set unknown, so
> parity is untested. What is established is that they are the same *kind* of
> model with the same interface — which is enough to make Laya a candidate tier
> in a cascade, and not enough to assume equal accuracy on our questions.

## The repository

`github.com/mizorewww/laya-mlx` — 6 commits, 134 files, Apache-2.0, an
**independent port**, explicitly *"not an official Convai Innovations release"*.
`NOTICE` names the upstream revision it derives from. The neural network is
reimplemented in MLX; tokenisation uses HF's Rust tokenizer; weights download
separately.

Quality signals, as published:

- **Port fidelity:** all three checkpoints matched upstream's selected answer on
  **63/63 validation questions in FP32 and FP16** (378/378 comparisons), plus
  100 repeated calls with zero measured active-memory growth.
- **AG News, 256 examples:** 0.9570 / 0.9453 / 0.9648 accuracy across the three
  checkpoints, with **256/256 prediction agreement** between backends. The repo
  itself notes AG News appears in upstream's training mix — so this measures
  *port fidelity*, not generalisation. Read it that way.
- Three checkpoints: `laya` (ModernBERT-large, 421M, 512 ctx, English),
  `laya-multilingual` (mmBERT-base, 322M, 1024 ctx, 100+ languages),
  `laya-typed-decisions` (421M, 1024 ctx).

## The numbers, and the discrepancy

| Config | README | BENCHMARKS.md |
|---|---:|---:|
| `laya`, 1 short question, P50 | **13.42 ms** | **17.75 ms** |
| `laya-multilingual`, 1 short question, P50 | **7.39 ms** | **10.91 ms** |

Same hardware described (M3 Max), same configuration named, **different
numbers**. The README figures may come from a later optimised run; nothing in
the repo reconciles them. Neither is used as a default in `backends.py`.

Throughput scales far better than single-shot latency:

| Checkpoint | 1 q | 50 q batched |
|---|---:|---:|
| `laya` | 54.9 q/s | 143.3 q/s |
| `laya-multilingual` | 81.7 q/s | **402.2 q/s** |

**~5x from batching.** That is the number that matters for screening a universe,
and it is a different capability from answering one question fast.

### What MLX actually buys

| Checkpoint, 1 question | PyTorch MPS FP32 | MLX FP16 | Gain |
|---|---:|---:|---:|
| `laya` | 22.70 ms | 17.75 ms | ~22% |
| `laya-multilingual` | 13.60 ms | 10.91 ms | ~20% |

**MLX is worth about 20–25% over PyTorch on the same Apple hardware.** It is not
where the order-of-magnitude lives. The order of magnitude is *running locally
at all* versus a network round trip — and that part needs no MLX.

This reframes the whole thing: **we do not need Apple Silicon to capture the main
benefit.** We need local weights.

## What this machine can run

```
host: Linux/x86_64 py3.11.15
  -  laya_mlx:   host is Linux/x86_64. mlx is gated to darwin+arm64.
  -  laya_torch: needs `pip install laya` (torch present: False)
  OK jev_remote: ready
```

- **`laya-mlx` cannot install here.** Its dependency line is
  `mlx>=0.32.2,<0.33; sys_platform == 'darwin' and platform_machine == 'arm64'`.
  Verified, not assumed: `import mlx` → `ModuleNotFoundError`.
- **Upstream `laya` is the portable path** — `pip install laya`, PyTorch 2.14+,
  CPU or CUDA, Linux fully supported. Not installed here (no torch), and
  installing it is a real decision: torch is a multi-GB dependency and this
  container's disk is a fixed per-session allowance.
- **CPU-local would be slower than what we already use.** 193–464 ms against a
  measured 347 ms for Jev over OpenRouter.

## What would have to be true to adopt it

Ordered by what is cheapest to find out:

1. **A GPU, or Apple Silicon.** Without one, local Laya is a latency
   *regression*. This is the gate; everything else is downstream of it.
2. **Accuracy parity on OUR questions.** The AG News figure says nothing about
   the strategy-intake task we actually measured Jev on. The honest test is the
   existing three-arm back-test harness (`evals/backtest_intake.py`, 14 recorded
   verdicts) re-run against a Laya backend. That harness already exists; it
   needs a backend adapter and a machine that can run one.
3. **Its own calibration.** Jev's RLCD calibration is a claim about TypeSafe's
   distribution; Laya's is a claim about Convai's. Neither is a claim about
   ours. `calibration.py` already refuses to certify below 97 samples per bin —
   and free local inference is what makes clearing that floor practical.

Until (1) holds, the correct action is **the cascade reports `DELETE` on a local
tier** and we keep using the remote one. That is not a failure of the
investigation; it is the investigation working.

## Licence position

Apache-2.0 throughout: upstream Laya, the MLX port, and the published
checkpoints. Self-hosting is explicitly permitted. `NOTICE` must be preserved if
we vendor any of it — we have not vendored any, only read it.
