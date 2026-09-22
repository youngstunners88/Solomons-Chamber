"""Is Jev's decision sensitive to the ORDER the options are listed in?

pijev (TypeLLM, Apache-2.0) claims it is, and sells permutation averaging as the
fix. Its headline is a live jev-1.13.0 run where reversing three options moved
the winner's probability by 20 percentage points -- while the WINNER stayed the
same in both orderings.

That distinction is the whole question for this vault. We consume `choice` for
routing and `confidence` for the decision journal's calibration. A probability
that wobbles while the argmax holds is a calibration problem. An argmax that
flips is a correctness problem. pijev's own example only demonstrates the first,
and its README says so: "The live examples demonstrate probability differences,
not accuracy or calibration gains."

So: measure both, at the widths we actually use, on cases with recorded answers.

METHOD
  Same state, same option set, M shuffled orderings, all M sent as separate
  questions in ONE request (pijev's batching trick, which our measured envelope
  already supports: 6 x 25 = 150 option-judgements, well inside 2,000).
  Ordering 0 is the canonical order -- what we ship today.

PRE-REGISTERED, BEFORE RUNNING (see prereg seals printed at startup):
  P1. The argmax FLIPS across orderings in at least 20% of cases at width 25.
  P2. Permutation-averaged accuracy beats canonical-order accuracy by at least
      5 points at width 25.
  P3. The recorded answer's probability spans at least 20pp across orderings,
      matching pijev's headline at K=3.

DECISION RULE (fixed before running): adopt permutation averaging into
rapid-assessment only if P1 OR P2 holds. Otherwise record it as measured and
rejected, and keep the single-order call.
"""
import json, random, statistics, sys, time
ROOT = "/home/user/solomons-chamber"
sys.path.insert(0, f"{ROOT}/10-Skills/jev-router/scripts")
sys.path.insert(0, f"{ROOT}/10-Skills/jev-router/evals")
sys.path.insert(0, f"{ROOT}/10-Skills/measure-first/scripts")
from jev_client import Question, ask
import jev_client

def ask_raw(state, questions, timeout=60.0):
    """Same request as ask(), but WITHOUT the argmax-consistency check.

    ask() raises JevInvalidAnswer when Jev's own `choice` is not its own most
    probable option. That guard is right for production -- acting on a
    self-inconsistent answer is worse than stopping -- but here the
    inconsistency is one of the things being measured, and raising would throw
    away the whole batch it appeared in. Every other contract check (option set,
    finiteness, mass summing to 1) still applies below.
    """
    body = {"model": jev_client.DEFAULT_MODEL, "state": state,
            "questions": {q.name: q.to_payload() for q in questions}}
    raw = jev_client._post(body, timeout, jev_client.DEFAULT_ROUTE)
    out = {}
    for q in questions:
        a = raw["answers"][q.name]
        probs = dict(a["probabilities"])
        assert set(probs) == set(q.criteria), f"{q.name}: option set mismatch"
        assert abs(sum(probs.values()) - 1.0) <= jev_client.PROBABILITY_SUM_TOLERANCE
        out[q.name] = (a["choice"], float(a["confidence"]), probs)
    return out
from backtest_intake import CASES, OPTIONS_EVIDENCED, RULES
from prereg import Registry

WIDTHS = [5, 25]
M = 6                 # permutations per case; 3! = 6, and it fits both widths
SEED = 42
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

def options_at(width):
    opts = dict(OPTIONS_EVIDENCED)
    for i in range(width - len(opts)):
        opts[f"BLOCK_{i:03d}"] = STEMS[i % len(STEMS)] + f" (variant {i//len(STEMS)+1})"
    return opts

def orderings(labels, m, rng):
    """Ordering 0 is canonical -- what we ship. The rest are distinct shuffles."""
    seen = {tuple(labels): None}
    while len(seen) < m:
        s = list(labels); rng.shuffle(s); seen[tuple(s)] = None
    return list(seen)

