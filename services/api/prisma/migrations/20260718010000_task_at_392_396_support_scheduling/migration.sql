CREATE TABLE "SupportScheduleRuleVersion" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "teamId" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "timezone" TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
  "maxDailyMinutes" INTEGER NOT NULL DEFAULT 840,
  "maxWeeklyMinutes" INTEGER NOT NULL DEFAULT 3600,
  "minimumRestMinutes" INTEGER NOT NULL DEFAULT 600,
  "minimumNoticeMinutes" INTEGER NOT NULL DEFAULT 60,
  "maxMonthlyExchanges" INTEGER NOT NULL DEFAULT 8,
  "autoApproveEligibleSwaps" BOOLEAN NOT NULL DEFAULT true,
  "requireManagerExtraApproval" BOOLEAN NOT NULL DEFAULT true,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "effectiveFrom" DATETIME NOT NULL,
  "effectiveTo" DATETIME,
  "createdById" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SupportScheduleRuleVersion_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "SupportScheduleRuleVersion_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "SupportTeam" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "SupportScheduleRuleVersion_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "SupportShiftPatternVersion" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "teamId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "startMinute" INTEGER NOT NULL,
  "endMinute" INTEGER NOT NULL,
  "weekdaysJson" TEXT NOT NULL DEFAULT '[1,2,3,4,5,6,0]',
  "timezone" TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
  "active" BOOLEAN NOT NULL DEFAULT true,
  "effectiveFrom" DATETIME NOT NULL,
  "effectiveTo" DATETIME,
  "createdById" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SupportShiftPatternVersion_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "SupportShiftPatternVersion_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "SupportTeam" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "SupportShiftPatternVersion_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "SupportShiftAssignment" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "teamId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "patternVersionId" TEXT NOT NULL,
  "validFrom" DATETIME NOT NULL,
  "validTo" DATETIME,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdById" TEXT NOT NULL,
  "updatedById" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "SupportShiftAssignment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "SupportShiftAssignment_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "SupportTeam" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "SupportShiftAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "SupportShiftAssignment_patternVersionId_fkey" FOREIGN KEY ("patternVersionId") REFERENCES "SupportShiftPatternVersion" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "SupportShiftAssignment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "SupportShiftAssignment_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "SupportShiftOccurrence" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "teamId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "assignmentId" TEXT,
  "patternVersionId" TEXT,
  "ruleVersionId" TEXT NOT NULL,
  "localDate" TEXT NOT NULL,
  "startsAt" DATETIME NOT NULL,
  "endsAt" DATETIME NOT NULL,
  "kind" TEXT NOT NULL DEFAULT 'REGULAR',
  "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
  "sourceType" TEXT NOT NULL DEFAULT 'MATERIALIZED',
  "sourceId" TEXT,
  "ruleSnapshotJson" TEXT NOT NULL,
  "publishedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "cancelledAt" DATETIME,
  "cancellationReason" TEXT,
  "createdById" TEXT NOT NULL,
  "updatedById" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "SupportShiftOccurrence_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "SupportShiftOccurrence_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "SupportTeam" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "SupportShiftOccurrence_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "SupportShiftOccurrence_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "SupportShiftAssignment" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "SupportShiftOccurrence_patternVersionId_fkey" FOREIGN KEY ("patternVersionId") REFERENCES "SupportShiftPatternVersion" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "SupportShiftOccurrence_ruleVersionId_fkey" FOREIGN KEY ("ruleVersionId") REFERENCES "SupportScheduleRuleVersion" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "SupportShiftOccurrence_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "SupportShiftOccurrence_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "SupportShiftOffer" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "teamId" TEXT NOT NULL,
  "occurrenceId" TEXT NOT NULL,
  "targetOccurrenceId" TEXT,
  "offeredById" TEXT NOT NULL,
  "targetUserId" TEXT,
  "ruleVersionId" TEXT NOT NULL,
  "type" TEXT NOT NULL DEFAULT 'SWAP',
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "note" TEXT,
  "policySnapshotJson" TEXT NOT NULL,
  "expiresAt" DATETIME,
  "peerAcceptedAt" DATETIME,
  "decidedById" TEXT,
  "decidedAt" DATETIME,
  "decisionReason" TEXT,
  "appliedAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "SupportShiftOffer_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "SupportShiftOffer_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "SupportTeam" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "SupportShiftOffer_occurrenceId_fkey" FOREIGN KEY ("occurrenceId") REFERENCES "SupportShiftOccurrence" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "SupportShiftOffer_targetOccurrenceId_fkey" FOREIGN KEY ("targetOccurrenceId") REFERENCES "SupportShiftOccurrence" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "SupportShiftOffer_offeredById_fkey" FOREIGN KEY ("offeredById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "SupportShiftOffer_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "SupportShiftOffer_ruleVersionId_fkey" FOREIGN KEY ("ruleVersionId") REFERENCES "SupportScheduleRuleVersion" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "SupportShiftOffer_decidedById_fkey" FOREIGN KEY ("decidedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "SupportExtraShiftSlot" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "teamId" TEXT NOT NULL,
  "ruleVersionId" TEXT NOT NULL,
  "startsAt" DATETIME NOT NULL,
  "endsAt" DATETIME NOT NULL,
  "capacity" INTEGER NOT NULL DEFAULT 1,
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "note" TEXT,
  "policySnapshotJson" TEXT NOT NULL,
  "createdById" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "SupportExtraShiftSlot_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "SupportExtraShiftSlot_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "SupportTeam" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "SupportExtraShiftSlot_ruleVersionId_fkey" FOREIGN KEY ("ruleVersionId") REFERENCES "SupportScheduleRuleVersion" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "SupportExtraShiftSlot_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "SupportExtraShiftClaim" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "teamId" TEXT NOT NULL,
  "slotId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "occurrenceId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "note" TEXT,
  "decidedById" TEXT,
  "decidedAt" DATETIME,
  "decisionReason" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "SupportExtraShiftClaim_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "SupportExtraShiftClaim_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "SupportTeam" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "SupportExtraShiftClaim_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "SupportExtraShiftSlot" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "SupportExtraShiftClaim_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "SupportExtraShiftClaim_occurrenceId_fkey" FOREIGN KEY ("occurrenceId") REFERENCES "SupportShiftOccurrence" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "SupportExtraShiftClaim_decidedById_fkey" FOREIGN KEY ("decidedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

ALTER TABLE "SupportPauseBooking" ADD COLUMN "shiftOccurrenceId" TEXT REFERENCES "SupportShiftOccurrence" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SupportPauseBooking" ADD COLUMN "rescheduledFromId" TEXT REFERENCES "SupportPauseBooking" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SupportPauseBooking" ADD COLUMN "rescheduleRequiredAt" DATETIME;
ALTER TABLE "SupportPauseBooking" ADD COLUMN "rescheduleReason" TEXT;

CREATE UNIQUE INDEX "SupportScheduleRuleVersion_teamId_version_key" ON "SupportScheduleRuleVersion"("teamId", "version");
CREATE INDEX "SupportScheduleRuleVersion_organizationId_effectiveFrom_effectiveTo_idx" ON "SupportScheduleRuleVersion"("organizationId", "effectiveFrom", "effectiveTo");
CREATE INDEX "SupportScheduleRuleVersion_teamId_active_effectiveFrom_idx" ON "SupportScheduleRuleVersion"("teamId", "active", "effectiveFrom");
CREATE UNIQUE INDEX "SupportShiftPatternVersion_teamId_name_version_key" ON "SupportShiftPatternVersion"("teamId", "name", "version");
CREATE INDEX "SupportShiftPatternVersion_organizationId_active_idx" ON "SupportShiftPatternVersion"("organizationId", "active");
CREATE INDEX "SupportShiftPatternVersion_teamId_effectiveFrom_effectiveTo_idx" ON "SupportShiftPatternVersion"("teamId", "effectiveFrom", "effectiveTo");
CREATE INDEX "SupportShiftAssignment_organizationId_userId_validFrom_validTo_idx" ON "SupportShiftAssignment"("organizationId", "userId", "validFrom", "validTo");
CREATE INDEX "SupportShiftAssignment_teamId_active_validFrom_idx" ON "SupportShiftAssignment"("teamId", "active", "validFrom");
CREATE INDEX "SupportShiftAssignment_patternVersionId_idx" ON "SupportShiftAssignment"("patternVersionId");
CREATE UNIQUE INDEX "SupportShiftOccurrence_assignmentId_localDate_key" ON "SupportShiftOccurrence"("assignmentId", "localDate");
CREATE INDEX "SupportShiftOccurrence_organizationId_localDate_status_idx" ON "SupportShiftOccurrence"("organizationId", "localDate", "status");
CREATE INDEX "SupportShiftOccurrence_teamId_startsAt_endsAt_idx" ON "SupportShiftOccurrence"("teamId", "startsAt", "endsAt");
CREATE INDEX "SupportShiftOccurrence_userId_startsAt_endsAt_idx" ON "SupportShiftOccurrence"("userId", "startsAt", "endsAt");
CREATE INDEX "SupportShiftOffer_organizationId_status_expiresAt_idx" ON "SupportShiftOffer"("organizationId", "status", "expiresAt");
CREATE INDEX "SupportShiftOffer_teamId_status_idx" ON "SupportShiftOffer"("teamId", "status");
CREATE INDEX "SupportShiftOffer_offeredById_status_idx" ON "SupportShiftOffer"("offeredById", "status");
CREATE INDEX "SupportShiftOffer_targetUserId_status_idx" ON "SupportShiftOffer"("targetUserId", "status");
CREATE UNIQUE INDEX "SupportExtraShiftSlot_teamId_startsAt_endsAt_key" ON "SupportExtraShiftSlot"("teamId", "startsAt", "endsAt");
CREATE INDEX "SupportExtraShiftSlot_organizationId_status_startsAt_idx" ON "SupportExtraShiftSlot"("organizationId", "status", "startsAt");
CREATE UNIQUE INDEX "SupportExtraShiftClaim_slotId_userId_key" ON "SupportExtraShiftClaim"("slotId", "userId");
CREATE INDEX "SupportExtraShiftClaim_organizationId_status_idx" ON "SupportExtraShiftClaim"("organizationId", "status");
CREATE INDEX "SupportExtraShiftClaim_teamId_status_idx" ON "SupportExtraShiftClaim"("teamId", "status");
CREATE INDEX "SupportExtraShiftClaim_userId_status_idx" ON "SupportExtraShiftClaim"("userId", "status");
CREATE INDEX "SupportPauseBooking_shiftOccurrenceId_status_idx" ON "SupportPauseBooking"("shiftOccurrenceId", "status");
CREATE INDEX "SupportPauseBooking_rescheduledFromId_idx" ON "SupportPauseBooking"("rescheduledFromId");
