import { prisma } from '../db/prisma';

export async function getAccessToken(shopDomain: string): Promise<string> {
  const shop = await prisma.session.findFirst({
    where: { shop: shopDomain },
    select: { accessToken: true },
  });

  if (!shop?.accessToken) {
    throw new Error(`No access token for shop=${shopDomain}`);
  }

  return shop.accessToken;
}
