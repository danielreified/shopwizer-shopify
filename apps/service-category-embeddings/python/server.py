"""
server.py - FastAPI inference server

Serves the trained Word2Vec model via REST API.
Provides similar category recommendations with human-readable names.

Usage:
    uvicorn server:app --reload
"""

import os
import sys
from typing import Optional
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from gensim.models import Word2Vec
import psycopg
from dotenv import load_dotenv

# Add parent dir to path for config import
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config.ml_config import API_DEFAULTS

load_dotenv()

MODEL_PATH = os.getenv("MODEL_PATH", "model/category2vec.model")
DATABASE_URL = os.getenv("DATABASE_URL")

# Initialize FastAPI
app = FastAPI(
    title="Category Embeddings Service",
    description="Word2Vec-based category similarity recommendations",
    version="1.0.0",
)

@app.get("/health")
def health_check():
    """Health check endpoint for load balancer."""
    return {"status": "ok"}

# Global model and category metadata cache
model: Optional[Word2Vec] = None
category_meta: dict[str, dict] = {}  # category_id -> {name, full_name, root_name}

TAXONOMY_TARGET_DEPTH: dict[str, int] = {
    # Depth 3: High functional density (Target specialized product types)
    "Apparel & Accessories": 3,
    "Animals & Pet Supplies": 3,
    "Baby & Toddler": 3,
    "Food, Beverages & Tobacco": 3,
    "Furniture": 3,
    "Health & Beauty": 3,
    "Home & Garden": 3,
    "Sporting Goods": 3,
    "Toys & Games": 3,
    "Vehicles & Parts": 3,
    "Business & Industrial": 3,
    "Mature": 3,
    "Media": 3,
    "Office Supplies": 3,
    "Services": 3,

    # Depth 2: High brand/identity importance (Target primary product categories)
    "Electronics": 2,
    "Software": 2,
    "Hardware": 2,
    "Arts & Entertainment": 2,
    "Cameras & Optics": 2,
    "Luggage & Bags": 2,
    "Religious & Ceremonial": 2,

    # Default fallback for any newly introduced or flat root categories
    "default": 3,
}


def load_model():
    """Load the trained model on startup."""
    global model
    
    if not os.path.exists(MODEL_PATH):
        print(f"❌ Model not found at {MODEL_PATH}")
        print("   Run train.py first")
        sys.exit(1)
    
    print(f"📥 Loading model from {MODEL_PATH}...")
    model = Word2Vec.load(MODEL_PATH)
    print(f"✅ Model loaded. Vocab size: {len(model.wv)}")


def load_category_names():
    """Load category names from database for enrichment."""
    global category_meta
    
    if not DATABASE_URL:
        print("⚠️ DATABASE_URL not set, category names will not be enriched")
        return
    
    try:
        print("📥 Loading category names from database...")
        conn = psycopg.connect(DATABASE_URL)
        cur = conn.cursor()
        
        cur.execute('SELECT "id", "name", "fullName" FROM "Category"')
        
        for cat_id, name, full_name in cur:
            root_name = None
            if full_name:
                root_name = full_name.split(" > ")[0]
            category_meta[cat_id] = {
                "name": name,
                "full_name": full_name,
                "root_name": root_name,
            }
        
        cur.close()
        conn.close()
        
        print(f"✅ Loaded {len(category_meta)} category names")
    except Exception as e:
        print(f"⚠️ Failed to load category names: {e}")


@app.on_event("startup")
async def startup():
    """Load model and category names on server startup."""
    load_model()
    load_category_names()


# =========================================
# Request/Response Models
# =========================================

class SimilarRequest(BaseModel):
    category_id: str
    top_n: int = API_DEFAULTS["top_n"]
    filter_categories: Optional[list[str]] = None


class SimilarMultiRequest(BaseModel):
    category_ids: list[str]
    top_n: int = API_DEFAULTS["top_n"]


class CategoryScore(BaseModel):
    category_id: str
    name: Optional[str] = None  # Human-readable name
    score: float


class SimilarResponse(BaseModel):
    categories: list[CategoryScore]


class HealthResponse(BaseModel):
    status: str
    vocab_size: int
    category_names_loaded: int


# =========================================
# Helper Functions
# =========================================

def enrich_with_name(cat_id: str, score: float) -> CategoryScore:
    """Create CategoryScore with name from cache."""
    meta = category_meta.get(cat_id, {})
    return CategoryScore(
        category_id=cat_id,
        name=meta.get("name"),
        score=round(score, 4)
    )


def truncate_category_id(cat_id: str, max_depth: int = 3) -> str:
    """Truncate category ids to a fixed depth (e.g., aa-1-17-2-5 -> aa-1-17)."""
    parts = cat_id.split("-")
    if len(parts) <= max_depth:
        return cat_id
    return "-".join(parts[:max_depth])


def target_depth_for_category(cat_id: str) -> int:
    """Determine target depth based on taxonomy root name."""
    meta = category_meta.get(cat_id, {})
    root_name = meta.get("root_name")
    if root_name and root_name in TAXONOMY_TARGET_DEPTH:
        return TAXONOMY_TARGET_DEPTH[root_name]
    return TAXONOMY_TARGET_DEPTH["default"]


def normalize_category_id(cat_id: str) -> str:
    """Truncate category id to its taxonomy-based target depth."""
    depth = target_depth_for_category(cat_id)
    return truncate_category_id(cat_id, depth)


# =========================================
# Endpoints
# =========================================

