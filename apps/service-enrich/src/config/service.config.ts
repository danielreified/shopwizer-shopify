/**
 * service.config.ts - Centralized Service Configuration
 *
 * Contains all static configuration, prompts, and tunable parameters.
 * sensitive env vars stay in .env.
 */

// ============================================================
// 1. AI & LLM Core Config
// ============================================================
export const AI_CONFIG = {
  DEFAULT_MODEL: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  EMBEDDING_MODEL: 'text-embedding-3-small',
  MAX_RETRIES: 3,
  RATE_LIMITER: {
    BACKOFF_MODE: 'reactive' as const,
  },
};

// ============================================================
// 2. Worker & Infrastructure
// ============================================================
export const INFRA_CONFIG = {
  HEALTH_PORT: Number(process.env.PORT || 3000),
  SHOPIFY_API_VERSION: '2025-07',
  SQS: {
    WAIT_TIME_SECONDS: 5,
    MAX_MESSAGES: 10,
    VISIBILITY_TIMEOUT: 90,
  },
};

// ============================================================
// 3. Database & Search Tuning
// ============================================================
export const DB_CONFIG = {
  VECTOR_SEARCH: {
    SEQ_SCAN: 'off',
    PROBES: 20,
    LIMIT: 10,
  },
};

// ============================================================
// 4. Enrichment Mappings & Logic
// ============================================================
export const ENRICH_LOGIC = {
  CATEGORY: {
    TARGET_DEPTH: 3,
    BANNED_KEYWORDS: [
      'accessories',
      'appliances',
      'equipment',
      'items',
      'products',
      'goods',
      'supplies',
      'tools',
      'gear',
    ],
  },
  ATTRIBUTES: {
    METAFIELD_REFERENCE_LIMIT: 20,
  },
  DEMOGRAPHICS: {
    GENDER_MAP: {
      male: 'MALE',
      female: 'FEMALE',
      unisex: 'UNISEX',
      other: 'OTHER',
      unknown: 'UNKNOWN',
    } as Record<string, string>,
    AGE_GROUP_MAP: {
      '0-6 months': 'BABY',
      '6-12 months': 'BABY',
      '1-2 years': 'BABY',
      '2-4 years': 'KID',
      '4-6 years': 'KID',
      '6-8 years': 'KID',
      '8-12 years': 'KID',
      teens: 'TEEN',
      adults: 'ADULT',
      'all ages': 'ALL_AGE',
      babies: 'BABY',
      newborn: 'NEWBORN',
    } as Record<string, string>,
  },
};

