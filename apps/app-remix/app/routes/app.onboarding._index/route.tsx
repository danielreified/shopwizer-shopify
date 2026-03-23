// app/routes/app.onboarding._index/route.tsx
export { RouteErrorBoundary as ErrorBoundary } from "../../components/RouteErrorBoundary";

import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { useFetcher, useLoaderData, useRevalidator, useNavigate } from "react-router";
import {
  BlockStack,
  Text,
  InlineStack,
  Button,
  Banner,
  Badge,
} from "@shopify/polaris";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../../shopify.server";
import { buildFormData } from "../../lib/form-actions";
import { useEffect, useState } from "react";
import { CircleProgress, Footer, ThreePaneLayout } from "@repo/ui";
import {
  OnboardingSidebar,
  OnboardingStatusPane,
  OnboardingSyncStatus,
  OnboardingStepsSection,
} from "./components";
import { usePaneMode } from "../../hooks/use-pane-mode";

import {
  startProductsBulk,
  getCurrentBulk,
} from "../../services/bulk.service.server";
import {
  fetchLast90DaysOrders,
  saveOrdersToDatabase,
} from "../../services/orders90.server";

import { publish, Sources, DetailTypes } from "@repo/event-contracts";
import { useAppStore } from "../../store/app-store";
import prisma from "../../db.server";

import {
  getShopPlan,
  getTrialDaysLeft,
  getOrdersThisMonth,
  getProductCount,
  getOrderLimit,
} from "../../services/shops.server";

// -----------------------------------------------------------------------------
// HELPERS
// -----------------------------------------------------------------------------
function gidToNumericId(gid: string | null): string | null {
  if (!gid) return null;
  const parts = gid.split("/");
  return parts[parts.length - 1] || null;
}

// -----------------------------------------------------------------------------
// LOADER
// -----------------------------------------------------------------------------
const STEP_ORDER = [
  "PREFERENCE",
  "SYNC_PRODUCTS",
  "SYNC_ORDERS",
  "THEME_INSTALL",
  "COMPLETED",
] as const;

type OnboardingStepType = (typeof STEP_ORDER)[number];

function stepToIndex(step: string): number {
  const idx = STEP_ORDER.indexOf(step as OnboardingStepType);
  return idx >= 0 ? idx : 0;
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const shopId = session.shop;

  const shopRecord = await prisma.shop.findUnique({
    where: { id: shopId },
    select: {
      recommenderPreferences: true,
      shopOnboarding: {
        select: { step: true },
      },
    },
  });

  const prefs = shopRecord?.recommenderPreferences ?? {
    gender: "auto",
    age: "auto",
  };

  const currentStep = shopRecord?.shopOnboarding?.step ?? "PREFERENCE";
  const onboardingStep = stepToIndex(currentStep);

  // Active theme
  const themeRes = await admin.graphql(`
    query GetActiveTheme {
      themes(first: 10) {
        edges {
          node { id name role }
        }
      }
    }
  `);

  const json = await themeRes.json();
  const edges = json?.data?.themes?.edges ?? [];
  const main = edges.find((e: any) => e.node.role === "MAIN");

  const themeId = gidToNumericId(main?.node?.id ?? null);
  const current = await getCurrentBulk(admin);

  /* ---------------- SHOP SUMMARY ---------------- */
  const shop_plan = await getShopPlan(shopId);
  const shop_trialDaysLeft = await getTrialDaysLeft(shopId);
  const shop_ordersThisMonth = await getOrdersThisMonth(shopId);
  const shop_orderLimit = await getOrderLimit(shopId);
  const shop_productCount = await getProductCount(shopId);

  return {
    current,
    themeId,
    shop: shopId,
    preferences: prefs,
    onboardingStep,
    shop_plan,
    shop_trialDaysLeft,
    shop_ordersThisMonth,
    shop_orderLimit,
    shop_productCount,
  };
};

