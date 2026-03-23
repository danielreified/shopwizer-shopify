#!/usr/bin/env bash
# Usage: ./hit-site.sh [REPEATS] [DELAY_MS]
# Example: ./hit-site.sh 20 300

REPEATS=${1:-10}
DELAY_MS=${2:-300}
URLS=(
  "https://dev-recommender.myshopify.com/products/annibale-colombo-bed?variant=45369977143486"
  "https://dev-recommender.myshopify.com/products/annibale-colombo-sofa?variant=45265721032894"
  "https://dev-recommender.myshopify.com/products/cat-food?variant=45265721884862"
  "https://dev-recommender.myshopify.com/products/calvin-klein-ck-one?variant=45265720705214"
  "https://dev-recommender.myshopify.com/products/cooking-oil?variant=45265721983166"
  "https://dev-recommender.myshopify.com/products/soft-drinks?variant=45265722605758"
  "https://dev-recommender.myshopify.com/products/chicken-meat?variant=45265721917630"
  "https://dev-recommender.myshopify.com/products/chanel-coco-noir-eau-de?variant=45265720737982"
)

UAS=(
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36"
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36"
  "Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1"
)

REFERRER="https://dev-recommender.myshopify.com/"

echo "Starting hits: repeats=${REPEATS}, delay_ms=${DELAY_MS}, urls=${#URLS[@]}"

for run in $(seq 1 "$REPEATS"); do
  echo "=== Run $run / $REPEATS ==="
  for url in "${URLS[@]}"; do
    ua=${UAS[$((RANDOM % ${#UAS[@]}))]}

    jitter=$(( (RANDOM % 201) - 100 )) # -100..+100
    delay_ms=$(( DELAY_MS + jitter ))
    if [ "$delay_ms" -lt 0 ]; then delay_ms=0; fi

    start_time=$(date +"%s")
    http_out=$(curl -s -L -o /dev/null -w "%{http_code} %{time_total}" \
      -H "User-Agent: $ua" \
      -H "Referer: $REFERRER" \
      "$url")
    end_time=$(date +"%s")
    elapsed=$((end_time - start_time))

    printf "[%s] %s  %ds  %s\n" "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" "$http_out" "$elapsed" "$url"

    sleep $(awk "BEGIN{print $delay_ms/1000}")
  done
done

echo "Done."
