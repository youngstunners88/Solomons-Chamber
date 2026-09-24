# Running Laya locally with no GPU and no Apple Silicon

**Status: DESIGNED, NOT MEASURED.** Nothing below has been run. It is written
so it can be executed and checked, not so it can be believed.

## First: you probably don't need this

The reason to run locally was latency, and batching already solved that.
Measured on this machine with no accelerator: **1,640 option-judgements/second**
(`measured-envelope.md`). A T4 GPU running Laya unbatched gives ~30 decisions/s.

So the remaining reason to go local is **egress** — keeping candidate data off
the wire, which is the blocker on Hydra wallet scoring. That is a
confidentiality requirement, not a performance one, and it should be argued on
those terms.

## Why a CPU path is plausible

Laya's checkpoints are **encoder** models, not autoregressive decoders:

| Checkpoint | Encoder | Params | Context |
|---|---|---|---|
| `laya` | ModernBERT-large | 421M | 512 |
| `laya-multilingual` | mmBERT-base | **322M** | 1,024 |

One bidirectional forward pass, zero generated tokens. That is the workload
CPU inference is *least* bad at — there is no token-by-token loop to serialise.
Upstream publishes 193–464 ms on CPU in PyTorch FP32.

int8 dynamic quantisation typically returns 2–4× on transformer encoders on CPU.
**If** that holds here, 322M at int8 could plausibly land in the 60–200 ms band.
That "if" is the whole question and is not yet answered.

## The path

```bash
pip install torch --index-url https://download.pytorch.org/whl/cpu   # ~200MB CPU-only
pip install optimum[exporters] onnxruntime transformers

optimum-cli export onnx \
  --model convaiinnovations/laya-multilingual \
  --task feature-extraction \
  laya-onnx/

python -c "
from onnxruntime.quantization import quantize_dynamic, QuantType
quantize_dynamic('laya-onnx/model.onnx', 'laya-onnx/model.int8.onnx',
                 weight_type=QuantType.QInt8)"
```

Pick the **multilingual** checkpoint: smallest (322M), longest context (1,024),
and already the fastest of the three in every published table.

## Where this is most likely to break

1. **ModernBERT ops may not export cleanly.** It uses unpadding and alternating
   local/global attention. `laya` and `laya-typed-decisions` both use it. The
   multilingual checkpoint is mmBERT-base, a more conventional architecture, and
   is the better first attempt for exactly this reason.
2. **The decision heads are not the encoder.** Laya is encoder + decision
   transformer + scoring head + action head. Exporting `feature-extraction` gets
   the encoder only; the heads have to be ported too, and upstream's
   `DecisionModel` is where they live. This is the real work, and `laya-mlx`
   having already reimplemented them in MLX is a usable map.
3. **Quantisation moves probabilities.** int8 will shift calibration. Since the
   whole value of these models is calibrated probability, **every threshold
   would need re-validating** — `calibration.py` exists for this and would need
   its 97-per-bin floor cleared against the quantised model.
4. **Parity must be proven, not assumed.** laya-mlx set the bar: 63/63 validation
   questions matching upstream in both FP32 and FP16. Anything we build should
   clear a comparable bar before it is trusted with a decision.

## Go/no-go

Worth doing **only** if the egress requirement is real. Order:

1. Export the multilingual encoder to ONNX. If it will not export, stop — that
   is the cheap decisive test and it costs one afternoon.
2. Measure int8 CPU latency. Under ~200 ms, continue; above, the remote batched
   path wins on every axis and this is a dead end.
3. Port the decision heads; prove parity on a fixed question set.
4. Re-run calibration against the quantised model before any threshold is reused.

**Disk:** ~30 GB free here; the toolchain plus weights is roughly 4–5 GB. Not a
constraint.

Say the word and I'll run step 1, which answers the only question that matters
first.
