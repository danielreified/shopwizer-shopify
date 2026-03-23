import sqlite3
import os
from pathlib import Path

DB_PATH = Path(__file__).parent / "data" / "training_state.db"

class DatabaseManager:
    def __init__(self, db_path=DB_PATH):
        self.db_path = db_path
        self._init_db()

    def _init_db(self):
        """Initialize the SQLite database with the required schema."""
        os.makedirs(self.db_path.parent, exist_ok=True)
        
        # Connect and set WAL mode immediately
        conn = self.get_connection()
        try:
            # We try to set WAL mode. If it's locked, we just proceed as WAL might already be set
            # or we can use the default journal mode for this specific connection.
            try:
                conn.execute("PRAGMA journal_mode=WAL")
                conn.execute("PRAGMA synchronous=NORMAL")
            except sqlite3.OperationalError as e:
                if "locked" not in str(e).lower():
                    raise
                print("   ⚠️ Database locked while setting WAL mode, will retry later or proceed with defaults.")

            cursor = conn.cursor()
            
            # 1. Track which source files have been ingested
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS processed_sources (
                    filename TEXT PRIMARY KEY,
                    ingested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)

            # 2. Store raw behavior (User -> ASIN)
            # Flattened records for high-speed SQL access
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS raw_behavior (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id TEXT,
                    asin TEXT,
                    source_domain TEXT,
                    source_file TEXT
                )
            """)
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_raw_asin ON raw_behavior(asin)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_raw_user ON raw_behavior(user_id)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_raw_domain ON raw_behavior(source_domain)")

            # 3. Product Metadata Cache (ASIN -> Amazon Category Path)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS product_metadata (
                    asin TEXT PRIMARY KEY,
                    title TEXT,
                    amazon_categories TEXT
                )
            """)

            # 4. Durable ASIN Mapping (ASIN -> Shopwise ID)
            # This is the "Credit Protection" cache
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS asin_mapping (
                    asin TEXT PRIMARY KEY,
                    shopwise_id TEXT,
                    root_id TEXT,
                    confidence FLOAT,
                    mapped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)

            # 5. Pre-calculated Category Mapping (Amazon Path -> Shopwise ID)
            # Since many ASINs share exact paths, we cache the path translation too
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS category_mapping (
                    amazon_path TEXT PRIMARY KEY,
                    shopwise_id TEXT,
                    root_id TEXT,
                    confidence FLOAT,
                    mapped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)

            conn.commit()
        finally:
            conn.close()

    def get_connection(self):
        conn = sqlite3.connect(self.db_path)
        conn.execute("PRAGMA busy_timeout = 30000") # 30 seconds
        return conn

    def is_file_processed(self, filename):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT 1 FROM processed_sources WHERE filename = ?", (filename,))
            return cursor.fetchone() is not None

    def mark_file_processed(self, filename):
        import time
        max_retries = 5
        for i in range(max_retries):
            try:
                with self.get_connection() as conn:
                    cursor = conn.cursor()
                    cursor.execute("INSERT OR REPLACE INTO processed_sources (filename) VALUES (?)", (filename,))
                    conn.commit()
                return
            except sqlite3.OperationalError as e:
                if "locked" in str(e).lower() and i < max_retries - 1:
                    time.sleep(1)
                    continue
                raise

if __name__ == "__main__":
    db = DatabaseManager()
    print(f"✅ Database initialized at: {DB_PATH}")
