// app/routes/app.plans._index/route.tsx
export { RouteErrorBoundary as ErrorBoundary } from "../../components/RouteErrorBoundary";

import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { useLoaderData, useFetcher, useNavigate } from "react-router";
import { useState, useEffect } from "react";

import { authenticate } from "../../shopify.server";
import prisma from "../../db.server";
import { syncShopSubscription } from "../../services/subscriptions.service.server";

import {
  BlockStack,
  Button,
  Box,
} from "@shopify/polaris";

import { Plans } from "@repo/ui/components/PricingPlans";
import { ThreePaneLayout } from "@repo/ui/components/ThreePaneLayout";
import { PLAN_BRACKETS } from "../../lib/plan-catalog";
import {
  PlanSummaryPane,
  PlansSectionHeader,
  PlansUsageCard,
  RedeemCodeModal,
} from "./components";
import { usePaneMode } from "../../hooks/use-pane-mode";

// -----------------------------------------------------------------------------
// LOADER
// -----------------------------------------------------------------------------
export async function loader({ request }: LoaderFunctionArgs) {
  const { admin, session } = await authenticate.admin(request);
  const shopId = session.shop;

  // Sync subscription from Shopify
  const shopifySub = await syncShopSubscription(admin, shopId);

  // If Shopify returned a subscription, cancel the local Free subscription
  if (shopifySub) {
    await prisma.shopSubscription.updateMany({
      where: {
        shopId,
        status: "ACTIVE",
        shopifyGid: { startsWith: "free-" },
      },
      data: { status: "CANCELLED" },
    });
  }

  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    select: {
      subscriptions: {
        include: { appPlan: true },
      },
      shopAppPlanCodeRedemption: {
        include: {
          planCode: {
            include: { appPlan: true },
          },
        },
        orderBy: { redeemedAt: "desc" },
        take: 1,
      },
    },
  });

  if (!shop) return { plan: null, customPlan: null, shopDomain: session.shop };

  const active = shop.subscriptions.find((s) => s.status === "ACTIVE");

  // Check for persisted redemption
  let customPlan = null;
  const redemption = shop.shopAppPlanCodeRedemption?.[0];
  if (redemption?.planCode?.appPlan) {
    const plan = redemption.planCode.appPlan;
    customPlan = {
      name: plan.name,
      slug: plan.slug,
      price: plan.price?.toNumber ? plan.price.toNumber() : Number(plan.price),
      currency: plan.currency,
      interval: plan.interval as "MONTHLY" | "YEARLY",
      code: redemption.planCode.code,
      title: redemption.planCode.title ?? undefined,
    };
  }

  const isCustomPlanActive = !!(customPlan && active?.isCustom);

  return {
    shopDomain: session.shop,
    plan: active
      ? {
        name: active.name ?? "Unknown Plan",
        price: Number(active.price),
        interval: active.interval,
        isFree: Number(active.price) === 0,
      }
      : null,
    customPlan,
    isCustomPlanActive,
  };
}

// -----------------------------------------------------------------------------
// ACTION — redeem code
// -----------------------------------------------------------------------------
export async function action({ request }: ActionFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const shopId = session.shop;
  const form = await request.formData();
  const intent = form.get("intent");

  if (intent === "redeem") {
    const code = String(form.get("code") || "");

    const planCode = await prisma.appPlanCode.findUnique({
      where: { code },
      include: { appPlan: true },
    });

    if (!planCode || !planCode.isActive) {
      return { ok: false, error: "Invalid code" };
    }

    if (planCode.maxRedemptions !== null && planCode.usageCount >= planCode.maxRedemptions) {
      return { ok: false, error: "This code has reached its maximum redemptions" };
    }

    const now = new Date();
    if (planCode.validFrom && now < planCode.validFrom) {
      return { ok: false, error: "This code is not yet valid" };
    }
    if (planCode.validTo && now > planCode.validTo) {
      return { ok: false, error: "This code has expired" };
    }

    await prisma.$transaction([
      prisma.shopAppPlanCodeRedemption.upsert({
        where: {
          shopId_planCodeId: {
            shopId,
            planCodeId: planCode.id,
          },
        },
        create: {
          shopId,
          planCodeId: planCode.id,
        },
        update: {
          redeemedAt: new Date(),
        },
      }),
      prisma.appPlanCode.update({
        where: { id: planCode.id },
        data: { usageCount: { increment: 1 } },
      }),
    ]);

    const plan = planCode.appPlan;

    return {
      ok: true,
      customPlan: {
        name: plan.name,
        slug: plan.slug,
        price: plan.price?.toNumber ? plan.price.toNumber() : Number(plan.price),
        currency: plan.currency,
        interval: plan.interval as "MONTHLY" | "YEARLY",
        code: planCode.code,
        title: planCode.title ?? undefined,
      },
    };
  }

  return { ok: false };
}

