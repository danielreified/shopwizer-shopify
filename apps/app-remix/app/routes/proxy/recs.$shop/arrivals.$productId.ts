// proxy.recs.arrivals.ts

import { getArrivalsForProduct } from "../../../services/recommendations/arrivals.server";
import { checkUsageLimit, isRailEnabled } from "../../../services/recommendations/helpers.server";
import { shopParam, productIdParam, validateParams } from "./_validation";

export async function loader({ request, params }: any) {
  const shopResult = validateParams(shopParam, params.shop);
  if (!shopResult.success) return shopResult.response;
  const shop = shopResult.data;

  const pidResult = validateParams(productIdParam, params.productId);
  if (!pidResult.success) return pidResult.response;
  const productId = pidResult.data;

  try {
    const enabled = await isRailEnabled(shop, "newArrivals");
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
      console.warn("[Proxy: Arrivals] Usage limit exceeded", { shop, ...usage });
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

    // Use PDP-aware arrivals with demographic filtering
    const result = await getArrivalsForProduct(shop, productId, "public");
    return Response.json(result);
  } catch (err) {
    console.error("[Proxy: Arrivals Error]", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
