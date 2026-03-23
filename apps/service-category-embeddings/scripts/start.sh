#!/bin/bash
# scripts/start.sh - Start the inference server
#
# Usage: ./scripts/start.sh

set -e
cd "$(dirname "$0")/.."

echo "🚀 Starting Category Embeddings Service..."

cd python

# Check venv
if [ ! -d ".venv" ]; then
    echo "⚠️  Creating virtual environment..."
    python3 -m venv .venv
    source .venv/bin/activate
    pip install -r requirements.txt
else
    source .venv/bin/activate
fi

# Check model exists
MODEL_PATH=${MODEL_PATH:-"model/category2vec.model"}
PORT=${PORT:-8003}

if [ ! -f "$MODEL_PATH" ]; then
    echo "⚠️  Model not found at $MODEL_PATH!"
    echo "   Ensure models are trained and copied to python/model/"
    exit 1
fi

# Start server
echo "📡 Server starting on http://127.0.0.1:$PORT using $MODEL_PATH"
uvicorn server:app --host 127.0.0.1 --port $PORT --reload
