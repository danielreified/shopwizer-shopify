/**
 * service.config.ts - Centralized Service Configuration for fn-bulk-products
 */

export const INFRA_CONFIG = {
  S3: {
    REGION: process.env.AWS_REGION || 'us-east-1',
    PRODUCT_BUCKET: process.env.PRODUCT_BUCKET || '',
  },
  EVENT_BUS: {
    NAME: process.env.EVENT_BUS_NAME || '',
  },
};

export const RUNTIME_CONFIG = {
  IS_LOCAL: process.env.IS_LOCAL === 'true',
  IS_OFFLINE: process.env.IS_OFFLINE === 'true',
  IS_AWS_SAM_LOCAL: process.env.AWS_SAM_LOCAL === 'true',
  IS_INVOKE_LOCAL: process.env.SLS_INVOKE_LOCAL === 'true',
  DEBUG: (process.env.DEBUG ?? '').toLowerCase() === 'true' || process.env.DEBUG === '1',
};

export const PROCESSING_CONFIG = {
  LOCAL_DATA_DIR: 'data',
  LOCAL_OUTPUT_DIR: 'output',
  LOCAL_FILE: process.env.LOCAL_FILE || '',
  BATCH_MAX: 10, // EventBridge PutEvents limit per call
  PROGRESS_LOG_STEP: 5000,
};
