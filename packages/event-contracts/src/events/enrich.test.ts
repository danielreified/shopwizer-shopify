import { describe, it, expect } from 'vitest';
import { EnrichPayloadSchema, safeParseEnrich, ENRICH_EVENT_TYPE } from './enrich';

const validPayload = {
  type: ENRICH_EVENT_TYPE,
  meta: {
    productId: '123',
    shop: 'test-shop.myshopify.com',
    version: 1,
  },
  data: {
    title: 'Test Product',
    tags: ['tag1'],
  },
};

describe('EnrichPayloadSchema', () => {
  it('accepts a valid payload', () => {
    const result = EnrichPayloadSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it('rejects missing type', () => {
    const result = EnrichPayloadSchema.safeParse({ ...validPayload, type: undefined });
    expect(result.success).toBe(false);
  });

  it('rejects wrong type literal', () => {
    const result = EnrichPayloadSchema.safeParse({ ...validPayload, type: 'WRONG' });
    expect(result.success).toBe(false);
  });

  it('rejects missing meta.productId', () => {
    const result = EnrichPayloadSchema.safeParse({
      ...validPayload,
      meta: { shop: 'test.myshopify.com', version: 1 },
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing data.title', () => {
    const result = EnrichPayloadSchema.safeParse({
      ...validPayload,
      data: {},
    });
    expect(result.success).toBe(false);
  });

  it('applies defaults for optional fields', () => {
    const result = EnrichPayloadSchema.safeParse(validPayload);
    if (result.success) {
      expect(result.data.meta.forceEnrich).toBe(false);
      expect(result.data.data.tags).toEqual(['tag1']);
    }
  });

  it('accepts full payload with optional fields', () => {
    const full = {
      ...validPayload,
      meta: { ...validPayload.meta, forceEnrich: true },
      data: {
        ...validPayload.data,
        vendor: 'Test Vendor',
        productType: 'Shoes',
        collections: ['Collection A'],
        descriptionHtml: '<p>desc</p>',
        handle: 'test-product',
        category: { id: '123', name: 'Shoes', fullName: 'Apparel > Shoes' },
        gender: ['male'],
        ageGroup: ['adult'],
      },
    };
    const result = EnrichPayloadSchema.safeParse(full);
    expect(result.success).toBe(true);
  });
});

describe('safeParseEnrich', () => {
  it('returns parsed data for valid input', () => {
    const result = safeParseEnrich(validPayload);
    expect(result.type).toBe(ENRICH_EVENT_TYPE);
    expect(result.meta.productId).toBe('123');
  });

  it('throws on invalid input', () => {
    expect(() => safeParseEnrich({})).toThrow('Invalid ENRICH_PRODUCT payload');
  });

  it('throws on null input', () => {
    expect(() => safeParseEnrich(null)).toThrow();
  });
});