// -----------------------------------------------------------------------------
// ACTION
// -----------------------------------------------------------------------------
export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;

  const fd = await request.formData();
  const intent = fd.get("intent");
  const armed = fd.get("armed");


  if (intent === "savePreferences") {
    const gender = String(fd.get("gender") || "auto");
    const age = String(fd.get("age") || "auto");
    await prisma.shop.update({
      where: { id: shop },
      data: { recommenderPreferences: { gender, age } },
    });
    await prisma.shopOnboarding.updateMany({ where: { shopId: shop }, data: { step: "SYNC_PRODUCTS" } });
    return { ok: true, saved: true };
  }

  if (intent === "start") {
    try {
      const existing = await getCurrentBulk(admin);
      if (existing?.status === "CREATED" || existing?.status === "RUNNING") {
        return { ok: true, opId: existing.id, alreadyRunning: true, status: existing.status, syncing: true };
      }
      const id = await startProductsBulk(admin, session.shop);
      return { ok: true, opId: id ?? null, status: "CREATED", syncing: true };
    } catch (err: any) {
      return { ok: false, error: err.message ?? "Failed to start bulk sync" };
    }
  }

  if (intent === "status") {
    const current = await getCurrentBulk(admin);
    return { ok: true, current };
  }

  if (intent === "syncOrders90") {
    try {
      const orders = await fetchLast90DaysOrders(admin);
      await saveOrdersToDatabase(shop, orders);
      await publish({
        source: Sources.SERVICE_APP,
        detailType: DetailTypes.JOB_SCHEDULE,
        detail: { type: "TRENDING", shopId: shop, force: true },
      });
      await publish({
        source: Sources.SERVICE_APP,
        detailType: DetailTypes.JOB_SCHEDULE,
        detail: { type: "BEST_SELLER", shopId: shop, force: true },
      });
      await prisma.shopOnboarding.updateMany({ where: { shopId: shop }, data: { step: "THEME_INSTALL" } });
      return { ok: true, synced: orders.length };
    } catch (err: any) {
      return { ok: false, error: err.message ?? "Order sync failed" };
    }
  }

  if (intent === "skipOrders90") {
    await prisma.shopOnboarding.updateMany({ where: { shopId: shop }, data: { step: "THEME_INSTALL" } });
    return { ok: true, skipped: true };
  }

  if (intent === "themeInstalled") {
    await prisma.shopOnboarding.updateMany({ where: { shopId: shop }, data: { step: "COMPLETED" } });
    return { ok: true, themeInstalled: true };
  }

  return { ok: false, error: "Unknown intent" };
};

