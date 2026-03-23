import prisma from "../../../db.server";

export type ExclusionRule = {
  type: "CATEGORY" | "TAG";
  mode: "GLOBAL_EXCLUSION" | "PAGE_SUPPRESSION";
  itemValue: string;
  withDesc: boolean;
};

export type ExclusionTarget = {
  categoryId?: string | null;
  tags?: string[] | null;
};

function normalizeTagValue(value: string) {
  const trimmed = value?.trim?.() ?? "";
  const withoutPrefix = trimmed.startsWith("tag-") ? trimmed.slice(4) : trimmed;
  return withoutPrefix.toLowerCase();
}

function buildTagSet(tags?: string[] | null) {
  if (!tags?.length) return new Set<string>();
  return new Set(tags.map((t) => t.toLowerCase()));
}

async function buildCategoryPathMap(categoryIds: string[]) {
  if (!categoryIds.length) return new Map<string, string[]>();
  const categories = await prisma.category.findMany({
    where: { id: { in: categoryIds } },
    select: { id: true, pathIds: true },
  });
  return new Map(categories.map((c) => [c.id, c.pathIds]));
}

function matchesCategoryRule(
  rule: ExclusionRule,
  categoryId: string | null | undefined,
  categoryPathMap: Map<string, string[]>
) {
  if (!categoryId) return false;
  if (!rule.withDesc) return categoryId === rule.itemValue;
  const pathIds = categoryPathMap.get(categoryId);
  if (!pathIds?.length) return categoryId === rule.itemValue;
  return pathIds.includes(rule.itemValue);
}

function matchesTagRule(rule: ExclusionRule, tagSet: Set<string>) {
  if (!tagSet.size) return false;
  const normalized = normalizeTagValue(rule.itemValue);
  return normalized.length > 0 && tagSet.has(normalized);
}

export async function loadExclusionRules(shop: string): Promise<ExclusionRule[]> {
  const shopRecord = await prisma.shop.findUnique({
    where: { domain: shop },
    select: { id: true },
  });
  if (!shopRecord) return [];
  const rules = await prisma.exclusionRule.findMany({
    where: { shopId: shopRecord.id },
    select: {
      type: true,
      mode: true,
      itemValue: true,
      withDesc: true,
    },
  });
  return rules as ExclusionRule[];
}

export async function shouldSuppressForOrigin(
  origin: ExclusionTarget | null,
  rules: ExclusionRule[]
) {
  if (!origin) return false;
  const pageRules = rules.filter((r) => r.mode === "PAGE_SUPPRESSION");
  if (!pageRules.length) return false;

  const categoryRules = pageRules.filter((r) => r.type === "CATEGORY");
  const tagRules = pageRules.filter((r) => r.type === "TAG");

  const categoryIds = origin.categoryId ? [origin.categoryId] : [];
  const categoryPathMap = categoryRules.some((r) => r.withDesc)
    ? await buildCategoryPathMap(categoryIds)
    : new Map<string, string[]>();
  const tagSet = buildTagSet(origin.tags);

  return pageRules.some((rule) => {
    if (rule.type === "CATEGORY") {
      return matchesCategoryRule(rule, origin.categoryId, categoryPathMap);
    }
    return matchesTagRule(rule, tagSet);
  });
}

export async function filterExcludedProducts<T extends ExclusionTarget>(
  products: T[],
  rules: ExclusionRule[]
): Promise<T[]> {
  if (!products.length) return products;
  const globalRules = rules.filter((r) => r.mode === "GLOBAL_EXCLUSION");
  if (!globalRules.length) return products;

  const categoryRules = globalRules.filter((r) => r.type === "CATEGORY");
  const tagRules = globalRules.filter((r) => r.type === "TAG");

  const categoryIds = Array.from(
    new Set(products.map((p) => p.categoryId).filter(Boolean) as string[])
  );
  const categoryPathMap = categoryRules.some((r) => r.withDesc)
    ? await buildCategoryPathMap(categoryIds)
    : new Map<string, string[]>();

  return products.filter((product) => {
    const tagSet = buildTagSet(product.tags);
    const excludedByCategory = categoryRules.some((rule) =>
      matchesCategoryRule(rule, product.categoryId ?? null, categoryPathMap)
    );
    if (excludedByCategory) return false;

    const excludedByTag = tagRules.some((rule) => matchesTagRule(rule, tagSet));
    if (excludedByTag) return false;

    return true;
  });
}
