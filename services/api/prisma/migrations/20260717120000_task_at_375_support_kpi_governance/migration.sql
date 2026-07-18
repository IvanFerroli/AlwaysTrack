ALTER TABLE "SupportKpiEntry" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'DRAFT';
ALTER TABLE "SupportKpiEntry" ADD COLUMN "revision" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "SupportKpiEntry" ADD COLUMN "supersedesId" TEXT;
ALTER TABLE "SupportKpiEntry" ADD COLUMN "submittedAt" DATETIME;
ALTER TABLE "SupportKpiEntry" ADD COLUMN "reviewedAt" DATETIME;
ALTER TABLE "SupportKpiEntry" ADD COLUMN "reviewedById" TEXT;
ALTER TABLE "SupportKpiEntry" ADD COLUMN "reviewNote" TEXT;

-- Preserve the previously visible baseline while all future writes start governed as DRAFT.
UPDATE "SupportKpiEntry"
SET "status" = 'APPROVED',
    "submittedAt" = COALESCE("submittedAt", "createdAt"),
    "reviewedAt" = COALESCE("reviewedAt", "updatedAt"),
    "reviewedById" = COALESCE("reviewedById", "updatedById");

CREATE INDEX "SupportKpiEntry_organizationId_status_periodStart_idx"
ON "SupportKpiEntry"("organizationId", "status", "periodStart");

CREATE INDEX "SupportKpiEntry_supersedesId_idx"
ON "SupportKpiEntry"("supersedesId");
