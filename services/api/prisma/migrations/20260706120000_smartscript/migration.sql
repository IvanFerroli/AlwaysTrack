ALTER TABLE "PersonalScript" ADD COLUMN "smartScriptBatchId" TEXT;
ALTER TABLE "PersonalScript" ADD COLUMN "smartScriptState" TEXT;
ALTER TABLE "PersonalScript" ADD COLUMN "smartScriptTrigger" TEXT;
ALTER TABLE "PersonalScript" ADD COLUMN "smartScriptSource" TEXT;
ALTER TABLE "PersonalScript" ADD COLUMN "smartScriptSanitized" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "PersonalScript" ADD COLUMN "smartScriptSanitizationJson" TEXT;
ALTER TABLE "PersonalScript" ADD COLUMN "smartScriptOccurrenceCount" INTEGER;
ALTER TABLE "PersonalScript" ADD COLUMN "smartScriptUsageCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "PersonalScript" ADD COLUMN "smartScriptUsedAt" DATETIME;
ALTER TABLE "PersonalScript" ADD COLUMN "smartScriptApprovedAt" DATETIME;
ALTER TABLE "PersonalScript" ADD COLUMN "smartScriptRejectedAt" DATETIME;
ALTER TABLE "PersonalScript" ADD COLUMN "smartScriptExportedAt" DATETIME;

CREATE TABLE "SmartScriptBatch" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "ownerId" TEXT NOT NULL,
  "externalBatchId" TEXT,
  "processedAt" DATETIME,
  "candidateCount" INTEGER NOT NULL DEFAULT 0,
  "importedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "metadataJson" TEXT,
  CONSTRAINT "SmartScriptBatch_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "SmartScriptBatch_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "SmartScriptDecisionLog" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "ownerId" TEXT NOT NULL,
  "actorId" TEXT NOT NULL,
  "personalScriptId" TEXT,
  "batchId" TEXT,
  "action" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "metadataJson" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SmartScriptDecisionLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "SmartScriptDecisionLog_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "SmartScriptDecisionLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "SmartScriptDecisionLog_personalScriptId_fkey" FOREIGN KEY ("personalScriptId") REFERENCES "PersonalScript" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "SmartScriptDecisionLog_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "SmartScriptBatch" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "SmartScriptExport" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "ownerId" TEXT NOT NULL,
  "actorId" TEXT NOT NULL,
  "format" TEXT NOT NULL DEFAULT 'ESPANSO_YAML',
  "itemCount" INTEGER NOT NULL DEFAULT 0,
  "triggersJson" TEXT,
  "checksum" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SmartScriptExport_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "SmartScriptExport_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "SmartScriptExport_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "PersonalScript_organizationId_ownerId_smartScriptTrigger_key" ON "PersonalScript"("organizationId", "ownerId", "smartScriptTrigger");
CREATE INDEX "PersonalScript_smartScriptBatchId_idx" ON "PersonalScript"("smartScriptBatchId");
CREATE INDEX "PersonalScript_smartScriptState_idx" ON "PersonalScript"("smartScriptState");
CREATE INDEX "PersonalScript_smartScriptTrigger_idx" ON "PersonalScript"("smartScriptTrigger");
CREATE INDEX "PersonalScript_smartScriptUsageCount_idx" ON "PersonalScript"("smartScriptUsageCount");
CREATE UNIQUE INDEX "SmartScriptBatch_organizationId_ownerId_externalBatchId_key" ON "SmartScriptBatch"("organizationId", "ownerId", "externalBatchId");
CREATE INDEX "SmartScriptBatch_organizationId_idx" ON "SmartScriptBatch"("organizationId");
CREATE INDEX "SmartScriptBatch_ownerId_idx" ON "SmartScriptBatch"("ownerId");
CREATE INDEX "SmartScriptBatch_importedAt_idx" ON "SmartScriptBatch"("importedAt");
CREATE INDEX "SmartScriptDecisionLog_organizationId_idx" ON "SmartScriptDecisionLog"("organizationId");
CREATE INDEX "SmartScriptDecisionLog_ownerId_idx" ON "SmartScriptDecisionLog"("ownerId");
CREATE INDEX "SmartScriptDecisionLog_actorId_idx" ON "SmartScriptDecisionLog"("actorId");
CREATE INDEX "SmartScriptDecisionLog_personalScriptId_idx" ON "SmartScriptDecisionLog"("personalScriptId");
CREATE INDEX "SmartScriptDecisionLog_batchId_idx" ON "SmartScriptDecisionLog"("batchId");
CREATE INDEX "SmartScriptDecisionLog_action_idx" ON "SmartScriptDecisionLog"("action");
CREATE INDEX "SmartScriptDecisionLog_createdAt_idx" ON "SmartScriptDecisionLog"("createdAt");
CREATE INDEX "SmartScriptExport_organizationId_idx" ON "SmartScriptExport"("organizationId");
CREATE INDEX "SmartScriptExport_ownerId_idx" ON "SmartScriptExport"("ownerId");
CREATE INDEX "SmartScriptExport_actorId_idx" ON "SmartScriptExport"("actorId");
CREATE INDEX "SmartScriptExport_createdAt_idx" ON "SmartScriptExport"("createdAt");
