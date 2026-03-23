#!/bin/bash
# scripts/start-pure.sh - Start the inference server with the PURE domain model
#
# Usage: ./scripts/start-pure.sh

export MODEL_PATH="model/category2vec_pure.model"
export PORT=8004

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "🚀 Starting Category Embeddings Service (PURE MODEL) on port $PORT..."
"$DIR/start.sh"
