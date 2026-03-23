import { useEffect } from "react";
import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import {
  Link,
  Outlet,
  useLoaderData,
  useMatches,
  useRouteError,
  useRevalidator,
} from "react-router";
import { AppProvider } from "@shopify/shopify-app-react-router/react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { AppProvider as PolarisProvider, Page } from "@shopify/polaris";
import enTranslations from "@shopify/polaris/locales/en.json";

import { authenticate } from "../../shopify.server";
import { ensureShop } from "../../lib/shops.server";
import { ensureWebPixel } from "../../lib/webpixel";
import { initializeShopJobs } from "../../lib/jobs.server";
import { useAppStore, type OnboardingStep } from "../../store/app-store";
import OnboardingFab from "../../components/OnboardingFab.app";
import prisma from "../../db.server";
import { logger } from "@repo/logger";



// ---- Loader ----
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);

  if (!session?.shop) throw new Response("No session", { status: 401 });

  try {
    await ensureShop({
      admin,
      shopDomain: session.shop,
      scopes: session.scope ?? undefined,
    });

    await initializeShopJobs(session.shop);
  } catch (e) {
    logger.error({ err: e, shopId: session.shop }, "ensureShop/initializeShopJobs failed");
  }

  try {
    await ensureWebPixel(admin, { accountID: session.shop });
  } catch (e) {
    logger.error({ err: e, shopId: session.shop }, "ensureWebPixel failed");
  }

  // Fetch onboarding step + shop status in parallel
  const [shopOnboarding, shopStatus] = await Promise.all([
    prisma.shopOnboarding.findUnique({
      where: { shopId: session.shop },
      select: { step: true },
    }),
    prisma.shopStatus.findUnique({
      where: { shopId: session.shop },
      select: { productSyncState: true },
    }),
  ]);

  const onboardingStep = (shopOnboarding?.step ?? "PREFERENCE") as OnboardingStep;

  return {
    apiKey: process.env.SHOPIFY_API_KEY || "",
    shop: { domain: session.shop },
    onboardingStep,
    shopStatus: { productSyncState: shopStatus?.productSyncState ?? "IDLE" },
  };
};

// ---- Component ----
export default function AppLayout() {
  const { apiKey, shop, onboardingStep, shopStatus } = useLoaderData<typeof loader>();
  const setShop = useAppStore((s) => s.setShop);
  const setOnboardingStep = useAppStore((s) => s.setOnboardingStep);
  const showSync = useAppStore((s) => s.showSync);
  const markSyncComplete = useAppStore((s) => s.markSyncComplete);
  const hideSyncBar = useAppStore((s) => s.hideSyncBar);
  const revalidator = useRevalidator();

  // Sync polling logic
  useEffect(() => {
    // If sync is running, ensure bar is showing and poll
    if (shopStatus.productSyncState === "RUNNING") {
      // Only show if not already open (preserving user dismissal if robust, but here we enforce)
      // Or better: ensure store reflects "RUNNING"
      // We can just call showSync to ensure it's visible.
      // To avoid re-opening if dismissed, we might check store state, but simple is better:
      // if it's running, show it.
      showSync("Syncing products...", false, "PRODUCT");

      const interval = setInterval(() => {
        if (revalidator.state === "idle") {
          revalidator.revalidate();
        }
      }, 3000);
      return () => clearInterval(interval);
    }

    // If completed
    if (shopStatus.productSyncState === "COMPLETED") {
      // Mark store as complete
      markSyncComplete("Product sync complete", "PRODUCT");
      // Polling stops because status is no longer RUNNING
    }

    // Default/IDLE: do nothing specific, let user control dismissal or previous logic
  }, [shopStatus.productSyncState, showSync, markSyncComplete, revalidator]);

  // Onboarding FAB hide logic
  const isOnboarding = useMatches().some(
    (m) =>
      m.id.endsWith("app.onboarding._index/route") ||
      m.id.endsWith("app.plans._index/route"),
  );

  const isComplete = useAppStore((s) => s.isSyncComplete());

  // Sync store state
  useEffect(() => {
    setShop(shop);
    setOnboardingStep(onboardingStep);
  }, [shop, setShop, onboardingStep, setOnboardingStep]);

  // Auto-hide sync bar
  useEffect(() => {
    if (!isComplete) return;
    const t = setTimeout(() => hideSyncBar(), 3500);
    return () => clearTimeout(t);
  }, [isComplete, hideSyncBar]);

  return (
    <AppProvider embedded apiKey={apiKey}>
      <PolarisProvider i18n={enTranslations}>
        <ui-nav-menu>
          <Link to="/app" rel="home">Home</Link>
          <Link to="/app/products">Products</Link>
          <Link to="/app/merchandising">Merchandising</Link>
          <Link to="/app/integrations">Integrations</Link>
          <Link to="/app/editor">Editor</Link>
          <Link to="/app/settings/general">Settings</Link>
          <Link to="/app/plans">Plans</Link>
          <Link to="/app/onboarding">Onboarding</Link>
        </ui-nav-menu>

        <Outlet />
      </PolarisProvider>
    </AppProvider>
  );
}

// ---- Error Boundary ----
// ---- Error Boundary ----
export function ErrorBoundary() {
  const error = useRouteError();
  console.error("ErrorBoundary caught:", error);

  return (
    <PolarisProvider i18n={enTranslations}>
      <Page>
        <div style={{ padding: "2rem", textAlign: "center", background: "#fee", border: "1px solid #f99", borderRadius: "8px" }}>
          <h1>Application Error</h1>
          <pre style={{ textAlign: "left", overflow: "auto", padding: "1rem" }}>
            {error instanceof Error ? error.stack : JSON.stringify(error, null, 2)}
          </pre>
        </div>
      </Page>
    </PolarisProvider>
  );
}

// ---- Headers ----
export const headers: HeadersFunction = (args) => boundary.headers(args);



// use rail metrics clicks
