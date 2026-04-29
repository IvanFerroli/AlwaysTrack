-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_NotificationJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "licenseId" TEXT NOT NULL,
    "notificationRuleId" TEXT,
    "periodKey" TEXT NOT NULL,
    "dedupeKey" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "recipientPhone" TEXT,
    "recipientEmail" TEXT,
    "templateKey" TEXT NOT NULL,
    "payloadJson" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "scheduledFor" DATETIME NOT NULL,
    "processingAt" DATETIME,
    "sentAt" DATETIME,
    "deliveredAt" DATETIME,
    "readAt" DATETIME,
    "failedAt" DATETIME,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "nextRetryAt" DATETIME,
    "errorMessage" TEXT,
    "provider" TEXT,
    "providerMessageId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "NotificationJob_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "NotificationJob_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "NotificationJob_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "License" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "NotificationJob_notificationRuleId_fkey" FOREIGN KEY ("notificationRuleId") REFERENCES "NotificationRule" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_NotificationJob" ("attempts", "channel", "createdAt", "dedupeKey", "deliveredAt", "errorMessage", "failedAt", "id", "licenseId", "maxAttempts", "nextRetryAt", "organizationId", "payloadJson", "periodKey", "processingAt", "professionalId", "provider", "providerMessageId", "readAt", "recipientEmail", "recipientPhone", "scheduledFor", "sentAt", "status", "templateKey", "updatedAt")
SELECT
    "attempts",
    "channel",
    "createdAt",
    "licenseId" || ':' || "templateKey" || ':' || strftime('%Y-%m-%d', "scheduledFor") || ':' || "id",
    "deliveredAt",
    "errorMessage",
    "failedAt",
    "id",
    "licenseId",
    "maxAttempts",
    "nextRetryAt",
    "organizationId",
    "payloadJson",
    strftime('%Y-%m-%d', "scheduledFor"),
    "processingAt",
    "professionalId",
    "provider",
    "providerMessageId",
    "readAt",
    "recipientEmail",
    "recipientPhone",
    "scheduledFor",
    "sentAt",
    "status",
    "templateKey",
    "updatedAt"
FROM "NotificationJob";
DROP TABLE "NotificationJob";
ALTER TABLE "new_NotificationJob" RENAME TO "NotificationJob";
CREATE UNIQUE INDEX "NotificationJob_dedupeKey_key" ON "NotificationJob"("dedupeKey");
CREATE INDEX "NotificationJob_organizationId_idx" ON "NotificationJob"("organizationId");
CREATE INDEX "NotificationJob_professionalId_idx" ON "NotificationJob"("professionalId");
CREATE INDEX "NotificationJob_licenseId_idx" ON "NotificationJob"("licenseId");
CREATE INDEX "NotificationJob_notificationRuleId_idx" ON "NotificationJob"("notificationRuleId");
CREATE INDEX "NotificationJob_periodKey_idx" ON "NotificationJob"("periodKey");
CREATE INDEX "NotificationJob_status_idx" ON "NotificationJob"("status");
CREATE INDEX "NotificationJob_scheduledFor_idx" ON "NotificationJob"("scheduledFor");
CREATE INDEX "NotificationJob_providerMessageId_idx" ON "NotificationJob"("providerMessageId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "License_professionalId_licenseTypeId_number_key" ON "License"("professionalId", "licenseTypeId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "LicenseType_organizationId_name_key" ON "LicenseType"("organizationId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Professional_organizationId_cpf_key" ON "Professional"("organizationId", "cpf");

-- CreateIndex
CREATE UNIQUE INDEX "Sector_unitId_name_key" ON "Sector"("unitId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Unit_organizationId_name_key" ON "Unit"("organizationId", "name");
