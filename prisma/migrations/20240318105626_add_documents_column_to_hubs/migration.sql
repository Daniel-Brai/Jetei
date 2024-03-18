-- AlterTable
ALTER TABLE "Hub" ADD COLUMN     "documents" TEXT[] DEFAULT ARRAY[]::TEXT[];
