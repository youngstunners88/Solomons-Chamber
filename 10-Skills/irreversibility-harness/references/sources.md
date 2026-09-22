# Sources: what was read, and what came back

Research date: **2026-09-22**. Everything below is what the artifacts said on
that date, separated from what I concluded.

## The two targets, and one correction

| Asked for | Resolved to | Status |
|---|---|---|
| `minara.ai` | Minara — AI-native financial OS / crypto trading agent | Read in depth |
| `senpai.ai` | **A parked domain listed for sale** by the broker Saw.com | Dead end |
| `senpi.ai` (corrected mid-task by the user) | Senpi — AI trading agents for Hyperliquid | Read in depth |

`senpai.ai` has no product on it. The page is a "Make an Offer" domain listing
with payment-processor copy and a broker phone number. I reported that rather
than assembling something plausible from the several unrelated products that use
the *Senpai* name (a meditation app, an anime recommender, a chat-characters
app, a software consultancy) — none of which is what was being pointed at. The
user then supplied `senpi.ai`, which is.

Worth keeping as a one-letter lesson: the wrong domain returned a confident,
well-structured description of *something*, and that something was a sales page.
A fluent answer is not evidence of the right target.

## Minara

**Read:** `minara.ai/` · `minara.ai/docs` · `minara.ai/llms.txt` ·
`github.com/mdogai/minara-skills` → `skills/minara/SKILL.md` (22,956 bytes,
v3.0.4) and its `references/interactive-commands.md`, `references/auth-recovery.md`.

**Not readable:** the strategy page
`minara.ai/app/strategy/detail/pub_1787238985622_x4tkfs` is client-rendered and
returned only a loading GIF. All that could be established is its title, *"Hyper
whale copy strategy"* by *Wizard Anon*. **Its logic, parameters and backtest
numbers are UNKNOWN** — nothing below is derived from it. `api.github.com` is
also blocked (HTTP 403) from this environment, so the repo tree was enumerated
by fetching known paths from `raw.githubusercontent.com` rather than listed.

**Product surface, as documented:** Chat/Research, Copilot, Autopilot, Strategy
Studio ("write, backtest, and tune strategies in Pine Runtime"), Strategy
Marketplace, Prediction Markets, Agent Workflows, and an Agent API (chat, swap,
perp-suggestion, prediction; billed by API key or x402). Model is *DMind*, 40+
data providers, execution on Hyperliquid and Lighter.

**The finding.** The product surface is not where the value is. The skill file is
23KB and most of it is machinery for *refusing to act*:

- A **two-message confirmation protocol** with the response boundary stated as
  the rule: *"Your response ends after the question. No fund-moving CLI call
  appears anywhere in this response."*
- **Multi-turn voiding**: *"If the user changes any parameter… the previous
  confirmation is void — present a fresh summary."*
- A **behavioural ban** that is the honest core of the whole thing: *"NEVER
  fabricate or simulate a user's confirmation… do not generate text like 'User
  selected A'… This is an instant safety failure."*
- An **analysis→trade boundary**: analysis is read-only and never shares a turn
  with execution.
- An **anti-loop guard**: all flags upfront, max 1 retry, 15s of silence is a
  hang, kill rather than wait.
- **Lazy auth**: never probe login on activation; never turn a network or
  Cloudflare error into a login prompt.
- **Token/address safety**: canonical contract addresses for major tokens,
  bridged-vs-native disambiguation (USDC vs USDC.e, WBTC vs BTC), per-chain
  address format validation, and address-poisoning detection with a rule to
  never truncate a recipient address in a summary.
- A **routing gate** requiring a finance action AND a crypto signal, with
  explicit non-activation for blockchain education.

## Senpi

**Read:** `senpi.ai/` · `github.com/Senpi-ai/senpi-skills` cloned at depth 1
(21 MB, 831 files, MIT). Principally `README.md`,
`senpi-trading-runtime/references/{runtime-yaml,scan-contract,dsl-protection-check}.md`.

