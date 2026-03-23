import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { publish, Sources, DetailTypes } from "@repo/event-contracts";
import { logger } from "@repo/logger";

/**
 * Async cleanup function - runs after response is sent
 */
async function processUninstall(
  shopId: string,
  shopEmail: string | null,
  shopName: string | null
) {
  logger.info({ shop: shopId }, "Starting uninstall cleanup");

  try {
    // Delete synced product-related data
    await prisma.product.deleteMany({ where: { shopId } });
    await prisma.productEmbedding.deleteMany({ where: { shopId } });
    await prisma.productAttributesEmbedding.deleteMany({ where: { shopId } });
    await prisma.productFeature.deleteMany({ where: { shopId } });
    await prisma.productGraph.deleteMany({ where: { shopId } });

    // Delete analytics
    await prisma.railMetric.deleteMany({ where: { shopId } });

    // Delete orders + items
    await prisma.orderLineItem.deleteMany({ where: { shopId } });
    await prisma.order.deleteMany({ where: { shopId } });

    // Delete jobs
    await prisma.job.deleteMany({ where: { shopId } });

    // Delete shop support tables (so they're recreated fresh on reinstall)
    await prisma.shopOnboarding.deleteMany({ where: { shopId } });
    await prisma.shopStatus.deleteMany({ where: { shopId } });
    await prisma.shopSettings.deleteMany({ where: { shopId } });
    await prisma.shopIntegration.deleteMany({ where: { shopId } });

    logger.info({ shop: shopId }, "Uninstall cleanup complete");

    // Send uninstall notification email
    if (shopEmail) {
      logger.info({ shop: shopId, to: shopEmail }, "Publishing UNINSTALL email event");
      await publish({
        source: Sources.SERVICE_APP,
        detailType: DetailTypes.EMAIL_SEND,
        detail: {
          type: "UNINSTALL",
          to: shopEmail,
          data: {
            shopName: shopName ?? shopId,
          },
        },
      });
      logger.info({ shop: shopId }, "UNINSTALL email event published");
    }
  } catch (err) {
    logger.error({ shop: shopId, error: err }, "Async cleanup failed");
  }
}

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, session, topic } = await authenticate.webhook(request);

  logger.info({ shop, topic }, "Received webhook");

  const shopId = shop.toLowerCase();

  // Get shop record + settings to check if already processed (idempotency)
  const shopRecord = await prisma.shop.findUnique({
    where: { id: shopId },
    select: {
      name: true,
      isActive: true,
      shopSettings: {
        select: { contactEmail: true, contactName: true },
      },
    },
  });

  // Idempotency: If shop is already inactive, skip duplicate processing
  if (shopRecord && !shopRecord.isActive) {
    logger.warn({ shop: shopId }, "Shop already inactive, skipping duplicate webhook");
    return new Response();
  }

  // Get contact info from ShopSettings (fallback to shopId for name)
  const contactEmail = shopRecord?.shopSettings?.contactEmail ?? null;
  const contactName = shopRecord?.shopSettings?.contactName ?? shopRecord?.name ?? null;

  // 1. Delete Shopify auth sessions immediately (required for security)
  if (session) {
    await prisma.session.deleteMany({ where: { shop: shopId } });
  }

  // 2. Mark shop as uninstalled immediately (for idempotency)
  await prisma.shop.update({
    where: { id: shopId },
    data: {
      isActive: false,
      uninstalledAt: new Date(),
    },
  });

  // 3. Fire and forget async cleanup (don't await)
  // This runs after we return the response to Shopify
  processUninstall(shopId, contactEmail, contactName);

  // Return immediately to prevent Shopify webhook retry
  logger.info({ shop: shopId }, "Returning 200, cleanup running async");
  return new Response();
};
