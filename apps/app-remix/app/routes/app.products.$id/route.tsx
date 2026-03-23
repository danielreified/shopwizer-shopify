export { RouteErrorBoundary as ErrorBoundary } from "../../components/RouteErrorBoundary";
import { useEffect, useRef, useState } from "react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { useLoaderData, useNavigate, useFetcher, useNavigation, useRevalidator } from "react-router";
import {
  BlockStack as PolarisBlockStack,
  Button,
  InlineStack as PolarisInlineStack,
  Text as PolarisText,
  useIndexResourceState
} from "@shopify/polaris";

import { Footer, ThreePaneLayout } from "@repo/ui";
import OnboardingFabComponent from "../../components/OnboardingFab.app";
import ProductPickerModal from "../../components/ProductPickerModal";
import { authenticate } from "../../shopify.server";
import { buildFormData } from "../../lib/form-actions";
import prisma from "../../db.server";
import { makeDebug } from "../../utils/debug.server";
import { getProductById, type ProductDetailDTO } from "../../lib/products.server";
import type { Variant } from "../../components/products";
import { getSimilarProducts } from "../../services/recommendations/similar.server";
import { getTrendingProducts } from "../../services/recommendations/trending.server";
import { getArrivals } from "../../services/recommendations/arrivals.server";
import { getSellerRecommendations } from "../../services/recommendations/sellers.server";
import { enrichProducts } from "../../services/recommendations/helpers.server/enrichment";
import { getSlotIndex } from "../../services/recommendations/helpers.server/slot-index";
import {
  BundlesSection,
  ProductDetailsPane,
  ProductSidebar,
  RecommendationsSection,
} from "./components";
import { usePaneMode } from "../../hooks/use-pane-mode";

const InlineStack = PolarisInlineStack as any;
const BlockStack = PolarisBlockStack as any;
const Text = PolarisText as any;
const OnboardingFab = OnboardingFabComponent as any;

