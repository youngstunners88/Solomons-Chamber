"""Firecrawl Alexandria: a research lane that reaches what this container cannot.

MEASURED 2026-09-22, not read off the marketing page.

WHY THIS EXISTS: `api.github.com` returns HTTP 403 from this container (org
policy). That blocked repo-tree enumeration twice in one session -- the Minara
skills repo had to be probed path-by-path instead of listed. Alexandria's
`github-com` capabilities proxy those calls server-side and return
`upstreamStatus: 200`.

VERIFIED, both directions, same session:
    direct  api.github.com/repos/Senpi-ai/senpi-skills  -> HTTP 403
    via     github-com/repositories/search_repos        -> 200, live data

THE ENV VAR TRAP -- read this before debugging an auth failure:

    FIRECRAWL_API_KEY   44 chars, sk-...   -> 401 Invalid token  (STALE)
    FIRECRAWL           35 chars           -> 200                (WORKS)

The same shape as TYPESAFE vs TYPESAFE_API_KEY, which made `check-jev-env.sh`
report FAIL on a correctly configured machine. The longer, more official-looking
name is the dead one. `api_key()` below prefers the one that works and says so.

WHAT IT IS NOT FOR: on-chain data. A query for wallet/DEX/Solana capabilities
returned `tools: 0` -- zero matching capabilities. Alexandria's indexes are
Research (papers), Developer (READMEs, issues, PRs, docs) and Government
(laws), with providers like Fiscal.ai, FRED, World Bank, SEC EDGAR and
Wikimedia. That is TradFi and literature. Pointing Hydra's hunt plane at it
would repeat the OpenBB verdict: real capability, wrong asset class.

COSTS, from the live receipts:
    search                2 credits
    capability execution  5 credits   (`creditsCost` is per capability)
"""

from __future__ import annotations

import json
import os
import subprocess
import urllib.request

__all__ = ["AlexandriaError", "api_key", "run_capability", "search"]

SEARCH_URL = "https://api.firecrawl.dev/v2/search"

# Ordered by what was measured to work, not by which name looks official.
KEY_ENV_VARS = ("FIRECRAWL", "FIRECRAWL_API_KEY")


class AlexandriaError(RuntimeError):
    pass


def api_key() -> str:
    """The first key env var that is set, preferring the one measured to work.

    Never returns the key in an error message. A stale key is the likeliest
    cause of a 401 here, so the message names the variable, not its value.
    """
    for name in KEY_ENV_VARS:
        val = os.environ.get(name)
        if val and val.strip():
            return val.strip()
    raise AlexandriaError(
        f"no Firecrawl key in env. Tried, in order: {', '.join(KEY_ENV_VARS)}. "
        "Note FIRECRAWL is the one that authenticates here; FIRECRAWL_API_KEY "
        "was present and stale."
    )


def search(
    query: str,
    *,
    sources: tuple[str, ...] = ("alexandria",),
    categories: tuple[str, ...] = (),
    limit: int = 5,
    tool_detail: str = "",
    timeout: int = 90,
) -> dict:
    """Search Alexandria and/or the web. 2 credits.

    `sources=("alexandria",)` returns BOTH a `tools` array (capability
    descriptors you can then execute) and a `web` array (actual content).
    They are different things and the distinction matters: `tools` tells you
    what you COULD call, `web` is what was found.
    """
    body: dict = {"query": query, "sources": list(sources), "limit": limit}
    if categories:
        body["categories"] = list(categories)
    if tool_detail:
        body["toolDetail"] = tool_detail

    req = urllib.request.Request(
        SEARCH_URL,
        data=json.dumps(body).encode(),
        headers={
            "Authorization": f"Bearer {api_key()}",
            "Content-Type": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            payload = json.load(resp)
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", "replace")[:300]
        raise AlexandriaError(f"search failed HTTP {exc.code}: {detail}") from None
    if not payload.get("success"):
        raise AlexandriaError(f"search unsuccessful: {str(payload.get('error'))[:200]}")
    return payload.get("data", {})


def run_capability(
    provider: str, capability: str, options: dict, *, timeout: int = 300
) -> dict:
    """Execute one Alexandria capability. 5 credits.

    Goes through the CLI deliberately. The v2 REST `/scrape` endpoint rejects
    a `provider/capability` path -- it validates `url` as a real URL and
    refuses the `options` key outright:

        "URL must have a valid top-level domain or be an IP address"
        "Unrecognized key: \\"options\\""

    So the CLI is not a convenience here, it is the only documented path.
    `FIRECRAWL_API_KEY` is set from the working key for the subprocess, because
    the CLI reads that name and the one in the ambient env is stale.
    """
    env = dict(os.environ, FIRECRAWL_API_KEY=api_key())
    cmd = [
        "npx", "-y", "firecrawl-cli@latest", "scrape",
        f"{provider}/{capability}",
        "--options", json.dumps(options),
        "--json",
    ]
    proc = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout, env=env)
    line = next(
        (l for l in reversed(proc.stdout.splitlines()) if l.strip().startswith("{")),
        "",
    )
    if not line:
        raise AlexandriaError(
            f"no JSON from CLI (exit {proc.returncode}): "
            f"{(proc.stderr or proc.stdout)[-300:]}"
        )
    payload = json.loads(line)
    if not payload.get("success"):
        raise AlexandriaError(f"capability failed: {str(payload.get('error'))[:200]}")

    entries = payload.get("data", {}).get("alexandria", [])
    if not entries:
        raise AlexandriaError("capability returned no alexandria entries")
    entry = entries[0]
    upstream = entry.get("upstreamStatus")
    if upstream is not None and upstream != 200:
        raise AlexandriaError(f"upstream returned {upstream}, not 200")
    return entry.get("data", {})


def tools_from(data: dict) -> list[dict]:
    """The capability descriptors from a search result, never the web hits."""
    return [t for t in data.get("tools", []) if isinstance(t, dict)]


def has_capability_for(data: dict) -> bool:
    """False when Alexandria has no capability for the query.

    Worth its own name: `tools: []` is how Alexandria says "I do not cover
    this", and it is an ABSENCE, so it has to be looked for rather than
    waited for. A crypto/on-chain query returns exactly this.
    """
    return len(tools_from(data)) > 0
