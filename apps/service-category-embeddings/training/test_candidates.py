import json
import subprocess
import os

DB_URL = "postgresql://neondb_owner:npg_JpAfS8rK1YZC@ep-curly-frog-a4jqg3tk-pooler.us-east-1.aws.neon.tech/shopwizerdb?sslmode=require&channel_binding=require"

with open('data/test_embeddings.json', 'r') as f:
    embeddings = json.load(f)

tests = [
    {"name": "Running", "root": "aa", "amazon": "Clothing > Men > Shoes > Athletic > Running"},
    {"name": "Glass Bottles", "root": "bt", "amazon": "Baby > Feeding > Bottles > Glass"},
    {"name": "In-Ear Headphones", "root": "el", "amazon": "Electronics > Accessories > Headphones > In-Ear"},
    {"name": "Pots & Pans", "root": "hg", "amazon": "Home > Kitchen > Cookware > Pots & Pans"},
    {"name": "Dry Dog Food", "root": "ap", "amazon": "Pet Supplies > Dogs > Food > Dry"}
]

for t in tests:
    emb = embeddings[t['name']]
    vector_str = "[" + ",".join(map(str, emb)) + "]"
    
    sql = f"""
    SELECT id, name, array_length("pathIds", 1) as depth
    FROM "Category"
    WHERE "pathIds" @> ARRAY['{t['root']}']::text[]
    ORDER BY vector <=> '{vector_str}'::vector
    LIMIT 15;
    """
    
    print(f"\n--- {t['amazon']} ---")
    result = subprocess.run(["psql", DB_URL, "-t", "-c", sql], capture_output=True, text=True)
    if result.returncode == 0:
        print(result.stdout.strip())
    else:
        print(f"Error: {result.stderr}")
