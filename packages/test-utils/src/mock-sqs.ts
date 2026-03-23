interface SQSMessageOptions {
  shop?: string;
  topic?: string;
  payload?: Record<string, unknown>;
}

/**
 * Create a mock SQS message body string (JSON-encoded).
 */
export function createMockSQSMessage(opts: SQSMessageOptions = {}): string {
  const { shop = 'test-shop.myshopify.com', topic = 'products/update', payload = {} } = opts;

  return JSON.stringify({
    headers: {
      'X-Shopify-Topic': topic,
      'X-Shopify-Shop-Domain': shop,
    },
    body: payload,
  });
}

/**
 * Create a mock Shopify product webhook payload.
 */
export function createMockProductWebhook(overrides: Record<string, unknown> = {}): string {
  return createMockSQSMessage({
    topic: 'products/create',
    payload: {
      id: 1234567890,
      title: 'Test Product',
      handle: 'test-product',
      vendor: 'Test Vendor',
      product_type: 'Shoes',
      status: 'active',
      tags: 'tag1, tag2',
      body_html: '<p>Test description</p>',
      variants: [
        {
          id: 111,
          title: 'Default',
          price: '29.99',
          sku: 'TEST-001',
          position: 1,
        },
      ],
      images: [
        {
          id: 222,
          src: 'https://cdn.shopify.com/test.jpg',
          alt: 'Test image',
          width: 800,
          height: 600,
          position: 1,
        },
      ],
      options: [{ name: 'Size', values: ['S', 'M', 'L'] }],
      ...overrides,
    },
  });
}
