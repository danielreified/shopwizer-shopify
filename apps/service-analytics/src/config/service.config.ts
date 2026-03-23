/**
 * service.config.ts - Centralized Service Configuration for service-analytics
 *
 * Contains infrastructure settings, SQS/Worker parameters, and job-specific tuning.
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
  ATHENA: {
    REGION: process.env.AWS_REGION || 'us-east-1',
    DATABASE: process.env.ATHENA_DB || 'shopwizer_px',
    OUTPUT_LOCATION: process.env.ATHENA_OUTPUT || 's3://dev-ue1-shopwizer-query-results/',
  },
};

// ============================================================
// 2. Data Pipelines & Windows
// ============================================================
export const DATA_CONFIG = {
  BATCH_SIZE: 400, // DB batch size for updates
  WINDOWS: {
    CTR_LOOKBACK_DAYS: 7,
    ORDER_LOOKBACK_DAYS: 30,
  },
};

// ============================================================
// 3. Graph Weights Configuration (Daily Knowledge Base)
// ============================================================
export const GRAPH_CONFIG = {
  WEIGHT_DECAY: 0.95, // 5% decay per day
  MIN_CLICKS_FOR_WEIGHT: 5,
  MIN_CO_PURCHASE_FREQ: 3,
  SCORING: {
    HIGH_CTR_THRESHOLD: 0.1,
    MEDIUM_CTR_THRESHOLD: 0.05,
    LOW_CTR_THRESHOLD: 0.02,
    WEIGHTS: {
      HIGH: 0.9,
      MEDIUM: 0.7,
      LOW_MID: 0.5,
      LOW: 0.3,
    },
  },
  BATCH_SIZE: 50,
};

// ============================================================
// 4. Category Graph Rebuild (90-day counts)
// ============================================================
export const CATEGORY_GRAPH_REBUILD_CONFIG = {
  LOOKBACK_DAYS: 90,
  MIN_CO_PURCHASE_FREQ: 1,
  TRANSACTION_TIMEOUT_MS: 60000,
};

// ============================================================
// 5. Product Graph Rebuild (90-day counts)
// ============================================================
export const PRODUCT_GRAPH_REBUILD_CONFIG = {
  LOOKBACK_DAYS: 90,
  MIN_CO_PURCHASE_FREQ: 1,
  TOP_K_PER_SOURCE: 10,
  TRANSACTION_TIMEOUT_MS: 60000,
};

// ============================================================
// 6. Bundle Discovery Promotion
// ============================================================
export const BUNDLE_CONFIG = {
  MIN_VIEWS_FOR_PROMOTION: 50,
  MIN_CTR_FOR_PROMOTION: 0.05,
};
