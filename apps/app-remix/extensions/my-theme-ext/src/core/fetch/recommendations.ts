// src/fetch/recommendations.ts

export async function fetchRecommendations(shop: string, rail: string, productId: string | number) {
  const res = await fetch(`/apps/sw/recs/${shop}/${rail}/${productId}`);

  if (!res.ok) throw new Error("Recommendation API error " + res.status);

  return res.json();
}
