import {
  ENRICH_EVENT_TYPE,
  SHOP_SYNC_EVENT_TYPE,
  Sources,
  DetailTypes,
  publish,
} from '@repo/event-contracts';
import { logger } from '@repo/logger';
import type { NormalizedCategory } from './product.category.resolution';

// ---
// Enrichment Event
// ---

interface EnrichmentInput {
  productId: string;
  shop: string;
  forceEnrich: boolean;
  enriched: any;
  category: NormalizedCategory;
  collectionTitles: string[];
  gender: string[];
  ageGroup: string[];
  colors: any[];
}

export async function publishEnrichmentEvent(input: EnrichmentInput): Promise<void> {
  const payload = {
    type: ENRICH_EVENT_TYPE,
    meta: {
      productId: input.productId,
      shop: input.shop,
      version: 1,
      forceEnrich: input.forceEnrich,
    },
    data: {
      title: input.enriched.title ?? '',
      descriptionHtml: input.enriched.descriptionHtml ?? '',
      vendor: input.enriched.vendor ?? null,
      productType: input.enriched.productType ?? null,
      tags: Array.isArray(input.enriched.tags) ? input.enriched.tags : [],
      category: input.category,
      collections: input.collectionTitles,
      gender: input.gender,
      ageGroup: input.ageGroup,
      colors: input.colors,
      handle: input.enriched.handle ?? null,
    },
  };

  await publish({
    source: Sources.SERVICE_EVENTS,
    detailType: DetailTypes.PRODUCT_ENRICH,
    detail: payload,
  });
}

// ---
// Sync Complete Forwarding
// ---

export function forwardSyncComplete(shop: string, payload: any): void {
  if (payload?.type !== SHOP_SYNC_EVENT_TYPE) {
    logger.warn(
      { shop, expected: SHOP_SYNC_EVENT_TYPE, received: payload?.type },
      'Invalid payload type for sync-complete',
    );
    return;
  }

  // Schedule the forward with a delay - NON-BLOCKING so we don't hang the service
  // This ensures products have time to be processed before sync complete arrives
  const DELAY_SECONDS = 60;

  logger.info(
    { shop, delaySeconds: DELAY_SECONDS },
    'Scheduling SHOP_SYNC_COMPLETE forward to service-enrich',
  );

  setTimeout(async () => {
    try {
      logger.info({ shop }, 'Forwarding SHOP_SYNC_COMPLETE to service-enrich');

      await publish({
        source: Sources.SERVICE_EVENTS,
        detailType: DetailTypes.PRODUCT_ENRICH,
        detail: {
          type: SHOP_SYNC_EVENT_TYPE,
          meta: {
            shop,
            completedAt: payload.meta?.completedAt,
          },
        },
      });

      logger.info({ shop }, 'SHOP_SYNC_COMPLETE forwarded successfully');
    } catch (err) {
      logger.error({ shop, err }, 'Failed to forward SHOP_SYNC_COMPLETE');
    }
  }, DELAY_SECONDS * 1000);
}
