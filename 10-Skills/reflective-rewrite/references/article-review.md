# Source review: "Jev on a live wallet" (X article, Sept 2026)

What was taken, and the bones that were left.

## Taken (built into skills, with tests)

| Idea | Where |
|---|---|
| Fast decider + slow reviser, never one model doing both | `reflective-rewrite`, as planes |
| The reviser proposes; a human or test approves | `reflective-rewrite/proposals.py` |
| Read the confident mistakes, not the whole log | `reflective-rewrite/disagreements.py` |
| Code does arithmetic; the model gets adjectives | `state-encoding/encode.py` |
| Small state: every word is a flip, every flip a fee | `state-encoding` flip_rate + hysteresis |
| Log every decision with confidence and what happened next | already Hydra's journal (`paper-clock`, `outcome-resolution`) |
| No answer = hold | already Hydra's router: UNDECIDED, never a fallback guess |
| Two wallets; no model ever sees a key | already Hydra's two-plane rule + egress policy |
| A guard dropped in a rewrite (Bankrbot) | every guard mutation-tested |

## Left behind

| Claim | Why it was not taken |
|---|---|
| **$38,914, +9.22% in 8 days** | The author says it himself: a sample, not a track record. No costs, no benchmark, no out-of-sample. |
| **"Jev is trained to be calibrated"** | Vendor claim. Measured here: confidence 0.62–0.74 on identical input, ~0.1 below the top probability, 0.28 swing from option order. |
| **"Twelve words"** | An anecdote. Measure flip rate on your own series. |
| **High confidence = act, "most of the risk management"** | Only after calibration is measured against resolved outcomes. Otherwise it is a coin flip with a threshold. |
| **Vercel adoption numbers, Alpha Arena spread** | True or not, neither is an edge. Alpha Arena does support "the model is not the edge". |
| **"One question or fifteen, latency barely moves"** | Measured here and TRUE within the envelope (1.05× to 16 questions). A cliff at 32 (5.7×) and a token ceiling at ~2,500 option-judgements. |
