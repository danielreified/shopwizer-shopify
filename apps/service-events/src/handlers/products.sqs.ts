// src/handlers/products.sqs.ts
import { parseJsonSafe } from '@repo/event-toolkit';
import { prisma } from '../db/prisma';
import { runTransforms } from '../transformers';
import { addVariantColors } from '../transformers/colors';
import type { TProductUpsertEvent } from '../types/product';

import { adaptBulk } from '../adapters/product.bulk.adapter';
import { adaptWebhook } from '../adapters/product.webhook.adapter';
import { upsertNormalizedProduct } from '../services/product.service';
import { fetchProductAttributes } from '../services/product.attributes';
import { getShopCurrency } from '../services/product.currency';
import { resolveCategory, normalizeCategory } from '../services/product.category.resolution';
import { publishEnrichmentEvent, forwardSyncComplete } from '../services/product.enrichment';
import { logger, timer } from '@repo/logger';
import { SHOP_SYNC_EVENT_TYPE } from '@repo/event-contracts';
import { deleteEnrichStates } from '@repo/ddb';

// ---
// Types
// ---

type CanonTopic = 'products/create' | 'products/update' | 'products/delete' | 'shop/sync-complete';

interface ProductEventContext {
  shop: string;
  topicRaw: string;
  item: any;
  isBulk?: boolean;
  forceEnrich?: boolean;
}

// ---
// Message Parsing
// ---

function readTopic(env: any): string {
  return (
    env?.detail?.metadata?.['X-Shopify-Topic'] ||
    env?.detail?.meta?.topic ||
    env?.headers?.['X-Shopify-Topic'] ||
    env?.topic ||
    ''
  );
}

function readDomain(env: any): string {
  return (
    env?.detail?.metadata?.['X-Shopify-Shop-Domain'] ||
    env?.detail?.meta?.shop_domain ||
    env?.headers?.['X-Shopify-Shop-Domain'] ||
    env?.domain ||
    ''
  );
}

function canonicalizeTopic(raw: string): CanonTopic | null {
  const t = (raw || '').toLowerCase().trim();
  if (t === 'products/create') return 'products/create';
  if (t === 'products/update') return 'products/update';
  if (t === 'products/delete') return 'products/delete';
  if (t === 'shop/sync-complete') return 'shop/sync-complete';
  return null;
}

function extractPayload(env: any): any {
  return env?.detail?.payload ?? env?.payload ?? env?.body ?? env;
}

// ---
// Product Event Handler (Core Logic)
// ---

async function handleProductEvent({
  shop,
  topicRaw,
  item,
  isBulk = false,
  forceEnrich = false,
}: ProductEventContext) {
  const logCtx = { shop, topic: topicRaw, forceEnrich };

  try {
    // 1. Get shop currency and adapt product
    const shopCurrency = await getShopCurrency(shop);
    const event = isBulk
      ? await adaptBulk(item, { shop, topic: topicRaw, currency: shopCurrency })
      : await adaptWebhook(item, { shop, topic: topicRaw, currency: shopCurrency });

    if (!event.product) {
      logger.warn(logCtx, 'Skipping event with missing product');
      return;
    }

    if (!Array.isArray(event.product.variants)) {
      event.product.variants = [];
    }

    // 2. Run transforms (color extraction)
    const enriched = await runTransforms(event.product, [addVariantColors]);

    // 3. Resolve category and attributes in parallel
    const webhookCategory = enriched.category || null;
    const [productCategory, productAttributes] = await Promise.all([
      resolveCategory(topicRaw, enriched, webhookCategory, shop).catch((err) => {
        logger.warn(logCtx, 'Failed to resolve category');
        return null;
      }),
      fetchProductAttributes({ shop, productGid: enriched.gid }).catch((err) => {
        logger.warn(logCtx, 'Failed to fetch attributes');
        return null;
      }),
    ]);

    const finalCategory = normalizeCategory(webhookCategory || productCategory);

    // 4. Extract attributes
    const gender = productAttributes?.gender ?? [];
    const ageGroup = productAttributes?.ageGroup ?? [];
    const collectionTitles = productAttributes?.collectionTitles ?? [];
    const collectionHandles = productAttributes?.collectionHandles ?? [];
    const colors = productAttributes?.colors ?? [];

    // 5. Upsert to database
    const toInsert: TProductUpsertEvent = {
      ...event,
      product: {
        ...enriched,
        collectionHandles,
      },
    };

    const response = await upsertNormalizedProduct(toInsert);

    // 6. Set pipeline state to PROCESSING
    await prisma.product.update({
      where: { id: BigInt(response.productId) },
      data: { pipelineState: 'PROCESSING' },
    });

    // 7. Publish enrichment event
    await publishEnrichmentEvent({
      productId: String(response.productId),
      shop,
      forceEnrich,
      enriched,
      category: finalCategory,
      collectionTitles,
      gender,
      ageGroup,
      colors,
    });

    logger.info(logCtx, `Product ${response.productId} upserted & published`);
  } catch (err) {
    logger.error({ ...logCtx, error: err }, 'Error processing product');
  }
}

