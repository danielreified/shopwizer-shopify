import { authenticate } from "../../../shopify.server";
import { getSimilarProducts } from "../../../services/recommendations/similar.server";
import { checkUsageLimit, isRailEnabled } from "../../../services/recommendations/helpers.server";
import { shopParam, productIdParam, validateParams } from "./_validation";

/**
 * 🟢 GET /apps/sw/proxy/recs/similar/:productId
 * Uses the full recommendation pipeline (public mode).
 */
export async function loader({
  request,
  params,
}: {
  request: Request;
  params: any;
}) {
  const shopResult = validateParams(shopParam, params.shop);
  if (!shopResult.success) return shopResult.response;
  const shop = shopResult.data;

  const pidResult = validateParams(productIdParam, params.productId);
  if (!pidResult.success) return pidResult.response;
  const productId = pidResult.data;

  console.debug("[Proxy: Similar Loader]", { shop, productId });

  try {
    const enabled = await isRailEnabled(shop, "similar");
    if (!enabled) {
      return Response.json({
        shop,
        productId,
        mode: "public",
        slate_id: null,
        count: 0,
        results: [],
      });
    }

    // Check if shop has exceeded their monthly order limit
    const usage = await checkUsageLimit(shop);
    if (usage.exceeded) {
      console.warn("[Proxy: Similar] Usage limit exceeded", { shop, ...usage });
      return Response.json({
        shop,
        productId,
        mode: "public",
        slate_id: null,
        count: 0,
        results: [],
        error: "limit_exceeded",
        usage: { current: usage.current, limit: usage.limit, percentage: usage.percentage },
      });
    }

    const result = await getSimilarProducts(shop, productId, "public");

    return Response.json(result);
  } catch (err) {
    console.error("[Proxy: Similar Error]", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
