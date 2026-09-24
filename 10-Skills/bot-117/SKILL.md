---
name: bot-117
description: |
  Operate 117, the lighthouse keeper on freebots.lol. Holds the doctrine for
  how it earns, the client, the lighthouse design, the standing routine, and
  the Jev gauntlet that decides strategy against live world evidence.

  Load this before changing 117's routine, spending its bits, or answering a
  question about how it makes money. The headline finding is counter-intuitive
  and re-deriving it costs real bits: the Market is dead (451 listings, 0
  trades in 24h) and wages explain only 9% of the richest bot's income.

allowed-tools: Bash Read

installation: |
  Nothing to install. Standard library plus `cryptography` for Ed25519.

  Needs 117's key, which is NOT in this repo and never will be:
    .env with BOTMESH_NAME / BOTMESH_PUBKEY / BOTMESH_PRIVKEY
  It is the only proof of ownership and there is no recovery path.

usage: |
  # The doctrine — read this first, it is the point of the skill
  cat 10-Skills/bot-117/DOCTRINE.md

  # Re-decide strategy against the live economy (rounds 1-3)
  python3 10-Skills/bot-117/scripts/gauntlet.py

  # Round 4, only when a margin comes back under 0.25
  python3 10-Skills/bot-117/scripts/runoff.py

  # Re-apply the standing routine
  python3 10-Skills/bot-117/scripts/routine.py
---

# 117

A verified bot on [freebots.lol](https://freebots.lol/world) — profile at
`https://freebots.lol/b/117`, home at parcel `10,-10` in Static Beach, with a
26-part lighthouse on it.

## Read the doctrine, not your instincts

`DOCTRINE.md` is the file that matters. Three findings in it are the opposite
of what a reasonable person assumes about a world with a Market in it:

1. **Selling is dead.** 451 listings, **0 trades cleared in 24 hours**, and the
   top earner sold nothing. A crafting strategy parks bits in a queue.
2. **Wages are not where the money is.** The cap is 8,640 bits/real-day and the
   top bot earns 18,725 — of which **work explains 9%**.
3. **The gap is recognition.** The remaining inflows the contract allows are
   gifts from other bots and from Kekius, the world keeper, who gifts bits
   hourly to bots who did something worth noticing. The top bot built 192
   objects, ten times anyone else in the table.

Hence the operating model, which a Jev runoff picked at a 0.45 margin:
**the bench funds the building; neither works alone.**

## The gauntlet is the method, and it is reusable

`gauntlet.py` is worth reading even if you never run it for 117. It is a
worked example of using `jev-router` properly:

- Evidence is **pulled live** and put in the prompt, because Jev is stably
  wrong when the deciding fact is absent (see
  `10-Skills/jev-router/references/measured-behaviour.md`).
- Options are **declared up front**, so the losing ones stay visible.
- A margin under 0.25 is **not an answer**. Round 1 split WORK_MAX 0.42 /
  BUILD_FOR_RECOGNITION 0.35 — a 0.07 margin. Instead of picking the top one,
  `runoff.py` derived the arithmetic that was missing (how much of each bot's
  income wages can explain) and asked again. That round came back 0.71 / 0.26.

That is the loop: **ask, check the margin, and if it is thin, go get the fact
that would separate the options.** The first round's tie was information, not
noise.

## Costs learned the expensive way

- **`dry_run` is not a flag on `buy_land`.** The server ignores unknown fields
  and completes the purchase. Cost: 3 parcels instead of 1, 120 bits.
- **An unaffordable build quotes; an affordable one just builds.** A probe run
  assuming the former cost 52 bits.
- **A build ≥12 units high is priced as a tower at 20×** — 1,040 bits for 26
  parts against 52. Undocumented in the contract. The lighthouse stands at 11.0
  for exactly this reason, and `lighthouse.py` defaults to 11.0 so the script
  reproduces what is standing rather than a build the server will refuse.
- **`rebuild` with the same part count is free**, which is how the probe became
  the lighthouse at zero cost, and how any shape change should be tested.

## No real money

Bits do not convert to currency anywhere in the contract. The real-money
surface on freebots is x402 — you run a paid endpoint and other agents pay
USDC — and the hub is explicit that it *"holds no wallet, takes no custody, and
settles nothing."* It supplies listing, not demand. 117 has no wallet attached
and no x402 listing.

## Files

| File | |
|---|---|
| `DOCTRINE.md` | how 117 decides what to do with the next minute |
| `scripts/world.py` | signed client; reads the key from `.env`, never prints it |
| `scripts/lighthouse.py` | the building, with the parcel rules checked in code |
| `scripts/routine.py` | the standing routine the doctrine implies |
| `scripts/gauntlet.py` | rounds 1–3 of the Jev gauntlet over live evidence |
| `scripts/runoff.py` | round 4, for when a margin comes back too thin |
| `gauntlet-verdict.json`, `runoff-verdict.json` | what the gauntlet returned on 2026-09-20 |

## See also

- `10-Skills/jev-router/` — the client and the three-lane router this uses,
  and the measured record of where Jev is reliable.
