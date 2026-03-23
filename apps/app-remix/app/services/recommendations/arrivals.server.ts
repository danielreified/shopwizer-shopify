// services/recommendations/arrivals.server.ts
import {
  createLogger,
  generateSlateId,
  fetchArrivals,
  loadOriginProduct,
  getOriginRootId,
  enrichProducts,
  buildEmptyResponse,
  mapAdminResults,
  mapPublicResults,
  fetchActiveIntegrations,
  fetchReviewsMetafields,
  deduplicateByTitle,
  loadExclusionRules,
  shouldSuppressForOrigin,
  filterExcludedProducts,
} from "./helpers.server/index";
import { packPayload } from "./payload.server";

const log = createLogger("arrivals", "green");

// ============================================================
// Basic arrivals (no product context)
// ============================================================

export async function getArrivals(
  shop: string,
  mode: "public" | "admin" = "public"
) {
  const slateId = generateSlateId();
  log("🚀 getArrivals()", { shop, mode });

  try {
    const exclusionRules = await loadExclusionRules(shop);
    const base = await fetchArrivals(shop);

    if (!base.length) {
      log("⚠️ No arrivals found");
      return buildEmptyResponse({ shop, mode, slateId });
    }

    // Deduplicate by title to remove variant products
    const deduplicated = deduplicateByTitle(base, log);
    const filtered = await filterExcludedProducts(deduplicated as any, exclusionRules);
    if (!filtered.length) {
      return buildEmptyResponse({ shop, mode, slateId });
    }

    if (mode === "admin") {
      const enriched = await enrichProducts(filtered as any);
      return { shop, mode, results: mapAdminResults(enriched) };
    }

    // Generate compressed payload (no source product for basic arrivals)
    const { p, ps } = await packPayload({
      slateId,
      rail: "arrivals",
      source: { handle: "", categoryId: null },
      items: (filtered as any[]).map((r: any) => ({
        id: r.id,
        handle: r.handle,
        categoryId: r.categoryId,
      })),
    });

    const integrations = await fetchActiveIntegrations(shop);
    const reviewsMap = integrations.reviews
      ? await fetchReviewsMetafields(shop, (filtered as any[]).map((r: any) => r.handle))
      : new Map();

    return {
      shop,
      mode,
      rail: "arrivals",
      slate_id: slateId,
      p,
      ps,
      count: filtered.length,
      integrations,
      results: mapPublicResults(filtered as any, reviewsMap),
    };
  } catch (err) {
    log("❌ getArrivals.error", err);
    return buildEmptyResponse({ shop, mode, slateId, error: (err as Error).message });
  }
}

// ============================================================
// PDP-aware arrivals (with demographic filtering)
// ============================================================

export async function getArrivalsForProduct(
  shop: string,
  productId: string,
  mode: "public" | "admin" = "public"
) {
  const slateId = generateSlateId();
  log("🚀 getArrivalsForProduct()", { shop, productId, mode });

  try {
    const origin = await loadOriginProduct(shop, productId);
    if (!origin) {
      return getArrivals(shop, mode);
    }

    const exclusionRules = await loadExclusionRules(shop);
    const suppress = await shouldSuppressForOrigin(
      { categoryId: origin.categoryId, tags: origin.tags },
      exclusionRules
    );
    if (suppress) {
      return buildEmptyResponse({ shop, productId, mode, slateId });
    }

    const originRootId = await getOriginRootId(origin.categoryId);

    // Pass demographics to fetchArrivals for tier-based SQL ordering
    const base = await fetchArrivals(shop, {
      excludeProductId: productId,
      rootId: originRootId,
      originGenders: origin.gender,
      originAgeBuckets: origin.ageBucket,
    });

    if (!base.length) {
      log("⚠️ No arrivals found");
      return buildEmptyResponse({ shop, productId, mode, slateId });
    }

    // Products are already tier-ordered from SQL, just deduplicate
    log("🏊 Pool after SQL tier ordering", base.length);

    // Deduplicate by title to remove variant products
    const deduplicated = deduplicateByTitle(base, log);
    const filtered = await filterExcludedProducts(deduplicated as any, exclusionRules);
    if (!filtered.length) {
      return buildEmptyResponse({ shop, productId, mode, slateId });
    }

    // Generate compressed payload
    const { p, ps } = await packPayload({
      slateId,
      rail: "arrivals",
      source: {
        handle: origin.handle,
        categoryId: origin.categoryId,
        productId: origin.id,
      },
      items: (filtered as any[]).map((r: any) => ({
        id: r.id,
        handle: r.handle,
        categoryId: r.categoryId,
      })),
    });

    const integrations = await fetchActiveIntegrations(shop);
    const reviewsMap = integrations.reviews
      ? await fetchReviewsMetafields(shop, (filtered as any[]).map((r: any) => r.handle))
      : new Map();

    return {
      shop,
      productId,
      mode,
      rail: "arrivals",
      slate_id: slateId,
      p,
      ps,
      count: filtered.length,
      results: mapPublicResults(filtered as any, reviewsMap),
      integrations,
    };
  } catch (err) {
    log("❌ getArrivalsForProduct.error", err);
    return buildEmptyResponse({ shop, productId, mode, slateId, error: (err as Error).message });
  }
}
