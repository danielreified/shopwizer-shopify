import { parseJsonSafe } from '@repo/event-toolkit';
import {
  EnrichPayloadSchema,
  ENRICH_EVENT_TYPE,
  SHOP_SYNC_EVENT_TYPE,
  ShopSyncPayloadSchema,
  Sources,
  DetailTypes,
  publish,
  type EnrichPayload,
} from '@repo/event-contracts';
import { handleEnrichPipeline } from '../router/enrich.router';
import { logger, timer } from '@repo/logger';
import { prisma } from '../db/prisma';

export async function handleEnrichMessage(messageBody: string) {
  const t = timer();

  // ---------------------------
  // 1) Parse & validate payload
  // ---------------------------
  const raw = parseJsonSafe<unknown>(messageBody);
  if (!raw) {
    logger.error(
      { error: new Error('Invalid JSON'), messageBody: messageBody.substring(0, 200) },
      'Invalid SQS body (JSON parsing failed)',
    );
    throw new Error('Invalid SQS body (JSON parsing failed)');
  }

  // Handle EventBridge envelope format (events come wrapped in 'detail')
  const rawObj = raw as any;
  const payload = rawObj?.detail ?? rawObj;

  // Check if this is a SHOP_SYNC_COMPLETE event
  // Only process if it came FROM service-events (not directly from fn-bulk-products)
  const eventSource = rawObj?.source ?? '';
  if (payload?.type === SHOP_SYNC_EVENT_TYPE) {
    if (!eventSource.includes('service-events')) {
      logger.debug(
        { eventSource },
        'Ignoring SHOP_SYNC_COMPLETE - waiting for service-events forwarded version',
      );
      return;
    }
    return handleShopSyncComplete(payload);
  }

  // Otherwise, treat as ENRICH_PRODUCT
  const parsed = EnrichPayloadSchema.safeParse(payload);

  if (!parsed.success) {
    logger.warn({ errors: parsed.error.flatten() }, 'Invalid enrich payload');
    return;
  }

  const msg: EnrichPayload = parsed.data;

  if (msg.type !== ENRICH_EVENT_TYPE) {
    logger.warn({ type: msg.type }, 'Unknown event type');
    return;
  }

  const { meta, data } = msg;

  logger.info(
    {
      shop: meta.shop,
      productId: meta.productId,
      version: meta.version ?? 0,
      forceEnrich: meta.forceEnrich ?? false,
    },
    'Processing enrich request',
  );

  // ---------------------------
  // 2) Execute pipeline
  // ---------------------------
  try {
    await handleEnrichPipeline({
      shop: meta.shop,
      productId: String(meta.productId),
      data: data,
      forceEnrich: meta.forceEnrich ?? false,
    });

    t.done('enrich.pipeline_complete', 'Enrichment pipeline completed', {
      data: { shop: meta.shop, productId: meta.productId },
    });
  } catch (err) {
    logger.error(
      {
        error: err,
        shop: meta.shop,
        productId: meta.productId,
      },
      'Enrichment pipeline failed',
    );
  }
}

/**
 * Handle SHOP_SYNC_COMPLETE event - update ShopStatus.productSyncState to COMPLETED
 */
async function handleShopSyncComplete(raw: any) {
  const parsed = ShopSyncPayloadSchema.safeParse(raw);

  if (!parsed.success) {
    logger.warn({ errors: parsed.error.flatten() }, 'Invalid SHOP_SYNC_COMPLETE payload');
    return;
  }

  const { meta } = parsed.data;

  logger.info(
    {
      shop: meta.shop,
      completedAt: meta.completedAt,
    },
    'SHOP_SYNC_COMPLETE received',
  );

  try {
    // Upsert ShopStatus with productSyncState = COMPLETED
    await prisma.shopStatus.upsert({
      where: { shopId: meta.shop },
      create: {
        shopId: meta.shop,
        productSyncState: 'COMPLETED',
        productSyncEnded: new Date(),
      },
      update: {
        productSyncState: 'COMPLETED',
        productSyncEnded: new Date(),
      },
    });

    // Advance onboarding step from SYNC_PRODUCTS to SYNC_ORDERS
    await prisma.shopOnboarding.updateMany({
      where: {
        shopId: meta.shop,
        step: 'SYNC_PRODUCTS',
      },
      data: { step: 'SYNC_ORDERS' },
    });

    logger.info(
      { shop: meta.shop },
      'ShopStatus updated to COMPLETED, onboarding advanced to SYNC_ORDERS',
    );

    // Send completion email to shop owner
    await sendSyncCompleteEmail(meta.shop, meta.completedAt);
  } catch (err) {
    logger.error({ error: err, shop: meta.shop }, 'Failed to update shop sync status');
  }
}

/**
 * Send sync complete email notification to shop owner
 */
async function sendSyncCompleteEmail(shopDomain: string, completedAt?: string) {
  try {
    // Fetch shop details with settings for contact email
    const shop = await prisma.shop.findUnique({
      where: { domain: shopDomain },
      select: {
        id: true,
        email: true,
        name: true,
        shopSettings: {
          select: { contactEmail: true, contactName: true },
        },
      },
    });

    // Use ShopSettings.contactEmail, fallback to shop.email
    const contactEmail = shop?.shopSettings?.contactEmail ?? shop?.email;
    const contactName = shop?.shopSettings?.contactName ?? shop?.name;

    if (!contactEmail || !shop) {
      logger.debug(
        { shop: shopDomain },
        'No contact email found - skipping sync complete notification',
      );
      return;
    }

    // Get product count
    const productCount = await prisma.product.count({
      where: { shopId: shop.id },
    });

    logger.info(
      {
        to: contactEmail,
        shop: contactName || shopDomain,
        productCount,
      },
      'Sending SYNC_COMPLETE email',
    );

    await publish({
      source: Sources.SERVICE_EVENTS,
      detailType: DetailTypes.EMAIL_SEND,
      detail: {
        type: 'SYNC_COMPLETE',
        to: contactEmail,
        data: {
          shopName: contactName || shopDomain,
          productCount: String(productCount),
          completedAt: completedAt || new Date().toISOString(),
        },
      },
    });

    logger.info({ shop: shopDomain, productCount }, 'SYNC_COMPLETE email published');
  } catch (err) {
    logger.error({ error: err, shop: shopDomain }, 'Failed to send sync complete email');
  }
}