reg = Registry()
SEALS = [
    reg.seal("P1_argmax_flips",
             "argmax flips across orderings in >=20% of cases at width 25",
             lambda o: o["flip_rate_w25"] >= 0.20),
    reg.seal("P2_avg_beats_canonical",
             "permutation-averaged accuracy beats canonical by >=5pts at width 25",
             lambda o: (o["avg_acc_w25"] - o["canon_acc_w25"]) >= 0.05),
    reg.seal("P3_prob_spread",
             "recorded answer's probability spans >=20pp across orderings",
             lambda o: o["mean_spread_w25"] >= 0.20),
]
print("SEALED:")
for _p in SEALS:
    print(f"  {_p.seal}  {_p.name}: {_p.claim}")
print()

rows, observed = [], {}
for w in WIDTHS:
    opts = options_at(w)
    labels = list(opts)
    rng = random.Random(SEED)
    flips = canon_hits = avg_hits = 0
    spreads, cases_n, lats = [], 0, []
    incoherent_n = answers_n = 0
    for name, recorded, pitch in CASES:
        orders = orderings(labels, M, rng)
        qs = [Question(f"cause_{i}", {lab: opts[lab] for lab in order},
                       instructions={"task": RULES})
              for i, order in enumerate(orders)]
        t0 = time.perf_counter()
        r = ask_raw({"candidate": {"name": name, "what_it_does": pitch},
                     "trader_profile": {"size_usd": "5-10", "chain": "Solana spot",
                                        "data_access": "retail / free tier"}}, qs)
        lats.append((time.perf_counter() - t0) * 1000)
        answers = [r[f"cause_{i}"] for i in range(len(orders))]
        picks = [c for c, _, _ in answers]
        # How often does Jev's OWN choice disagree with its OWN argmax? pijev
        # discards `choice` and takes argmax of the means, so wherever these two
        # disagree, permutation averaging silently changes the answer.
        for c, _, pr in answers:
            incoherent_n += 1 if pr[c] < max(pr.values()) - 1e-6 else 0
            answers_n += 1
        # Label-aligned mean, exactly as pijev aggregates.
        means = {lab: statistics.fmean(pr[lab] for _, _, pr in answers) for lab in labels}
        avg_pick = max(means, key=means.__getitem__)
        rec_probs = [pr[recorded] for _, _, pr in answers]
        cases_n += 1
        if len(set(picks)) > 1: flips += 1
        if picks[0] == recorded: canon_hits += 1
        if avg_pick == recorded: avg_hits += 1
        spreads.append(max(rec_probs) - min(rec_probs))
    row = {"width": w, "cases": cases_n, "flip_rate": flips / cases_n,
           "canon_acc": canon_hits / cases_n, "avg_acc": avg_hits / cases_n,
           "mean_spread": statistics.fmean(spreads), "max_spread": max(spreads),
           "incoherent": incoherent_n, "answers": answers_n,
           "p50_ms": statistics.median(lats)}
    rows.append(row)
    print(f"width {w:>3}  flips {flips}/{cases_n} ({row['flip_rate']:.0%})  "
          f"canonical {row['canon_acc']:.1%}  averaged {row['avg_acc']:.1%}  "
          f"spread mean {row['mean_spread']:.3f} max {row['max_spread']:.3f}  "
          f"{row['p50_ms']:.0f}ms for {M} orderings")
    print(f"          choice != own argmax in {incoherent_n}/{answers_n} answers")
    if w == 25:
        observed = {"flip_rate_w25": row["flip_rate"], "avg_acc_w25": row["avg_acc"],
                    "canon_acc_w25": row["canon_acc"], "mean_spread_w25": row["mean_spread"]}

print("\n=== GRADING (rules sealed before the run) ===")
for _p in SEALS:
    res = reg.grade(_p.name, observed)
    print(f"  {res.prediction.name}: {res.outcome.value.upper()}")
print(reg.report())
adopt = observed["flip_rate_w25"] >= 0.20 or (observed["avg_acc_w25"] - observed["canon_acc_w25"]) >= 0.05
print(f"\nDECISION: {'ADOPT' if adopt else 'REJECT'} permutation averaging "
      f"(flip {observed['flip_rate_w25']:.0%}, accuracy delta "
      f"{(observed['avg_acc_w25']-observed['canon_acc_w25'])*100:+.1f}pts)")
print(json.dumps({"rows": rows, "observed": observed, "adopt": adopt}, indent=2))
