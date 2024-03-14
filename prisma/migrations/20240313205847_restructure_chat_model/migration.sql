/*
  Warnings:

  - You are about to drop the column `name` on the `Chat` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Chat` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Chat` table. All the data in the column will be lost.
  - You are about to drop the column `chatId` on the `ChatParticipant` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `ChatParticipant` table. All the data in the column will be lost.
  - You are about to drop the column `participantId` on the `ChatParticipant` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `ChatParticipant` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Message` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId]` on the table `ChatParticipant` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[inviteeId]` on the table `ChatParticipant` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,inviteeId]` on the table `ChatParticipant` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `name` to the `Bookmark` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Chat" DROP CONSTRAINT "Chat_userId_fkey";

-- DropForeignKey
ALTER TABLE "ChatParticipant" DROP CONSTRAINT "ChatParticipant_chatId_fkey";

-- DropForeignKey
ALTER TABLE "ChatParticipant" DROP CONSTRAINT "ChatParticipant_participantId_fkey";

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_senderId_fkey";

-- DropIndex
DROP INDEX "ChatParticipant_chatId_participantId_key";

-- DropIndex
DROP INDEX "Message_senderId_key";

-- AlterTable
ALTER TABLE "Bookmark" ADD COLUMN     "name" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Chat" DROP COLUMN "name",
DROP COLUMN "type",
DROP COLUMN "userId";

-- AlterTable
ALTER TABLE "ChatParticipant" DROP COLUMN "chatId",
DROP COLUMN "createdAt",
DROP COLUMN "participantId",
DROP COLUMN "updatedAt",
ADD COLUMN     "inviteeId" TEXT,
ADD COLUMN     "userId" TEXT;

-- AlterTable
ALTER TABLE "Message" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ADD COLUMN     "readAt" TIMESTAMP(3),
ADD COLUMN     "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "_ParticipantChats" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_ParticipantChats_AB_unique" ON "_ParticipantChats"("A", "B");

-- CreateIndex
CREATE INDEX "_ParticipantChats_B_index" ON "_ParticipantChats"("B");

-- CreateIndex
CREATE UNIQUE INDEX "ChatParticipant_userId_key" ON "ChatParticipant"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ChatParticipant_inviteeId_key" ON "ChatParticipant"("inviteeId");

-- CreateIndex
CREATE UNIQUE INDEX "ChatParticipant_userId_inviteeId_key" ON "ChatParticipant"("userId", "inviteeId");

-- AddForeignKey
ALTER TABLE "ChatParticipant" ADD CONSTRAINT "ChatParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatParticipant" ADD CONSTRAINT "ChatParticipant_inviteeId_fkey" FOREIGN KEY ("inviteeId") REFERENCES "Invitee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "ChatParticipant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ParticipantChats" ADD CONSTRAINT "_ParticipantChats_A_fkey" FOREIGN KEY ("A") REFERENCES "Chat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ParticipantChats" ADD CONSTRAINT "_ParticipantChats_B_fkey" FOREIGN KEY ("B") REFERENCES "ChatParticipant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
