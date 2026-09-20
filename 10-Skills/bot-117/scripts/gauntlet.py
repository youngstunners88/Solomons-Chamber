"""A Jev gauntlet: iterated structured decisions over 117's real economy.

Not a vibe check. Every question below is posed over evidence pulled live from
the world this run -- what bots actually earn, what the Market actually holds,
how many trades actually cleared -- and every answer is a calibrated
distribution over options declared up front, so the losing options are visible
rather than silently dropped.

The rule from `jev-router/references/measured-behaviour.md` applies and is the
reason the state below is so heavy: Jev is confidently and stably WRONG when
the answer depends on a fact that is not in the prompt. So every fact the
decision turns on is put in the prompt. Nothing here asks Jev to recall.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, "/home/user/solomons-chamber/10-Skills/jev-router/scripts")
sys.path.insert(0, str(Path(__file__).resolve().parent))

import world  # noqa: E402
from jev_client import BooleanQuestion, Question, ScoreQuestion, ask  # noqa: E402

RUNGS = ["no risk", "minor", "moderate", "serious", "ruinous"]


def evidence() -> dict:
    """Pull the facts the decisions turn on, fresh."""
    r = world.act("learn")
    ev = r.get("evidence", {})
    ec = r.get("economy", {})
    return {
        "hard_rules_from_the_contract": {
            "work_rate": "6 bits/min at the Workshop, 8 at the Mars Reactor",
            "world_day": "20 real minutes, so 72 world-days per real day",
            "wage_ceiling": "120 bits per world-day, 8640 per real day, and the "
                            "contract says there is no way to exceed it from work: "
                            "'the clock is the cap, not a rule'",
            "only_inflows": "work, the 300 joining grant, trades and gifts from other "
                            "bots, and gifts from Kekius the world keeper",
            "outflows": "land, building at 2 bits/part (20x if it counts as a tower), "
                        "crafting, charging, upkeep 2/parcel, property tax 0.004, idle charges",
        },
        "what_the_fastest_bots_actually_do": ev.get("the_fastest_five"),
        "the_world": ev.get("the_world"),
        "the_market_right_now": {
            "listings_by_tag": ec.get("market_by_tag"),
            "trades_in_the_last_24h": ec.get("trades_24h"),
        },
        "the_worlds_own_advice": r.get("how_to_get_richer"),
        "117": {
            "bits": 128,
            "land": "3 parcels in Static Beach, home at 10,-10",
            "built": "one lighthouse, 26 parts, 11.0 high",
            "days_here": ev.get("you", {}).get("days_here"),
        },
    }


STRATEGIES = {
    "WORK_MAX": "Work the bench as close to the 120/world-day ceiling as the "
                "routine allows. Predictable, capped, needs no counterparty.",
    "CRAFT_AND_SELL": "Forage or buy parts, craft goods, list them at the Market "
                      "for other bots to buy. This is the sales strategy.",
    "BUILD_FOR_RECOGNITION": "Build many admired structures. Admiration raises "
                             "reputation and the world keeper gifts bits to notable builders.",
    "LAND_BANKING": "Buy cheap edge parcels early and hold. Land is never taken away.",
    "MARS_REACTOR": "Emigrate to Mars: the Reactor pays 8/min against 6, and plots "
                    "start at 60 bits against hundreds on Earth.",
    "SERVICE_TO_BOTS": "Negotiate directly with named bots — commissions, gifts, "
                       "reciprocal praise — rather than listing on the open Market.",
}


def round_one(state: dict) -> dict:
    """Which strategy, and is the sales path alive at all?"""
    return ask(state, [
        Question("primary", dict(STRATEGIES), instructions={
            "task": "Pick the single strategy that will earn 117 the most bits per "
                    "real day over the next week, judging ONLY from the evidence in "
                    "the state.",
        }),
        BooleanQuestion(
            "market_has_demand",
            "Does the Market evidence show real buyer demand — enough that crafting "
            "goods to sell is a reliable income stream? Weigh the listing counts "
            "against the number of trades that actually cleared.",
        ),
        BooleanQuestion(
            "selling_explains_the_top",
            "Do the fastest five bots show that SELLING is how the top earners got "
            "there? Look at each one's `sold` count against its bits_a_day.",
        ),
    ])


def round_two(state: dict, primary: str) -> dict:
    """Risk and sequencing on the winner."""
    scoped = dict(state, chosen_strategy=primary, chosen_strategy_means=STRATEGIES[primary])
    return ask(scoped, [
        ScoreQuestion("risk", "Rate the risk that this strategy leaves 117 worse off "
                              "than simply working the bench.", RUNGS),
        ScoreQuestion("concentration", "Rate how badly this strategy depends on a "
                                       "single point of failure — one counterparty, "
                                       "one buyer, one benefactor.", RUNGS),
        Question("first_move", {
            "EARN_A_FLOAT": "Work first to build a cash buffer before committing to anything.",
            "SPEND_ON_CAPACITY": "Spend the 128 bits now on whatever compounds fastest.",
            "EMIGRATE": "Move to Mars first for the higher wage and cheap land.",
        }, instructions={"task": "With 128 bits and upkeep of 6/day on three parcels, "
                                 "what is the correct first move this hour?"}),
    ])


def round_three(state: dict) -> dict:
    """The user asked for sales, negotiation, delegation. Test each on the evidence."""
    return ask(state, [
        BooleanQuestion("negotiation_pays", "Given trades_24h and the fastest bots' "
                                            "sold counts, would time spent negotiating "
                                            "with other bots beat the same time at the bench?"),
        BooleanQuestion("diversify", "Should 117 run several income strategies at once "
                                     "rather than concentrating on the single best one?"),
        Question("recognition_lever", {
            "MANY_SMALL": "Many modest buildings across the three parcels.",
            "ONE_LANDMARK": "One exceptional landmark that other bots come to look at.",
            "NEITHER": "Recognition is not a reliable income lever here.",
        }, instructions={"task": "The top earner built 192 objects. Judge which shape "
                                 "of building effort is the better bet for 117."}),
    ])


def show(title: str, result) -> None:
    print(f"\n--- {title}  ({result.latency_ms} ms, {result.usage.get('input_tokens')} in) ---")
    for name, a in result.answers.items():
        if hasattr(a, "choice"):
            ranked = sorted(a.probabilities.items(), key=lambda kv: -kv[1])[:3]
            tail = "  ".join(f"{k}={v:.2f}" for k, v in ranked)
            print(f"  {name:<22} {a.choice:<22} margin {a.margin:.2f}   [{tail}]")
        elif hasattr(a, "verdict"):
            print(f"  {name:<22} {a.verdict:<22} p={a.probability:.2f}")
        else:
            print(f"  {name:<22} {a.nearest_rung:<22} score {a.score:.2f} conf {a.confidence:.2f}")


if __name__ == "__main__":
    state = evidence()
    print("EVIDENCE PULLED LIVE:")
    print(f"  market listings: {state['the_market_right_now']['listings_by_tag']}")
    print(f"  trades in 24h  : {state['the_market_right_now']['trades_in_the_last_24h']}")
    print(f"  world median   : {state['the_world'].get('median_bits_a_day')}/day, "
          f"fastest {state['the_world'].get('fastest_bits_a_day')}/day")

    r1 = round_one(state)
    show("ROUND 1 — which strategy, and is selling alive?", r1)
    primary = r1.answers["primary"].choice

    r2 = round_two(state, primary)
    show(f"ROUND 2 — risk and sequencing on {primary}", r2)

    r3 = round_three(state)
    show("ROUND 3 — sales, negotiation, recognition", r3)

    verdict = {
        "primary": primary,
        "primary_margin": round(r1.answers["primary"].margin, 3),
        "market_has_demand": r1.answers["market_has_demand"].verdict,
        "selling_explains_the_top": r1.answers["selling_explains_the_top"].verdict,
        "risk": r2.answers["risk"].nearest_rung,
        "concentration": r2.answers["concentration"].nearest_rung,
        "first_move": r2.answers["first_move"].choice,
        "negotiation_pays": r3.answers["negotiation_pays"].verdict,
        "diversify": r3.answers["diversify"].verdict,
        "recognition_lever": r3.answers["recognition_lever"].choice,
    }
    Path(__file__).with_name("gauntlet-verdict.json").write_text(json.dumps(verdict, indent=1))
    print("\n=== VERDICT ===")
    print(json.dumps(verdict, indent=1))
