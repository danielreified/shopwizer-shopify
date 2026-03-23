/*
  Warnings:

  - The values [SIMILAR,FBT,COLOR] on the enum `JobType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "JobType_new" AS ENUM ('BEST_SELLER', 'TRENDING', 'NEW_ARRIVALS');
ALTER TABLE "Job" ALTER COLUMN "type" TYPE "JobType_new" USING ("type"::text::"JobType_new");
ALTER TYPE "JobType" RENAME TO "JobType_old";
ALTER TYPE "JobType_new" RENAME TO "JobType";
DROP TYPE "public"."JobType_old";
COMMIT;

-- AlterEnum
ALTER TYPE "OnboardingStep" ADD VALUE 'VERTICALS';

-- AlterTable
ALTER TABLE "Shop" ADD COLUMN     "verticals" TEXT[] DEFAULT ARRAY[]::TEXT[];
