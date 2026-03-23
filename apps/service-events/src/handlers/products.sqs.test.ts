import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock all external dependencies BEFORE importing the handler
vi.mock('@repo/event-toolkit', () => ({
  parseJsonSafe: vi.fn(),
}));
vi.mock('../db/prisma', () => ({
  prisma: {
    shop: { findUnique: vi.fn() },
    product: { findUnique: vi.fn(), update: vi.fn() },
    $transaction: vi.fn(),
  },
}));
vi.mock('@repo/event-contracts', () => ({
  ENRICH_EVENT_TYPE: 'ENRICH_PRODUCT',
  SHOP_SYNC_EVENT_TYPE: 'SHOP_SYNC_COMPLETE',
  Sources: { SERVICE_EVENTS: 'shopwizer.service-events' },
  DetailTypes: { PRODUCT_ENRICH: 'product.enrich' },
  publish: vi.fn(),
}));
vi.mock('@repo/ddb', () => ({
  deleteEnrichStates: vi.fn(),
}));
vi.mock('@repo/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
  timer: vi.fn(() => ({ done: vi.fn() })),
}));
vi.mock('../adapters/product.webhook.adapter', () => ({
  adaptWebhook: vi.fn(),
}));
vi.mock('../adapters/product.bulk.adapter', () => ({
  adaptBulk: vi.fn(),
}));
vi.mock('../services/product.service', () => ({
  upsertNormalizedProduct: vi.fn(),
}));
vi.mock('../services/product.attributes', () => ({
  fetchProductAttributes: vi.fn(),
}));
vi.mock('../services/product.category', () => ({
  fetchProductCategory: vi.fn(),
}));
vi.mock('../transformers', () => ({
  runTransforms: vi.fn((p) => p),
}));
vi.mock('../transformers/colors', () => ({
  addVariantColors: vi.fn((p) => p),
}));

import { handleProductsMessage, handleProductsBulkMessage } from './products.sqs';
import { parseJsonSafe } from '@repo/event-toolkit';

describe('handleProductsMessage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws on invalid JSON', async () => {
    vi.mocked(parseJsonSafe).mockReturnValue(null);
    await expect(handleProductsMessage('not json')).rejects.toThrow('Invalid SQS JSON body');
  });

  it('throws when shop domain is missing', async () => {
    vi.mocked(parseJsonSafe).mockReturnValue({
      headers: { 'X-Shopify-Topic': 'products/create' },
      // no shop domain
    });
    await expect(handleProductsMessage('{}')).rejects.toThrow('Missing shop domain');
  });

  it('skips unknown topics without throwing', async () => {
    vi.mocked(parseJsonSafe).mockReturnValue({
      headers: {
        'X-Shopify-Topic': 'unknown/topic',
        'X-Shopify-Shop-Domain': 'test.myshopify.com',
      },
    });
    // Should not throw
    await handleProductsMessage('{}');
  });
});

describe('handleProductsBulkMessage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws on invalid JSON', async () => {
    vi.mocked(parseJsonSafe).mockReturnValue(null);
    await expect(handleProductsBulkMessage('bad')).rejects.toThrow('Invalid SQS JSON body');
  });

  it('throws when shop domain is missing', async () => {
    vi.mocked(parseJsonSafe).mockReturnValue({
      detail: { meta: {}, data: [] },
    });
    await expect(handleProductsBulkMessage('{}')).rejects.toThrow('Missing shop domain');
  });

  it('skips empty bulk data', async () => {
    vi.mocked(parseJsonSafe).mockReturnValue({
      detail: {
        meta: { shop: 'test.myshopify.com', topic: 'products/bulk' },
        data: [],
      },
    });
    // Should not throw
    await handleProductsBulkMessage('{}');
  });
});
