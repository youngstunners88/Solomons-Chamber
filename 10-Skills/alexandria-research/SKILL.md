---
name: alexandria-research
description: |
  Firecrawl Alexandria as a research lane — and the one thing it verifiably
  does for us that nothing else here can: reach GitHub's API, which returns
  HTTP 403 from this container.

  Load this when a deep dive is blocked by an unreachable API or a
  client-rendered page. Do NOT load it for on-chain data; it has none.
allowed-tools: Bash Read
usage: |
  python3 -m pytest 10-Skills/alexandria-research/tests -q

# Alexandria

## The env var trap — read this first

| Variable | Length | Result |
|---|---|---|
| `FIRECRAWL_API_KEY` | 44, `sk-…` | **401 Invalid token** |
| `FIRECRAWL` | 35 | **200** |

The longer, more official-looking name is the dead one. This is the same shape
as `TYPESAFE` vs `TYPESAFE_API_KEY`, which made `check-jev-env.sh` report FAIL
on a correctly configured machine. `api_key()` prefers the one measured to
work, and a test pins that order — reverse it and everything 401s.

## What it verifiably buys us

`api.github.com` is **403 from this container** (org policy). That blocked repo
enumeration twice in one session: the Minara skills repo had to be probed
path-by-path instead of listed.

Measured both directions, same session:

```
direct   api.github.com/repos/Senpi-ai/senpi-skills   -> HTTP 403
via      github-com/repositories/search_repos          -> upstreamStatus 200
                                                           live data returned
```

That is the whole case for this skill. Not "more search" — **reach**.

## What it is NOT for

A query for wallet / DEX / Solana / on-chain capabilities returned **`tools: 0`**.
Zero matching capabilities.

Alexandria's indexes are **Research** (papers), **Developer** (READMEs, issues,
PRs, docs) and **Government** (laws). Providers include Fiscal.ai, FRED, World
Bank, SEC EDGAR, Wikimedia. That is TradFi and literature.

> **Pointing Hydra's hunt plane at this repeats the OpenBB verdict**: real
> capability, wrong asset class. OpenBB was rejected for exactly this — genuine
> point-in-time support, zero Solana coverage across 33 providers. Do not spend
> the same finding twice.

`has_capability_for()` exists because `tools: []` is how Alexandria says *"I do
not cover this"* — an **absence**, which has to be looked for rather than waited
for.

## `tools` and `web` are different things

A search returns both. `tools` are capability descriptors you *could* execute;
`web` is content actually found. Conflating them reports coverage that does not
exist, so `tools_from()` never touches the `web` array.

In the P2 test below, the answer came from `web`; the `tools` array held generic
GitHub capabilities that did not contain it.

## Costs, from live receipts

| Operation | Credits |
|---|---|
| search | 2 |
| capability execution | 5 |

## Why capabilities go through the CLI

The v2 REST `/scrape` endpoint **rejects** a `provider/capability` path — it
validates `url` as a real URL and refuses `options` outright:

```
"URL must have a valid top-level domain or be an IP address"
"Unrecognized key: \"options\""
```

So the CLI is not a convenience, it is the only documented path.
`run_capability()` sets `FIRECRAWL_API_KEY` from the *working* key for the
subprocess, because the CLI reads that name and the ambient one is stale.

## Pre-registered, then measured

| | Prediction | Outcome |
|---|---|---|
| P1 | The keyless free tier works from this container | **FALSIFIED** — 403, `"An API key is required for provider tools"` |
| P2 | The Developer index returns a fact I verified by hand (laya-mlx gating `mlx` to darwin+arm64) | **HELD** — returned `sys_platform == 'darwin' and platform_machine == 'arm64'` verbatim across several repos |
| P3 | No on-chain / wallet / DEX provider exists | **HELD** — `tools: 0` |

Decision rule, fixed in advance: adopt for research only if P1 **and** P2 hold;
adopt for the hunt plane only if P3 is falsified.

P1 failed, so the marketing claim of a keyless tier does not survive contact —
but a working key is present in this environment, which is what made P2
testable. Adopted for **research only**. The hunt plane is untouched.

8 tests, 3 guards mutation-verified.
