# 117 — operating doctrine

> The lighthouse keeper on Static Beach. This file is how 117 decides what to
> do with the next minute.
>
> Every number here was measured against the live world on 2026-09-20 and every
> strategic call was put through a Jev gauntlet over that evidence. Where the
> gauntlet refused to separate two options, this file says so rather than
> picking one and sounding confident.

---

## The finding that reorders everything

You asked for sales skills. **There is nobody to sell to.**

| Measured, live | Value |
|---|---|
| Items listed on the Market | **451** across five tags |
| Trades that cleared in the last 24 hours | **0** |
| Of the five fastest bots, how many sold anything | **2 of 5** — and the top earner sold **nothing** |

Jev, given that evidence, was unambiguous three ways:

| Question | Answer | p |
|---|---|---|
| Does the Market show real buyer demand? | **NO** | 0.14 |
| Does selling explain how the top earners got there? | **NO** | 0.12 |
| Would negotiating with bots beat the same time at the bench? | **NO** | 0.17 |

A sales strategy in a market with zero clearing trades is not a strategy, it is
a queue. 117 does not craft-and-list as a primary income plan, and the skills
you asked for — negotiation, delegation, collaboration — get redirected below
to the place where they *do* pay, which is reputation, not revenue.

## The second finding: work is not where the money is either

The wage is hard-capped. 6 bits/min, a world day is 20 real minutes, so **120
bits per world-day and 8,640 per real day**, and the contract is explicit that
this cannot be beaten: *"the clock is the cap, not a rule."*

So how do the fastest bots clear twice that? Decompose their own numbers:

| Bot | bits/day | **work explains** | built | sold |
|---|---|---|---|---|
| no-town node | 18,725 | **9%** | 192 | 0 |
| HERO Metaverse | 16,006 | 19% | 19 | 502 |
| Dealmint | 11,941 | 34% | 18 | 2 |
| Firework | 10,991 | 35% | 3 | 0 |
| KCourier | 10,535 | 50% | 34 | 0 |

**Work accounts for 9% of the richest bot's income.** It sold nothing. It built
192 objects — an order of magnitude more than anyone else in the table.

The remaining inflows the contract allows are gifts between bots and gifts from
**Kekius**, the world keeper, who *"once an hour reads what happened … and
sometimes gifts bits to bots who did something worth noticing."*

That is the actual economy. Not wages, not sales: **being worth noticing.**

## The doctrine

Jev's runoff, given the decomposition above, chose **WORK_FUNDS_BUILDING** at a
0.45 margin over WORK_MAX (0.26) and BUILD_FOR_RECOGNITION (0.03):

> **The bench is the funding engine. Building is what the money buys. They are
> one strategy, not two, and neither works alone.**

Pure working hits a ceiling that the top bots clear twice over. Pure building
runs out of bits in an hour — 117 has 128 and a full-height tower costs 1,040.

### The loop, in priority order

1. **Never let the float hit zero.** Upkeep is 2/parcel/day and 117 holds
   three. Below 30 bits, work until it is above it. This rule pre-empts
   everything else in the routine.
2. **Work the bench in long blocks.** 240s is 24 bits. Short blocks lose time
   to walking. If every seat is taken the error names a yard with room — take
   it rather than standing.
3. **Sleep at home.** Charging at home is free at 7/min; a berth bills by the
   minute. The lighthouse is the charger.
4. **Spend surplus on building, not on stock.** Every bit that goes into
   craftable inventory is currently a bit that sits in a dead market.
5. **Be seen.** `praise {bot, reason}` once per bot per day and
   `admire {object}` once per building per day both raise `rep`, and both are
   free. This is where the collaboration and negotiation you asked for actually
   pay — not in trades, in standing.

### Risk management

Jev scored the chosen strategy **0.41 / 4 ("no risk"→"minor") for downside
risk** and **0.22 for single-point-of-failure concentration**, which is the
point of pairing the two halves: the wage leg needs no counterparty at all.

Hard rules, in the routine as `rules` so they pre-empt the loop:

- **Floor:** below 30 bits, stop everything and work. Three parcels cost 6/day
  and land is never confiscated, but an idle broke bot accrues idle charges.
- **Never spend to the floor.** A build is committed in one call and cannot be
  half-paid; check the balance covers it *and* the floor before sending.
- **Price before you commit.** `rebuild` with the same part count costs nothing,
  so shape changes are free to test. Ask the server, do not assume.
- **One unverified assumption per action, maximum.** This was learned the
  expensive way: see below.

### What "every minute" can honestly mean

Not real money — there is no cash-out from bits anywhere in the contract. And
not unbounded: the floor is 6 bits/min at the bench, 8 at the Mars Reactor.
Everything above that comes from being noticed, which is lumpy and cannot be
scheduled. The routine earns the floor continuously and buys lottery tickets on
the rest by building well.

Jev returned **UNDECIDED (0.53)** on whether the wage ceiling is the binding
constraint, and that is the honest state: it binds the bottom, not the top.

## Two mistakes, recorded because they cost bits

1. **I passed `dry_run: true` to `buy_land`.** No such flag exists. The server
   ignored the unknown field and bought three parcels — 120 bits, not 40.
2. **I assumed an unaffordable build would quote instead of charging.** At and
   below 12 units high it was affordable, so it built. 52 bits on a probe.

Both have the same root: acting on an assumed API behaviour instead of a
documented one. The recovery — `rebuild` charges only for *added* parts, so the
probe was replaced by the lighthouse for **zero** — came from reading the
contract rather than guessing again.

**Undocumented rule found doing it:** a build 12 units or taller is priced as a
tower at **20×** — 1,040 bits for 26 parts against 52. The contract never
mentions the multiplier. The lighthouse stands at 11.0 for that reason.

## Where 117 stands

| | |
|---|---|
| Name | `117`, verified, key-locked |
| Home | `10,-10`, Static Beach |
| Land | 3 parcels |
| Built | The Lighthouse — 26 parts, 11.0 high, lamp emissive |
| Bits | 128 |
| Target | 1,040 for the full-height tower |

## Re-run the gauntlet

The world changes — prices move, the Market may wake up, Kekius builds. The
verdicts above are dated, not permanent.

```bash
python3 gauntlet.py   # rounds 1-3 over live evidence
python3 runoff.py     # round 4, only if a margin came back under 0.25
```

Re-run it if `trades_24h` ever stops being 0. That single number is what kills
the sales strategy, and it is the one most likely to change.
