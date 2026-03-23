"""
Train Word2Vec on mapped category sentences.

Pipeline:
1. Load Amazon category sentences (e.g., ["Baby > Nursery", "Baby > Diapers"])
2. Load Mapping (e.g., "Baby > Nursery" -> "fu-1-2")
3. Translate sentences to YOUR Category IDs
4. Train Word2Vec
5. Save model
"""

import pickle
import json
import os
import sys
import logging
from gensim.models import Word2Vec

# Add parent dir to path for config import
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config.ml_config import W2V_PARAMS

# Configure logging
logging.basicConfig(format='%(asctime)s : %(levelname)s : %(message)s', level=logging.INFO)

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.join(script_dir, 'data')
    
    # 1. Load Data
    print("📥 Loading sentences and mapping...")
    json_path = os.path.join(data_dir, 'training_dataset.json')
    pkl_path = os.path.join(data_dir, 'category_sentences.pkl')
    map_path = os.path.join(data_dir, 'category_map.json')
    
    amazon_sentences = []
    if os.path.exists(json_path):
        print(f"   Reading {json_path}...")
        with open(json_path, 'r') as f:
            amazon_sentences = json.load(f)
    elif os.path.exists(pkl_path):
        print(f"   Reading {pkl_path}...")
        with open(pkl_path, 'rb') as f:
            amazon_sentences = pickle.load(f)
    
    mapping = {}
    if os.path.exists(map_path):
        with open(map_path, 'r') as f:
            mapping = json.load(f)
        
    print(f"   Loaded {len(amazon_sentences):,} sentences")
    print(f"   Loaded {len(mapping):,} mappings")
    
    # 2. Translate to Your IDs
    print("🔄 Translating sentences to YOUR Category IDs...")
    training_data = []
    mapped_count = 0
    
    for sentence in amazon_sentences:
        mapped_sentence = []
        for cat in sentence:
            # Must be in map AND have a valid UUID (not None)
            if cat in mapping and mapping[cat]:
                mapped_sentence.append(mapping[cat])
        
        # Only keep sentences with at least 2 categories (to learn context)
        if len(mapped_sentence) >= 2:
            training_data.append(mapped_sentence)
            mapped_count += len(mapped_sentence)
            
    print(f"✅ Created {len(training_data):,} mapped training sentences (Total Tokens: {mapped_count:,})")
    
    if not training_data:
        print("❌ No training data! Check mapping coverage.")
        return

    # 3. Train Word2Vec
    print("🏋️‍♀️ Training Word2Vec model...")
    # Parameters loaded from config/ml_config.py
    model = Word2Vec(
        sentences=training_data,
        **W2V_PARAMS
    )
    
    # 4. Save Model
    # Determine output path relative to script_dir's sibling 'python' folder
    parent_dir = os.path.dirname(script_dir)
    model_dir = os.path.join(parent_dir, 'python', 'model')
    os.makedirs(model_dir, exist_ok=True)
    
    model_path = os.path.join(model_dir, 'category2vec.model')
    model.save(model_path)
    print(f"🎉 Model saved to {model_path}")
    
    # 5. Sanity Check
    print("\n🧠 Model Sanity Check:")
    vocab = list(model.wv.index_to_key)
    print(f"   Vocab size: {len(vocab)}")
    
    # Load names for readability
    try:
        import psycopg
        from dotenv import load_dotenv
        
        # Try to load from python dir
        python_env = os.path.join(parent_dir, 'python', '.env')
        # Also try prisma env
        prisma_env_path = os.path.abspath(os.path.join(parent_dir, '../../packages/prisma/.env'))
        
        load_dotenv(python_env)
        load_dotenv(prisma_env_path)
        
        db_url = os.environ.get('DATABASE_URL')
        if db_url:
            conn = psycopg.connect(db_url)
            cur = conn.cursor()
            cur.execute('SELECT "id", "fullName" FROM "Category"')
            id_to_name = {row[0]: row[1] for row in cur}
            conn.close()
        else:
            print("   ⚠️ DATABASE_URL not found, skipping name lookup.")
            id_to_name = {}
            
    except Exception as e:
        print(f"   ⚠️ Could not load names from DB: {e}")
        id_to_name = {}

    def get_name(cid):
        return id_to_name.get(cid, cid)

    # Test distinct categories if they exist (Top frequent)
    # Get top 5 sorted by count (index order in wv is frequency-sorted!)
    top_cats = vocab[:5]
    
    for test_cat in top_cats:
        name = get_name(test_cat)
        print(f"\n   Top 5 similar to '{name}' ({test_cat}):")
        sims = model.wv.most_similar(test_cat, topn=5)
        for cat, score in sims:
            print(f"     - {get_name(cat)} ({cat}): {score:.4f}")

if __name__ == "__main__":
    main()
