# service-category-embeddings

Word2Vec-based category similarity service for "Frequently Bought Together" recommendations. Trained on Amazon co-purchase data, mapped to the Shopwise category taxonomy.

## Tech Stack

- **Runtime**: Python 3.13
- **Model**: Word2Vec Skip-gram (Gensim)
- **API**: FastAPI + Uvicorn
- **Training Data**: Amazon review co-purchase patterns (~100k user baskets)
- **Deploy**: Docker on ECS

## How It Works

1. **Data Source**: Amazon review data provides co-purchase patterns across millions of users.
2. **Mapping**: Vector semantic search maps Amazon categories to Shopwise DB categories.
3. **Model**: Word2Vec Skip-gram learns category embeddings from "shopping baskets."
4. **Result**: Categories that are frequently bought together have similar vectors.

## Model Stats

- **Vocab**: ~300 categories
- **Dimensions**: 32
- **Training Data**: ~100k Amazon user baskets
- **Mapping Coverage**: ~80% (high-confidence semantic matches)

## Project Structure

```
service-category-embeddings/
├── python/                    # Inference server
│   ├── server.py              # FastAPI endpoints (/similar, /similar-multi)
│   ├── model/                 # Trained model copy (gitignored)
│   └── requirements.txt
├── training/                  # SQL-first training pipeline
│   ├── README.md              # Run book and architecture docs
│   ├── ingest_data.py         # Stage 1: Ingest to SQLite
│   ├── map_categories.py      # Stage 2: Vector-map to Shopwise UUIDs
│   └── train_unified.py       # Stage 3: Train unified model
├── config/
│   └── ml_config.py           # Hyperparameters and pipeline config
├── model/                     # Trained models (category2vec_*.model)
├── client/                    # TypeScript client for Node.js services
│   └── src/index.ts
├── scripts/
│   ├── train.sh               # Run training pipeline
│   └── start.sh               # Start inference server
└── Dockerfile
```

## Quick Start

### Train the Model

```bash
# Full pipeline (download -> build -> map -> train)
./scripts/train.sh

# Or run individual steps
./scripts/train.sh --step map
./scripts/train.sh --step train
```

### Start the Server

```bash
./scripts/start.sh
```

Server runs on `http://127.0.0.1:8003`.

## API

### Health Check

```bash
curl http://localhost:8003/health
```

### Get Similar Categories

```bash
curl -X POST http://localhost:8003/similar \
  -H "Content-Type: application/json" \
  -d '{"category_id": "bt-9-12", "top_n": 5}'
```

Response:

```json
{
  "categories": [
    { "category_id": "bt-9-1-1", "name": "Baby Wipe Dispensers", "score": 0.79 },
    { "category_id": "bt-9-2", "name": "Baby Wipes", "score": 0.76 }
  ]
}
```

### Multi-Category (Cart)

```bash
curl -X POST http://localhost:8003/similar-multi \
  -H "Content-Type: application/json" \
  -d '{"category_ids": ["bt-9-12", "bt-10-16"], "top_n": 5}'
```

## Integration

The Remix app calls this service from `bundles.server.ts`:

```typescript
const CATEGORY_EMBEDDINGS_URL = process.env.CATEGORY_EMBEDDINGS_URL || 'http://localhost:8003';

const response = await fetch(`${CATEGORY_EMBEDDINGS_URL}/similar`, {
  method: 'POST',
  body: JSON.stringify({ category_id: categoryId, top_n: 6 }),
});
```

## Deployment

Deploys as a Docker container to **AWS ECS**. Exposes a `/health` endpoint for ALB health checks. The trained model file is baked into the Docker image at build time.
