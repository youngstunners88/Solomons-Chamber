#!/usr/bin/env bash
# Checks whether this environment is set up to use Jev-backed tools
# (fast-jev-compaction, jev-ultrafast) without ever printing the key itself.
#
# Usage: bash check-jev-env.sh
#
# Exit codes: 0 = key present and endpoint reachable, 1 = key missing,
# 2 = key present but endpoint unreachable (network or outage, not a config bug).
set -uo pipefail

ENDPOINT="https://api.typesafe.ai/v1/systemone"

echo "== Jev / TypeSafe environment check =="

# Both spellings are accepted. The upstream tools document TYPESAFE_API_KEY,
# but this environment registers the key as TYPESAFE -- and checking only the
# documented name made this script report FAIL on a correctly configured
# machine, which is worse than not checking at all. Found 2026-09-20.
KEY="${TYPESAFE_API_KEY:-${TYPESAFE:-}}"
KEY_NAME="TYPESAFE_API_KEY"
[ -n "${TYPESAFE_API_KEY:-}" ] || KEY_NAME="TYPESAFE"

if [ -z "$KEY" ]; then
  echo "FAIL  Neither TYPESAFE_API_KEY nor TYPESAFE is set."
  echo "      Neither fast-jev-compaction nor jev-ultrafast can run without it."
  echo "      Set it as an environment variable only — never in a committed file,"
  echo "      a prompt, or a log line. See references/deep-dive.md in this skill"
  echo "      before enabling either tool near a repo that handles money or keys."
  exit 1
fi

# Never echo the key. Only report shape/length, which is enough to catch an
# obviously wrong paste (e.g. a newline, or a different key pasted by mistake)
# without revealing the value.
key_len=${#KEY}
echo "OK    ${KEY_NAME} is set (length: ${key_len} chars, value not shown)."

echo "--    Checking endpoint reachability (no key sent on this check)..."
if command -v curl >/dev/null 2>&1; then
  status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 8 "$ENDPOINT" || echo "000")
  if [ "$status" = "000" ]; then
    echo "FAIL  Could not reach $ENDPOINT (network error or timeout)."
    exit 2
  fi
  echo "OK    Endpoint responded (HTTP $status — any response, including 4xx,"
  echo "      confirms the host is reachable; a 4xx here is expected since no"
  echo "      auth or body was sent by this check)."
else
  echo "SKIP  curl not available; cannot verify endpoint reachability here."
fi

echo ""
echo "Before enabling in tradecc or hydra specifically: read the data-egress"
echo "caveat in references/deep-dive.md first. Reachability and a valid key are"
echo "necessary, not sufficient, to enable either tool in a money-adjacent repo."
exit 0
