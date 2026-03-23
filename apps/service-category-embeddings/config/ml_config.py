"""
ml_config.py - Centralized ML Configuration for Category Embeddings Service

This file contains hyperparameters, data pipeline limits, and validation thresholds.
Environment-specific variables (DB URLs, Ports) remain in .env.
"""

# ============================================================
# 1. Word2Vec Model Hyperparameters
# ============================================================
W2V_PARAMS = {
    "vector_size": 32,    # Embedding dimension
    "window": 10,         # Context window (basket size)
    "min_count": 5,       # Minimum occurrences to be embedded
    "sg": 1,              # 1 = Skip-gram (better for infrequent items), 0 = CBOW
    "workers": 4,         # Parallel threads
    "epochs": 50,         # Training iterations
}

# ============================================================
# 2. Data Pipeline & Merchandising Limits
# ============================================================
MIN_BASKET_SIZE = 2  # Minimum items in a user session to form a training sentence

# Sampling limits per domain to ensure balanced representation
DOMAIN_LIMITS = {
    "Baby": 10000,
    "Clothing Shoes and Jewelry": 50000,
    "Home": 50000,
    "Beauty and Personal Care": 50000,
    "Electronics": 50000,
    "Sports and Outdoors": 50000,
    "Toys and Games": 50000,
    "Pet Supplies": 25000,
    "Office Products": 50000,
    "Arts Crafts and Sewing": 50000,
    "default": 50000
}

# Maximum training sentences per domain to prevent algorithm bias
MAX_SENTENCES_PER_DOMAIN = {
    "Baby Products": 1500,
    "Clothing Shoes and Jewelry": 3000,
    "Home": 3000,
    "Beauty and Personal Care": 3000,
    "Electronics": 3000,
    "Sports and Outdoors": 3000,
    "Toys and Games": 3000,
    "Pet Supplies": 2500,
    "Office Products": 3000,
    "Arts Crafts and Sewing": 3000,
    "default": 3000
}

# ============================================================
# 3. Validation Thresholds
# ============================================================
VALIDATION = {
    "min_vocab_size": 50,
    "min_vocab_size_test": 5,
    "min_score_spread": 0.1,  # Minimum range between top/bottom similarity scores
}

# ============================================================
# 4. API Defaults
# ============================================================
API_DEFAULTS = {
    "top_n": 10,
}
