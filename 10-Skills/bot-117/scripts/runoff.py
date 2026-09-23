"""Round 4: resolve the two decisions round 1-3 left under the margin threshold.

Round 1 split WORK_MAX 0.42 / BUILD_FOR_RECOGNITION 0.35 — a 0.07 margin, well
under the 0.25 the router treats as decidable. Round 3 split the recognition
lever 0.50 / 0.49. Neither is an answer; both are "the option set did not
separate, go get more evidence."

So this round supplies the evidence that was missing: the arithmetic on how
much of each top bot's income the wage ceiling can actually account for. That
number was derivable from round 1's state but never derived, and it is exactly
the fact the decision turns on.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, "/home/user/solomons-chamber/10-Skills/jev-router/scripts")
sys.path.insert(0, "/home/user/solomons-chamber/10-Skills/rapid-assessment/scripts")
sys.path.insert(0, str(Path(__file__).resolve().parent))

import world  # noqa: E402
from jev_client import BooleanQuestion, Question, ask  # noqa: E402
from permute import ask_stable  # noqa: E402

WAGE_CEILING_PER_REAL_DAY = 72 * 120  # 72 world-days of 20 min, capped at 120 each


def decompose() -> list[dict]:
    """For each fast bot: how much of its daily income can work explain?"""
    rows = []
    for b in world.act("learn").get("evidence", {}).get("the_fastest_five", []):
        days = b.get("days_here") or 1
        worked_per_day = round(b.get("worked_bits", 0) / days)
        total = b.get("bits_a_day", 0)
        rows.append({
            "name": b["name"],
            "bits_a_day": total,
            "worked_bits_per_day": worked_per_day,
            "unexplained_by_work_per_day": total - worked_per_day,
            "share_from_work": f"{100 * worked_per_day / total:.0f}%" if total else "n/a",
            "objects_built": b.get("built", 0),
            "items_sold": b.get("sold", 0),
            "parcels": b.get("land"),
            "self_described_as": b.get("lives_by"),
        })
    return rows


if __name__ == "__main__":
    rows = decompose()
    state = {
        "question_behind_this": "Round 1 could not separate working from building. "
                                "Here is the arithmetic it was missing.",
        "the_wage_ceiling": {
            "per_world_day": 120,
            "world_days_per_real_day": 72,
            "so_max_from_work_per_real_day": WAGE_CEILING_PER_REAL_DAY,
            "note": "The contract is explicit that this cannot be exceeded by working: "
                    "'the clock is the cap, not a rule.'",
        },
        "the_fastest_five_decomposed": rows,
        "117_now": {"bits": 128, "parcels": 3, "buildings": 1, "upkeep_per_day": 6},
    }

    print("DECOMPOSITION")
    for r in rows:
        print(f"  {r['name'][:22]:<23} {r['bits_a_day']:>6}/day  work explains "
              f"{r['share_from_work']:>4}  built={r['objects_built']:>3} sold={r['items_sold']:>4}")

    # Round 1 split this 0.42 / 0.35 -- a 0.07 margin, far under the 0.25 the
    # router treats as decidable. That is exactly the regime where option ORDER
    # decides the verdict: measured 2026-09-22, the argmax flips on 29% of
    # cases at width 25 from ordering alone. Three options have six orderings,
    # so this enumerates ALL of them -- the exact group average, not a sample.
    # The two booleans have no option order to vary and ride along unpermuted.
    primary = ask_stable(
        state,
        Question("primary", {
            "WORK_MAX": "Concentrate on the bench. Capped but certain.",
            "BUILD_FOR_RECOGNITION": "Concentrate on building admired structures and "
                                     "the gifts and reputation that follow.",
            "WORK_FUNDS_BUILDING": "Treat the bench as the funding engine and building "
                                   "as what the money is spent on — one strategy, not two.",
        }, instructions={"task": "Resolve round 1's tie using the decomposition. Which "
                                 "describes how 117 should actually operate?"}),
        m=6,
        extra=[
            BooleanQuestion("work_alone_explains_the_top",
                        "Can working alone account for what the fastest bots earn per day? "
                            "Compare each bot's worked_bits_per_day against its bits_a_day."),
            BooleanQuestion("ceiling_is_binding",
                            "Is the 8,640/real-day wage ceiling the binding constraint on how "
                            "rich 117 can get, rather than effort or cleverness?"),
        ],
    )

    print(f"\n--- RUNOFF ({primary.orderings} orderings) ---")
    ranked = sorted(primary.probabilities.items(), key=lambda kv: -kv[1])
    print(f"  {'primary':<28} {primary.choice:<22} margin {primary.margin:.2f}  "
          f"[{'  '.join(f'{k}={v:.2f}' for k, v in ranked)}]")
    # Print the disagreement rather than averaging it out of sight. An unstable
    # verdict is not necessarily wrong, but it IS one that depended on the order
    # the options happened to be written in, and that belongs in the record.
    if primary.flipped:
        print(f"  {'':<28} UNSTABLE: orderings picked {sorted(set(primary.picks))}; "
              f"winner's probability spanned {primary.spread:.2f}")
    else:
        print(f"  {'':<28} stable across all {primary.orderings} orderings "
              f"(spread {primary.spread:.2f})")
    for name, a in primary.extra.items():
        print(f"  {name:<28} {a.verdict:<22} p={a.probability:.2f}")

    out = {
        "primary": primary.choice,
        "margin": round(primary.margin, 3),
        # NOT Jev's native confidence -- the winning label's mean probability
        # over the orderings. Kept under a distinct name so it can never be
        # pooled with a single-order confidence in one calibration bucket.
        "mean_confidence": round(primary.mean_confidence, 3),
        "orderings": primary.orderings,
        "stable": primary.stable,
        "picks_by_ordering": list(primary.picks),
        "winner_probability_spread": round(primary.spread, 3),
        "work_alone_explains_the_top": primary.extra["work_alone_explains_the_top"].verdict,
        "ceiling_is_binding": primary.extra["ceiling_is_binding"].verdict,
        "decomposition": rows,
    }
    Path(__file__).with_name("runoff-verdict.json").write_text(json.dumps(out, indent=1))
