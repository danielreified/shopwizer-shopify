#!/bin/bash
# scripts/start-unified.sh - Start the inference server with the UNIFIED behavior model
#
# Usage: ./scripts/start-unified.sh

export MODEL_PATH="model/category2vec_unified.model"
export PORT=8003

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "🚀 Starting Category Embeddings Service (UNIFIED MODEL) on port $PORT..."
"$DIR/start.sh"