@app.get("/health", response_model=HealthResponse)
async def health():
    """Health check endpoint."""
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    return HealthResponse(
        status="ok",
        vocab_size=len(model.wv),
        category_names_loaded=len(category_meta),
    )


@app.post("/similar", response_model=SimilarResponse)
async def similar(request: SimilarRequest):
    """
    Get similar categories for a single category.
    
    - category_id: The input category to find similar categories for
    - top_n: Number of similar categories to return (default 10)
    - filter_categories: Optional list of categories to exclude from results
    
    Response includes human-readable category names.
    """
    # Log incoming request
    cat_name = category_meta.get(request.category_id, {}).get("name", "UNKNOWN")
    print(f"\n{'='*60}")
    print(f"📥 REQUEST: /similar")
    print(f"   category_id: {request.category_id}")
    print(f"   category_name: {cat_name}")
    print(f"   top_n: {request.top_n}")
    print(f"   filter_categories: {request.filter_categories}")
    
    if model is None:
        print(f"   ❌ Model not loaded!")
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    # Check if category exists in vocabulary
    if request.category_id not in model.wv:
        print(f"   ⚠️ Category NOT in vocab, returning empty")
        print(f"{'='*60}\n")
        return SimilarResponse(categories=[])
    
    try:
        # Get similar categories
        similar_cats = model.wv.most_similar(
            request.category_id,
            topn=request.top_n + len(request.filter_categories or []),
        )
        
        # Filter out excluded categories, truncate depth, de-duplicate, and enrich with names
        filter_set = {normalize_category_id(cid) for cid in (request.filter_categories or [])}
        filter_set.add(normalize_category_id(request.category_id))
        dedup: dict[str, float] = {}
        for cat_id, score in similar_cats:
            truncated = normalize_category_id(cat_id)
            if truncated in filter_set:
                continue
            if truncated not in dedup or score > dedup[truncated]:
                dedup[truncated] = score

        # Sort by score and take top N
        sorted_results = sorted(dedup.items(), key=lambda x: x[1], reverse=True)[: request.top_n]
        results = [enrich_with_name(cat_id, score) for cat_id, score in sorted_results]
        
        # Log response
        print(f"   ✅ Found {len(results)} similar categories:")
        for r in results[:5]:  # Show top 5
            print(f"      • {r.category_id}: {r.name} ({r.score:.2f})")
        if len(results) > 5:
            print(f"      ... and {len(results) - 5} more")
        print(f"{'='*60}\n")
        
        return SimilarResponse(categories=results)
    
    except Exception as e:
        # Return empty on any error
        print(f"   ❌ Error: {e}")
        print(f"{'='*60}\n")
        return SimilarResponse(categories=[])


@app.post("/similar-multi", response_model=SimilarResponse)
async def similar_multi(request: SimilarMultiRequest):
    """
    Get similar categories for multiple input categories.
    
    Combines the embeddings of all input categories and finds
    categories most similar to the combined vector.
    
    Use case: "What categories go with this cart?"
    
    - category_ids: List of input categories
    - top_n: Number of similar categories to return (default 10)
    
    Response includes human-readable category names.
    """
    # Log incoming request
    print(f"\n{'='*60}")
    print(f"📥 REQUEST: /similar-multi")
    print(f"   category_ids: {request.category_ids}")
    print(f"   top_n: {request.top_n}")
    
    if model is None:
        print(f"   ❌ Model not loaded!")
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    # Filter to categories that exist in vocabulary
    valid_ids = [cid for cid in request.category_ids if cid in model.wv]
    invalid_ids = [cid for cid in request.category_ids if cid not in model.wv]
    
    print(f"   valid_ids: {valid_ids}")
    if invalid_ids:
        print(f"   ⚠️ invalid_ids (not in vocab): {invalid_ids}")
    
    if not valid_ids:
        print(f"   ⚠️ No valid categories, returning empty")
        print(f"{'='*60}\n")
        return SimilarResponse(categories=[])
    
    try:
        # Get similar categories using positive list
        # This finds categories similar to all input categories
        similar_cats = model.wv.most_similar(
            positive=valid_ids,
            topn=request.top_n + len(valid_ids),  # Extra to account for filtering
        )
        
        print(f"   raw similar_cats count: {len(similar_cats)}")
        
        # Filter out input categories, truncate depth, de-duplicate, and enrich with names
        input_set = {normalize_category_id(cid) for cid in request.category_ids}
        dedup: dict[str, float] = {}
        for cat_id, score in similar_cats:
            truncated = normalize_category_id(cat_id)
            if truncated in input_set:
                continue
            if truncated not in dedup or score > dedup[truncated]:
                dedup[truncated] = score

        # Sort by score and take top N
        sorted_results = sorted(dedup.items(), key=lambda x: x[1], reverse=True)[: request.top_n]
        results = [enrich_with_name(cat_id, score) for cat_id, score in sorted_results]
        
        # Log response
        print(f"   ✅ Returning {len(results)} similar categories:")
        for r in results[:5]:  # Show top 5
            print(f"      • {r.category_id}: {r.name} ({r.score:.2f})")
        if len(results) > 5:
            print(f"      ... and {len(results) - 5} more")
        print(f"{'='*60}\n")
        
        return SimilarResponse(categories=results)
    
    except Exception as e:
        print(f"   ❌ Error in similar-multi: {e}")
        print(f"{'='*60}\n")
        return SimilarResponse(categories=[])


# =========================================
# Dev server
# =========================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
