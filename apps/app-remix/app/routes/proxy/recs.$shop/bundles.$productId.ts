import { checkUsageLimit, isRailEnabled } from "../../../services/recommendations/helpers.server";
import { getBundleProducts } from "../../../services/recommendations/bundles.server";
import { shopParam, productIdParam, validateParams } from "./_validation";

/**
 * 🟢 GET /apps/sw/recs/:shop/bundles/:productId
 * Returns bundle recommendations (complementary products from related categories).
 *
 * Uses category-embeddings service to find categories that are frequently
 * bought together with the source product's category.
 */
export async function loader({
    request,
    params,
}: {
    request: Request;
    params: { shop: string; productId: string };
}) {
    const shopResult = validateParams(shopParam, params.shop);
    if (!shopResult.success) return shopResult.response;
    const shop = shopResult.data;

    const pidResult = validateParams(productIdParam, params.productId);
    if (!pidResult.success) return pidResult.response;
    const productId = pidResult.data;

    console.debug("[Proxy: Bundles Loader]", { shop, productId });

    try {
        const enabled = await isRailEnabled(shop, "bundles");
        if (!enabled) {
            return Response.json({
                shop,
                productId,
                mode: "public",
                rail: "bundles",
                slate_id: null,
                variants: [],
                count: 0,
                results: [],
            });
        }

        // Check if shop has exceeded their monthly order limit
        const usage = await checkUsageLimit(shop);
        if (usage.exceeded) {
            console.warn("[Proxy: Bundles] Usage limit exceeded", { shop, ...usage });
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

        const result = await getBundleProducts(shop, productId, "public");

        return Response.json(result);
    } catch (err) {
        console.error("[Proxy: Bundles Error]", err);
        return Response.json({ error: "Internal server error" }, { status: 500 });
    }
}
