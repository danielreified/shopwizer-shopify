import prisma from "../../../db.server";

type RecoKey = "similar" | "color" | "trending" | "newArrivals" | "bestSellers" | "bundles";

type Recommenders = Record<RecoKey, boolean>;

const DEFAULT_RECOMMENDERS: Recommenders = {
    similar: true,
    color: true,
    trending: true,
    newArrivals: true,
    bestSellers: true,
    bundles: true,
};

/**
 * Check if a specific recommendation rail is enabled for a shop.
 * Returns true by default if not configured.
 */
export async function isRailEnabled(shop: string, rail: RecoKey): Promise<boolean> {
    const settings = await prisma.shopSettings.findFirst({
        where: { shop: { domain: shop } },
        select: { recommenders: true },
    });

    const recommenders = (settings?.recommenders as Recommenders) ?? {};
    return recommenders[rail] ?? DEFAULT_RECOMMENDERS[rail] ?? true;
}

/**
 * Fetch all recommender settings for a shop.
 * Returns defaults merged with any stored values.
 */
export async function fetchRecommenderSettings(shop: string): Promise<Recommenders> {
    const settings = await prisma.shopSettings.findFirst({
        where: { shop: { domain: shop } },
        select: { recommenders: true },
    });

    const stored = (settings?.recommenders as Recommenders) ?? {};
    return { ...DEFAULT_RECOMMENDERS, ...stored };
}
