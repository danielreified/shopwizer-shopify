import sqlite3
import os
import argparse
from db_manager import DatabaseManager
from gensim.models import Word2Vec
from pathlib import Path

MODEL_DIR = Path(__file__).parent / "models"

def train_domain_model(domain_name, vector_size=100, window=5, min_count=5):
    db = DatabaseManager()
    os.makedirs(MODEL_DIR, exist_ok=True)
    
    print(f"🚀 Training specialized model for domain: {domain_name}")
    
    # 1. FETCH SILOED BASKETS FROM SQLITE
    # We group by user_id and only include items that map to the target root
    # This ensures 100% domain purity
    sql = """
    SELECT user_id, shopwise_id
    FROM raw_behavior rb
    JOIN asin_mapping am ON rb.asin = am.asin
    WHERE rb.source_domain = ?
    ORDER BY user_id
    """
    
    print(f"   🔍 Fetching pure baskets from database...")
    sentences = []
    current_user = None
    current_basket = []
    
    with db.get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(sql, (domain_name,))
        
        for user_id, shopwise_id in cursor:
            if user_id != current_user:
                if len(current_basket) >= 2:
                    sentences.append(current_basket)
                current_user = user_id
                current_basket = []
            
            if shopwise_id:
                current_basket.append(shopwise_id)
        
        # Append last basket
        if len(current_basket) >= 2:
            sentences.append(current_basket)

    print(f"   ✅ Retrieved {len(sentences):,} domain-pure training sentences.")
    
    if len(sentences) < 10:
        print("   ⚠️ Not enough data to train. Skipping.")
        return

    # 2. TRAIN WORD2VEC
    print(f"   🧠 Training Word2Vec (size={vector_size}, window={window})...")
    model = Word2Vec(
        sentences=sentences,
        vector_size=vector_size,
        window=window,
        min_count=min_count,
        workers=4
    )
    
    # 3. SAVE MODEL
    model_path = MODEL_DIR / f"{domain_name.replace(' ', '_').lower()}_embeddings.model"
    model.save(str(model_path))
    print(f"   ✅ Model saved to: {model_path}")
    
    # Print some stats
    print(f"   📊 Vocabulary Size: {len(model.wv):,}")
    
    # Sanity check: Most similar for first few items
    try:
        sample_id = sentences[0][0]
        similar = model.wv.most_similar(sample_id, topn=3)
        print(f"   🧪 Sanity Check: Most similar to {sample_id}: {similar}")
    except:
        pass

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train specialized domain embeddings.")
    parser.add_argument("--domain", type=str, required=True, help="Amazon domain name (e.g. 'Baby Products')")
    parser.add_argument("--size", type=int, default=100, help="Vector size")
    parser.add_argument("--window", type=int, default=5, help="Window size")
    
    args = parser.parse_args()
    
    train_domain_model(args.domain, vector_size=args.size, window=args.window)
