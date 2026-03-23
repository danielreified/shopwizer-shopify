"""
pipeline.py - Consolidated Amazon Training Pipeline

This is the ONE script to run the full training workflow:
1. Download Amazon sample data
2. Build user baskets (simulated purchase history)
3. Map Amazon categories → Your DB categories (via vector search)
4. Train Word2Vec model
5. Save to python/model/

Usage:
    python pipeline.py              # Full pipeline
    python pipeline.py --step map   # Only run mapping step
    python pipeline.py --step train # Only run training step
"""

import os
import sys
import argparse

# Add parent to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from download_samples import main as download_main
from build_baskets import main as build_main
from map_categories import main as map_main
from train_model import main as train_main


def run_pipeline(steps: list[str]):
    """Run specified steps of the pipeline."""
    
    print("=" * 50)
    print("CATEGORY EMBEDDINGS TRAINING PIPELINE")
    print("=" * 50)
    print()
    
    if "download" in steps:
        print("━" * 50)
        print("STEP 1: Download Amazon Samples")
        print("━" * 50)
        download_main()
        print()
    
    if "build" in steps:
        print("━" * 50)
        print("STEP 2: Build User Baskets")
        print("━" * 50)
        build_main()
        print()
    
    if "map" in steps:
        print("━" * 50)
        print("STEP 3: Map Categories (Vector Search)")
        print("━" * 50)
        map_main()
        print()
    
    if "train" in steps:
        print("━" * 50)
        print("STEP 4: Train Word2Vec Model")
        print("━" * 50)
        train_main()
        print()
    
    print("=" * 50)
    print("✅ PIPELINE COMPLETE")
    print("=" * 50)
    print()
    print("Model saved to: python/model/category2vec.model")
    print("Start server:   ./scripts/start.sh")


def main():
    parser = argparse.ArgumentParser(description="Category Embeddings Training Pipeline")
    parser.add_argument(
        "--step",
        choices=["download", "build", "map", "train", "all"],
        default="all",
        help="Which step to run (default: all)"
    )
    args = parser.parse_args()
    
    if args.step == "all":
        steps = ["download", "build", "map", "train"]
    else:
        steps = [args.step]
    
    run_pipeline(steps)


if __name__ == "__main__":
    main()
