/**
 * service.config.ts - Centralized Service Configuration for service-px
 *
 * Contains infrastructure settings, processing tuning, and SQS/Worker parameters.
 */

// ============================================================
// 1. Worker & Infrastructure
// ============================================================
export const INFRA_CONFIG = {
  AWS_REGION: process.env.AWS_REGION || 'us-east-1',
  HEALTH_PORT: Number(process.env.PORT || 3000),
  SQS: {
    WAIT_TIME_SECONDS: 10,
    MAX_MESSAGES: 1, // S3 logs can be large, process carefully
    VISIBILITY_TIMEOUT: 120,
  },
  S3: {
    PROCESSED_BUCKET: process.env.PROCESSED_BUCKET || 'dev-ue1-shopwise-rec-cf-logs-px-processed',
    ARCHIVE_BUCKET: process.env.ARCHIVE_BUCKET || 'dev-ue1-shopwise-rec-cf-logs-px-archived',
  },
};

// ============================================================
// 2. Processing Parameters (Tuning)
// ============================================================
export const LOG_PROCESSING_CONFIG = {
  MAX_PARQUET_BATCH: 10_000, // Rows per Parquet file
  CHUNK_SIZE: 5000, // Log line processing slice
  BATCH_SIZE_DB: 200, // Prisma batch size
  MAX_RECORDS_PER_LOG: 1_000_000, // Safety cap to avoid OOM
  ANALYTICS: {
    WINDOW_MS: 30 * 60 * 1000, // 30-minute buckets for quick stats
  },
  MIN_LOG_SIZE_BYTES: 200, // Skip empty/too small files
};

// ============================================================
// 3. Debugging
// ============================================================
export const DEBUG_CONFIG = {
  IS_DEBUG: process.env.DEBUG === '1',
};
