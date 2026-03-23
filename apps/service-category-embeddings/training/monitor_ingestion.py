import sqlite3
import time
import os
import sys

DB_PATH = "data/training_state.db"

def clear_screen():
    os.system('cls' if os.name == 'nt' else 'clear')

def get_stats():
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # 1. Product Metadata Count
        cursor.execute("SELECT count(*) FROM product_metadata")
        meta_count = cursor.fetchone()[0]
        
        # 2. Raw Behavior (Transactions) Count
        cursor.execute("SELECT count(*) FROM raw_behavior")
        behavior_count = cursor.fetchone()[0]
        
        # 3. Behavior by Domain
        cursor.execute("SELECT source_domain, count(*) FROM raw_behavior GROUP BY source_domain ORDER BY count(*) DESC")
        domains = cursor.fetchall()
        
        # 4. Mapped Categories
        cursor.execute("SELECT count(*) FROM category_mapping")
        mapped_count = cursor.fetchone()[0]
        
        conn.close()
        return meta_count, behavior_count, domains, mapped_count
    except Exception as e:
        return 0, 0, [], 0

def monitor():
    start_time = time.time()
    
    while True:
        meta, behavior, domains, mapped = get_stats()
        elapsed = time.time() - start_time
        
        clear_screen()
        print(f"📡 SHOPWISE DATA INGESTION MONITOR")
        print(f"=================================")
        print(f"⏱️  Runtime: {int(elapsed)}s")
        print(f"---------------------------------")
        print(f"📦 Product Metadata:   {meta:,} ASINs")
        print(f"🛒 Raw Transactions:   {behavior:,} Rows")
        print(f"🗺️  Mapped Categories:  {mapped:,} Paths")
        print(f"---------------------------------")
        print(f"📊 Transactions by Domain:")
        
        if not domains:
            print("   (No transactions yet - Phase 1 or 2 active)")
        
        for domain, count in domains:
            bar = "█" * int((count / (behavior + 1)) * 40)
            print(f"   {domain:30} | {bar} {count:,}")
            
        print(f"---------------------------------")
        print(f"Press Ctrl+C to exit monitor (Ingestion will continue)")
        time.sleep(2)

if __name__ == "__main__":
    try:
        monitor()
    except KeyboardInterrupt:
        print("\n👋 Monitor exited.")
