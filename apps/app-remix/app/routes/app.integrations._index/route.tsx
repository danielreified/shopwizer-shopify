// app/routes/app.integrations._index/route.tsx
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useFetcher, useNavigate, useSearchParams } from "react-router";
import { useState, useCallback, useEffect, useMemo } from "react";
import {
  BlockStack,
  Box,
  Button,
} from "@shopify/polaris";
import { SaveBar, useAppBridge } from "@shopify/app-bridge-react";
import { ThreePaneLayout } from "@repo/ui/components/ThreePaneLayout";
import OnboardingFab from "../../components/OnboardingFab.app";
import {
  IntegrationsCategoryList,
  IntegrationsCardsGrid,
  IntegrationsIntro,
} from "./components";
import { usePaneMode } from "../../hooks/use-pane-mode";

import prisma from "../../db.server";
import { authenticate } from "../../shopify.server";

const APP_CONFIG: Record<string, { provider: any; category: any }> = {
  swym: { provider: "SWYM", category: "WISHLIST" },
  "growave-wishlist": { provider: "GROWAVE", category: "WISHLIST" },
  judgeme: { provider: "JUDGE_ME", category: "REVIEWS" },
  okendo: { provider: "OKENDO", category: "REVIEWS" },
  "growave-reviews": { provider: "GROWAVE", category: "REVIEWS" },
  yotpo: { provider: "YOTPO", category: "REVIEWS" },
  loox: { provider: "LOOX", category: "REVIEWS" },
};

const PROVIDER_TO_APP: Record<string, Record<string, string>> = {
  WISHLIST: { SWYM: "swym", GROWAVE: "growave-wishlist" },
  REVIEWS: {
    JUDGE_ME: "judgeme",
    OKENDO: "okendo",
    GROWAVE: "growave-reviews",
    YOTPO: "yotpo",
    LOOX: "loox",
  },
};

type Category = "wishlist" | "reviews";

function getCategoryFromSearch(searchParams: URLSearchParams): Category {
  return searchParams.get("category") === "reviews" ? "reviews" : "wishlist";
}

const categories: { id: Category; label: string; description: string }[] = [
  { id: "wishlist", label: "Wishlist", description: "Let customers save favorite products" },
  { id: "reviews", label: "Reviews", description: "Display product reviews & ratings" },
];

const wishlistApps = [
  {
    id: "swym",
    name: "Swym Wishlist Plus",
    description: "Most popular wishlist app with powerful features",
    logo: "https://cdn.shopify.com/app-store/listing_images/d612f58ce0decfaba38849af3396fb5b/icon/CKKXmdzFx_MCEAE=.jpeg",
  },
  {
    id: "growave-wishlist",
    name: "Growave",
    description: "All-in-one marketing platform with wishlist",
    logo: "https://cdn.shopify.com/app-store/listing_images/59da3ad107e08fd5430db47cc4e0a75c/icon/CP6GuOOMn4sDEAE=.png",
  },
];

const reviewApps = [
  {
    id: "judgeme",
    name: "Judge.me",
    description: "Product reviews with photos & videos",
    logo: "https://cdn.shopify.com/app-store/listing_images/8cada0f5da411a64e756606bb036f1ed/icon/CIfp9fWd34sDEAE=.png",
  },
  {
    id: "okendo",
    name: "Okendo",
    description: "Customer reviews & UGC platform",
    logo: "https://cdn.shopify.com/app-store/listing_images/fe55626671bd5da73785c606c2b0752f/icon/CNKRrIWatfoCEAE=.png",
  },
  {
    id: "growave-reviews",
    name: "Growave",
    description: "All-in-one with reviews & ratings",
    logo: "https://cdn.shopify.com/app-store/listing_images/59da3ad107e08fd5430db47cc4e0a75c/icon/CP6GuOOMn4sDEAE=.png",
  },
  {
    id: "yotpo",
    name: "Yotpo",
    description: "Reviews, ratings & visual marketing",
    logo: "https://cdn.shopify.com/app-store/listing_images/659062da3dcade1068da9e28c3d120c5/icon/CIzTtYS0i4cDEAE=.png",
    requiresInstanceId: true,
  },
  {
    id: "loox",
    name: "Loox",
    description: "Photo reviews & referrals",
    logo: "https://cdn.shopify.com/app-store/listing_images/252ae7c55fa0e8a35df7f6ff3c8c1596/icon/CPLp1Kb0lu8CEAE=.jpg",
  },
];

