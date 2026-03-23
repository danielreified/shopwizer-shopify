# service-ranker/train/etl_clicks.py
"""
ETL Script: Extract click data from Athena and transform into training examples.

For each reco_click event:
- Parse the 'p' (items payload) to get all shown products with their positions and features
- The clicked product (matching pid) is a positive example (label=1)
- Other products in the same slate are negative examples (label=0)

Usage:
    python train/etl_clicks.py --days 30 --output train/training_data.csv
"""

import argparse
import json
import time
import os
import sys
import boto3
import pandas as pd
from datetime import datetime, timedelta
from typing import Optional

# Add parent dir to path for config import
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config.ranker_config import INFRA_CONFIG, MODEL_CONFIG, PIPELINE_CONFIG

AWS_REGION = INFRA_CONFIG["AWS_REGION"]
ATHENA_DATABASE = INFRA_CONFIG["ATHENA"]["DATABASE"]
ATHENA_OUTPUT = INFRA_CONFIG["ATHENA"]["OUTPUT"]
MIN_SLATE_SIZE = PIPELINE_CONFIG["MIN_SLATE_SIZE"]
MAX_SLATE_SIZE = PIPELINE_CONFIG["MAX_SLATE_SIZE"]
DEFAULT_FEATURES = MODEL_CONFIG["DEFAULT_FEATURES"]
TRAINING_DATA_PATH = INFRA_CONFIG["TRAINING_DATA_PATH"]


athena = boto3.client("athena", region_name=AWS_REGION)


def run_athena_query(query: str, max_wait_seconds: int = 300) -> pd.DataFrame:
    """Execute an Athena query and return results as DataFrame."""
    print(f"📊 Running Athena query...")
    
    # Start query
    response = athena.start_query_execution(
        QueryString=query,
        QueryExecutionContext={"Database": ATHENA_DATABASE},
        ResultConfiguration={"OutputLocation": ATHENA_OUTPUT},
    )
    query_execution_id = response["QueryExecutionId"]
    
    # Poll for completion
    elapsed = 0
    while elapsed < max_wait_seconds:
        status = athena.get_query_execution(QueryExecutionId=query_execution_id)
        state = status["QueryExecution"]["Status"]["State"]
        
        if state == "SUCCEEDED":
            break
        elif state in ("FAILED", "CANCELLED"):
            reason = status["QueryExecution"]["Status"].get("StateChangeReason", "Unknown")
            raise Exception(f"Query {state}: {reason}")
        
        time.sleep(2)
        elapsed += 2
        if elapsed % 10 == 0:
            print(f"   ... waiting ({elapsed}s)")
    else:
        raise Exception(f"Query timed out after {max_wait_seconds}s")
    
    print(f"✅ Query succeeded in {elapsed}s")
    
    # Fetch results (with pagination)
    all_rows = []
    next_token = None
    
    while True:
        kwargs = {"QueryExecutionId": query_execution_id, "MaxResults": 1000}
        if next_token:
            kwargs["NextToken"] = next_token
            
        results = athena.get_query_results(**kwargs)
        rows = results["ResultSet"]["Rows"]
        
        # First batch includes headers
        if not all_rows and len(rows) > 0:
            headers = [col.get("VarCharValue", f"col_{i}") for i, col in enumerate(rows[0]["Data"])]
            rows = rows[1:]
        
        for row in rows:
            values = [col.get("VarCharValue") for col in row["Data"]]
            all_rows.append(dict(zip(headers, values)))
        
        next_token = results.get("NextToken")
        if not next_token:
            break
    
    return pd.DataFrame(all_rows)


def parse_payload(p_json: Optional[str]) -> Optional[dict]:
    """Parse the 'p' payload JSON."""
    if not p_json:
        return None
    try:
        return json.loads(p_json)
    except json.JSONDecodeError:
        return None


def parse_source_payload(ps_json: Optional[str]) -> Optional[dict]:
    """Parse the 'ps' (source product) payload JSON."""
    if not ps_json:
        return None
    try:
        return json.loads(ps_json)
    except json.JSONDecodeError:
        return None


