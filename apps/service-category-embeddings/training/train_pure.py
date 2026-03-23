import sqlite3
import os
import argparse
from db_manager import DatabaseManager
from gensim.models import Word2Vec
from pathlib import Path

MODEL_DIR = Path(__file__).parent / "models"

def train_pure_model(vector_size=100, window=5, min_count=5):
    """
    Trains a model where each basket is restricted to a SINGLE domain
    and items are deduplicated. This ensures the model learns strong 
    intra-category relationships without being 'distracted' by cross-domain noise.
    """
    db = DatabaseManager()
    os.makedirs(MODEL_DIR, exist_ok=True)
    
    print(f"🚀 Training PURE Domain Model (Deduplicated)")
    
    # query to fetch ALL baskets, ordered by user AND domain
    sql = """
    SELECT user_id, source_domain, shopwise_id
    FROM raw_behavior rb
    JOIN asin_mapping am ON rb.asin = am.asin
    ORDER BY user_id, source_domain
    """
    
    print(f"   🔍 Fetching pure domain deduplicated baskets...")
    sentences = []
    
    current_key = None # (user_id, source_domain)
    current_basket = set() # Use a set for automatic deduplication
    
    with db.get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(sql)
        
        row_count = 0
        for user_id, domain, shopwise_id in cursor:
            row_count += 1
            if row_count % 500000 == 0:
                print(f"      Processed {row_count:,} rows...")
                
            key = (user_id, domain)
            
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

    print(f"   ✅ Retrieved {len(sentences):,} domain-pure deduplicated sentences.")
    
    if len(sentences) < 10:
        print("   ⚠️ Not enough data to train. Skipping.")
        return

    # 2. TRAIN WORD2VEC
    print(f"   🧠 Training Pure Word2Vec (size={vector_size}, window={window})...")
    model = Word2Vec(
        sentences=sentences,
        vector_size=vector_size,
        window=window,
        min_count=min_count,
        workers=4
    )
    
    # 3. SAVE MODEL
    model_path = MODEL_DIR / "category2vec_pure.model"
    model.save(str(model_path))
    print(f"   ✅ Model saved to: {model_path}")
    
    # Print some stats
    print(f"   📊 Vocabulary Size: {len(model.wv):,}")
    
    # Sanity Check
    try:
        sample_id = model.wv.index_to_key[0]
        similar = model.wv.most_similar(sample_id, topn=3)
        print(f"   🧪 Sanity Check: Most similar to {sample_id} in pure space: {similar}")
    except:
        pass

if __name__ == "__main__":
    train_pure_model()
