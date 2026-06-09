CREATE TABLE "InAppNotification" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "recipientId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT,
  "entityType" TEXT,
  "entityId" TEXT,
  "href" TEXT,
  "dedupeKey" TEXT,
  "readAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InAppNotification_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "InAppNotification_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "InAppNotification_organizationId_recipientId_dedupeKey_key" ON "InAppNotification"("organizationId", "recipientId", "dedupeKey");
CREATE INDEX "InAppNotification_organizationId_idx" ON "InAppNotification"("organizationId");
CREATE INDEX "InAppNotification_recipientId_idx" ON "InAppNotification"("recipientId");
CREATE INDEX "InAppNotification_readAt_idx" ON "InAppNotification"("readAt");
CREATE INDEX "InAppNotification_type_idx" ON "InAppNotification"("type");
CREATE INDEX "InAppNotification_entityType_entityId_idx" ON "InAppNotification"("entityType", "entityId");