function getBundleLabel(slotIndex: number) {
  return `Bundle ${slotIndex}`;
}

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const dbg = makeDebug(request);
  const { session } = await authenticate.admin(request);

  const domain = session.shop;
  const productId = (params.productId ?? params.id) as string;

  if (!productId) {
    return dbg.json({
      domain, productId: "", error: "Missing productId", product: null, variants: [],
      similarProducts: [], sellersProducts: [], trendingProducts: [], arrivalsProducts: [],
    });
  }

  const normalize = (items: any[]) =>
    items.map((r: any, i: number) => ({
      id: r.id?.toString?.() ?? r.productId?.toString?.() ?? `tmp-${i}`,
      title: r.title ?? r.handle ?? "Untitled",
      handle: r.handle ?? "",
      image: r.imageUrl ? { src: r.imageUrl, alt: r.title ?? r.handle } : null,
      categoryId: r.categoryId?.toString?.() ?? r.category_id?.toString?.() ?? null,
      price: r.price ?? null,
      variantId: r.variantId?.toString?.() ?? null,
      vendor: r.vendor ?? null,
      colorLabel: r.color_label ?? null,
      colorHex: r.color_hex ?? null,
      merchandisingBasket: r.merchandisingBasket ?? null,
      enabled: r.enabled ?? true,
    }));

  let similar: any[] = [];
  try { const res = await getSimilarProducts(domain, productId, "admin"); similar = res?.results ?? []; } catch (err) { }

  let sellers: any[] = [];
  try { const res = await getSellerRecommendations(domain, productId, "admin"); sellers = res?.results ?? []; } catch (err) { }

  let trending: any[] = [];
  try { const res = await getTrendingProducts(domain, productId, "admin"); trending = res?.results ?? []; } catch (err) { }

  let arrivals: any[] = [];
  try { const res = await getArrivals(domain, "admin"); arrivals = res?.results ?? []; } catch (err) { }

  let product = null;
  let variants: any[] = [];
  try {
    product = await getProductById(domain, productId);
    if (product?.variants?.length) {
      variants = product.variants.filter((v: any) => v.color_label).map((v: any) => ({
        id: v.id, title: v.title, hex: v.color_hex ?? null, label: v.color_label,
      }));
    }
  } catch (err) { }

  if (!product) {
    return dbg.json({
      domain, productId, error: "Product not found", product: null, variants: [],
      similarProducts: normalize(similar), sellersProducts: normalize(sellers),
      trendingProducts: normalize(trending), arrivalsProducts: normalize(arrivals),
    });
  }


  // --- BUNDLES ---
  const bundlesData = await prisma.computedBundle.findMany({
    where: {
      productId: BigInt(productId),
      status: "ACTIVE",
      OR: [{ shopId: domain }, { shop: { domain } }],
    },
  });
  const slotMetricTotals = new Map<number, { views: number; clicks: number; conversions: number; revenue: number }>();
  try {
    const metricRows = await prisma.$queryRaw<Array<{
      slotIndex: number | bigint | null;
      views: number | bigint | null;
      clicks: number | bigint | null;
      conversions: number | bigint | null;
      revenue: number | null;
    }>>`
      SELECT
        COALESCE(
          cb."slotIndex",
          CASE LOWER(cb.variant)
            WHEN 'control' THEN 1
            WHEN 'explore' THEN 2
            WHEN 'explore_a' THEN 2
            WHEN 'explore_b' THEN 3
            WHEN 'bundle_1' THEN 1
            WHEN 'bundle_2' THEN 2
            WHEN 'bundle_3' THEN 3
            ELSE 1
          END
        ) AS "slotIndex",
        COALESCE(SUM(cb."views24h"), 0) AS views,
        COALESCE(SUM(cb."clicks24h"), 0) AS clicks,
        COALESCE(SUM(cb."conversions7d"), 0) AS conversions,
        COALESCE(SUM(cb."revenue7d"), 0) AS revenue
      FROM "ComputedBundle" cb
      LEFT JOIN "Shop" s ON s.id = cb."shopId"
      WHERE cb."productId" = ${BigInt(productId)}
        AND (cb."shopId" = ${domain} OR s.domain = ${domain})
      GROUP BY 1
    `;

    for (const row of metricRows) {
      const slotIndex = Number(row.slotIndex ?? 1);
      const views = typeof row.views === "bigint" ? Number(row.views) : Number(row.views ?? 0);
      const clicks = typeof row.clicks === "bigint" ? Number(row.clicks) : Number(row.clicks ?? 0);
      const conversions = typeof row.conversions === "bigint" ? Number(row.conversions) : Number(row.conversions ?? 0);
      const revenue = Number(row.revenue ?? 0);
      slotMetricTotals.set(slotIndex, { views, clicks, conversions, revenue });
    }
  } catch {
    // Keep loader resilient if historical aggregate query fails in local environments.
  }
  const pinConfigByBundleId = new Map<string, { pinnedIds: string[] }>();
  try {
    const pinRows = await prisma.$queryRaw<Array<{ id: string; pinConfig: any }>>`
      SELECT cb.id, cb."pinConfig"
      FROM "ComputedBundle" cb
      LEFT JOIN "Shop" s ON s.id = cb."shopId"
      WHERE cb."productId" = ${BigInt(productId)}
        AND cb.status = 'ACTIVE'
        AND (cb."shopId" = ${domain} OR s.domain = ${domain})
    `;
    for (const row of pinRows) {
      const pinnedIds = Array.isArray(row?.pinConfig?.pinnedIds)
        ? row.pinConfig.pinnedIds.map((id: any) => String(id))
        : [];
      pinConfigByBundleId.set(row.id, { pinnedIds });
    }
  } catch {
    // pinConfig column may not exist yet in local DB; keep UI functional without pins
  }

  const BUNDLE_MAX_ITEMS = 3;
  const allCandidateIds = new Set<bigint>();
  bundlesData.forEach(b => {
    const pinnedIds = pinConfigByBundleId.get(b.id)?.pinnedIds ?? [];
    pinnedIds.forEach((id) => allCandidateIds.add(BigInt(id)));
    if (Array.isArray(b.candidateIds)) {
      b.candidateIds.forEach((id: any) => allCandidateIds.add(BigInt(id)));
    }
  });

  const candidateProducts = await enrichProducts(Array.from(allCandidateIds).map(id => ({ id, handle: "" })));
  const productMap = new Map(candidateProducts.map(p => [p.id.toString(), p]));

  const bundles = [...bundlesData]
    .sort((a, b) => {
      const aSlot = Number((a as any).slotIndex ?? getSlotIndex(a.variant, 999));
      const bSlot = Number((b as any).slotIndex ?? getSlotIndex(b.variant, 999));
      if (aSlot !== bSlot) return aSlot - bSlot;
      return a.createdAt.getTime() - b.createdAt.getTime();
    })
    .map((b, idx) => {
      const pinnedIds = pinConfigByBundleId.get(b.id)?.pinnedIds ?? [];
      const candidateIds = Array.isArray(b.candidateIds)
        ? b.candidateIds.map((id: any) => String(id))
        : [];
      const mergedIds = Array.from(new Set([...pinnedIds, ...candidateIds])).slice(0, BUNDLE_MAX_ITEMS);
      const slotIndex = Number((b as any).slotIndex ?? getSlotIndex(b.variant, idx + 1));
      const slotTotals = slotMetricTotals.get(slotIndex);

      return {
        id: b.id,
        slotId: (b as any).slotId ?? null,
        variant: b.variant,
        slotIndex,
        label: getBundleLabel(slotIndex),
        weight: b.weight,
        views: slotTotals?.views ?? b.views24h,
        clicks: slotTotals?.clicks ?? b.clicks24h,
        conversions: slotTotals?.conversions ?? b.conversions7d,
        revenue: slotTotals?.revenue ?? b.revenue7d,
        pinnedIds,
        products: mergedIds
          .map((id) => {
            const p = productMap.get(id);
            if (!p) return null;
            return { ...p, id, pinned: pinnedIds.includes(id) };
          })
          .filter(Boolean)
      };
    });

  return dbg.json({
    domain, productId, product, variants,
    similarProducts: normalize(similar), sellersProducts: normalize(sellers),
    trendingProducts: normalize(trending), arrivalsProducts: normalize(arrivals),
    bundles,
  });
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const domain = session.shop;
  const productId = (params.productId ?? params.id) as string;
  if (!productId) return { ok: false, error: "Missing productId" };

  const fd = await request.formData();
  const intent = fd.get("intent");

  if (intent === "update-basket") {
    const basket = fd.get("basket") as string;
    const targetId = fd.get("targetId") as string || productId;

    await prisma.product.update({
      where: { id: BigInt(targetId) },
      data: {
        merchandisingBasket: (basket === "exclude" || basket === "none") ? null : basket,
        enabled: basket !== "exclude"
      }
    });
    return { ok: true };
  }

  if (intent === "toggleEnabled") {
    const product = await prisma.product.findUnique({
      where: { id: BigInt(productId) },
      select: { enabled: true },
    });
    if (!product) return { ok: false, error: "Product not found" };
    return { ok: true, enabled: !product.enabled };
  }

  if (intent === "generate-bundles") {
    await prisma.job.create({
      data: {
        shopId: domain,
        type: "BUNDLE_GENERATE",
        status: "PENDING",
        scheduleInterval: 24 // Default to once a day for manual triggers
      }
    });
    return { ok: true };
  }

  if (intent === "toggle-bundle-pin-product") {
    const bundleId = String(fd.get("bundleId") || "");
    const targetId = String(fd.get("targetId") || "");
    if (!bundleId || !targetId) {
      return { ok: false, bundleId, targetId, error: "Missing bundleId/targetId" };
    }
    try {
      const rows = await prisma.$queryRaw<Array<{
        id: string;
        status: string;
        candidateIds: any;
        pinConfig: any;
      }>>`
        SELECT cb.id, cb.status, cb."candidateIds", cb."pinConfig"
        FROM "ComputedBundle" cb
        LEFT JOIN "Shop" s ON s.id = cb."shopId"
        WHERE cb.id = ${bundleId}
          AND (cb."shopId" = ${domain} OR s.domain = ${domain})
        LIMIT 1
      `;
      const bundle = rows[0];

      if (!bundle || bundle.status !== "ACTIVE") {
        return { ok: false, bundleId, targetId, error: "Bundle not found" };
      }

      const candidateIds = Array.isArray(bundle.candidateIds)
        ? bundle.candidateIds.map((id: any) => String(id))
        : [];

      if (!candidateIds.includes(targetId)) {
        return { ok: false, bundleId, targetId, error: "Target is not in this bundle" };
      }

      const existing = bundle.pinConfig as { pinnedIds?: unknown } | null | undefined;
      const pinnedIds = Array.isArray(existing?.pinnedIds)
        ? existing.pinnedIds.map((id: any) => String(id))
        : [];

      const nextPinnedIds = pinnedIds.includes(targetId)
        ? pinnedIds.filter((id) => id !== targetId)
        : [...pinnedIds, targetId];

      if (nextPinnedIds.length > 0) {
        await prisma.$executeRaw`
          UPDATE "ComputedBundle"
          SET "pinConfig" = ${JSON.stringify({ pinnedIds: nextPinnedIds })}::jsonb,
              "updatedAt" = NOW()
          WHERE id = ${bundleId}
        `;
      } else {
        await prisma.$executeRaw`
          UPDATE "ComputedBundle"
          SET "pinConfig" = NULL,
              "updatedAt" = NOW()
          WHERE id = ${bundleId}
        `;
      }

      return { ok: true, bundleId, targetId, pinned: nextPinnedIds.includes(targetId) };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update pin state";
      const normalized = message.toLowerCase();
      return {
        ok: false,
        bundleId,
        targetId,
        error: normalized.includes("pinconfig")
          ? "Pin config column is missing. Run the latest DB migration."
          : message,
      };
    }
  }

  if (intent === "replace-bundle-product") {
    const bundleId = String(fd.get("bundleId") || "");
    const targetId = String(fd.get("targetId") || "");
    const replacementId = String(fd.get("replacementId") || "");
    if (!bundleId || !targetId || !replacementId) {
      return { ok: false, bundleId, targetId, replacementId, error: "Missing bundleId/targetId/replacementId" };
    }

    try {
      const rows = await prisma.$queryRaw<Array<{
        id: string;
        status: string;
        candidateIds: any;
        pinConfig: any;
      }>>`
        SELECT cb.id, cb.status, cb."candidateIds", cb."pinConfig"
        FROM "ComputedBundle" cb
        LEFT JOIN "Shop" s ON s.id = cb."shopId"
        WHERE cb.id = ${bundleId}
          AND (cb."shopId" = ${domain} OR s.domain = ${domain})
        LIMIT 1
      `;
      const bundle = rows[0];
      if (!bundle || bundle.status !== "ACTIVE") {
        return { ok: false, bundleId, targetId, replacementId, error: "Bundle not found" };
      }

      const candidateIds = Array.isArray(bundle.candidateIds)
        ? bundle.candidateIds.map((id: any) => String(id))
        : [];
      const targetIndex = candidateIds.findIndex((id) => id === targetId);
      if (targetIndex < 0) {
        return { ok: false, bundleId, targetId, replacementId, error: "Target is not in this bundle" };
      }

      if (candidateIds.includes(replacementId) && replacementId !== targetId) {
        return { ok: false, bundleId, targetId, replacementId, error: "Replacement already exists in bundle" };
      }
      if (replacementId === productId) {
        return { ok: false, bundleId, targetId, replacementId, error: "Cannot use source product in bundle targets" };
      }

      const replacementProduct = await prisma.product.findFirst({
        where: {
          id: BigInt(replacementId),
          status: "ACTIVE",
          enabled: true,
          OR: [{ shopId: domain }, { shop: { domain } }],
        },
        select: { id: true },
      });
      if (!replacementProduct) {
        return { ok: false, bundleId, targetId, replacementId, error: "Replacement product not available" };
      }

      const nextCandidateIds = [...candidateIds];
      nextCandidateIds[targetIndex] = replacementId;

      const existing = bundle.pinConfig as { pinnedIds?: unknown } | null | undefined;
      const pinnedIds = Array.isArray(existing?.pinnedIds)
        ? existing.pinnedIds.map((id: any) => String(id))
        : [];
      const hadTargetPinned = pinnedIds.includes(targetId);
      const nextPinnedIds = pinnedIds.filter((id) => id !== targetId);
      if (hadTargetPinned && !nextPinnedIds.includes(replacementId)) {
        nextPinnedIds.push(replacementId);
      }

      if (nextPinnedIds.length > 0) {
        await prisma.$executeRaw`
          UPDATE "ComputedBundle"
          SET "candidateIds" = ${JSON.stringify(nextCandidateIds)}::jsonb,
              "pinConfig" = ${JSON.stringify({ pinnedIds: nextPinnedIds })}::jsonb,
              "updatedAt" = NOW()
          WHERE id = ${bundleId}
        `;
      } else {
        await prisma.$executeRaw`
          UPDATE "ComputedBundle"
          SET "candidateIds" = ${JSON.stringify(nextCandidateIds)}::jsonb,
              "pinConfig" = NULL,
              "updatedAt" = NOW()
          WHERE id = ${bundleId}
        `;
      }

      return { ok: true, bundleId, targetId, replacementId };
    } catch (error) {
      return { ok: false, bundleId, targetId, replacementId, error: "Failed to replace bundle product" };
    }
  }

  return { ok: false, error: "Unknown intent" };
};


