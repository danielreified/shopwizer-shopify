import { publish, Sources, DetailTypes } from '@repo/event-contracts';
import { prisma } from '../db/prisma';
import { logger } from '@repo/logger';
import type { EmailType } from '@prisma/client';

// ---
// Configuration
// ---

const USAGE_THRESHOLDS: Array<{ threshold: number; emailType: EmailType }> = [
  { threshold: 100.1, emailType: 'USAGE_CAPPED' },
  { threshold: 100, emailType: 'USAGE_100' },
  { threshold: 90, emailType: 'USAGE_90' },
  { threshold: 80, emailType: 'USAGE_80' },
];

// Map internal EmailType to fn-email Lambda types
const EMAIL_TYPE_MAP: Record<string, string> = {
  USAGE_80: 'USAGE_APPROACHING',
  USAGE_90: 'USAGE_APPROACHING',
  USAGE_100: 'USAGE_CAPPED',
  USAGE_CAPPED: 'USAGE_CAPPED',
};

// ---
// Helpers
// ---

function getStartOfMonth(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

async function wasAlertSentThisMonth(shopId: string, emailType: EmailType): Promise<boolean> {
  const existing = await prisma.emailLog.findFirst({
    where: {
      shopId,
      type: emailType,
      sentAt: { gte: getStartOfMonth() },
    },
  });
  return !!existing;
}

async function sendUsageAlert(
  shopId: string,
  emailType: EmailType,
  shopEmail: string,
  usage: { current: number; limit: number; percentage: number },
): Promise<void> {
  const emailLambdaType = EMAIL_TYPE_MAP[emailType];

  if (!emailLambdaType) {
    logger.warn({ emailType }, 'No emailLambdaType mapping found');
    return;
  }

  try {
    logger.info(
      {
        type: emailLambdaType,
        to: shopEmail,
        shopId,
        usage,
      },
      'Publishing email event to EventBridge',
    );

    await publish({
      source: Sources.SERVICE_EVENTS,
      detailType: DetailTypes.EMAIL_SEND,
      detail: {
        type: emailLambdaType,
        to: shopEmail,
        data: {
          shopId,
          usagePercent: usage.percentage,
          currentOrders: usage.current,
          orderLimit: usage.limit,
        },
      },
    });

    logger.info({ shopId, emailLambdaType }, 'Email event published successfully');
  } catch (err) {
    logger.error({ shopId, err }, 'Failed to publish email event');
  }
}

// ---
// Main
// ---

export async function checkUsageThresholds(shopId: string): Promise<void> {
  logger.info({ shopId }, 'Checking usage thresholds');

  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    select: {
      email: true,
      shopSettings: {
        select: { contactEmail: true },
      },
      subscriptions: {
        where: { status: 'ACTIVE' },
        take: 1,
        include: { appPlan: true },
      },
    },
  });

  // Use ShopSettings.contactEmail, fallback to shop.email
  const contactEmail = shop?.shopSettings?.contactEmail ?? shop?.email;

  if (!contactEmail) {
    logger.debug({ shopId }, 'No contact email found - skipping threshold check');
    return;
  }

  const subscription = shop!.subscriptions[0];
  const monthlyLimit = subscription?.appPlan?.monthlyOrderLimit;

  if (!monthlyLimit) {
    logger.debug(
      { shopId, plan: subscription?.appPlan?.name },
      'No monthly limit (unlimited plan)',
    );
    return;
  }

  const billableOrderCount = await prisma.order.count({
    where: {
      shopId,
      isBillable: true,
      processedAt: { gte: getStartOfMonth() },
    },
  });

  const usagePercentage = (billableOrderCount / monthlyLimit) * 100;
  const usage = {
    current: billableOrderCount,
    limit: monthlyLimit,
    percentage: Math.round(usagePercentage),
  };

  logger.info({ shopId, usage }, 'Current usage calculated');

  // Check thresholds from highest to lowest
  for (const { threshold, emailType } of USAGE_THRESHOLDS) {
    if (usagePercentage >= threshold) {
      const alreadySent = await wasAlertSentThisMonth(shopId, emailType);

      if (!alreadySent) {
        logger.info(
          { shopId, threshold, emailType, contactEmail },
          'Usage threshold reached - sending alert',
        );
        await sendUsageAlert(shopId, emailType, contactEmail, usage);
      } else {
        logger.debug({ shopId, emailType }, 'Alert already sent this month');
      }
      break; // Only log the highest threshold reached
    }
  }
}
