import os
import sys

# Add parent dir to path for config import
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config.ranker_config import INFRA_CONFIG

from fastapi import FastAPI
from pydantic import BaseModel
import pandas as pd
import xgboost as xgb

MODEL_PATH = INFRA_CONFIG["MODEL_PATH"]

app = FastAPI(title="Shopwise Re-Ranker API", version="1.0.0")


# ---------------------------------------------------------
# ✅ Load model once at startup
# ---------------------------------------------------------
@app.on_event("startup")
def load_model():
    global model
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(f"Model not found at {MODEL_PATH}")
    model = xgb.XGBRegressor()
    model.load_model(MODEL_PATH)
    print("✅ Model loaded and ready for inference.")


# ---------------------------------------------------------
# 🧩 Define request/response schemas
# ---------------------------------------------------------
class ProductFeatures(BaseModel):
    views24h: int
    views7d: int
    clicks24h: int
    clicks7d: int
    orders7d: int
    orders30d: int
    revenue7d: float
    revenue30d: float
    bestSellerScore: float
    trendingScore: float
    fbtScore: float
    similarScore: float


class RankResponse(BaseModel):
    ranked_products: list


# ---------------------------------------------------------
# 🩺 Health endpoint
# ---------------------------------------------------------
@app.get("/health")
def health_check():
    return {"status": "ok", "model_loaded": os.path.exists(MODEL_PATH)}


# ---------------------------------------------------------
# 🧠 Ranking endpoint
# ---------------------------------------------------------
@app.post("/rank", response_model=RankResponse)
def rank_products(products: list[ProductFeatures]):
    df = pd.DataFrame([p.dict() for p in products])
    preds = model.predict(df)
    df["prediction"] = preds
    ranked = df.sort_values("prediction", ascending=False).reset_index(drop=True)
    return {"ranked_products": ranked.to_dict(orient="records")}
