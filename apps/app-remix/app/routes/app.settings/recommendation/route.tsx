export { RouteErrorBoundary as ErrorBoundary } from "../../../components/RouteErrorBoundary";
import { useNavigate } from "react-router";
import {
  LoaderFunctionArgs,
  ActionFunctionArgs,
  useFetcher,
  useLoaderData,
} from "react-router";
import { useState, useEffect, useMemo } from "react";

import {
  BlockStack as PolarisBlockStack,
  Box as PolarisBox,
  Divider as PolarisDivider,
  Text as PolarisText,
  Button as PolarisButton,
  InlineStack as PolarisInlineStack,
  Badge as PolarisBadge,
} from "@shopify/polaris";
import { useAppBridge } from "@shopify/app-bridge-react";

const BlockStack = PolarisBlockStack as any;
const Box = PolarisBox as any;
const Divider = PolarisDivider as any;
const Text = PolarisText as any;
const Button = PolarisButton as any;
const InlineStack = PolarisInlineStack as any;
const Badge = PolarisBadge as any;

import { Footer } from "@repo/ui/components/Footer";
import { authenticate } from "../../../shopify.server";
import { useAppStore } from "../../../store/app-store";
import prisma from "../../../db.server";
import { CloudFrontClient, CreateInvalidationCommand } from "@aws-sdk/client-cloudfront";
import {
  BundlesSection,
  CacheSection,
  CatalogSyncSection,
  RecommendationTipsPane,
  RecommendersSection,
} from "./components";

// ————————————————————————————————————————————————————————
// Types
// ————————————————————————————————————————————————————————

type RecoKey =
  | "similar"
  | "color"
  | "trending"
  | "newArrivals"
  | "bestSellers"
  | "bundles";

type Recommenders = Record<RecoKey, boolean>;

const DEFAULT_RECOMMENDERS: Recommenders = {
  similar: true,
  color: true,
  trending: true,
  newArrivals: true,
  bestSellers: true,
  bundles: true,
};

// ————————————————————————————————————————————————————————
// Loader: fetch toggle state from ShopSettings
// ————————————————————————————————————————————————————————

