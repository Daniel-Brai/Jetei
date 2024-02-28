/*
  Warnings:

  - You are about to drop the column `expiryTimeInSecs` on the `AuthToken` table. All the data in the column will be lost.
  - Added the required column `expiryTimeInSecsToBeElaspedFromNow` to the `AuthToken` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "AuthToken" DROP COLUMN "expiryTimeInSecs",
ADD COLUMN     "expiryTimeInSecsToBeElaspedFromNow" INTEGER NOT NULL;
