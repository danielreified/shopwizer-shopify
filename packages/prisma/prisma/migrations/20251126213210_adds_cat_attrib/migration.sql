-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "attributes" JSONB DEFAULT '[]',
ADD COLUMN     "attributesValues" JSONB DEFAULT '[]';
