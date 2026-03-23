# service-ranker

XGBoost-based reranking service for product recommendations. Reorders recommendation candidates based on predicted click probability using engagement, position, and context features.

## Tech Stack

- **Runtime**: Python 3.13
- **Model**: XGBoost (binary logistic classifier)
- **API**: FastAPI + Uvicorn
- **Training Data**: Click events from the pixel data lake (Athena/Parquet)
- **Deploy**: Docker on ECS

## Features Used

- **Position**: Current position in slate, normalized position, slate size
- **Item Engagement**: views30d, clicks30d, carts30d, orders30d, revenue30d
- **Context**: Price delta and category match relative to source product
- **Source**: The product being viewed (price, engagement metrics)

## Project Structure

```
service-ranker/
├── api/
│   └── app.py                 # FastAPI server (/rank, /health)
├── config/
│   └── ranker_config.py       # Features, hyperparameters, infrastructure
├── train/
│   ├── etl_clicks.py          # Extract click data from Athena
│   └── train_xgboost.py       # Train the XGBoost model
├── inference/
│   └── inference_xgboost.py   # Inference utilities
├── utils/
│   └── generate_fake_data.py  # Generate synthetic training data
├── models/
│   └── reranker_xgb.json     # Trained model (after training)
├── tests/
│   └── test_inference.py      # Inference tests
├── requirements.txt
└── Dockerfile
```

## Quick Start

### Setup

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### Training Pipeline

```bash
# 1. Extract training data from Athena (last 30 days)
python train/etl_clicks.py --days 30 --output train/training_data.csv

# 2. Train the model
python train/train_xgboost.py --input train/training_data.csv --output models/reranker_xgb.json

# 3. Test inference
python inference/inference_xgboost.py
```

Training creates positive examples (clicked products, label=1) and negative examples (other products shown in the same slate, label=0). Uses GroupShuffleSplit to prevent data leakage across slates.

### Start the API Server

```bash
pnpm start
# or directly:
uvicorn api.app:app --reload --port 8000
```

## API

### Health Check

```bash
curl http://localhost:8000/health
```

### Rank Products

```bash
curl -X POST http://localhost:8000/rank \
  -H "Content-Type: application/json" \
  -d '[
    {
      "views24h": 50, "views7d": 200,
      "clicks24h": 5, "clicks7d": 20,
      "orders7d": 2, "orders30d": 8,
      "revenue7d": 150.0, "revenue30d": 600.0,
      "bestSellerScore": 0.8, "trendingScore": 0.6,
      "fbtScore": 0.4, "similarScore": 0.7
    }
  ]'
```

## Scripts

```bash
pnpm start            # Start FastAPI server (port 8000)
pnpm train            # Train the XGBoost model
pnpm infer            # Run inference test
pnpm dev:generate     # Generate fake training data
pnpm test             # Run pytest suite
```

## Environment Variables

| Variable | Description |
|---|---|
| `MODEL_PATH` | Path to trained model (default: `models/reranker_xgb.json`) |
| `AWS_REGION` | AWS region for Athena queries (default: `us-east-1`) |
| `ATHENA_DATABASE` | Athena database name (default: `shopwizer_px`) |
| `ATHENA_OUTPUT` | S3 path for Athena query results |
| `S3_PROCESSED_BUCKET` | S3 bucket with processed pixel data |
| `PORT` | API server port (default: `8000`) |

## Data Flow

1. Click events captured by web pixel -> CloudFront logs -> Parquet files
2. ETL script queries Athena for `reco_click` events with payloads
3. Each click is flattened: clicked item = positive, others = negative
4. XGBoost classifier trained on click probability
5. Model used at inference to rerank candidates

## Deployment

Deploys as a Docker container to **AWS ECS**. The trained model is baked into the Docker image. Exposes a `/health` endpoint for ALB health checks.
