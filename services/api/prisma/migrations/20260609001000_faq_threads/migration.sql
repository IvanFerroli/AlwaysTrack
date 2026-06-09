-- CreateTable
CREATE TABLE "FaqThread" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "wikiPageId" TEXT,
    "promotedAt" DATETIME,
    "promotedById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FaqThread_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FaqThread_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FaqThread_wikiPageId_fkey" FOREIGN KEY ("wikiPageId") REFERENCES "WikiPage" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "FaqThread_promotedById_fkey" FOREIGN KEY ("promotedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FaqComment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FaqComment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FaqComment_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "FaqThread" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FaqComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FaqReaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "commentId" TEXT,
    "userId" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FaqReaction_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FaqReaction_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "FaqThread" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FaqReaction_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "FaqComment" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "FaqReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "FaqThread_organizationId_idx" ON "FaqThread"("organizationId");
CREATE INDEX "FaqThread_authorId_idx" ON "FaqThread"("authorId");
CREATE INDEX "FaqThread_status_idx" ON "FaqThread"("status");
CREATE INDEX "FaqThread_wikiPageId_idx" ON "FaqThread"("wikiPageId");
CREATE INDEX "FaqThread_promotedById_idx" ON "FaqThread"("promotedById");
CREATE INDEX "FaqThread_createdAt_idx" ON "FaqThread"("createdAt");

-- CreateIndex
CREATE INDEX "FaqComment_organizationId_idx" ON "FaqComment"("organizationId");
CREATE INDEX "FaqComment_threadId_idx" ON "FaqComment"("threadId");
CREATE INDEX "FaqComment_authorId_idx" ON "FaqComment"("authorId");
CREATE INDEX "FaqComment_createdAt_idx" ON "FaqComment"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "FaqReaction_organizationId_targetType_targetId_userId_type_key" ON "FaqReaction"("organizationId", "targetType", "targetId", "userId", "type");
CREATE INDEX "FaqReaction_organizationId_idx" ON "FaqReaction"("organizationId");
CREATE INDEX "FaqReaction_threadId_idx" ON "FaqReaction"("threadId");
CREATE INDEX "FaqReaction_commentId_idx" ON "FaqReaction"("commentId");
CREATE INDEX "FaqReaction_targetType_idx" ON "FaqReaction"("targetType");
CREATE INDEX "FaqReaction_targetId_idx" ON "FaqReaction"("targetId");
CREATE INDEX "FaqReaction_userId_idx" ON "FaqReaction"("userId");
CREATE INDEX "FaqReaction_type_idx" ON "FaqReaction"("type");
