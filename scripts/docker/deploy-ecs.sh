#!/usr/bin/env bash
set -euo pipefail

: "${SERVICE_NAME:?SERVICE_NAME required}"
: "${ECS_CLUSTER:?ECS_CLUSTER required}"
: "${AWS_REGION:?AWS_REGION required}"

echo "--------------------------------------"
echo "🚀 Deploying ECS service"
echo "🚀 Cluster : $ECS_CLUSTER"
echo "🚀 Service : $SERVICE_NAME"
echo "--------------------------------------"

# Force new deployment (pulls latest image based on task definition)
echo "🔄 Forcing new deployment..."
aws ecs update-service \
  --cluster "$ECS_CLUSTER" \
  --service "$SERVICE_NAME" \
  --force-new-deployment \
  --region "$AWS_REGION"

echo "✅ Service updated → $SERVICE_NAME"