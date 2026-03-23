"""
Build category "baskets" from real user behavior.

Strategy:
1. Load reviews - group by user_id to find products same user bought
2. Load metadata - map parent_asin -> category path
3. For each user's "basket", create a category sentence
4. Train Word2Vec on these sentences

This captures REAL co-purchase patterns!
"""

import json
from collections import defaultdict
from typing import Dict, List, Set
import pickle
from pathlib import Path
import os
import sys

# Add parent dir to path for config import
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config.ml_config import DOMAIN_LIMITS, MAX_SENTENCES_PER_DOMAIN, MIN_BASKET_SIZE

DATA_DIR = Path(__file__).parent / "data"


def load_product_categories(meta_file: str) -> Dict[str, List[str]]:
    """Load parent_asin -> categories mapping from metadata file."""
    print(f"📥 Loading product categories from {meta_file}...")
    
    asin_to_categories = {}
    
    with open(DATA_DIR / meta_file) as f:
        for line in f:
            item = json.loads(line)
            parent_asin = item.get('parent_asin')
            categories = item.get('categories', [])
            
            if parent_asin and categories:
                # Categories is a list of category paths
                # e.g., ["Baby Products", "Baby Care", "Pacifiers, Teethers & Teething Relief", "Teethers"]
                asin_to_categories[parent_asin] = categories
    
    print(f"✅ Loaded {len(asin_to_categories):,} products with categories")
    return asin_to_categories


def build_user_baskets(review_file: str, domain: str, min_basket_size: int = MIN_BASKET_SIZE) -> Dict[str, List[str]]:
    """
    Read reviews and group ASINs by User.
    Uses DOMAIN_LIMITS to ensure balanced representation.
    """
    user_baskets = defaultdict(list)
    review_path = DATA_DIR / review_file
    
    # Determine limit
    limit = DOMAIN_LIMITS.get(domain, DOMAIN_LIMITS["default"])
    print(f"   Building baskets from {domain} (Limit: {limit:,})...")
    
    with open(review_path, 'r') as f:
        for i, line in enumerate(f):
            if i >= limit:
                break
            try:
                data = json.loads(line)
                user = data.get('user_id')
                # IMPORTANT: Use parent_asin to match metadata (not asin which is variant-specific)
                asin = data.get('parent_asin') or data.get('asin')
                
                if user and asin:
                    user_baskets[user].append(asin)
            except:
                pass
                
    # Filter small baskets
    baskets = []
    skipped = 0
    for user, items in user_baskets.items():
        unique_items = list(set(items))
        if len(unique_items) >= min_basket_size:
            baskets.append(unique_items)
        else:
            skipped += 1
            
    print(f"   ✅ {domain}: Found {len(baskets):,} baskets (read {i} lines)")
    return baskets



def create_category_sentences(
    baskets: List[List[str]], 
    asin_to_categories: Dict[str, List[str]],
    domain: str = "Baby Products"
) -> List[List[str]]:
    """Convert product baskets to category sentences for Word2Vec."""
    print(f"🔗 Creating category sentences (Domain: {domain})...")
    
    # Get sentence limit for this domain
    max_sentences = MAX_SENTENCES_PER_DOMAIN.get(domain, MAX_SENTENCES_PER_DOMAIN["default"])
    
    sentences = []
    
    for product_asins in baskets:
        # Get categories for all products in this basket
        basket_categories = []
        
        for asin in product_asins:
            if asin in asin_to_categories:
                cats = asin_to_categories[asin]
                if cats:
                    for cat_path in cats:
                        # Extract string path
                        if isinstance(cat_path, list):
                            path_str = " > ".join(cat_path)
                        else:
                            path_str = str(cat_path)
                        
                        # PREPEND DOMAIN IF MISSING
                        # Check partial match to avoid "Baby Products > Baby Products > ..."
                        if domain and domain not in path_str:
                            path_str = f"{domain} > {path_str}"
                            
                        basket_categories.append(path_str)
        
        # Only include if we have multiple categories (Word2Vec needs context)
        if len(basket_categories) >= 2:
            sentences.append(basket_categories)
            
            # Check if we've hit the limit
            if len(sentences) >= max_sentences:
                print(f"   📊 Hit max sentences limit ({max_sentences})")
                break
    
    print(f"✅ Created {len(sentences):,} training sentences")
    return sentences


