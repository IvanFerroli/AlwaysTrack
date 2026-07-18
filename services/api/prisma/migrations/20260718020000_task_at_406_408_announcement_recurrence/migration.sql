CREATE TABLE "AnnouncementSeries" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "archivedAt" DATETIME,
  "createdById" TEXT NOT NULL,
  "updatedById" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "AnnouncementSeries_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "AnnouncementSeries_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "AnnouncementSeries_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "AnnouncementSeriesVersion" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "seriesId" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "effectiveFromDate" TEXT NOT NULL,
  "validFromDate" TEXT NOT NULL,
  "validToDate" TEXT,
  "recurrenceType" TEXT NOT NULL DEFAULT 'MONTHLY_DAYS',
  "timezone" TEXT NOT NULL,
  "localTime" TEXT NOT NULL,
  "recurrenceDaysJson" TEXT NOT NULL DEFAULT '[14,29]',
  "missingDayPolicy" TEXT NOT NULL DEFAULT 'SKIP',
  "durationMinutes" INTEGER NOT NULL DEFAULT 1440,
  "title" TEXT NOT NULL,
  "summary" TEXT,
  "content" TEXT NOT NULL,
  "tagsJson" TEXT,
  "linksJson" TEXT,
  "targetRolesJson" TEXT,
  "priority" TEXT NOT NULL DEFAULT 'NORMAL',
  "pinned" BOOLEAN NOT NULL DEFAULT false,
  "requiresAck" BOOLEAN NOT NULL DEFAULT false,
  "createdById" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AnnouncementSeriesVersion_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "AnnouncementSeriesVersion_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "AnnouncementSeries" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "AnnouncementSeriesVersion_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "AnnouncementOccurrence" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "seriesId" TEXT NOT NULL,
  "versionId" TEXT NOT NULL,
  "announcementId" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "localDate" TEXT NOT NULL,
  "scheduledFor" DATETIME NOT NULL,
  "expiresAt" DATETIME NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
  "materializedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastAttemptAt" DATETIME,
  "publishedAt" DATETIME,
  "cancelledAt" DATETIME,
  "cancelledById" TEXT,
  "cancellationReason" TEXT,
  "failureMessage" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "AnnouncementOccurrence_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "AnnouncementOccurrence_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "AnnouncementSeries" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "AnnouncementOccurrence_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "AnnouncementSeriesVersion" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "AnnouncementOccurrence_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "Announcement" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "AnnouncementOccurrence_cancelledById_fkey" FOREIGN KEY ("cancelledById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "AnnouncementSeries_organizationId_slug_key" ON "AnnouncementSeries"("organizationId", "slug");
CREATE INDEX "AnnouncementSeries_organizationId_status_idx" ON "AnnouncementSeries"("organizationId", "status");
CREATE UNIQUE INDEX "AnnouncementSeriesVersion_seriesId_version_key" ON "AnnouncementSeriesVersion"("seriesId", "version");
CREATE INDEX "AnnouncementSeriesVersion_organizationId_effectiveFromDate_idx" ON "AnnouncementSeriesVersion"("organizationId", "effectiveFromDate");
CREATE INDEX "AnnouncementSeriesVersion_seriesId_validFromDate_validToDate_idx" ON "AnnouncementSeriesVersion"("seriesId", "validFromDate", "validToDate");
CREATE UNIQUE INDEX "AnnouncementOccurrence_announcementId_key" ON "AnnouncementOccurrence"("announcementId");
CREATE UNIQUE INDEX "AnnouncementOccurrence_idempotencyKey_key" ON "AnnouncementOccurrence"("idempotencyKey");
CREATE UNIQUE INDEX "AnnouncementOccurrence_seriesId_versionId_localDate_key" ON "AnnouncementOccurrence"("seriesId", "versionId", "localDate");
CREATE INDEX "AnnouncementOccurrence_organizationId_status_scheduledFor_idx" ON "AnnouncementOccurrence"("organizationId", "status", "scheduledFor");
CREATE INDEX "AnnouncementOccurrence_seriesId_localDate_idx" ON "AnnouncementOccurrence"("seriesId", "localDate");
CREATE INDEX "AnnouncementOccurrence_versionId_localDate_idx" ON "AnnouncementOccurrence"("versionId", "localDate");

CREATE TRIGGER "AnnouncementSeriesVersion_immutable_update"
BEFORE UPDATE ON "AnnouncementSeriesVersion"
BEGIN
  SELECT RAISE(ABORT, 'AnnouncementSeriesVersion is immutable');
END;

CREATE TRIGGER "AnnouncementSeriesVersion_immutable_delete"
BEFORE DELETE ON "AnnouncementSeriesVersion"
BEGIN
  SELECT RAISE(ABORT, 'AnnouncementSeriesVersion is immutable');
END;
