-- DropIndex
DROP INDEX "ChatParticipant_inviteeId_key";

-- DropIndex
DROP INDEX "ChatParticipant_userId_inviteeId_key";

-- DropIndex
DROP INDEX "ChatParticipant_userId_key";

-- CreateIndex
CREATE INDEX "ChatParticipant_userId_inviteeId_idx" ON "ChatParticipant"("userId", "inviteeId");
