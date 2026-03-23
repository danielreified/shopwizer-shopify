#!/bin/bash
# scripts/ecs/service.sh
# Usage: ./scripts/ecs/service.sh <action> <service-name>
# Example: ./scripts/ecs/service.sh start app-remix

set -e

ACTION="$1"
SERVICE_NAME="$2"
CLUSTER="${ECS_CLUSTER:-dev-ue1-shopwizer-ecs}"
REGION="${AWS_REGION:-us-east-1}"

echo "DEBUG: Acting on Cluster: '$CLUSTER' in '$REGION'"

if [ -z "$ACTION" ] || [ -z "$SERVICE_NAME" ]; then
  echo "Usage: $0 <start|stop|status> <service-name>"
  echo "Example: $0 start app-remix"
  exit 1
fi

# Map service name to ECS service name
case $SERVICE_NAME in
  app-remix)        ECS_SERVICE="dev-ue1-shopwizer-app-remix-svc" ;;
  service-events)   ECS_SERVICE="dev-ue1-shopwizer-events-svc" ;;
  service-enrich)   ECS_SERVICE="dev-ue1-shopwizer-enrich-svc" ;;
  service-px)       ECS_SERVICE="dev-ue1-shopwizer-px-worker-svc" ;;
  service-jobs-worker) ECS_SERVICE="dev-ue1-shopwizer-jobs-worker-svc" ;;
  service-analytics) ECS_SERVICE="dev-ue1-shopwizer-analytics-svc" ;;
  *)
    echo "❌ Unknown service: $SERVICE_NAME"
    echo "Valid services: app-remix, service-events, service-enrich, service-px, service-jobs-worker, service-analytics"
    exit 1
    ;;
esac

case $ACTION in
  start)
    echo "▶️  Starting $ECS_SERVICE..."
    aws ecs update-service --cluster "$CLUSTER" --service "$ECS_SERVICE" --desired-count 1 --region "$REGION" --query 'service.serviceName' --output text
    echo "✅ Started"
    ;;
  stop)
    echo "⏹️  Stopping $ECS_SERVICE..."
    aws ecs update-service --cluster "$CLUSTER" --service "$ECS_SERVICE" --desired-count 0 --region "$REGION" --query 'service.serviceName' --output text
    echo "✅ Stopped"
    ;;
  status)
    aws ecs describe-services --cluster "$CLUSTER" --services "$ECS_SERVICE" --region "$REGION" \
      --query 'services[0].{Service:serviceName,Desired:desiredCount,Running:runningCount,Status:status}' \
      --output table
    ;;
  logs)
    # Convention: /ecs/<service-name-minus-svc>
    # e.g. dev-ue1-shopwise-rec-app-remix-svc -> /ecs/dev-ue1-shopwise-rec-app-remix
    LOG_GROUP="/aws/ecs/${ECS_SERVICE%-svc}"
    echo "📜 Tailing logs for $LOG_GROUP..."
    aws logs tail "$LOG_GROUP" --follow --region "$REGION"
    ;;
  *)
    echo "❌ Unknown action: $ACTION"
    echo "Valid actions: start, stop, status"
    exit 1
    ;;
esac
