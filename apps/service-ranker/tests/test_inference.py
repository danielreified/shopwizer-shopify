import os
import pandas as pd
import xgboost as xgb
from inference.inference_xgboost import load_model, predict

MODEL_PATH = "models/reranker_xgb.json"


def test_model_exists():
    """Check that the model file exists before running tests."""
    assert os.path.exists(MODEL_PATH), f"Model not found at {MODEL_PATH}"


def test_model_can_load():
    """Ensure the model can load without errors."""
    model = load_model(MODEL_PATH)
    assert isinstance(model, xgb.XGBRegressor)


def test_inference_output_shape():
    """Ensure predictions run successfully and shape matches input."""
    model = load_model(MODEL_PATH)

    df = pd.DataFrame(
        {
            "views24h": [10, 500],
            "views7d": [1000, 2000],
            "clicks24h": [5, 30],
            "clicks7d": [50, 200],
            "orders7d": [2, 10],
            "orders30d": [15, 80],
            "revenue7d": [300, 1200],
            "revenue30d": [2000, 7000],
            "bestSellerScore": [0.2, 0.8],
            "trendingScore": [0.6, 0.9],
            "fbtScore": [0.3, 0.7],
            "similarScore": [0.5, 0.4],
        }
    )

    preds = predict(model, df)
    assert len(preds) == len(df), "Prediction count should match input row count"
    assert (preds >= 0).all(), "Predictions should be non-negative"


def test_inference_repeatability():
    """Ensure predictions are deterministic."""
    model = load_model(MODEL_PATH)
    df = pd.DataFrame(
        {
            "views24h": [50],
            "views7d": [1500],
            "clicks24h": [20],
            "clicks7d": [100],
            "orders7d": [5],
            "orders30d": [50],
            "revenue7d": [600],
            "revenue30d": [4000],
            "bestSellerScore": [0.4],
            "trendingScore": [0.7],
            "fbtScore": [0.5],
            "similarScore": [0.6],
        }
    )
    pred1 = predict(model, df)
    pred2 = predict(model, df)
    assert abs(pred1[0] - pred2[0]) < 1e-6, "Predictions should be stable across runs"
