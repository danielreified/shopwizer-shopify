-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "collectionHandles" TEXT[] DEFAULT ARRAY[]::TEXT[];
