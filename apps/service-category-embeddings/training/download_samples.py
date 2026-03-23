"""
Download small samples of massive datasets to get category breadth.
Downloads the first 200,000 lines of Meta and Review files for key categories.
"""

import requests
import gzip
import os
import json
from pathlib import Path

DATA_DIR = Path(__file__).parent / "data"

# Tiered Data Strategy:
# - Tier 1 (200k): High variety/complexity (Apparel, Baby, Home)
# - Tier 2 (150k): High volume categories (Electronics, Health, Toys)
# - Tier 3 (100k): Niche/Specific categories (Pets, Sports, Hardware)
# - Tier 4 (50k):  Narrow/Low-variety categories (Software, Office, Media, etc.)
CATEGORIES = {
    "Clothing_Shoes_and_Jewelry": 200000,
    "Baby": 200000,
    "Home": 200000,
    "Patio_Lawn_and_Garden": 200000,
    "Electronics": 150000,
    "Health_and_Household": 150000,
    "Beauty_and_Personal_Care": 150000,
    "Toys_and_Games": 150000,
    "Pet_Supplies": 100000,
    "Sports_and_Outdoors": 100000,
    "Tools_and_Home_Improvement": 100000,
    "Automotive": 100000,
    "Software": 50000,
    "Office_Products": 50000,
    "Books": 50000,
    "Arts_Crafts_and_Sewing": 50000,
    "Grocery_and_Gourmet_Food": 50000,
    "Industrial_and_Scientific": 50000
}

BASE_URL = "https://mcauleylab.ucsd.edu/public_datasets/data/amazon_2023/raw"

def download_sample(url: str, output_path: Path, max_lines: int):
    """Stream download and save first N lines of a gzipped jsonl file."""
    if output_path.exists():
        # Check if length is sufficient
        with open(output_path, 'r') as f:
            lines = sum(1 for _ in f)
            if lines >= max_lines:
                print(f"✅ {output_path.name} already has {lines:,} lines. Skipping.")
                return
            else:
                print(f"🔄 {output_path.name} only has {lines:,}/{max_lines:,} lines. Re-downloading...")

    print(f"⬇️ Downloading sample from {url}...")
    
    try:
        with requests.get(url, stream=True) as r:
            r.raise_for_status()
            
            # We need to decompress the stream on the fly
            # But GzipFile needs a seekable file-like object usually, or we wrap raw stream
            # Simpler: Write the COMPRESSED stream to a temp file until we have enough bytes?
            # No, we want line count.
            
            # Alternative: Just download the first 100MB of the gz file, then gunzip it locally and take head.
            # This is robust against broken gzip streams (gzip can often recover partials).
            
            CHUNK_SIZE = 1024 * 1024 # 1MB
            MAX_BYTES = 500 * 1024 * 1024 # 500MB limit
            
            downloaded = 0
            temp_gz = output_path.with_suffix(".gz")
            
            with open(temp_gz, 'wb') as f:
                for chunk in r.iter_content(chunk_size=CHUNK_SIZE):
                    if chunk:
                        f.write(chunk)
                        downloaded += len(chunk)
                        if downloaded >= MAX_BYTES:
                            print(f"  🛑 Reached 500MB limit. Stopping download.")
                            break
            
            print(f"  📦 Saved partial GZ. Extracting first {max_lines} lines...")
            
            # Now unzip and take N lines
            line_count = 0
            with gzip.open(temp_gz, 'rt', encoding='utf-8', errors='ignore') as f_in:
                with open(output_path, 'w', encoding='utf-8') as f_out:
                    for line in f_in:
                        f_out.write(line)
                        line_count += 1
                        if line_count >= max_lines:
                            break
            
            # Cleanup temp gz
            os.remove(temp_gz)
            print(f"✅ Saved {line_count} lines to {output_path.name}")

    except Exception as e:
        print(f"❌ Error downloading {url}: {e}")

def main():
    os.makedirs(DATA_DIR, exist_ok=True)
    
    for cat, count in CATEGORIES.items():
        print(f"\n--- Processing {cat} (Target: {count:,}) ---")
        
        # Meta
        meta_url = f"{BASE_URL}/meta_categories/meta_{cat}.jsonl.gz"
        meta_out = DATA_DIR / f"meta_{cat}.jsonl" # Save as jsonl (unzipped)
        download_sample(meta_url, meta_out, count)
        
        # Reviews
        review_url = f"{BASE_URL}/review_categories/{cat}.jsonl.gz"
        review_out = DATA_DIR / f"reviews_{cat}.jsonl"
        download_sample(review_url, review_out, count)

if __name__ == "__main__":
    main()
