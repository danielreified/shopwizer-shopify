import { z } from 'zod';

const LineItem = z.object({
  key: z.string().nullable().optional(),
  id: z.number().nullable().optional(),
  product_id: z.number().nullable().optional(),
  variant_id: z.number().nullable().optional(),
  quantity: z.number().int().default(1),
  price: z.union([z.string(), z.number()]).optional(),
  variant_price: z.union([z.string(), z.number()]).optional(),
});

const CheckoutPayload = z.object({
  id: z.number(),
  completed_at: z.string().nullable().optional(),
  abandoned_checkout_url: z.string().nullable().optional(),
  line_items: z.array(LineItem).default([]),
  currency: z.string().nullable().optional(),
});

export type TCheckoutAdapted = {
  checkout: {
    id: string;
    shopId: string;
    completedAt?: Date | null;
    abandonedCheckoutUrl?: string | null;
    status: 'PENDING' | 'COMPLETED';
  };
  lineItems: {
    id: string;
    productId?: string | null;
    variantId?: string | null;
    quantity: number;
    price: number;
  }[];
};

export function adaptCheckout(raw: unknown, meta: { shop: string }): TCheckoutAdapted {
  const data = CheckoutPayload.parse(raw);
  const checkoutId = String(data.id);

  const checkout = {
    id: checkoutId,
    shopId: meta.shop,
    completedAt: data.completed_at ? new Date(data.completed_at) : null,
    abandonedCheckoutUrl: data.abandoned_checkout_url ?? null,
    status: data.completed_at ? 'COMPLETED' : 'PENDING',
  } as const;

  const lineItems = (data.line_items ?? []).map((item) => ({
    id: String(item.key ?? item.id ?? crypto.randomUUID()),
    productId: item.product_id ? String(item.product_id) : null,
    variantId: item.variant_id ? String(item.variant_id) : null,
    quantity: item.quantity ?? 1,
    price: parseFloat(String(item.price ?? item.variant_price ?? '0')),
  }));

  return { checkout, lineItems };
}
