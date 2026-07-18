CREATE TABLE "SupportPausePolicy" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "timezone" TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
  "minimumCoverage" INTEGER NOT NULL DEFAULT 2,
  "slotMinutes" INTEGER NOT NULL DEFAULT 15,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "SupportPausePolicy_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "SupportPauseSlot" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "label" TEXT,
  "startsAt" DATETIME NOT NULL,
  "endsAt" DATETIME NOT NULL,
  "capacity" INTEGER NOT NULL DEFAULT 1,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdById" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "SupportPauseSlot_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "SupportPauseSlot_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "SupportPauseBooking" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "slotId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'BOOKED',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "SupportPauseBooking_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "SupportPauseBooking_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "SupportPauseSlot" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "SupportPauseBooking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "SupportPauseSwap" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "requesterBookingId" TEXT NOT NULL,
  "targetBookingId" TEXT NOT NULL,
  "requestedById" TEXT NOT NULL,
  "decidedById" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "note" TEXT,
  "decidedAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "SupportPauseSwap_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "SupportPauseSwap_requesterBookingId_fkey" FOREIGN KEY ("requesterBookingId") REFERENCES "SupportPauseBooking" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "SupportPauseSwap_targetBookingId_fkey" FOREIGN KEY ("targetBookingId") REFERENCES "SupportPauseBooking" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "SupportPauseSwap_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "SupportPauseSwap_decidedById_fkey" FOREIGN KEY ("decidedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "SupportKpiEntry" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "metric" TEXT NOT NULL,
  "value" REAL NOT NULL,
  "scopeType" TEXT NOT NULL,
  "userId" TEXT,
  "teamLabel" TEXT,
  "periodStart" DATETIME NOT NULL,
  "periodEnd" DATETIME NOT NULL,
  "source" TEXT,
  "note" TEXT,
  "createdById" TEXT NOT NULL,
  "updatedById" TEXT NOT NULL,
  "archivedAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "SupportKpiEntry_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "SupportKpiEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "SupportKpiEntry_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "SupportKpiEntry_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "SupportCampaign" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "metric" TEXT NOT NULL,
  "targetValue" REAL NOT NULL,
  "comparison" TEXT NOT NULL,
  "scopeType" TEXT NOT NULL,
  "userId" TEXT,
  "teamLabel" TEXT,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "startsAt" DATETIME NOT NULL,
  "endsAt" DATETIME NOT NULL,
  "createdById" TEXT NOT NULL,
  "updatedById" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "SupportCampaign_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "SupportCampaign_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "SupportCampaign_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "SupportCampaign_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "SupportPausePolicy_organizationId_key" ON "SupportPausePolicy"("organizationId");
CREATE UNIQUE INDEX "SupportPauseSlot_organizationId_startsAt_endsAt_key" ON "SupportPauseSlot"("organizationId", "startsAt", "endsAt");
CREATE INDEX "SupportPauseSlot_organizationId_startsAt_idx" ON "SupportPauseSlot"("organizationId", "startsAt");
CREATE INDEX "SupportPauseSlot_organizationId_active_idx" ON "SupportPauseSlot"("organizationId", "active");
CREATE UNIQUE INDEX "SupportPauseBooking_slotId_userId_key" ON "SupportPauseBooking"("slotId", "userId");
CREATE INDEX "SupportPauseBooking_organizationId_status_idx" ON "SupportPauseBooking"("organizationId", "status");
CREATE INDEX "SupportPauseBooking_userId_status_idx" ON "SupportPauseBooking"("userId", "status");
CREATE INDEX "SupportPauseSwap_organizationId_status_idx" ON "SupportPauseSwap"("organizationId", "status");
CREATE INDEX "SupportPauseSwap_requestedById_status_idx" ON "SupportPauseSwap"("requestedById", "status");
CREATE INDEX "SupportPauseSwap_targetBookingId_status_idx" ON "SupportPauseSwap"("targetBookingId", "status");
CREATE INDEX "SupportKpiEntry_organizationId_metric_periodStart_idx" ON "SupportKpiEntry"("organizationId", "metric", "periodStart");
CREATE INDEX "SupportKpiEntry_organizationId_scopeType_idx" ON "SupportKpiEntry"("organizationId", "scopeType");
CREATE INDEX "SupportKpiEntry_userId_periodStart_idx" ON "SupportKpiEntry"("userId", "periodStart");
CREATE INDEX "SupportCampaign_organizationId_status_idx" ON "SupportCampaign"("organizationId", "status");
CREATE INDEX "SupportCampaign_organizationId_metric_idx" ON "SupportCampaign"("organizationId", "metric");
CREATE INDEX "SupportCampaign_startsAt_idx" ON "SupportCampaign"("startsAt");
CREATE INDEX "SupportCampaign_endsAt_idx" ON "SupportCampaign"("endsAt");
