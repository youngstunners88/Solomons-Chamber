# TASK LOG - Deep-dive Minara + Senpi, build the irreversibility harness

## Status: ✅ COMPLETE (pushed to `claude/stoic-shannon-1wk611`, PR #1)

## Task Description
Stop the PR check-ins. Deep-dive two products, extract everything valuable, and
build a skill leveraging their strongest components — using Jev to help decide.
Then build out the skills, toolkits and scripts.

## User Command (Exact Quote)
> "Stop the check ins. Run a deep dive research skill on these to get into
> everything valuable it has for us and build a skill that can leverage all of
> it greatest components: [minara.ai strategy link] and https://senpai.ai/.
> Use jev to help with this. Then build out these skills, toolkits and scripts"

Mid-turn correction:
> "https://senpi.ai/"

## Execution Plan
- [x] Delete the scheduled check-in trigger
- [x] Research Minara (site, docs, llms.txt, skills repo, reference docs)
- [x] Research the second target — resolve `senpai.ai` vs `senpi.ai`
- [x] Clone and read the Senpi open-source repo
- [x] Use Jev to choose what to build, and what shape to ship it in
- [x] Build the skill, scripts and tests
- [x] Mutation-verify the core guards
- [x] Commit and push

## Files Created
| File | Action |
|------|--------|
| `10-Skills/irreversibility-harness/SKILL.md` | Create |
| `10-Skills/irreversibility-harness/scripts/confirm_gate.py` | Create |
| `10-Skills/irreversibility-harness/scripts/ratchet.py` | Create |
| `10-Skills/irreversibility-harness/scripts/reconcile.py` | Create |
| `10-Skills/irreversibility-harness/scripts/preflight.py` | Create |
| `10-Skills/irreversibility-harness/tests/test_confirm_gate.py` | Create (27 tests) |
| `10-Skills/irreversibility-harness/tests/test_ratchet.py` | Create (24 tests) |
| `10-Skills/irreversibility-harness/tests/test_reconcile_and_preflight.py` | Create (26 tests) |
| `10-Skills/irreversibility-harness/references/sources.md` | Create |

## Results

### ✅ Accomplished

**`senpai.ai` is a parked domain for sale**, not a product — a broker listing
page. Reported rather than papered over; the user supplied `senpi.ai`, which is
the real target. Worth recording: the wrong domain still produced a fluent,
well-structured description of *something*. Fluency is not evidence of the right
target.

**The finding from both sources is the same.** Minara ships a 23KB skill file
and Senpi ships 831 files, and in both cases the engineering is overwhelmingly
in the machinery for *refusing to act* — not in features. So the skill built is
the refusal machinery with the trading thrown away.

**Jev chose, twice, above the irreversible gate:**
- What to build first → `IRREVERSIBILITY_HARNESS` (0.96, margin 0.93)
- What shape → `EXECUTABLE_GATE` (0.92, margin 0.84); `DOCTRINE_ONLY` got 0.000

Both clear `router.DEFAULT_GATES["irreversible"]` (0.80/0.85). n=1 each, so used
as a second opinion on a judgement already formed from the sources — the only
use `jev-router` sanctions.

**Four controls shipped, 77 tests, 5 guards mutation-verified (all caught):**

| Control | Enforces |
|---|---|
| `ConfirmationGate` | two-turn confirmation, parameter-drift voiding, single use, expiry |
| `Ladder`/`tick` | two-phase ratchet as a pure function with typed close reasons |
| `reconcile` | absence detection; a vacuous pass is a failure |
| `Registry`/`RetryBudget` | never spawn a command that will hang; max 1 retry |

**The honest limitation is in the code, not hidden.** The gate cannot prove a
human replied. `Attestation.self_asserted()` exists so fabrication is explicit
and logged; `untrusted_executions()` is the CI query.

**A real bug the tests caught during the build**: `Proposal.created_at` used
`time.monotonic()` via `default_factory`, ignoring the gate's injected clock —
so every TTL test measured process uptime rather than the fake timeline. The
wall-clock expiry test failed, which is how it was found.

### ❌ Declined, with reasons

1. **Senpi's strategy package format + 114 templates.** Jev 0.000, correctly:
   inert without the closed-source `@senpi-ai/runtime` supervisor, and aimed at
   live perps trading, which tradecc's rules forbid before a validation gate.