// LOADER
export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);

  const integrations = await prisma.shopIntegration.findMany({
    where: { shopId: session.shop, enabled: true },
  });

  let activeWishlist: string | null = null;
  let activeReview: string | null = null;
  let yotpoInstanceId: string | null = null;

  integrations.forEach((i) => {
    const appId = PROVIDER_TO_APP[i.category]?.[i.provider];
    if (i.category === "WISHLIST") activeWishlist = appId ?? null;
    else {
      activeReview = appId ?? null;
      if (i.provider === "YOTPO" && i.meta) {
        yotpoInstanceId = (i.meta as any)?.instanceId ?? null;
      }
    }
  });

  return { activeWishlist, activeReview, yotpoInstanceId };
}

// ACTION
export async function action({ request }: ActionFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const shopId = session.shop;

  const formData = await request.formData();
  const wishlistApp = formData.get("wishlistApp") as string | null;
  const reviewApp = formData.get("reviewApp") as string | null;
  const instanceId = formData.get("instanceId") as string | null;

  // Disable all existing integrations first
  await prisma.shopIntegration.updateMany({
    where: { shopId },
    data: { enabled: false },
  });

  // Enable wishlist app if selected
  if (wishlistApp && APP_CONFIG[wishlistApp]) {
    const config = APP_CONFIG[wishlistApp];
    await prisma.shopIntegration.upsert({
      where: {
        shopId_category_provider: {
          shopId,
          category: config.category,
          provider: config.provider,
        },
      },
      create: {
        shopId,
        category: config.category,
        provider: config.provider,
        enabled: true,
      },
      update: { enabled: true },
    });
  }

  // Enable review app if selected
  if (reviewApp && APP_CONFIG[reviewApp]) {
    const config = APP_CONFIG[reviewApp];
    const meta = reviewApp === "yotpo" && instanceId ? { instanceId } : undefined;
    await prisma.shopIntegration.upsert({
      where: {
        shopId_category_provider: {
          shopId,
          category: config.category,
          provider: config.provider,
        },
      },
      create: {
        shopId,
        category: config.category,
        provider: config.provider,
        enabled: true,
        meta,
      },
      update: { enabled: true, ...(meta ? { meta } : {}) },
    });
  }

  return { success: true };
}

