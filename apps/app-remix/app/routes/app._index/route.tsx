// app/routes/app._index/route.tsx
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, useLocation, useSearchParams, useNavigate } from "react-router";
import {
  BlockStack,
  Banner,
} from "@shopify/polaris";

import { ThreePaneLayout } from "@repo/ui";

import Analytics from "../../components/AnalyticsDashboard";
import { Trends } from "../../components/TrendsDashboard";
import {
  AccountStatusPane,
  OverviewHeader,
  OverviewSidebar,
  SummaryMetricsGrid,
} from "./components";

import { authenticate } from "../../shopify.server";
import { useEffect, useMemo, useState } from "react";
import { usePaneMode } from "../../hooks/use-pane-mode";

import { syncShopSubscription } from "../../services/subscriptions.service.server";

/* ---------------- SHOP SUMMARY ---------------- */
import {
  getShopPlan,
  getTrialDaysLeft,
  getOrdersThisMonth,
  getProductCount,
  getOrderLimit,
} from "../../services/shops.server";

import {
  getLast7DaysAttributedSales,
  getLast7DaysAttributedOrdersCount,
  getLast7DaysAttributedItems,
  getLast7DaysAttributedRevenuePercentage,
  getLast30DaysAttributedSales,
  getLast30DaysAttributedOrderCount,
  getLast30DaysAttributedItemsCount,
  getLast7DaysRailClicksSeries,
  getLast7DaysRailImpressionsSeries,
  getRecentAttributedItems,
  getTopConvertingProducts,
} from "../../services/analytics.server";

import OnboardingFab from "../../components/OnboardingFab.app";
export { RouteErrorBoundary as ErrorBoundary } from "../../components/RouteErrorBoundary";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const shopId = session.shop;

  const url = new URL(request.url);

  // Sync Shopify subscription after redirect
  if (url.searchParams.get("subscribed") === "1") {
    const shopifySub = await syncShopSubscription(admin, shopId);

    // If Shopify has a subscription, cancel any local Free subscription
    if (shopifySub) {
      const prisma = (await import("../../db.server")).default;
      await prisma.shopSubscription.updateMany({
        where: {
          shopId,
          status: "ACTIVE",
          shopifyGid: { startsWith: "free-" },
        },
        data: { status: "CANCELLED" },
      });
    }
  }

  /* ---------------- ALL QUERIES IN PARALLEL ---------------- */
  const [
    shop_plan,
    shop_trialDaysLeft,
    shop_ordersThisMonth,
    shop_orderLimit,
    shop_productCount,
    last7_attributedSales,
    last7_attributedOrders,
    last7_attributedItems,
    last7_attributedRevenuePercentage,
    last30_attributedSales,
    last30_attributedOrderCount,
    last30_attributedItems,
    recent10_attributedItems,
    top10_convertingProducts,
    last7_railClicksSeries,
    last7_railImpressionsSeries,
  ] = await Promise.all([
    getShopPlan(shopId),
    getTrialDaysLeft(shopId),
    getOrdersThisMonth(shopId),
    getOrderLimit(shopId),
    getProductCount(shopId),
    getLast7DaysAttributedSales(shopId),
    getLast7DaysAttributedOrdersCount(shopId),
    getLast7DaysAttributedItems(shopId),
    getLast7DaysAttributedRevenuePercentage(shopId),
    getLast30DaysAttributedSales(shopId),
    getLast30DaysAttributedOrderCount(shopId),
    getLast30DaysAttributedItemsCount(shopId),
    getRecentAttributedItems(shopId),
    getTopConvertingProducts(shopId),
    getLast7DaysRailClicksSeries(shopId),
    getLast7DaysRailImpressionsSeries(shopId),
  ]);

  return {
    shop_plan,
    shop_trialDaysLeft,
    shop_ordersThisMonth,
    shop_orderLimit,
    shop_productCount,

    last7_attributedSales,
    last7_attributedOrders,
    last7_attributedItems,
    last7_attributedRevenuePercentage,

    last30_attributedSales,
    last30_attributedOrderCount,
    last30_attributedItems,

    last7_railClicksSeries,
    last7_railImpressionsSeries,

    recent10_attributedItems,
    top10_convertingProducts,
  };
};

