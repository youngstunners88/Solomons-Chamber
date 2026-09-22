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
