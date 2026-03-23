import type { LoaderFunctionArgs } from "react-router";
import prisma from "../../db.server";

/**
 * 🎨 GET /apps/sw/styles.css
 * Serves custom CSS for a specific shop, theme, and style key.
 * 
 * Query Params:
 * - shop: The shop domain (e.g., store.myshopify.com)
 * - key: The style category (e.g., 'global', 'product-rail', 'pdp-bundles')
 * - theme: The Shopify theme ID (e.g., '123456789')
 */
export async function loader({ request }: LoaderFunctionArgs) {
    const url = new URL(request.url);
    const shopDomain = url.searchParams.get("shop");
    const key = url.searchParams.get("key") || "global";
    const themeId = url.searchParams.get("theme");

    if (!shopDomain) {
        return new Response("/* Missing shop parameter */", {
            status: 400,
            headers: {
                "Content-Type": "text/css",
                "Cache-Control": "no-cache"
            },
        });
    }

    try {
        let css = `/* No custom styles for ${key} */`;

        if (themeId) {
            // Theme-specific CSS lookup
            const customStyle = await prisma.customStyle.findUnique({
                where: {
                    shopId_themeId_key: {
                        shopId: shopDomain,
                        themeId: themeId,
                        key: key,
                    },
                },
            });
            css = customStyle?.css || css;
        } else {
            // Legacy fallback: Find any style for this shop+key (first match)
            // This ensures backwards compatibility during migration
            const customStyle = await prisma.customStyle.findFirst({
                where: {
                    shopId: shopDomain,
                    key: key,
                },
                orderBy: { updatedAt: 'desc' },
            });
            css = customStyle?.css || css;
        }

        return new Response(css, {
            headers: {
                "Content-Type": "text/css",
                "Cache-Control": "public, max-age=60", // Cache for 1 minute, use v= query param for cache busting
            },
        });

    } catch (err) {
        console.error("[Proxy: Styles Error]", err);
        return new Response("/* Internal server error while loading styles */", {
            status: 500,
            headers: { "Content-Type": "text/css" },
        });
    }
}
