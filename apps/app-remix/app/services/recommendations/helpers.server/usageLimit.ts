import prisma from "../../../db.server";

// ============================================================
// In-memory cache for usage limit checks
// Reduces DB load by caching results for 5 minutes per shop
// ============================================================

interface UsageCacheEntry {
    exceeded: boolean;
    current?: number;
    limit?: number;
    percentage?: number;
    expiresAt: number;
}

const usageCache = new Map<string, UsageCacheEntry>();
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Check if a shop has reached their monthly order limit.
 * Results are cached for 5 minutes to reduce DB load.
 * Returns { exceeded: true, ... } if recommendations should be blocked.
 */
export async function checkUsageLimit(shop: string): Promise<{
    exceeded: boolean;
    current?: number;
    limit?: number;
    percentage?: number;
}> {
    // Check cache first
    const cached = usageCache.get(shop);
    if (cached && cached.expiresAt > Date.now()) {
        return {
            exceeded: cached.exceeded,
            current: cached.current,
            limit: cached.limit,
            percentage: cached.percentage,
        };
    }

    // Cache miss or expired - fetch from DB
    const result = await fetchUsageFromDb(shop);

    // Store in cache
    usageCache.set(shop, {
        ...result,
        expiresAt: Date.now() + CACHE_TTL_MS,
    });

    // Cleanup old entries periodically (every 100 cache sets)
    if (usageCache.size > 100 && Math.random() < 0.01) {
        cleanupExpiredEntries();
    }

    return result;
}

/**
 * Invalidate the cache for a specific shop.
 * Call this when an order is processed to ensure fresh data.
 */
export function invalidateUsageCache(shop: string): void {
    usageCache.delete(shop);
}

/**
 * Clear all cached entries (useful for testing or forced refresh).
 */
export function clearUsageCache(): void {
    usageCache.clear();
}

// ============================================================
// Internal helpers
// ============================================================

function cleanupExpiredEntries(): void {
    const now = Date.now();
    for (const [key, entry] of usageCache.entries()) {
        if (entry.expiresAt <= now) {
            usageCache.delete(key);
        }
    }
}

async function fetchUsageFromDb(shop: string): Promise<{
    exceeded: boolean;
    current?: number;
    limit?: number;
    percentage?: number;
}> {
    const shopRecord = await prisma.shop.findUnique({
        where: { domain: shop },
        select: {
            id: true,
            trialEndsAt: true,
            subscriptions: {
                where: { status: "ACTIVE" },
                take: 1,
                include: { appPlan: true },
            },
        },
    });

    // Shop not found - block recommendations
    if (!shopRecord) {
        return { exceeded: true };
    }

    // Still in trial - allow recommendations
    if (shopRecord.trialEndsAt && new Date() < shopRecord.trialEndsAt) {
        return { exceeded: false };
    }

    const plan = shopRecord.subscriptions[0]?.appPlan;
    const monthlyLimit = plan?.monthlyOrderLimit;

    // No limit (unlimited plan) - allow recommendations
    if (!monthlyLimit) {
        return { exceeded: false };
    }

    // Count billable orders this month
    const now = new Date();
    const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

    const billableOrderCount = await prisma.order.count({
        where: {
            shopId: shopRecord.id,
            isBillable: true,
            processedAt: { gte: startOfMonth },
        },
    });

    const percentage = Math.round((billableOrderCount / monthlyLimit) * 100);
    const exceeded = billableOrderCount >= monthlyLimit;

    return {
        exceeded,
        current: billableOrderCount,
        limit: monthlyLimit,
        percentage,
    };
}