// ============================================================
// 5. System Prompts
// ============================================================
export const PROMPTS = {
  CATEGORY: `Find the product category from these signals.

PRIORITY ORDER (trust in this order):
1. productType - use if clear and specific
2. tags - often contain product type words
3. collections - may indicate category
4. title/description - extract product type words, ignore brand/model names

===== STEP 1: PICK PARENT CATEGORY =====
apparel, accessories, animals, pet supplies, arts, entertainment, baby, toddler,
business, industrial, cameras & optics, electronics, food, beverages, tobacco, furniture,
hardware, health, beauty, home, garden, bags, media, books, office supplies,
religious, ceremonial, software, sporting goods, toys, games, vehicles, vehicle parts,
footwear, eyewear, watches, gloves, helmets, headwear

===== STEP 2: PICK SUB-NICHE (required for these parents) =====
- electronics: gaming, mobile, audio, computing, smart home, photography, wearables, tv, general
- furniture: indoor, outdoor
- beverages: alcoholic, non-alcoholic
- footwear: running, outdoor, casual, formal

For these parents, pick the BEST sub-niche based on primary use case.
Use "general" only if the product doesn't fit any specific sub-niche.
For all other parents, skip sub-niche and go directly to product type.

===== STEP 3: PICK PRODUCT TYPE =====
Use the basic-level product type - the natural word a shopper would search for.
- TOO BROAD: "footwear", "electronics", "apparel"
- IDEAL: "sneakers", "wireless headphones", "leggings", "dog food", "vitamins"
- TOO SPECIFIC: "Nike Air Max 90", "wireless noise-cancelling headphones"

⚠️ CRITICAL: NEVER use generic grouping words as product type:
- BANNED WORDS: accessories, appliances, equipment, items, products, goods, supplies, tools, gear
- These are NOT product types!

===== OUTPUT FORMAT =====
<parent> > <sub_niche> <product_type>   (for electronics, furniture, beverages, footwear)
<parent> > <product_type>                (for all other parents)

Output ONLY the category path, nothing else.`,

  CATEGORY_VALIDATION: (
    targetDepth: number,
  ) => `Pick the best category for a product from the candidates.

GOAL: Target Depth ${targetDepth} categories (${targetDepth} levels deep) when possible.
- Depth 0-1: TOO BROAD (e.g. "Apparel", "Shoes")
- Depth ${targetDepth - 1}: ACCEPTABLE if no deeper match
- Depth ${targetDepth}: IDEAL ✓ (Target Specificity)
- Depth ${targetDepth + 1}+: TOO SPECIFIC

PRIORITY:
1. tags/productType explicitly match a category → pick it
2. No explicit match → pick a reasonable parent category (Depth ${targetDepth - 1} or ${targetDepth} preferred)

OUTPUT JSON:
{"selected_id": "...", "confidence": "high|medium|low", "reasoning": "..."}`,

  ATTRIBUTES: `
You are an e-commerce product attribute enricher.
RULES:
1. ONLY return values from the allowed list - never invent identifiers.
2. Extract attributes ONLY if:
   - The word is EXPLICITLY written, OR
   - It's a DIRECT synonym (e.g., "flowers" → "floral", "short sleeve" → "short")
3. Do NOT assume attributes based on product type or common knowledge:
   - ❌ "Basic Tee" does NOT imply "cotton" (could be polyester)
   - ❌ "Sunglasses" does NOT imply "plastic frame" (could be metal)
4. If unsure, return [].
5. OUTPUT raw JSON ONLY.
`.trim(),

  DEMOGRAPHICS: `You are a product demographics classifier for an e-commerce platform.
Given product metadata, determine the target gender and age group.

CLASSIFICATION RULES:
1. Gender:
   - MALE: Products clearly for men/boys (men's clothing, men's watches, etc.)
   - FEMALE: Products clearly for women/girls (women's dresses, women's jewelry, etc.)
   - UNISEX: Products for any gender OR if unclear
   - UNKNOWN: Only if absolutely no signal available

2. Age Group:
   - NEWBORN: 0-3 months baby products
   - BABY: 0-2 years (infant, baby, toddler products)
   - KID: 3-11 years (children's products)
   - TEEN: 12-17 years (teenager products)
   - ADULT: 18+ years (default for most products)
   - ALL_AGE: Explicitly for all ages (family games, universal items)
   - UNKNOWN: Only if no signal

3. Key signals to look for:
   - Gender keywords: men, women, boy, girl, unisex, his, her
   - Age keywords: baby, kids, children, teen, adult, toddler, infant
   - Collection names often contain demographic hints
   - Product types indicate demographics (e.g., "dress" → likely female)

4. Default behavior:
   - If no clear gender signal → UNISEX
   - If no clear age signal → ADULT
   - Electronics, food, home goods → typically UNISEX + ADULT

OUTPUT FORMAT: Return ONLY raw JSON with this exact structure:
{"gender": "MALE|FEMALE|UNISEX|UNKNOWN", "age_group": "NEWBORN|BABY|KID|TEEN|ADULT|ALL_AGE|UNKNOWN", "confidence": "high|medium|low"}`,

  VENDOR: `Analyze the brand and product to determine the brand vibe and tier.

OUTPUT FORMAT: Return ONLY raw JSON with this exact structure:
{"vibe": "luxury|athleisure|streetwear|minimalist|casual|etc", "tier": "budget|mid|premium|luxury", "confidence": "high|medium|low"}`,
};
