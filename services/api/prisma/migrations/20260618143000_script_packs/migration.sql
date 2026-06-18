CREATE TABLE "ScriptPack" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "categoryId" TEXT,
    "wikiPageId" TEXT,
    "faqThreadId" TEXT,
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "tagsJson" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ScriptPack_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ScriptPack_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ScriptCategory" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ScriptPack_wikiPageId_fkey" FOREIGN KEY ("wikiPageId") REFERENCES "WikiPage" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ScriptPack_faqThreadId_fkey" FOREIGN KEY ("faqThreadId") REFERENCES "FaqThread" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ScriptPack_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ScriptPack_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "ScriptPackItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "packId" TEXT NOT NULL,
    "scriptId" TEXT NOT NULL,
    "label" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ScriptPackItem_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ScriptPackItem_packId_fkey" FOREIGN KEY ("packId") REFERENCES "ScriptPack" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ScriptPackItem_scriptId_fkey" FOREIGN KEY ("scriptId") REFERENCES "OperationalScript" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "ScriptPack_organizationId_slug_key" ON "ScriptPack"("organizationId", "slug");
CREATE INDEX "ScriptPack_organizationId_idx" ON "ScriptPack"("organizationId");
CREATE INDEX "ScriptPack_categoryId_idx" ON "ScriptPack"("categoryId");
CREATE INDEX "ScriptPack_wikiPageId_idx" ON "ScriptPack"("wikiPageId");
CREATE INDEX "ScriptPack_faqThreadId_idx" ON "ScriptPack"("faqThreadId");
CREATE INDEX "ScriptPack_status_idx" ON "ScriptPack"("status");
CREATE INDEX "ScriptPack_order_idx" ON "ScriptPack"("order");
CREATE UNIQUE INDEX "ScriptPackItem_packId_scriptId_key" ON "ScriptPackItem"("packId", "scriptId");
CREATE INDEX "ScriptPackItem_organizationId_idx" ON "ScriptPackItem"("organizationId");
CREATE INDEX "ScriptPackItem_packId_idx" ON "ScriptPackItem"("packId");
CREATE INDEX "ScriptPackItem_scriptId_idx" ON "ScriptPackItem"("scriptId");
CREATE INDEX "ScriptPackItem_order_idx" ON "ScriptPackItem"("order");
