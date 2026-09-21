"""Per-case hit rate across repeats. Five runs of 14 cases are not 70
independent samples -- they are 14 cases measured 5 times each. The useful
question is which cases are stable and which are coin flips."""
import collections, statistics, sys
sys.path.insert(0, "/home/user/solomons-chamber/10-Skills/jev-router/scripts")
import backtest_intake as bt
from jev_client import JevInvalidAnswer, Question, ask

inconsistent = []

REPS = 5
tally = {arm: collections.defaultdict(list) for arm in ("STARVED", "SUPPLIED")}
for _ in range(REPS):
    for arm, opts in (("STARVED", bt.OPTIONS_BARE), ("SUPPLIED", bt.OPTIONS_EVIDENCED)):
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

print(f"{'case':<44} {'STARVED':>9} {'SUPPLIED':>9}   recorded")
flips = []
for name, recorded, _ in bt.CASES:
    s = sum(tally['STARVED'][name]); p = sum(tally['SUPPLIED'][name])
    if 0 < p < REPS: flips.append(name)
    print(f"{name[:43]:<44} {s}/{REPS:<7} {p}/{REPS:<7}   {recorded}")
st = sum(sum(v) for v in tally['STARVED'].values())
su = sum(sum(v) for v in tally['SUPPLIED'].values())
tot = REPS * len(bt.CASES)
print(f"\npooled: STARVED {st}/{tot} ({st/tot:.0%})   SUPPLIED {su}/{tot} ({su/tot:.0%})")
print(f"cases never right when SUPPLIED: "
      f"{[n for n,_,_ in bt.CASES if sum(tally['SUPPLIED'][n])==0] or 'none'}")
print(f"cases that flip under SUPPLIED (unstable): {flips or 'none'}")
print(f"\nself-inconsistent responses (choice != own argmax): {len(inconsistent)} of {2*tot}")
for arm, name, msg in inconsistent:
    print(f"  {arm:<9} {name[:40]:<41} {msg}")
