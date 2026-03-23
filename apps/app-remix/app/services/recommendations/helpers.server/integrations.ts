import prisma from "../../../db.server";

export async function fetchActiveIntegrations(shop: string) {
    const integrations = await prisma.shopIntegration.findMany({
        where: {
            shop: { domain: shop },
            enabled: true,
        },
        select: { category: true, provider: true, meta: true },
    });

    const result: { wishlist?: string; reviews?: string; yotpoId?: string } = {};
    for (const i of integrations) {
        if (i.category === "WISHLIST") result.wishlist = i.provider;
        if (i.category === "REVIEWS") {
            result.reviews = i.provider;
            if (i.provider === "YOTPO" && i.meta && typeof i.meta === "object" && "instanceId" in i.meta) {
                result.yotpoId = (i.meta as any).instanceId;
            }
        }
    }
    return result;
}
