-- CreateTable
CREATE TABLE "OperationalAttachment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "archivedById" TEXT,
    "surface" TEXT NOT NULL,
    "entityId" TEXT,
    "fileKey" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "archivedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OperationalAttachment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "OperationalAttachment_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "OperationalAttachment_archivedById_fkey" FOREIGN KEY ("archivedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "OperationalAttachment_organizationId_idx" ON "OperationalAttachment"("organizationId");

-- CreateIndex
CREATE INDEX "OperationalAttachment_uploadedById_idx" ON "OperationalAttachment"("uploadedById");

-- CreateIndex
CREATE INDEX "OperationalAttachment_surface_idx" ON "OperationalAttachment"("surface");

-- CreateIndex
CREATE INDEX "OperationalAttachment_entityId_idx" ON "OperationalAttachment"("entityId");

-- CreateIndex
CREATE INDEX "OperationalAttachment_archivedAt_idx" ON "OperationalAttachment"("archivedAt");
