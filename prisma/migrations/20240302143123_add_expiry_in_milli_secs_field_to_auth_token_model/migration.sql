/*
  Warnings:

  - Added the required column `expiryInMilliSecs` to the `AuthToken` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "AuthToken" ADD COLUMN     "expiryInMilliSecs" INTEGER NOT NULL;
