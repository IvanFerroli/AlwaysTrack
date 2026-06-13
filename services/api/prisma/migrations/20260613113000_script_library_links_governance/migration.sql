-- AlterTable
ALTER TABLE "OperationalScript" ADD COLUMN "wikiPageId" TEXT;
ALTER TABLE "OperationalScript" ADD COLUMN "faqThreadId" TEXT;
ALTER TABLE "OperationalScript" ADD COLUMN "reviewDueAt" DATETIME;
ALTER TABLE "OperationalScript" ADD COLUMN "recertifiedById" TEXT;
ALTER TABLE "OperationalScript" ADD COLUMN "recertifiedAt" DATETIME;

-- CreateIndex
CREATE INDEX "OperationalScript_wikiPageId_idx" ON "OperationalScript"("wikiPageId");

-- CreateIndex
CREATE INDEX "OperationalScript_faqThreadId_idx" ON "OperationalScript"("faqThreadId");

-- CreateIndex
CREATE INDEX "OperationalScript_reviewDueAt_idx" ON "OperationalScript"("reviewDueAt");

-- CreateIndex
CREATE INDEX "OperationalScript_recertifiedById_idx" ON "OperationalScript"("recertifiedById");
