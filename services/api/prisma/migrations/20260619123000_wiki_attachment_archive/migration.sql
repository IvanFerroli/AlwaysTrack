-- AlterTable
ALTER TABLE "WikiAttachment" ADD COLUMN "archivedById" TEXT;
ALTER TABLE "WikiAttachment" ADD COLUMN "archivedAt" DATETIME;

-- CreateIndex
CREATE INDEX "WikiAttachment_archivedAt_idx" ON "WikiAttachment"("archivedAt");
