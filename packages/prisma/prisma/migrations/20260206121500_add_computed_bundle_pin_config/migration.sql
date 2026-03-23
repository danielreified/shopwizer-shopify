-- Add pinConfig JSON field to store manual pin/override data per bundle
ALTER TABLE "ComputedBundle" ADD COLUMN "pinConfig" JSONB;
