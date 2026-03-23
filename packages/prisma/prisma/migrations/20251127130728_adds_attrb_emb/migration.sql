-- CreateTable
CREATE TABLE "ProductAttributesEmbedding" (
    "id" TEXT NOT NULL,
    "productId" BIGINT NOT NULL,
    "shopId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "textHash" CHAR(64) NOT NULL,
    "sourceText" TEXT,
    "vector" vector(1536) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductAttributesEmbedding_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductAttributesEmbedding_productId_key" ON "ProductAttributesEmbedding"("productId");

-- CreateIndex
CREATE INDEX "ProductAttributesEmbedding_shopId_idx" ON "ProductAttributesEmbedding"("shopId");

-- AddForeignKey
ALTER TABLE "ProductAttributesEmbedding" ADD CONSTRAINT "ProductAttributesEmbedding_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductAttributesEmbedding" ADD CONSTRAINT "ProductAttributesEmbedding_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
