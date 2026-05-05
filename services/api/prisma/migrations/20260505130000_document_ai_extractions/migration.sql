CREATE TABLE "DocumentAiExtraction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT,
    "status" TEXT NOT NULL,
    "resultJson" TEXT,
    "errorMessage" TEXT,
    "appliedAt" DATETIME,
    "appliedById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DocumentAiExtraction_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "DocumentAiExtraction_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "DocumentAiExtraction_appliedById_fkey" FOREIGN KEY ("appliedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "DocumentAiExtraction_organizationId_idx" ON "DocumentAiExtraction"("organizationId");
CREATE INDEX "DocumentAiExtraction_documentId_idx" ON "DocumentAiExtraction"("documentId");
CREATE INDEX "DocumentAiExtraction_status_idx" ON "DocumentAiExtraction"("status");
CREATE INDEX "DocumentAiExtraction_appliedById_idx" ON "DocumentAiExtraction"("appliedById");
