-- CreateTable
CREATE TABLE "ScriptCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ScriptCategory_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ScriptCategory_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OperationalScript" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "tagsJson" TEXT,
    "placeholdersJson" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT NOT NULL,
    "validatedById" TEXT,
    "validatedAt" DATETIME,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "copiedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "OperationalScript_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "OperationalScript_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ScriptCategory" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "OperationalScript_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "OperationalScript_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "OperationalScript_validatedById_fkey" FOREIGN KEY ("validatedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OperationalScriptRevision" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "scriptId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "tagsJson" TEXT,
    "placeholdersJson" TEXT,
    "status" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OperationalScriptRevision_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "OperationalScriptRevision_scriptId_fkey" FOREIGN KEY ("scriptId") REFERENCES "OperationalScript" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "OperationalScriptRevision_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OperationalScriptEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "scriptId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "metadataJson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OperationalScriptEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "OperationalScriptEvent_scriptId_fkey" FOREIGN KEY ("scriptId") REFERENCES "OperationalScript" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "OperationalScriptEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ScriptCategory_organizationId_slug_key" ON "ScriptCategory"("organizationId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "ScriptCategory_organizationId_name_key" ON "ScriptCategory"("organizationId", "name");

-- CreateIndex
CREATE INDEX "ScriptCategory_organizationId_idx" ON "ScriptCategory"("organizationId");

-- CreateIndex
CREATE INDEX "ScriptCategory_active_idx" ON "ScriptCategory"("active");

-- CreateIndex
CREATE INDEX "ScriptCategory_order_idx" ON "ScriptCategory"("order");

-- CreateIndex
CREATE UNIQUE INDEX "OperationalScript_organizationId_categoryId_title_key" ON "OperationalScript"("organizationId", "categoryId", "title");

-- CreateIndex
CREATE INDEX "OperationalScript_organizationId_idx" ON "OperationalScript"("organizationId");

-- CreateIndex
CREATE INDEX "OperationalScript_categoryId_idx" ON "OperationalScript"("categoryId");

-- CreateIndex
CREATE INDEX "OperationalScript_status_idx" ON "OperationalScript"("status");

-- CreateIndex
CREATE INDEX "OperationalScript_channel_idx" ON "OperationalScript"("channel");

-- CreateIndex
CREATE INDEX "OperationalScript_validatedById_idx" ON "OperationalScript"("validatedById");

-- CreateIndex
CREATE INDEX "OperationalScript_usageCount_idx" ON "OperationalScript"("usageCount");

-- CreateIndex
CREATE UNIQUE INDEX "OperationalScriptRevision_scriptId_version_key" ON "OperationalScriptRevision"("scriptId", "version");

-- CreateIndex
CREATE INDEX "OperationalScriptRevision_organizationId_idx" ON "OperationalScriptRevision"("organizationId");

-- CreateIndex
CREATE INDEX "OperationalScriptRevision_scriptId_idx" ON "OperationalScriptRevision"("scriptId");

-- CreateIndex
CREATE INDEX "OperationalScriptRevision_authorId_idx" ON "OperationalScriptRevision"("authorId");

-- CreateIndex
CREATE INDEX "OperationalScriptEvent_organizationId_idx" ON "OperationalScriptEvent"("organizationId");

-- CreateIndex
CREATE INDEX "OperationalScriptEvent_scriptId_idx" ON "OperationalScriptEvent"("scriptId");

-- CreateIndex
CREATE INDEX "OperationalScriptEvent_userId_idx" ON "OperationalScriptEvent"("userId");

-- CreateIndex
CREATE INDEX "OperationalScriptEvent_action_idx" ON "OperationalScriptEvent"("action");

-- CreateIndex
CREATE INDEX "OperationalScriptEvent_createdAt_idx" ON "OperationalScriptEvent"("createdAt");
