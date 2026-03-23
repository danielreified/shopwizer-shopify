# 🏗️ Decoupled SQL-First Pipeline & Unified Embeddings

This document outlines the final architecture for generating Shopwise's behavior-based category embeddings.

## 1. Architecture Overview

We have moved away from complex, memory-heavy scripts to a robust **SQL-First Pipeline** that leverages a local SQLite database as the "Master State" before touching production.

### The Pipeline Stages

1.  **Stage 1: Ingestion (High-Speed Sink)**
    - **Script**: `ingest_data.py`
    - **Action**: Reads raw Amazon JSONL files (Metadata + Reviews).
    - **Storage**: Writes to local SQLite `training_state.db`.
    - **Stats**: Capable of ingesting ~100k records/sec.

2.  **Stage 2: High-Precision Mapping (The "Bridge")**
    - **Script**: `map_categories.py`
    - **Action**:
      1.  Reads unique Amazon paths from SQLite.
      2.  Generates embeddings via **OpenAI** (`text-embedding-3-small`).
      3.  Performs **Read-Only Vector Search** on Production Neon DB to find Shopwise UUIDs.
      4.  Writes mappings back to SQLite.
    - **Safety**: Strictly namespaced (e.g., Baby Products only map to `bt-*` nodes).

3.  **Stage 3: Unified Training (The "Brain")**
    - **Script**: `train_unified.py`
    - **Action**:
      1.  Fetches "Namespaced Baskets" from SQLite (e.g., `[bt-1, bt-2]`).
      2.  Trains a **Single Unified Word2Vec Model** (`category2vec_unified.model`).
    - **Result**: A single model file containing embeddings for all domains (Baby, Home, Apparel, etc.), maintaining domain purity while sharing a vector space.

---

## 2. 🌙 The "Run Book" (How to Execute)

Use these commands to run the full pipeline or process specific domains.

### A. Run Full Pipeline (Overnight Job)

Processing all 6 million records and generating the global model.

```bash
# 1. Ingest ALL Data (Takes ~2-3 hours)
python3 ingest_data.py

# 2. Map ALL Categories (Takes ~1 hour, requires OpenAI Key)
export DATABASE_URL=postgresql://neondb_owner:npg_JpAfS8rK1YZC@ep-curly-frog-a4jqg3tk-pooler.us-east-1.aws.neon.tech/shopwizerdb?sslmode=require\&channel_binding=require
python3 map_categories.py

# 3. Train Unified Model
python3 train_unified.py
```

### B. Run Specific Domain (Test/Patch)

If you only want to process "Clothing":

```bash
# 1. Ingest Clothing Only
python3 ingest_data.py "Clothing"

# 2. Map Clothing Only (Limit optional)
python3 map_categories.py --domain "Clothing"

# 3. Train Model (Will train on whatever data is in DB)
python3 train_unified.py
```

---

## 3. Utilities

- **Check Progress**: `python3 check_progress.py`
  - Prints real-time stats on ingested records and mapped categories.

## 4. Output Artifacts

- **Database**: `data/training_state.db` (The single source of truth for training data).
- **Model**: `models/category2vec_unified.model` (The final embedding model ready for the recommendation engine).
