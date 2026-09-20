---
name: jev-fast-tools
description: |
  Reference and setup helpers for two tools built on TypeSafe's "Jev" fast
  decision API: fast-jev-compaction (a Claude Code context-compaction plugin
  that prunes stale tool-call payloads while keeping all text verbatim) and
  jev-ultrafast (a browser-use-org agent that picks an operation + target
  element in one structured request instead of narrating each step).

  Load this before enabling either tool anywhere, and BEFORE proposing either
  one for a money-adjacent project (tradecc, hydra) — both send tool-call or
  page content to a third-party endpoint, which is a real data-egress
  decision, not a defaults choice.

allowed-tools: Bash Read

installation: |
  Nothing to install by default — this skill is reference + guarded helper
  scripts, not the tools themselves.

  To actually use fast-jev-compaction in a project:
    bash 10-Skills/jev-fast-tools/scripts/install-compaction-plugin.sh <target-repo>
  (it prints the real install steps and refuses to proceed quietly in a repo
  whose CLAUDE.md mentions wallets/keys/live trading — read why before
  overriding that judgment call yourself)

  To check whether TYPESAFE_API_KEY is set up correctly for either tool:
    bash 10-Skills/jev-fast-tools/scripts/check-jev-env.sh

usage: |
  # Read the full research before using either tool anywhere real:
  cat 10-Skills/jev-fast-tools/references/deep-dive.md

  # Check env/key setup (never prints the key itself):
  bash 10-Skills/jev-fast-tools/scripts/check-jev-env.sh

  # Get guided install steps for fast-jev-compaction in a specific repo:
  bash 10-Skills/jev-fast-tools/scripts/install-compaction-plugin.sh /path/to/repo

  # If you're considering jev-ultrafast for Hydra's browser-hunter sidecar,
  # read the sized proposal first — it is a real spec amendment, not a
  # config flag, and needs a target-page spike test before anything else:
  cat 10-Skills/jev-fast-tools/references/hydra-browser-hunter-proposal.md
---

# Jev fast-tools

Two tools, one underlying pattern: replace a slow, free-text LLM step with a
fast, structured decision wherever the decision is narrow enough to specify
precisely. Both are built on TypeSafe's Jev API (`api.typesafe.ai/v1/systemone`,
`TYPESAFE_API_KEY`).

## What's here

- `references/deep-dive.md` — the actual research: what each tool does, why
  it's fast, what it explicitly cannot do yet, and the specific caveat that
  applies before either one gets near tradecc or hydra.
- `references/hydra-browser-hunter-proposal.md` — a sized, opt-in proposal
  for swapping Hydra's browser-hunter engine from base `browser-use` to
  `jev-ultrafast`. Not applied. Needs your go-ahead and a target-page spike
  test before any code changes.
- `scripts/check-jev-env.sh` — verifies `TYPESAFE_API_KEY` is set and the
  endpoint is reachable, without ever printing the key.
- `scripts/install-compaction-plugin.sh` — prints the real install steps for
  `fast-jev-compaction`, and refuses to proceed automatically inside any
  target repo whose own `CLAUDE.md` mentions wallets, private keys, seed
  phrases, hot wallets, or live trading. Verified against tradecc and hydra
  directly: both correctly trip the guard (exit code 3).

## The one rule that matters most here

**Neither tool has an established answer to "does the data it sends off-repo
ever include something that must not leave"** — gate state, a fingerprint,
wallet data, a secret, or (for the browser agent) a page containing account
information. That is not a reason to avoid these tools; it is the specific,
narrow question to answer *before* enabling either one in a project where the
answer matters. In this vault, with no money or keys, that question doesn't
bind — go ahead. In tradecc or hydra, it does, and it hasn't been answered
yet, so neither tool is enabled there.

## See also

- `10-Skills/jev-router/` — Jev used directly as a decision lane in the build
  process, paired with OpenRouter for prose. Includes the wire contract
  recovered by probing the live API, and the measured record of a case where
  Jev was stably wrong at 0.84 confidence. Read that before trusting a
  Jev answer anywhere it matters.
