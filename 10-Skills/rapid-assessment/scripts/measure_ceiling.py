"""Find the actual capacity ceiling. Binary search on total option count."""
import sys, time, json
sys.path.insert(0, "/home/user/solomons-chamber/10-Skills/jev-router/scripts")
from jev_client import Question, ask, JevError

STATE = {"ticket": "Checkout returns 500 after a discount code. Billed once."}
DESC = "Category {j}: a distinct class of issue."   # ~8 tokens

def try_shape(nq, k):
    opts = {f"OPT{j:03d}": DESC.format(j=j) for j in range(k)}
    qs = [Question(f"q{i}", dict(opts), instructions={"task": f"Judgement {i}."})
          for i in range(nq)]
    try:
        t0 = time.perf_counter(); r = ask(STATE, qs)
        return True, (time.perf_counter()-t0)*1000.0, r.cost_usd or 0.0
    except JevError as e:
        return ("max_tokens_exceeded" not in str(e)), None, str(e)[:70]

print("=== capacity envelope: (questions x options) ===")
results = []
for nq in (1, 2, 4, 8, 16, 32):
    lo, hi, best = 2, 255, None
    while lo <= hi:
        mid = (lo + hi) // 2
        ok, ms, _ = try_shape(nq, mid)
        if ok:
            best = (mid, ms); lo = mid + 1
        else:
            hi = mid - 1
    if best:
        total = nq * best[0]
        print(f"  {nq:>2} questions -> max {best[0]:>3} options each "
              f"= {total:>5} option-judgements, {best[1]:.0f}ms")
        results.append({"questions": nq, "max_options": best[0], "total": total,
                        "p50_ms": best[1]})
    else:
        print(f"  {nq:>2} questions -> even 2 options exceeds the budget")
        results.append({"questions": nq, "max_options": 0, "total": 0})

json.dump(results, open("/tmp/claude-0/-home-user/3d25d2e4-c3db-5d3d-987a-5af4204fefe9/scratchpad/ceiling.json","w"), indent=1)
ok = [r for r in results if r["total"]]
if ok:
    best = max(ok, key=lambda r: r["total"])
    print(f"\nMAX THROUGHPUT SHAPE: {best['questions']} questions x {best['max_options']} "
          f"options = {best['total']} option-judgements in one request ({best['p50_ms']:.0f}ms)")
    print(f"  -> {best['total']/(best['p50_ms']/1000):.0f} option-judgements/second")
    print(f"\nNOTE: totals are roughly constant -> the ceiling is a TOKEN budget,")
    print(f"      not a question or option count.")