def extract_features(item: dict) -> dict:
    """Extract features from a slate item."""
    f = item.get("f", {}) or {}
    return {
        "position": int(item.get("i", 0) or 0),
        "pid": str(item.get("pid", "") or ""),  # Product ID (new field)
        "category": str(item.get("c", "") or ""),
        "price": float(item.get("p", 0) or 0),
        "views30d": int(f.get("v", 0) or 0),
        "clicks30d": int(f.get("c", 0) or 0),
        "carts30d": int(f.get("a", 0) or 0),
        "orders30d": int(f.get("o", 0) or 0),
        "revenue30d": float(f.get("r", 0) or 0),
    }


def flatten_click_event(row: dict) -> list[dict]:
    """
    Flatten a single click event into multiple training examples.
    Returns a list of dicts, one per item in the slate.
    """
    examples = []
    
    # Parse payloads
    payload = parse_payload(row.get("p"))
    source = parse_source_payload(row.get("ps"))
    
    if not payload or "items" not in payload:
        return examples
    
    items = payload.get("items", [])
    
    # Skip if slate too small or too large
    if len(items) < MIN_SLATE_SIZE or len(items) > MAX_SLATE_SIZE:
        return examples
    
    # Get clicked product ID (normalize to string)
    clicked_pid = str(row.get("pid", ""))
    
    # Extract source product context
    source_category = source.get("c", "") if source else ""
    source_price = float(source.get("p", 0) or 0) if source else 0
    source_features = source.get("f", {}) if source else {}
    
    # Track if we found the clicked item
    found_clicked = False
    
    # Process each item in the slate
    for item in items:
        features = extract_features(item)
        item_pid = str(features.get("pid", ""))
        
        # Determine if this is the clicked item
        is_clicked = (item_pid == clicked_pid) if item_pid else False
        if is_clicked:
            found_clicked = True
        
        # Compute relative features
        price_delta = features["price"] - source_price if source_price else 0
        same_category = 1 if features["category"] == source_category else 0
        
        example = {
            # Metadata (not used for training, but useful for analysis)
            "slate_id": row.get("slate_id", ""),
            "rail": row.get("rail", payload.get("r", "")),
            "shop": row.get("shop", ""),
            "timestamp": row.get("ts", ""),
            "item_pid": item_pid,
            "clicked_pid": clicked_pid,
            
            # Position features (important for position bias)
            "position": features["position"],
            "position_normalized": features["position"] / len(items),
            "slate_size": len(items),
            
            # Item features
            "price": features["price"],
            "views30d": features["views30d"],
            "clicks30d": features["clicks30d"],
            "carts30d": features["carts30d"],
            "orders30d": features["orders30d"],
            "revenue30d": features["revenue30d"],
            
            # Context features (relative to source)
            "price_delta": price_delta,
            "same_category": same_category,
            
            # Source features (the product being viewed)
            "src_price": source_price,
            "src_views30d": source_features.get("v", 0),
            "src_clicks30d": source_features.get("c", 0),
            
            # Label: 1 if this item was clicked, 0 otherwise
            "label": 1 if is_clicked else 0,
        }
        
        examples.append(example)
    
    # If we didn't find the clicked item (pid not in payload), skip this event
    # This handles legacy data before we added pid to payload
    if not found_clicked:
        return []
    
    return examples


