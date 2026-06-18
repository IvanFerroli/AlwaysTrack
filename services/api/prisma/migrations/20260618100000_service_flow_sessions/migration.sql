CREATE TABLE "ServiceFlowSession" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "flowId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "ServiceFlowSession_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "ServiceFlowSession_flowId_fkey" FOREIGN KEY ("flowId") REFERENCES "ServiceFlow" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "ServiceFlowSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "ServiceFlowSessionStep" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "stepId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "decision" TEXT,
  "note" TEXT,
  "completedAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "ServiceFlowSessionStep_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "ServiceFlowSessionStep_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ServiceFlowSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ServiceFlowSessionStep_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "ServiceFlowStep" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "ServiceFlowSession_organizationId_idx" ON "ServiceFlowSession"("organizationId");
CREATE INDEX "ServiceFlowSession_flowId_idx" ON "ServiceFlowSession"("flowId");
CREATE INDEX "ServiceFlowSession_userId_idx" ON "ServiceFlowSession"("userId");
CREATE INDEX "ServiceFlowSession_status_idx" ON "ServiceFlowSession"("status");
CREATE INDEX "ServiceFlowSession_startedAt_idx" ON "ServiceFlowSession"("startedAt");
CREATE UNIQUE INDEX "ServiceFlowSessionStep_sessionId_stepId_key" ON "ServiceFlowSessionStep"("sessionId", "stepId");
CREATE INDEX "ServiceFlowSessionStep_organizationId_idx" ON "ServiceFlowSessionStep"("organizationId");
CREATE INDEX "ServiceFlowSessionStep_stepId_idx" ON "ServiceFlowSessionStep"("stepId");
CREATE INDEX "ServiceFlowSessionStep_status_idx" ON "ServiceFlowSessionStep"("status");
