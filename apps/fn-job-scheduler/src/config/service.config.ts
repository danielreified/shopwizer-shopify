/**
 * service.config.ts - Centralized Service Configuration for fn-job-scheduler
 */

export const INFRA_CONFIG = {
  AWS_REGION: process.env.AWS_REGION || 'us-east-1',
  DATABASE: {
    URL: process.env.DATABASE_URL!,
  },
  SQS: {
    JOB_QUEUE_URL: process.env.JOB_QUEUE_URL!,
  },
};

export const RUNTIME_CONFIG = {
  IS_LOCAL: process.env.IS_LOCAL === 'true',
  IS_OFFLINE: process.env.IS_OFFLINE === 'true',
  IS_INVOKE_LOCAL: process.env.SLS_INVOKE_LOCAL === 'true',
};
