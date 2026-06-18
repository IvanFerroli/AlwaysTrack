ALTER TABLE "ServiceFlow" ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "ServiceFlow" ADD COLUMN "reviewComment" TEXT;
ALTER TABLE "ServiceFlow" ADD COLUMN "reviewDueAt" DATETIME;
ALTER TABLE "ServiceFlow" ADD COLUMN "reviewedById" TEXT;
ALTER TABLE "ServiceFlow" ADD COLUMN "reviewedAt" DATETIME;

CREATE TABLE "ServiceFlowRevision" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "flowId" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "title" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "snapshotJson" TEXT NOT NULL,
  "comment" TEXT,
  "authorId" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ServiceFlowRevision_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "ServiceFlowRevision_flowId_fkey" FOREIGN KEY ("flowId") REFERENCES "ServiceFlow" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ServiceFlowRevision_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "ServiceFlowSearchEvent" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "flowId" TEXT,
  "userId" TEXT,
  "query" TEXT,
  "filtersJson" TEXT,
  "resultCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ServiceFlowSearchEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "ServiceFlowSearchEvent_flowId_fkey" FOREIGN KEY ("flowId") REFERENCES "ServiceFlow" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "ServiceFlowSearchEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "ServiceFlow_reviewedById_idx" ON "ServiceFlow"("reviewedById");
CREATE INDEX "ServiceFlow_reviewDueAt_idx" ON "ServiceFlow"("reviewDueAt");
CREATE UNIQUE INDEX "ServiceFlowRevision_flowId_version_key" ON "ServiceFlowRevision"("flowId", "version");
CREATE INDEX "ServiceFlowRevision_organizationId_idx" ON "ServiceFlowRevision"("organizationId");
CREATE INDEX "ServiceFlowRevision_flowId_idx" ON "ServiceFlowRevision"("flowId");
CREATE INDEX "ServiceFlowRevision_authorId_idx" ON "ServiceFlowRevision"("authorId");
CREATE INDEX "ServiceFlowRevision_createdAt_idx" ON "ServiceFlowRevision"("createdAt");
CREATE INDEX "ServiceFlowSearchEvent_organizationId_idx" ON "ServiceFlowSearchEvent"("organizationId");
CREATE INDEX "ServiceFlowSearchEvent_flowId_idx" ON "ServiceFlowSearchEvent"("flowId");
CREATE INDEX "ServiceFlowSearchEvent_userId_idx" ON "ServiceFlowSearchEvent"("userId");
CREATE INDEX "ServiceFlowSearchEvent_resultCount_idx" ON "ServiceFlowSearchEvent"("resultCount");
CREATE INDEX "ServiceFlowSearchEvent_createdAt_idx" ON "ServiceFlowSearchEvent"("createdAt");
