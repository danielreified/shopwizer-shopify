#!/usr/bin/env bash
set -euo pipefail

# =========================================
# Generic Docker Builder
# =========================================
# Required:
#   SERVICE_NAME – Name of the service (e.g. service-products)
# Optional:
#   VERSION      – Tag version (default: latest)
#   ROOT_DIR     – Repo root (auto-detected)
#   DOCKERFILE   – Path override
#   DOCKER_BUILDKIT – Defaults to 1
# =========================================

SERVICE_NAME="${1:-${SERVICE_NAME:-}}"
VERSION="${2:-${VERSION:-latest}}"

: "${SERVICE_NAME:?SERVICE_NAME required (arg1 or env)}"

ROOT_DIR="${ROOT_DIR:-$(git rev-parse --show-toplevel)}"
DOCKERFILE="${DOCKERFILE:-${ROOT_DIR}/apps/${SERVICE_NAME}/Dockerfile}"
IMAGE="${SERVICE_NAME}:${VERSION}"
LATEST="${SERVICE_NAME}:latest"

export DOCKER_BUILDKIT="${DOCKER_BUILDKIT:-1}"

echo "🧱 Building Docker image"
echo "  Service : $SERVICE_NAME"
echo "  File    : $DOCKERFILE"
echo "  Version : $VERSION"
echo "  Context : $ROOT_DIR"
echo "--------------------------------------"

# --platform linux/amd64 \

docker build --no-cache \
  --file "$DOCKERFILE" \
  --tag "$IMAGE" \
  --tag "$LATEST" \
  "$ROOT_DIR"

echo "✅ Build complete → $IMAGE , $LATEST"
