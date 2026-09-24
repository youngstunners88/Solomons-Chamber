# Jev ecosystem read, 2026-09-24

The six repos supplied, plus three they pointed to, were cloned and read. No
paid calls were made against them. "Verified" below means I read the source or
the recorded data, not that I re-ran it.

## Taken

| From | What | Where it went |
|---|---|---|
| RevocGG/typesafe-jev-bridge `lib/redact.cjs` (MIT) | Token shapes: `sk-`, `apikey_`, `ts_live_`, `ghp_`, JWT, Bearer, `user:pass@` | Hydra `egress.ts`: these are **refused**, not redacted. Mutation-checked. |
| KantaHayashiAI/jev-does-not-play-dice (MIT) | Choice probabilities are sharpened, not forecasts; Noul comes closer | `SKILL.md` §7; Hydra `DRAFT-noul-retention-v2.md` |
| wuyoscar/jev-skill `references/calibration.md` (MIT) | `confidence = (p_max − 1/K)/(1 − 1/K)` (adapter, not the server) | `SKILL.md` §7. This explains our "confidence is on a different scale" finding. |
| wuyoscar/jev-skill context-pilot | An explicit `unknown` option. Missing evidence should produce `unknown`, not a guess: 15/15 withheld cases stayed `unknown`. | Use this when a decision can lack its deciding fact. It is the same lesson as §4. |
| yodablocks/jev-orderby-bench (via cobanov) | 40-row batches fail a ranking gate that 1 row per request passes | Hydra keeps one wallet per request |
| dbreunig/building-with-jev-skill | The question-design rules, below. **The repo has no LICENSE, so ideas only, no text copied.** | Checklist below |

## Question-design rules worth keeping (paraphrased from dbreunig)

- One property per question. Compose the answers in code. Policy belongs in code, never in the question.
- Send words or named buckets, not raw numbers or hex. Do arithmetic, dates and counts in code.
- Noul criteria must point the same way as the statement. A `true` side that means "no" performs worse.
- Score levels describe situations and carry no numerals. The model judges each level alone.
- Put every question that shares a state in one request (speculative fan-out). Make a second request only when it depends on the first answer.
- Change one or two questions per revision, and judge the revision on labelled data.

## Worth studying, not adopted

| Repo | Why it matters | Why not now |
|---|---|---|
| klauswg/jev-guard (MIT) | Crypto transfer triage. Hard rules veto before the model. Its three-column calibration (rules-only / Jev / combined): **rules beat Jev**, 68% vs 50%. Its highest-confidence bucket was the least accurate. | This is the design Hydra already has (heuristic arm vs Jev arms). Take its lesson: **always record the rules-only column.** |
| MorrisZJ/AnyJev | Cyclic-shift marginalisation plus dividing out the label prior. This is our permutation averaging with the prior correction we lack. | Local models only. **No LICENSE file**, so do not copy. Revisit if a GPU appears. |
| chunxiaoxx jev-trust | Logs decisions and outcomes, computes Brier/ECE, and signs the evidence with ed25519 | Hydra's journal already does the first half. Signing is optional polish. |
| bladedevoff/stuntd | Trains a local head from upstream answers and demotes it on drift | Needs local inference. Same blocker as `decision-cascade` (CPU is slower than remote). |
| aowang-ai/jev-trade, jarrodwatts/jev-trader | Jev trading desks | Both have a live-order path. Hydra's rules forbid live trading before the gate. Read only. |

## Left

- jkudish/jev-browser and smartdio/jev-browser-agent are browser agents. They
  have no trading or decision-plane use here. smartdio's `model-router.py` is a
  Choice-plus-Score tier router: the same pattern as `jev-router`, weaker (no
  per-action gates).
- cobanov/awesome-jev is a directory (CC). It was used to find the repos above.

## The one thing to act on

Hydra's retention forecast is a Choice probability scored with Brier, which is
the configuration the dice study shows breaking. The draft v2 adds a Noul arm
and a constant-0.5 arm. It is unsealed until the owner says yes.
