# Deep dive — fast-jev-compaction & jev-ultrafast

**Date:** 2026-09-18
**Sources:** github.com/tamaratran/fast-jev-compaction, github.com/browser-use/jev-ultrafast
**Method:** fetched both repos directly (READMEs, file listings, stated metrics). Neither
was cloned or run — findings below are from their published documentation, not from
executing their code. Verify against the live repo before depending on any figure here.

Both tools are built on the same primitive: a very fast, cheap decision API called **Jev**,
served by TypeSafe at `https://api.typesafe.ai/v1/systemone`, authenticated with a
`TYPESAFE_API_KEY`. Neither repo is a general-purpose LLM wrapper — each uses Jev for one
narrow, structured decision (score this / pick this element), which is what makes both fast.
That's the actual leverage: not "another AI tool," but a demonstrated pattern for replacing a
slow, free-text LLM step with a fast, structured one wherever the decision is narrow enough
to specify precisely.

---

## 1. fast-jev-compaction

**What it is:** an MIT-licensed npm package + Claude Code plugin (627 stars, 28 forks) that
replaces Claude Code's default context-compaction behavior.

**The problem it targets:** when a long session nears its context limit, Claude Code's
built-in compaction summarizes old turns — which is lossy. A decision made 200 turns ago can
get flattened into a paraphrase, or dropped, and there's no way to know which without
re-reading the original.

**Its approach, and why it's different:**

- It does **not** touch user/assistant text turns. Those "stay verbatim and in order" —
  quoting the README directly. Every decision, approval, and explanation you've actually
  written stays intact.
- It scores **tool calls and their paired results** — file reads, bash output, web fetches —
  with Jev, asking (in effect) "is this still needed to understand what follows?" Tool calls
  and results are paired by ID first, so a scored decision applies to the whole
  call-plus-result unit, not fragments of it.
- Stale ones are **dropped or truncated**; kept ones are kept verbatim, not re-summarized.
  There is no LLM rewriting of anything that survives.
- Truncation happens in progressive stages to fit a token budget, with concurrent Jev
  requests so scoring a long history doesn't serialize.

**Why this is relevant to how this session actually ran today:** today's session spent
most of its length managing rate-limit pressure directly — first by delegating heavy
drafting to DeepSeek (tradecc's `research/deepseek.py`), then by keeping this session's own
Claude-side work terse for the Hydra scaffold. A tool that prunes stale tool-call payloads
(a giant `cat` of a file that's no longer relevant, a long bash dump already acted on) while
leaving every actual decision, approval, and written rationale untouched is a direct lever on
exactly that pressure — more working session before a fresh one is needed, without losing the
substance of what was decided.

**What it needs:** `TYPESAFE_API_KEY` env var. Ships as an npm package (building blocks:
`collectToolCalls`, `fitState`) plus a Claude Code plugin (`hooks/`, `.claude-plugin/`) for
drop-in use, and a SwiftUI demo app.

**The real caveat, and it is not minor:** this plugin sends tool-call arguments and results
to a third-party endpoint (`api.typesafe.ai`) to be scored. In an ordinary repo that's a
mild convenience trade-off. **In a money-adjacent project like tradecc, or a project handling
wallet-hunting data like hydra, that is a data-egress decision, not a defaults choice** — the
same class of decision `openrouter-deepseek` required an explicit isolation boundary for
before it was allowed near either project. Do not enable this plugin inside tradecc or hydra
without first working out (a) whether tool-call payloads there can ever contain gate state,
fingerprints, wallet data, or secrets, and (b) whether Jev's scoring pass sees full content or
only metadata — the README doesn't say, and that distinction is the whole question. Until
that's answered, treat it as fine for this vault (no money, no keys) and **not yet cleared**
for tradecc/hydra.

---

## 2. jev-ultrafast (browser-use org)

**What it is:** an MIT-licensed browser automation agent (2.5k stars, 140 forks) published
under the `browser-use` GitHub organization — the same org behind the `browser-use` library
that Hydra's SPEC.md already names as its required browser-automation tool (SPEC.md §3.3).
It is a **separate repo and a different design**, not a mode of the base library.

**The problem it targets:** a conventional LLM browser agent is slow because every step
repeats a full cycle — screenshot or DOM dump → send to a large model → the model reasons in
free text → parse an action out of that text → execute. Multiplied over a multi-step task,
that's a lot of token generation spent on reasoning prose that never appears in the final
action.

**Its approach:** a "dynamic, indexed action space." The page is reduced to an atomic DOM
snapshot with every interactive control given a stable index. One request then predicts an
**operation** (click, type, scroll, …) and a **target index** together — two short,
structured predictions instead of one long narrated one. A small model is invoked to
generate actual text **only** when the operation is `TYPE_TEXT` — the one place free-form
content is genuinely unavoidable. Everything else never touches natural-language generation
at all.

**Demonstrated result:** a full flight search — Zürich → London on Google Flights — in
**7.1 seconds**, including real text entry and page-load waits. That's dramatically faster
than the "many seconds to low minutes" a narrated multi-step LLM browser agent typically
takes for an equivalent task.

**Stated limits, from their own MVP disclaimer — treat this list as load-bearing:** shadow
DOM, iframes, canvas, file uploads, popup tabs, nested scroll containers, and arbitrary
keyboard widgets are explicitly **outside** this MVP. A target page that leans on any of
those will not work here regardless of speed.

**Why this is relevant to Hydra specifically:** SPEC.md §3.3 designs a Python
`browser-hunter` sidecar around the base `browser-use` library, used **only** as the fallback
hunter where GMGN has no API coverage — mainly PulseChain, and parts of Robinhood Chain.
Section 10's adaptive-poll design wants hot watchlisted wallets polled every 2–5 seconds;
a base `browser-use` agent doing full LLM-narrated reasoning per step is a poor fit for that
cadence on a multi-step page (navigate → search → read a leaderboard table). jev-ultrafast's
speed profile is a much better match **if** the actual target pages (GeckoTerminal top-trader
tables, PulseX/PulseScanner explorer pages) are reachable through ordinary indexed DOM
controls — plausible for typical DEX/explorer leaderboard UIs, but **not verified**; those
pages haven't been inspected for shadow DOM or canvas-rendered tables, which would rule this
out per the MVP's own disclaimer.

**This is a real architecture decision, not a drop-in swap**, and I have not made it. Reasons
to route it through you rather than build toward it:

1. It's a different repo and dependency from the `browser-use` library SPEC.md names by name.
2. It needs its own `TYPESAFE_API_KEY`, tracked with the same env-var-only, never-committed
   discipline every other key in these projects gets — and the same data-egress question as
   the compaction plugin applies here too: page content and target site data would go to
   TypeSafe's endpoint.
3. Hydra's own hard rules for the browser sidecar (domain allowlist, structured Pydantic
   output, time/step budget, never type a seed/private key/2FA from the hot wallet) still
   apply in full to whichever agent runs inside it — swapping the engine changes none of
   those constraints, but they'd need re-verifying against jev-ultrafast's actual action
   surface before trusting it near a hunt pipeline.

A concrete integration proposal, sized to a real decision rather than a foregone conclusion,
is at `references/hydra-browser-hunter-proposal.md` in this skill.

---

## What this deep dive is *not*

It is not a recommendation to install either tool anywhere with money or secrets nearby
without the open questions above answered first. It is not a claim that either repo's
performance numbers have been independently reproduced — they're quoted from the README, not
measured here. The leverage is real (a fast structured-decision API is a genuinely useful
primitive for both context management and browser automation) but the specific integration
decisions — enabling compaction in tradecc, swapping Hydra's browser engine — are yours.
