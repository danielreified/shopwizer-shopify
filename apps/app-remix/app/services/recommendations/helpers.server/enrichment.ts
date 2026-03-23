import prisma from "../../../db.server";

export async function enrichProducts<T extends { id: bigint | string; handle: string }>(
    items: T[]
): Promise<(T & { title: string; vendor: string | null; price: number | null; priceUsd: number | null; imageUrl: string | null; merchandisingBasket: string | null; enabled: boolean })[]> {
    const ids = items.map((x) => (typeof x.id === "bigint" ? x.id : BigInt(x.id)));
    if (!ids.length) return [];

    const meta = await prisma.product.findMany({
        where: { id: { in: ids } },
        select: {
            id: true,
            title: true,
            handle: true,
            vendor: true,
            categoryId: true,
            merchandisingBasket: true,
            enabled: true,
            variants: {
                take: 1,
                orderBy: [{ position: "asc" }, { id: "asc" }],
                select: { price: true, priceUsd: true },
            },
            images: {
                take: 1,
                orderBy: [{ position: "asc" }, { id: "asc" }],
                select: { url: true },
            },
        },
    });

    const map = new Map(meta.map((m) => [m.id.toString(), m]));

    return items.map((it) => {
        const idStr = typeof it.id === "bigint" ? it.id.toString() : it.id;
        const m = map.get(idStr);
        return {
            ...it,
            title: m?.title ?? it.handle,
            handle: m?.handle ?? it.handle,
            vendor: m?.vendor ?? null,
            price: m?.variants?.[0]?.price ? Number(m.variants[0].price) : null,
            priceUsd: m?.variants?.[0]?.priceUsd ? Number(m.variants[0].priceUsd) : null,
            categoryId: m?.categoryId ?? (it as any).categoryId ?? null,
            imageUrl: m?.images?.[0]?.url ?? null,
            merchandisingBasket: m?.merchandisingBasket ?? null,
            enabled: m?.enabled ?? true,
        };
    });
}
