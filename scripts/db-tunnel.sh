#!/usr/bin/env bash
#
# db-tunnel.sh - Start/stop SSM bastion and tunnel to Aurora via RDS Proxy
#
# Usage:
#   ./scripts/db-tunnel.sh <env> <command>
#
# Examples:
#   ./scripts/db-tunnel.sh dev start   - Start dev bastion and open tunnel
#   ./scripts/db-tunnel.sh prod stop   - Stop prod bastion instance
#   ./scripts/db-tunnel.sh dev status  - Show dev bastion instance state
#
set -euo pipefail

# Get script directory for relative path resolution
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Parse environment argument
ENV="${1:-}"
if [[ -z "$ENV" || ! "$ENV" =~ ^(dev|prod)$ ]]; then
  echo "Usage: $0 <dev|prod> <command>"
  echo "  Commands: start, stop, status, tunnel, help"
  exit 1
fi

# Load environment-specific config
ENV_FILE="$PROJECT_ROOT/.env.tunnel.$ENV"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "Error: Environment file not found: $ENV_FILE"
  exit 1
fi

# shellcheck disable=SC1090
source "$ENV_FILE"

# Shift past the env argument so $1 becomes the command
shift

# Configuration from env file
INSTANCE_ID="${BASTION_INSTANCE_ID:-}"
RDS_PROXY_ENDPOINT="${RDS_PROXY_ENDPOINT:-}"
LOCAL_PORT="${LOCAL_PORT:-5432}"
REMOTE_PORT="${REMOTE_PORT:-5432}"
AWS_REGION="${AWS_REGION:-us-east-1}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions
info() { echo -e "${GREEN}[INFO]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1" >&2; exit 1; }

check_config() {
  if [[ -z "$INSTANCE_ID" ]]; then
    error "BASTION_INSTANCE_ID is not set. Run 'terraform output bastion_instance_id' and export it."
  fi
  if [[ -z "$RDS_PROXY_ENDPOINT" ]]; then
    error "RDS_PROXY_ENDPOINT is not set. Run 'terraform output rds_proxy_endpoint' and export it."
  fi
}

get_instance_state() {
  aws ec2 describe-instances \
    --instance-ids "$INSTANCE_ID" \
    --region "$AWS_REGION" \
    --query 'Reservations[0].Instances[0].State.Name' \
    --output text 2>/dev/null || echo "unknown"
}

wait_for_state() {
  local target_state="$1"
  local max_wait="${2:-120}"
  local waited=0

  info "Waiting for instance to be $target_state..."
  while [[ $(get_instance_state) != "$target_state" ]]; do
    sleep 5
    waited=$((waited + 5))
    if [[ $waited -ge $max_wait ]]; then
      error "Timeout waiting for instance to be $target_state"
    fi
    echo -n "."
  done
  echo ""
  info "Instance is now $target_state"
}

wait_for_ssm() {
  local max_wait="${1:-120}"
  local waited=0

  info "Waiting for SSM agent to be ready..."
  while ! aws ssm describe-instance-information \
    --region "$AWS_REGION" \
    --filters "Key=InstanceIds,Values=$INSTANCE_ID" \
    --query 'InstanceInformationList[0].PingStatus' \
    --output text 2>/dev/null | grep -q "Online"; do
    sleep 5
    waited=$((waited + 5))
    if [[ $waited -ge $max_wait ]]; then
      error "Timeout waiting for SSM agent"
    fi
    echo -n "."
  done
  echo ""
  info "SSM agent is online"
}

cmd_start() {
  check_config

  local state
  state=$(get_instance_state)

  if [[ "$state" == "running" ]]; then
    info "Instance is already running"
  elif [[ "$state" == "stopped" ]]; then
    info "Starting bastion instance..."
    aws ec2 start-instances --instance-ids "$INSTANCE_ID" --region "$AWS_REGION" > /dev/null
    wait_for_state "running"
    wait_for_ssm
  else
    error "Instance is in unexpected state: $state"
  fi

  cmd_tunnel
}

cmd_stop() {
  check_config

  local state
  state=$(get_instance_state)

  if [[ "$state" == "stopped" ]]; then
    info "Instance is already stopped"
  elif [[ "$state" == "running" ]]; then
    info "Stopping bastion instance..."
    aws ec2 stop-instances --instance-ids "$INSTANCE_ID" --region "$AWS_REGION" > /dev/null
    wait_for_state "stopped" 180
    info "Instance stopped - no compute charges while stopped"
  else
    warn "Instance is in state: $state - attempting stop anyway"
    aws ec2 stop-instances --instance-ids "$INSTANCE_ID" --region "$AWS_REGION" > /dev/null || true
  fi
}

cmd_status() {
  check_config

  local state
  state=$(get_instance_state)

  echo "Environment: $ENV"
  echo "Bastion Instance: $INSTANCE_ID"
  echo "RDS Proxy: $RDS_PROXY_ENDPOINT"
  echo "State: $state"

  if [[ "$state" == "running" ]]; then
    local ssm_status
    ssm_status=$(aws ssm describe-instance-information \
      --region "$AWS_REGION" \
      --filters "Key=InstanceIds,Values=$INSTANCE_ID" \
      --query 'InstanceInformationList[0].PingStatus' \
      --output text 2>/dev/null || echo "Unknown")
    echo "SSM Agent: $ssm_status"
  fi
}

cmd_tunnel() {
  check_config

  info "Opening SSM tunnel to RDS Proxy..."
  info "Local port: localhost:$LOCAL_PORT -> $RDS_PROXY_ENDPOINT:$REMOTE_PORT"
  echo ""
  info "Connect with: psql postgresql://username:password@localhost:$LOCAL_PORT/shopwizerdb"
  echo ""
  warn "Press Ctrl+C to close the tunnel"
  echo ""

  aws ssm start-session \
    --target "$INSTANCE_ID" \
    --region "$AWS_REGION" \
    --document-name AWS-StartPortForwardingSessionToRemoteHost \
    --parameters "{\"host\":[\"$RDS_PROXY_ENDPOINT\"],\"portNumber\":[\"$REMOTE_PORT\"],\"localPortNumber\":[\"$LOCAL_PORT\"]}"
}

cmd_help() {
  echo "Usage: $0 <dev|prod> <command>"
  echo ""
  echo "Commands:"
  echo "  start   - Start bastion instance and open tunnel"
  echo "  stop    - Stop bastion instance"
  echo "  status  - Show bastion instance state"
  echo "  tunnel  - Open tunnel (assumes instance is running)"
  echo "  help    - Show this help message"
  echo ""
  echo "Configuration:"
  echo "  Config is loaded from .env.tunnel.<env> in the project root."
  echo "  - .env.tunnel.dev  for dev environment"
  echo "  - .env.tunnel.prod for prod environment"
  echo ""
  echo "Examples:"
  echo "  $0 dev start    # Start dev tunnel"
  echo "  $0 prod status  # Check prod bastion status"
  echo "  $0 dev stop     # Stop dev bastion"
}

# Main
case "${1:-help}" in
  start)  cmd_start ;;
  stop)   cmd_stop ;;
  status) cmd_status ;;
  tunnel) cmd_tunnel ;;
  help)   cmd_help ;;
  *)      error "Unknown command: $1. Use 'help' for usage." ;;
esac
