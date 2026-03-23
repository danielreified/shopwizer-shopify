// services/recommendations/similar.server.ts
import prisma from "../../db.server";
import { rankProducts } from "../ranker/index.server";
import { packPayload } from "./payload.server";
import {
  TOP_K,
  createLogger,
  generateSlateId,
  enrichProducts,
  buildEmptyResponse,
  mapAdminResults,
  mapPublicResults,
  loadOriginWithEmbeddings,
  fetchProductMetadata,
  fetchProductEmbeddings,
  fetchVendorEmbeddings,
  parseVectorText,
  fetchActiveIntegrations,
  fetchReviewsMetafields,
  deduplicateByTitle,
  loadExclusionRules,
  shouldSuppressForOrigin,
  filterExcludedProducts,
} from "./helpers.server/index";
import { buildGenderTierSql, buildAgeTierSql } from "./helpers.server/tier-sql";


const PROBES = 200;

const log = createLogger("similar", "cyan");

// ============================================================
// RAW ANN SEARCH
// ============================================================

export interface SimilarSearchOptions {
  originGenders?: string[];
  originAgeBuckets?: string[];
}

export async function getSimilarProductsCore(
  shop: string,
  productId: string,
  options: SimilarSearchOptions = {}
) {
  const { originGenders = [], originAgeBuckets = [] } = options;

  const [embedding] = await prisma.$queryRaw<{ vector_text: string }[]>`
    SELECT e."vector"::text AS vector_text
    FROM "ProductEmbedding" e
    JOIN "Shop" s ON s."id" = e."shopId"
    WHERE s."domain" = ${shop} AND e."productId" = ${BigInt(productId)}
    LIMIT 1
  `;

  if (!embedding) {
    log("⚠️ No base embedding found!", { productId });
    return [];
  }

  const queryVector = parseVectorText(embedding.vector_text);
  log("🔍 Parsed origin vector length", queryVector?.length);

  // Build tier SQL expressions
  const genderTierSql = buildGenderTierSql(originGenders);
  const ageTierSql = buildAgeTierSql(originAgeBuckets);

  const rows = await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`SET LOCAL ivfflat.probes = ${PROBES}`);

    // Format vector as [x,y,z] for PostgreSQL
    const vectorStr = `[${queryVector!.join(",")}]`;

    // Dynamic SQL with tier-based ordering
    const query = `
      SELECT 
        p."id", 
        p."handle", 
        p."categoryId",
        p."gender",
        p."ageBucket",
        GREATEST(${genderTierSql}, ${ageTierSql}) AS demo_tier,
        e."vector" <#> '${vectorStr}'::vector AS distance
      FROM "ProductEmbedding" e
      JOIN "Shop" s ON s."id" = e."shopId"
      JOIN "Product" p ON p."id" = e."productId"
      WHERE s."domain" = '${shop}' 
        AND p."enabled" = true 
        AND e."productId" <> ${BigInt(productId)}
      ORDER BY demo_tier, distance
      LIMIT ${TOP_K}
    `;


    return tx.$queryRawUnsafe<{
      id: bigint;
      handle: string;
      categoryId: string | null;
      gender: string[] | null;
      ageBucket: string[] | null;
      demo_tier: number;
      distance: number;
    }[]>(query);
  });

  log("📊 Retrieved with tier ordering", {
    count: rows.length,
    tier1: rows.filter(r => r.demo_tier === 1).length,
    tier2: rows.filter(r => r.demo_tier === 2).length,
    tier3: rows.filter(r => r.demo_tier === 3).length,
  });

  return rows.map((r) => ({
    id: r.id,
    handle: r.handle,
    categoryId: r.categoryId,
    gender: r.gender,
    ageBucket: r.ageBucket,
    demoTier: r.demo_tier,
  }));
}


// ============================================================
// MAIN ENTRY
// ============================================================

