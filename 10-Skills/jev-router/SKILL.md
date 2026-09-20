---
name: jev-router
description: |
  Use TypeSafe's Jev as a fast structured-decision lane in the build process,
  paired with OpenRouter as the prose lane. Jev answers closed-option-set
  questions in ~400-650ms with calibrated probabilities; OpenRouter
  (deepseek/deepseek-v4-pro) does the drafting and long-context work. This
  skill is the client, the three-lane router, and the measured record of where
  Jev is reliable and where it is confidently wrong.

  Three question types: choice (one of N), score (a rubric, rung by rung) and
  boolean (sent as `noul`, resolved to yes/no/undecided by thresholds). They
  batch into one call.

  Load this before routing work to Jev anywhere, and BEFORE proposing it for
  tradecc or hydra -- the state you send leaves the machine, which is a
  data-egress decision there, not a defaults choice. Also read it before
  installing the `better-call-jev` plugin, whose always-on hook is evaluated
  in references/better-call-jev-evaluation.md and is NOT safe here.

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

  # Why we ported better-call-jev's mechanics but not its plugin
  cat 10-Skills/jev-router/references/better-call-jev-evaluation.md

  # Tests (no network)
  pytest 10-Skills/jev-router/tests/
---

# Jev router

## Jev on OpenRouter — and a correction

**Jev is on OpenRouter.** The model id is `jev-latest`; both
`openrouter.ai/api/v1/systemone` and `/api/alpha/decisions` serve it, and
`DEFAULT_ROUTE` in the client now points at the first of those.

An earlier version of this skill said the opposite, loudly. That was wrong.
The check behind it searched OpenRouter's `/v1/models` catalogue for "jev",
found nothing among 446 entries, and stopped — but **decisions models are not
in that catalogue**. A single POST to chat/completions returns the answer
directly: *"jev-latest is a decisions model... Use the /api/alpha/decisions
endpoint instead."* A catalogue is not a probe.

Measured over five calls each, OpenRouter is **not** the slower path here
(347 ms median against 396 ms direct), it reports **cost**, and it returns a
**fully pinned version** string where direct returns a looser one. Details and
the full table: `references/measured-behaviour.md`.

```python
ask(state, questions)                      # OpenRouter, the default
ask(state, questions, route="direct")      # api.typesafe.ai
```

Keys are per route and never shared: `OPENROUTER_API_KEY` for the gateway,
`TYPESAFE` / `TYPESAFE_API_KEY` for direct. A test asserts the OpenRouter key
is never used to authenticate against TypeSafe.

**Pin the model in anything whose thresholds matter.** `jev-latest` floats;
`JevResult.version_floated` is True whenever a floating alias resolved to
something else, because a silent upgrade moves every cut-off in the policy
layer without changing a line of code.

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

## Three question types, one call

| Type | Ask it when | You get |
|---|---|---|
| `Question` (choice) | one of N named options | `.choice`, `.margin`, distribution |
| `ScoreQuestion` | a position on a rubric; the middle is meaningful | `.score` (continuous), `.nearest_rung`, distribution |
| `BooleanQuestion` | yes/no | `.probability`, `.verdict` (`YES`/`NO`/`UNDECIDED`) |

**Batch every question about the same evidence into one call.** One round trip
is cheaper and more consistent than asking the same state three times and
getting three independent reads of it. Measured: all three types about one
diff, 717 ms, 553 input tokens.

```python
from jev_client import BooleanQuestion, Question, ScoreQuestion, ask

result = ask({"diff": "removed the slippage cap check from execute_swap()"}, [
    BooleanQuestion("safe", "Is this safe to merge without human review?"),
    ScoreQuestion("risk", "Rate the risk.",
                  ["No risk", "Minor", "Moderate", "Serious", "Critical"]),
    Question("area", {"EXECUTION": "...", "RISK_CONTROL": "...", "DOCS": "..."}),
])
result.verdict("safe")                 # 'NO'  (probability 0.07)
result.answers["risk"].nearest_rung    # 'Critical'  (score 3.5, conf 0.58)
result.choice("area")                  # 'RISK_CONTROL'
```

**Booleans resolve through two thresholds, not one.** At or above `high` (0.8)
it is a YES, at or below `low` (0.2) a NO, and **anything between is
UNDECIDED** — the band is the point, so a 0.5 never quietly becomes a yes.
Defaults adopted from `better-call-jev`; override with `JEV_THRESHOLD_HIGH` /
`JEV_THRESHOLD_LOW`.

Note the wire name: a boolean is sent as **`noul`**. The direct endpoint
rejects the name `boolean` with HTTP 400 — only the Vercel gateway route
renames it. A test pins this so the 400 cannot come back silently.

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

- **At least two options** on a choice, **at least three rungs** on a score.
  A one-option "choice" returns 1.0 every time and reads like agreement; a
  two-rung score is a boolean wearing a rubric.
- **A score outside its rubric raises** rather than being clamped: it means the
  rungs sent and the rungs scored disagree, and clamping hides that.
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

## Do not install the better-call-jev plugin here

`jukkatupamaki/better-call-jev` (MIT) is a well-built, well-tested Jev client,
and three of its mechanics are ported above. **Its plugin is a different
matter.** It ships a `SessionStart` hook stating *"in this session you do not
make judgment calls yourself"*, with an explicit no-exceptions list that
includes *"whether an action is safe to take without asking the user"*.

That is the class of question we measured Jev answering confidently and stably
wrong, and in tradecc it is what non-negotiable rules 1-6 reserve. It also
needs a Vercel AI Gateway key, which is not the key we hold.

Full evaluation, including the one thing its route does better than ours
(zero-data-retention): `references/better-call-jev-evaluation.md`.

## See also

- `10-Skills/jev-fast-tools/` — the original deep dive on `fast-jev-compaction`
  and `jev-ultrafast`, the egress caveat, and the Hydra browser-hunter proposal.
