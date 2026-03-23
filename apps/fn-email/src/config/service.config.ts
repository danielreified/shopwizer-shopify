/**
 * service.config.ts - Centralized Service Configuration for fn-email
 */

export const INFRA_CONFIG = {
  RESEND: {
    API_KEY: process.env.RESEND_API_KEY!,
    FROM: process.env.EMAIL_FROM || 'Shopwizer <updates@shopwizer.co.za>',
  },
};

export const RUNTIME_CONFIG = {
  IS_LOCAL:
    process.env.IS_LOCAL === 'true' ||
    process.env.IS_OFFLINE === 'true' ||
    process.env.AWS_SAM_LOCAL === 'true',
  IS_INVOKE_LOCAL: process.env.SLS_INVOKE_LOCAL === 'true',
};
