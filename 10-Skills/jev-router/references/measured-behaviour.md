# Jev — measured behaviour, 2026-09-20

Everything here was run live against `https://api.typesafe.ai/v1/systemone`
from this vault on 2026-09-20. Nothing is quoted from a README. The served
model reported itself as `jev-1.13.0` for every call below.

## The API contract, discovered by probing

The upstream docs describe the tools built on Jev, not Jev's own wire format.
It was recovered by sending deliberately wrong bodies and reading the 422s:

| Sent | Response |
|---|---|
| `{}` | 422 — `model` and `questions` are required |
| `{"model":"jev-1","questions":[]}` | 422 — `questions` must be a dictionary |
| `{"questions":{"q1":"..."}}` | 422 — each question must be an object |
| `{"questions":{"q1":{}}}` | 422 — `Unable to extract tag using discriminator 'type'` |
| `{"questions":{"q1":{"type":"__bogus__"}}}` | 400 — `api_usage_error` (types are not enumerable this way) |

Working shape:

```json
{
  "model": "jev-latest",
  "state":  { "...": "anything; sent verbatim" },
  "questions": {
    "<name>": {
      "type": "choice",
      "criteria": { "<option_id>": "description" },
      "instructions": { "...": "anything" }
    }
  }
}
```

Response:

```json
{
  "model": "jev-1.13.0",
  "answers": { "<name>": { "type": "choice", "choice": "...",
                           "confidence": 0.84,
                           "probabilities": { "<option_id>": 0.84, "...": 0.0 } } },
  "usage": { "input_tokens": 485, "output_tokens": 74 }
}
```

**The primitive is a calibrated classifier over a closed option set**, not a
text generator. There is no free-text lane in the API at all. That is the
reason to use it and the reason it cannot replace the OpenRouter lane.

## Latency and cost

| Call | Latency | Tokens |
|---|---|---|
| 3-option routing question | 418–642 ms | ~400 in / ~47 out |
| 5-option cause question | 381–426 ms | 485 in / 74 out |

Sub-second and a few hundred tokens. For triage that would otherwise cost a
full model turn, that is the whole argument.

## It is confidently wrong where the answer is not in front of it

Asked which of TradeCC's four documented causes a copy-trading claim must
escape, over three runs:

| Run | Choice | Confidence |
|---|---|---|
| 1 | `LATENCY_RACE` | 0.76 |
| 2 | `LATENCY_RACE` | 0.78 |
| 3 | `LATENCY_RACE` | 0.84 |

**The recorded answer is `DATA_INFRASTRUCTURE`**, which Jev put at 0.02.

This is the single most important measurement in this file, and it is not a
criticism of the model. The correct answer depends on a verdict this project
recorded after measuring wallet enumeration at ~9,982 hours at the cheapest
pool's throughput. That fact is nowhere in the prompt. Jev did what a
classifier does with a plausible-looking claim about fast trading: it picked
the plausible bucket, stably, three times.

Two things follow, and they are the usage rules:

1. **Stability is not correctness.** Three consistent runs at 0.76–0.84 look
   exactly like a reliable answer. Re-running is no defence.
2. **Never ask Jev to recall a project verdict.** Ledger lookup is
   `research/edge_inventory.py`'s deterministic `lookup()` in TradeCC — it
   reads the recorded table and cannot hallucinate a category. Jev is for
   decisions that are *decidable from the text supplied*.

## Routing accuracy on self-contained criteria

Where the criteria are self-contained, it was 3-for-3 and fast:

| Unit of work | Lane | Confidence | Latency |
|---|---|---|---|
| "Summarise 40 pages of literature on LVR and draft a ledger row" | `DEEPSEEK` | 0.97 | 586 ms |
| "Decide whether this changed file is signal path or analysis path" | `JEV` | 0.88 | 432 ms |
| "Push the commit to the release branch and rotate the wallet key" | `CLAUDE` | 0.99 | 419 ms |

And against the shipped three-lane router:

| Unit of work | Lane | Margin | Latency |
|---|---|---|---|
| "Rotate the hot wallet key and push to main" | `CLAUDE` | 0.98 | 616 ms |
| "Write a 2000-word comparison of AMM impermanent loss models" | `OPENROUTER` | 0.84 | 471 ms |
| "In exactly one sentence, define loss-versus-rebalancing" | **escalated** | 0.14 | 418 ms |

The third is the interesting one. A one-sentence definition sits genuinely
between "narrow enough to be a lookup" and "prose a model should write", and
Jev said so: 0.51 / 0.37 / 0.12. The router escalated to `CLAUDE` rather than
acting on a 0.14 margin. That is the guard working, not the guard misfiring.

