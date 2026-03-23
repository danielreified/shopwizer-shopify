import { fetchActiveIntegrations } from "../../services/recommendations/helpers.server/integrations";

/**
 * 🟢 GET /apps/sw/proxy/integrations/:shop
 * Returns the active integrations (wishlist, reviews) for a shop.
 * Used by client-side rails that don't hit the main recommendations API
 * (e.g., Recently Viewed which reads from localStorage).
 */
export async function loader({
    params,
}: {
    request: Request;
    params: { shop: string };
}) {
    const shop = params.shop;

    if (!shop)
        return Response.json({ error: "Missing shop" }, { status: 400 });

    console.debug("[Proxy: Integrations Loader]", { shop });

    try {
        const integrations = await fetchActiveIntegrations(shop);

        return Response.json({
            shop,
            integrations,
        });
    } catch (err) {
        console.error("[Proxy: Integrations Error]", err);
        return Response.json({ error: "Internal server error" }, { status: 500 });
    }
}
