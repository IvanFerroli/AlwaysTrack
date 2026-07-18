CREATE TABLE "SupportScheduleRuleDraft" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "teamId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "revision" INTEGER NOT NULL DEFAULT 1,
  "baseVersionId" TEXT,
  "timezone" TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
  "maxDailyMinutes" INTEGER NOT NULL DEFAULT 840,
  "maxWeeklyMinutes" INTEGER NOT NULL DEFAULT 3600,
  "minimumRestMinutes" INTEGER NOT NULL DEFAULT 600,
  "minimumNoticeMinutes" INTEGER NOT NULL DEFAULT 60,
  "maxMonthlyExchanges" INTEGER NOT NULL DEFAULT 8,
  "autoApproveEligibleSwaps" BOOLEAN NOT NULL DEFAULT true,
  "requireManagerExtraApproval" BOOLEAN NOT NULL DEFAULT true,
  "effectiveFrom" TIMESTAMP(3) NOT NULL,
  "effectiveTo" TIMESTAMP(3),
  "normalizedPayloadJson" TEXT NOT NULL,
  "checksum" TEXT NOT NULL,
  "createdById" TEXT NOT NULL,
  "updatedById" TEXT NOT NULL,
  "publishedVersionId" TEXT,
  "archivedAt" TIMESTAMP(3),
  "archivedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "SupportScheduleRuleDraft_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "SupportScheduleRuleVersion"
  ADD COLUMN "sourceDraftId" TEXT,
  ADD COLUMN "normalizedPayloadJson" TEXT,
  ADD COLUMN "checksum" TEXT,
  ADD COLUMN "archivedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "SupportScheduleRuleDraft_publishedVersionId_key"
  ON "SupportScheduleRuleDraft"("publishedVersionId");

CREATE INDEX "SupportScheduleRuleDraft_organizationId_status_effectiveFrom_idx"
  ON "SupportScheduleRuleDraft"("organizationId", "status", "effectiveFrom");

CREATE INDEX "SupportScheduleRuleDraft_teamId_status_effectiveFrom_idx"
  ON "SupportScheduleRuleDraft"("teamId", "status", "effectiveFrom");

CREATE INDEX "SupportScheduleRuleDraft_checksum_idx"
  ON "SupportScheduleRuleDraft"("checksum");

CREATE INDEX "SupportScheduleRuleDraft_baseVersionId_idx"
  ON "SupportScheduleRuleDraft"("baseVersionId");

CREATE UNIQUE INDEX "SupportScheduleRuleVersion_sourceDraftId_key"
  ON "SupportScheduleRuleVersion"("sourceDraftId");

CREATE INDEX "SupportScheduleRuleVersion_checksum_idx"
  ON "SupportScheduleRuleVersion"("checksum");

ALTER TABLE "SupportScheduleRuleDraft"
  ADD CONSTRAINT "SupportScheduleRuleDraft_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "SupportScheduleRuleDraft"
  ADD CONSTRAINT "SupportScheduleRuleDraft_teamId_fkey"
  FOREIGN KEY ("teamId") REFERENCES "SupportTeam"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "SupportScheduleRuleDraft"
  ADD CONSTRAINT "SupportScheduleRuleDraft_baseVersionId_fkey"
  FOREIGN KEY ("baseVersionId") REFERENCES "SupportScheduleRuleVersion"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "SupportScheduleRuleDraft"
  ADD CONSTRAINT "SupportScheduleRuleDraft_publishedVersionId_fkey"
  FOREIGN KEY ("publishedVersionId") REFERENCES "SupportScheduleRuleVersion"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "SupportScheduleRuleDraft"
  ADD CONSTRAINT "SupportScheduleRuleDraft_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "SupportScheduleRuleDraft"
  ADD CONSTRAINT "SupportScheduleRuleDraft_updatedById_fkey"
  FOREIGN KEY ("updatedById") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "SupportScheduleRuleDraft"
  ADD CONSTRAINT "SupportScheduleRuleDraft_archivedById_fkey"
  FOREIGN KEY ("archivedById") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "SupportScheduleRuleVersion"
  ADD CONSTRAINT "SupportScheduleRuleVersion_sourceDraftId_fkey"
  FOREIGN KEY ("sourceDraftId") REFERENCES "SupportScheduleRuleDraft"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
