# service-ranker/inference/inference_xgboost.py
"""
Inference module for XGBoost ranker model.

Given a list of candidate products with their features, returns ranking scores
that can be used to reorder recommendations.

Usage:
    from inference.inference_xgboost import Ranker
    
    ranker = Ranker()
    scores = ranker.score(candidates, source_context)
"""

import os
import sys
import pandas as pd
import xgboost as xgb
import numpy as np
from typing import Optional

# Add parent dir to path for config import
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config.ranker_config import INFRA_CONFIG, MODEL_CONFIG

MODEL_PATH = INFRA_CONFIG["MODEL_PATH"]
FEATURE_COLUMNS = MODEL_CONFIG["FEATURE_COLUMNS"]



class Ranker:
    """XGBoost-based recommendation ranker."""
    
    def __init__(self, model_path: str = MODEL_PATH):
        self.model_path = model_path
        self.model: Optional[xgb.XGBClassifier] = None
        self._load_model()
    
    def _load_model(self):
        """Load the trained model."""
        if not os.path.exists(self.model_path):
            print(f"⚠️ Model not found at {self.model_path}, using fallback scoring")
            return
        
        self.model = xgb.XGBClassifier()
        self.model.load_model(self.model_path)
        print(f"✅ Loaded ranker model from {self.model_path}")
    
    def score(
        self,
        candidates: list[dict],
        source: dict,
    ) -> list[float]:
        """
        Score candidate products for ranking.
        
        Args:
            candidates: List of candidate dicts with keys:
                - position (int): Current position in slate (1-indexed)
                - price (float): Product price in USD
                - categoryId (str): Product category
                - views30d (int): View count last 30 days
                - clicks30d (int): Click count last 30 days
                - carts30d (int): Add-to-cart count last 30 days
                - orders30d (int): Order count last 30 days
                - revenue30d (float): Revenue last 30 days
            
            source: Source product context dict with keys:
                - price (float): Source product price
                - categoryId (str): Source product category
                - views30d (int): Source view count
                - clicks30d (int): Source click count
        
        Returns:
            List of scores (higher = more likely to be clicked)
        """
        if not candidates:
            return []
        
        # If no model, return uniform scores
        if self.model is None:
            return [1.0] * len(candidates)
        
        slate_size = len(candidates)
        src_price = source.get("price", 0) or 0
        src_category = source.get("categoryId", "")
        src_views = source.get("views30d", 0) or 0
        src_clicks = source.get("clicks30d", 0) or 0
        
        # Build feature DataFrame
        rows = []
        for i, c in enumerate(candidates, 1):
            price = c.get("price", 0) or 0
            category = c.get("categoryId", "")
            
            row = {
                # Position features
                "position": i,
                "position_normalized": i / slate_size,
                "slate_size": slate_size,
                
                # Item features
                "price": price,
                "views30d": c.get("views30d", 0) or 0,
                "clicks30d": c.get("clicks30d", 0) or 0,
                "carts30d": c.get("carts30d", 0) or 0,
                "orders30d": c.get("orders30d", 0) or 0,
                "revenue30d": c.get("revenue30d", 0) or 0,
                
                # Context features
                "price_delta": price - src_price,
                "same_category": 1 if category == src_category else 0,
                
                # Source features
                "src_price": src_price,
                "src_views30d": src_views,
                "src_clicks30d": src_clicks,
            }
            rows.append(row)
        
        df = pd.DataFrame(rows)[FEATURE_COLUMNS]
        
        # Get click probabilities as scores
        scores = self.model.predict_proba(df)[:, 1].tolist()
        
        return scores
    
    def rerank(
        self,
        candidates: list[dict],
        source: dict,
        top_k: Optional[int] = None,
    ) -> list[dict]:
        """
        Rerank candidates by predicted click probability.
        
        Args:
            candidates: List of candidate product dicts
            source: Source product context
            top_k: Optional limit on returned candidates
        
        Returns:
            Reranked list of candidates (highest score first)
        """
        scores = self.score(candidates, source)
        
        # Sort by score descending
        ranked = sorted(
            zip(candidates, scores),
            key=lambda x: x[1],
            reverse=True,
        )
        
        result = [c for c, _ in ranked]
        
        if top_k:
            result = result[:top_k]
        
        return result


# Global instance for easy import
_ranker: Optional[Ranker] = None


def get_ranker() -> Ranker:
    """Get or create the global ranker instance."""
    global _ranker
    if _ranker is None:
        _ranker = Ranker()
    return _ranker


def score(candidates: list[dict], source: dict) -> list[float]:
    """Score candidates using the global ranker."""
    return get_ranker().score(candidates, source)


def rerank(candidates: list[dict], source: dict, top_k: Optional[int] = None) -> list[dict]:
    """Rerank candidates using the global ranker."""
    return get_ranker().rerank(candidates, source, top_k)


if __name__ == "__main__":
    # Demo
    print("🚀 Running inference demo...")
    
    ranker = Ranker()
    
    # Example candidates
    candidates = [
        {"price": 699, "categoryId": "aa-1-10", "views30d": 100, "clicks30d": 10, "carts30d": 5, "orders30d": 2, "revenue30d": 1400},
        {"price": 499, "categoryId": "aa-1-10", "views30d": 50, "clicks30d": 5, "carts30d": 2, "orders30d": 1, "revenue30d": 499},
        {"price": 899, "categoryId": "aa-1-14", "views30d": 200, "clicks30d": 30, "carts30d": 15, "orders30d": 8, "revenue30d": 7200},
    ]
    
    source = {
        "price": 599,
        "categoryId": "aa-1-10",
        "views30d": 150,
        "clicks30d": 20,
    }
    
    print("\n📊 Candidates:")
    for i, c in enumerate(candidates, 1):
        print(f"   {i}. ${c['price']} - {c['categoryId']} - {c['views30d']} views")
    
    scores = ranker.score(candidates, source)
    print("\n🎯 Scores:")
    for i, s in enumerate(scores, 1):
        print(f"   Position {i}: {s:.4f}")
    
    reranked = ranker.rerank(candidates, source)
    print("\n🏆 Reranked:")
    for i, c in enumerate(reranked, 1):
        print(f"   {i}. ${c['price']} - {c['categoryId']}")
