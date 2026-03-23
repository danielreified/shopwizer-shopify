import json
import os
import glob
from pathlib import Path
from db_manager import DatabaseManager

DATA_DIR = Path(__file__).parent / "data"

def get_domain_from_filename(filename):
    """Derive root domain name from filename (e.g., meta_Baby.jsonl -> Baby Products)"""
    # Strip prefix (meta_ or reviews_) and extension
    if filename.startswith('meta_'):
        domain_slug = filename[5:].rsplit('.', 1)[0]
    elif filename.startswith('reviews_'):
        domain_slug = filename[8:].rsplit('.', 1)[0]
    else:
        domain_slug = filename.rsplit('.', 1)[0]
    
    # Map slugs to human readable domains if needed
    domain_map = {
        "Baby": "Baby & Toddler",
        "Clothing_Shoes_and_Jewelry": "Apparel & Accessories",
        "Beauty": "Health & Beauty",
        "Beauty_and_Personal_Care": "Health & Beauty",
        "Home": "Home & Garden",
        "Electronics": "Electronics",
        "Office_Products": "Office Supplies",
        "Pet_Supplies": "Animals & Pet Supplies",
        "Toys_and_Games": "Toys & Games",
        "Arts_Crafts_and_Sewing": "Arts & Entertainment",
        "Sports_and_Outdoors": "Sporting Goods",
        "Automotive": "Vehicles & Parts",
        "Tools_and_Home_Improvement": "Hardware",
        "Software": "Software",
        "Patio_Lawn_and_Garden": "Home & Garden",
        "Grocery_and_Gourmet_Food": "Food, Beverages & Tobacco",
        "Automotive": "Vehicles & Parts",
        "Industrial_and_Scientific": "Business & Industrial",
        "Books": "Media",
        "Health_and_Household": "Health & Beauty",
        "Handmade": "Arts & Entertainment"
    }
    return domain_map.get(domain_slug, domain_slug.replace("_", " "))

def ingest_all(filter_pattern=None):
    db = DatabaseManager()
    
    # 1. LOAD ALL METADATA (Deduplicated ASIN -> Category String)
    # We load this into memory first because we need to join it with reviews
    asin_to_cats = {}
    
    all_meta_files = glob.glob(str(DATA_DIR / "meta_*.jsonl"))
    if filter_pattern:
        meta_files = [f for f in all_meta_files if filter_pattern in f]
    else:
        meta_files = all_meta_files
    
    print(f"📦 Phase 1: Loading metadata from {len(meta_files)} files...")
    for meta_file in meta_files:
        filename = os.path.basename(meta_file)
        print(f"   Reading {filename}...")
        
        with open(meta_file, 'r') as f:
            for line in f:
                try:
                    data = json.loads(line)
                    asin = data.get("parent_asin") or data.get("asin")
                    cats = data.get("categories", [])
                    title = data.get("title", "")
                    
                    if asin and (cats or title):
                        # Join categories into a clean path string
                        asin_to_cats[asin] = (" > ".join(cats), title)
                except Exception as e:
                    if count < 10:
                        print(f"      ⚠️ JSON Error: {e}")
                    continue
    
    # DEBUG: Check first 5 items
    if asin_to_cats:
        print(f"   🧪 Metadata Sample:")
        sample_keys = list(asin_to_cats.keys())[:3]
        for k in sample_keys:
            print(f"      {k}: {asin_to_cats[k]}")
    else:
        print("   ❌ ERROR: No metadata was loaded. Check JSON structure.")

    print(f"   ✅ Total Loaded: {len(asin_to_cats):,} unique product mappings.")

    # 2. POPULATE PRODUCT METADATA TABLE
    print("\n📦 Phase 2: Updating product_metadata table...")
    with db.get_connection() as conn:
        cursor = conn.cursor()
        batch = []
        count = 0
        total = len(asin_to_cats)
        for asin, (cats, title) in asin_to_cats.items():
            batch.append((asin, title, cats))
            count += 1
            if len(batch) >= 5000:
                cursor.executemany("INSERT OR REPLACE INTO product_metadata (asin, title, amazon_categories) VALUES (?, ?, ?)", batch)
                conn.commit()
                batch = []
                print(f"   Progress: {count}/{total} ({(count/total)*100:.1f}%)")
        if batch:
            cursor.executemany("INSERT OR REPLACE INTO product_metadata (asin, title, amazon_categories) VALUES (?, ?, ?)", batch)
            conn.commit()

    # 3. STREAM REVIEWS & INGEST BEHAVIOR
    all_review_files = glob.glob(str(DATA_DIR / "reviews_*.jsonl"))
    if filter_pattern:
        review_files = [f for f in all_review_files if filter_pattern in f]
    else:
        review_files = all_review_files
        
    print(f"\n📦 Phase 3: Ingesting behavior from {len(review_files)} reviews files...")
    
    for review_file in review_files:
        filename = os.path.basename(review_file)
        
        if db.is_file_processed(filename):
            print(f"   ⏩ Skipping {filename} (Already processed)")
            continue
            
        domain = get_domain_from_filename(filename)
        print(f"   📥 Ingesting {filename} (Root: {domain})...")
        
        with open(review_file, 'r') as f:
            with db.get_connection() as conn:
                cursor = conn.cursor()
                batch = []
                count = 0
                
                # We use parent_asin if available, fallback to asin
                for line in f:
                    try:
                        data = json.loads(line)
                        user_id = data.get("user_id")
                        asin = data.get("parent_asin") or data.get("asin")
                        
                        if user_id and asin:
                            batch.append((user_id, asin, domain, filename))
                            count += 1
                            
                        if len(batch) >= 10000:
                            cursor.executemany("""
                                INSERT INTO raw_behavior (user_id, asin, source_domain, source_file)
                                VALUES (?, ?, ?, ?)
                            """, batch)
                            conn.commit()
                            batch = []
                            if count % 100000 == 0:
                                print(f"      Mapped {count:,} records...")
                    except:
                        continue
                        
                if batch:
                    cursor.executemany("""
                        INSERT INTO raw_behavior (user_id, asin, source_domain, source_file)
                        VALUES (?, ?, ?, ?)
                    """, batch)
                    conn.commit()
        
        db.mark_file_processed(filename)
        print(f"   ✅ Finished {filename}")

    print("\n🚀 Stage 1 Ingestion Complete!")

if __name__ == "__main__":
    import sys
    filter_pattern = sys.argv[1] if len(sys.argv) > 1 else None
    ingest_all(filter_pattern)
