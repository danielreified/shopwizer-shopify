import { checkUsageLimit } from "../../services/recommendations/helpers.server";
import { getOrderRecommendations } from "../../services/recommendations/order.server";

/**
 * 🟢 GET /api/recs/order
 * Direct API endpoint for order recommendations (bypasses Shopify proxy).
 * Used by Thank You and Order Status checkout UI extensions.
 * 
 * Query params: 
 *   - shop: The shop domain (e.g., dev-recommender.myshopify.com)
 *   - ids: Comma-separated product IDs (e.g., 123,456,789)
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
}: {
    request: Request;
}) {
    const url = new URL(request.url);
    const shop = url.searchParams.get("shop") || "";
    const productIdsParam = url.searchParams.get("ids") || "";
    const productIds = productIdsParam.split(",").filter(Boolean);

    if (!shop)
        return Response.json({ error: "Missing shop parameter" }, {
            status: 401,
            headers: corsHeaders,
        });

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

    console.debug("[API: Order Recs GET]", { shop, productIds });

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
        console.error("[API: Order Recs Error]", err);
        return Response.json({ error: "Internal server error" }, {
            status: 500,
            headers: corsHeaders,
        });
    }
}