export async function getSimilarProducts(
  shop: string,
  productId: string,
  mode: "public" | "admin" = "public"
) {
  log("🚀 getSimilarProducts()", { shop, productId, mode });
  const slateId = generateSlateId();

  try {
    // Load origin with embeddings
    const origin = await loadOriginWithEmbeddings(shop, productId);
    if (!origin) {
      log("❌ Origin not found");
      return buildEmptyResponse({ shop, productId, mode, slateId });
    }

    const exclusionRules = await loadExclusionRules(shop);
    const suppress = await shouldSuppressForOrigin(
      { categoryId: origin.categoryId, tags: origin.tags },
      exclusionRules
    );
    if (suppress) {
      return buildEmptyResponse({ shop, productId, mode, slateId });
    }

    // ANN retrieval with tier-based ordering in SQL
    const base = await getSimilarProductsCore(shop, productId, {
      originGenders: origin.gender,
      originAgeBuckets: origin.ageBucket,
    });
    if (!base.length) {
      log("⚠️ ANN returned ZERO");
      return buildEmptyResponse({ shop, productId, mode, slateId });
    }

    // Fetch metadata and embeddings in parallel
    const ids = base.map((x) => BigInt(x.id));
    const [metaMap, { embedMap, attrMap, vendorEmbedMap }] = await Promise.all([
      fetchProductMetadata(ids),
      fetchProductEmbeddings(ids),
    ]);

    log("📦 Loaded metadata and embeddings", { meta: metaMap.size, embeds: embedMap.size, vendors: vendorEmbedMap.size });

    // Get origin vendor embedding (need to fetch separately since origin not in candidates)
    let originVendorEmbedding: number[] | null = null;
    if (origin.vendorNormalized) {
      const originVendorEmbed = await fetchVendorEmbeddings([origin.vendorNormalized]);
      originVendorEmbedding = originVendorEmbed.get(origin.vendorNormalized) ?? null;
    }

    // Prepare for ranking (already tier-ordered from SQL)
    const prepared = base.map((b) => {
      const key = b.id.toString();
      const m = metaMap.get(key);

      return {
        id: b.id,
        title: m?.title ?? b.handle,
        handle: m?.handle ?? b.handle,
        price: m?.priceUsd ?? null,
        vendor: m?.vendor ?? null,
        vendorNormalized: m?.vendorNormalized ?? null,
        vendorEmbedding: vendorEmbedMap.get(key) ?? null,
        categoryId: m?.categoryId ?? b.categoryId ?? null,
        categoryParentId: m?.categoryParentId ?? null,
        categoryTopLevel: m?.categoryTopLevel ?? null,
        categoryRootId: m?.categoryRootId ?? null,
        rootId: m?.categoryRootId ?? null,
        tags: m?.tags ?? [],
        gender: b.gender ?? m?.gender ?? [],
        ageBucket: b.ageBucket ?? m?.ageBucket ?? [],
        embeddingVector: embedMap.get(key) ?? null,
        attrEmbedding: attrMap.get(key) ?? null,
        demoTier: b.demoTier,
      };
    });

    // Group by demographic tier (from SQL)
    const tier1 = prepared.filter(p => p.demoTier === 1);
    const tier2 = prepared.filter(p => p.demoTier === 2);
    const tier3 = prepared.filter(p => p.demoTier === 3);
    log("📊 Tier sizes from SQL", { tier1: tier1.length, tier2: tier2.length, tier3: tier3.length });

    // SQL already ordered by demo_tier, then vector distance - no need to re-rank
    // Just concatenate tiers to maintain tier boundaries
    const final = [...tier1, ...tier2, ...tier3];
    log("📦 Using SQL ordering (no re-ranking)", { total: final.length });

    // Deduplicate by title to remove variant products
    const deduplicated = deduplicateByTitle(final, log);
    const filtered = await filterExcludedProducts(deduplicated as any, exclusionRules);
    if (!filtered.length) {
      return buildEmptyResponse({ shop, productId, mode, slateId });
    }


    log("🎯 Final results count", filtered.length);

    if (mode === "admin") {
      const enriched = await enrichProducts(filtered as any);
      return { shop, productId, mode, results: mapAdminResults(enriched) };
    }

    const { p, ps } = await packPayload({
      slateId,
      rail: "similar",
      source: {
        handle: origin.handle,
        categoryId: origin.categoryId,
        priceUsd: origin.price,
        productId: origin.id,
      },
      items: (filtered as any[]).map((r: any) => ({
        id: r.id,
        handle: r.handle,
        categoryId: r.categoryId,
        priceUsd: r.price ?? null,
      })),
    });

    const integrations = await fetchActiveIntegrations(shop);
    const reviewsMap = integrations.reviews
      ? await fetchReviewsMetafields(shop, (filtered as any[]).map((r: any) => r.handle))
      : new Map();

    return {
      shop,
      productId,
      mode,
      rail: "similar",
      slate_id: slateId,
      p,
      ps,
      count: filtered.length,
      integrations,
      results: mapPublicResults(filtered as any, reviewsMap),
    };
  } catch (err) {
    log("❌ getSimilarProducts.error", err);
    return buildEmptyResponse({ shop, productId, mode, slateId, error: (err as Error)?.message });
  }
}
