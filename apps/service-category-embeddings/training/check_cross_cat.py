import json

def check_cross_category():
    with open('/Users/daniellourie/Projects/shopwise/platform/apps/service-category-embeddings/training/data/training_dataset.json', 'r') as f:
        data = json.load(f)
    
    print("Searching for diverse roots...")
    cross_cat_sessions = []
    for session in data:
        roots = set()
        for item in session:
            root = item.split(' > ')[0]
            # Ignore suspicious marketing roots for the filter
            if "Amazon" in root or "Join Prime" in root:
                continue
            roots.add(root)
        
        if len(roots) > 1:
            cross_cat_sessions.append((roots, session))
            if len(cross_cat_sessions) > 10:
                break
    
    for roots, session in cross_cat_sessions:
        print(f"Roots: {roots}")
        print(f"Sample items: {session[:5]}...")
        print("-" * 20)

if __name__ == "__main__":
    check_cross_category()
