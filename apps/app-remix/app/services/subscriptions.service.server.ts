// app/services/subscriptions.server.ts
import prisma from "../db.server";
import { Prisma } from "@prisma/client";

const ACTIVE_SUB_QUERY = `#graphql
{
  appInstallation {
    activeSubscriptions {
      id
      name
      status
      trialDays
      createdAt
      currentPeriodEnd
      lineItems {
        plan {
          pricingDetails {
            __typename
            ... on AppRecurringPricing {
              interval
              price {
                amount
                currencyCode
              }
            }
          }
        }
      }
    }
  }
}
`;

export async function syncShopSubscription(admin: any, shop: string) {
  // --- Fetch from Shopify GraphQL ---
  const resp = await admin.graphql(ACTIVE_SUB_QUERY);
  const json = await resp.json();

  const subs = json?.data?.appInstallation?.activeSubscriptions ?? [];
  const sub = subs[0]; // Shopify allows only 1 active subscription

  if (!sub) return null;

  // Extract price
  const pricing = sub.lineItems?.[0]?.plan?.pricingDetails;
  const amount = pricing?.price?.amount ?? 0;
  const price = new Prisma.Decimal(amount);

  const interval = "EVERY_30_DAYS";

  // --- Check if this is a custom plan ---
  // Try to match by subscription name to an AppPlan
  let isCustom = false;
  let appPlanId: string | null = null;

  if (sub.name) {
    // Extract plan name from subscription name (e.g., "Enterprise (monthly)" -> "Enterprise")
    const planNameMatch = sub.name.match(/^([^(]+)/);
    const planName = planNameMatch ? planNameMatch[1].trim() : sub.name;

    const appPlan = await prisma.appPlan.findFirst({
      where: {
        name: { equals: planName, mode: "insensitive" },
        isActive: true,
      },
    });

    if (appPlan) {
      isCustom = appPlan.isCustom;
      appPlanId = appPlan.id;
    }
  }

  // --- Cancel other Shopify subscriptions for this shop ---
  // Don't cancel local-only subscriptions (like "free-...") - only Shopify ones
  await prisma.shopSubscription.updateMany({
    where: {
      shopId: shop,
      status: "ACTIVE",
      shopifyGid: {
        not: sub.id,
        startsWith: "gid://", // Only cancel real Shopify subscriptions
      },
    },
    data: { status: "CANCELLED" },
  });

  // Upsert the new/current subscription
  await prisma.shopSubscription.upsert({
    where: { shopifyGid: sub.id },
    create: {
      shopId: shop,
      shopifyGid: sub.id,
      name: sub.name ?? null,
      status: sub.status ?? "ACTIVE",
      interval,
      price,
      trialDays: sub.trialDays ?? null,
      currentPeriodEnd: sub.currentPeriodEnd
        ? new Date(sub.currentPeriodEnd)
        : null,
      isCustom,
      appPlanId,
    },
    update: {
      name: sub.name ?? null,
      status: sub.status ?? "ACTIVE",
      interval,
      price,
      trialDays: sub.trialDays ?? null,
      currentPeriodEnd: sub.currentPeriodEnd
        ? new Date(sub.currentPeriodEnd)
        : null,
      isCustom,
      appPlanId,
    },
  });

  return sub;
}

