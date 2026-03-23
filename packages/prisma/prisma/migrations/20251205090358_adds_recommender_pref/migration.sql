/*
  Warnings:

  - The values [INSTALL,CONNECT,EMBED,ACTIVATE,DONE] on the enum `OnboardingStep` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `notifications` on the `Shop` table. All the data in the column will be lost.
  - You are about to drop the column `settings` on the `Shop` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Shop` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "ProductPipelineState" AS ENUM ('PROCESSING', 'COMPLETED', 'FAILED');

-- AlterEnum
BEGIN;
CREATE TYPE "OnboardingStep_new" AS ENUM ('PREFERENCE', 'SYNC_PRODUCTS', 'SYNC_ORDERS', 'THEME_INSTALL', 'COMPLETED');
ALTER TABLE "public"."ShopOnboarding" ALTER COLUMN "step" DROP DEFAULT;
ALTER TABLE "ShopOnboarding" ALTER COLUMN "step" TYPE "OnboardingStep_new" USING ("step"::text::"OnboardingStep_new");
ALTER TYPE "OnboardingStep" RENAME TO "OnboardingStep_old";
ALTER TYPE "OnboardingStep_new" RENAME TO "OnboardingStep";
DROP TYPE "public"."OnboardingStep_old";
ALTER TABLE "ShopOnboarding" ALTER COLUMN "step" SET DEFAULT 'PREFERENCE';
COMMIT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "pipelineState" "ProductPipelineState" NOT NULL DEFAULT 'COMPLETED';

-- AlterTable
ALTER TABLE "Shop" DROP COLUMN "notifications",
DROP COLUMN "settings",
DROP COLUMN "status",
ADD COLUMN     "recommenderPreferences" JSONB NOT NULL DEFAULT '{}';

-- AlterTable
ALTER TABLE "ShopOnboarding" ALTER COLUMN "step" SET DEFAULT 'PREFERENCE';
