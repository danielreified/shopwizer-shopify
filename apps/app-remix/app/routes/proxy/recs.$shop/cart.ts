import { checkUsageLimit } from "../../../services/recommendations/helpers.server";
import { getCartRecommendations } from "../../../services/recommendations/cart.server";
import { shopParam, cartBodySchema, productIdList, validateParams } from "./_validation";

/**
 * 🟢 POST /apps/sw/recs/:shop/cart
 * Returns complementary product recommendations for an entire cart.
 *
 * Accepts cart items in request body, extracts category IDs,
 * calls embeddings service to find complementary categories.
 */
export async function action({
    request,
    params,
}: {
    request: Request;
    params: { shop: string };
}) {
    const shopResult = validateParams(shopParam, params.shop);
    if (!shopResult.success) return shopResult.response;
    const shop = shopResult.data;

    console.debug("[Proxy: Cart Recs]", { shop });

    try {
        // Check if shop has exceeded their monthly order limit
        const usage = await checkUsageLimit(shop);
        if (usage.exceeded) {
            console.warn("[Proxy: Cart Recs] Usage limit exceeded", { shop, ...usage });
            return Response.json({
                shop,
                rail: "cart_recs",
                slate_id: null,
                count: 0,
                results: [],
                error: "limit_exceeded",
            });
        }

        // Parse and validate cart items from request body
        const rawBody = await request.json();
        const bodyResult = cartBodySchema.safeParse(rawBody);
        if (!bodyResult.success) {
            return Response.json(
                { error: "Validation error", details: bodyResult.error.issues },
                { status: 400 },
            );
        }
        const productIds = bodyResult.data.items.map((i) => i.productId).filter(Boolean);

        if (productIds.length === 0) {
            return Response.json({
                shop,
                rail: "cart_recs",
                slate_id: null,
                count: 0,
                results: [],
                error: "No cart items provided",
            });
        }

        const result = await getCartRecommendations(shop, productIds);

        return Response.json(result);
    } catch (err) {
        console.error("[Proxy: Cart Recs Error]", err);
        return Response.json({ error: "Internal server error" }, { status: 500 });
    }
}

// Also support GET with query params
export async function loader({
    request,
    params,
}: {
    request: Request;
    params: { shop: string };
}) {
    const shopResult = validateParams(shopParam, params.shop);
    if (!shopResult.success) return shopResult.response;
    const shop = shopResult.data;

    const url = new URL(request.url);
    const productIdsParam = url.searchParams.get("ids") || "";
    if (productIdsParam && !productIdList.safeParse(productIdsParam).success) {
        return Response.json({ error: "Invalid product ID list" }, { status: 400 });
    }
    const productIds = productIdsParam.split(",").filter(Boolean);

    if (productIds.length === 0) {
        return Response.json({
            shop,
            rail: "cart_recs",
            slate_id: null,
            count: 0,
            results: [],
            error: "No cart items provided",
        });
    }

    console.debug("[Proxy: Cart Recs GET]", { shop, productIds });

    try {
        const usage = await checkUsageLimit(shop);
        if (usage.exceeded) {
            return Response.json({
                shop,
                rail: "cart_recs",
                slate_id: null,
                count: 0,
                results: [],
                error: "limit_exceeded",
            });
        }

        const result = await getCartRecommendations(shop, productIds);
        return Response.json(result);
    } catch (err) {
        console.error("[Proxy: Cart Recs Error]", err);
        return Response.json({ error: "Internal server error" }, { status: 500 });
    }
}
