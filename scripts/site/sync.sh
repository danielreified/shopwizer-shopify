#!/usr/bin/env bash
set -euo pipefail

# =========================================
# Generic S3 Static Site Sync
# =========================================
# Required:
#   S3_BUCKET
# Optional:
#   BUILD_DIR, AWS_REGION
# =========================================

: "${S3_BUCKET:?S3_BUCKET required}"

BUILD_DIR="${BUILD_DIR:-apps/site-next/out}"
AWS_REGION="${AWS_REGION:-us-east-1}"

echo "🌐 Syncing static site"
echo "  Source : $BUILD_DIR"
echo "  Bucket : $S3_BUCKET"
echo "--------------------------------------"

aws s3 sync "$BUILD_DIR" "s3://$S3_BUCKET" --delete --region "$AWS_REGION" --acl public-read

echo "✅ Sync complete"
