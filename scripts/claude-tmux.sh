#!/usr/bin/env bash
# ───────────────────────────────────────────────────────
# claude-tmux.sh — Launch multi-agent Claude Code in tmux
# ───────────────────────────────────────────────────────
#
# Usage:
#   ./scripts/claude-tmux.sh                          # Launch all agents
#   ./scripts/claude-tmux.sh app service-nodejs       # Launch specific agents
#   ./scripts/claude-tmux.sh lead app db              # Custom combo
#
# Available agents: lead, service-nodejs, service-ml-py, app, db, shared, ops, test
#
# Default layout (all agents):
#   ┌──────────────────┬──────────────────┐
#   │      lead        │  service-nodejs  │
#   ├──────────────────┼──────────────────┤
#   │      app         │       db         │
#   ├──────────────────┼──────────────────┤
#   │     shared       │       ops        │
#   └──────────────────┴──────────────────┘
#
# Lead runs in plan-only mode (no code editing).

set -euo pipefail

SESSION="claude-agents"
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

# Agent definitions: name -> claude flags
declare -A AGENTS=(
  [lead]="--agent-file .claude/agents/lead.md --allowedTools 'Read,Glob,Grep,Bash(git log*),Bash(git diff*),Bash(git status*),Bash(pnpm turbo run * --dry-run),WebSearch,WebFetch,Task'"
  [service-nodejs]="--agent-file .claude/agents/service-nodejs.md"
  [service-ml-py]="--agent-file .claude/agents/service-ml-py.md"
  [app]="--agent-file .claude/agents/app.md"
  [db]="--agent-file .claude/agents/db.md"
  [shared]="--agent-file .claude/agents/shared.md"
  [ops]="--agent-file .claude/agents/ops.md"
  [test]="--agent-file .claude/agents/test.md"
)

# Default: launch core agents (skip ml-py unless requested — it's niche)
SELECTED=("$@")
if [[ ${#SELECTED[@]} -eq 0 ]]; then
  SELECTED=(lead service-nodejs app db shared ops)
fi

# Validate agent names
for agent in "${SELECTED[@]}"; do
  if [[ ! -v "AGENTS[$agent]" ]]; then
    echo "Unknown agent: $agent"
    echo "Available: ${!AGENTS[*]}"
    exit 1
  fi
done

# Kill existing session if it exists
tmux kill-session -t "$SESSION" 2>/dev/null || true

echo "Launching Claude Code agents in tmux session: $SESSION"
echo "Agents: ${SELECTED[*]}"
echo "Project: $PROJECT_DIR"
echo ""

# Create session with the first agent
FIRST="${SELECTED[0]}"
FIRST_FLAGS="${AGENTS[$FIRST]}"
tmux new-session -d -s "$SESSION" -n "agents" -c "$PROJECT_DIR"
tmux send-keys -t "$SESSION" "claude ${FIRST_FLAGS}" Enter

# Name the first pane
tmux select-pane -t "$SESSION" -T "$FIRST"

# Create additional panes for remaining agents
for ((i=1; i<${#SELECTED[@]}; i++)); do
  agent="${SELECTED[$i]}"
  flags="${AGENTS[$agent]}"

  # Alternate between horizontal and vertical splits for a grid
  if (( i % 2 == 1 )); then
    tmux split-window -h -t "$SESSION" -c "$PROJECT_DIR"
  else
    tmux split-window -v -t "$SESSION" -c "$PROJECT_DIR"
  fi

  tmux send-keys -t "$SESSION" "claude ${flags}" Enter
  tmux select-pane -t "$SESSION" -T "$agent"
done

# Even out the layout
tmux select-layout -t "$SESSION" tiled

# Enable pane titles
tmux set-option -t "$SESSION" pane-border-status top
tmux set-option -t "$SESSION" pane-border-format " #{pane_title} "

# Select the first pane (lead)
tmux select-pane -t "$SESSION:0.0"

echo "Session created! Attach with:"
echo ""
echo "  tmux attach -t $SESSION"
echo ""
echo "Tmux cheatsheet:"
echo "  Ctrl+b o        — Cycle between panes"
echo "  Ctrl+b q        — Show pane numbers (press number to jump)"
echo "  Ctrl+b z        — Zoom/unzoom current pane"
echo "  Ctrl+b arrow    — Move to adjacent pane"
echo "  Ctrl+b d        — Detach (agents keep running)"
echo "  Ctrl+b [        — Scroll mode (q to exit)"
echo ""

# Attach to session
tmux attach -t "$SESSION"
