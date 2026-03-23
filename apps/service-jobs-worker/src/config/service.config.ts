/**
 * service.config.ts - Centralized Service Configuration for service-jobs-worker
 *
 * Contains infrastructure settings, scoring logic, and job-specific parameters.
 */

// ============================================================
// 1. Worker & Infrastructure
// ============================================================
export const INFRA_CONFIG = {
  HEALTH_PORT: Number(process.env.PORT || 3000),
  SQS: {
    WAIT_TIME_SECONDS: 10,
    MAX_MESSAGES: 1,
    VISIBILITY_TIMEOUT: 300,
  },
  APIS: {
    CATEGORY_EMBEDDINGS_URL: process.env.CATEGORY_EMBEDDINGS_URL || 'http://localhost:8003',
  },
};

// ============================================================
// 2. Trending Logic Configuration
// ============================================================
export const TRENDING_CONFIG = {
  LOW_TRAFFIC_THRESHOLD: 100, // Total interactions in 7d
  SCORING: {
    CLICK_WEIGHT: 2.0,
    RECENCY_WEIGHT: 0.7,
    PERSISTENCE_WEIGHT: 0.3,
    DECAY_DAYS: 45,
    NEW_PRODUCT_WINDOW_DAYS: 7,
    NEW_PRODUCT_BOOST: 1.1,
    JITTER_RANGE: 0.05,
  },
  BATCH_SIZE: 100,
};

// ============================================================
// 3. Best Seller Logic Configuration
// ============================================================
export const BEST_SELLER_CONFIG = {
  WINDOWS: {
    SHORT_TERM_DAYS: 7,
    LONG_TERM_DAYS: 30,
  },
  SCORING: {
    POPULARITY_ORDER_WEIGHT: 0.8,
    POPULARITY_REVENUE_WEIGHT: 0.2,
    BASE_POPULARITY_WEIGHT: 0.9,
    BASE_FRESHNESS_WEIGHT: 0.1,
    ENGAGEMENT_BOOST: 0.1,
    DECAY_DAYS: 180,
    NORMALIZATION_POWER: 0.8,
  },
  BATCH_SIZE: 100,
};

// ============================================================
// 4. Bundle Generation Configuration
// ============================================================
export const BUNDLE_CONFIG = {
  ITEMS_PER_BUNDLE: 3,
  BATCH_SIZE: 50,
  MIN_IMPRESSIONS: 100,
  GRAPH_MIN_WEIGHT: 0.3,
  PRICE_GUARDRAILS: {
    MIN_MULTIPLIER: 0.2,
    MAX_MULTIPLIER: 5.0,
    STICKER_SHOCK_THRESHOLD: 3.0,
    STICKER_SHOCK_PENALTY: 0.1,
  },
  USAGE_LIMITS: {
    MAX_BUNDLES_PER_ITEM: 5,
    PENALTY_SLOPE: 20,
  },
  CLEANUP: {
    ARCHIVE_DELETE_DAYS: 30,
  },
  ML_DISCOVERY: {
    TOP_N: 12,
    HIGH_CONFIDENCE_COUNT: 3,
    RANDOM_DISCOVERY_COUNT: 3,
  },
};

// ============================================================
// 5. Graph Weights Configuration
// ============================================================
export const GRAPH_CONFIG = {
  TOP_K_PRODUCTS_PER_SOURCE: 20,
  TRANSACTION_TIMEOUT_MS: 60000,
};
