# TASK LOG - Jev router, better-call-jev port, and bot 117

## Status: ✅ COMPLETE (awaiting review on PR #1)

## Task Description
Three requests in one session, all landing in this vault:
1. Leverage Jev in the build process; create skills to use it "in openrouter".
2. Evaluate `jukkatupamaki/better-call-jev` and create skills to use it effectively.
3. Create bot `117` on freebots.lol with a lighthouse home, then make it
   profitable using a Jev gauntlet loop.

## User Commands (Exact Quotes)
> "I want us to leverage jev in our building process. Create the skills to use it in openrouter"

> "Evaluate how we could use this https://github.com/jukkatupamaki/better-call-jev the create skills to use it effectively"

> "Hey, create a bot called 117 that has a home that looks like a lighthouse, by following the instructions on https://freebots.lol/skill.md"

> "I want 117 to have the skills of sales and the skills of innovation to generate income every minute... Use Jev to find the best ways. I want you to tun a gauntlet loop with jev to active this."

## Execution Plan
- [x] Verify whether Jev is reachable through OpenRouter
- [x] Recover the Jev wire contract by probing the live API
- [x] Build `10-Skills/jev-router/` — client, three-lane router, tests
- [x] Evaluate better-call-jev; port what is worth porting, decline what is not
- [x] Register and verify bot 117; build the lighthouse; set a routine
- [x] Run the Jev gauntlet over 117's live economy and write the doctrine
- [x] Commit and push to `claude/stoic-shannon-1wk611`; open PR

## Files Created / Modified
| File | Action |
|------|--------|
| `10-Skills/jev-router/SKILL.md` | Create |
| `10-Skills/jev-router/scripts/jev_client.py` | Create |
| `10-Skills/jev-router/scripts/router.py` | Create |
| `10-Skills/jev-router/tests/test_jev_router.py` | Create (33 tests) |
| `10-Skills/jev-router/references/measured-behaviour.md` | Create |
| `10-Skills/jev-router/references/better-call-jev-evaluation.md` | Create |
| `10-Skills/jev-fast-tools/scripts/check-jev-env.sh` | Modify (key-name bug) |
| `10-Skills/jev-fast-tools/SKILL.md` | Modify (cross-link) |
| `10-Skills/bot-117/DOCTRINE.md` | Create |
| `10-Skills/bot-117/SKILL.md` | Create |
| `10-Skills/bot-117/scripts/*.py` | Create (5 scripts) |
| `.gitignore` | Modify (`__pycache__`, `*.pyc`) |

## Results

### ✅ Accomplished

**Jev is NOT on OpenRouter.** Checked the live model list: 446 models, zero
matching jev/typesafe/systemone. The real pairing is Jev for structured
decisions plus an OpenAI-compatible endpoint (OpenRouter) for prose — which is
what `jev-ultrafast` already does via `TEXT_MODEL_BASE_URL`.

**Wire contract recovered by probing**, since the docs describe the tools built
on Jev rather than Jev itself. Three question types work on the direct
endpoint: `choice`, `score`, and `noul` (the name `boolean` returns HTTP 400 —
only the Vercel gateway renames it).

**better-call-jev**: ported its three good mechanics (score/boolean types,
0.8/0.2 thresholds with an UNDECIDED band, batching). **Declined its
SessionStart hook**, which says "in this session you do not make judgment calls
yourself" and includes "whether an action is safe to take without asking the
user" — the class of question Jev was measured getting stably wrong.

**Bot 117**: verified, key-locked, home at `10,-10` in Static Beach, 26-part
lighthouse standing at 11.0 high, routine running.

**The gauntlet's finding contradicted the brief, in a useful way.** The Market
holds 451 listings and cleared **0 trades in 24 hours**; the top earner sold
nothing. Wages explain only **9%** of the richest bot's income. Doctrine
settled on WORK_FUNDS_BUILDING at a 0.45 margin.

### ❌ Mistakes made (both cost bits, both recorded in DOCTRINE.md)

1. **Passed `dry_run: true` to `buy_land`** — no such flag; the server ignores
   unknown fields and completed the purchase. Bought 3 parcels, not 1. **120 bits.**
2. **Assumed an unaffordable build would quote rather than charge.** Below the
   tower threshold it was affordable, so it built. **52 bits.**
3. **Committed `lighthouse.py` with `BUILD_HEIGHT = 12.0`**, which the server
   refuses as a tower. What stands is 11.0. Caught on a later check-in and
   fixed — the artifact had not reproduced the building it describes.

Root cause of all three: acting on an assumed API behaviour instead of a
documented one.

### ⚠️ Protocol gap in this session

**I did not create this task log before starting work, as `CLAUDE.md` rule 3
requires.** It is written retrospectively, at the end of the session. The rule
exists precisely so the log is not a reconstruction, and this one is. Noting it
rather than back-dating it.

## Key facts worth carrying forward

- The env var for the Jev key in this environment is **`TYPESAFE`**, not
  `TYPESAFE_API_KEY`. The old `check-jev-env.sh` only checked the latter and so
  reported FAIL on a correctly configured machine. Both now accepted.
- **117's private key is not in this repo and never will be.** It was handed to
  the user as a file. There is no recovery path; the container it was generated
  in is ephemeral.
- A freebots build **≥12 units high costs 20×** (1,040 bits vs 52). Undocumented
  in their contract.

## Started At
2026-09-20T13:20Z (approx — reconstructed)

## Completed At
2026-09-20T15:40Z
