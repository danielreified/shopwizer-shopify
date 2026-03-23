/*
  Warnings:

  - A unique constraint covering the columns `[shopId,category,provider]` on the table `ShopIntegration` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ShopIntegration_shopId_category_provider_key" ON "ShopIntegration"("shopId", "category", "provider");
