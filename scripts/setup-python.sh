#!/usr/bin/env bash
set -e

# usage: scripts/setup-python.sh path/to/python/service
TARGET_DIR=${1:-"."}

if [ ! -d "$TARGET_DIR" ]; then
  echo "❌ Directory $TARGET_DIR does not exist"
  exit 1
fi

cd "$TARGET_DIR"

echo "🐍 Setting up Python environment for $(basename "$TARGET_DIR")..."

# Create venv if not exists
if [ ! -d ".venv" ]; then
  echo "📦 Creating virtual environment..."
  python3 -m venv .venv
fi

# Activate and install dependencies
. .venv/bin/activate
pip install --upgrade pip

if [ -f "requirements.txt" ]; then
  echo "📚 Installing requirements..."
  pip install -r requirements.txt
else
  echo "⚠️ No requirements.txt found, skipping installation."
fi

echo "✅ Python environment ready in $TARGET_DIR/.venv"
