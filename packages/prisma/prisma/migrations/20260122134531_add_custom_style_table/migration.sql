/*
  Warnings:

  - The primary key for the `ProductFeature` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `ProductFeature` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[shopId,sourceId,targetId,type]` on the table `ProductGraph` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "RecommendationRail" ADD VALUE 'COLOR_MATCH';

-- DropIndex
DROP INDEX "public"."ProductFeature_productId_key";

-- DropIndex
DROP INDEX "public"."ProductGraph_shopId_sourceId_targetId_key";

-- AlterTable
ALTER TABLE "ProductFeature" DROP CONSTRAINT "ProductFeature_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "ProductFeature_pkey" PRIMARY KEY ("productId");

-- AlterTable
ALTER TABLE "ProductGraph" ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'FBT',
ADD COLUMN     "weight" DOUBLE PRECISION NOT NULL DEFAULT 0.5;

-- CreateTable
CREATE TABLE "CustomStyle" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "css" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomStyle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategoryGraph" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "sourceCategory" TEXT NOT NULL,
    "targetCategory" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CategoryGraph_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComputedBundle" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "productId" BIGINT NOT NULL,
    "candidateIds" JSONB NOT NULL,
    "variant" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 0.33,
    "views24h" INTEGER NOT NULL DEFAULT 0,
    "clicks24h" INTEGER NOT NULL DEFAULT 0,
    "conversions7d" INTEGER NOT NULL DEFAULT 0,
    "revenue7d" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComputedBundle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CustomStyle_shopId_key_key" ON "CustomStyle"("shopId", "key");

-- CreateIndex
CREATE INDEX "CategoryGraph_shopId_sourceCategory_idx" ON "CategoryGraph"("shopId", "sourceCategory");

-- CreateIndex
CREATE UNIQUE INDEX "CategoryGraph_shopId_sourceCategory_targetCategory_key" ON "CategoryGraph"("shopId", "sourceCategory", "targetCategory");

-- CreateIndex
CREATE INDEX "ComputedBundle_shopId_productId_status_idx" ON "ComputedBundle"("shopId", "productId", "status");

-- CreateIndex
CREATE INDEX "ComputedBundle_shopId_status_idx" ON "ComputedBundle"("shopId", "status");

-- CreateIndex
CREATE INDEX "ProductGraph_shopId_sourceId_weight_idx" ON "ProductGraph"("shopId", "sourceId", "weight" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "ProductGraph_shopId_sourceId_targetId_type_key" ON "ProductGraph"("shopId", "sourceId", "targetId", "type");

-- AddForeignKey
ALTER TABLE "CustomStyle" ADD CONSTRAINT "CustomStyle_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryGraph" ADD CONSTRAINT "CategoryGraph_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComputedBundle" ADD CONSTRAINT "ComputedBundle_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComputedBundle" ADD CONSTRAINT "ComputedBundle_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
