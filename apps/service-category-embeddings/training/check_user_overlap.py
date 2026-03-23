import json
from collections import defaultdict
from pathlib import Path

DATA_DIR = Path('/Users/daniellourie/Projects/shopwise/platform/apps/service-category-embeddings/training/data')

def check_user_overlap():
    review_files = list(DATA_DIR.glob("reviews_*.jsonl"))
    user_to_categories = defaultdict(set)
    
    print(f"Scanning {len(review_files)} files for user overlap...")
    
    for rf in review_files:
        cat = rf.stem.replace("reviews_", "")
        with open(rf, 'r') as f:
            for i, line in enumerate(f):
                if i >= 10000: break # Small sample per file
                try:
                    data = json.loads(line)
                    user = data.get('user_id')
                    if user:
                        user_to_categories[user].add(cat)
                except:
                    pass
    
    overlap_users = {u: cats for u, cats in user_to_categories.items() if len(cats) > 1}
    
    print(f"Found {len(overlap_users)} users with overlapping categories.")
    for user, cats in list(overlap_users.items())[:5]:
        print(f"User {user}: {cats}")

if __name__ == "__main__":
    check_user_overlap()
