import { z } from 'zod';

const LineItem = z.object({
  id: z.number().nullable().optional(),
  admin_graphql_api_id: z.string(),
  product_id: z.number().nullable().optional(),
  variant_id: z.number().nullable().optional(),
  quantity: z.number().int().default(1),
  price: z.union([z.string(), z.number()]).optional(),
  properties: z
    .array(
      z.object({
        name: z.string(),
        value: z.string().nullable().optional(),
      }),
    )
    .optional(),
});

const OrderPayload = z.object({
  id: z.number(),
  admin_graphql_api_id: z.string(),
  checkout_id: z.number().nullable().optional(),
  total_price: z.union([z.string(), z.number()]).optional(),
  currency: z.string().nullable().optional(),
  processed_at: z.string().nullable().optional(),
  line_items: z.array(LineItem).default([]),
});

export type TOrderAdapted = {
  order: {
    id: string;
    shopId: string;
    shopifyGid: string;
    checkoutId?: string | null;
    totalPrice: number;
    currency: string;
    processedAt?: Date | null;
  };
  lineItems: {
    id: string;
    shopifyGid: string;
    productId?: string | null;
    variantId?: string | null;
    quantity: number;
    price: number;
    properties: { name: string; value: string | null | undefined }[];
  }[];
};

export function adaptOrder(raw: unknown, meta: { shop: string }): TOrderAdapted {
  const data = OrderPayload.parse(raw);
  const orderId = String(data.id);

  const order = {
    id: orderId,
    shopId: meta.shop,
    shopifyGid: data.admin_graphql_api_id, // <-- STRICT REQUIRED
    checkoutId: data.checkout_id ? String(data.checkout_id) : null,
    totalPrice: parseFloat(String(data.total_price ?? '0')),
    currency: data.currency ?? 'USD',
    processedAt: data.processed_at ? new Date(data.processed_at) : null,
  };

  const lineItems = (data.line_items ?? []).map((item) => ({
    id: String(item.id), // Shopify always provides this on orders
    shopifyGid: item.admin_graphql_api_id, // <-- STRICT REQUIRED
    productId: item.product_id ? String(item.product_id) : null,
    variantId: item.variant_id ? String(item.variant_id) : null,
    quantity: item.quantity ?? 1,
    price: parseFloat(String(item.price ?? '0')),
    properties: (item.properties ?? []).map((prop) => ({
      name: prop.name,
      value: prop.value ?? null,
    })),
  }));

  return { order, lineItems };
}
