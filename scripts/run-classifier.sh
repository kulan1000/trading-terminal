#!/bin/bash
# LaunchAgent entrypoint for the 24/7 classification worker.
# No secrets here — classify-worker.ts loads .env.local itself.
# Codex auth lives in CODEX_TRADING_HOME (default ~/.codex-trading).
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin"
cd "$(dirname "$0")/.." || exit 1
exec npx tsx scripts/classify-worker.ts
