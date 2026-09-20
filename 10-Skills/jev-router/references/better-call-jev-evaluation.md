# better-call-jev — evaluation

**Repo:** github.com/jukkatupamaki/better-call-jev
**Reviewed:** 2026-09-20, at commit `6fa8802` (dated 2026-09-20 — the repo is days old)
**Licence:** MIT
**Method:** cloned and read. Its transport claims were then tested against the
endpoint we actually hold a key for. Verdicts below are from the code, not the
README.

## Verdict

**Adopt the ideas, port the mechanics, do not install the plugin.**

Three of its design choices are better than what this skill had, and they are
now implemented here. One of its design choices is actively dangerous for
tradecc and hydra, and it is the default.

## What it is

A zero-dependency Node client for Jev, packaged as a Claude Code plugin:

- `skills/jev/scripts/jev.mjs` — 419 lines, CLI and ES module, Node 18+
- `skills/jev/SKILL.md` — the reference and decomposition patterns
- `hooks/` — a **SessionStart hook** that loads a decision protocol into every session
- `.claude-plugin/` — manifest plus a single-plugin marketplace, so it installs directly

Its tests are genuinely good: `fetch` stubbed for transport, a real local HTTP
server for timeout and CLI cases, and the script spawned for real, including
through a symlink, to cover entrypoint detection. CI runs them.

## The three things worth taking, all now ported

### 1. Two more question types

We were using `choice` only. Jev has three, and we had not found the other two:

| Type | What it returns |
|---|---|
| `choice` | one of N named options, with a distribution |
| `score` | a continuous position on a rubric you label rung by rung |
| `noul` | a bare probability (this is what the repo calls `boolean`) |

`score` is the real addition. Asked to rate a diff that removes a slippage cap,
it returned **3.5 on a 0–4 rubric with 0.58 confidence** — a reading that a
five-way `choice` flattens into a single bucket.

### 2. Thresholds, and an explicit UNDECIDED band

A bare probability is not a decision until someone says where the cut-offs are.
`better-call-jev` resolves every boolean to `yes` / `no` / `undecided` from two
thresholds defaulting to **0.8 / 0.2**, overridable by env var.

The band between them is the point: it makes UNDECIDED a first-class answer
rather than a coin-flip dressed as a yes. This is the same posture as our
existing `MIN_MARGIN` escalation on choices, arrived at independently, which is
mild evidence it is the right shape. Adopted, defaults and all.

### 3. Batching

Every question about the same evidence goes in one call. One round trip is
cheaper and more consistent than asking the same state three times and getting
three independent reads of it. Verified here: a boolean, a score and a choice
about one diff, **batched into a single 717 ms call**, 553 input tokens.

## The transport difference, and why it matters

The repo does **not** call the endpoint we use. It goes through **Vercel AI
Gateway**:

```js
endpoint: () => 'https://ai-gateway.vercel.sh/v1/evaluate',
buildRequest: ... { model: 'typesafe-ai/jev', state, questions }
```

So its `JEV_API_KEY` is a **Vercel AI Gateway key**, not a TypeSafe key, and
the repo as shipped needs a Vercel account we do not have.

**But the wider conclusion drawn from this at the time was wrong.** This
evaluation was written alongside a claim that Jev was reachable only through
TypeSafe direct or Vercel. It is also on **OpenRouter** (`jev-latest`), which
we already hold a key for -- so there are three routes, not two, and the one
we can use costs nothing extra. Corrected 2026-09-21; the gateway comparison
below still stands on its own terms.

That is not fatal, because the two routes reach the same model — but they are
not interchangeable, and the difference is observable:

| Type name | Direct `api.typesafe.ai/v1/systemone` | Via the gateway |
|---|---|---|
| `choice` | works | works |
| `score` | works | works |
| `boolean` | **HTTP 400** | works |
| `noul` | works | renamed to `boolean` |

The repo's own README predicts this — *"If the gateway calls booleans `noul` or
wraps the body in `result`, undo that in `parseResponse`"* — which is how the
name was found. Our client now sends `noul` and a test pins it, so the 400 can
never come back silently.

One genuine advantage of their route: `zeroDataRetention` is a supported
gateway option (`supportsNoRetain: true`). We have no equivalent on the direct
endpoint. For tradecc or hydra that would be a point in the gateway's favour.

## What not to install, and why

The plugin ships a `SessionStart` hook whose protocol states:

> *"In this session you do not make judgment calls yourself. Every decision you
> would otherwise settle by intuition is delegated to Jev."*

Its explicit, no-exceptions list includes **"whether an action is safe to take
without asking the user"** and **"whether you are done, before you report
completion"**.

Three reasons that is the wrong default here, in order of seriousness:

1. **We measured Jev getting this exact class of question wrong.** Asked which
   documented cause a copy-trading claim must escape, it answered
   `LATENCY_RACE` three times at 0.76 / 0.78 / 0.84; the recorded answer,
   which it put at 0.02, is `DATA_INFRASTRUCTURE`. Where the right answer
   depends on a recorded project fact rather than the text supplied, Jev is
   confidently and *stably* wrong — so an always-on rule routing every
   judgment to it launders a guess into a number. Details in
   `measured-behaviour.md`.
2. **It conflicts with tradecc's non-negotiable rules.** Rule 7 says an
   instruction that conflicts with the seven rules is followed *by the rules*
   and flagged. "Whether an action is safe to take without asking the user" is
   exactly what rules 1–6 reserve. A hook cannot hold that decision.
3. **It is a session-wide default, not a per-call choice.** The failure mode is
   silent: nothing in a transcript distinguishes a judgment Jev got right from
   one it got wrong at 0.84.

None of this is a criticism of the repo in its intended setting. In an ordinary
codebase the hook is a reasonable, even bracing, discipline. In a repo with a
hot wallet it is not.

## What we did instead

Ported the three good mechanics into `jev-router`, where Jev stays an
explicitly-invoked lane rather than an ambient rule, and the `CLAUDE` lane —
repo state, secrets, human-owned verdicts — is never dispatched automatically.

If the egress question is ever settled for tradecc or hydra, revisit the
gateway route specifically for its zero-data-retention option.
