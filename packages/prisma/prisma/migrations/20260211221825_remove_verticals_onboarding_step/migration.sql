-- Remove VERTICALS from OnboardingStep enum
CREATE TYPE "OnboardingStep_new" AS ENUM ('PREFERENCE', 'SYNC_PRODUCTS', 'SYNC_ORDERS', 'THEME_INSTALL', 'COMPLETED');
ALTER TABLE "ShopOnboarding" ALTER COLUMN "step" DROP DEFAULT;
ALTER TABLE "ShopOnboarding" ALTER COLUMN "step" TYPE "OnboardingStep_new" USING ("step"::text::"OnboardingStep_new");
ALTER TABLE "ShopOnboarding" ALTER COLUMN "step" SET DEFAULT 'PREFERENCE'::"OnboardingStep_new";
ALTER TYPE "OnboardingStep" RENAME TO "OnboardingStep_old";
ALTER TYPE "OnboardingStep_new" RENAME TO "OnboardingStep";
DROP TYPE "public"."OnboardingStep_old";