2. **Minara's hardcoded canonical contract addresses.** A stale canonical
   address is worse than none — it lends authority to a wrong answer. The
   technique is documented; the table is not copied.
3. **CLI integration for either product.** Neither installed, no accounts, both
   move real money. Nothing in this skill shells out.

### ⚠️ Could not inspect

- The Minara strategy page in the user's link is client-rendered and returned a
  loading GIF. Only its title (*"Hyper whale copy strategy"*, by *Wizard Anon*)
  was recoverable. **Its logic, parameters and backtest numbers are UNKNOWN**
  and nothing built here derives from it.
- `api.github.com` is blocked from this environment (HTTP 403), so the Minara
  repo tree was enumerated by fetching known paths rather than listed. There may
  be reference docs in it I did not see.

## Key facts worth carrying forward

- Senpi's absence insight, verbatim: *"an unprotected position shows up as an
  absence, not a warning, so you have to look for what's not there."* This vault
  has hit that shape twice already — five phantom submodules, and the CI step
  that fails on zero discovered suites.
- Senpi documents a footgun where `enabled: false` on a scanner **registers
  ENABLED and ticks**, because the engine never reads the key. Their deploy
  refuses any package carrying it. Same class as the zero-tests false green.
- Minara's strongest line is unenforceable by construction: *"NEVER fabricate or
  simulate a user's confirmation."* No in-process object can stop it. Code can
  only make it explicit and auditable.

## Started At
2026-09-22T00:05Z

## Completed At
2026-09-22T00:55Z

---

# CONTINUED — laya-mlx deep dive + decision-cascade

## User Command (Exact Quote)
> "I want you to deep dive this repo and to see how we could use this
> https://github.com/mizorewww/laya-mlx.git then create the necessary skill. I
> want us to see how we can leverage this to our advantage specially when it
> comes to high frequency, trading, and rapid assessment. I want you to also do
> a deep analysis on all of the two we have in our environment so that you can
> also create strategies leveraging them to find the best edges that we can."

## The headline finding

**Laya and Jev are the same architecture family.** Identical primitives
(`QTYPES = {"choice": 0, "score": 1, "noul": 2}`), same "System 1 / System One"
framing, same RLCD training. `noul` is not a word two projects reach
independently. Laya is Apache-2.0 with open weights on Hugging Face.

So the decision lane we rent per call has an open-weight twin.

## The finding that kills the obvious plan

"Run it locally, 10ms instead of 347ms" does not survive the numbers:

| Path | Latency | Runs here? |
|---|---|---|
| Jev via OpenRouter | 347 ms (our measurement) | yes |
| Laya PyTorch CPU | 193–464 ms (upstream) | yes, with torch |
| Laya PyTorch T4 GPU | 32.8 ms (upstream) | needs CUDA |
| laya-mlx M3 Max | 10.9–17.8 ms / 7.4–13.4 ms | **no — Apple Silicon only** |

1. **On CPU, local is SLOWER than remote.** Break-even goes negative.
2. MLX is only ~20–25% over PyTorch on the same Apple hardware — the order of
   magnitude is *local vs network*, not MLX. We don't need Apple Silicon for
   the main benefit; we need a GPU.
3. The repo's README and BENCHMARKS.md **disagree** on the same config.
   Recorded; neither used as a default.

Verified not assumed: `import mlx` → ModuleNotFoundError; dependency is gated
`sys_platform=='darwin' and platform_machine=='arm64'`.

## Built: `10-Skills/decision-cascade/` (33 tests)

Jev chose LATENCY_CASCADE (0.93, margin 0.87) over THROUGHPUT_SCREENER (0.000),
LOCAL_WEIGHTS_UNBLOCK (0.06) and HFT_EXECUTION_PATH (0.01).

Centrepiece is the break-even formula `p < 1 − L1/L2`: a cheap tier at half the
latency must resolve over half of calls or it is strictly slower AND dearer
than not existing. `verdict()` returns DELETE when the cheap tier isn't cheaper
— which is exactly our CPU case.

Also: deadline accounting before each call, margin AND confidence gating, and
`probe()` that reports what the host can actually run with
`suggested_latency_ms` always None (a test pins that) so no budget is ever
copied from someone else's README.

## Mistakes and corrections this session

