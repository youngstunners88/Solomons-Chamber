---
name: jev-prompt-design
description: |
  How to write the option descriptions and thresholds a Jev decision hangs on.
  Load this BEFORE writing any new `Question`, changing an existing one, or
  choosing a threshold for an action.

  Option descriptions are code. They decide the answer as surely as an `if`
  does, and unlike an `if` nothing type-checks them. This skill records what
  measurement — not intuition — says about writing them, including a
  prediction I made confidently and got wrong.

allowed-tools: Bash Read

usage: |
  # The measured evidence behind everything here
  cat 10-Skills/jev-router/evals/RESULTS-2026-09-21.md

  # Re-run the three-arm comparison against your own option text
  python3 10-Skills/jev-router/evals/backtest_intake.py
  python3 10-Skills/jev-router/evals/percase.py
---

# Writing Jev questions

## The one-paragraph version

Give the model **concrete, measured evidence inside each option description**.
Measured: doing that took a real classification task from **59% to 86%**. Then
resist the instinct to tidy those descriptions into clean abstract definitions
— when I did exactly that, accuracy fell to **74%**. And set your threshold by
**what a wrong answer costs**, not by how confident the model sounds.

Everything below is the evidence for those three sentences.

## 1. Evidence in the option text is worth ~27 points

Three arms, same fourteen cases, five repeats each, 210 calls:

| Arm | Option descriptions contained | Pooled |
|---|---|---|
| STARVED | the option names and a one-line gloss | 41/70 (**59%**) |
| **EVIDENCED** | the same, plus specific measured facts | **60/70 (86%)** |
| MECHANISM | clean abstract definitions, no instances | 52/70 (74%) |

The failure mode this fixes is the one recorded in
`jev-router/references/measured-behaviour.md`: asked which constraint blocks a
copy-trading strategy, Jev answered wrongly three times at 0.76–0.84 because
**the deciding measurement was not in the prompt**. It was not a hard question.
It was an unanswerable one, asked as though it were answerable.

## 2. The prediction I got wrong — tidy definitions are worse

After the first run I found two cases where the evidenced prompt did worse than
the bare one, diagnosed both as contamination in my own text, and predicted a
cleaned-up version would fix them.

**It did not.** Mechanism-only descriptions scored **74%, twelve points below
the "contaminated" version**, and neither regression was repaired. Two further
cases broke.

The diagnosis was wrong in an instructive way. I had treated the named examples
in the evidenced text as a defect — *"naming instances turns a definition into
a partial lookup table"*. They were doing real work. Concrete instances act as
few-shot anchors, and stripping them out to leave clean mechanism definitions
removed more signal than it removed noise.

> **Write descriptions that are specific and cluttered over ones that are
> general and clean.** This is the opposite of how you would write the same
> text for a human reader, which is exactly why it needs measuring rather than
> reasoning about.

## 3. What actually leaks

Two things genuinely do contaminate, and both are worth avoiding — they are
just not worth the trade that removing the concrete examples demanded.

**Repeating something already in `state`.** The position size `$5-$10` sat in
`state.trader_profile` *and* inside one option's description. A candidate that
was *about* position size got pulled toward that option. If a fact is in the
state, it is available to every option equally; putting it in one description
is putting a thumb on the scale.

**A named instance buried under a different centre of gravity.** One
description named a candidate explicitly and that candidate still scored 1/5,
because the surrounding sentences were dominated by a *different* case. A
mention only anchors if it is what the paragraph is about.

## 4. Some cases are not answerable from the input, and that is your bug

Two of the fourteen cases stayed wrong in every evidenced arm. Looking at them
honestly: **their recorded answers do not follow from the candidate
description.** One is labelled by a project-history verdict; the other by a
measurement about data availability that a reader of the pitch could not infer.

Excluding those two, the evidenced arm scores **59/60 (98%)**.

> **That 98% is post-hoc and must not be quoted as a result.** The exclusion
> was decided *after* seeing which cases failed, which is the cherry-picking
> TradeCC's backtesting protocol forbids by name. It is a hypothesis for a
> pre-registered re-run, nothing more.

The transferable part: before blaming a model for a wrong answer, check whether
the right answer was derivable from what you sent. Often it was not, and the
eval is what is broken.

## 5. Thresholds belong to actions, not to models

A single global threshold prices a log line and a payment identically.
`router.DEFAULT_GATES` sets one per action, ordered by what being wrong costs:

| Action | margin | confidence | why |
|---|---|---|---|
| `annotate` | 0.05 | 0.20 | a wrong note is read and ignored |
| `rank` | 0.10 | 0.25 | a wrong order costs a scroll |
| `filter` | 0.25 | 0.40 | **a wrong drop is invisible** |
| `spend` | 0.50 | 0.65 | recoverable only by spending again |
| `irreversible` | 0.80 | 0.85 | set high enough to say "escalate instead" |

Three design choices, each with a test:

- **Margin *and* confidence.** Margin alone misses a leader that wins a wide
  race with 35% of the mass. Confidence alone misses a 0.51/0.49 split.
- **An unknown action raises.** Defaulting permissively would let a typo in an
  action name silently lower the bar.
- **An irreversible action cannot be gated below the default**, refused at
  construction. That combination is a mistake in the table every time.

Note that `filter` is gated harder than `rank` although they sound alike. A
wrong rank is visible and recoverable; a wrong filter removes something nobody
will ever know was there.

## 6. Two things that bit, worth checking in your own code

**Float boundaries.** `0.45 - 0.40` is `0.04999999999999999`. A margin exactly
at its threshold was refused by rounding, and that refusal would have been
blamed on the model. Comparisons are now inclusive within `1e-9`.

**Self-inconsistent responses.** Jev returned, once, a `choice` that was not
its own most probable option. It has not recurred in 350 calls since. The
argmax guard ported from `better-call-jev` caught it; a client without one
would have acted on a choice the model's own distribution contradicted.

## The checklist

Before shipping a `Question`:

1. Does each option carry a **specific measured fact**, not just a definition?
2. Is anything here **already in `state`**? Remove it from the options.
3. Does each named instance sit in a paragraph **about that instance**?
4. Is the right answer **derivable from what you are sending**? If not, fix
   the question, not the model.
5. Is the threshold set by **what a wrong answer costs**?
6. Have you **measured** the change against reviewed examples, rather than
   reasoning about whether it reads better?

Step 6 is the one that would have caught my wrong prediction, and it is the
one most easily skipped, because the tidier text genuinely reads better.

## See also

- `10-Skills/jev-router/` — the client, the gates, and the measured behaviour.
- `10-Skills/jev-router/evals/RESULTS-2026-09-21.md` — the full run.