const SYNC_COOLDOWN_DAYS = 30;
const CACHE_COOLDOWN_HOURS = 24;

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shopId = session.shop;

  const [settings, shopStatus] = await Promise.all([
    prisma.shopSettings.findUnique({
      where: { shopId },
      select: { recommenders: true },
    }),
    prisma.shopStatus.findUnique({
      where: { shopId },
      select: { productSyncEnded: true, productSyncState: true, cacheLastCleared: true },
    }),
  ]);

  // Merge stored recommenders with defaults (in case new rails are added)
  const stored = (settings?.recommenders as Recommenders) ?? {};
  const recommenders: Recommenders = { ...DEFAULT_RECOMMENDERS, ...stored };

  // Calculate sync availability (30 day cooldown)
  const lastSyncDate = shopStatus?.productSyncEnded ?? null;
  const isSyncing = shopStatus?.productSyncState === "RUNNING";

  let canSync = true;
  let daysUntilNextSync = 0;

  if (lastSyncDate) {
    const daysSinceLastSync = Math.floor(
      (Date.now() - new Date(lastSyncDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    daysUntilNextSync = SYNC_COOLDOWN_DAYS - daysSinceLastSync;
    canSync = daysSinceLastSync >= SYNC_COOLDOWN_DAYS;
  }

  // Calculate cache clear availability (24 hour cooldown)
  const lastCacheCleared = shopStatus?.cacheLastCleared ?? null;
  let canClearCache = true;
  let hoursUntilNextClear = 0;

  if (lastCacheCleared) {
    const hoursSinceLastClear = Math.floor(
      (Date.now() - new Date(lastCacheCleared).getTime()) / (1000 * 60 * 60)
    );
    hoursUntilNextClear = CACHE_COOLDOWN_HOURS - hoursSinceLastClear;
    canClearCache = hoursSinceLastClear >= CACHE_COOLDOWN_HOURS;
  }

  return {
    recommenders,
    lastSyncDate: lastSyncDate?.toISOString() ?? null,
    canSync,
    isSyncing,
    daysUntilNextSync: daysUntilNextSync > 0 ? daysUntilNextSync : 0,
    lastCacheCleared: lastCacheCleared?.toISOString() ?? null,
    canClearCache,
    hoursUntilNextClear: hoursUntilNextClear > 0 ? hoursUntilNextClear : 0,
  };
};

// ————————————————————————————————————————————————————————
// Action: handle multiple action types
// ————————————————————————————————————————————————————————

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const shopId = session.shop;

  const fd = await request.formData();
  const actionType = fd.get("actionType") as string;

  // Handle recommender settings save
  if (actionType === "save-recommenders") {
    const recommenders = JSON.parse(fd.get("recommenders") as string);
    await prisma.shopSettings.upsert({
      where: { shopId },
      create: { shopId, recommenders },
      update: { recommenders },
    });
    return { ok: true, action: "save-recommenders" };
  }

  // Handle clear cache - invalidate CloudFront for this shop's recommendation routes
  if (actionType === "clear-cache") {
    try {
      // Check 24-hour cooldown
      const shopStatus = await prisma.shopStatus.findUnique({
        where: { shopId },
        select: { cacheLastCleared: true },
      });

      if (shopStatus?.cacheLastCleared) {
        const hoursSinceLastClear = Math.floor(
          (Date.now() - new Date(shopStatus.cacheLastCleared).getTime()) / (1000 * 60 * 60)
        );
        if (hoursSinceLastClear < CACHE_COOLDOWN_HOURS) {
          const hoursRemaining = CACHE_COOLDOWN_HOURS - hoursSinceLastClear;
          return {
            ok: false,
            action: "clear-cache",
            error: `You can clear cache again in ${hoursRemaining} hour${hoursRemaining === 1 ? '' : 's'}`,
          };
        }
      }

      const distributionId = process.env.CLOUDFRONT_DISTRIBUTION_ID;
      if (!distributionId) {
        return { ok: false, action: "clear-cache", error: "CloudFront distribution not configured" };
      }

      // Invalidate all recommendation routes for this shop
      // Pattern: /proxy/recs/{shopId}/*
      const cf = new CloudFrontClient({});
      await cf.send(new CreateInvalidationCommand({
        DistributionId: distributionId,
        InvalidationBatch: {
          CallerReference: `${shopId}-${Date.now()}`,
          Paths: {
            Quantity: 1,
            Items: [`/proxy/recs/${shopId}/*`],
          },
        },
      }));

      // Update cacheLastCleared timestamp
      await prisma.shopStatus.upsert({
        where: { shopId },
        create: { shopId, cacheLastCleared: new Date() },
        update: { cacheLastCleared: new Date() },
      });

      return { ok: true, action: "clear-cache" };
    } catch (err: any) {
      return { ok: false, action: "clear-cache", error: err.message ?? "Failed to clear cache" };
    }
  }

  // Handle product catalog resync
  if (actionType === "resync-catalog") {
    try {
      // Check 30-day cooldown
      const shopStatus = await prisma.shopStatus.findUnique({
        where: { shopId },
        select: { productSyncEnded: true },
      });

      if (shopStatus?.productSyncEnded) {
        const daysSinceLastSync = Math.floor(
          (Date.now() - new Date(shopStatus.productSyncEnded).getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysSinceLastSync < SYNC_COOLDOWN_DAYS) {
          const daysRemaining = SYNC_COOLDOWN_DAYS - daysSinceLastSync;
          return {
            ok: false,
            action: "resync-catalog",
            error: `You can resync again in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}`,
          };
        }
      }

      // 1. Start bulk operation and wait for completion
      const { runProductsExportAndGetUrl } = await import("../../../services/bulk.service.server");
      const url = await runProductsExportAndGetUrl(admin, shopId);

      // 2. Fetch the file from Shopify
      const res = await fetch(url);
      if (!res.ok) {
        return { ok: false, action: "resync-catalog", error: `Failed to fetch export: ${res.status}` };
      }

      // 3. Upload to S3 to trigger the enrich pipeline
      const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
      const bucket = process.env.BULK_UPLOAD_BUCKET;
      if (!bucket) {
        return { ok: false, action: "resync-catalog", error: "BULK_UPLOAD_BUCKET not configured" };
      }

      const buf = Buffer.from(await res.arrayBuffer());
      const s3 = new S3Client({});
      const key = `${shopId}/bulk-${Date.now()}-resync.jsonl`;

      await s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: buf,
          ContentType: "application/jsonl",
        })
      );

      return { ok: true, action: "resync-catalog" };
    } catch (err: any) {
      return { ok: false, action: "resync-catalog", error: err.message ?? "Sync failed" };
    }
  }

  return { ok: false, error: "Unknown action" };
};


// ————————————————————————————————————————————————————————
// MAIN PAGE
// ————————————————————————————————————————————————————————

