-- CreateIndex
CREATE INDEX "Product_vendorNormalized_idx" ON "Product"("vendorNormalized");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_vendorNormalized_fkey" FOREIGN KEY ("vendorNormalized") REFERENCES "VendorEmbedding"("vendorNormalized") ON DELETE SET NULL ON UPDATE CASCADE;
