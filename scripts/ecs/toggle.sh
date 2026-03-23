#!/bin/bash
# scripts/ecs/toggle.sh
# Interactive ECS service start/stop utility
# Usage: ./scripts/ecs/toggle.sh [cluster] [region]

set -e

CLUSTER="${1:-dev-ue1-shopwizer}"
REGION="${2:-us-east-1}"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔍 Fetching ECS services from cluster: ${CLUSTER}...${NC}"

# Get services
SERVICES=$(aws ecs list-services --cluster "$CLUSTER" --region "$REGION" --query 'serviceArns[*]' --output text 2>/dev/null | tr '\t' '\n' | xargs -n1 basename)

if [ -z "$SERVICES" ]; then
  echo -e "${RED}❌ No services found in cluster ${CLUSTER}${NC}"
  exit 1
fi

# Check if fzf is installed
if command -v fzf &> /dev/null; then
  SERVICE=$(echo "$SERVICES" | fzf --prompt="Select service: " --height=15)
else
  # Fallback to numbered list
  echo -e "${YELLOW}Available services:${NC}"
  i=1
  while IFS= read -r svc; do
    echo "  $i) $svc"
    i=$((i+1))
  done <<< "$SERVICES"
  
  echo ""
  read -p "Enter service number: " choice
  SERVICE=$(echo "$SERVICES" | sed -n "${choice}p")
fi

if [ -z "$SERVICE" ]; then
  echo -e "${RED}❌ No service selected${NC}"
  exit 1
fi

echo -e "${GREEN}📦 Selected: ${SERVICE}${NC}"

# Get current desired count
CURRENT=$(aws ecs describe-services --cluster "$CLUSTER" --services "$SERVICE" --region "$REGION" --query 'services[0].desiredCount' --output text)
RUNNING=$(aws ecs describe-services --cluster "$CLUSTER" --services "$SERVICE" --region "$REGION" --query 'services[0].runningCount' --output text)

echo -e "   Current state: desired=${CURRENT}, running=${RUNNING}"

# Select action
if command -v fzf &> /dev/null; then
  ACTION=$(echo -e "stop (set to 0)\nstart (set to 1)\nscale (custom count)\nstatus\ncancel" | fzf --prompt="Action: " --height=8)
else
  echo ""
  echo "Actions:"
  echo "  1) stop (set to 0)"
  echo "  2) start (set to 1)"
  echo "  3) scale (custom count)"
  echo "  4) status"
  echo "  5) cancel"
  read -p "Enter action number: " action_num
  case $action_num in
    1) ACTION="stop" ;;
    2) ACTION="start" ;;
    3) ACTION="scale" ;;
    4) ACTION="status" ;;
    *) ACTION="cancel" ;;
  esac
fi

case $ACTION in
  stop*)
    echo -e "${YELLOW}⏹️  Stopping ${SERVICE}...${NC}"
    aws ecs update-service --cluster "$CLUSTER" --service "$SERVICE" --desired-count 0 --region "$REGION" --output text --query 'service.serviceName' > /dev/null
    echo -e "${GREEN}✅ Service stopped (desired count set to 0)${NC}"
    ;;
  start*)
    echo -e "${YELLOW}▶️  Starting ${SERVICE}...${NC}"
    aws ecs update-service --cluster "$CLUSTER" --service "$SERVICE" --desired-count 1 --region "$REGION" --output text --query 'service.serviceName' > /dev/null
    echo -e "${GREEN}✅ Service started (desired count set to 1)${NC}"
    ;;
  scale*)
    read -p "Enter desired count: " count
    echo -e "${YELLOW}📊 Scaling ${SERVICE} to ${count}...${NC}"
    aws ecs update-service --cluster "$CLUSTER" --service "$SERVICE" --desired-count "$count" --region "$REGION" --output text --query 'service.serviceName' > /dev/null
    echo -e "${GREEN}✅ Service scaled to ${count}${NC}"
    ;;
  status*)
    echo -e "${GREEN}📊 Service status:${NC}"
    aws ecs describe-services --cluster "$CLUSTER" --services "$SERVICE" --region "$REGION" \
      --query 'services[0].{Name:serviceName,Desired:desiredCount,Running:runningCount,Pending:pendingCount,Status:status}' \
      --output table
    ;;
  *)
    echo -e "${YELLOW}Cancelled${NC}"
    exit 0
    ;;
esac
