CREATE TABLE "SupportTeam" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "SupportTeam_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "SupportTeamMembership" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "teamId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "validFrom" DATETIME NOT NULL,
  "validTo" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "SupportTeamMembership_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "SupportTeamMembership_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "SupportTeam" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "SupportTeamMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

ALTER TABLE "SupportPauseSlot" ADD COLUMN "teamId" TEXT REFERENCES "SupportTeam"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SupportKpiEntry" ADD COLUMN "numerator" REAL;
ALTER TABLE "SupportKpiEntry" ADD COLUMN "denominator" REAL;
ALTER TABLE "SupportKpiEntry" ADD COLUMN "teamId" TEXT REFERENCES "SupportTeam"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SupportCampaign" ADD COLUMN "teamId" TEXT REFERENCES "SupportTeam"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE UNIQUE INDEX "SupportTeam_organizationId_name_key" ON "SupportTeam"("organizationId", "name");
CREATE INDEX "SupportTeam_organizationId_active_idx" ON "SupportTeam"("organizationId", "active");
CREATE UNIQUE INDEX "SupportTeamMembership_teamId_userId_validFrom_key" ON "SupportTeamMembership"("teamId", "userId", "validFrom");
CREATE INDEX "SupportTeamMembership_organizationId_validFrom_validTo_idx" ON "SupportTeamMembership"("organizationId", "validFrom", "validTo");
CREATE INDEX "SupportTeamMembership_userId_validFrom_validTo_idx" ON "SupportTeamMembership"("userId", "validFrom", "validTo");
CREATE INDEX "SupportPauseSlot_teamId_startsAt_idx" ON "SupportPauseSlot"("teamId", "startsAt");
CREATE INDEX "SupportKpiEntry_teamId_periodStart_idx" ON "SupportKpiEntry"("teamId", "periodStart");
CREATE INDEX "SupportCampaign_teamId_status_idx" ON "SupportCampaign"("teamId", "status");
