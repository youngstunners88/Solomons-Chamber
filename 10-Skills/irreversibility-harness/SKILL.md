---
name: irreversibility-harness
description: |
  How to let an agent take actions that cannot be undone — payments, deploys,
  pushes, deletes, trades — without the safety being an honour system.

  Load this BEFORE wiring an agent to anything whose undo is not the inverse of
  its do. The controls are CODE in `scripts/`, not rules in this file. This file
  covers only the part code cannot reach.

  Distilled from two production trading agents (Minara, Senpi) by throwing away
  the trading and keeping the refusal machinery, which is where almost all of
  their engineering actually went.

allowed-tools: Bash Read

usage: |
  # The controls, and the tests that prove each one
  python3 -m pytest 10-Skills/irreversibility-harness/tests -q

  # Where each idea came from, and what was declined
  cat 10-Skills/irreversibility-harness/references/sources.md
---

# The irreversibility harness

## Why this file is short

Jev was asked whether to ship this protocol as doctrine, as an executable gate,
or as both. It put **0.000** on doctrine-only and **0.92** on the executable
gate, and the reason is in this vault's own record: prose here went stale four
times in a single session while the code stayed correct, and a skill whose
central lesson was *probe, don't trust a catalogue* shipped containing a false
claim taken from a catalogue.

So the rules live in `scripts/` with tests. This file exists for the residue —
the parts that are genuinely unenforceable, and the reasoning that would
otherwise be lost.

*(Jev preferred the gate alone over "both". A skill needs a `SKILL.md` to exist
at all, so this is the gate plus the minimum prose, and the prose deliberately
does not restate what the code already enforces. Where they would disagree, the
code is right.)*

## The four controls

| Control | File | Enforces |
|---|---|---|
| `ConfirmationGate` | `scripts/confirm_gate.py` | Two-turn confirmation, parameter-drift voiding, single use, expiry |
| `Ladder` / `tick` | `scripts/ratchet.py` | Lose small, let winners run — as a pure function |
| `reconcile` | `scripts/reconcile.py` | Absence detection, and refusing the vacuous pass |
| `Registry` / `RetryBudget` | `scripts/preflight.py` | Never spawn a command that will hang; retry at most once |

77 tests. Five guards mutation-verified: the control is broken, the named test
must fail. All five were caught.

## 1. The thing code cannot do

`ConfirmationGate` enforces that a confirmation arrived in a **later turn**,
matches the **exact parameters** that were summarised, has not been **used
before**, and has not **expired**.

It cannot verify that a human actually replied.

An agent that writes *"User selected A"* and calls `confirm()` produces a valid
ticket, because in-process there is nothing that distinguishes a fabricated
reply from a real one. Minara states this as a flat behavioural ban — *"NEVER
fabricate or simulate a user's confirmation… This is an instant safety
failure"* — and that is the right way to state it, because it is the only way
it can be stated.

What the code adds is that doing it must be **explicit and logged**:

```python
gate.confirm(action, turn, Attestation.from_external("AskUserQuestion", "chose Confirm"))
gate.confirm(action, turn, Attestation.self_asserted("assumed yes"))   # trusted=False
```

`gate.untrusted_executions()` returns every action that ran on a self-assertion.
**That query belongs in CI.** A non-empty result is the finding.

> **The rule, for when you are the agent:** the response containing the
> confirmation summary **ends** at the summary. No fund-moving, no push, no
> delete, no deploy appears anywhere in it. You find out what the user decided
> by being told, in a message you did not write.

## 2. Turn counting is the gate's one soft spot

Every ordering check rests on the `turn` integer you pass in. Increment it
**once per user message** — never per tool call, never per assistant message. A
counter that ticks inside one assistant turn makes the same-turn check pass
exactly when it should fire, and the gate will report success while enforcing
nothing.

`assert_turn_source_is_user_messages("...")` is a no-op that refuses a hand-wave.
Call it once at the wiring site so the question gets answered in writing.

## 3. Analysis and action are different turns

Minara's phrasing: *"Analysis (ask/research/chat) is read-only. NEVER execute
any fund-moving command in the same turn as analysis output."*

Worth keeping because of the failure it describes. Research "ETH and buy some"
is one message containing two intents, and the natural completion is to finish
the analysis and roll straight into the buy — at which point the user has
confirmed nothing; they asked a question. Present the analysis, append a
concrete suggestion, stop.

The gate enforces the *structure* of this (a proposal made this turn cannot be
executed this turn). It cannot tell that your analysis and your execution were
the same thought.

## 4. The failure that looks like nothing

The single most valuable sentence in either source, from Senpi:

> *"An open position that is missing from that list is UNPROTECTED. That is the
> whole trap: an unprotected position shows up as an absence, not a warning, so
> you have to look for what's not there."*

Monitoring reports the rows it has. Nothing reports the rows it should have had.
So the check has to be a **diff against an independently-sourced list of what
ought to be covered** — and if you build both sides from the same query, it
always passes.

This vault has already been bitten twice by this exact shape:

- Five phantom git submodules broke `clone --recursive` for **five months**. No
  error in normal use; the directories were simply empty.
- Its CI carries a step that **fails when zero test suites are discovered**,
  because a green tick on nothing collected reports "tests pass" while testing
  nothing.

`reconcile()` generalises both. `Coverage.ok` is **False when nothing was
expected** — a vacuous pass is treated as a failure, because an empty expected
set nearly always means the query that built it broke, not that there is
nothing left to protect.

## 5. Two things worth stealing verbatim

**Refuse the footgun at construction, not at use.** Senpi's runtime docs warn
that *"no tier locks 0 — a breakeven rung exits flat while still paying both
fees"*. `Ladder` raises on it when the ladder is built. Same reason `router.py`
refuses an irreversible action gated below its default: the combination is a
mistake in the table every time, and finding out at run time means finding out
with something at stake.

**Make the permissive default impossible.** An unregistered command in
`preflight` returns `unknown`, never `safe`. A guard that defaults to safe stops
guarding the first time somebody forgets to register something, and says nothing.

## 6. Lazy auth — don't invent a problem

Minara: *do not probe the account when the skill activates.* Run the command;
only if it returns an **explicit authentication error** start recovery. And:

> *"Do not turn a network, Cloudflare, or upstream API error into a login prompt
> unless the CLI explicitly reports an authentication failure."*

Two failures avoided: an unnecessary login wall in front of work that needed no
account, and a confident misdiagnosis that sends the user to re-authenticate
when the real problem was a 502. One attempt each at device and email flow, then
stop and report the sanitised error.

## What was deliberately NOT built

Senpi's `strategy.yaml` / `runtime.yaml` / `scan(inputs, ctx)` package format,
its 114 strategy templates, and its catalog ranker. Jev scored porting them
**0.000**, and it is right: every one of those artifacts is inert without the
closed-source `@senpi-ai/runtime` supervisor that calls `scan()` and owns
sizing, execution and exits. Porting the schema without the supervisor yields
YAML that nothing runs. It also points straight at live perpetual-futures
trading, which tradecc's non-negotiable rules forbid before a validation gate.

The ratchet is the one mechanism from that stack worth lifting, because it is a
pure function over a series and nothing about it is financial.

## See also

- `references/sources.md` — what was read, what was measured, what was declined.
- `10-Skills/jev-router/` — the decision lane; `router.DEFAULT_GATES` prices an
  action by what being wrong costs. This skill is what happens **after** that
  gate passes and a human still has to say yes.
- `10-Skills/jev-prompt-design/` — why the option descriptions behind both Jev
  calls above are written the way they are.
