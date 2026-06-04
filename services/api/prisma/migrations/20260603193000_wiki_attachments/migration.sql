CREATE TABLE "WikiAttachment" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "uploadedById" TEXT NOT NULL,
  "pageId" TEXT,
  "requestId" TEXT,
  "fileKey" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "size" INTEGER NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WikiAttachment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "WikiAttachment_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "WikiAttachment_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "WikiPage" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "WikiAttachment_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "WikiEditRequest" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "WikiAttachment_organizationId_idx" ON "WikiAttachment"("organizationId");
CREATE INDEX "WikiAttachment_uploadedById_idx" ON "WikiAttachment"("uploadedById");
CREATE INDEX "WikiAttachment_pageId_idx" ON "WikiAttachment"("pageId");
CREATE INDEX "WikiAttachment_requestId_idx" ON "WikiAttachment"("requestId");