7. **My mutation harness produced a false NOT-CAUGHT.** Same-length edits inside
   one mtime second left stale `.pyc` files valid, so the mutant never ran.
   Fixed by purging `__pycache__` between runs. Errs safe (under-reports
   coverage) but was reporting a gap that did not exist.
8. **A test asserted the right verdict for the wrong reason — again.**
   `test_a_value_exactly_on_the_threshold_clears` set `min_confidence=0.0`, so
   it only ever exercised the margin tolerance; a mutation inverting the
   confidence tolerance survived it. Split into three tests covering both
   fields and the "tolerance is not a free pass" case. This is the second time
   this exact flaw has appeared (first: the weak-leader gate test).

Final: **15/15 mutants caught** across both skills once pairings were correct.

## Edge analysis delivered

`references/edge-strategies.md`. Two findings eliminate most obvious answers:
LATENCY_RACE blocks 7/14 recorded strategies and no model speed touches it; and
a decision model cannot manufacture an edge absent from its input (measured:
59%→86% from evidence, and two cases unanswerable in every arm).

Five edges that survive, first three needing no hardware/vendor/egress:
exit ratchet (built), reason codes on entries, turnover braking, calibration at
volume (blocked on hardware), throughput screening (blocked on hardware).

Senpi's own README says the exit asymmetry — not the entry signal — is "the
engine behind every strategy template" across 114 packages.

## Open question for the user
Is a GPU or Apple Silicon machine available? Edges 4 and 5 turn entirely on it.

## Completed At
2026-09-22T04:40Z

---

# CONTINUED — jevify methodology + the measured batching envelope

## User Command (Exact Quote)
> "Ok continue. Also are we better off than where we were a week ago? I want
> you to deep dive this repo ... https://github.com/ryana/jevify ... especially
> when it comes to rapid assessment ... Expand upon the build."

Mid-turn: > "I don't have a gpu or apple machine so let's create a workaround
even if it means we have to fork it so that it works for us"

## What jevify turned out to be
Not a codebase — ONE file, one commit: an investigation *methodology* for
finding where Jev pays off in a project. Its operative instruction: "Do not
assume that more questions are free, that batching scales indefinitely, or
that provider-side parallelism eliminates client-visible costs."

So I tested it instead of reading more.

## The measurement (pre-registered)

P1: latency at N=32 > 1.5x N=1 (vendor overselling) -> **FALSIFIED**, 1.05x.
P2: sub-linear, <8x -> HELD.
P3: options cost latency -> HELD weakly, 1.19x for 100x options.

**Second confidently-wrong prediction in this PR.** I expected marketing
overreach and pre-registered it. The vendor claim held.

Then composition FAILED: 32q x 100 options -> HTTP 400 max_tokens_exceeded.
Binary search found the real envelope: two ceilings (255 options/question,
documented; ~2,500 option-judgements/request, a token budget) plus a latency
cliff at 32 questions (5.7x slower than 16 for identical total work).

Optimum: 16 x 159 = 2,544 judgements in 1,551ms = **1,640/second**.

## Built: 10-Skills/rapid-assessment (26 tests, 4 mutants caught)
Planner encoding the measured envelope. **Validated live, 8/8, never lets a
400 through**; its one disagreement is refusing a working-but-cliff shape.

## The no-GPU answer
You don't need one. 1,640 judgements/s measured here with no accelerator; a T4
running Laya unbatched gives ~30 decisions/s. Batching beats the GPU for
throughput. A GPU/local only buys EGRESS (the Hydra blocker), which is a
confidentiality question not a speed one. ONNX int8 CPU path designed in
references/onnx-cpu-workaround.md, explicitly NOT measured, with the cheap
decisive first test named.

## Defect found in our own client
`jev_client.Question` requires >=2 criteria, so it can express `choice` but NOT
`noul` or `score` — a third of Jev's API is unreachable from this vault. The
experiment had to use 2-option choices as stand-in booleans. Not yet fixed.

## Also learned from the docs (never previously read)
- 255 options/choice max; score takes 2-10 levels.
- Nine documented failure modes (jev-1.13 jaggedness): not a calculator, reads
  dates as text not ordered quantities, accuracy falls with irrelevant state,
  not hostile to injection by default.
- Cookbooks already do 218 line-scores/request and 182-candidate selection.

## Completed At
2026-09-22T14:10Z
