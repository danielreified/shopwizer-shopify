import prisma from "../db.server";
import { differenceInDays } from "date-fns";

/* ----------------------------
 * PLAN
 * ---------------------------- */
export async function getShopPlan(shopId: string) {
  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    select: {
      id: true,
      subscriptions: {
        where: { status: "ACTIVE" },
        take: 1,
      },
    },
  });

  if (!shop) return "FREE";
  if (shop.subscriptions.length > 0) {
    return shop.subscriptions[0].name ?? "PAID";
  }
  return "FREE";
}

/* ----------------------------
 * TRIAL DAYS LEFT
 * ---------------------------- */
export async function getTrialDaysLeft(shopId: string) {
  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    select: { trialEndsAt: true },
  });

  if (!shop?.trialEndsAt) return 0;

  return Math.max(0, differenceInDays(shop.trialEndsAt, new Date()));
}

/* ----------------------------
 * ORDERS THIS BILLING CYCLE
 * ---------------------------- */
export async function getOrdersThisMonth(shopId: string) {
  const now = new Date();
  const billingMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  return prisma.order.count({
    where: {
      shopId,
      isBillable: true,
      isBulk: false,
      createdAt: { gte: billingMonthStart },
    },
  });
}

/* ----------------------------
 * PRODUCT COUNT
 * ---------------------------- */
export async function getProductCount(shopId: string) {
  return prisma.product.count({
    where: { shopId },
  });
}

/* ----------------------------
 * ORDER LIMIT (from active plan)
 * ---------------------------- */
export async function getOrderLimit(shopId: string): Promise<number | null> {
  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    select: {
      id: true,
      subscriptions: {
        where: { status: "ACTIVE" },
        take: 1,
        include: { appPlan: true },
      },
    },
  });

  const plan = shop?.subscriptions?.[0]?.appPlan;
  return plan?.monthlyOrderLimit ?? null;
}
