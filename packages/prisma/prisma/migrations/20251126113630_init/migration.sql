-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateEnum
CREATE TYPE "BillingInterval" AS ENUM ('MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('ACTIVE', 'DRAFT', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ColorSource" AS ENUM ('FUZZY', 'CSS', 'NONE', 'METAFIELD', 'FALLBACK');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('FEMALE', 'MALE', 'UNISEX', 'OTHER', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "GenderSource" AS ENUM ('METAFIELD', 'AUTO', 'NONE');

-- CreateEnum
CREATE TYPE "CategorySource" AS ENUM ('FIELD', 'AUTO', 'NONE');

-- CreateEnum
CREATE TYPE "AgeBucket" AS ENUM ('NEWBORN', 'BABY', 'KID', 'TEEN', 'ADULT', 'ALL_AGE', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "AgeSource" AS ENUM ('METAFIELD', 'AUTO', 'NONE');

-- CreateEnum
CREATE TYPE "CheckoutStatus" AS ENUM ('PENDING', 'COMPLETED');

-- CreateEnum
CREATE TYPE "GlobalJobType" AS ENUM ('FEATURE_HOURLY', 'FEATURE_VALIDATE_DAILY_24H', 'FEATURE_VALIDATE_DAILY_7D', 'FEATURE_VALIDATE_DAILY_30D', 'FEATURE_BEST_SELLER', 'FEATURE_TRENDING', 'RAIL_HOURLY', 'RAIL_VALIDATE_DAILY_24H', 'RAIL_VALIDATE_DAILY_7D', 'RAIL_VALIDATE_DAILY_30D');

-- CreateEnum
CREATE TYPE "RecommendationRail" AS ENUM ('SIMILAR', 'FBT', 'TRENDING', 'BEST_SELLER', 'RECENTLY_VIEWED', 'NEW_ARRIVALS');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('IDLE', 'RUNNING', 'SUCCESS', 'FAILED');

-- CreateEnum
CREATE TYPE "JobType" AS ENUM ('SIMILAR', 'BEST_SELLER', 'TRENDING', 'FBT', 'NEW_ARRIVALS', 'COLOR');

-- CreateEnum
CREATE TYPE "EmailType" AS ENUM ('INSTALL', 'UNINSTALL', 'PLAN_CHANGE', 'USAGE_80', 'USAGE_90', 'USAGE_100', 'USAGE_CAPPED', 'USAGE_RESET');

-- CreateTable
CREATE TABLE "Shop" (
    "id" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "shopifyGid" TEXT,
    "name" TEXT,
    "email" TEXT,
    "countryCode" TEXT,
    "currency" TEXT,
    "primaryDomainUrl" TEXT,
    "planName" TEXT,
    "partnerDev" BOOLEAN,
    "scopes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "installedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uninstalledAt" TIMESTAMP(3),
    "trialEndsAt" TIMESTAMP(3),
    "status" JSONB NOT NULL DEFAULT '{}',
    "settings" JSONB NOT NULL DEFAULT '{}',
    "notifications" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShopSubscription" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "shopifyGid" TEXT NOT NULL,
    "name" TEXT,
    "status" TEXT NOT NULL,
    "interval" TEXT,
    "price" DECIMAL(12,2) NOT NULL,
    "trialDays" INTEGER,
    "currentPeriodEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "scope" TEXT,
    "expires" TIMESTAMPTZ(6),
    "accessToken" TEXT NOT NULL,
    "userId" BIGINT,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "accountOwner" BOOLEAN NOT NULL DEFAULT false,
    "locale" TEXT,
    "collaborator" BOOLEAN DEFAULT false,
    "emailVerified" BOOLEAN DEFAULT false,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppPlan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "interval" "BillingInterval" NOT NULL,
    "currency" TEXT NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "isCustom" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppPlanCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT,
    "appPlanId" TEXT NOT NULL,
    "validFrom" TIMESTAMP(3),
    "validTo" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "maxRedemptions" INTEGER,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppPlanCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShopAppPlanCodeRedemption" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "planCodeId" TEXT NOT NULL,
    "redeemedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShopAppPlanCodeRedemption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" BIGINT NOT NULL,
    "shopId" TEXT NOT NULL,
    "shopifyGid" TEXT NOT NULL,
    "handle" TEXT,
    "title" TEXT NOT NULL,
    "vendor" TEXT,
    "status" "ProductStatus" NOT NULL DEFAULT 'ACTIVE',
    "productType" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "descriptionHtml" TEXT,
    "categoryId" TEXT,
    "categorySource" "CategorySource" NOT NULL DEFAULT 'AUTO',
    "gender" "Gender"[] DEFAULT ARRAY[]::"Gender"[],
    "genderSource" "GenderSource" DEFAULT 'NONE',
    "ageBucket" "AgeBucket"[] DEFAULT ARRAY[]::"AgeBucket"[],
    "ageSource" "AgeSource" DEFAULT 'NONE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductVariant" (
    "id" BIGINT NOT NULL,
    "productId" BIGINT NOT NULL,
    "shopifyGid" TEXT NOT NULL,
    "sku" TEXT,
    "barcode" TEXT,
    "position" INTEGER,
    "title" TEXT,
    "price" DECIMAL(14,4),
    "priceUsd" DECIMAL(14,4),
    "compareAtPrice" DECIMAL(14,4),
    "inventoryQuantity" INTEGER,
    "inventoryItemGid" TEXT,
    "imageId" BIGINT,
    "color_label" TEXT,
    "color_hex" TEXT,
    "lab_l" DOUBLE PRECISION,
    "lab_a" DOUBLE PRECISION,
    "lab_b" DOUBLE PRECISION,
    "hue" DOUBLE PRECISION,
    "color_source" "ColorSource",
    "color_version" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductImage" (
    "id" BIGINT NOT NULL,
    "productId" BIGINT NOT NULL,
    "shopifyGid" TEXT,
    "url" TEXT NOT NULL,
    "altText" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "position" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductEmbedding" (
    "id" TEXT NOT NULL,
    "productId" BIGINT NOT NULL,
    "shopId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "textHash" CHAR(64) NOT NULL,
    "sourceText" TEXT,
    "vector" vector(1536) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductEmbedding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductVendorEmbedding" (
    "id" TEXT NOT NULL,
    "productId" BIGINT NOT NULL,
    "shopId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "textHash" CHAR(64) NOT NULL,
    "sourceText" TEXT,
    "vector" vector(1536) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductVendorEmbedding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "pathIds" TEXT[],
    "parentId" TEXT,
    "depth" INTEGER NOT NULL,
    "isLeaf" BOOLEAN NOT NULL,
    "hasAgeGroup" BOOLEAN NOT NULL,
    "hasColor" BOOLEAN NOT NULL,
    "hasFabric" BOOLEAN NOT NULL,
    "hasPattern" BOOLEAN NOT NULL,
    "hasTargetGender" BOOLEAN NOT NULL,
    "topLevel" TEXT NOT NULL,
    "sourceFile" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "vector" vector(1536) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Checkout" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3),
    "abandonedCheckoutUrl" TEXT,
    "status" "CheckoutStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Checkout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CheckoutLineItem" (
    "id" TEXT NOT NULL,
    "checkoutId" TEXT NOT NULL,
    "productId" TEXT,
    "variantId" TEXT,
    "quantity" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CheckoutLineItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" BIGINT NOT NULL,
    "shopId" TEXT NOT NULL,
    "shopifyGid" TEXT NOT NULL,
    "checkoutId" TEXT,
    "totalPrice" DECIMAL(14,4),
    "totalPriceUsd" DECIMAL(14,4),
    "totalAttributedPrice" DECIMAL(14,4),
    "totalAttributedPriceUsd" DECIMAL(14,4),
    "currency" TEXT NOT NULL,
    "isBillable" BOOLEAN NOT NULL DEFAULT false,
    "isBulk" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderLineItem" (
    "id" BIGINT NOT NULL,
    "shopId" TEXT NOT NULL,
    "shopifyGid" TEXT NOT NULL,
    "orderId" BIGINT NOT NULL,
    "productId" BIGINT,
    "variantId" BIGINT,
    "quantity" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "priceUsd" DECIMAL(14,4),
    "attributed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderLineItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GlobalJobCheckpoint" (
    "id" TEXT NOT NULL,
    "job" "GlobalJobType" NOT NULL,
    "windowStart" TIMESTAMP(3),
    "windowEnd" TIMESTAMP(3),
    "lastRunAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GlobalJobCheckpoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductGraph" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "sourceId" BIGINT NOT NULL,
    "targetId" BIGINT NOT NULL,
    "fbtScore" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductGraph_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductFeature" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "productId" BIGINT NOT NULL,
    "views24h" INTEGER NOT NULL DEFAULT 0,
    "views7d" INTEGER NOT NULL DEFAULT 0,
    "views30d" INTEGER NOT NULL DEFAULT 0,
    "clicks24h" INTEGER NOT NULL DEFAULT 0,
    "clicks7d" INTEGER NOT NULL DEFAULT 0,
    "clicks30d" INTEGER NOT NULL DEFAULT 0,
    "carts24h" INTEGER NOT NULL DEFAULT 0,
    "carts7d" INTEGER NOT NULL DEFAULT 0,
    "carts30d" INTEGER NOT NULL DEFAULT 0,
    "orders7d" INTEGER NOT NULL DEFAULT 0,
    "orders30d" INTEGER NOT NULL DEFAULT 0,
    "revenue7d" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "revenue30d" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bestSellerScore" DOUBLE PRECISION,
    "trendingScore" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductFeature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RailMetric" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "productId" BIGINT NOT NULL,
    "rail" "RecommendationRail" NOT NULL,
    "impressions24h" INTEGER NOT NULL,
    "impressions7d" INTEGER NOT NULL,
    "impressions30d" INTEGER NOT NULL,
    "clicks24h" INTEGER NOT NULL,
    "clicks7d" INTEGER NOT NULL,
    "clicks30d" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RailMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "type" "JobType" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "scheduleInterval" INTEGER NOT NULL,
    "lastRun" TIMESTAMP(3),
    "nextRun" TIMESTAMP(3),
    "status" "JobStatus" NOT NULL DEFAULT 'IDLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PxAnalytics" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "window" TIMESTAMP(3) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PxAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailLog" (
    "id" TEXT NOT NULL,
    "shopId" TEXT,
    "type" "EmailType" NOT NULL,
    "to" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "EmailLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Shop_domain_key" ON "Shop"("domain");

-- CreateIndex
CREATE UNIQUE INDEX "ShopSubscription_shopifyGid_key" ON "ShopSubscription"("shopifyGid");

-- CreateIndex
CREATE UNIQUE INDEX "AppPlan_slug_key" ON "AppPlan"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "AppPlanCode_code_key" ON "AppPlanCode"("code");

-- CreateIndex
CREATE INDEX "AppPlanCode_appPlanId_idx" ON "AppPlanCode"("appPlanId");

-- CreateIndex
CREATE INDEX "ShopAppPlanCodeRedemption_planCodeId_idx" ON "ShopAppPlanCodeRedemption"("planCodeId");

-- CreateIndex
CREATE UNIQUE INDEX "ShopAppPlanCodeRedemption_shopId_planCodeId_key" ON "ShopAppPlanCodeRedemption"("shopId", "planCodeId");

-- CreateIndex
CREATE UNIQUE INDEX "Product_shopifyGid_key" ON "Product"("shopifyGid");

-- CreateIndex
CREATE INDEX "Product_shopId_idx" ON "Product"("shopId");

-- CreateIndex
CREATE INDEX "Product_shopId_handle_idx" ON "Product"("shopId", "handle");

-- CreateIndex
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_shopifyGid_key" ON "ProductVariant"("shopifyGid");

-- CreateIndex
CREATE INDEX "ProductVariant_productId_idx" ON "ProductVariant"("productId");

-- CreateIndex
CREATE INDEX "ProductVariant_sku_idx" ON "ProductVariant"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "ProductImage_shopifyGid_key" ON "ProductImage"("shopifyGid");

-- CreateIndex
CREATE INDEX "ProductImage_productId_idx" ON "ProductImage"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductEmbedding_productId_key" ON "ProductEmbedding"("productId");

-- CreateIndex
CREATE INDEX "ProductEmbedding_shopId_idx" ON "ProductEmbedding"("shopId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVendorEmbedding_productId_key" ON "ProductVendorEmbedding"("productId");

-- CreateIndex
CREATE INDEX "ProductVendorEmbedding_shopId_idx" ON "ProductVendorEmbedding"("shopId");

-- CreateIndex
CREATE INDEX "Category_parentId_idx" ON "Category"("parentId");

-- CreateIndex
CREATE INDEX "Category_depth_idx" ON "Category"("depth");

-- CreateIndex
CREATE INDEX "Checkout_shopId_idx" ON "Checkout"("shopId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_shopifyGid_key" ON "Order"("shopifyGid");

-- CreateIndex
CREATE INDEX "Order_shopId_idx" ON "Order"("shopId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_id_shopId_key" ON "Order"("id", "shopId");

-- CreateIndex
CREATE UNIQUE INDEX "OrderLineItem_shopifyGid_key" ON "OrderLineItem"("shopifyGid");

-- CreateIndex
CREATE INDEX "OrderLineItem_shopId_productId_idx" ON "OrderLineItem"("shopId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "GlobalJobCheckpoint_job_key" ON "GlobalJobCheckpoint"("job");

-- CreateIndex
CREATE INDEX "ProductGraph_shopId_idx" ON "ProductGraph"("shopId");

-- CreateIndex
CREATE INDEX "ProductGraph_sourceId_idx" ON "ProductGraph"("sourceId");

-- CreateIndex
CREATE INDEX "ProductGraph_targetId_idx" ON "ProductGraph"("targetId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductGraph_shopId_sourceId_targetId_key" ON "ProductGraph"("shopId", "sourceId", "targetId");

-- CreateIndex
CREATE INDEX "ProductFeature_shopId_productId_idx" ON "ProductFeature"("shopId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductFeature_shopId_productId_key" ON "ProductFeature"("shopId", "productId");

-- CreateIndex
CREATE INDEX "RailMetric_shopId_productId_idx" ON "RailMetric"("shopId", "productId");

-- CreateIndex
CREATE INDEX "RailMetric_rail_idx" ON "RailMetric"("rail");

-- CreateIndex
CREATE UNIQUE INDEX "RailMetric_shopId_productId_rail_key" ON "RailMetric"("shopId", "productId", "rail");

-- CreateIndex
CREATE UNIQUE INDEX "Job_shopId_type_key" ON "Job"("shopId", "type");

-- CreateIndex
CREATE INDEX "PxAnalytics_shop_event_idx" ON "PxAnalytics"("shop", "event");

-- CreateIndex
CREATE UNIQUE INDEX "PxAnalytics_shop_event_window_key" ON "PxAnalytics"("shop", "event", "window");

-- CreateIndex
CREATE INDEX "EmailLog_shopId_idx" ON "EmailLog"("shopId");

-- CreateIndex
CREATE INDEX "EmailLog_type_idx" ON "EmailLog"("type");

-- CreateIndex
CREATE INDEX "EmailLog_sentAt_idx" ON "EmailLog"("sentAt");

-- AddForeignKey
ALTER TABLE "ShopSubscription" ADD CONSTRAINT "ShopSubscription_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppPlanCode" ADD CONSTRAINT "AppPlanCode_appPlanId_fkey" FOREIGN KEY ("appPlanId") REFERENCES "AppPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopAppPlanCodeRedemption" ADD CONSTRAINT "ShopAppPlanCodeRedemption_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopAppPlanCodeRedemption" ADD CONSTRAINT "ShopAppPlanCodeRedemption_planCodeId_fkey" FOREIGN KEY ("planCodeId") REFERENCES "AppPlanCode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "ProductImage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductEmbedding" ADD CONSTRAINT "ProductEmbedding_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductEmbedding" ADD CONSTRAINT "ProductEmbedding_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVendorEmbedding" ADD CONSTRAINT "ProductVendorEmbedding_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVendorEmbedding" ADD CONSTRAINT "ProductVendorEmbedding_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckoutLineItem" ADD CONSTRAINT "CheckoutLineItem_checkoutId_fkey" FOREIGN KEY ("checkoutId") REFERENCES "Checkout"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderLineItem" ADD CONSTRAINT "OrderLineItem_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderLineItem" ADD CONSTRAINT "OrderLineItem_orderId_shopId_fkey" FOREIGN KEY ("orderId", "shopId") REFERENCES "Order"("id", "shopId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductGraph" ADD CONSTRAINT "ProductGraph_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductGraph" ADD CONSTRAINT "ProductGraph_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductGraph" ADD CONSTRAINT "ProductGraph_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductFeature" ADD CONSTRAINT "ProductFeature_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductFeature" ADD CONSTRAINT "ProductFeature_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RailMetric" ADD CONSTRAINT "RailMetric_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RailMetric" ADD CONSTRAINT "RailMetric_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
