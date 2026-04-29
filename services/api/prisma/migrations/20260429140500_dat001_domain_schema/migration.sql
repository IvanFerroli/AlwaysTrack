-- CreateTable
CREATE TABLE "Unit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Unit_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Sector" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "unitId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Sector_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Professional" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "sectorId" TEXT NOT NULL,
    "responsibleRtId" TEXT,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "cpf" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "position" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Professional_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Professional_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Professional_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "Sector" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Professional_responsibleRtId_fkey" FOREIGN KEY ("responsibleRtId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Professional_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LicenseType" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "defaultWarningDays" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LicenseType_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "License" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "professionalId" TEXT NOT NULL,
    "licenseTypeId" TEXT NOT NULL,
    "number" TEXT,
    "issuer" TEXT,
    "uf" TEXT,
    "issuedAt" DATETIME,
    "expiresAt" DATETIME,
    "status" TEXT NOT NULL,
    "lastValidatedAt" DATETIME,
    "validatedById" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "License_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "License_licenseTypeId_fkey" FOREIGN KEY ("licenseTypeId") REFERENCES "LicenseType" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "License_validatedById_fkey" FOREIGN KEY ("validatedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "professionalId" TEXT NOT NULL,
    "licenseId" TEXT NOT NULL,
    "fileKey" TEXT NOT NULL,
    "fileUrl" TEXT,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "uploadedByUserId" TEXT,
    "uploadTokenId" TEXT,
    "validatedById" TEXT,
    "validatedAt" DATETIME,
    "rejectionReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Document_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Document_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "License" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Document_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Document_uploadTokenId_fkey" FOREIGN KEY ("uploadTokenId") REFERENCES "UploadToken" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Document_validatedById_fkey" FOREIGN KEY ("validatedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UploadToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "professionalId" TEXT NOT NULL,
    "licenseId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "usedAt" DATETIME,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UploadToken_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UploadToken_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "License" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NotificationTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "metaTemplateName" TEXT,
    "language" TEXT NOT NULL,
    "bodyPreview" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "NotificationTemplate_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NotificationRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "licenseTypeId" TEXT,
    "daysBeforeExpiration" INTEGER,
    "repeatAfterExpiredDays" INTEGER,
    "channel" TEXT NOT NULL,
    "templateKey" TEXT NOT NULL,
    "notifyProfessional" BOOLEAN NOT NULL DEFAULT true,
    "notifyRt" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "NotificationRule_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "NotificationRule_licenseTypeId_fkey" FOREIGN KEY ("licenseTypeId") REFERENCES "LicenseType" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NotificationJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "licenseId" TEXT NOT NULL,
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
    CONSTRAINT "NotificationJob_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "License" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NotificationLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "notificationJobId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerMessageId" TEXT,
    "status" TEXT NOT NULL,
    "rawPayload" TEXT,
    "rawResponse" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NotificationLog_notificationJobId_fkey" FOREIGN KEY ("notificationJobId") REFERENCES "NotificationJob" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FaqItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FaqItem_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Unit_organizationId_idx" ON "Unit"("organizationId");

-- CreateIndex
CREATE INDEX "Unit_active_idx" ON "Unit"("active");

-- CreateIndex
CREATE INDEX "Sector_unitId_idx" ON "Sector"("unitId");

-- CreateIndex
CREATE INDEX "Sector_active_idx" ON "Sector"("active");

-- CreateIndex
CREATE UNIQUE INDEX "Professional_userId_key" ON "Professional"("userId");

-- CreateIndex
CREATE INDEX "Professional_organizationId_idx" ON "Professional"("organizationId");

-- CreateIndex
CREATE INDEX "Professional_unitId_idx" ON "Professional"("unitId");

-- CreateIndex
CREATE INDEX "Professional_sectorId_idx" ON "Professional"("sectorId");

-- CreateIndex
CREATE INDEX "Professional_responsibleRtId_idx" ON "Professional"("responsibleRtId");

-- CreateIndex
CREATE INDEX "Professional_active_idx" ON "Professional"("active");

-- CreateIndex
CREATE INDEX "LicenseType_organizationId_idx" ON "LicenseType"("organizationId");

-- CreateIndex
CREATE INDEX "LicenseType_active_idx" ON "LicenseType"("active");

