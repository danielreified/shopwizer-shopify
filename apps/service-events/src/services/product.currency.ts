import { prisma } from '../db/prisma';
import { logger } from '@repo/logger';

export async function getShopCurrency(domain: string): Promise<string> {
  if (!domain) return 'USD';

  try {
    const shop = await prisma.shop.findUnique({
      where: { domain },
      select: { currency: true },
    });
    return shop?.currency ?? 'USD';
  } catch (err) {
    logger.warn({ shop: domain }, `Failed to fetch currency`);
    return 'USD';
  }
}
