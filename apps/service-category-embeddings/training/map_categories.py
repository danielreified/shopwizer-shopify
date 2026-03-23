import sqlite3
import os
import json
import urllib.request
import subprocess
import time
import sys
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from db_manager import DatabaseManager
import threading
import logging

# Setup Logging to file and console
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.FileHandler("mapping.log"),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# OpenAI Configuration
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")
EMBEDDING_MODEL = "text-embedding-3-small"
JUDGE_MODEL = "gpt-4o-mini"

db_lock = threading.Lock()

DOMAIN_CONFIG = {
    "Apparel & Accessories": {"id": "aa"},
    "Animals & Pet Supplies": {"id": "ap"},
    "Baby & Toddler": {"id": "bt"},
    "Food, Beverages & Tobacco": {"id": "fb"},
    "Furniture": {"id": "fr"},
    "Health & Beauty": {"id": "hb"},
    "Home & Garden": {"id": "hg"},
    "Sporting Goods": {"id": "sg"},
    "Toys & Games": {"id": "tg"},
    "Vehicles & Parts": {"id": "vp"},
    "Business & Industrial": {"id": "bi"},
    "Mature": {"id": "ma"},
    "Media": {"id": "me"},
    "Office Supplies": {"id": "os"},
    "Electronics": {"id": "el"},
    "Software": {"id": "so"},
    "Hardware": {"id": "ha"},
    "Arts & Entertainment": {"id": "ae"},
    "Cameras & Optics": {"id": "co"},
    "Luggage & Bags": {"id": "lb"},
    "Religious & Ceremonial": {"id": "rc"}
}

