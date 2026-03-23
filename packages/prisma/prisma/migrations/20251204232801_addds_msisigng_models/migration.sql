-- CreateEnum
CREATE TYPE "IntegrationCategory" AS ENUM ('WISHLIST', 'REVIEWS');

-- CreateEnum
CREATE TYPE "IntegrationProvider" AS ENUM ('JUDGE_ME', 'OKENDO', 'GROWAVE', 'STAMPED', 'YOTPO', 'SWYM', 'NONE');

-- CreateEnum
CREATE TYPE "OnboardingStep" AS ENUM ('INSTALL', 'CONNECT', 'EMBED', 'ACTIVATE', 'DONE');

-- CreateEnum
CREATE TYPE "ProductSyncState" AS ENUM ('IDLE', 'RUNNING', 'FAILED', 'COMPLETED');

-- CreateTable
CREATE TABLE "ShopIntegration" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "category" "IntegrationCategory" NOT NULL,
    "provider" "IntegrationProvider" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "meta" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopIntegration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShopOnboarding" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "step" "OnboardingStep" NOT NULL DEFAULT 'INSTALL',
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopOnboarding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShopStatus" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "productSyncState" "ProductSyncState" NOT NULL DEFAULT 'IDLE',
    "productSyncStarted" TIMESTAMP(3),
    "productSyncEnded" TIMESTAMP(3),
    "cacheLastCleared" TIMESTAMP(3),
    "cacheStale" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShopNotification" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "productCapAlerts" BOOLEAN NOT NULL DEFAULT true,
    "reportEvery2Weeks" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ShopOnboarding_shopId_key" ON "ShopOnboarding"("shopId");

-- CreateIndex
CREATE UNIQUE INDEX "ShopStatus_shopId_key" ON "ShopStatus"("shopId");

-- CreateIndex
CREATE UNIQUE INDEX "ShopNotification_shopId_key" ON "ShopNotification"("shopId");

-- AddForeignKey
ALTER TABLE "ShopIntegration" ADD CONSTRAINT "ShopIntegration_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopOnboarding" ADD CONSTRAINT "ShopOnboarding_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopStatus" ADD CONSTRAINT "ShopStatus_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopNotification" ADD CONSTRAINT "ShopNotification_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
