PRAGMA foreign_keys=OFF;

CREATE TABLE "new_SupportKpiEntry" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "metric" TEXT NOT NULL,
  "definitionVersion" INTEGER NOT NULL DEFAULT 2,
  "unit" TEXT NOT NULL DEFAULT 'COUNT',
  "value" REAL,
  "numerator" REAL,
  "denominator" REAL,
  "channel" TEXT,
  "granularity" TEXT NOT NULL DEFAULT 'REPORTED_INTERVAL',
  "observationType" TEXT NOT NULL DEFAULT 'ACTUAL',
  "rawValue" TEXT,
  "dataState" TEXT NOT NULL DEFAULT 'AVAILABLE',
  "dataStateVersion" INTEGER NOT NULL DEFAULT 1,
  "scopeType" TEXT NOT NULL,
  "userId" TEXT,
  "teamLabel" TEXT,
  "teamId" TEXT,
  "membershipId" TEXT,
  "periodStart" DATETIME NOT NULL,
  "periodEnd" DATETIME NOT NULL,
  "timezone" TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
  "referenceYear" INTEGER NOT NULL,
  "source" TEXT,
  "externalReference" TEXT,
  "dedupeKey" TEXT,
  "note" TEXT,
  "createdById" TEXT NOT NULL,
  "updatedById" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "revision" INTEGER NOT NULL DEFAULT 1,
  "supersedesId" TEXT,
  "submittedAt" DATETIME,
  "reviewedAt" DATETIME,
  "reviewedById" TEXT,
  "reviewNote" TEXT,
  "archivedAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "SupportKpiEntry_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "SupportKpiEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "SupportKpiEntry_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "SupportTeam" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "SupportKpiEntry_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "SupportTeamMembership" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "SupportKpiEntry_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "SupportKpiEntry_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

INSERT INTO "new_SupportKpiEntry" (
  "id", "organizationId", "metric", "definitionVersion", "unit", "value", "numerator", "denominator",
  "channel", "granularity", "observationType", "rawValue", "dataState", "dataStateVersion", "scopeType",
  "userId", "teamLabel", "teamId", "membershipId", "periodStart", "periodEnd", "timezone", "referenceYear",
  "source", "externalReference", "dedupeKey", "note", "createdById", "updatedById", "status", "revision",
  "supersedesId", "submittedAt", "reviewedAt", "reviewedById", "reviewNote", "archivedAt", "createdAt", "updatedAt"
)
SELECT
  "id", "organizationId", "metric", "definitionVersion", "unit", "value", "numerator", "denominator",
  "channel", "granularity", "observationType", "rawValue", "dataState", 1, "scopeType",
  "userId", "teamLabel", "teamId", NULL, "periodStart", "periodEnd", 'America/Sao_Paulo',
  CASE
    WHEN typeof("periodStart") IN ('integer', 'real')
      THEN CAST(strftime('%Y', "periodStart" / 1000, 'unixepoch', '-3 hours') AS INTEGER)
    ELSE CAST(strftime('%Y', "periodStart", '-3 hours') AS INTEGER)
  END, "source", NULL, NULL, "note", "createdById", "updatedById",
  "status", "revision", "supersedesId", "submittedAt", "reviewedAt", "reviewedById", "reviewNote", "archivedAt",
  "createdAt", "updatedAt"
FROM "SupportKpiEntry";

DROP TABLE "SupportKpiEntry";
ALTER TABLE "new_SupportKpiEntry" RENAME TO "SupportKpiEntry";

CREATE INDEX "SupportKpiEntry_organizationId_metric_periodStart_idx" ON "SupportKpiEntry"("organizationId", "metric", "periodStart");
CREATE INDEX "SupportKpiEntry_organizationId_scopeType_idx" ON "SupportKpiEntry"("organizationId", "scopeType");
CREATE INDEX "SupportKpiEntry_userId_periodStart_idx" ON "SupportKpiEntry"("userId", "periodStart");
CREATE INDEX "SupportKpiEntry_teamId_periodStart_idx" ON "SupportKpiEntry"("teamId", "periodStart");
CREATE INDEX "SupportKpiEntry_organizationId_status_periodStart_idx" ON "SupportKpiEntry"("organizationId", "status", "periodStart");
CREATE INDEX "SupportKpiEntry_organizationId_metric_channel_granularity_observationType_periodStart_idx" ON "SupportKpiEntry"("organizationId", "metric", "channel", "granularity", "observationType", "periodStart");
CREATE INDEX "SupportKpiEntry_membershipId_periodStart_idx" ON "SupportKpiEntry"("membershipId", "periodStart");
CREATE INDEX "SupportKpiEntry_supersedesId_idx" ON "SupportKpiEntry"("supersedesId");
CREATE UNIQUE INDEX "SupportKpiEntry_organizationId_source_externalReference_key" ON "SupportKpiEntry"("organizationId", "source", "externalReference");
CREATE UNIQUE INDEX "SupportKpiEntry_organizationId_dedupeKey_key" ON "SupportKpiEntry"("organizationId", "dedupeKey");

PRAGMA foreign_keys=ON;
