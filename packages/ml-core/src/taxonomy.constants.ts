/**
 * Taxonomy Constants for the Shopwise ML Engine
 *
 * These depths have been verified via a comprehensive audit of all 26 root categories.
 * They represent the optimal "sweet spot" for clustering products by functional intent
 * without introducing data sparsity.
 */

export const TAXONOMY_TARGET_DEPTH: Record<string, number> = {
  // Depth 3: High functional density (Target specialized product types)
  'Apparel & Accessories': 3,
  'Animals & Pet Supplies': 3,
  'Baby & Toddler': 3,
  'Food, Beverages & Tobacco': 3,
  Furniture: 3,
  'Health & Beauty': 3,
  'Home & Garden': 3,
  'Sporting Goods': 3,
  'Toys & Games': 3,
  'Vehicles & Parts': 3,
  'Business & Industrial': 3,
  Mature: 3,
  Media: 3,
  'Office Supplies': 3,
  Services: 3,

  // Depth 2: High brand/identity importance (Target primary product categories)
  Electronics: 2,
  Software: 2,
  Hardware: 2,
  'Arts & Entertainment': 2,
  'Cameras & Optics': 2,
  'Luggage & Bags': 2,
  'Religious & Ceremonial': 2,

  // Default fallback for any newly introduced or flat root categories
  default: 3,
};

/**
 * Metadata for excluded roots (flat structures with no meaningful deep taxonomy)
 */
export const EXCLUDED_ROOTS = ['Bundles', 'Gift Cards', 'Uncategorized', 'Product Add-Ons'];
