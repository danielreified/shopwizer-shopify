import { z } from 'zod';

export const ENRICH_EVENT_TYPE = 'ENRICH_PRODUCT' as const;

/**
 * Unified enrichment event schema — simplified for v2 pipeline.
 * Upstream services (like `service-events`) no longer specify compute flags.
 * The enrichment worker now decides what to compute internally.
 */
export const EnrichPayloadSchema = z.object({
  type: z.literal(ENRICH_EVENT_TYPE),

  meta: z.object({
    /** Shopify numeric product id as string (NO BigInt in JSON) */
    productId: z.string(),
    /** Shop domain, e.g. "example.myshopify.com" */
    shop: z.string(),
    /** Contract/version of the enrichment recipe */
    version: z.number().int().positive().default(1),
    /** Force re-enrichment even if hashes match (used on reinstall/onboarding) */
    forceEnrich: z.boolean().optional().default(false),
  }),

  data: z.object({
    /** Core text fields for deterministic embedding input */
    title: z.string(),
    vendor: z.string().nullable().optional(),
    productType: z.string().nullable().optional(),
    tags: z.array(z.string()).default([]),
    collections: z.array(z.string()).optional(),
    metafields: z.record(z.string(), z.any()).optional(),
    descriptionHtml: z.string().nullable().optional(),
    handle: z.string().nullable().optional(),
    category: z
      .object({
        id: z.string().nullable(),
        name: z.string().nullable(),
        fullName: z.string().nullable(),
      })
      .nullable()
      .optional(),
    gender: z.array(z.string()).optional(),
    ageGroup: z.array(z.string()).optional(),
  }),
});

export type EnrichPayload = z.infer<typeof EnrichPayloadSchema>;
export type EnrichMeta = EnrichPayload['meta'];
export type EnrichData = EnrichPayload['data'];

/** Runtime validator with nice error messages */
export function safeParseEnrich(input: unknown): EnrichPayload {
  const res = EnrichPayloadSchema.safeParse(input);
  if (!res.success) {
    throw new Error(`Invalid ENRICH_PRODUCT payload: ${res.error.message}`);
  }
  return res.data;
}
