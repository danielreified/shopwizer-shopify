-- Add stable slot identity and merchant visibility toggle
ALTER TABLE "ComputedBundle" ADD COLUMN "slotIndex" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "ComputedBundle" ADD COLUMN "enabled" BOOLEAN NOT NULL DEFAULT true;

-- Backfill slotIndex from existing variant values
UPDATE "ComputedBundle"
SET "slotIndex" = CASE
  WHEN LOWER("variant") = 'control' THEN 1
  WHEN LOWER("variant") = 'explore' THEN 2
  WHEN LOWER("variant") = 'explore_a' THEN 2
  WHEN LOWER("variant") = 'explore_b' THEN 3
  WHEN LOWER("variant") = 'bundle_1' THEN 1
  WHEN LOWER("variant") = 'bundle_2' THEN 2
  WHEN LOWER("variant") = 'bundle_3' THEN 3
  ELSE 1
END;

-- If multiple ACTIVE rows exist for the same slot, archive older ones so active slots are unique.
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY "shopId", "productId", "slotIndex"
      ORDER BY "updatedAt" DESC, "createdAt" DESC
    ) AS rn
  FROM "ComputedBundle"
  WHERE status = 'ACTIVE'
)
UPDATE "ComputedBundle" cb
SET status = 'ARCHIVED',
    "updatedAt" = NOW()
FROM ranked r
WHERE cb.id = r.id
  AND r.rn > 1;

-- Enforce uniqueness for ACTIVE slots only.
CREATE UNIQUE INDEX IF NOT EXISTS "ComputedBundle_active_slot_unique"
ON "ComputedBundle" ("shopId", "productId", "slotIndex")
WHERE status = 'ACTIVE';

CREATE INDEX IF NOT EXISTS "ComputedBundle_shop_product_status_slot_idx"
ON "ComputedBundle" ("shopId", "productId", status, "slotIndex");

CREATE INDEX IF NOT EXISTS "ComputedBundle_shop_product_status_enabled_idx"
ON "ComputedBundle" ("shopId", "productId", status, enabled);
