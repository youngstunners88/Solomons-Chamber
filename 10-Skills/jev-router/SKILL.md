---
name: jev-router
description: |
  Use TypeSafe's Jev as a fast structured-decision lane in the build process,
  paired with OpenRouter as the prose lane. Jev answers closed-option-set
  questions in ~400-650ms with calibrated probabilities; OpenRouter
  (deepseek/deepseek-v4-pro) does the drafting and long-context work. This
  skill is the client, the three-lane router, and the measured record of where
  Jev is reliable and where it is confidently wrong.

  Load this before routing work to Jev anywhere, and BEFORE proposing it for
  tradecc or hydra -- the state you send leaves the machine, which is a
  data-egress decision there, not a defaults choice.

allowed-tools: Bash Read

installation: |
  Nothing to install. Standard library only, no third-party HTTP dependency.

  Requires an environment variable, never a file:
    TYPESAFE (or TYPESAFE_API_KEY)  -- the Jev key
    OPENROUTER_API_KEY              -- only for the OpenRouter lane

usage: |
  # Route one unit of work (prints JSON: lane, confidence, margin, timing)
  python3 10-Skills/jev-router/scripts/router.py "your unit of work"

  # Route it and, if the lane is OPENROUTER, actually run it
  python3 10-Skills/jev-router/scripts/router.py "your unit of work" --execute

  # Read what Jev measurably does and does not do well, before trusting it
  cat 10-Skills/jev-router/references/measured-behaviour.md

  # Tests (no network)
  pytest 10-Skills/jev-router/tests/
---

# Jev router

## The one-line answer to "use it in OpenRouter"

**You can't — Jev is not an OpenRouter model.** Checked live on 2026-09-20:
446 models on OpenRouter, zero matching `jev`, `typesafe` or `systemone`. It
is TypeSafe's own endpoint (`api.typesafe.ai/v1/systemone`) with its own key.

What *is* real, and is what this skill builds, is the pairing. `jev-ultrafast`
already ships it: Jev makes the structured decision, then a second
OpenAI-compatible endpoint writes any free text. That second endpoint is set
by `TEXT_MODEL_BASE_URL`, a plain environment variable defaulting to DeepSeek's
own API — so pointing it at OpenRouter is configuration, not a patch:

```bash
export TEXT_MODEL_BASE_URL=https://openrouter.ai/api/v1
export TEXT_MODEL_API_KEY="$OPENROUTER_API_KEY"
export TEXT_MODEL=deepseek/deepseek-v4-pro
```

Two lanes of one pipeline. Not one model calling another.

## Why bother

Jev is a **calibrated classifier over a closed option set**, not a chat model.
One call returns a choice, a confidence, and a probability for every option
you offered — and nothing else. There is no free-text lane in the API at all.

That constraint is the feature. Measured from this vault: **~400–650 ms, a few
hundred tokens**, for decisions that would otherwise cost a full model turn.
When you are managing rate-limit pressure — which is the standing condition on
this build — triage that costs 400 ms instead of a turn is the lever.

## The three lanes

| Lane | What goes here |
|---|---|
| `JEV` | A narrow decision over an enumerable option set, decidable from the text in front of it. |
| `OPENROUTER` | Drafting, literature sweeps, long-context analysis, arithmetic derivation. The heavy lift. |
| `CLAUDE` | Repo state, secrets, live system state, version control, or a verdict a human must own. |

`router.py` asks Jev which lane, then **fails closed**: if the top option's
lead over the runner-up is under 0.25, it routes to `CLAUDE` regardless. A
0.51/0.49 split is guessing with extra steps. The cheap failure is a human
look; the expensive one is acting without review.

`--execute` never dispatches the `CLAUDE` lane, and never dispatches an
escalated decision. Both guards are mutation-tested — break either and a named
test fails.

## The thing you must read before trusting it

**Jev is confidently, stably wrong when the right answer is not in the prompt.**

Asked which of TradeCC's four documented causes a copy-trading claim must
escape, it answered `LATENCY_RACE` three times at 0.76 / 0.78 / 0.84. The
recorded answer is `DATA_INFRASTRUCTURE`, which it put at **0.02**.

It was not malfunctioning. The correct answer depends on a verdict this project
reached by measuring wallet enumeration at ~9,982 hours of throughput — a fact
nowhere in the prompt. Given a plausible-sounding claim about fast trading, a
classifier picks the plausible bucket. Stably.

So:

1. **Stability is not correctness.** Three consistent runs look exactly like a
   reliable answer. Re-running is no defence.
2. **Never ask Jev to recall a recorded verdict.** That is what TradeCC's
   deterministic `research/edge_inventory.py` `lookup()` is for — it reads the
   table and cannot invent a category. Jev is for decisions that are decidable
   *from the text you supplied*.

Full transcript, timings and the routing accuracy table:
`references/measured-behaviour.md`.

## Writing a good question

```python
from jev_client import Question, ask

result = ask(
    {"diff_summary": "..."},                      # state: sent verbatim
    [Question("path", {
        "SIGNAL":   "Feeds a trading decision; must stay exact-arithmetic.",
        "ANALYSIS": "Reporting or research only; float maths is fine here.",
    })],
)
result.answers["path"].choice     # 'SIGNAL' | 'ANALYSIS' -- never anything else
result.answers["path"].margin     # lead over the runner-up; key off this
```

Rules the client enforces so you cannot forget them:

- **At least two options.** A one-option "choice" returns 1.0 every time and
  reads like agreement.
- **Every answer is validated against the set you offered** — an unoffered
  choice, a missing option, probabilities that don't sum to 1, or a choice
  that isn't the argmax all raise rather than get coerced into something
  plausible.
- **Every question carries an untrusted-input rule.** State is routinely
  derived from a page or a file someone else wrote.
- **Key from the environment only.** Both `TYPESAFE` and `TYPESAFE_API_KEY`
  are accepted, because this environment registers the first and the upstream
  tools document the second — a mismatch that silently disabled the older
  `jev-fast-tools/scripts/check-jev-env.sh` until it was fixed on 2026-09-20.

And one rule the client cannot enforce: **`state` is sent verbatim to a third
party.** Nothing here reads a file, walks a repo, or expands a path for you, so
what leaves is exactly what you assembled at the call site. Keep it that way.

## Where this is not cleared

Unchanged from `jev-fast-tools/references/deep-dive.md`: in this vault there is
no money and there are no keys, so the egress question doesn't bind — use it.

**In tradecc and hydra it does bind, and it is not answered.** Note the
distinction, though: this router sends only the one-line unit of work you hand
it, which is a far narrower surface than `fast-jev-compaction`, which ships
whole tool-call results off-machine. Narrower is not cleared. Decide it
explicitly, per project, before either goes near them.

## See also

- `10-Skills/jev-fast-tools/` — the original deep dive on `fast-jev-compaction`
  and `jev-ultrafast`, the egress caveat, and the Hydra browser-hunter proposal.
