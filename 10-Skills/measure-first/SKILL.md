---
name: measure-first
description: |
  The session protocol for this vault. Load it at the START of every session
  and before any build decision.

  Rule: before building anything non-trivial, run the cheapest experiment that
  could falsify the plan — with the prediction written down FIRST.

  Jev chose this over three alternatives at 0.92 (margin 0.84), judged against
  this project's own record of what actually went wrong.
allowed-tools: Bash Read
usage: |
  python3 -m pytest 10-Skills/measure-first/tests -q

# Measure first

## Why this rule and not a different one

Four experiments have been run in this vault. **Three of four pre-registered
predictions were falsified:**

| Prediction | Reality |
|---|---|
| A cleaner, less cluttered prompt will beat the messy one | **12 points worse** |
| The vendor oversold batching latency | **1.05×** — they were right |
| Accuracy will collapse across 255 options | **fell 2.4 points** |
| Evidence in option descriptions beats bare names | held: 59% → 86% |

None of those three was careless. All were reasoned about carefully, and the
reasoning read well. The common factor is that **reasoning about behaviour was
substituted for probing it** — and each probe cost under a cent and a few
minutes.

That is the entire case for this protocol. It is not a philosophy; it is this
project's measured failure mode.

## The protocol

1. **State the decision** you are about to make.
2. **Write the prediction down and seal it** — `Registry.seal(name, claim, decide)`.
   The decision rule is sealed *with* the claim. A rule chosen after seeing the
   number is a rationalisation.
3. **Find the cheapest falsifying test.** Usually a live call, a binary search,
   or a mutation. Budget: minutes and cents.
4. **Run it. Grade it.** `grade()` refuses to score anything not sealed first.
5. **Record the falsification in the artifact**, not just the chat. Struck-through
   or labelled, never deleted.
6. **Mutation-verify any guard you ship**: break the control, confirm the named
   test fails. Purge `__pycache__` first — a same-length edit inside one mtime
   second leaves stale bytecode valid and the mutant never runs.

## Checks the code enforces

- Grading an unsealed claim **raises**.
- Re-sealing a name **raises** — "editing a prediction after sealing is how a
  falsification becomes a success story."
- Re-grading **raises** — moving the goalposts.
- Sealed-but-never-graded is **surfaced**, so an experiment that quietly died
  does not read as clean.
- **Zero falsifications is flagged as suspicious**, not celebrated: all-green
  usually means the predictions were safe, not that you were right.

## Known failure modes of the tests themselves

Both found here, both twice-bitten:

- **Stale bytecode masking mutants.** Same-length edit, same mtime second, `.pyc`
  still valid. Reported a coverage gap that did not exist. Purge between runs.
- **A test that exercises only one of two conditions.** Setting the other
  threshold to zero makes the test assert the right verdict for the wrong
  reason. Happened twice in one PR. Pin each condition separately, and add the
  "tolerance is not a free pass" case.

## What this replaces

Nothing is banned. But **"this reads better" is not evidence**, and neither is
"the vendor would say that." Both have been wrong here, in writing, with the
receipt committed.
