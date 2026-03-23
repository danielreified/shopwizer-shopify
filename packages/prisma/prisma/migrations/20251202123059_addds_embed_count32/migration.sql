/*
  Warnings:

  - You are about to drop the `GlobalJobCheckpoint` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[productId]` on the table `ProductFeature` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."ProductFeature_shopId_productId_idx";

-- DropIndex
DROP INDEX "public"."ProductFeature_shopId_productId_key";

-- DropTable
DROP TABLE "public"."GlobalJobCheckpoint";

-- DropEnum
DROP TYPE "public"."GlobalJobType";

-- CreateIndex
CREATE UNIQUE INDEX "ProductFeature_productId_key" ON "ProductFeature"("productId");

-- CreateIndex
CREATE INDEX "ProductFeature_shopId_idx" ON "ProductFeature"("shopId");
