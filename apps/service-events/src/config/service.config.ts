/**
 * service.config.ts - Centralized Service Configuration for service-events
 *
 * Contains infrastructure settings, SQS/Worker parameters, and Shopify API versions.
 */

// ---
// 1. Worker & Infrastructure
// ---
export const INFRA_CONFIG = {
  HEALTH_PORT: Number(process.env.PORT || 3000),
  SQS: {
    WAIT_TIME_SECONDS: 20,
    MAX_MESSAGES: 10,
    VISIBILITY_TIMEOUT: 30,
  },
};

// ---
// 2. Third-Party Integrations
// ---
export const SHOPIFY_CONFIG = {
  API_VERSION: '2025-07',
  FETCH_LIMITS: {
    VARIANTS: 250,
    COLLECTIONS: 20,
    METAFIELD_REFERENCES: 50,
  },
};
