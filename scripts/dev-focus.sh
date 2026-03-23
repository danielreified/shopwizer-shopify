#!/usr/bin/env bash
# ───────────────────────────────────────────────
# 🔧 dev-focus.sh — Focus or exclude a TurboRepo service
# ───────────────────────────────────────────────

set -euo pipefail

MODE="${1:-}"
SERVICE="${2:-}"

if [[ -z "$MODE" || -z "$SERVICE" ]]; then
  echo "❌ Usage:"
  echo "   pnpm dev:focus --only <service>"
  echo "   pnpm dev:focus --except <service>"
  exit 1
fi

if [[ "$MODE" == "--only" ]]; then
  FILTER="--filter=${SERVICE}"
elif [[ "$MODE" == "--except" ]]; then
  FILTER="--filter=!${SERVICE}"
else
  echo "❌ Unknown mode: $MODE"
  echo "   Must be either --only or --except"
  exit 1
fi

# Adjust concurrency dynamically (20 is a safe upper bound)
CONCURRENCY="--concurrency=20"

echo "🚀 Running Turbo dev with filter: ${FILTER}"
echo "───────────────────────────────────────────────"

# Note: Concurrency must come BEFORE the filter or Turbo ignores it
pnpm turbo run dev ${CONCURRENCY} ${FILTER} --log-order=stream --output-logs=full
