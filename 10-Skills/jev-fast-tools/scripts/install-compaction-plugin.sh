#!/usr/bin/env bash
# Guided (not silent) installer helper for fast-jev-compaction into a Claude
# Code project. This script never runs the install automatically — it checks
# preconditions, prints the exact commands, and refuses to proceed quietly
# inside a repo flagged as money-adjacent.
#
# Usage: bash install-compaction-plugin.sh [target-repo-path]
#   (defaults to the current directory if no path is given)
set -uo pipefail

TARGET="${1:-$(pwd)}"

echo "== fast-jev-compaction installer helper =="
echo "Target: $TARGET"
echo

if [ ! -d "$TARGET" ]; then
  echo "FAIL  '$TARGET' is not a directory."
  exit 1
fi

# Heuristic, not a guarantee: flag repos whose own CLAUDE.md talks about money,
# wallets, keys, or a live-trading gate, and refuse to auto-proceed there.
# This is deliberately conservative — false positives just mean "read the
# warning," a false negative would mean silently piping tool-call content to a
# third party inside a project built around not leaking exactly that kind of
# data.
FLAGGED=0
if [ -f "$TARGET/CLAUDE.md" ]; then
  if grep -qiE "private[_ -]?key|wallet|live[- ]?trading|hot wallet|seed phrase" "$TARGET/CLAUDE.md"; then
    FLAGGED=1
  fi
fi

if [ "$FLAGGED" = "1" ]; then
  cat <<'WARN'
STOP  This repo's own CLAUDE.md references wallets, keys, or live trading.

      fast-jev-compaction sends tool-call arguments and results to a
      third-party endpoint (api.typesafe.ai) to be scored for relevance.
      Whether that stream can ever carry gate state, a fingerprint, wallet
      data, or a secret has NOT been established for this project — see
      references/deep-dive.md in this skill for the open question.

      This script will not proceed automatically here. If you have already
      worked out that answer and still want to enable it, install manually:

        npm install fast-jev-compaction
        # then follow the plugin's own .claude-plugin setup instructions
        # from https://github.com/tamaratran/fast-jev-compaction

      Do not re-run this script with a flag to skip this check — if the
      check is wrong for this repo, fix the check, don't bypass it.
WARN
  exit 3
fi

echo "OK    No money/wallet/key language found in $TARGET/CLAUDE.md (or no"
echo "      CLAUDE.md present). Proceeding is reasonable here, but this script"
echo "      still only prints the steps — it makes no changes itself."
echo
echo "To install:"
echo "  cd '$TARGET'"
echo "  npm install fast-jev-compaction"
echo "  # then wire the plugin per its own .claude-plugin/ instructions:"
echo "  # https://github.com/tamaratran/fast-jev-compaction"
echo
echo "Before first use:"
echo "  bash \"$(dirname "$0")/check-jev-env.sh\""
echo
echo "Reminder: TYPESAFE_API_KEY is an environment variable only. Never commit"
echo "it, never put it in this project's .env.example with a real value, and"
echo "register it with this project's own secret-masking pattern if it has one"
echo "(e.g. a SECRET_ENV_NAMES list) before it can reach a log line."
