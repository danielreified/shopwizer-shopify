#!/bin/bash
# scripts/train.sh - Run the full training pipeline
#
# Usage: ./scripts/train.sh

set -e
cd "$(dirname "$0")/.."

echo "🧠 Category Embeddings Training Pipeline"
echo ""

# Use the python venv
cd python
if [ ! -d ".venv" ]; then
    echo "⚠️  Creating virtual environment..."
    python3 -m venv .venv
    source .venv/bin/activate
    pip install -r requirements.txt
else
    source .venv/bin/activate
fi

cd ../training

# Run pipeline
python pipeline.py "$@"
