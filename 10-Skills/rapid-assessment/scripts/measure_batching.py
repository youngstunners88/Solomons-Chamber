import statistics, sys, time, json
sys.path.insert(0, "/home/user/solomons-chamber/10-Skills/jev-router/scripts")
from jev_client import Question, ask

STATE = {"ticket": "Customer reports the checkout page returns a 500 error after "
                   "applying a discount code. Billed once, no confirmation email. "
                   "Pro plan, contacted support twice this week about login issues."}
REPEATS = 3
TOPICS = ["urgency","billing","auth","data_loss","regression","security","ux",
          "performance","docs","integration","mobile","api","email","search",
          "export","import","perms","quota","latency","webhook","sso","audit",
          "backup","locale","theme","notify","report","sync","cache","queue",
          "retry","schema"]

def mk(i):
    return Question(f"q{i}", {"YES": f"This ticket involves {TOPICS[i]}.",
                              "NO": f"This ticket does not involve {TOPICS[i]}."},
                    instructions={"task": f"Does this ticket involve {TOPICS[i]}?"})

rows = []
for n in (1, 2, 4, 8, 16, 32):
    lats, costs = [], []
    for _ in range(REPEATS):
        t0 = time.perf_counter()
        r = ask(STATE, [mk(i) for i in range(n)])
        lats.append((time.perf_counter()-t0)*1000.0)
        costs.append(r.cost_usd or 0.0)
    p50 = statistics.median(lats)
    rows.append({"n": n, "p50_ms": p50, "per_q_ms": p50/n, "cost": statistics.median(costs)})
    print(f"  N={n:>2}  p50={p50:7.1f}ms  per-question={p50/n:6.1f}ms  cost=${statistics.median(costs):.6f}")

one = rows[0]
big = rows[-1]
n16 = next(r for r in rows if r["n"] == 16)
ratio = n16["per_q_ms"]/one["per_q_ms"]
g = big["p50_ms"]/one["p50_ms"]
print("\n=== VERDICT (rules fixed before running) ===")
print(f"per-question latency at N=16 is {ratio:.1%} of N=1 -> batching "
      f"{'WORTH IT' if ratio < 0.5 else 'NOT worth it'} (rule: <50%)")
print(f"P1 growth real (>1.5x at N=32): {g:.2f}x -> {'HELD' if g>1.5 else 'FALSIFIED'}")
print(f"P2 sub-linear (<8x): {g:.2f}x -> {'HELD' if g<8 else 'FALSIFIED'}")
print(f"cost N=1 ${one['cost']:.6f} vs N=32 ${big['cost']:.6f} "
      f"({big['cost']/max(one['cost'],1e-12):.1f}x for 32x the questions)")
json.dump(rows, open("/tmp/claude-0/-home-user/3d25d2e4-c3db-5d3d-987a-5af4204fefe9/scratchpad/arm_a.json","w"), indent=1)
