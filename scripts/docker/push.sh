#!/usr/bin/env bash
set -euo pipefail

# =========================================
# Generic Docker Pusher (GitLab + ECR)
# =========================================
# Required:
#   SERVICE_NAME, AWS_ACCOUNT_ID, AWS_REGION
# Optional:
#   VERSION, REGISTRY, REGISTRY_USER, REGISTRY_PASSWORD, CI_REGISTRY_*
#   ECR_REPO_PREFIX – prefix (e.g. dev-ue1-shopwise-rec)
# =========================================

SERVICE_NAME="${1:-${SERVICE_NAME:-}}"
VERSION="${2:-${VERSION:-latest}}"

: "${SERVICE_NAME:?SERVICE_NAME required}"
: "${AWS_ACCOUNT_ID:?AWS_ACCOUNT_ID required}"
: "${AWS_REGION:?AWS_REGION required}"

ECR_REPO="${ECR_REPO}"
ECR_URI="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO}"

LOCAL_IMAGE="${SERVICE_NAME}:${VERSION}"

REMOTE_ECR="${ECR_URI}:${VERSION}"
REMOTE_ECR_LATEST="${ECR_URI}:latest"
REMOTE_GITLAB="${CI_REGISTRY_IMAGE:-${REGISTRY_IMAGE:-}}/${SERVICE_NAME}:${VERSION}"
REMOTE_GITLAB_LATEST="${CI_REGISTRY_IMAGE:-${REGISTRY_IMAGE:-}}/${SERVICE_NAME}:latest"

echo "🚀 Pushing Docker image"
echo "  Service : $SERVICE_NAME"
echo "  Version : $VERSION"
echo "  ECR URI : $ECR_URI"
echo "--------------------------------------"

# GitLab Registry
if [[ -n "${CI_REGISTRY_USER:-}" && -n "${CI_REGISTRY_PASSWORD:-}" ]]; then
  echo "🔑 Login GitLab Registry"
  echo "$CI_REGISTRY_PASSWORD" | docker login "$CI_REGISTRY" -u "$CI_REGISTRY_USER" --password-stdin
  docker tag "$LOCAL_IMAGE" "$REMOTE_GITLAB"
  docker tag "$LOCAL_IMAGE" "$REMOTE_GITLAB_LATEST"
  docker push "$REMOTE_GITLAB"
  docker push "$REMOTE_GITLAB_LATEST"
else
  echo "⚠️  Skipping GitLab push (missing creds)"
fi

# Amazon ECR
echo "🔑 Login AWS ECR"
aws ecr get-login-password --region "$AWS_REGION" \
  | docker login --username AWS --password-stdin "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

docker tag "$LOCAL_IMAGE" "$REMOTE_ECR"
docker tag "$LOCAL_IMAGE" "$REMOTE_ECR_LATEST"
docker push "$REMOTE_ECR"
docker push "$REMOTE_ECR_LATEST"

echo "✅ Push complete → $REMOTE_ECR"
