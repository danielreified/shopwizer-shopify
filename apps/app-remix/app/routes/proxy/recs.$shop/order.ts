import { checkUsageLimit } from "../../../services/recommendations/helpers.server";
import { getOrderRecommendations } from "../../../services/recommendations/order.server";
import { shopParam, productIdList, validateParams } from "./_validation";

/**
 * 🟢 GET /apps/sw/recs/:shop/order
 * Returns complementary product recommendations for an order.
 * Used on Thank You and Order Status pages.
 * 
 * Query params: ?ids=123,456,789 (product IDs from order)
 */

// CORS headers for checkout UI extensions
const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Accept",
};

// Handle preflight requests
export async function options() {
    return new Response(null, {
        status: 204,
        headers: corsHeaders,
    });
}

export async function loader({
    request,
    params,
}: {
    request: Request;
    params: { shop: string };
}) {
    const shopResult = validateParams(shopParam, params.shop);
    if (!shopResult.success) return new Response(shopResult.response.body, {
        status: 400,
        headers: corsHeaders,
    });
    const shop = shopResult.data;

    const url = new URL(request.url);
    const productIdsParam = url.searchParams.get("ids") || "";
    if (productIdsParam && !productIdList.safeParse(productIdsParam).success) {
        return Response.json({ error: "Invalid product ID list" }, {
            status: 400,
            headers: corsHeaders,
        });
    }
    const productIds = productIdsParam.split(",").filter(Boolean);

    if (productIds.length === 0) {
        return Response.json({
            shop,
            rail: "thank_you_recs",
            slate_id: null,
            count: 0,
            results: [],
            error: "No order items provided",
        }, { headers: corsHeaders });
    }

    console.debug("[Proxy: Order Recs GET]", { shop, productIds });

    try {
        const usage = await checkUsageLimit(shop);
        if (usage.exceeded) {
            return Response.json({
                shop,
                rail: "thank_you_recs",
                slate_id: null,
                count: 0,
                results: [],
                error: "limit_exceeded",
            }, { headers: corsHeaders });
        }

        const result = await getOrderRecommendations(shop, productIds);
        return Response.json(result, { headers: corsHeaders });
    } catch (err) {
        console.error("[Proxy: Order Recs Error]", err);
        return Response.json({ error: "Internal server error" }, {
            status: 500,
            headers: corsHeaders,
        });
    }
}
