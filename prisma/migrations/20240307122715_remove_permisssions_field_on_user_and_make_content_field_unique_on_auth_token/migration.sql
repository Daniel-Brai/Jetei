/*
  Warnings:

  - You are about to drop the column `permissions` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[content]` on the table `AuthToken` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "permissions";

-- CreateIndex
CREATE UNIQUE INDEX "AuthToken_content_key" ON "AuthToken"("content");