-- CreateIndex
CREATE INDEX "License_professionalId_idx" ON "License"("professionalId");

-- CreateIndex
CREATE INDEX "License_licenseTypeId_idx" ON "License"("licenseTypeId");

-- CreateIndex
CREATE INDEX "License_status_idx" ON "License"("status");

-- CreateIndex
CREATE INDEX "License_expiresAt_idx" ON "License"("expiresAt");

-- CreateIndex
CREATE INDEX "License_validatedById_idx" ON "License"("validatedById");

-- CreateIndex
CREATE INDEX "Document_professionalId_idx" ON "Document"("professionalId");

-- CreateIndex
CREATE INDEX "Document_licenseId_idx" ON "Document"("licenseId");

-- CreateIndex
CREATE INDEX "Document_status_idx" ON "Document"("status");

-- CreateIndex
CREATE INDEX "Document_uploadedByUserId_idx" ON "Document"("uploadedByUserId");

-- CreateIndex
CREATE INDEX "Document_uploadTokenId_idx" ON "Document"("uploadTokenId");

-- CreateIndex
CREATE INDEX "Document_validatedById_idx" ON "Document"("validatedById");

-- CreateIndex
CREATE UNIQUE INDEX "UploadToken_tokenHash_key" ON "UploadToken"("tokenHash");

-- CreateIndex
CREATE INDEX "UploadToken_professionalId_idx" ON "UploadToken"("professionalId");

-- CreateIndex
CREATE INDEX "UploadToken_licenseId_idx" ON "UploadToken"("licenseId");

-- CreateIndex
CREATE INDEX "UploadToken_active_idx" ON "UploadToken"("active");

-- CreateIndex
CREATE INDEX "UploadToken_expiresAt_idx" ON "UploadToken"("expiresAt");

-- CreateIndex
CREATE INDEX "NotificationTemplate_organizationId_idx" ON "NotificationTemplate"("organizationId");

-- CreateIndex
CREATE INDEX "NotificationTemplate_channel_idx" ON "NotificationTemplate"("channel");

-- CreateIndex
CREATE INDEX "NotificationTemplate_active_idx" ON "NotificationTemplate"("active");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationTemplate_organizationId_key_key" ON "NotificationTemplate"("organizationId", "key");

-- CreateIndex
CREATE INDEX "NotificationRule_organizationId_idx" ON "NotificationRule"("organizationId");

-- CreateIndex
CREATE INDEX "NotificationRule_licenseTypeId_idx" ON "NotificationRule"("licenseTypeId");

-- CreateIndex
CREATE INDEX "NotificationRule_channel_idx" ON "NotificationRule"("channel");

-- CreateIndex
CREATE INDEX "NotificationRule_active_idx" ON "NotificationRule"("active");

-- CreateIndex
CREATE INDEX "NotificationJob_organizationId_idx" ON "NotificationJob"("organizationId");

-- CreateIndex
CREATE INDEX "NotificationJob_professionalId_idx" ON "NotificationJob"("professionalId");

-- CreateIndex
CREATE INDEX "NotificationJob_licenseId_idx" ON "NotificationJob"("licenseId");

-- CreateIndex
CREATE INDEX "NotificationJob_status_idx" ON "NotificationJob"("status");

-- CreateIndex
CREATE INDEX "NotificationJob_scheduledFor_idx" ON "NotificationJob"("scheduledFor");

-- CreateIndex
CREATE INDEX "NotificationJob_providerMessageId_idx" ON "NotificationJob"("providerMessageId");

-- CreateIndex
CREATE INDEX "NotificationLog_notificationJobId_idx" ON "NotificationLog"("notificationJobId");

-- CreateIndex
CREATE INDEX "NotificationLog_providerMessageId_idx" ON "NotificationLog"("providerMessageId");

-- CreateIndex
CREATE INDEX "NotificationLog_status_idx" ON "NotificationLog"("status");

-- CreateIndex
CREATE INDEX "FaqItem_organizationId_idx" ON "FaqItem"("organizationId");

-- CreateIndex
CREATE INDEX "FaqItem_category_idx" ON "FaqItem"("category");

-- CreateIndex
CREATE INDEX "FaqItem_active_idx" ON "FaqItem"("active");

