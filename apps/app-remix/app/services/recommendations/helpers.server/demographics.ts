import { Logger } from "./logging";
import { ProductRow } from "./types";

export interface DemographicFilterOptions {
    originRootId?: string | null;
    originGenders?: string[];
    originAgeBuckets?: string[];
}

export interface TieredResult<T> {
    tier1: T[];  // Best match
    tier2: T[];  // Close match
    tier3: T[];  // Backfill
}

/**
 * Groups products into tiers based on demographic relevance.
 * Tier 1 = Best match (same gender/age)
 * Tier 2 = Close match (compatible gender/age)
 * Tier 3 = Backfill (everything else)
 * 
 * Each tier should be ranked separately, then concatenated.
 */
export function groupByDemographics<T extends ProductRow>(
    pool: T[],
    options: DemographicFilterOptions,
    log?: Logger
): TieredResult<T> {
    const { originRootId, originGenders = [], originAgeBuckets = [] } = options;
    let filtered = pool;

    // 1️⃣ Filter by same rootId (optional category constraint)
    if (originRootId) {
        const rootFiltered = pool.filter((p) => p.rootId === originRootId);
        log?.("🌳 ROOT filter", { from: pool.length, to: rootFiltered.length });
        if (rootFiltered.length > 0) filtered = rootFiltered;
    }

    // 2️⃣ Build tier assignments for each product
    const genderTiers = originGenders.length > 0 ? buildGenderTiers(originGenders) : null;
    const ageTiers = originAgeBuckets.length > 0 ? buildAgeTiers(originAgeBuckets) : null;

    const tier1: T[] = [];
    const tier2: T[] = [];
    const tier3: T[] = [];

    for (const p of filtered) {
        const gTier = genderTiers ? getGenderTier(p.gender || [], genderTiers) : 1;
        const aTier = ageTiers ? getAgeTier(p.ageBucket || [], ageTiers) : 1;

        // Combined tier = worst of the two (if gender is tier 3, overall is tier 3)
        const combinedTier = Math.max(gTier, aTier);

        if (combinedTier === 1) {
            tier1.push(p);
        } else if (combinedTier === 2) {
            tier2.push(p);
        } else {
            tier3.push(p);
        }
    }

    log?.("📊 Tiered groups", { tier1: tier1.length, tier2: tier2.length, tier3: tier3.length });

    return { tier1, tier2, tier3 };
}

/**
 * Legacy flat filter - returns sorted flat list.
 * Use groupByDemographics for tiered ranking.
 */
export function filterByDemographics<T extends ProductRow>(
    pool: T[],
    options: DemographicFilterOptions,
    log?: Logger
): T[] {
    const { tier1, tier2, tier3 } = groupByDemographics(pool, options, log);
    return [...tier1, ...tier2, ...tier3];
}

// ─────────────────────────────────────────────────────────────────────────────
// GENDER TIERS
// ─────────────────────────────────────────────────────────────────────────────

type TierMap = Map<string, number>;

function buildGenderTiers(originGenders: string[]): TierMap {
    const tiers = new Map<string, number>();
    const primaryGender = originGenders[0] || "UNKNOWN";

    if (primaryGender === "MALE") {
        tiers.set("MALE", 1);
        tiers.set("UNISEX", 1);
        tiers.set("UNKNOWN", 2);
        tiers.set("FEMALE", 3);  // Opposite gender = tier 3
    } else if (primaryGender === "FEMALE") {
        tiers.set("FEMALE", 1);
        tiers.set("UNISEX", 1);
        tiers.set("UNKNOWN", 2);
        tiers.set("MALE", 3);    // Opposite gender = tier 3
    } else if (primaryGender === "UNISEX") {
        tiers.set("UNISEX", 1);
        tiers.set("MALE", 1);
        tiers.set("FEMALE", 1);
        tiers.set("UNKNOWN", 2);
    } else {
        // UNKNOWN origin
        tiers.set("UNKNOWN", 1);
        tiers.set("UNISEX", 1);
        tiers.set("MALE", 2);
        tiers.set("FEMALE", 2);
    }

    return tiers;
}

function getGenderTier(genders: string[], tiers: TierMap): number {
    if (genders.length === 0) return 1; // No gender = universal

    let bestTier = 99;
    for (const g of genders) {
        const tier = tiers.get(g) ?? 99;
        if (tier < bestTier) bestTier = tier;
    }
    return bestTier;
}

// ─────────────────────────────────────────────────────────────────────────────
// AGE TIERS
// ─────────────────────────────────────────────────────────────────────────────

function buildAgeTiers(originAgeBuckets: string[]): TierMap {
    const tiers = new Map<string, number>();
    const primaryAge = originAgeBuckets[0] || "UNKNOWN";

    // ALL_AGE is always Tier 1
    tiers.set("ALL_AGE", 1);

    if (primaryAge === "ADULT") {
        tiers.set("ADULT", 1);
        tiers.set("TEEN", 2);
        tiers.set("UNKNOWN", 2);
        tiers.set("KID", 3);
        tiers.set("BABY", 3);
        tiers.set("NEWBORN", 3);
    } else if (primaryAge === "TEEN") {
        tiers.set("TEEN", 1);
        tiers.set("ADULT", 2);
        tiers.set("KID", 2);
        tiers.set("UNKNOWN", 2);
        tiers.set("BABY", 3);
        tiers.set("NEWBORN", 3);
    } else if (primaryAge === "KID") {
        tiers.set("KID", 1);
        tiers.set("TEEN", 2);
        tiers.set("BABY", 2);
        tiers.set("UNKNOWN", 2);
        tiers.set("ADULT", 3);
        tiers.set("NEWBORN", 3);
    } else if (primaryAge === "BABY") {
        tiers.set("BABY", 1);
        tiers.set("NEWBORN", 2);
        tiers.set("KID", 2);
        tiers.set("UNKNOWN", 2);
        tiers.set("TEEN", 3);
        tiers.set("ADULT", 3);
    } else if (primaryAge === "NEWBORN") {
        tiers.set("NEWBORN", 1);
        tiers.set("BABY", 2);
        tiers.set("UNKNOWN", 2);
        tiers.set("KID", 3);
        tiers.set("TEEN", 3);
        tiers.set("ADULT", 3);
    } else if (primaryAge === "ALL_AGE") {
        tiers.set("ADULT", 1);
        tiers.set("TEEN", 1);
        tiers.set("KID", 1);
        tiers.set("BABY", 1);
        tiers.set("NEWBORN", 1);
        tiers.set("UNKNOWN", 2);
    } else {
        // UNKNOWN origin
        tiers.set("UNKNOWN", 1);
        tiers.set("ADULT", 2);
        tiers.set("TEEN", 2);
        tiers.set("KID", 2);
        tiers.set("BABY", 3);
        tiers.set("NEWBORN", 3);
    }

    return tiers;
}

function getAgeTier(ageBuckets: string[], tiers: TierMap): number {
    if (ageBuckets.length === 0) return 1; // No age = universal

    let bestTier = 99;
    for (const a of ageBuckets) {
        const tier = tiers.get(a) ?? 99;
        if (tier < bestTier) bestTier = tier;
    }
    return bestTier;
}