## The three question types (added 2026-09-20, after reviewing better-call-jev)

`choice` was the only type this skill used. Probing the other two against the
direct endpoint:

| Sent `type` | Direct endpoint | Answer shape |
|---|---|---|
| `choice` | OK | `choice`, `confidence`, `probabilities` |
| `score` | OK, 378 ms | `score` (continuous), `confidence`, `legend`, `probabilities` per rung |
| `boolean` | **HTTP 400** `api_usage_error` | — |
| `bool`, `binary` | **HTTP 400** | — |
| `noul` | OK | `noul`: a bare probability |

`noul` is the direct endpoint's name for a boolean; the Vercel AI Gateway route
that `better-call-jev` uses renames it. Its README predicted exactly this,
which is how the name was found.

Asked "is it safe to merge a diff removing the slippage cap check?", the two
phrasings of the same question disagreed in strength: `noul` returned **0.21**
(UNDECIDED under 0.8/0.2 — it sits one hundredth above the NO cut-off), while
a `choice` over YES/NO returned **NO at 0.99**. Same model, same evidence. Not
enough runs to call it a pattern, but enough to stop treating the two framings
as interchangeable.

All three types batch into one call: a boolean, a score and a choice about one
diff came back in **717 ms** for 553 input / 75 output tokens, with the boolean
at 0.07 (NO), the score at 3.5 of 4 (confidence 0.58) and the choice
`RISK_CONTROL` at 0.56.

## Jev IS on OpenRouter — an earlier claim here was wrong

**Corrected 2026-09-21.** This file previously stated, under a heading reading
"Jev is not on OpenRouter", that a check of OpenRouter's `/api/v1/models`
returned 446 models and zero matches for `jev`, `typesafe` or `systemone`.

The search result was real. **The conclusion drawn from it was wrong**, because
decisions models are not listed in that catalogue at all. One POST to
chat/completions says so in as many words:

```
"jev-latest is a decisions model and cannot be used with the
 chat/completions endpoint. Use the /api/alpha/decisions endpoint instead."
```

A catalogue is not a probe. The cheap test — try it and read the error — was
available the whole time and was not run.

Both OpenRouter paths work:

| Route | Result |
|---|---|
| `openrouter.ai/api/v1/systemone` | 200, same request/response shape as direct |
| `openrouter.ai/api/alpha/decisions` | 200, identical answers |

### Measured, five calls each

| Route | median | min | served model | cost reported |
|---|---|---|---|---|
| direct `api.typesafe.ai/v1/systemone` | **396 ms** | 369 | `jev-1.13.0` | no |
| OpenRouter `/api/v1/systemone` | **347 ms** | 336 | `typesafe/jev-1.13-20260917` | **yes** |
| OpenRouter `/api/alpha/decisions` | **367 ms** | 338 | `typesafe/jev-1.13-20260917` | **yes** |

The widely-repeated advice that gateways "add a round trip you cannot recover"
**did not reproduce here** — OpenRouter was the faster of the two. That claim
is plausible in principle and may hold from a colocated box; it is not what
this environment measures, and it is quoted often enough to be worth saying so.

Two things the gateway does strictly better:

- **It reports cost** (`1.4868e-05` for a 354-token call). The direct route
  does not, so cost has to be inferred from a price list.
- **It returns a fully pinned version**, `typesafe/jev-1.13-20260917`, where
  direct returns `jev-1.13.0`. That matters because thresholds are calibrated
  against one model, and a floating alias that silently upgrades moves every
  cut-off in the policy layer without changing a line of code. The client now
  surfaces this as `JevResult.version_floated`.

`DEFAULT_ROUTE` is therefore OpenRouter. One key (`OPENROUTER_API_KEY`) now
serves both lanes.

The prose lane is unaffected and still belongs to a text model. `jev-ultrafast`'s own
`model.py` calls Jev for the structured decision and then a second,
OpenAI-compatible endpoint for the one thing Jev cannot do — write text:

```python
base = os.environ.get("TEXT_MODEL_BASE_URL", "https://api.deepseek.com/v1")
```

That default is a plain environment variable, so OpenRouter is a drop-in:

```bash
export TEXT_MODEL_BASE_URL=https://openrouter.ai/api/v1
export TEXT_MODEL_API_KEY="$OPENROUTER_API_KEY"
export TEXT_MODEL=deepseek/deepseek-v4-pro
```

No patch, no fork. Verified end-to-end from this vault: the router's own
`dispatch_openrouter` completed against `deepseek/deepseek-v4-pro` in 1,500 ms
at a reported upstream cost of $0.00018.