// ---
// Delete Handler
// ---

async function handleProductDelete(shop: string, payload: any) {
  const id = payload?.id;

  if (!id) {
    logger.warn({ shop }, 'Missing product id for delete');
    return;
  }

  try {
    const product = await prisma.product.findUnique({
      where: { id },
      select: { id: true, shopId: true },
    });

    if (!product) {
      logger.warn({ shop, productId: id }, 'Product not found for delete');
      return;
    }

    await prisma.$transaction(async (tx) => {
      await tx.productEmbedding.deleteMany({ where: { productId: product.id } });
      await tx.productVariant.deleteMany({ where: { productId: product.id } });
      await tx.productImage.deleteMany({ where: { productId: product.id } });
      await tx.product.delete({ where: { id: product.id } });
    });

    await deleteEnrichStates({ shop, productId: product.id });
    logger.info({ shop }, `Product ${product.id} and related records removed`);
  } catch (err) {
    logger.error({ shop, productId: id, error: err }, 'Failed to delete product');
  }
}

// ---
// Sync Complete Handler
// ---

async function handleSyncComplete(shop: string, payload: any) {
  logger.info({ shop, payloadType: payload?.type }, 'Received SHOP_SYNC_COMPLETE');
  forwardSyncComplete(shop, payload);
}

// ---
// Topic Handlers Map
// ---

const topicHandlers: Record<
  CanonTopic,
  (env: any, shop: string, topicRaw: string) => Promise<void>
> = {
  'products/create': async (env, shop, topicRaw) => {
    const body = extractPayload(env);
    logger.info({ shop, topic: topicRaw }, 'Processing create');
    await handleProductEvent({ shop, topicRaw, item: body });
  },

  'products/update': async (env, shop, topicRaw) => {
    const body = extractPayload(env);
    logger.info({ shop, topic: topicRaw }, 'Processing update');
    await handleProductEvent({ shop, topicRaw, item: body });
  },

  'products/delete': async (env, shop, topicRaw) => {
    const body = extractPayload(env);
    logger.info({ shop, topic: topicRaw }, 'Processing delete');
    await handleProductDelete(shop, body);
  },

  'shop/sync-complete': async (env, shop) => {
    const payload = extractPayload(env);
    logger.info({ shop }, 'Processing sync-complete');
    await handleSyncComplete(shop, payload);
  },
};

// ---
// Main Entry Points
// ---

/**
 * Handle individual product webhook messages
 */
export async function handleProductsMessage(messageBody: string) {
  const env = parseJsonSafe<any>(messageBody);
  if (!env) throw new Error('Invalid SQS JSON body');

  const topicRaw = readTopic(env);
  const topic = canonicalizeTopic(topicRaw);
  const shop = readDomain(env);

  if (!shop) throw new Error('Missing shop domain');

  if (!topic) {
    logger.warn({ shop, topic: topicRaw }, 'Unknown topic');
    return;
  }

  await topicHandlers[topic](env, shop, topicRaw);
}

/**
 * Handle bulk product messages from EventBridge
 */
export async function handleProductsBulkMessage(messageBody: string) {
  const env = parseJsonSafe<any>(messageBody);
  if (!env) throw new Error('Invalid SQS JSON body');

  const detail = env?.detail ?? env;
  const meta = detail?.meta;
  const shop = meta?.shop;
  const topicRaw = meta?.topic ?? 'products/bulk';
  const items = Array.isArray(detail?.data) ? detail.data : [];
  const forceEnrich = meta?.forceEnrich ?? false;

  if (!shop) throw new Error('Missing shop domain');

  logger.info(
    {
      shop,
      topic: topicRaw,
      itemCount: items.length,
      forceEnrich,
      isSyncComplete: detail?.type === 'SHOP_SYNC_COMPLETE',
    },
    'Received bulk message',
  );

  if (!items.length && detail?.type !== 'SHOP_SYNC_COMPLETE') {
    logger.debug({ shop }, 'Empty bulk data - skipping');
    return;
  }

  // Handle explicit sync complete event from fn-bulk-products
  if (detail?.type === 'SHOP_SYNC_COMPLETE') {
    await handleSyncComplete(shop, detail);
    return;
  }

  const t = timer();

  for (const item of items) {
    await handleProductEvent({ shop, topicRaw, item, isBulk: true, forceEnrich });
  }

  t.done('products.bulk_complete', `Processed ${items.length} bulk products`, {
    data: { shop, count: items.length, forceEnrich },
  });
}
