export const Sources = {
  SERVICE_BULK_PRODUCTS: 'shopwizer.fn-bulk-products',
  SERVICE_EVENTS: 'shopwizer.service-events',
  SERVICE_JOBS: 'shopwizer.service-jobs',
  SERVICE_APP: 'shopwizer.service-app',
} as const;

export type Source = (typeof Sources)[keyof typeof Sources];

export const DetailTypes = {
  PRODUCT_BULK: 'product.bulk',
  PRODUCT_ENRICH: 'product.enrich',
  SHOP_SYNC_COMPLETE: 'shop.sync-complete',
  ANALYTICS_EVENT: 'analytics.event',
  EMAIL_SEND: 'email.send',
  JOB_SCHEDULE: 'job.schedule',
} as const;

export type DetailType = (typeof DetailTypes)[keyof typeof DetailTypes];
