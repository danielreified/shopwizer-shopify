// services/recommendations/payload.server.ts
import LZStringModule from "lz-string";
import prisma from "../../db.server";
import { logger } from "@repo/logger";

// Handle both ESM and CJS module formats for Vite SSR
const LZString = (LZStringModule as any).default ?? LZStringModule;

/**
 * Raw features from ProductFeature table (30-day metrics only, shortened keys for compression)
 */
export interface ItemFeatures {
    v?: number;    // views30d
    c?: number;    // clicks30d
    a?: number;    // carts30d (a for "add to cart")
    o?: number;    // orders30d
    r?: number;    // revenue30d
}

export interface PackedPayload {
    sl: string;     // slate_id
    r: string;      // rail
    src: {
        h: string;    // source handle
        c: string;    // source categoryId
        p: number;    // source priceUsd
        f?: ItemFeatures;
    };
    items: Array<{
        i: number;    // position (1-indexed)
        v?: string;   // variant
        c: string;    // categoryId
        p: number;    // priceUsd
        f?: ItemFeatures;
    }>;
}

interface PackPayloadOptions {
    slateId: string;
    rail: string;
    source: {
        handle: string;
        categoryId: string | null;
        priceUsd?: number | null;
        productId?: bigint;
    };
    items: Array<{
        id: bigint | string;
        handle: string;
        variantId?: string;
        categoryId: string | null;
        priceUsd?: number | null;
    }>;
}

/**
 * Fetch ProductFeature rows for a batch of product IDs (30-day metrics only)
 */
export async function fetchFeatures(productIds: bigint[]): Promise<Map<string, ItemFeatures>> {
    if (!productIds.length) return new Map();

    const features = await prisma.productFeature.findMany({
        where: { productId: { in: productIds } },
        select: {
            productId: true,
            views30d: true,
            clicks30d: true,
            carts30d: true,
            orders30d: true,
            revenue30d: true,
        },
    });

    const map = new Map<string, ItemFeatures>();

    for (const f of features) {
        const feat: ItemFeatures = {};

        // Only include non-zero values to reduce payload size
        if (f.views30d) feat.v = f.views30d;
        if (f.clicks30d) feat.c = f.clicks30d;
        if (f.carts30d) feat.a = f.carts30d;
        if (f.orders30d) feat.o = f.orders30d;
        if (f.revenue30d) feat.r = f.revenue30d;

        map.set(f.productId.toString(), feat);
    }

    return map;
}

/**
 * Pack recommendation data into compressed payload strings
 * Returns { p, ps } where:
 *   - p = compressed items payload (slateId, rail, items)
 *   - ps = compressed source payload (source product context)
 */
export async function packPayload(opts: PackPayloadOptions): Promise<{ p: string; ps: string }> {
    const { slateId, rail, source, items } = opts;

    // Collect all product IDs for feature fetch
    const productIds: bigint[] = items.map(it =>
        typeof it.id === "bigint" ? it.id : BigInt(it.id)
    );

    // Add source product ID if available
    if (source.productId) {
        productIds.push(source.productId);
    }

    // Batch fetch all features
    const featuresMap = await fetchFeatures(productIds);

    // Build source payload (ps)
    const sourcePayload = {
        h: source.handle,
        c: source.categoryId ?? "",
        p: source.priceUsd ?? 0,
        ...(source.productId && { f: featuresMap.get(source.productId.toString()) }),
    };

    // Build items payload (p)
    const itemsPayload = {
        sl: slateId,
        r: rail,
        items: items.map((it, index) => {
            const itemId = typeof it.id === "bigint" ? it.id.toString() : it.id;
            return {
                i: index + 1,
                pid: itemId,  // Product ID - needed for training data matching
                ...(it.variantId && { v: it.variantId }),
                c: it.categoryId ?? "",
                p: it.priceUsd ?? 0,
                f: featuresMap.get(itemId),
            };
        }),
    };

    // Debug: log payloads before compression
    logger.debug({ sourcePayload }, "[PAYLOAD] Source (ps)");

    // Compress and return both
    return {
        p: LZString.compressToEncodedURIComponent(JSON.stringify(itemsPayload)),
        ps: LZString.compressToEncodedURIComponent(JSON.stringify(sourcePayload)),
    };
}
