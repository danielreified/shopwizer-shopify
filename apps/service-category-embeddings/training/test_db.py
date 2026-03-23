import os
import subprocess

def test_conn():
    url = os.environ.get("DATABASE_URL")
    if not url:
        print("❌ DATABASE_URL not set")
        return
    
    print(f"🔗 Testing connection to {url[:20]}...")
    sql = "SELECT id FROM \"Category\" LIMIT 1;"
    result = subprocess.run(["psql", url, "-t", "-c", sql], capture_output=True, text=True)
    if result.returncode == 0:
        print("✅ Connection successful!")
        print(f"   Result: {result.stdout.strip()}")
    else:
        print("❌ Connection failed")
        print(f"   Error: {result.stderr}")

if __name__ == "__main__":
    test_conn()
