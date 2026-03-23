// app/lib/shops.server.ts

import prisma from "../db.server";
import { SHOP_INFO_QUERY } from "../gql/shop.server";
import { publish, Sources, DetailTypes } from "@repo/event-contracts";
import { OnboardingStep, ProductSyncState } from "@prisma/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AdminLike = { graphql: (query: string) => Promise<Response> };

interface ShopInfo {
  id: string;
  name?: string;
  email?: string;
  myshopifyDomain?: string;
  primaryDomain?: { url: string };
  currencyCode?: string;
  ianaTimezone?: string;
  billingAddress?: { countryCodeV2: string };
  plan?: { displayName: string; partnerDevelopment: boolean };
}

interface EnsureShopInput {
  admin: AdminLike;
  shopDomain: string;
  scopes?: string;
}

interface EnsureShopResult {
  shop: Awaited<ReturnType<typeof prisma.shop.upsert>>;
  isNewInstall: boolean;
  isReinstall: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TRIAL_DAYS = 14;
const FREE_PLAN_SLUG = "free";

const DEFAULT_RECOMMENDERS = {
  similar: true,
  color: true,
  trending: true,
  newArrivals: true,
  bestSellers: true,
};

// ---------------------------------------------------------------------------
// Helper: Fetch shop info from Shopify
// ---------------------------------------------------------------------------

async function fetchShopInfo(admin: AdminLike): Promise<ShopInfo | null> {
  try {
    const res = await admin.graphql(SHOP_INFO_QUERY);
    const json = await res.json() as { data?: { shop?: ShopInfo } };
    return json?.data?.shop ?? null;
  } catch (err) {
    console.error("[ensureShop] Failed to fetch shop info from Shopify:", err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Helper: Compute trial end date
// ---------------------------------------------------------------------------

function computeTrialEnd(): Date {
  const now = new Date();
  const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  return new Date(todayUTC.getTime() + TRIAL_DAYS * 86400000);
}

// ---------------------------------------------------------------------------
// Helper: Send install notification
// ---------------------------------------------------------------------------

async function sendInstallEmail(
  email: string,
  shopName: string,
  isReinstall: boolean
): Promise<void> {
  const emailType = isReinstall ? "re-install" : "new install";

  try {
    console.log(`📧 [ensureShop] Publishing INSTALL email (${emailType}) to: ${email}`);

    await publish({
      source: Sources.SERVICE_APP,
      detailType: DetailTypes.EMAIL_SEND,
      detail: {
        type: "INSTALL",
        to: email,
        data: {
          shopName,
          plan: "Free",
        },
      },
    });

    console.log(`📧 [ensureShop] ✅ INSTALL email event published successfully!`);
  } catch (err) {
    console.error(`📧 [ensureShop] ❌ Failed to publish INSTALL email:`, err);
  }
}

// ---------------------------------------------------------------------------
// Main: ensureShop
// ---------------------------------------------------------------------------

export async function ensureShop({
  admin,
  shopDomain,
  scopes,
}: EnsureShopInput): Promise<EnsureShopResult> {
  const myshopify = shopDomain.toLowerCase();

  // 1. Fetch shop info from Shopify GraphQL
  const shopInfo = await fetchShopInfo(admin);

  // 2. Check if shop exists (for install detection)
  const existingShop = await prisma.shop.findUnique({
    where: { id: myshopify },
    select: { isActive: true, trialEndsAt: true },
  });

  const isNewInstall = !existingShop;
  const isReinstall = !!existingShop && !existingShop.isActive;

  console.log(`[ensureShop] ${myshopify} — isNewInstall: ${isNewInstall}, isReinstall: ${isReinstall}`);

  // 3. Run all operations in a transaction for atomicity
  const shop = await prisma.$transaction(async (tx) => {
    // 3a. Upsert shop record
    const shopRecord = await tx.shop.upsert({
      where: { id: myshopify },
      create: {
        id: myshopify,
        domain: myshopify,
        shopifyGid: shopInfo?.id,
        name: shopInfo?.name,
        email: shopInfo?.email,
        primaryDomainUrl: shopInfo?.primaryDomain?.url,
        currency: shopInfo?.currencyCode,
        timezone: shopInfo?.ianaTimezone,
        countryCode: shopInfo?.billingAddress?.countryCodeV2,
        planName: shopInfo?.plan?.displayName,
        partnerDev: shopInfo?.plan?.partnerDevelopment ?? false,
        scopes,
        isActive: true,
        installedAt: new Date(),
        trialEndsAt: computeTrialEnd(),
        recommenderPreferences: {},
      },
      update: {
        shopifyGid: shopInfo?.id,
        name: shopInfo?.name,
        email: shopInfo?.email,
        primaryDomainUrl: shopInfo?.primaryDomain?.url,
        currency: shopInfo?.currencyCode,
        timezone: shopInfo?.ianaTimezone,
        countryCode: shopInfo?.billingAddress?.countryCodeV2,
        planName: shopInfo?.plan?.displayName,
        partnerDev: shopInfo?.plan?.partnerDevelopment ?? false,
        scopes,
        isActive: true,
        uninstalledAt: null,
        // Don't reset trialEndsAt on re-install
      },
      include: {
        shopOnboarding: true,
        shopStatus: true,
        shopSettings: true,
        subscriptions: { take: 1 },
      },
    });

    // 3b. Create ShopOnboarding if missing
    if (!shopRecord.shopOnboarding) {
      await tx.shopOnboarding.create({
        data: {
          shopId: shopRecord.id,
          step: OnboardingStep.PREFERENCE,
        },
      });
      console.log(`[ensureShop] Created ShopOnboarding for ${myshopify}`);
    }

    // 3c. Create ShopStatus if missing
    if (!shopRecord.shopStatus) {
      await tx.shopStatus.create({
        data: {
          shopId: shopRecord.id,
          productSyncState: ProductSyncState.IDLE,
        },
      });
      console.log(`[ensureShop] Created ShopStatus for ${myshopify}`);
    }

    // 3d. Create ShopSettings if missing
    if (!shopRecord.shopSettings) {
      await tx.shopSettings.create({
        data: {
          shopId: shopRecord.id,
          // Pre-populate contact with shop owner info
          contactName: shopInfo?.name ?? null,
          contactEmail: shopInfo?.email ?? null,
          productCapAlerts: true,
          recommenders: DEFAULT_RECOMMENDERS,
        },
      });
      console.log(`[ensureShop] Created ShopSettings for ${myshopify}`);
    }

    // 3e. Create free subscription if none exists
    if (shopRecord.subscriptions.length === 0) {
      const freePlan = await tx.appPlan.findUnique({
        where: { slug: FREE_PLAN_SLUG },
      });

      if (freePlan) {
        await tx.shopSubscription.create({
          data: {
            shopId: shopRecord.id,
            appPlanId: freePlan.id,
            shopifyGid: `free-${shopRecord.id}`,
            name: "Free",
            status: "ACTIVE",
            price: 0,
            isCustom: false,
            currentPeriodEnd: null,
          },
        });
        console.log(`[ensureShop] Created free subscription for ${myshopify}`);
      } else {
        console.warn(`[ensureShop] Free plan not found in database`);
      }
    }

    return shopRecord;
  });

  // 4. Send install email (outside transaction — non-critical)
  // Use ShopSettings.contactEmail for consistent email routing
  if (isNewInstall || isReinstall) {
    const settings = await prisma.shopSettings.findUnique({
      where: { shopId: myshopify },
      select: { contactEmail: true, contactName: true },
    });

    const contactEmail = settings?.contactEmail ?? shopInfo?.email;
    if (contactEmail) {
      // Fire and forget — don't block on email
      sendInstallEmail(
        contactEmail,
        settings?.contactName ?? shopInfo?.name ?? myshopify,
        isReinstall
      ).catch(() => { }); // Errors already logged in helper
    }
  }

  console.log(`[ensureShop] ✅ Shop ensured successfully: ${myshopify}`);

  return { shop, isNewInstall, isReinstall };
}