def main():
    # Detect all meta files
    meta_files = list(DATA_DIR.glob("meta_*.jsonl"))
    global_user_items = defaultdict(list) # user_id -> List[(domain, asin)]
    master_asin_to_cats = {} # asin -> List[category_path] (namespaced)
    
    print(f"Found {len(meta_files)} category datasets to process.")
    
    for meta_path in meta_files:
        category_name = meta_path.stem.replace("meta_", "")
        review_path = DATA_DIR / f"reviews_{category_name}.jsonl"
        
        if not review_path.exists():
            print(f"⚠️ No reviews found for {category_name}, skipping.")
            continue
            
        print(f"\n🚀 Processing {category_name}...")
        
        # Determine Domain Context from filename
        domain = category_name.replace("_", " ")
        if domain == "Baby": domain = "Baby Products"
        
        # 1. Load product -> category mapping (Add to master with namespacing)
        asin_to_categories = load_product_categories(meta_path.name)
        for asin, cats in asin_to_categories.items():
            namespaced_cats = []
            for cat_path in cats:
                if isinstance(cat_path, list):
                    path_str = " > ".join(cat_path)
                else:
                    path_str = str(cat_path)
                
                # PREPEND DOMAIN IF MISSING
                if domain and domain not in path_str:
                    path_str = f"{domain} > {path_str}"
                namespaced_cats.append(path_str)
            
            master_asin_to_cats[asin] = namespaced_cats
        
        # 2. Build user baskets from reviews (Aggregate globally)
        limit = DOMAIN_LIMITS.get(domain, DOMAIN_LIMITS["default"])
        print(f"   Reading reviews from {category_name} (Limit: {limit:,})...")
        
        with open(review_path, 'r') as f:
            for i, line in enumerate(f):
                if i >= limit:
                    break
                try:
                    data = json.loads(line)
                    user = data.get('user_id')
                    asin = data.get('parent_asin') or data.get('asin')
                    if user and asin:
                        global_user_items[user].append(asin)
                except:
                    pass
        print(f"   ✅ Added items from {i} reviews to global user map.")

    # 3. Convert global user behavior to SILOED sentences
    print(f"\n🔗 Generating specialized sentences from {len(global_user_items):,} users...")
    all_sentences = []
    
    for user, asins in global_user_items.items():
        unique_asins = set(asins)
        if len(unique_asins) < 2:
            continue
            
        # Group by domain for siloing
        domain_baskets = defaultdict(list) # domain -> List[cat_paths]
        
        for asin in unique_asins:
            if asin in master_asin_to_cats:
                # master_asin_to_cats[asin] already contains namespaced paths: ["Domain > Path", ...]
                for cat_path in master_asin_to_cats[asin]:
                    domain = cat_path.split(" > ")[0]
                    domain_baskets[domain].append(cat_path)
        
        # Add a separate sentence for each domain silo
        for domain, cats in domain_baskets.items():
            if len(cats) >= 2:
                all_sentences.append(cats)

    print(f"\n🔗 Total Specialized Training Sentences: {len(all_sentences):,}")

    # 4. Save for training
    output_pkl = DATA_DIR / "category_sentences.pkl"
    with open(output_pkl, 'wb') as f:
        pickle.dump(all_sentences, f)
        
    output_json = DATA_DIR / "training_dataset.json"
    with open(output_json, 'w') as f:
        json.dump(all_sentences, f, indent=None)
        
    print(f"\n💾 Saved {len(all_sentences):,} sentences to:")
    print(f"   - {output_pkl}")
    print(f"   - {output_json} (✅ Consolidated Artifact)")
    
    return all_sentences


if __name__ == "__main__":
    main()
