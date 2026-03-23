// src/handlers/orders.sqs.ts
import { parseJsonSafe } from '@repo/event-toolkit';
import { prisma } from '../db/prisma';
import { adaptOrder } from '../adapters/order.webhook.adapter';
import { normalizeToUSD } from '../utils/currency';
import { checkUsageThresholds } from '../services/usage.alerts';
import { logger, timer } from '@repo/logger';

// ---
// Attribution Calculation
// ---

interface Attribution {
  totalValue: number;
  totalItems: number;
  shopwiseItems: number;
  shopwiseValue: number;
}

function calculateShopwiseAttribution(orderPayload: any): Attribution {
  const attribution: Attribution = {
    totalValue: 0,
    totalItems: 0,
    shopwiseItems: 0,
    shopwiseValue: 0,
  };

  const lineItems = orderPayload.line_items || [];
  logger.debug({ lineItemCount: lineItems.length }, 'Checking line items for attribution');

  for (const item of lineItems) {
    const props = item.properties || [];
    const isShopwizer = props.some((p: any) => p?.name === '_shopwizer');

    if (!isShopwizer) continue;

    const qty = Number(item.quantity || 1);
    const subtotal = Number(item.price) * qty;

    attribution.totalValue += subtotal;
    attribution.totalItems += qty;
    attribution.shopwiseItems += qty;
    attribution.shopwiseValue += subtotal;
  }

  if (attribution.shopwiseItems > 0) {
    logger.info({ attribution }, 'Shopwise attribution calculated');
  }

  return attribution;
}

// ---
// Line Items Processing
// ---

async function processLineItems(lineItems: any[], payload: any, order: any): Promise<any[]> {
  // Batch-fetch all product categories to avoid N+1 queries
  const productIds = lineItems.filter((li) => li.productId).map((li) => BigInt(li.productId));

  const categoryMap = new Map<string, string | null>();
  if (productIds.length > 0) {
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, categoryId: true },
    });
    for (const p of products) {
      categoryMap.set(p.id.toString(), p.categoryId);
    }
  }

  return Promise.all(
    lineItems.map(async (li) => {
      const rawLine = payload.line_items.find((x: any) => String(x.id) === String(li.id));

      const props = rawLine?.properties ?? [];
      const isAttributed = props.some((p: any) => p?.name === '_shopwizer');
      const categoryId = li.productId ? (categoryMap.get(String(li.productId)) ?? null) : null;

      return {
        ...li,
        attributed: isAttributed,
        priceUsd: await normalizeToUSD(li.price, order.currency),
        shopifyGid: rawLine?.admin_graphql_api_id,
        categoryId,
      };
    }),
  );
}

// ---
// Main Handler
// ---

export async function handleOrdersMessage(messageBody: string) {
  const env = parseJsonSafe<any>(messageBody);
  if (!env) throw new Error('Invalid SQS JSON body');

  const payload = env?.detail?.payload;
  const shop = env?.detail?.metadata?.['X-Shopify-Shop-Domain'];

  if (!shop || !payload) {
    logger.warn('Missing shop or payload');
    return;
  }

  const logCtx = { shop };

  try {
    const { order, lineItems } = adaptOrder(payload, { shop });
    logger.info(logCtx, `Processing order ${order.id}`);

    // Calculate attribution
    const attribution = calculateShopwiseAttribution(payload);
    const attributedUsd =
      attribution.totalValue > 0 ? await normalizeToUSD(attribution.totalValue, order.currency) : 0;

    // Check if order is billable (shop is past trial period)
    const shopRecord = await prisma.shop.findUnique({
      where: { id: order.shopId },
      select: { trialEndsAt: true },
    });
    const isBillable = !shopRecord?.trialEndsAt || new Date() > shopRecord.trialEndsAt;

    // Process line items with attribution and category
    const processedLineItems = await processLineItems(lineItems, payload, order);

    // Compute USD price once
    const totalPriceUsd = await normalizeToUSD(order.totalPrice, order.currency);

    // Build shared order data
    const orderData = {
      totalPrice: order.totalPrice,
      totalPriceUsd,
      totalAttributedPrice: attribution.totalValue,
      totalAttributedPriceUsd: attributedUsd,
      processedAt: order.processedAt,
      isBillable,
    };

    // Upsert the order
    await prisma.order.upsert({
      where: {
        id_shopId: {
          id: BigInt(order.id),
          shopId: order.shopId,
        },
      },
      create: {
        id: BigInt(order.id),
        shopId: order.shopId,
        shopifyGid: order.shopifyGid,
        checkoutId: order.checkoutId,
        currency: order.currency,
        ...orderData,
      },
      update: orderData,
    });

    // Insert line items
    await prisma.orderLineItem.createMany({
      data: processedLineItems.map((li) => ({
        id: BigInt(li.id),
        shopId: order.shopId,
        shopifyGid: li.shopifyGid,
        orderId: BigInt(order.id),
        productId: li.productId ? BigInt(li.productId) : null,
        variantId: li.variantId ? BigInt(li.variantId) : null,
        categoryId: li.categoryId,
        quantity: li.quantity,
        price: li.price,
        priceUsd: li.priceUsd,
        attributed: li.attributed,
      })),
      skipDuplicates: true,
    });

    // Complete linked checkout
    if (order.checkoutId) {
      await prisma.checkout.updateMany({
        where: { id: order.checkoutId, shopId: order.shopId },
        data: { status: 'COMPLETED', completedAt: new Date() },
      });
    }

    // Check usage thresholds
    await checkUsageThresholds(order.shopId);

    logger.info(logCtx, `Saved order ${order.id}`);
  } catch (err) {
    logger.error({ ...logCtx, error: err }, 'Failed to process order');
  }
}
