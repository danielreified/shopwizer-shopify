/**
 * Generates SQL CASE expressions for demographic tier ordering.
 * Used to prioritize products by gender and age match.
 * 
 * Tier 1 = Best match (exact + compatible)
 * Tier 2 = Close match (nearby demographics)
 * Tier 3 = Fallback (opposite/distant demographics)
 */

export interface TierSqlOptions {
  originGenders: string[];
  originAgeBuckets: string[];
}

/**
 * Builds the gender tier CASE expression for SQL ORDER BY.
 * Returns tier number (1-3) based on how well product gender matches origin.
 */
export function buildGenderTierSql(originGenders: string[]): string {
  const primary = originGenders[0] || "UNKNOWN";

  if (primary === "MALE") {
    return `
      CASE
        WHEN p."gender" IS NULL OR p."gender" = '{}' THEN 1
        WHEN p."gender"::text[] && ARRAY['MALE']::text[] THEN 1
        WHEN p."gender"::text[] && ARRAY['UNISEX']::text[] THEN 1
        WHEN p."gender"::text[] && ARRAY['UNKNOWN']::text[] THEN 2
        ELSE 3
      END
    `;
  }

  if (primary === "FEMALE") {
    return `
      CASE
        WHEN p."gender" IS NULL OR p."gender" = '{}' THEN 1
        WHEN p."gender"::text[] && ARRAY['FEMALE']::text[] THEN 1
        WHEN p."gender"::text[] && ARRAY['UNISEX']::text[] THEN 1
        WHEN p."gender"::text[] && ARRAY['UNKNOWN']::text[] THEN 2
        ELSE 3
      END
    `;
  }

  if (primary === "UNISEX") {
    return `
      CASE
        WHEN p."gender" IS NULL OR p."gender" = '{}' THEN 1
        WHEN p."gender"::text[] && ARRAY['UNISEX', 'MALE', 'FEMALE']::text[] THEN 1
        WHEN p."gender"::text[] && ARRAY['UNKNOWN']::text[] THEN 2
        ELSE 3
      END
    `;
  }

  // UNKNOWN origin - be permissive
  return `
    CASE
      WHEN p."gender" IS NULL OR p."gender" = '{}' THEN 1
      WHEN p."gender"::text[] && ARRAY['UNKNOWN', 'UNISEX']::text[] THEN 1
      WHEN p."gender"::text[] && ARRAY['MALE', 'FEMALE']::text[] THEN 2
      ELSE 3
    END
  `;
}

/**
 * Builds the age tier CASE expression for SQL ORDER BY.
 * Returns tier number (1-3) based on how well product age matches origin.
 */
export function buildAgeTierSql(originAgeBuckets: string[]): string {
  const primary = originAgeBuckets[0] || "UNKNOWN";

  // ALL_AGE is always tier 1
  const allAgeTier1 = `WHEN p."ageBucket"::text[] && ARRAY['ALL_AGE']::text[] THEN 1`;
  const nullTier1 = `WHEN p."ageBucket" IS NULL OR p."ageBucket" = '{}' THEN 1`;

  if (primary === "ADULT") {
    return `
      CASE
        ${nullTier1}
        ${allAgeTier1}
        WHEN p."ageBucket"::text[] && ARRAY['ADULT']::text[] THEN 1
        WHEN p."ageBucket"::text[] && ARRAY['TEEN', 'UNKNOWN']::text[] THEN 2
        ELSE 3
      END
    `;
  }

  if (primary === "TEEN") {
    return `
      CASE
        ${nullTier1}
        ${allAgeTier1}
        WHEN p."ageBucket"::text[] && ARRAY['TEEN']::text[] THEN 1
        WHEN p."ageBucket"::text[] && ARRAY['ADULT', 'KID', 'UNKNOWN']::text[] THEN 2
        ELSE 3
      END
    `;
  }

  if (primary === "KID") {
    return `
      CASE
        ${nullTier1}
        ${allAgeTier1}
        WHEN p."ageBucket"::text[] && ARRAY['KID']::text[] THEN 1
        WHEN p."ageBucket"::text[] && ARRAY['TEEN', 'BABY', 'UNKNOWN']::text[] THEN 2
        ELSE 3
      END
    `;
  }

  if (primary === "BABY") {
    return `
      CASE
        ${nullTier1}
        ${allAgeTier1}
        WHEN p."ageBucket"::text[] && ARRAY['BABY']::text[] THEN 1
        WHEN p."ageBucket"::text[] && ARRAY['NEWBORN', 'KID', 'UNKNOWN']::text[] THEN 2
        ELSE 3
      END
    `;
  }

  if (primary === "NEWBORN") {
    return `
      CASE
        ${nullTier1}
        ${allAgeTier1}
        WHEN p."ageBucket"::text[] && ARRAY['NEWBORN']::text[] THEN 1
        WHEN p."ageBucket"::text[] && ARRAY['BABY', 'UNKNOWN']::text[] THEN 2
        ELSE 3
      END
    `;
  }

  if (primary === "ALL_AGE") {
    return `
      CASE
        ${nullTier1}
        ${allAgeTier1}
        WHEN p."ageBucket"::text[] && ARRAY['ADULT', 'TEEN', 'KID', 'BABY', 'NEWBORN']::text[] THEN 1
        WHEN p."ageBucket"::text[] && ARRAY['UNKNOWN']::text[] THEN 2
        ELSE 3
      END
    `;
  }

  // UNKNOWN origin - be permissive
  return `
    CASE
      ${nullTier1}
      ${allAgeTier1}
      WHEN p."ageBucket"::text[] && ARRAY['UNKNOWN']::text[] THEN 1
      WHEN p."ageBucket"::text[] && ARRAY['ADULT', 'TEEN']::text[] THEN 2
      ELSE 3
    END
  `;
}


/**
 * Builds the combined tier expression (max of gender and age tiers).
 */
export function buildCombinedTierSql(options: TierSqlOptions): string {
  const genderTier = buildGenderTierSql(options.originGenders);
  const ageTier = buildAgeTierSql(options.originAgeBuckets);

  return `GREATEST(${genderTier}, ${ageTier})`;
}
