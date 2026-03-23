# service-ranker/train/train_xgboost.py
"""
Train XGBoost ranker model using click data.

Features:
- Position features (position, position_normalized, slate_size)
- Item engagement features (views30d, clicks30d, carts30d, orders30d, revenue30d)
- Context features (price_delta, same_category)
- Source features (src_price, src_views30d, src_clicks30d)

Usage:
    python train/train_xgboost.py --input train/training_data.csv
"""

import argparse
import os
import sys
import pandas as pd
import xgboost as xgb
import numpy as np
from sklearn.model_selection import train_test_split, GroupShuffleSplit
from sklearn.metrics import roc_auc_score, precision_score, recall_score

# Add parent dir to path for config import
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config.ranker_config import INFRA_CONFIG, MODEL_CONFIG, TRAINING_PARAMS

# Feature and Metadata columns loaded from config/ranker_config.py
FEATURE_COLUMNS = MODEL_CONFIG["FEATURE_COLUMNS"]
METADATA_COLUMNS = MODEL_CONFIG["METADATA_COLUMNS"]
TRAINING_DATA_PATH = INFRA_CONFIG["TRAINING_DATA_PATH"]
MODEL_PATH = INFRA_CONFIG["MODEL_PATH"]



def load_data(input_path: str) -> pd.DataFrame:
    """Load and validate training data."""
    print(f"📂 Loading data from {input_path}...")
    
    df = pd.read_csv(input_path)
    print(f"   Loaded {len(df)} rows")
    
    # Check required columns
    missing = [col for col in FEATURE_COLUMNS + ["label"] if col not in df.columns]
    if missing:
        raise ValueError(f"Missing required columns: {missing}")
    
    # Fill NaN values with 0
    for col in FEATURE_COLUMNS:
        if df[col].isnull().any():
            print(f"   ⚠️ Filling NaN in {col} with 0")
            df[col] = df[col].fillna(0)
    
    return df


def train_model(df: pd.DataFrame, test_size: float = 0.2) -> xgb.XGBClassifier:
    """Train XGBoost classifier on click data."""
    
    X = df[FEATURE_COLUMNS]
    y = df["label"]
    
    # Use GroupShuffleSplit to keep slates together
    # (all items from a slate should be in train or test, not split)
    if "slate_id" in df.columns:
        print("📊 Splitting by slate_id to prevent data leakage...")
        gss = GroupShuffleSplit(n_splits=1, test_size=test_size, random_state=42)
        train_idx, test_idx = next(gss.split(X, y, groups=df["slate_id"]))
        X_train, X_test = X.iloc[train_idx], X.iloc[test_idx]
        y_train, y_test = y.iloc[train_idx], y.iloc[test_idx]
    else:
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=42, stratify=y
        )
    
    print(f"📊 Training set: {len(X_train)}, Test set: {len(X_test)}")
    print(f"   Train positive rate: {y_train.mean():.2%}")
    print(f"   Test positive rate: {y_test.mean():.2%}")
    
    # Calculate scale_pos_weight for imbalanced data
    neg_count = len(y_train[y_train == 0])
    pos_count = len(y_train[y_train == 1])
    scale_pos_weight = neg_count / pos_count if pos_count > 0 else 1
    print(f"   Scale pos weight: {scale_pos_weight:.2f}")
    
    # Initialize model using TRAINING_PARAMS
    params = TRAINING_PARAMS.copy()
    if params["scale_pos_weight"] == "auto":
        params["scale_pos_weight"] = scale_pos_weight
    
    model = xgb.XGBClassifier(**params)

    
    # Train
    print("\n🧠 Training XGBoost model...")
    model.fit(
        X_train, y_train,
        eval_set=[(X_train, y_train), (X_test, y_test)],
        verbose=True,
    )
    
    # Evaluate
    print("\n📈 Evaluation:")
    
    y_pred_proba = model.predict_proba(X_test)[:, 1]
    y_pred = model.predict(X_test)
    
    auc = roc_auc_score(y_test, y_pred_proba)
    precision = precision_score(y_test, y_pred, zero_division=0)
    recall = recall_score(y_test, y_pred, zero_division=0)
    
    print(f"   AUC: {auc:.4f}")
    print(f"   Precision: {precision:.4f}")
    print(f"   Recall: {recall:.4f}")
    
    # Feature importance
    print("\n🔍 Feature Importance (top 10):")
    importance = pd.DataFrame({
        "feature": FEATURE_COLUMNS,
        "importance": model.feature_importances_,
    }).sort_values("importance", ascending=False)
    
    for _, row in importance.head(10).iterrows():
        print(f"   {row['feature']}: {row['importance']:.4f}")
    
    return model


def save_model(model: xgb.XGBClassifier, output_path: str):
    """Save trained model."""
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    model.save_model(output_path)
    print(f"\n💾 Model saved to {output_path}")


def main():
    parser = argparse.ArgumentParser(description="Train XGBoost ranker model")
    parser.add_argument("--input", type=str, default=TRAINING_DATA_PATH, help="Input training data CSV")
    parser.add_argument("--output", type=str, default=MODEL_PATH, help="Output model path")
    parser.add_argument("--test-size", type=float, default=0.2, help="Test set fraction")
    args = parser.parse_args()
    
    print("🚀 Starting model training...")
    
    # Load data
    df = load_data(args.input)
    
    # Train model
    model = train_model(df, test_size=args.test_size)
    
    # Save model
    save_model(model, args.output)
    
    print("\n✅ Training complete!")


if __name__ == "__main__":
    main()