/**
 * Custom Status Row for a more premium look than standard Menu items
 */

export default function Index(): any {
  const {
    shop_plan,
    shop_trialDaysLeft,
    shop_ordersThisMonth,
    shop_orderLimit,
    shop_productCount,

    last7_attributedSales,
    last7_attributedOrders,
    last7_attributedItems,
    last7_attributedRevenuePercentage,

    last30_attributedSales,
    last30_attributedOrderCount,
    last30_attributedItems,

    last7_railClicksSeries,
    last7_railImpressionsSeries,

    recent10_attributedItems,
    top10_convertingProducts,
  } = useLoaderData<typeof loader>();

  const location = useLocation();
  const navigate = useNavigate();
  const [sp, setSp] = useSearchParams();
  const { isCompact, paneMode } = usePaneMode();

  const shouldShowSubscribedBanner = useMemo(() => {
    const pathIsSubscribed = location.pathname.endsWith("/app/subscribed");
    const paramIsSubscribed = sp.get("subscribed") === "1";
    return pathIsSubscribed || paramIsSubscribed;
  }, [location.pathname, sp]);

  const [showBanner, setShowBanner] = useState(shouldShowSubscribedBanner);

  useEffect(() => {
    if (sp.has("subscribed")) {
      sp.delete("subscribed");
      setSp(sp, { replace: true });
    }
  }, []);

  const cleanPlanName = shop_plan.replace(/\s*\((monthly|yearly)\)\s*$/i, "").trim();
  const shopDisplayName = location.pathname.split("/")[1] || "Shopwise";
  const contentPadding = isCompact ? "16px" : "40px";
  const contentMaxWidth = isCompact ? "100%" : "1200px";

  return (
    <ThreePaneLayout
      header={{
        title: "Dashboard"
      }}
      leftPaneTitle="Navigation"
      leftPane={
        <OverviewSidebar currentPath={location.pathname} currentSearch={location.search} />
      }
      leftPaneBottom={
        <OnboardingFab variant="sidebar" />
      }
      rightPaneTitle="Account & Status"
      rightPane={
        <AccountStatusPane
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
      <div style={{ padding: contentPadding, maxWidth: contentMaxWidth, margin: "0 auto", width: "100%" }}>
        <BlockStack gap={isCompact ? "600" : "800"}>
          {showBanner && (
            <Banner
              title="Your plan is active and you're all set!"
              tone="success"
              onDismiss={() => setShowBanner(false)}
            />
          )}

          {/* GREETING HEADER */}
          <OverviewHeader shopName={shopDisplayName} />

          {/* SUMMARY GRID */}
          <SummaryMetricsGrid
            attributedSales={last30_attributedSales}
            attributedOrderCount={last30_attributedOrderCount}
            attributedItems={last30_attributedItems}
            last7AttributedSales={last7_attributedSales}
            last7AttributedOrders={last7_attributedOrders}
            last7AttributedItems={last7_attributedItems}
          />

          <BlockStack gap="600">
            <Analytics
              last30_attributedSales={last30_attributedSales}
              last30_attributedOrderCount={last30_attributedOrderCount}
              last30_attributedItems={last30_attributedItems}
              last7_attributedSales={last7_attributedSales}
              last7_attributedOrders={last7_attributedOrders}
              last7_attributedItems={last7_attributedItems}
              last7_attributedRevenuePercentage={last7_attributedRevenuePercentage}
              last7_railClicksSeries={last7_railClicksSeries}
              last7_railImpressionsSeries={last7_railImpressionsSeries}
            />

            <Trends
              attributedItems={recent10_attributedItems}
              topProducts={top10_convertingProducts}
            />
          </BlockStack>
        </BlockStack>
      </div>
    </ThreePaneLayout>
  );
}
