/*
  Warnings:

  - Added the required column `name` to the `Invitee` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Invitee" ADD COLUMN     "name" TEXT NOT NULL;
