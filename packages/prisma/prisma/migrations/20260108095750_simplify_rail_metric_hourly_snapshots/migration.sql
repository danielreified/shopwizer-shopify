/*
  Warnings:

  - The values [RAIL_VALIDATE_DAILY_24H,RAIL_VALIDATE_DAILY_7D,RAIL_VALIDATE_DAILY_30D] on the enum `GlobalJobType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `clicks24h` on the `RailMetric` table. All the data in the column will be lost.
  - You are about to drop the column `clicks30d` on the `RailMetric` table. All the data in the column will be lost.
  - You are about to drop the column `clicks7d` on the `RailMetric` table. All the data in the column will be lost.
  - You are about to drop the column `impressions24h` on the `RailMetric` table. All the data in the column will be lost.
  - You are about to drop the column `impressions30d` on the `RailMetric` table. All the data in the column will be lost.
  - You are about to drop the column `impressions7d` on the `RailMetric` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `RailMetric` table. All the data in the column will be lost.
  - You are about to drop the column `productId` on the `RailMetric` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[shopId,rail,hour]` on the table `RailMetric` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `hour` to the `RailMetric` table without a default value. This is not possible if the table is not empty.

*/
-- Delete existing RailMetric data (impressions were always 0 due to the bug we're fixing)
DELETE FROM "RailMetric";

-- Delete any GlobalJobCheckpoint rows using the job types we're removing
DELETE FROM "GlobalJobCheckpoint" WHERE "job" IN ('RAIL_VALIDATE_DAILY_24H', 'RAIL_VALIDATE_DAILY_7D', 'RAIL_VALIDATE_DAILY_30D');

-- AlterEnum
BEGIN;
CREATE TYPE "GlobalJobType_new" AS ENUM ('FEATURE_HOURLY', 'FEATURE_VALIDATE_DAILY_24H', 'FEATURE_VALIDATE_DAILY_7D', 'FEATURE_VALIDATE_DAILY_30D', 'FEATURE_BEST_SELLER', 'FEATURE_TRENDING', 'RAIL_HOURLY');
ALTER TABLE "GlobalJobCheckpoint" ALTER COLUMN "job" TYPE "GlobalJobType_new" USING ("job"::text::"GlobalJobType_new");
ALTER TYPE "GlobalJobType" RENAME TO "GlobalJobType_old";
ALTER TYPE "GlobalJobType_new" RENAME TO "GlobalJobType";
DROP TYPE "public"."GlobalJobType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "public"."RailMetric" DROP CONSTRAINT "RailMetric_productId_fkey";

-- DropIndex
DROP INDEX "public"."RailMetric_shopId_productId_idx";

-- DropIndex
DROP INDEX "public"."RailMetric_shopId_productId_rail_key";

-- AlterTable - drop old columns and productId, add new columns
ALTER TABLE "RailMetric" 
DROP COLUMN "productId",
DROP COLUMN "clicks24h",
DROP COLUMN "clicks30d",
DROP COLUMN "clicks7d",
DROP COLUMN "impressions24h",
DROP COLUMN "impressions30d",
DROP COLUMN "impressions7d",
DROP COLUMN "updatedAt",
ADD COLUMN     "clicks" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "hour" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "impressions" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "RailMetric_shopId_hour_idx" ON "RailMetric"("shopId", "hour");

-- CreateIndex
CREATE UNIQUE INDEX "RailMetric_shopId_rail_hour_key" ON "RailMetric"("shopId", "rail", "hour");
