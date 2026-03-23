import { z } from 'zod';

export const SHOP_SYNC_EVENT_TYPE = 'SHOP_SYNC_COMPLETE' as const;

/**
 * Event sent after bulk product upload completes.
 * Triggers update of ShopStatus.productSyncState to COMPLETED.
 */
export const ShopSyncPayloadSchema = z.object({
  type: z.literal(SHOP_SYNC_EVENT_TYPE),
  meta: z.object({
    /** Shop domain, e.g. "example.myshopify.com" */
    shop: z.string(),
    /** Timestamp when sync completed */
    completedAt: z.string().optional(),
  }),
});

export type ShopSyncPayload = z.infer<typeof ShopSyncPayloadSchema>;
