/*
  Warnings:

  - Changed the type of `documents` on the `Hub` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Hub" DROP COLUMN "documents",
ADD COLUMN     "documents" JSON NOT NULL;
