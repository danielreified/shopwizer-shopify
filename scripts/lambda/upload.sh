#!/usr/bin/env bash
set -euo pipefail

# =========================================
# Generic Lambda Artifact Uploader
# =========================================
# Required:
#   S3_BUCKET, ZIP_NAME
# Optional:
#   BUILD_DIR, S3_KEY, AWS_REGION
# =========================================

: "${S3_BUCKET:?S3_BUCKET required}"
: "${ZIP_NAME:?ZIP_NAME required}"

BUILD_DIR="${BUILD_DIR:-.lambda}"
AWS_REGION="${AWS_REGION:-us-east-1}"
S3_KEY="${S3_KEY:-${ZIP_NAME}}"
ZIP_PATH="${BUILD_DIR}/${ZIP_NAME%.zip}.zip"

[[ -f "$ZIP_PATH" ]] || { echo "❌ File not found: $ZIP_PATH"; exit 1; }

echo "📦 Uploading Lambda artifact"
echo "  Source : $ZIP_PATH"
echo "  Target : s3://$S3_BUCKET/$S3_KEY"
echo "--------------------------------------"

aws s3 cp "$ZIP_PATH" "s3://$S3_BUCKET/$S3_KEY" --region "$AWS_REGION" --only-show-errors

echo "✅ Uploaded → s3://$S3_BUCKET/$S3_KEY"