export default function Product() {
  const navigate = useNavigate();
  const fetcher = useFetcher();
  const pinFetcher = useFetcher();
  const editFetcher = useFetcher();
  const pickerFetcher = useFetcher<any>();
  const revalidator = useRevalidator();
  const navigation = useNavigation();
  const [merchandisingTarget, setMerchandisingTarget] = useState<{ id: string; title: string; basket: string } | null>(null);
  const [pinOverrides, setPinOverrides] = useState<Record<string, boolean>>({});
  const [editModal, setEditModal] = useState<{ open: boolean; bundleId: string; targetId: string }>({
    open: false,
    bundleId: "",
    targetId: "",
  });
  const [pickerSearchValue, setPickerSearchValue] = useState("");
  const pendingPinPrevRef = useRef<Record<string, boolean>>({});
  const { isCompact, paneMode } = usePaneMode();

  const isPinToggleLoading =
    pinFetcher.state !== "idle" && pinFetcher.formData?.get("intent") === "toggle-bundle-pin-product";
  const isEditLoading =
    editFetcher.state !== "idle" && editFetcher.formData?.get("intent") === "replace-bundle-product";
  const isLoading = navigation.state !== "idle" || fetcher.state !== "idle";
  const data = useLoaderData<typeof loader>() as any;
  const { product: productData, variants: variantsData, similarProducts, sellersProducts, trendingProducts, arrivalsProducts, colorProducts, bundles } = data;
  const pickerProducts = pickerFetcher.data?.products || [];
  const isPickerLoading = pickerFetcher.state === "loading";
  const { selectedResources, handleSelectionChange } = useIndexResourceState(pickerProducts);

  useEffect(() => {
    const d = pinFetcher.data as any;
    if (!d?.bundleId || !d?.targetId) return;
    const key = `${d.bundleId}:${d.targetId}`;
    if (d?.ok && typeof d?.pinned === "boolean") {
      setPinOverrides((prev) => ({ ...prev, [key]: d.pinned }));
      revalidator.revalidate();
    } else if (key in pendingPinPrevRef.current) {
      // Keep optimistic state for UX. We only hard-revert on explicit mismatch/not-found errors.
      const msg = String(d?.error || "").toLowerCase();
      const shouldRevert = msg.includes("not found") || msg.includes("not in this bundle");
      if (shouldRevert) {
        setPinOverrides((prev) => ({ ...prev, [key]: pendingPinPrevRef.current[key] }));
      }
    }
    delete pendingPinPrevRef.current[key];
  }, [pinFetcher.data, revalidator]);

  useEffect(() => {
    setPinOverrides({});
    pendingPinPrevRef.current = {};
  }, [data.productId]);

  useEffect(() => {
    if (!editModal.open) return;
    try {
      pickerFetcher.load(`/api/products?q=${encodeURIComponent(pickerSearchValue)}&pageSize=50`);
    } catch (error) {
      console.error("Failed to load picker products", error);
    }
  }, [editModal.open, pickerSearchValue]);

  useEffect(() => {
    const result = editFetcher.data as any;
    if (result?.ok) {
      setEditModal({ open: false, bundleId: "", targetId: "" });
      setPickerSearchValue("");
      // @ts-ignore Polaris selection callback typing
      handleSelectionChange("all", false);
      revalidator.revalidate();
    }
  }, [editFetcher.data]);

  if (!productData) return null;
  const product = productData as ProductDetailDTO;
  const variants = (variantsData ?? []) as Variant[];
  const storeName = data.domain.replace(".myshopify.com", "");
  const shopifyProductUrl = `https://admin.shopify.com/store/${storeName}/products/${data.productId}`;
  const shopifyCategoryUrl = `${shopifyProductUrl}#ProductCategoryPickerIdLabel`;

  const isEnabled = fetcher.formData
    ? fetcher.formData.get("intent") === "toggleEnabled"
      ? !product.enabled
      : product.enabled
    : product.enabled;

  const toggleEnabled = () => {
    fetcher.submit(buildFormData("toggleEnabled"), { method: "post" });
  };

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const bundlesWithPinState = (bundles || []).map((bundle: any) => ({
    ...bundle,
    products: (bundle.products || []).map((p: any) => {
      const key = `${bundle.id}:${p.id}`;
      const pinned = key in pinOverrides ? pinOverrides[key] : p.pinned;
      return { ...p, pinned };
    }),
  }));

  return (
    <ThreePaneLayout
      loading={isLoading}
      header={{
        title: product.title,
        backButton: { label: "Products", onClick: () => navigate("/app/products") },
        badge: { text: isEnabled ? "Enabled" : "Disabled", tone: isEnabled ? "success" : "critical" },
        actions: (
          <InlineStack gap="200" wrap={isCompact}>
            <Button url={shopifyProductUrl} external>Edit in Shopify</Button>
            <Button variant="primary" onClick={toggleEnabled} loading={fetcher.state !== "idle"}>
              {isEnabled ? "Disable Product" : "Enable Product"}
            </Button>
          </InlineStack>
        )
      }}
      leftPane={
        <ProductSidebar
          bundles={bundlesWithPinState}
          onScrollTo={scrollTo}
        />
      }
      leftPaneBottom={
        <OnboardingFab variant="sidebar" />
      }
      rightPaneTitle="Product Details"
      rightPane={
        <ProductDetailsPane
          product={product}
          variants={variants}
          shopifyProductUrl={shopifyProductUrl}
          shopifyCategoryUrl={shopifyCategoryUrl}
          merchandisingTarget={merchandisingTarget}
          onMerchandisingTargetChange={setMerchandisingTarget}
          onSelectBasket={(basket, targetId) => {
            fetcher.submit(buildFormData("update-basket", { basket, targetId }), { method: "post" });
          }}
        />
      }
      leftPaneMode={paneMode}
      rightPaneMode={paneMode}
      leftPaneCollapsed={isCompact}
      rightPaneCollapsed={isCompact}
    >
      <div style={{ padding: "40px", maxWidth: "1200px", margin: "0 auto", width: "100%" }}>
        <BlockStack gap="800">
          <BlockStack gap="200">
            <Text variant="headingLg" as="h2">Product analysis</Text>
            <Text variant="bodyMd" as="p" tone="subdued">
              Visual insights and automated recommendations generated for this item.
            </Text>
          </BlockStack>


          <BundlesSection
            bundles={bundlesWithPinState}
            baseImageUrl={product.images[0]?.url || ""}
            onGenerate={() => {
              fetcher.submit(buildFormData("generate-bundles"), { method: "post" });
            }}
            isGenerating={
              fetcher.state !== "idle" && fetcher.formData?.get("intent") === "generate-bundles"
            }
            onTogglePin={(bundleId, targetId, currentPinned) => {
              const key = `${bundleId}:${targetId}`;
              pendingPinPrevRef.current[key] = currentPinned;
              setPinOverrides((prev) => ({ ...prev, [key]: !currentPinned }));

              pinFetcher.submit(buildFormData("toggle-bundle-pin-product", { bundleId, targetId }), { method: "post" });
            }}
            onEditProduct={(bundleId, targetId) => {
              setEditModal({ open: true, bundleId, targetId });
              setPickerSearchValue("");
              // @ts-ignore Polaris selection callback typing
              handleSelectionChange("all", false);
            }}
            pinLoadingBundleId={
              isPinToggleLoading
                ? String(pinFetcher.formData?.get("bundleId"))
                : null
            }
            pinLoadingTargetId={
              isPinToggleLoading
                ? String(pinFetcher.formData?.get("targetId"))
                : null
            }
            editLoadingBundleId={
              isEditLoading ? String(editFetcher.formData?.get("bundleId")) : null
            }
            editLoadingTargetId={
              isEditLoading ? String(editFetcher.formData?.get("targetId")) : null
            }
          />


          <ProductPickerModal
            open={editModal.open}
            onClose={() => {
              setEditModal({ open: false, bundleId: "", targetId: "" });
              setPickerSearchValue("");
              // @ts-ignore Polaris selection callback typing
              handleSelectionChange("all", false);
            }}
            title="Replace bundle product"
            searchValue={pickerSearchValue}
            onSearchChange={setPickerSearchValue}
            products={pickerProducts}
            loading={isPickerLoading}
            selectedIds={selectedResources}
            onSelectionChange={handleSelectionChange}
            singleSelect
            onAdd={(selectedIds) => {
              const replacementId = selectedIds[0];
              if (!replacementId || !editModal.bundleId || !editModal.targetId) return;
              editFetcher.submit(buildFormData("replace-bundle-product", {
                bundleId: editModal.bundleId,
                targetId: editModal.targetId,
                replacementId,
              }), { method: "post" });
            }}
          />

          <RecommendationsSection
            similarProducts={similarProducts}
            sellersProducts={sellersProducts}
            trendingProducts={trendingProducts}
            arrivalsProducts={arrivalsProducts}
            onProductClick={(id) => navigate(`/app/products/${id}`)}
            onMerchandise={(target) => setMerchandisingTarget(target)}
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
