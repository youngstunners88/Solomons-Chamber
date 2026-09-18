# Proposal: jev-ultrafast as Hydra's browser-hunter engine

**Status:** Proposal only. Nothing in this file has been applied to the hydra repo.
**Decision owner:** you. This is exactly the kind of "build toward a specific approach"
call that gets put to you first, same as every strategy decision in tradecc.

## What would change

Hydra's SPEC.md §3.3 names `browser-use` (Python ≥ 3.11) as the library behind
`services/browser-hunter/`, used only when GMGN has no API coverage — PulseChain, and parts
of Robinhood Chain. This proposes evaluating `browser-use/jev-ultrafast` as an alternative
engine for that same sidecar, not a new capability — the sidecar's role, allowlist, and
output contract (`List[WalletCandidate]`, no screenshots persisted) stay exactly as SPEC.md
already defines them.

## Why it's worth evaluating

Section 10's adaptive-poll design wants hot watchlisted wallets polled every 2–5 seconds.
A conventional LLM-narrated browser agent doing full chain-of-thought reasoning per step is
a poor fit for that cadence on any page that takes more than one navigation step. jev-ultrafast's
indexed-action-space design (structured operation+target prediction, free text only for
`TYPE_TEXT`) is built for exactly this kind of speed, with a demonstrated 7.1-second full task
completion in its own README.

## Why it's not a drop-in, and what has to be checked first

1. **Target-page compatibility is unverified.** jev-ultrafast's own MVP disclaimer excludes
   shadow DOM, iframes, canvas, file uploads, popup tabs, nested scrolling, and arbitrary
   keyboard widgets. Nobody has checked whether GeckoTerminal's top-trader tables or
   PulseScanner's explorer pages render through any of those. **First step, before anything
   else:** spike-test jev-ultrafast against the actual target URLs in
   `config/allowlists/domains.txt` and confirm it can read the specific tables Hydra needs,
   not just that it loads the page.
2. **New key, new egress path.** It needs its own `TYPESAFE_API_KEY`. That means page content
   from PulseChain/Robinhood Chain explorer pages goes to `api.typesafe.ai`. Hydra's existing
   secrets/allowlist discipline (domain allowlist, structured output, time/step budget, never
   type a seed/private key/2FA — all from SPEC.md §3.3 verbatim) applies to this engine exactly
   as it would to base `browser-use`; none of it is optional because the engine changed.
3. **It's a separate dependency from what the spec named.** SPEC.md is a frozen implementation
   spec; swapping a named tool for an unnamed alternative is a real spec amendment, not a
   config flag, and should be recorded as one if you approve it (a decision record, same
   pattern as tradecc's).

## If you approve this

The concrete next step is narrow and cheap: a standalone spike script that points
jev-ultrafast at one real target page (e.g. a PulseX top-traders view) and reports whether
it can extract a wallet-address table into the same schema `services/browser-hunter/schemas.py`
already expects — before touching the hydra repo's actual sidecar code. That spike is not
included here because it needs a live `TYPESAFE_API_KEY` and a real target page, and running
it against a real site is itself an action worth your explicit go-ahead, not something to do
by default while investigating two GitHub READMEs.

## If you don't

Nothing changes. Hydra's scaffold as pushed already correctly ships `browser-use` behind the
sidecar boundary described in SPEC.md, and needs no edit either way.

---

## Update, 2026-09-18 — the spike ran, and it answers a different question than expected

The user supplied `TYPESAFE_API_KEY`. The spike ran for real against three allowlisted
targets (gmgn.ai, dexscreener.com, geckoterminal.com). **All three returned a Cloudflare
bot-check page, not real content.** GeckoTerminal's was retried across 18 seconds to rule
out a transient auto-clearing challenge; it did not clear.

This is not a jev-ultrafast-specific result. The block happens at the network/fingerprint
layer, before either library's action-selection logic runs — base `browser-use` would face
the identical challenge from the identical headless-browser fingerprint and network position.

**The engine-swap question this proposal originally asked is no longer the live one.** Before
"jev-ultrafast vs. browser-use" can be decided, a prior question needs an answer: **can
headless automated browsing reach these specific sites at all from wherever Hydra will
actually run** — not this evaluation sandbox, whose proxy egress may or may not resemble a
real deployment's network position.

Full result, including exactly what had to be built to get a real answer (a headless Chrome
launch, CDP wiring, and proxy routing that jev-ultrafast's own README doesn't document) is in
`services/browser-hunter/spikes/RESULTS-2026-09-18.md` in the hydra repo.

**Not recommended as a next step:** engineering around the Cloudflare block (fingerprint
spoofing, residential proxy rotation, CAPTCHA solving). That's a materially more adversarial
posture than "read-only hunting via allowlisted public pages" and wasn't asked for — it's
flagged here as the tempting-but-wrong next move, not taken.
