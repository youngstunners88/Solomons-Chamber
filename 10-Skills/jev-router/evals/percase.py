"""Per-case hit rate across repeats. Five runs of 14 cases are not 70
independent samples -- they are 14 cases measured 5 times each. The useful
question is which cases are stable and which are coin flips."""
import collections, statistics, sys
sys.path.insert(0, "/home/user/solomons-chamber/10-Skills/jev-router/scripts")
import backtest_intake as bt
from jev_client import JevInvalidAnswer, Question, ask

inconsistent = []

REPS = 5
ARMS = (("STARVED", "OPTIONS_BARE"), ("EVIDENCED", "OPTIONS_EVIDENCED"), ("MECHANISM", "OPTIONS_MECHANISM"))
tally = {a: collections.defaultdict(list) for a, _ in ARMS}
for _ in range(REPS):
    for arm, attr in ARMS:
        opts = getattr(bt, attr)
        for name, recorded, pitch in bt.CASES:
            try:
                r = ask({"candidate": {"name": name, "what_it_does": pitch},
                         "trader_profile": {"size_usd": "5-10", "chain": "Solana spot",
                                            "data_access": "retail / free tier"}},
                        [Question("cause", dict(opts), instructions={"task": bt.RULES})])
            except JevInvalidAnswer as exc:
                # The argmax guard, ported from better-call-jev, firing on live
                # data: Jev returned a choice that was not its own most probable
                # option. Recorded rather than swallowed -- it is a real
                # observation about the model, not a bug in the harness.
                inconsistent.append((arm, name, str(exc)))
                tally[arm][name].append(False)
                continue
            a = r.answers["cause"]
            tally[arm][name].append(a.choice == recorded)

print(f"{'case':<42} {'STARVE':>7} {'EVID':>6} {'MECH':>6}   recorded")
flips = []
for name, recorded, _ in bt.CASES:
    a = sum(tally['STARVED'][name]); b = sum(tally['EVIDENCED'][name])
    c = sum(tally['MECHANISM'][name])
    if 0 < c < REPS: flips.append(name)
    print(f"{name[:41]:<42} {a}/{REPS:<5} {b}/{REPS:<4} {c}/{REPS:<4}   {recorded}")
tot = REPS * len(bt.CASES)
print()
for arm, _ in ARMS:
    hit = sum(sum(v) for v in tally[arm].values())
    print(f"pooled {arm:<10} {hit}/{tot} ({hit/tot:.0%})")
print(f"\ncases never right under MECHANISM: "
      f"{[n for n,_,_ in bt.CASES if sum(tally['MECHANISM'][n])==0] or 'none'}")
print(f"cases that flip under MECHANISM (unstable): {flips or 'none'}")
print(f"\nself-inconsistent responses (choice != own argmax): {len(inconsistent)} of {len(ARMS)*tot}")
for arm, name, msg in inconsistent:
    print(f"  {arm:<9} {name[:40]:<41} {msg}")
