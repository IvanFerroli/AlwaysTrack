CREATE TABLE "PersonalScript" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "ownerId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "channel" TEXT NOT NULL DEFAULT 'WHATSAPP',
  "body" TEXT NOT NULL,
  "tagsJson" TEXT,
  "placeholdersJson" TEXT,
  "suggestionId" TEXT,
  "suggestedAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "PersonalScript_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "PersonalScript_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "PersonalScript_suggestionId_fkey" FOREIGN KEY ("suggestionId") REFERENCES "OperationalScriptSuggestion" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "PersonalScriptFlow" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "personalScriptId" TEXT NOT NULL,
  "flowId" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PersonalScriptFlow_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "PersonalScriptFlow_personalScriptId_fkey" FOREIGN KEY ("personalScriptId") REFERENCES "PersonalScript" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "PersonalScriptFlow_flowId_fkey" FOREIGN KEY ("flowId") REFERENCES "ServiceFlow" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "PersonalScript_organizationId_ownerId_title_key" ON "PersonalScript"("organizationId", "ownerId", "title");
CREATE INDEX "PersonalScript_organizationId_idx" ON "PersonalScript"("organizationId");
CREATE INDEX "PersonalScript_ownerId_idx" ON "PersonalScript"("ownerId");
CREATE INDEX "PersonalScript_suggestionId_idx" ON "PersonalScript"("suggestionId");
CREATE INDEX "PersonalScript_channel_idx" ON "PersonalScript"("channel");
CREATE INDEX "PersonalScript_updatedAt_idx" ON "PersonalScript"("updatedAt");
CREATE UNIQUE INDEX "PersonalScriptFlow_personalScriptId_flowId_key" ON "PersonalScriptFlow"("personalScriptId", "flowId");
CREATE INDEX "PersonalScriptFlow_organizationId_idx" ON "PersonalScriptFlow"("organizationId");
CREATE INDEX "PersonalScriptFlow_flowId_idx" ON "PersonalScriptFlow"("flowId");