class CategoryMapper:
    def __init__(self):
        self.db = DatabaseManager()
        self.db_url = os.environ.get("DATABASE_URL")

    def get_embedding(self, text):
        url = "https://api.openai.com/v1/embeddings"
        headers = {"Content-Type": "application/json", "Authorization": f"Bearer {OPENAI_API_KEY}"}
        data = {"input": text, "model": EMBEDDING_MODEL}
        req = urllib.request.Request(url, data=json.dumps(data).encode(), headers=headers)
        try:
            with urllib.request.urlopen(req) as response:
                result = json.loads(response.read().decode())
                return result["data"][0]["embedding"]
        except Exception as e:
            logger.error(f"Embedding error: {e}")
            return None

    def ai_judge(self, amazon_path, sample_title, candidates):
        url = "https://api.openai.com/v1/chat/completions"
        headers = {"Content-Type": "application/json", "Authorization": f"Bearer {OPENAI_API_KEY}"}
        candidate_str = "\n".join([f"- {c['id']}: {c['name']} (Path: {c['path']})" for c in candidates])
        
        prompt = f"""
Find the best Shopwise category match for this Amazon item.
Amazon Path: "{amazon_path}"
Example Product Title: "{sample_title}"

Goal: Find the most logical Shopwise category.
Candidates:
{candidate_str}

Instructions:
1. Respond ONLY with ID (e.g., 'fb-1-2').
2. If none fit reasonably well, respond 'NONE'.
"""
        data = {
            "model": JUDGE_MODEL,
            "messages": [
                {"role": "system", "content": "Taxonomy mapping assistant. Respond only with the ID."},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0
        }
        req = urllib.request.Request(url, data=json.dumps(data).encode(), headers=headers)
        try:
            with urllib.request.urlopen(req) as response:
                result = json.loads(response.read().decode())
                choice = result["choices"][0]["message"]["content"].strip()
                valid_ids = [c['id'] for c in candidates] + ['NONE']
                for vid in valid_ids:
                    if vid in choice: return vid, [c['name'] for c in candidates if c['id'] == vid][0] if vid != 'NONE' else None
                return None, None
        except Exception: return None, None

    def vector_search_global(self, embedding, top_k=25):
        if not self.db_url:
            logger.error("DATABASE_URL not set!")
            return []
        vector_str = "[" + ",".join(map(str, embedding)) + "]"
        sql = f"SELECT id, name, \"fullName\" as path FROM \"Category\" ORDER BY vector <=> '{vector_str}'::vector LIMIT {top_k};"
        try:
            result = subprocess.run(["psql", self.db_url, "-t", "-c", sql], capture_output=True, text=True)
            if result.returncode != 0:
                logger.error(f"psql error: {result.stderr}")
                return []
            if result.stdout.strip():
                candidates = []
                for line in result.stdout.strip().split('\n'):
                    parts = line.split('|')
                    if len(parts) >= 2:
                        candidates.append({
                            "id": parts[0].strip(),
                            "name": parts[1].strip(),
                            "path": parts[2].strip() if len(parts) > 2 else ""
                        })
                return candidates
            else:
                logger.warning("psql returned no results for vector search")
        except Exception as e:
            logger.error(f"Vector search exception: {e}")
        return []

    def process_item(self, path, sample_title):
        try:
            with db_lock:
                with self.db.get_connection() as conn:
                    cursor = conn.cursor()
                    cursor.execute("SELECT shopwise_id FROM category_mapping WHERE amazon_path = ?", (path,))
                    if cursor.fetchone(): 
                        return

            leaf = path.split(' > ')[-1]
            search_query = f"{leaf} {sample_title}"[:200]
            emb = self.get_embedding(search_query)
            if not emb:
                logger.error(f"Failed to get embedding for: {path}")
                return

            candidates = self.vector_search_global(emb, top_k=25)
            if not candidates:
                logger.error(f"No candidates found for: {path}")
                return

            winner_id, winner_name = self.ai_judge(path, sample_title, candidates)
            root_id = winner_id.split('-')[0] if (winner_id and winner_id != 'NONE') else "none"

            with db_lock:
                with self.db.get_connection() as conn:
                    cursor = conn.cursor()
                    if winner_id and winner_id != 'NONE':
                        cursor.execute("INSERT OR REPLACE INTO category_mapping (amazon_path, shopwise_id, root_id, confidence) VALUES (?, ?, ?, 1.0)", (path, winner_id, root_id))
                        logger.info(f"MATCH: {path} -> {winner_id} ({winner_name})")
                    else:
                        cursor.execute("INSERT OR REPLACE INTO category_mapping (amazon_path, shopwise_id, root_id, confidence) VALUES (?, NULL, 'none', 0.0)", (path,))
                        logger.info(f"REJECT: {path}")
                    conn.commit()
        except Exception as e:
            logger.error(f"Unexpected error in process_item: {e}")

    def map_domain_contextual(self, domain, workers=8):
        logger.info(f"Starting Domain: {domain}")
        with self.db.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT amazon_categories, MIN(title) 
                FROM product_metadata pm
                JOIN raw_behavior rb ON pm.asin = rb.asin
                WHERE rb.source_domain = ?
                GROUP BY amazon_categories
            """, (domain,))
            items = cursor.fetchall()
        
        logger.info(f"Mapping {len(items)} unique paths for {domain}...")
        with ThreadPoolExecutor(max_workers=workers) as executor:
            executor.map(lambda x: self.process_item(x[0], x[1]), items)

    def update_asin_mapping(self, domain):
        logger.info(f"Updating ASIN links for {domain} (Batching updates...)")
        with self.db.get_connection() as conn:
            cursor = conn.cursor()
            # Find all ASINs in this domain that need an update
            cursor.execute("""
                SELECT pm.asin, cm.shopwise_id, cm.root_id
                FROM product_metadata pm
                JOIN category_mapping cm ON pm.amazon_categories = cm.amazon_path
                JOIN raw_behavior rb ON pm.asin = rb.asin
                LEFT JOIN asin_mapping am ON pm.asin = am.asin
                WHERE rb.source_domain = ? 
                AND cm.shopwise_id IS NOT NULL 
                AND am.asin IS NULL
            """, (domain,))
            
            updates = cursor.fetchall()
            if not updates:
                logger.info(f"No new ASIN links for {domain}.")
                return

            logger.info(f"Applying {len(updates):,} ASIN mapping updates in batches of 20,000...")
            
            batch_size = 20000
            for i in range(0, len(updates), batch_size):
                batch = updates[i:i + batch_size]
                cursor.executemany("INSERT OR REPLACE INTO asin_mapping (asin, shopwise_id, root_id) VALUES (?, ?, ?)", batch)
                conn.commit()
                logger.info(f"   Progress: {i + len(batch):,}/{len(updates):,}")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--domain", type=str)
    parser.add_argument("--workers", type=int, default=10)
    args = parser.parse_args()
    mapper = CategoryMapper()
    domains = [args.domain] if args.domain else list(DOMAIN_CONFIG.keys())
    for d in domains:
        mapper.map_domain_contextual(d, workers=args.workers)
        mapper.update_asin_mapping(d)
    logger.info("FINISHED ALL DOMAINS")
