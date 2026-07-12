ALTER TABLE "ServiceFlow" ADD COLUMN "draftGraphJson" TEXT;

CREATE TABLE "ServiceFlowVersion" (
  "id" TEXT NOT NULL PRIMARY KEY, "organizationId" TEXT NOT NULL, "flowId" TEXT NOT NULL, "version" INTEGER NOT NULL,
  "title" TEXT NOT NULL, "summary" TEXT, "content" TEXT, "tagsJson" TEXT, "graphJson" TEXT NOT NULL,
  "publishedById" TEXT NOT NULL, "publishedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "restoredFromId" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ServiceFlowVersion_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "ServiceFlowVersion_flowId_fkey" FOREIGN KEY ("flowId") REFERENCES "ServiceFlow" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "ServiceFlowVersion_publishedById_fkey" FOREIGN KEY ("publishedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "ServiceFlowVersion_restoredFromId_fkey" FOREIGN KEY ("restoredFromId") REFERENCES "ServiceFlowVersion" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE "ServiceFlowNode" (
  "id" TEXT NOT NULL PRIMARY KEY, "organizationId" TEXT NOT NULL, "versionId" TEXT NOT NULL, "key" TEXT NOT NULL,
  "type" TEXT NOT NULL, "title" TEXT NOT NULL, "operatorInstruction" TEXT, "requiredFactsJson" TEXT NOT NULL,
  "optionalFactsJson" TEXT NOT NULL, "scriptsJson" TEXT NOT NULL, "allowedCapabilitiesJson" TEXT NOT NULL,
  "forbiddenCapabilitiesJson" TEXT NOT NULL, "autoAdvance" BOOLEAN NOT NULL DEFAULT false, "riskLevel" TEXT NOT NULL DEFAULT 'LOW',
  "terminal" BOOLEAN NOT NULL DEFAULT false, "message" TEXT, "dependenciesJson" TEXT, "order" INTEGER NOT NULL DEFAULT 0,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ServiceFlowNode_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "ServiceFlowNode_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "ServiceFlowVersion" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE "ServiceFlowTransition" (
  "id" TEXT NOT NULL PRIMARY KEY, "organizationId" TEXT NOT NULL, "versionId" TEXT NOT NULL, "fromNodeId" TEXT NOT NULL,
  "toNodeId" TEXT NOT NULL, "label" TEXT NOT NULL, "order" INTEGER NOT NULL DEFAULT 0, "conditionJson" TEXT,
  "requiresUserChoice" BOOLEAN NOT NULL DEFAULT false, "allowLoop" BOOLEAN NOT NULL DEFAULT false, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ServiceFlowTransition_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "ServiceFlowTransition_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "ServiceFlowVersion" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "ServiceFlowTransition_fromNodeId_fkey" FOREIGN KEY ("fromNodeId") REFERENCES "ServiceFlowNode" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "ServiceFlowTransition_toNodeId_fkey" FOREIGN KEY ("toNodeId") REFERENCES "ServiceFlowNode" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

INSERT INTO "ServiceFlowVersion" ("id", "organizationId", "flowId", "version", "title", "summary", "content", "tagsJson", "graphJson", "publishedById", "publishedAt", "createdAt")
SELECT 'compat:' || "id" || ':' || "version", "organizationId", "id", "version", "title", "summary", "content", "tagsJson",
       '{"compatibility":"linear"}', "updatedById", COALESCE("publishedAt", "updatedAt"), "createdAt" FROM "ServiceFlow";
INSERT INTO "ServiceFlowNode" ("id", "organizationId", "versionId", "key", "type", "title", "requiredFactsJson", "optionalFactsJson", "scriptsJson", "allowedCapabilitiesJson", "forbiddenCapabilitiesJson", "autoAdvance", "riskLevel", "terminal", "order")
SELECT 'compat:' || f."id" || ':' || f."version" || ':start', f."organizationId", 'compat:' || f."id" || ':' || f."version", 'start', 'START', 'Inicio', '[]', '[]', '[]', '[]', '[]', true, 'LOW', false, 0 FROM "ServiceFlow" f;
INSERT INTO "ServiceFlowNode" ("id", "organizationId", "versionId", "key", "type", "title", "operatorInstruction", "requiredFactsJson", "optionalFactsJson", "scriptsJson", "allowedCapabilitiesJson", "forbiddenCapabilitiesJson", "autoAdvance", "riskLevel", "terminal", "order")
SELECT 'compat:' || f."id" || ':' || f."version" || ':step:' || s."id", f."organizationId", 'compat:' || f."id" || ':' || f."version", 'step:' || s."id",
       CASE WHEN s."kind" IN ('DECISION','YES_NO') THEN 'DECISION' ELSE 'CHECK' END, s."title", s."body", '[]', '[]', '[]', '[]', '[]', false, 'LOW', false, s."order"
FROM "ServiceFlow" f JOIN "ServiceFlowStep" s ON s."flowId" = f."id";
INSERT INTO "ServiceFlowNode" ("id", "organizationId", "versionId", "key", "type", "title", "requiredFactsJson", "optionalFactsJson", "scriptsJson", "allowedCapabilitiesJson", "forbiddenCapabilitiesJson", "autoAdvance", "riskLevel", "terminal", "order")
SELECT 'compat:' || f."id" || ':' || f."version" || ':end', f."organizationId", 'compat:' || f."id" || ':' || f."version", 'end', 'END', 'Fim', '[]', '[]', '[]', '[]', '[]', false, 'LOW', true,
       COALESCE((SELECT MAX(s."order") + 1 FROM "ServiceFlowStep" s WHERE s."flowId" = f."id"), 1) FROM "ServiceFlow" f;
INSERT INTO "ServiceFlowTransition" ("id", "organizationId", "versionId", "fromNodeId", "toNodeId", "label", "order", "requiresUserChoice")
SELECT 'compat-edge:' || f."id" || ':start', f."organizationId", 'compat:' || f."id" || ':' || f."version",
       'compat:' || f."id" || ':' || f."version" || ':start',
       COALESCE((SELECT 'compat:' || f."id" || ':' || f."version" || ':step:' || s."id" FROM "ServiceFlowStep" s WHERE s."flowId"=f."id" ORDER BY s."order", s."createdAt" LIMIT 1), 'compat:' || f."id" || ':' || f."version" || ':end'),
       'Continuar', 0, false FROM "ServiceFlow" f;
INSERT INTO "ServiceFlowTransition" ("id", "organizationId", "versionId", "fromNodeId", "toNodeId", "label", "order", "requiresUserChoice")
SELECT 'compat-edge:' || s."id", f."organizationId", 'compat:' || f."id" || ':' || f."version",
       'compat:' || f."id" || ':' || f."version" || ':step:' || s."id",
       COALESCE((SELECT 'compat:' || f."id" || ':' || f."version" || ':step:' || n."id" FROM "ServiceFlowStep" n WHERE n."flowId"=f."id" AND (n."order">s."order" OR (n."order"=s."order" AND n."createdAt">s."createdAt")) ORDER BY n."order", n."createdAt" LIMIT 1), 'compat:' || f."id" || ':' || f."version" || ':end'),
       'Continuar', s."order", CASE WHEN s."kind" IN ('DECISION','YES_NO') THEN true ELSE false END
FROM "ServiceFlow" f JOIN "ServiceFlowStep" s ON s."flowId"=f."id";

PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ServiceFlowSession" (
  "id" TEXT NOT NULL PRIMARY KEY, "organizationId" TEXT NOT NULL, "flowId" TEXT NOT NULL, "versionId" TEXT, "userId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'OPEN', "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "completedAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "ServiceFlowSession_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "ServiceFlowSession_flowId_fkey" FOREIGN KEY ("flowId") REFERENCES "ServiceFlow" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "ServiceFlowSession_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "ServiceFlowVersion" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "ServiceFlowSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ServiceFlowSession" SELECT s."id", s."organizationId", s."flowId", 'compat:' || f."id" || ':' || f."version", s."userId", s."status", s."startedAt", s."completedAt", s."createdAt", s."updatedAt" FROM "ServiceFlowSession" s JOIN "ServiceFlow" f ON f."id"=s."flowId";
DROP TABLE "ServiceFlowSession";
ALTER TABLE "new_ServiceFlowSession" RENAME TO "ServiceFlowSession";

CREATE TABLE "new_ServiceFlowSessionStep" (
  "id" TEXT NOT NULL PRIMARY KEY, "organizationId" TEXT NOT NULL, "sessionId" TEXT NOT NULL, "stepId" TEXT, "nodeKey" TEXT,
  "nodeSnapshotJson" TEXT, "choiceHistoryJson" TEXT, "visitOrder" INTEGER NOT NULL DEFAULT 0, "status" TEXT NOT NULL DEFAULT 'PENDING',
  "decision" TEXT, "note" TEXT, "completedAt" DATETIME, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "ServiceFlowSessionStep_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "ServiceFlowSessionStep_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ServiceFlowSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ServiceFlowSessionStep_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "ServiceFlowStep" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ServiceFlowSessionStep" ("id","organizationId","sessionId","stepId","nodeKey","nodeSnapshotJson","visitOrder","status","decision","note","completedAt","createdAt","updatedAt")
SELECT ss."id",ss."organizationId",ss."sessionId",ss."stepId",'step:' || ss."stepId",json_object('key','step:' || ss."stepId",'title',s."title",'order',s."order",'required',s."required"),s."order",ss."status",ss."decision",ss."note",ss."completedAt",ss."createdAt",ss."updatedAt"
FROM "ServiceFlowSessionStep" ss JOIN "ServiceFlowStep" s ON s."id"=ss."stepId";
DROP TABLE "ServiceFlowSessionStep";
ALTER TABLE "new_ServiceFlowSessionStep" RENAME TO "ServiceFlowSessionStep";
PRAGMA foreign_keys=ON;

CREATE UNIQUE INDEX "ServiceFlowVersion_flowId_version_key" ON "ServiceFlowVersion"("flowId","version");
CREATE INDEX "ServiceFlowVersion_organizationId_publishedAt_idx" ON "ServiceFlowVersion"("organizationId","publishedAt");
CREATE INDEX "ServiceFlowVersion_publishedById_idx" ON "ServiceFlowVersion"("publishedById");
CREATE INDEX "ServiceFlowVersion_restoredFromId_idx" ON "ServiceFlowVersion"("restoredFromId");
CREATE UNIQUE INDEX "ServiceFlowNode_versionId_key_key" ON "ServiceFlowNode"("versionId","key");
CREATE INDEX "ServiceFlowNode_organizationId_idx" ON "ServiceFlowNode"("organizationId");
CREATE INDEX "ServiceFlowNode_versionId_order_idx" ON "ServiceFlowNode"("versionId","order");
CREATE UNIQUE INDEX "ServiceFlowTransition_versionId_fromNodeId_toNodeId_label_key" ON "ServiceFlowTransition"("versionId","fromNodeId","toNodeId","label");
CREATE INDEX "ServiceFlowTransition_organizationId_idx" ON "ServiceFlowTransition"("organizationId");
CREATE INDEX "ServiceFlowTransition_versionId_order_idx" ON "ServiceFlowTransition"("versionId","order");
CREATE INDEX "ServiceFlowTransition_fromNodeId_idx" ON "ServiceFlowTransition"("fromNodeId");
CREATE INDEX "ServiceFlowTransition_toNodeId_idx" ON "ServiceFlowTransition"("toNodeId");
CREATE INDEX "ServiceFlowSession_organizationId_idx" ON "ServiceFlowSession"("organizationId");
CREATE INDEX "ServiceFlowSession_flowId_idx" ON "ServiceFlowSession"("flowId");
CREATE INDEX "ServiceFlowSession_versionId_idx" ON "ServiceFlowSession"("versionId");
CREATE INDEX "ServiceFlowSession_userId_idx" ON "ServiceFlowSession"("userId");
CREATE INDEX "ServiceFlowSession_status_idx" ON "ServiceFlowSession"("status");
CREATE INDEX "ServiceFlowSession_startedAt_idx" ON "ServiceFlowSession"("startedAt");
CREATE UNIQUE INDEX "ServiceFlowSessionStep_sessionId_nodeKey_key" ON "ServiceFlowSessionStep"("sessionId","nodeKey");
CREATE INDEX "ServiceFlowSessionStep_organizationId_idx" ON "ServiceFlowSessionStep"("organizationId");
CREATE INDEX "ServiceFlowSessionStep_stepId_idx" ON "ServiceFlowSessionStep"("stepId");
CREATE INDEX "ServiceFlowSessionStep_status_idx" ON "ServiceFlowSessionStep"("status");
