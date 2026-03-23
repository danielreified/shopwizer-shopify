// services/recommendations/sellers.server.ts
import {
  createLogger,
  generateSlateId,
  fetchBestSellers,
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

const log = createLogger("sellers", "magenta");

export async function getSellerRecommendations(
  shop: string,
  productId: string,
  mode: "public" | "admin" = "public"
) {
  const slateId = generateSlateId();
  log("🚀 getSellerRecommendations()", { shop, productId, mode });

  try {
    const origin = await loadOriginProduct(shop, productId);
    if (!origin) {
      return buildEmptyResponse({ shop, productId, mode, slateId });
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

    // Pass demographics to fetchBestSellers for tier-based SQL ordering
    const base = await fetchBestSellers(shop, {
      productId,
      rootId: originRootId,
      originGenders: origin.gender,
      originAgeBuckets: origin.ageBucket,
    });

    if (!base.length) {
      log("⚠️ No best sellers found");
      return buildEmptyResponse({ shop, productId, mode, slateId });
    }

    // Products are already tier-ordered from SQL, just deduplicate
    log("🌊 Pool after SQL tier ordering", base.length);

    // Deduplicate by title to remove variant products
    const deduplicated = deduplicateByTitle(base, log);
    const filtered = await filterExcludedProducts(deduplicated as any, exclusionRules);
    if (!filtered.length) {
      return buildEmptyResponse({ shop, productId, mode, slateId });
    }

    if (mode === "admin") {
      const enriched = await enrichProducts(filtered as any);
      return { shop, productId, mode, results: mapAdminResults(enriched) };
    }

    const { p, ps } = await packPayload({
      slateId,
      rail: "sellers",
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
      rail: "sellers",
      slate_id: slateId,
      p,
      ps,
      count: filtered.length,
      integrations,
      results: mapPublicResults(filtered as any, reviewsMap),
    };
  } catch (err) {
    log("❌ sellers.error", err);
    return buildEmptyResponse({ shop, productId, mode, slateId, error: (err as Error).message });
  }
}
