// src/handlers/checkouts.sqs.ts
import { parseJsonSafe } from '@repo/event-toolkit';
import { prisma } from '../db/prisma';
import { adaptCheckout } from '../adapters/checkout.webhook.adapter';
import { logger, timer } from '@repo/logger';

// ---
// Main Handler
// ---

/**
 * Handles Shopify checkout webhooks (checkouts/create, checkouts/update)
 */
export async function handleCheckoutsMessage(messageBody: string) {
  const t = timer();
  const env = parseJsonSafe<any>(messageBody);
  if (!env) throw new Error('Invalid SQS JSON body');

  const payload = env?.detail?.payload;
  const shop = env?.detail?.metadata?.['X-Shopify-Shop-Domain'];
  const topic = env?.detail?.metadata?.['X-Shopify-Topic'] || 'checkouts/unknown';

  const logCtx = { topic };

  if (!shop) {
    logger.warn(
      {
        event: 'checkouts.missing_shop',
        data: { ...logCtx, env },
      },
      'Missing shop domain',
    );
    return;
  }

  if (!payload) {
    logger.warn(
      {
        event: 'checkouts.missing_payload',
        shopId: shop,
        data: logCtx,
      },
      'Missing payload',
    );
    return;
  }

  try {
    const { checkout, lineItems } = adaptCheckout(payload, { shop });
    logger.info(
      { shop, checkoutId: checkout.id, status: checkout.status, topic },
      'Processing checkout',
    );

    // Upsert checkout and its line items
    await prisma.checkout.upsert({
      where: { id: checkout.id },
      create: {
        ...checkout,
        lineItems: {
          createMany: { data: lineItems, skipDuplicates: true },
        },
      },
      update: {
        completedAt: checkout.completedAt,
        status: checkout.status,
      },
    });

    logger.info(
      {
        event: 'checkouts.saved',
        shopId: shop,
        data: {
          checkoutId: checkout.id,
          lineItemsCount: lineItems.length,
        },
      },
      'Saved checkout',
    );

    t.done('checkouts.process', 'Checkout processed successfully');
  } catch (err) {
    logger.error(
      {
        event: 'checkouts.process_failed',
        error: err as Error,
        shopId: shop,
        data: logCtx,
      },
      'Failed to process checkout',
    );
  }
}
