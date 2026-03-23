#!/usr/bin/env bash
set -euo pipefail

# =========================================
# Generic CloudFront Cache Invalidator
# =========================================
# Required:
#   CLOUDFRONT_DISTRIBUTION_ID
# Optional:
#   PATHS (default /*)
# =========================================

: "${CLOUDFRONT_DISTRIBUTION_ID:?CLOUDFRONT_DISTRIBUTION_ID required}"

PATHS="${1:-"/*"}"

echo "🧹 Invalidating CloudFront cache"
aws cloudfront create-invalidation \
  --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
  --paths "$PATHS"

echo "✅ Invalidation created for $PATHS"
