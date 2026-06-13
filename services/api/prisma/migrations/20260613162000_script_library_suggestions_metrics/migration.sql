-- CreateTable
CREATE TABLE "OperationalScriptSuggestion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "categoryId" TEXT,
    "scriptId" TEXT,
    "authorId" TEXT NOT NULL,
    "decidedById" TEXT,
    "title" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "tagsJson" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SUGGESTED',
    "suggestionType" TEXT NOT NULL DEFAULT 'NEW',
    "decisionComment" TEXT,
    "createdScriptId" TEXT,
    "decidedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "OperationalScriptSuggestion_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "OperationalScriptSuggestion_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ScriptCategory" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "OperationalScriptSuggestion_scriptId_fkey" FOREIGN KEY ("scriptId") REFERENCES "OperationalScript" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "OperationalScriptSuggestion_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "OperationalScriptSuggestion_decidedById_fkey" FOREIGN KEY ("decidedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OperationalScriptSearchEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "query" TEXT,
    "filtersJson" TEXT,
    "resultCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OperationalScriptSearchEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "OperationalScriptSearchEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "OperationalScriptSuggestion_organizationId_idx" ON "OperationalScriptSuggestion"("organizationId");

-- CreateIndex
CREATE INDEX "OperationalScriptSuggestion_categoryId_idx" ON "OperationalScriptSuggestion"("categoryId");

-- CreateIndex
CREATE INDEX "OperationalScriptSuggestion_scriptId_idx" ON "OperationalScriptSuggestion"("scriptId");

-- CreateIndex
CREATE INDEX "OperationalScriptSuggestion_authorId_idx" ON "OperationalScriptSuggestion"("authorId");

-- CreateIndex
CREATE INDEX "OperationalScriptSuggestion_decidedById_idx" ON "OperationalScriptSuggestion"("decidedById");

-- CreateIndex
CREATE INDEX "OperationalScriptSuggestion_status_idx" ON "OperationalScriptSuggestion"("status");

-- CreateIndex
CREATE INDEX "OperationalScriptSuggestion_suggestionType_idx" ON "OperationalScriptSuggestion"("suggestionType");

-- CreateIndex
CREATE INDEX "OperationalScriptSearchEvent_organizationId_idx" ON "OperationalScriptSearchEvent"("organizationId");

-- CreateIndex
CREATE INDEX "OperationalScriptSearchEvent_userId_idx" ON "OperationalScriptSearchEvent"("userId");

-- CreateIndex
CREATE INDEX "OperationalScriptSearchEvent_resultCount_idx" ON "OperationalScriptSearchEvent"("resultCount");

-- CreateIndex
CREATE INDEX "OperationalScriptSearchEvent_createdAt_idx" ON "OperationalScriptSearchEvent"("createdAt");
