// src/cart-recs.tsx
// Cart page recommendations using the shared widget system

/** @jsxImportSource preact */
import { h } from "preact";
import { Widget } from "./components/widget";
import { fetchProductByHandle } from "./core/fetch/product";
import { mountByRecommender } from "./core/utils/mount";
import { createDebugger } from "./core/utils/debug";

const debug = createDebugger("CART_RECS", true);

/* --------------------------------------------------------------
   FETCH INTEGRATIONS (separate endpoint, cached per shop)
-------------------------------------------------------------- */
async function fetchIntegrations(shop: string) {
    try {
        const res = await fetch(`/apps/sw/integrations/${shop}`);
        if (!res.ok) {
            debug.warn("Failed to fetch integrations", res.status);
            return {};
        }
        const data = await res.json();
        return data.integrations || {};
    } catch (err) {
        debug.warn("Error fetching integrations", err);
        return {};
    }
}

/* --------------------------------------------------------------
   CART LOADER: Fetches cart items, then gets recommendations
-------------------------------------------------------------- */
async function cartLoader(settings: Record<string, any>) {
    debug.log("cartLoader() settings:", settings);

    const shop = settings?.shop;
    const limit = Number(settings.productsToShow || 8);

    if (!shop) {
        debug.warn("No shop domain");
        return { products: [], slate_id: null, integrations: {} };
    }

    try {
        // 1. Get current cart items from Shopify
        const cartRes = await fetch("/cart.js");
        const cart = await cartRes.json();
        const cartItems = cart.items || [];

        if (cartItems.length === 0) {
            debug.log("Cart is empty");
            return { products: [], slate_id: null, integrations: {} };
        }

        // 2. Extract product IDs from cart
        const productIds = [...new Set(cartItems.map((item: any) => String(item.product_id)))];
        debug.log("Cart product IDs:", productIds);

        // 3. Call our cart recommendations API
        const url = `/apps/sw/recs/${shop}/cart?ids=${productIds.join(",")}`;
        debug.log("Fetching", url);

        const [recsRes, integrations] = await Promise.all([
            fetch(url),
            fetchIntegrations(shop),
        ]);

        if (!recsRes.ok) throw new Error(`API status ${recsRes.status}`);

        const data = await recsRes.json();
        const results = data.results || [];

        debug.log("API returned", results.length, "results");

        // Build a map of handle -> reviews data from API response
        const reviewsMap = new Map<string, { avgRating: string; numReviews: string }>();
        for (const r of results) {
            if (r.reviews) {
                reviewsMap.set(r.handle, r.reviews);
            }
        }

        const handles = results.map((r: any) => r.handle);

        const products = await Promise.all(
            handles.slice(0, limit).map(async (handle: string) => {
                try {
                    const product = await fetchProductByHandle(handle);
                    if (!product) return null;

                    // Merge reviews data into product metafields
                    const reviewsData = reviewsMap.get(handle);
                    if (reviewsData) {
                        product.metafields = product.metafields || {};
                        product.metafields.reviews = {
                            avg_rating: reviewsData.avgRating,
                            num_reviews: reviewsData.numReviews,
                        };
                    }

                    return product;
                } catch {
                    return null;
                }
            }),
        );

        return {
            products: products.filter(Boolean),
            slate_id: data.slate_id || null,
            p: data.p || null,
            ps: data.ps || null,
            integrations,
        };
    } catch (err) {
        debug.warn("ERROR:", err);
        return { products: [], slate_id: null, integrations: {} };
    }
}

/* --------------------------------------------------------------
   CART RECS WIDGET COMPONENT
-------------------------------------------------------------- */
function CartRecsComponent({ el }: { el: HTMLElement }) {
    return <Widget el={el} loader={cartLoader} />;
}

// Register the mount for "cart_recs" recommender
debug.log("register mount for cart_recs");
mountByRecommender("cart_recs", (args) => CartRecsComponent(args));

export default CartRecsComponent;
