"""Does Jev still discriminate when the option set is wide?

The rapid-assessment envelope proved 255 options FIT. It said nothing about
whether the answer is still right. This measures that.

Design: the 14 TradeCC intake cases with recorded verdicts, EVIDENCED option
descriptions (the arm that scored 86%), padded with plausible distractor causes
to widths 5 / 25 / 100 / 255. The recorded answer is always present.

PRE-REGISTERED, BEFORE RUNNING:
  P1. Accuracy DEGRADES with width. Specifically acc(255) is at least 20 points
      below acc(5).
  P2. Confidence falls with width even where the answer stays correct (mass is
      spread over more options).

DECISION RULE (fixed): a width is usable as a SCREEN if accuracy >= 70% of the
width-5 accuracy; usable as a VERDICT only if within 5 points of width-5.
"""
import json, statistics, sys, time
sys.path.insert(0, "/home/user/solomons-chamber/10-Skills/jev-router/scripts")
sys.path.insert(0, "/home/user/solomons-chamber/10-Skills/jev-router/evals")
from jev_client import Question, ask
from backtest_intake import CASES, OPTIONS_EVIDENCED, RULES

WIDTHS = [5, 25, 100, 255]
REPEATS = 3

# Distractors: plausible blockers that are NOT among the five real causes.
STEMS = [
 "Regulatory licensing in the target jurisdiction is not held.",
 "The venue's API terms forbid programmatic access at this tier.",
 "Custody arrangements do not permit holding the asset.",
 "Counterparty credit exposure is unhedged and uncapped.",
 "Settlement finality is probabilistic over the relevant horizon.",
 "Oracle dependency introduces a single point of manipulation.",
 "Gas or fee volatility exceeds the expected gross margin.",
 "Position limits at the venue bind below a workable size.",
 "Tax treatment of the instrument is unresolved.",
 "Required market-maker agreement is not in place.",
 "Liquidity fragments across venues faster than rebalancing.",
 "The strategy's capacity decays before fixed costs amortise.",
]
def distractors(n):
    out = {}
    for i in range(n):
        out[f"BLOCK_{i:03d}"] = STEMS[i % len(STEMS)] + f" (variant {i//len(STEMS)+1})"
    return out

def options_at(width):
    opts = dict(OPTIONS_EVIDENCED)              # the 5 real causes
    need = width - len(opts)
    if need > 0:
        opts.update(distractors(need))
    return opts

print(f"{'width':>6} {'accuracy':>10} {'mean conf':>10} {'mean margin':>12}  p50 ms")
rows = []
for w in WIDTHS:
    opts = options_at(w)
    hits, confs, margins, lats = 0, [], [], []
    total = 0
    for name, recorded, pitch in CASES:
        for _ in range(REPEATS):
            t0 = time.perf_counter()
            r = ask({"candidate": {"name": name, "what_it_does": pitch},
                     "trader_profile": {"size_usd": "5-10", "chain": "Solana spot",
                                        "data_access": "retail / free tier"}},
                    [Question("cause", dict(opts), instructions={"task": RULES})])
            lats.append((time.perf_counter()-t0)*1000)
            a = r.answers["cause"]
            total += 1
            if a.choice == recorded: hits += 1
            confs.append(a.confidence); margins.append(a.margin)
    acc = hits/total
    rows.append({"width": w, "accuracy": acc, "hits": hits, "total": total,
                 "mean_conf": statistics.fmean(confs),
                 "mean_margin": statistics.fmean(margins),
                 "p50_ms": statistics.median(lats)})
    print(f"{w:>6} {hits:>4}/{total:<5} {acc:>6.1%} {statistics.fmean(confs):>9.3f} "
          f"{statistics.fmean(margins):>11.3f}  {statistics.median(lats):.0f}")

base = rows[0]["accuracy"]
print("\n=== VERDICT (rules fixed before running) ===")
for r in rows:
    rel = r["accuracy"]/base if base else 0
    verdict = ("VERDICT-GRADE" if abs(r["accuracy"]-base) <= 0.05
               else "SCREEN-ONLY" if rel >= 0.70 else "UNUSABLE")
    print(f"  width {r['width']:>3}: {r['accuracy']:.1%} ({rel:.0%} of width-5) -> {verdict}")
drop = (base - rows[-1]["accuracy"]) * 100
print(f"\nP1 (acc(255) at least 20pts below acc(5)): drop={drop:.1f}pts -> "
      f"{'HELD' if drop >= 20 else 'FALSIFIED'}")
print(f"P2 (confidence falls with width): {rows[0]['mean_conf']:.3f} -> "
      f"{rows[-1]['mean_conf']:.3f} -> {'HELD' if rows[-1]['mean_conf'] < rows[0]['mean_conf'] else 'FALSIFIED'}")
json.dump(rows, open("/tmp/claude-0/-home-user/3d25d2e4-c3db-5d3d-987a-5af4204fefe9/scratchpad/width.json","w"), indent=1)