// COMPONENT
export default function IntegrationsPage() {
  const loaderData = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const shopify = useAppBridge();
  const { isCompact, paneMode } = usePaneMode();

  // Category selection
  const queryCategory = getCategoryFromSearch(searchParams);
  const [selectedCategory, setSelectedCategory] = useState<Category>(queryCategory);

  // Local state
  const [activeWishlist, setActiveWishlist] = useState(loaderData.activeWishlist);
  const [activeReview, setActiveReview] = useState(loaderData.activeReview);
  const [yotpoInstanceId, setYotpoInstanceId] = useState(loaderData.yotpoInstanceId ?? "");

  // Sync local state with loader data
  useEffect(() => {
    setActiveWishlist(loaderData.activeWishlist);
    setActiveReview(loaderData.activeReview);
    setYotpoInstanceId(loaderData.yotpoInstanceId ?? "");
  }, [loaderData]);

  useEffect(() => {
    setSelectedCategory(queryCategory);
  }, [queryCategory]);

  // Check if any value has changed
  const isDirty = useMemo(() => {
    return (
      activeWishlist !== loaderData.activeWishlist ||
      activeReview !== loaderData.activeReview ||
      yotpoInstanceId !== (loaderData.yotpoInstanceId ?? "")
    );
  }, [activeWishlist, activeReview, yotpoInstanceId, loaderData]);

  // Show/hide save bar based on dirty state
  useEffect(() => {
    if (isDirty) {
      shopify.saveBar.show("integrations-save-bar");
    } else {
      shopify.saveBar.hide("integrations-save-bar");
    }
  }, [isDirty, shopify]);

  // Toggle functions
  const toggleWishlist = useCallback((appId: string) => {
    setActiveWishlist((prev) => (prev === appId ? null : appId));
  }, []);

  const toggleReview = useCallback((appId: string) => {
    setActiveReview((prev) => (prev === appId ? null : appId));
  }, []);

  // Save all changes
  const handleSave = () => {
    const fd = new FormData();
    if (activeWishlist) fd.append("wishlistApp", activeWishlist);
    if (activeReview) fd.append("reviewApp", activeReview);
    if (activeReview === "yotpo" && yotpoInstanceId) {
      fd.append("instanceId", yotpoInstanceId);
    }
    fetcher.submit(fd, { method: "post" });
    shopify.saveBar.hide("integrations-save-bar");
    shopify.toast.show("Integrations saved");
  };

  // Discard all changes
  const handleDiscard = () => {
    setActiveWishlist(loaderData.activeWishlist);
    setActiveReview(loaderData.activeReview);
    setYotpoInstanceId(loaderData.yotpoInstanceId ?? "");
    shopify.saveBar.hide("integrations-save-bar");
  };

  const handleCategorySelect = useCallback(
    (id: string) => {
      const nextCategory = id === "reviews" ? "reviews" : "wishlist";
      setSelectedCategory(nextCategory);

      const nextSearchParams = new URLSearchParams(searchParams);
      nextSearchParams.set("category", nextCategory);
      setSearchParams(nextSearchParams, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  // Get apps for selected category
  const currentApps = selectedCategory === "wishlist" ? wishlistApps : reviewApps;
  const currentActive = selectedCategory === "wishlist" ? activeWishlist : activeReview;
  const toggleFn = selectedCategory === "wishlist" ? toggleWishlist : toggleReview;

  // Count active integrations per category
  const wishlistCount = activeWishlist ? 1 : 0;
  const reviewCount = activeReview ? 1 : 0;

  return (
    <>
      {/* Contextual Save Bar */}
      <SaveBar id="integrations-save-bar">
        <button variant="primary" onClick={handleSave}></button>
        <button onClick={handleDiscard}></button>
      </SaveBar>

      <ThreePaneLayout
        header={{
          backButton: {
            label: "Settings",
            onClick: () => navigate("/app"),
          },
          title: "Integrations",
          actions: (
            <Button variant="primary" onClick={handleSave} disabled={!isDirty}>
              Save Changes
            </Button>
          ),
        }}
        leftPaneTitle="Categories"
        leftPane={
          <IntegrationsCategoryList
            categories={categories}
            selectedCategory={selectedCategory}
            counts={{ wishlist: wishlistCount, reviews: reviewCount }}
            onSelect={handleCategorySelect}
          />
        }
        leftPaneBottom={
          <OnboardingFab variant="sidebar" />
        }
        contentLayout="contained"
        collapsible={true}
        leftPaneMode={paneMode}
        rightPaneMode={paneMode}
        leftPaneCollapsed={isCompact}
        rightPaneCollapsed={isCompact}
      >
        {/* Main Content */}
        <Box padding="600">
          <BlockStack gap="600">
            <IntegrationsIntro category={selectedCategory} />

            <IntegrationsCardsGrid
              apps={currentApps}
              activeAppId={currentActive}
              onToggle={toggleFn}
              yotpoInstanceId={yotpoInstanceId}
              onYotpoInstanceChange={setYotpoInstanceId}
            />
          </BlockStack>
        </Box>
      </ThreePaneLayout>
    </>
  );
}
