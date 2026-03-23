/**
 * Category-based vendor weights
 * Higher = vendor/brand similarity matters more
 * Keys must match Category.topLevel values exactly
 */
const VENDOR_WEIGHTS: Record<string, number> = {
  // High brand importance
  "Electronics": 0.15,
  "Apparel & Accessories": 0.12,
  "Sporting Goods": 0.12,
  "Vehicles & Parts": 0.10,
  "Health & Beauty": 0.10,
  "Cameras & Optics": 0.08,

  // Medium brand importance
  "Home & Garden": 0.06,
  "Toys & Games": 0.06,
  "Baby & Toddler": 0.06,
  "Arts & Entertainment": 0.05,
  "Software": 0.08,
  "Luggage & Bags": 0.06,
  "Furniture": 0.05,

  // Lower brand importance
  "Food, Beverages & Tobacco": 0.03,
  "Office Supplies": 0.02,
  "Hardware": 0.04,
  "Business & Industrial": 0.03,
  "Animals & Pet Supplies": 0.04,
  "Media": 0.04,
  "Mature": 0.03,
  "Religious & Ceremonial": 0.02,

  // Minimal brand importance
  "Bundles": 0.02,
  "Gift Cards": 0.01,
  "Product Add-Ons": 0.01,
  "Services": 0.01,
  "Uncategorized": 0.05,

  // Default for unmatched categories
  "default": 0.05,
};

function getVendorWeight(categoryTopLevel: string | null | undefined): number {
  if (!categoryTopLevel) {
    return VENDOR_WEIGHTS["default"];
  }

  return VENDOR_WEIGHTS[categoryTopLevel] ?? VENDOR_WEIGHTS["default"];
}

export function computeScore(
  origin: {
    price: number | null;
    vendor: string | null;
    categoryId: string | null;
    categoryTopLevel?: string | null;
    embeddingVector: number[] | null;
    attrEmbedding?: number[] | null;
    vendorEmbedding?: number[] | null;
    colorLab?: [number, number, number] | null;
  },
  candidate: {
    price: number | null;
    vendor: string | null;
    categoryId: string | null;
    categoryTopLevel?: string | null;
    embeddingVector: number[] | null;
    attrEmbedding?: number[] | null;
    vendorEmbedding?: number[] | null;
    colorLab?: [number, number, number] | null;
  },
  queryType: "similar" | "fbt" | "personalized",
) {
  let score = 0;

  // -----------------------
  // A) Main embedding similarity (primary signal)
  // -----------------------
  if (origin.embeddingVector && candidate.embeddingVector) {
    score += cosine(origin.embeddingVector, candidate.embeddingVector) * 0.7;
  }

  // -----------------------
  // B) Attribute embedding similarity (secondary signal)
  // -----------------------
  if (origin.attrEmbedding && candidate.attrEmbedding) {
    score += cosine(origin.attrEmbedding, candidate.attrEmbedding) * 0.15;
  }

  // -----------------------
  // C) Vendor embedding similarity (category-weighted)
  // -----------------------
  if (origin.vendorEmbedding && candidate.vendorEmbedding) {
    const vendorWeight = getVendorWeight(origin.categoryTopLevel);
    score += cosine(origin.vendorEmbedding, candidate.vendorEmbedding) * vendorWeight;
  } else if (
    // Fallback: same vendor string match (when embeddings missing)
    origin.vendor &&
    candidate.vendor &&
    origin.vendor.toLowerCase() === candidate.vendor.toLowerCase()
  ) {
    score += 0.05;
  }

  // -----------------------
  // D) Same category boost
  // -----------------------
  if (
    origin.categoryId &&
    candidate.categoryId &&
    origin.categoryId === candidate.categoryId
  ) {
    score += 0.08;
  }

  // -----------------------
  // E) Price proximity (smaller influence)
  // -----------------------
  if (origin.price && candidate.price) {
    score += priceProximity(origin.price, candidate.price) * 0.05;
  }


  // -----------------------
  // Z) MICRO-JITTER (±0.4%) to avoid static ordering
  // -----------------------
  const jitter = (Math.random() - 0.5) * 0.008;
  score += jitter;

  return score;
}

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

function cosine(a: number[], b: number[]) {
  let dot = 0,
    n1 = 0,
    n2 = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    n1 += a[i] * a[i];
    n2 += b[i] * b[i];
  }
  return dot / (Math.sqrt(n1) * Math.sqrt(n2) || 1);
}

function priceProximity(a: number, b: number) {
  const diff = Math.abs(a - b);
  return Math.max(0, 1 - diff / Math.max(a, b, 1));
}
