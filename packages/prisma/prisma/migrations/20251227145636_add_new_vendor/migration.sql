/*
  Warnings:

  - You are about to drop the `ProductVendorEmbedding` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "EmailType" ADD VALUE 'USAGE_APPROACHING';
ALTER TYPE "EmailType" ADD VALUE 'SYNC_COMPLETE';

-- DropForeignKey
ALTER TABLE "public"."ProductVendorEmbedding" DROP CONSTRAINT "ProductVendorEmbedding_productId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ProductVendorEmbedding" DROP CONSTRAINT "ProductVendorEmbedding_shopId_fkey";

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "vendorNormalized" TEXT;

-- DropTable
DROP TABLE "public"."ProductVendorEmbedding";

-- CreateTable
CREATE TABLE "VendorEmbedding" (
    "id" TEXT NOT NULL,
    "vendorNormalized" TEXT NOT NULL,
    "vendorOriginal" TEXT,
    "vector" vector(1536) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorEmbedding_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VendorEmbedding_vendorNormalized_key" ON "VendorEmbedding"("vendorNormalized");
