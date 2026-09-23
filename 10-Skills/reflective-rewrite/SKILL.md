---
name: reflective-rewrite
description: |
  A slow model that rewrites a fast model's instructions from its own
  mistakes, behind a gate it cannot pass itself. Load before letting any
  model edit prompts, rules, thresholds or config that another model acts on.
allowed-tools: Bash Read
usage: |
  python3 -m pytest 10-Skills/reflective-rewrite/tests -q
---

# Reflective rewrite: the night model proposes, it never deploys

## Two speeds, two planes

| Plane | Model | Cadence | May write |
|---|---|---|---|
| **Decide** | fast, closed-set (Jev) | every tick | a decision and its confidence, append-only |
| **Revise** | slow, reflective | nightly | **a proposal file. Nothing else.** |
| **Gate** | a human or a test | on demand | a new live version |

This is the same rule as Hydra's two planes (hunt never signs, exec never
scrapes). The revise plane never writes live config.

## 1. Read the disagreements, not the log (`disagreements.py`)

`select(rows, threshold=0.8, budget=50)` returns the **resolved** decisions
where confidence was ≥ threshold and the outcome went the other way, most
confident first, plus a one-line summary. A raw day is ~300k tokens; this is
a few thousand. Unresolved rows are never "mistakes": they have no other way
yet. Method: GEPA (ICLR 2026 oral), reflective prompt evolution: up to 19
points over RL with up to 35× fewer rollouts.

**Precondition:** the confidence has to mean something. See Jev's measured
behaviour below.

## 2. Propose, then gate (`proposals.py`)

`Registry.propose()` is open to anyone, including a model, and changes nothing
live. `approve()` refuses:

- **a model identity**, and refuses to be *configured* with one as an approver
- **the proposal's own author**
- anyone **not on the approver list**
- a **stale** proposal written against an older live version (no silent overwrite)
- a proposal whose **test gate** fails (e.g. a replay on held-out log)
- text matching an **injection shape**, screened again at approval: an
  address, a 32-byte hex secret, a URL, a movement-of-funds instruction,
  "ignore previous", or a Morse-like encoded line

Versions are append-only. Roll back by approving the old text as a new version,
so history keeps what actually ran.

## Why the gate is not optional

On 4 May 2026 a reply to Grok in **Morse code** was decoded into English, and a
finance agent downstream executed it: about $175,000 gone, no exploit, no stolen
key. That agent had once had a hard block on Grok-originated replies. **It was
dropped in a maintenance rewrite.**

That is the second lesson, and it is why every refusal above has a test that
fails if the refusal is removed (8/8 mutation-verified). An untested guard is
one rewrite away from gone.

## Jev's confidence, measured, before anyone trusts it for this

The source article says Jev "is trained to be calibrated" and makes "high
confidence act, low confidence hold" most of its risk management. We
measured, on identical input:

- confidence 0.62 / 0.74 / 0.67 across three identical calls
- confidence sits ~0.1 below the top probability
- option **order** alone swung P(event) by ~0.28 on a two-option question

A 0.8 cut on that is partly a coin flip (`jev-architecture/scripts/gate_stability.py`).
Calibrate against resolved outcomes per question shape before selecting
"confident mistakes" by it.
