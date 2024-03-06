/*
  Warnings:

  - You are about to drop the column `expiryTimeInSecsToBeElaspedFromNow` on the `AuthToken` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "AuthToken" DROP COLUMN "expiryTimeInSecsToBeElaspedFromNow";