export default function Onboarding(): any {
  const { isCompact, paneMode } = usePaneMode();
  const {
    current,
    themeId,
    shop,
    preferences,
    onboardingStep,
    shop_plan,
    shop_trialDaysLeft,
    shop_ordersThisMonth,
    shop_orderLimit,
    shop_productCount,
  } = useLoaderData<typeof loader>();

  const fetcher = useFetcher<typeof action>();
  const shopify = useAppBridge();
  const revalidator = useRevalidator();
  const navigate = useNavigate();

  const setOnboardingStep = useAppStore((s) => s.setOnboardingStep);
  const showSync = useAppStore((s) => s.showSync);
  const markSyncComplete = useAppStore((s) => s.markSyncComplete);
  const sync = useAppStore((s) => s.sync);
  const isSyncComplete = useAppStore((s) => s.isSyncComplete());

  const [gender, setGender] = useState((preferences as any).gender || "auto");
  const [age, setAge] = useState((preferences as any).age || "auto");
  const [uploading, setUploading] = useState(false);
  const [activeIntent, setActiveIntent] = useState<string | null>(null);

  // Sync onboarding step to store
  useEffect(() => {
    const stepName = STEP_ORDER[onboardingStep];
    if (stepName) setOnboardingStep(stepName);
  }, [onboardingStep, setOnboardingStep]);

  // Derived state
  const isSubmitting = fetcher.state !== "idle";
  const progress = Math.round((onboardingStep / (STEP_ORDER.length - 1)) * 100);

  // Poll for sync status
  useEffect(() => {
    if (!uploading) return;
    const interval = setInterval(() => {
      if (revalidator.state === "idle") {
        revalidator.revalidate();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [uploading, revalidator]);

  // Stop uploading when step advances
  useEffect(() => {
    if (uploading && onboardingStep > stepToIndex("SYNC_PRODUCTS")) {
      setUploading(false);
      markSyncComplete("Product sync complete!");
    }
  }, [uploading, onboardingStep, markSyncComplete]);

  // Handle fetcher completion
  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data) {
      setActiveIntent(null);
      if (fetcher.data.ok) {
        shopify.toast.show("Saved successfully");
      }
    }
  }, [fetcher.state, fetcher.data, shopify]);

  const cleanPlanName = shop_plan.replace(/\s*\((monthly|yearly)\)\s*$/i, "").trim();

  // Action Handlers

  const handleSavePreferences = () => {
    setActiveIntent("savePreferences");
    fetcher.submit(buildFormData("savePreferences", { gender, age }), { method: "post" });
  };

  const handleStartSync = () => {
    setUploading(true);
    setActiveIntent("start");
    showSync("Syncing products...", false, "PRODUCT");
    fetcher.submit(buildFormData("start", { armed: "1" }), { method: "post" });
  };

  const handleSyncOrders = () => {
    setActiveIntent("syncOrders90");
    showSync("Syncing orders...", false, "ORDER");
    fetcher.submit(buildFormData("syncOrders90", { armed: "1" }), { method: "post" });
  };

  const handleSkipOrders = () => {
    setActiveIntent("skipOrders90");
    fetcher.submit(buildFormData("skipOrders90"), { method: "post" });
  };

  const handleThemeInstalled = () => {
    setActiveIntent("themeInstalled");
    fetcher.submit(buildFormData("themeInstalled"), { method: "post" });
  };

  const openThemeEditor = () => {
    if (themeId) {
      window.open(`https://${shop}/admin/themes/${themeId}/editor`, "_blank");
    }
  };

  return (
    <ThreePaneLayout
      header={{
        title: "Onboarding",
        badge: { text: "Setup", tone: "attention" },
        actions: (
          <InlineStack gap="200" blockAlign="center" wrap={isCompact}>
            {sync.open && sync.type === "PRODUCT" && (
              <Badge tone={isSyncComplete ? "success" : "attention"}>
                {sync.message}
              </Badge>
            )}
            <Button onClick={() => navigate("/app")}>Go to Dashboard</Button>
          </InlineStack>
        ),
      }}
      leftPane={
        <OnboardingSidebar
          onboardingStep={onboardingStep}
          stepOrder={STEP_ORDER.filter(s => s !== "COMPLETED") as OnboardingStepType[]}
          stepLabels={{
            PREFERENCE: "Store Preferences",
            SYNC_PRODUCTS: "Product Catalog",
            SYNC_ORDERS: "Order History",
            THEME_INSTALL: "Theme Extension",
          }}
          stepDescriptions={{
            PREFERENCE: "Configure default logic",
            SYNC_PRODUCTS: "Sync your inventory",
            SYNC_ORDERS: "Analyze recent sales",
            THEME_INSTALL: "Activate on storefront",
          }}
        />
      }
      leftPaneBottom={
        <OnboardingSyncStatus sync={sync} isSyncComplete={isSyncComplete} />
      }
      rightPaneTitle="Account & Status"
      rightPane={
        <OnboardingStatusPane
          planName={cleanPlanName}
          trialDaysLeft={shop_trialDaysLeft}
          ordersThisMonth={shop_ordersThisMonth}
          orderLimit={shop_orderLimit}
          productCount={shop_productCount}
          onNavigate={navigate}
        />
      }
      leftPaneMode={paneMode}
      rightPaneMode={paneMode}
      leftPaneCollapsed={isCompact}
      rightPaneCollapsed={isCompact}
    >
      <div style={{ padding: "40px", maxWidth: "1200px", margin: "0 auto", width: "100%" }}>
        <BlockStack gap="800">
          {fetcher.data?.error && (
            <Banner tone="critical" title="Sync Error">
              <p>{fetcher.data.error}</p>
            </Banner>
          )}

          <BlockStack gap="200">
            <InlineStack gap="300" blockAlign="center">
              <CircleProgress progress={progress} size={28} />
              <Text as="span" variant="bodySm" tone="subdued" fontWeight="medium">
                Step {onboardingStep + 1} of {STEP_ORDER.length - 1}
              </Text>
            </InlineStack>
            <Text variant="headingLg" as="h2">Set up product recommendations</Text>
            <Text variant="bodyMd" as="p" tone="subdued">
              Complete these steps to begin showing smart recommendations.
            </Text>
          </BlockStack>

          <OnboardingStepsSection
            onboardingStep={onboardingStep}
            gender={gender}
            onGenderChange={setGender}
            age={age}
            onAgeChange={setAge}
            onSavePreferences={handleSavePreferences}
            onStartSync={handleStartSync}
            onSyncOrders={handleSyncOrders}
            onSkipOrders={handleSkipOrders}
            onThemeInstalled={handleThemeInstalled}
            onOpenThemeEditor={openThemeEditor}
            activeIntent={activeIntent}
            uploading={uploading}
          />

          <Footer
            text="Learn more about"
            linkLabel="fulfilling orders"
            linkUrl="https://help.shopify.com/manual/orders/fulfill-orders"
          />
        </BlockStack>
      </div>
    </ThreePaneLayout>
  );
}
