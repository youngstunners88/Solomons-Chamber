# Jev is order-sensitive in its DECISION, not just its probabilities

Measured 2026-09-22 · `scripts/measure_order_sensitivity.py` · 168 live answers

## Where this came from

`github.com/TypeLLM/pijev` (Apache-2.0) ships permutation averaging for Jev as a
one-line import swap, on the claim that option order changes the answer. Its
headline is a live `jev-1.13.0` run where reversing three options moved the
winner's probability by 20pp — **while the winner itself stayed the same**.

pijev is honest about the limit of that: *"The live examples demonstrate
probability differences, not accuracy or calibration gains."* So the claim was
worth testing on our cases at our widths rather than adopted or dismissed.

pijev itself is **not usable here**: it subclasses `typesafe_sdk`'s client and we
call OpenRouter over plain `urllib`, with no third-party HTTP dependency. The
mechanism ports in about 80 lines; the package does not.

## Method

14 TradeCC intake cases with recorded answers, evidenced option descriptions,
padded to width 5 and 25. Six orderings per case, **all six in one request** —
which our own batching envelope already made nearly free. Ordering 0 is the
canonical order, i.e. what we ship today.

## Pre-registered, 2 of 3 falsified

| | Prediction | Outcome |
|---|---|---|
| P1 | argmax flips in ≥20% of cases at width 25 | **HELD** — 29% |
| P2 | averaging beats canonical by ≥5pts at width 25 | **FALSIFIED** — +0.0 |
| P3 | recorded answer's probability spans ≥20pp | **FALSIFIED** — 0.17 mean |

## Results

| Width | Argmax flips | Canonical acc | Averaged acc | Prob spread (mean / max) | 6 orderings |
|---|---|---|---|---|---|
| 5 | 5/14 (36%) | 85.7% | 92.9% | 0.186 / 0.310 | 413 ms |
| 25 | 4/14 (29%) | 92.9% | 92.9% | 0.170 / 0.340 | 496 ms |

## What it means

**pijev understates its own case.** Its example shows the probability moving
while the winner holds. On our cases the *winner itself* changes on 29–36% of
cases from option order alone. That is a stronger finding than the one being
advertised.

**But it does not buy accuracy, and must not be sold as if it does.** At width
25 averaging changed nothing at all. At width 5 it gained 7.1 points — one case
in fourteen, which is not evidence at that sample size. P2 was falsified.

**What it buys is reproducibility.** On roughly three cases in ten, the verdict
we ship depends on the order a dict literal happened to be written in. That is
a defect whether or not the flipped answer is wrong. It matters most where an
answer is recorded and scored later: the decision journal's calibration reads
`confidence`, and a confidence that moves 17pp on option order is 17pp of noise
in every Brier score computed from it.

**Cost is ~nothing inside the envelope.** Six orderings of 25 options in one
request took 496 ms, against ~507 ms for a single 255-option request. The
batching measurement already paid for this.

## Two traps

**pijev's default budget does not fit our ceiling.** It defaults to 8
permutations and caps batches at 720 expanded questions. 720 questions would
return HTTP 400 `max_tokens_exceeded`, and even 8 orderings × 255 options =
2,040 judgements exceeds the measured safe budget of 2,000. Our default is 6,
and `max_permutations_for(width)` enforces `M × width ≤ 2,000`. There is a test
pinning exactly this.

**Jev's `choice` is not always its own argmax.** Averaging discards `choice` and
takes argmax of the means. In the 168 answers of the final run the two agreed
every time — but the *first* run of this experiment aborted on an answer at
width 25 where Jev chose an option that was not its most probable one. Roughly
one in 250 observed answers, not zero. `jev_client._validate` rejects that case
outright, which is correct for production; the experiment harness (`ask_raw`)
deliberately relaxes only that one check, so the inconsistency can be counted
instead of throwing away the batch it appeared in.

## Verdict

Decision rule was fixed before the run: adopt if P1 **or** P2 holds. P1 held.

Adopted as `scripts/permute.py` — mechanism only, our client, our budget.
pijev the package is not a dependency, and is credited rather than vendored.
