CREATE TABLE "ServiceCase" (
  "id" TEXT NOT NULL PRIMARY KEY, "organizationId" TEXT NOT NULL, "createdByUserId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'NEW', "primarySourceId" TEXT, "summary" TEXT,
  "completedAt" DATETIME, "cancelledAt" DATETIME, "failedAt" DATETIME, "failureReason" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "ServiceCase_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "ServiceCase_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "ServiceCase_primarySourceId_fkey" FOREIGN KEY ("primarySourceId") REFERENCES "ServiceCaseSource" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE "ServiceCaseSource" (
  "id" TEXT NOT NULL PRIMARY KEY, "organizationId" TEXT NOT NULL, "caseId" TEXT NOT NULL, "kind" TEXT NOT NULL,
  "sourceReference" TEXT NOT NULL, "sourceUrl" TEXT, "observedAt" DATETIME NOT NULL, "metadataJson" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ServiceCaseSource_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "ServiceCaseSource_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "ServiceCase" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE "CompanionInstallation" (
  "id" TEXT NOT NULL PRIMARY KEY, "organizationId" TEXT NOT NULL, "userId" TEXT NOT NULL,
  "browserProfileId" TEXT NOT NULL, "extensionInstanceId" TEXT NOT NULL, "credentialHash" TEXT NOT NULL,
  "credentialExpiresAt" DATETIME, "status" TEXT NOT NULL DEFAULT 'ACTIVE', "pairedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastSeenAt" DATETIME, "revokedAt" DATETIME, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "CompanionInstallation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "CompanionInstallation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE "ConnectorDefinition" (
  "id" TEXT NOT NULL PRIMARY KEY, "organizationId" TEXT NOT NULL, "connectorId" TEXT NOT NULL, "displayName" TEXT NOT NULL,
  "version" TEXT NOT NULL, "selectorVersion" TEXT, "riskLevel" TEXT NOT NULL, "domainsJson" TEXT NOT NULL,
  "capabilitiesJson" TEXT NOT NULL, "forbiddenActionsJson" TEXT NOT NULL, "searchKeysJson" TEXT NOT NULL,
  "extractedFieldsJson" TEXT NOT NULL, "enabled" BOOLEAN NOT NULL DEFAULT true, "lastValidatedAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "ConnectorDefinition_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE "ConnectorRun" (
  "id" TEXT NOT NULL PRIMARY KEY, "organizationId" TEXT NOT NULL, "caseId" TEXT NOT NULL,
  "connectorDefinitionId" TEXT NOT NULL, "installationId" TEXT NOT NULL, "userId" TEXT NOT NULL,
  "browserProfileId" TEXT NOT NULL, "status" TEXT NOT NULL DEFAULT 'QUEUED', "wave" INTEGER,
  "warningsJson" TEXT, "diagnosticsJson" TEXT, "interventionCode" TEXT, "failureMessage" TEXT,
  "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "finishedAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "ConnectorRun_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "ConnectorRun_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "ServiceCase" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "ConnectorRun_connectorDefinitionId_fkey" FOREIGN KEY ("connectorDefinitionId") REFERENCES "ConnectorDefinition" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "ConnectorRun_installationId_fkey" FOREIGN KEY ("installationId") REFERENCES "CompanionInstallation" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "ConnectorRun_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE "EvidenceFact" (
  "id" TEXT NOT NULL PRIMARY KEY, "organizationId" TEXT NOT NULL, "caseId" TEXT NOT NULL, "connectorRunId" TEXT,
  "key" TEXT NOT NULL, "valueJson" TEXT NOT NULL, "normalizedValueJson" TEXT NOT NULL, "sourceSystem" TEXT NOT NULL,
  "sourceReference" TEXT, "observedAt" DATETIME NOT NULL, "collectedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "confidence" REAL NOT NULL, "freshness" TEXT NOT NULL, "sensitivity" TEXT NOT NULL, "acquisition" TEXT NOT NULL,
  "ruleId" TEXT, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EvidenceFact_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "EvidenceFact_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "ServiceCase" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "EvidenceFact_connectorRunId_fkey" FOREIGN KEY ("connectorRunId") REFERENCES "ConnectorRun" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE "EvidenceConflict" (
  "id" TEXT NOT NULL PRIMARY KEY, "organizationId" TEXT NOT NULL, "caseId" TEXT NOT NULL, "key" TEXT NOT NULL,
  "factIdsJson" TEXT NOT NULL, "status" TEXT NOT NULL DEFAULT 'OPEN', "chosenFactId" TEXT,
  "resolutionReason" TEXT, "resolvedByKind" TEXT, "resolvedByUserId" TEXT, "resolvedAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "EvidenceConflict_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "EvidenceConflict_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "ServiceCase" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "EvidenceConflict_chosenFactId_fkey" FOREIGN KEY ("chosenFactId") REFERENCES "EvidenceFact" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "EvidenceConflict_resolvedByUserId_fkey" FOREIGN KEY ("resolvedByUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE "ConnectorHealthEvent" (
  "id" TEXT NOT NULL PRIMARY KEY, "organizationId" TEXT NOT NULL, "connectorDefinitionId" TEXT NOT NULL,
  "installationId" TEXT, "state" TEXT NOT NULL, "connectorVersion" TEXT NOT NULL, "selectorVersion" TEXT,
  "eventCode" TEXT, "diagnosticsJson" TEXT, "checkedAt" DATETIME NOT NULL, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ConnectorHealthEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "ConnectorHealthEvent_connectorDefinitionId_fkey" FOREIGN KEY ("connectorDefinitionId") REFERENCES "ConnectorDefinition" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "ConnectorHealthEvent_installationId_fkey" FOREIGN KEY ("installationId") REFERENCES "CompanionInstallation" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "ServiceCase_primarySourceId_key" ON "ServiceCase"("primarySourceId");
CREATE INDEX "ServiceCase_organizationId_status_idx" ON "ServiceCase"("organizationId", "status");
CREATE INDEX "ServiceCase_organizationId_createdByUserId_createdAt_idx" ON "ServiceCase"("organizationId", "createdByUserId", "createdAt");
CREATE INDEX "ServiceCase_createdByUserId_idx" ON "ServiceCase"("createdByUserId");
CREATE INDEX "ServiceCase_updatedAt_idx" ON "ServiceCase"("updatedAt");
CREATE UNIQUE INDEX "ServiceCaseSource_caseId_kind_sourceReference_key" ON "ServiceCaseSource"("caseId", "kind", "sourceReference");
CREATE INDEX "ServiceCaseSource_organizationId_observedAt_idx" ON "ServiceCaseSource"("organizationId", "observedAt");
CREATE INDEX "ServiceCaseSource_caseId_observedAt_idx" ON "ServiceCaseSource"("caseId", "observedAt");
CREATE UNIQUE INDEX "CompanionInstallation_organizationId_browserProfileId_key" ON "CompanionInstallation"("organizationId", "browserProfileId");
CREATE UNIQUE INDEX "CompanionInstallation_extensionInstanceId_key" ON "CompanionInstallation"("extensionInstanceId");
CREATE INDEX "CompanionInstallation_organizationId_userId_status_idx" ON "CompanionInstallation"("organizationId", "userId", "status");
CREATE INDEX "CompanionInstallation_userId_idx" ON "CompanionInstallation"("userId");
CREATE INDEX "CompanionInstallation_credentialHash_idx" ON "CompanionInstallation"("credentialHash");
CREATE INDEX "CompanionInstallation_lastSeenAt_idx" ON "CompanionInstallation"("lastSeenAt");
CREATE UNIQUE INDEX "ConnectorDefinition_organizationId_connectorId_key" ON "ConnectorDefinition"("organizationId", "connectorId");
CREATE INDEX "ConnectorDefinition_organizationId_enabled_idx" ON "ConnectorDefinition"("organizationId", "enabled");
CREATE INDEX "ConnectorDefinition_connectorId_idx" ON "ConnectorDefinition"("connectorId");
CREATE INDEX "ConnectorDefinition_lastValidatedAt_idx" ON "ConnectorDefinition"("lastValidatedAt");
CREATE INDEX "ConnectorRun_organizationId_status_idx" ON "ConnectorRun"("organizationId", "status");
CREATE INDEX "ConnectorRun_caseId_startedAt_idx" ON "ConnectorRun"("caseId", "startedAt");
CREATE INDEX "ConnectorRun_connectorDefinitionId_startedAt_idx" ON "ConnectorRun"("connectorDefinitionId", "startedAt");
CREATE INDEX "ConnectorRun_installationId_startedAt_idx" ON "ConnectorRun"("installationId", "startedAt");
CREATE INDEX "ConnectorRun_userId_idx" ON "ConnectorRun"("userId");
CREATE INDEX "ConnectorRun_browserProfileId_idx" ON "ConnectorRun"("browserProfileId");
CREATE INDEX "EvidenceFact_organizationId_key_idx" ON "EvidenceFact"("organizationId", "key");
CREATE INDEX "EvidenceFact_caseId_key_observedAt_idx" ON "EvidenceFact"("caseId", "key", "observedAt");
CREATE INDEX "EvidenceFact_connectorRunId_idx" ON "EvidenceFact"("connectorRunId");
CREATE INDEX "EvidenceFact_sourceSystem_sourceReference_idx" ON "EvidenceFact"("sourceSystem", "sourceReference");
CREATE INDEX "EvidenceFact_sensitivity_idx" ON "EvidenceFact"("sensitivity");
CREATE INDEX "EvidenceConflict_organizationId_status_idx" ON "EvidenceConflict"("organizationId", "status");
CREATE INDEX "EvidenceConflict_caseId_key_status_idx" ON "EvidenceConflict"("caseId", "key", "status");
CREATE INDEX "EvidenceConflict_chosenFactId_idx" ON "EvidenceConflict"("chosenFactId");
CREATE INDEX "EvidenceConflict_resolvedByUserId_idx" ON "EvidenceConflict"("resolvedByUserId");
CREATE INDEX "ConnectorHealthEvent_organizationId_checkedAt_idx" ON "ConnectorHealthEvent"("organizationId", "checkedAt");
CREATE INDEX "ConnectorHealthEvent_connectorDefinitionId_checkedAt_idx" ON "ConnectorHealthEvent"("connectorDefinitionId", "checkedAt");
CREATE INDEX "ConnectorHealthEvent_installationId_checkedAt_idx" ON "ConnectorHealthEvent"("installationId", "checkedAt");
CREATE INDEX "ConnectorHealthEvent_state_checkedAt_idx" ON "ConnectorHealthEvent"("state", "checkedAt");
