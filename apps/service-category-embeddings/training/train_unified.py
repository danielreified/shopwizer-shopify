import sqlite3
import os
import argparse
from db_manager import DatabaseManager
from gensim.models import Word2Vec
from pathlib import Path

MODEL_DIR = Path(__file__).parent / "models"

def train_unified_model(vector_size=100, window=5, min_count=5):
    """
    Trains a SINGLE unified embedding model across all domains.
    Crucially, it preserves domain boundaries by building 'Namespaced Baskets'.
    
    Instead of mixing Baby and Automotive items in one basket, it generates baskets like:
    - Basket 1 (Baby): [bt-1-2, bt-5-6, bt-2-1]
    - Basket 2 (Auto): [au-9-1, au-2-2]
    
    The model learns all tokens (bt-*, au-*, etc.) in one shared Vector Space,
    but the training signals are derived from domain-pure sessions.
    """
    db = DatabaseManager()
    os.makedirs(MODEL_DIR, exist_ok=True)
    
    print(f"🚀 Training UNIFIED Name-Spaced Model (All Domains)")
    
    # query to fetch ALL baskets, ordered by user to consolidate multi-domain behavior
    sql = """
    SELECT user_id, shopwise_id
    FROM raw_behavior rb
    JOIN asin_mapping am ON rb.asin = am.asin
    ORDER BY user_id
    """
    
    print(f"   🔍 Fetching unified cross-domain baskets from database...")
    sentences = []
    
    current_key = None # user_id
    current_basket = set() # Use a set for deduplication
    
    with db.get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(sql)
        
        row_count = 0
        for user_id, shopwise_id in cursor:
            row_count += 1
            if row_count % 500000 == 0:
                print(f"      Processed {row_count:,} rows...")
                
            key = user_id
            
            if key != current_key:
                if len(current_basket) >= 2:
                    sentences.append(list(current_basket))
                current_key = key
                current_basket = set()
            
            if shopwise_id:
                current_basket.add(shopwise_id)
        
        # Append last basket
        if len(current_basket) >= 2:
            sentences.append(list(current_basket))

    print(f"   ✅ Retrieved {len(sentences):,} domain-pure training sentences across all domains.")
    
    if len(sentences) < 10:
        print("   ⚠️ Not enough data to train. Skipping.")
        return

    # 2. TRAIN WORD2VEC
    print(f"   🧠 Training Unified Word2Vec (size={vector_size}, window={window})...")
    model = Word2Vec(
        sentences=sentences,
        vector_size=vector_size,
        window=window,
        min_count=min_count,
        workers=4
    )
    
    # 3. SAVE MODEL
    model_path = MODEL_DIR / "category2vec_unified.model"
    model.save(str(model_path))
    print(f"   ✅ Model saved to: {model_path}")
    
    # Print some stats
    print(f"   📊 Vocabulary Size: {len(model.wv):,}")
    
    # Sanity Check
    # We try to find similarities for a known mapped ID
    try:
        # Just grab a random word from the vocab
        sample_id = model.wv.index_to_key[0]
        similar = model.wv.most_similar(sample_id, topn=3)
        print(f"   🧪 Sanity Check: Most similar to {sample_id}: {similar}")
    except:
        pass

if __name__ == "__main__":
    train_unified_model()