export default function Settings() {
  const navigate = useNavigate();
  const loaderData = useLoaderData<typeof loader>();
  const fetcher = useFetcher<{ ok: boolean; action?: string; error?: string }>();
  const shopify = useAppBridge();
  const showSync = useAppStore((s) => s.showSync);
  const setSettingsState = useAppStore((s) => s.setSettingsState);

  const { recommenders: initialRecommenders, canSync, isSyncing, daysUntilNextSync, lastSyncDate, canClearCache, hoursUntilNextClear, lastCacheCleared } = loaderData;

  const [recommenders, setRecommenders] = useState<Recommenders>(initialRecommenders);
  const [syncLoading, setSyncLoading] = useState(false);
  const [cacheLoading, setCacheLoading] = useState(false);

  // Sync state with loader data
  useEffect(() => {
    setRecommenders(initialRecommenders);
  }, [initialRecommenders]);

  // Handle action responses
  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data) {
      if (fetcher.data.action === "resync-catalog") {
        setSyncLoading(false);
        if (fetcher.data.ok) {
          showSync("Product sync started...", false, "PRODUCT");
        } else {
          shopify.toast.show(fetcher.data.error || "Sync failed", { isError: true });
        }
      }
      if (fetcher.data.action === "clear-cache") {
        setCacheLoading(false);
        if (!fetcher.data.ok) {
          shopify.toast.show(fetcher.data.error || "Failed to clear cache", { isError: true });
        }
      }
    }
  }, [fetcher.state, fetcher.data, shopify, showSync]);

  // Check if any value has changed
  const isDirty = useMemo(() => {
    return Object.keys(initialRecommenders).some(
      (key) => recommenders[key as RecoKey] !== initialRecommenders[key as RecoKey]
    );
  }, [recommenders, initialRecommenders]);

  // Handle recommender settings save
  const handleSave = () => {
    const fd = new FormData();
    fd.append("actionType", "save-recommenders");
    fd.append("recommenders", JSON.stringify(recommenders));
    fetcher.submit(fd, { method: "post" });
    shopify.saveBar.hide("recommenders-save-bar");
    shopify.toast.show("Settings saved");
  };

  // Sync local settings state to global store for header Save button
  useEffect(() => {
    setSettingsState({
      isDirty,
      onSave: handleSave,
      isLoading: fetcher.state !== "idle",
      rightPane: <RecommendationTipsPane />,
    });

    return () => setSettingsState({ isDirty: false, onSave: undefined, isLoading: false, rightPane: undefined });
  }, [isDirty, fetcher.state, setSettingsState]);

  return (
    <Box padding="800">
      <BlockStack gap="600">
        <BlockStack gap="200">
          <InlineStack gap="300" blockAlign="center">
            <Text variant="headingLg" as="h1">Recommendation Settings</Text>
            {useAppStore.getState().sync.open && useAppStore.getState().sync.type === "PRODUCT" && (
              <Badge tone={useAppStore.getState().isSyncComplete() ? "success" : "attention"}>
                {useAppStore.getState().sync.message}
              </Badge>
            )}
          </InlineStack>
          <Text variant="bodyMd" as="p" tone="subdued">Control which recommendation engines are active and manage your product catalog data.</Text>
        </BlockStack>

        <RecommendersSection
          recommenders={recommenders}
          onToggle={(key, next) => setToggle(key)(next)}
        />

        <Divider />

        <BundlesSection
          enabled={recommenders.bundles}
          onToggle={setToggle("bundles")}
        />

        <Divider />

        <CacheSection
          canClearCache={canClearCache}
          hoursUntilNextClear={hoursUntilNextClear}
          lastCacheCleared={lastCacheCleared}
          cacheLoading={cacheLoading}
          onClearCache={() => {
            setCacheLoading(true);
            const fd = new FormData();
            fd.append("actionType", "clear-cache");
            fetcher.submit(fd, { method: "post" });
            shopify.toast.show("Clearing cache...");
          }}
        />

        <Divider />

        <CatalogSyncSection
          canSync={canSync}
          isSyncing={isSyncing}
          daysUntilNextSync={daysUntilNextSync}
          lastSyncDate={lastSyncDate}
          syncLoading={syncLoading}
          onSync={() => {
            setSyncLoading(true);
            const fd = new FormData();
            fd.append("actionType", "resync-catalog");
            fetcher.submit(fd, { method: "post" });
          }}
        />
      </BlockStack>

      <Footer
        text="Learn more about"
        linkLabel="recommendation strategies"
        linkUrl="https://help.shopify.com/manual/online-store/themes/theme-structure/sections"
      />
    </Box>
  );

  function setToggle(key: RecoKey) {
    return (next: boolean) => {
      setRecommenders((s) => ({ ...s, [key]: next }));
    };
  }
}