**Architecture, as documented.** Senpi calls itself *"a harness — a disciplined
stack that wraps a market-tuned AI model in deterministic execution and risk
machinery, so an autonomous agent can trade real capital without hallucinating a
position or forgetting a stop."* Layers: the *Samurai* model → an OpenClaw host
→ 12 open-source skills → 62 MCP tools → the closed-source `@senpi-ai/runtime`
supervisor → Hyperliquid.

The contract between them is the interesting part: **skills call MCP tools;
strategies export `scan(inputs, ctx)`; the runtime owns everything downstream.**
Nothing in the open repo places an order. *"The scanner proposes; the runtime's
risk engine disposes."*

**Components worth naming:**

- **The hidden-engine pattern** — every analytical skill is a deterministic
  stdlib-only engine emitting JSON plus a `SKILL.md` that narrates it under hard
  guardrails. *"The engine gathers and computes; the model judges and explains."*
  Its stated motivation is that hand-assembled tool calls produced *"double-
  counted collateral, misread sub-wallets, and 'your position is unprotected'
  false alarms."*
- **The two-phase DSL** — phase 1 a hard stop from entry, phase 2 an ascending
  `tiers[]` ladder (`trigger_pct` → `lock_hw_pct`) trailing a floor up the
  high-water mark. Typed close reasons: `tier_breach`, `max_retrace`,
  `trailing_floor`, `weak_peak`, `hard_timeout`.
- **Risk guard rails with reason codes** — `no_slots`, `no_margin`,
  `risk_gate_*`, `asset_banned`. Every blocked signal is logged with *why*,
  which is what makes the telemetry mineable afterwards.
- **A telemetry event log** that a separate skill (`senpi-improve-trades`) mines
  for exit quality, leaks and protection gaps — the agent reviewing its own work.
- **The absence trap** (quoted in full in `SKILL.md` §4).
- **An `enabled: false` footgun**, documented with unusual honesty: a scanner
  written `enabled: false` *"registers ENABLED and ticks"*, because the engine
  never reads that key. Their deploy refuses any package carrying it at any
  value — *"rather than ship a strategy that trades while its author believes it
  is off."* Exactly the class of bug this vault's CI "fail if zero suites
  discovered" step exists to catch.

**Scale claims, as published and NOT independently verified:** 114 strategy
directories present in the repo (counted); the README says 80+ in the catalog,
forward-tested across $10M+ notional, with $30M+ traded in their public Arena.
Counted directories are a fact; the dollar figures are their claim.

## What Jev decided

Two calls on the OpenRouter route, `jev-latest`, ~$0.0001 total.

| Question | Answer | p | margin |
|---|---|---|---|
| Which component to build first | `IRREVERSIBILITY_HARNESS` | 0.96 | 0.93 |
| What shape to ship it in | `EXECUTABLE_GATE` | 0.92 | 0.84 |

Both clear the `irreversible` gate in `router.DEFAULT_GATES` (0.80 margin / 0.85
confidence), which is the right bar for a decision that determines what gets
built and what does not.

Notable: `STRATEGY_PACKAGE_PORT` scored **0.000** and `DOCTRINE_ONLY` scored
**0.000**. Per `jev-prompt-design`, both option descriptions carried the specific
measured facts arguing against them — the inert-without-the-supervisor problem,
and this vault's four stale-prose incidents. That is the arm that measured 86%
against 59% for bare descriptions, so the evidence was loaded deliberately.

**Caveat on both numbers.** n=1 per question. Jev's calibration on *this* class
of question is unverified here — `calibration.py` would return `UNDERPOWERED`
far below its 97-per-bin floor. These were used as a second opinion on a
judgement I had already formed from reading the sources, which is the only way
`jev-router` sanctions using it.

## Declined

- **The strategy package format and the 114 templates.** Inert without the
  closed-source supervisor, and aimed at live perps trading, which tradecc's
  rules forbid before a validation gate.
- **Minara's canonical contract-address table.** Three addresses hardcoded in a
  skill file is a liability, not an asset: it will drift, and a *stale* canonical
  address is worse than none because it lends authority to a wrong answer. The
  *technique* — verify a provided address against an independent source and show
  it untruncated — is in `SKILL.md`; the table is not.
- **`minara`/`senpi` CLI integration.** Neither CLI is installed here, neither
  account exists, and both move real money. Nothing in this skill shells out.