// -----------------------------------------------------------------------------
// COMPONENT
// -----------------------------------------------------------------------------
export default function PlansPage() {
  const loaderData = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const navigate = useNavigate();
  const { isCompact, paneMode } = usePaneMode();

  const [activating, setActivating] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [activeTab, setActiveTab] = useState<"plans" | "usage" | "history">("plans");

  const customPlan = fetcher.data?.customPlan ?? loaderData.customPlan ?? null;
  const redeemError = fetcher.data?.error ?? null;
  const [showCustom, setShowCustom] = useState(!!loaderData.customPlan);

  useEffect(() => {
    if (customPlan) {
      setShowCustom(true);
    } else {
      setShowCustom(false);
    }
  }, [customPlan]);

  const handleSelectPlan = async (plan: { slug?: string; price?: number; name?: string }) => {
    setActivating(true);
    const body: Record<string, unknown> = {
      planSlug: plan.slug ?? "custom",
      cycle: "monthly",
    };
    if (!plan.slug && plan.price !== undefined) {
      body.customAmount = plan.price;
    }

    const res = await fetch("/api/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (data?.url) {
      (window.top ?? window).location.href = data.url;
    } else if (data?.error) {
      console.error("Subscribe error:", data.error);
    }
    setActivating(false);
  };

  const handleCancelSubscription = async () => {
    if (!confirm("Are you sure you want to cancel your subscription? You will be moved to the free plan.")) {
      return;
    }
    setCancelling(true);
    const res = await fetch("/api/unsubscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const data = await res.json();
    if (data?.ok) {
      navigate("/app", { replace: true });
    } else if (data?.error) {
      console.error("Cancel error:", data.error);
      alert("Failed to cancel subscription: " + data.error);
    }
    setCancelling(false);
  };

  return (
    <>
      <ThreePaneLayout
        header={{
          backButton: {
            label: "Dashboard",
            onClick: () => navigate("/app"),
          },
          title: "Billing & Plans",
          badge: {
            text: loaderData.plan?.name || "Free",
            tone: loaderData.plan?.isFree ? "info" : "magic"
          },
          actions: (
            <Button onClick={() => setOpen(true)}>Redeem Code</Button>
          ),
        }}
        contentLayout="contained"
        rightPaneTitle="Summary"
        rightPane={
          <PlanSummaryPane
            plan={loaderData.plan}
            onContactSupport={() => window.open("mailto:support@shopwise.ai")}
          />
        }
        rightPaneMode={paneMode}
        rightPaneCollapsed={isCompact}
      >
        <Box padding="600">
          <BlockStack gap="600">
            {activeTab === "plans" && (
              <BlockStack gap="400">
                <PlansSectionHeader
                  title="Choose your plan"
                  description="Select a plan that fits your store's size and needs."
                />

                <Plans
                  loading={fetcher.state === "submitting"}
                  activating={activating}
                  cancelling={cancelling}
                  planBrackets={PLAN_BRACKETS}
                  selectedPlan={loaderData.plan}
                  onSelectPlan={handleSelectPlan}
                  customPlan={showCustom ? customPlan : null}
                  onSelectCustomPlan={handleSelectPlan}
                  isCustomPlanActive={loaderData.isCustomPlanActive}
                  onCancelSubscription={handleCancelSubscription}
                />
              </BlockStack>
            )}

            {activeTab === "usage" && (
              <BlockStack gap="400">
                <PlansSectionHeader
                  title="Usage & Limits"
                  description="Monitor your current consumption against plan limits."
                />
                <PlansUsageCard />
              </BlockStack>
            )}
          </BlockStack>
        </Box>
      </ThreePaneLayout>
      <RedeemCodeModal
        open={open}
        code={code}
        loading={fetcher.state === "submitting"}
        error={redeemError}
        onClose={() => setOpen(false)}
        onCodeChange={setCode}
        onSubmit={() => {
          fetcher.submit({ intent: "redeem", code }, { method: "POST" });
          setOpen(false);
        }}
      />
    </>
  );
}
