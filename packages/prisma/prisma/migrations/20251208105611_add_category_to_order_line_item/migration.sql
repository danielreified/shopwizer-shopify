/*
  Warnings:

  - You are about to drop the `ShopNotification` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."ShopNotification" DROP CONSTRAINT "ShopNotification_shopId_fkey";

-- AlterTable
ALTER TABLE "OrderLineItem" ADD COLUMN     "categoryId" TEXT;

-- AlterTable
ALTER TABLE "ShopSubscription" ADD COLUMN     "appPlanId" TEXT,
ADD COLUMN     "isCustom" BOOLEAN NOT NULL DEFAULT false;

-- DropTable
DROP TABLE "public"."ShopNotification";

-- CreateTable
CREATE TABLE "ShopSettings" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "contactName" TEXT,
    "contactEmail" TEXT,
    "productCapAlerts" BOOLEAN NOT NULL DEFAULT true,
    "reportEvery2Weeks" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ShopSettings_shopId_key" ON "ShopSettings"("shopId");

-- CreateIndex
CREATE INDEX "OrderLineItem_shopId_categoryId_idx" ON "OrderLineItem"("shopId", "categoryId");

-- AddForeignKey
ALTER TABLE "ShopSettings" ADD CONSTRAINT "ShopSettings_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopSubscription" ADD CONSTRAINT "ShopSubscription_appPlanId_fkey" FOREIGN KEY ("appPlanId") REFERENCES "AppPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
