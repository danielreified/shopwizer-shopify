#!/usr/bin/env bash
set -euo pipefail

# =========================================
# Generic Lambda Function Deployer
# =========================================
# Required:
#   LAMBDA_FUNCTION, S3_BUCKET, S3_KEY
# Optional:
#   ROLE_ARN, AWS_REGION, RUNTIME, HANDLER, TIMEOUT, MEMORY_SIZE, ARCH, PUBLISH
# =========================================

: "${LAMBDA_FUNCTION:?LAMBDA_FUNCTION required}"
: "${S3_BUCKET:?S3_BUCKET required}"
: "${S3_KEY:?S3_KEY required}"

AWS_REGION="${AWS_REGION:-us-east-1}"
PUBLISH="${PUBLISH:-true}"

echo "--------------------------------------"
echo "🚀 Deploying Lambda"
echo "  Function : $LAMBDA_FUNCTION"
echo "  Source   : s3://$S3_BUCKET/$S3_KEY"
echo "  Region   : $AWS_REGION"
echo "  Publish  : $PUBLISH"
echo "--------------------------------------"

echo "🔁 Updating function code..."
aws lambda update-function-code \
  --function-name "$LAMBDA_FUNCTION" \
  --s3-bucket "$S3_BUCKET" \
  --s3-key "$S3_KEY" \
  --region "$AWS_REGION" \
  $( [[ "$PUBLISH" == "true" ]] && echo "--publish" )

echo "✅ Lambda deployed successfully"
