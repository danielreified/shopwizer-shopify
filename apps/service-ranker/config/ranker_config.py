"""
ranker_config.py - Centralized Configuration for service-ranker

Contains infrastructure settings, model features, and training hyperparameters.
Sensitive env vars (AWS keys, etc.) remain in .env.
"""

import os

# ============================================================
# 1. Infrastructure & Paths
# ============================================================
INFRA_CONFIG = {
    "MODEL_PATH": os.getenv("MODEL_PATH", "models/reranker_xgb.json"),
    "TRAINING_DATA_PATH": "train/training_data.csv",
    "AWS_REGION": os.getenv("AWS_REGION", "us-east-1"),
    "ATHENA": {
        "DATABASE": os.getenv("ATHENA_DATABASE", "shopwizer_px"),
        "OUTPUT": os.getenv("ATHENA_OUTPUT", "s3://dev-ue1-shopwizer-query-results/"),
    },
    "S3": {
        "PROCESSED_BUCKET": os.getenv("S3_PROCESSED_BUCKET", "dev-ue1-shopwizer-cf-logs-px-processed"),
        "TRAINING_PREFIX": "training-data/",
    },
    "API_PORT": int(os.getenv("PORT", 8000)),
}

# ============================================================
# 2. Model Feature Configuration
# ============================================================
MODEL_CONFIG = {
    "FEATURE_COLUMNS": [
        # Position features
        "position",
        "position_normalized",
        "slate_size",
        
        # Item engagement features
        "price",
        "views30d",
        "clicks30d",
        "carts30d",
        "orders30d",
        "revenue30d",
        
        # Context features (relative to source)
        "price_delta",
        "same_category",
        
        # Source features
        "src_price",
        "src_views30d",
        "src_clicks30d",
    ],
    "METADATA_COLUMNS": [
        "slate_id",
        "rail",
        "shop",
        "timestamp",
        "item_pid",
        "clicked_pid",
    ],
    "DEFAULT_FEATURES": {
        "views30d": 0,
        "clicks30d": 0,
        "carts30d": 0,
        "orders30d": 0,
        "revenue30d": 0.0,
    }
}

# ============================================================
# 3. Training Hyperparameters
# ============================================================
TRAINING_PARAMS = {
    "objective": "binary:logistic",
    "n_estimators": 300,
    "learning_rate": 0.05,
    "max_depth": 6,
    "subsample": 0.8,
    "colsample_bytree": 0.8,
    "tree_method": "hist",
    "random_state": 42,
    "early_stopping_rounds": 20,
    "scale_pos_weight": "auto",  # Set to "auto" to calculate dynamically
}

# ============================================================
# 4. Data Pipeline Logic
# ============================================================
PIPELINE_CONFIG = {
    "MIN_SLATE_SIZE": 5,
    "MAX_SLATE_SIZE": 50,
    "NEGATIVE_SAMPLE_RATIO": 1.0,
    "TEST_SIZE": 0.2,
}
