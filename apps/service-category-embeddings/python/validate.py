"""
validate.py - Post-training model validation

Validates the trained Word2Vec model before using in production.
Runs sanity checks and shows sample queries.

Exit codes:
- 0 = PASS
- 1 = FAIL
"""

import os
import sys
import argparse
from gensim.models import Word2Vec

# Add parent dir to path for config import
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config.ml_config import VALIDATION

MODEL_PATH = "model/category2vec.model"
# Thresholds loaded from config/ml_config.py
MIN_VOCAB_SIZE = VALIDATION["min_vocab_size"]


def load_model():
    """Load the trained model."""
    if not os.path.exists(MODEL_PATH):
        return None
    return Word2Vec.load(MODEL_PATH)


def run_sanity_checks(model):
    """Run sanity checks on the model."""
    checks = []
    
    # Check 1: Model loads
    checks.append(("Model loads successfully", True))
    
    # Check 2: Vocab size
    vocab_size = len(model.wv)
    vocab_ok = vocab_size >= MIN_VOCAB_SIZE
    checks.append((f"Vocab size ({vocab_size}) >= minimum ({MIN_VOCAB_SIZE})", vocab_ok))
    
    # Check 3: Similarity scores have spread
    # Sample a few categories and check similarity range
    vocab = list(model.wv.key_to_index.keys())
    if len(vocab) >= 2:
        sample = vocab[:min(10, len(vocab))]
        all_scores = []
        for cat in sample:
            try:
                similar = model.wv.most_similar(cat, topn=5)
                all_scores.extend([s for _, s in similar])
            except:
                pass
        
        if all_scores:
            min_score = min(all_scores)
            max_score = max(all_scores)
            spread = max_score - min_score
            spread_ok = spread > VALIDATION["min_score_spread"]
            checks.append((f"Similarity scores have good spread ({min_score:.2f} - {max_score:.2f})", spread_ok))
        else:
            checks.append(("Similarity scores available", False))
    else:
        checks.append(("Enough categories for similarity", False))
    
    return checks


def show_sample_queries(model, n_samples=3):
    """Show sample similarity queries."""
    vocab = list(model.wv.key_to_index.keys())
    
    # Pick interesting samples (not just random)
    samples = vocab[:min(n_samples, len(vocab))]
    
    for cat_id in samples:
        print(f'"{cat_id}" →')
        try:
            similar = model.wv.most_similar(cat_id, topn=3)
            for i, (sim_id, score) in enumerate(similar, 1):
                print(f"   {i}. {sim_id} - {score:.2f}")
        except KeyError:
            print("   (not in vocabulary)")
        print()


def main():
    global MIN_VOCAB_SIZE
    
    parser = argparse.ArgumentParser(description="Validate trained model")
    parser.add_argument("--test", action="store_true", help="Test mode: lower thresholds")
    args = parser.parse_args()
    
    if args.test:
        MIN_VOCAB_SIZE = VALIDATION["min_vocab_size_test"]
    
    print("=" * 45)
    print("MODEL VALIDATION" + (" (test mode)" if args.test else ""))
    print("=" * 45)
    print()
    
    # Load model
    model = load_model()
    
    if model is None:
        print(f"❌ Model not found at {MODEL_PATH}")
        print("   Run train.py first")
        sys.exit(1)
    
    print(f"Model: {MODEL_PATH}")
    print(f"Vocab size: {len(model.wv)} categories")
    print()
    
    # Sanity checks
    print("SANITY CHECKS")
    print("-" * 40)
    
    checks = run_sanity_checks(model)
    all_passed = True
    
    for check_name, passed in checks:
        symbol = "✓" if passed else "✗"
        print(f"{symbol} {check_name}")
        if not passed:
            all_passed = False
    
    print()
    
    # Sample queries
    print("SAMPLE QUERIES")
    print("-" * 40)
    show_sample_queries(model)
    
    # Final result
    if all_passed:
        print("RESULT: PASS ✓")
        sys.exit(0)
    else:
        print("RESULT: FAIL ✗")
        sys.exit(1)


if __name__ == "__main__":
    main()