def extract_training_data(days: int = 30, shop: Optional[str] = None) -> pd.DataFrame:
    """
    Query Athena for reco_click events and extract training data.
    
    Note: Uses partition projection which requires explicit partition values,
    not range filters like >=.
    """
    from datetime import timezone
    
    # Calculate date range
    end_date = datetime.now(timezone.utc)
    start_date = end_date - timedelta(days=days)
    
    print(f"📅 Extracting data from {start_date.date()} to {end_date.date()}")
    
    # Generate explicit year/month combinations for partition projection
    # Partition projection doesn't support >= so we need IN clauses
    date_conditions = []
    current = start_date
    while current <= end_date:
        year = current.year
        month = str(current.month).zfill(2)
        day = str(current.day).zfill(2)
        date_conditions.append(f"(year = '{year}' AND month = '{month}' AND day = '{day}')")
        current += timedelta(days=1)
    
    # For efficiency, group by year+month if spanning many days
    if len(date_conditions) > 10:
        # Instead of individual days, use year+month combinations
        year_months = set()
        current = start_date
        while current <= end_date:
            year_months.add((current.year, str(current.month).zfill(2)))
            current += timedelta(days=1)
        
        date_conditions = [
            f"(year = '{y}' AND month = '{m}')"
            for y, m in sorted(year_months)
        ]
    
    date_filter = " OR ".join(date_conditions)
    
    # Build where clause - must include event partition explicitly
    shop_filter = f"AND shop = '{shop}'" if shop else ""
    
    # Query for all reco_click events with payloads
    query = f"""
    SELECT 
        ts,
        shop,
        sid,
        pid,
        rail,
        src_pid,
        slate_id,
        p,
        ps
    FROM px_events
    WHERE event = 'reco_click'
      AND p IS NOT NULL
      AND ({date_filter})
      {shop_filter}
    ORDER BY ts DESC
    LIMIT 10000
    """
    
    print(f"🔍 Query (first 300 chars):\n{query[:300]}...")
    
    df = run_athena_query(query)
    
    if df.empty:
        print("⚠️ No click events found!")
        return pd.DataFrame()
    
    print(f"✅ Found {len(df)} click events")
    
    # Flatten each click into training examples
    all_examples = []
    skipped_no_payload = 0
    skipped_no_match = 0
    
    for _, row in df.iterrows():
        examples = flatten_click_event(row.to_dict())
        if examples:
            all_examples.extend(examples)
        else:
            # Check why we skipped
            payload = parse_payload(row.get("p"))
            if not payload or "items" not in payload:
                skipped_no_payload += 1
            else:
                skipped_no_match += 1
    
    print(f"📊 Generated {len(all_examples)} training examples")
    print(f"   Skipped (no payload): {skipped_no_payload}")
    print(f"   Skipped (no pid match): {skipped_no_match}")
    
    return pd.DataFrame(all_examples)


def main():
    parser = argparse.ArgumentParser(description="Extract click data for ranker training")
    parser.add_argument("--days", type=int, default=30, help="Number of days of data to extract")
    parser.add_argument("--shop", type=str, default=None, help="Filter by shop domain")
    parser.add_argument("--output", type=str, default=TRAINING_DATA_PATH, help="Output CSV path")
    args = parser.parse_args()
    
    print("🚀 Starting ETL pipeline...")
    print(f"   Days: {args.days}")
    print(f"   Shop: {args.shop or 'all'}")
    print(f"   Output: {args.output}")
    
    # Extract training data
    df = extract_training_data(days=args.days, shop=args.shop)
    
    if df.empty:
        print("❌ No training data extracted!")
        return
    
    # Save to CSV
    df.to_csv(args.output, index=False)
    print(f"💾 Saved {len(df)} examples to {args.output}")
    
    # Print summary statistics
    print("\n📊 Dataset Summary:")
    print(f"   Total examples: {len(df)}")
    print(f"   Unique slates: {df['slate_id'].nunique()}")
    print(f"   Positive labels (clicks): {df['label'].sum()}")
    print(f"   Negative labels: {len(df) - df['label'].sum()}")
    print(f"   Click rate: {df['label'].mean():.2%}")
    
    if 'rail' in df.columns:
        print(f"\n   Rails:")
        for rail, count in df['rail'].value_counts().items():
            print(f"      {rail}: {count}")
    
    print(f"\n   Position distribution of clicks:")
    clicked = df[df['label'] == 1]
    for pos in range(1, min(6, int(clicked['position'].max()) + 1)):
        count = len(clicked[clicked['position'] == pos])
        pct = count / len(clicked) * 100 if len(clicked) > 0 else 0
        print(f"      Position {pos}: {count} ({pct:.1f}%)")


if __name__ == "__main__":
    main()
