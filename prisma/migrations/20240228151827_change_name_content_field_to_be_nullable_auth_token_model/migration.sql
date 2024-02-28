-- AlterTable
ALTER TABLE "AuthToken" ADD COLUMN     "content" TEXT,
ALTER COLUMN "name" DROP NOT NULL;
