import prisma from "../../../db.server";
import { TOP_K } from "./constants";
import { LogColor, Logger } from "./logging";
import { ProductRow, mapProductRows } from "./types";
import { generateSlateId } from "./slate";
import { loadOriginProduct, getOriginRootId } from "./origin";
import { filterByDemographics } from "./demographics";
import { enrichProducts } from "./enrichment";
import { buildEmptyResponse, buildSuccessResponse, RecommendationResponse } from "./response";
import { fetchActiveIntegrations } from "./integrations";

export type FeatureScoreField = "bestSellerScore" | "trendingScore";

export interface FeatureRailConfig {
  rail: string;
  scoreField: FeatureScoreField;
  color: LogColor;
  emptyMessage: string;
}

export interface FeatureRailOptions {
  productId: string;
  rootId?: string | null;
  originGenders?: string[];
  originAgeBuckets?: string[];
}

async function fetchFeatureRailByScore(
  shop: string,
  scoreField: FeatureScoreField,
  options: FeatureRailOptions,
): Promise<ProductRow[]> {
  const { productId, rootId, originGenders = [], originAgeBuckets = [] } = options;

  const { buildGenderTierSql, buildAgeTierSql } = await import("./tier-sql");
  const genderTierSql = buildGenderTierSql(originGenders);
  const ageTierSql = buildAgeTierSql(originAgeBuckets);

  const rootFilter = rootId ? `AND c."rootId" = '${rootId}'` : "";
  const query = `
    SELECT
      p."id", p."handle", p."title", p."categoryId", p."tags", p."gender", p."ageBucket", c."rootId",
      GREATEST(${genderTierSql}, ${ageTierSql}) AS demo_tier
    FROM "Product" p
    JOIN "Shop" s ON s."id" = p."shopId"
    LEFT JOIN "ProductFeature" f ON f."productId" = p."id"
    LEFT JOIN "Category" c ON c."id" = p."categoryId"
    WHERE s."domain" = '${shop}'
      AND p."enabled" = true
      AND p."id" <> ${BigInt(productId)}
      ${rootFilter}
    ORDER BY demo_tier ASC, f."${scoreField}" DESC NULLS LAST, p."createdAt" DESC
    LIMIT ${TOP_K};
  `;
  const rows = await prisma.$queryRawUnsafe<any[]>(query);
  return mapProductRows(rows);
}

export function fetchBestSellers(shop: string, options: FeatureRailOptions): Promise<ProductRow[]> {
  return fetchFeatureRailByScore(shop, "bestSellerScore", options);
}

export function fetchTrending(shop: string, options: FeatureRailOptions): Promise<ProductRow[]> {
  return fetchFeatureRailByScore(shop, "trendingScore", options);
}

export interface ArrivalsOptions {
  excludeProductId?: string;
  rootId?: string | null;
  originGenders?: string[];
  originAgeBuckets?: string[];
}

export async function fetchArrivals(shop: string, options: ArrivalsOptions = {}): Promise<ProductRow[]> {
  const { excludeProductId, rootId, originGenders = [], originAgeBuckets = [] } = options;

  // Import tier SQL builders
  const { buildGenderTierSql, buildAgeTierSql } = await import("./tier-sql");
  const genderTierSql = buildGenderTierSql(originGenders);
  const ageTierSql = buildAgeTierSql(originAgeBuckets);

  // With rootId filter (for PDP arrivals)
  if (rootId && excludeProductId) {
    const query = `
      SELECT p."id", p."handle", p."title", p."categoryId", p."tags", p."gender", p."ageBucket", c."rootId",
        GREATEST(${genderTierSql}, ${ageTierSql}) AS demo_tier
      FROM "Product" p
      JOIN "Shop" s ON s."id" = p."shopId"
      LEFT JOIN "Category" c ON c."id" = p."categoryId"
      WHERE s."domain" = '${shop}' 
        AND p."enabled" = true 
        AND p."id" <> ${BigInt(excludeProductId)}
        AND c."rootId" = '${rootId}'
      ORDER BY demo_tier ASC, p."createdAt" DESC
      LIMIT ${TOP_K};
    `;
    const rows = await prisma.$queryRawUnsafe<any[]>(query);
    return mapProductRows(rows);
  }

  // Without rootId but with excludeProductId
  if (excludeProductId) {
    const query = `
      SELECT p."id", p."handle", p."title", p."categoryId", p."tags", p."gender", p."ageBucket", c."rootId",
        GREATEST(${genderTierSql}, ${ageTierSql}) AS demo_tier
      FROM "Product" p
      JOIN "Shop" s ON s."id" = p."shopId"
      LEFT JOIN "Category" c ON c."id" = p."categoryId"
      WHERE s."domain" = '${shop}' AND p."enabled" = true AND p."id" <> ${BigInt(excludeProductId)}
      ORDER BY demo_tier ASC, p."createdAt" DESC
      LIMIT ${TOP_K};
    `;
    const rows = await prisma.$queryRawUnsafe<any[]>(query);
    return mapProductRows(rows);
  }

  // Basic arrivals (no filters)
  const rows = await prisma.$queryRaw<any[]>`
    SELECT p."id", p."handle", p."title", p."categoryId", p."tags", p."gender", p."ageBucket", c."rootId"
    FROM "Product" p
    JOIN "Shop" s ON s."id" = p."shopId"
    LEFT JOIN "Category" c ON c."id" = p."categoryId"
    WHERE s."domain" = ${shop} AND p."enabled" = true
    ORDER BY p."createdAt" DESC
    LIMIT ${TOP_K};
  `;
  return mapProductRows(rows);
}

export async function handleFeatureRail(opts: {
  shop: string;
  productId: string;
  mode: "public" | "admin";
  fetchProducts: () => Promise<ProductRow[]>;
  rail: string;
  log: Logger;
  emptyMessage: string;
}): Promise<RecommendationResponse> {
  const { shop, productId, mode, fetchProducts, rail, log, emptyMessage } = opts;
  const slateId = generateSlateId();
  log(`🚀 get${rail}()`, { shop, productId, mode });

  try {
    const origin = await loadOriginProduct(shop, productId);
    if (!origin) {
      return buildEmptyResponse({ shop, productId, mode, slateId });
    }

    const originRootId = await getOriginRootId(origin.categoryId);
    const base = await fetchProducts();

    if (!base.length) {
      log(`⚠️ ${emptyMessage}`);
      return buildEmptyResponse({ shop, productId, mode, slateId });
    }

    const filtered = filterByDemographics(base, {
      originRootId,
      originGenders: origin.gender,
      originAgeBuckets: origin.ageBucket,
    }, log);

    log("🏊 Pool after filters", filtered.length);

    const results = mode === "admin" ? await enrichProducts(filtered) : filtered;
    const integrations = await fetchActiveIntegrations(shop);

    return buildSuccessResponse({ shop, productId, mode, slateId, results, integrations });
  } catch (err) {
    log(`❌ ${rail}.error`, err);
    return buildEmptyResponse({ shop, productId, mode, slateId, error: (err as Error).message });
  }
}
