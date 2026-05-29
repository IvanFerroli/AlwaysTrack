-- CreateTable
CREATE TABLE "WikiPage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT NOT NULL,
    "publishedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WikiPage_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WikiPage_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WikiPage_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WikiEditRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "reviewerId" TEXT,
    "baseVersion" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "decisionNote" TEXT,
    "reviewedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WikiEditRequest_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WikiEditRequest_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "WikiPage" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WikiEditRequest_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WikiEditRequest_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WikiRevision" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "requestId" TEXT,
    "version" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WikiRevision_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WikiRevision_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "WikiPage" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WikiRevision_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WikiRevision_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "WikiEditRequest" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WikiReadReceipt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lastReadAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WikiReadReceipt_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WikiReadReceipt_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "WikiPage" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WikiReadReceipt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WikiPresence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "lastSeenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WikiPresence_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WikiPresence_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "WikiPage" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WikiPresence_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "WikiPage_organizationId_slug_key" ON "WikiPage"("organizationId", "slug");
CREATE INDEX "WikiPage_organizationId_idx" ON "WikiPage"("organizationId");
CREATE INDEX "WikiPage_active_idx" ON "WikiPage"("active");
CREATE INDEX "WikiPage_updatedAt_idx" ON "WikiPage"("updatedAt");
CREATE INDEX "WikiRevision_organizationId_idx" ON "WikiRevision"("organizationId");
CREATE INDEX "WikiRevision_pageId_idx" ON "WikiRevision"("pageId");
CREATE INDEX "WikiRevision_authorId_idx" ON "WikiRevision"("authorId");
CREATE INDEX "WikiRevision_requestId_idx" ON "WikiRevision"("requestId");
CREATE UNIQUE INDEX "WikiRevision_pageId_version_key" ON "WikiRevision"("pageId", "version");
CREATE INDEX "WikiEditRequest_organizationId_idx" ON "WikiEditRequest"("organizationId");
CREATE INDEX "WikiEditRequest_pageId_idx" ON "WikiEditRequest"("pageId");
CREATE INDEX "WikiEditRequest_authorId_idx" ON "WikiEditRequest"("authorId");
CREATE INDEX "WikiEditRequest_reviewerId_idx" ON "WikiEditRequest"("reviewerId");
CREATE INDEX "WikiEditRequest_status_idx" ON "WikiEditRequest"("status");
CREATE UNIQUE INDEX "WikiReadReceipt_pageId_userId_key" ON "WikiReadReceipt"("pageId", "userId");
CREATE INDEX "WikiReadReceipt_organizationId_idx" ON "WikiReadReceipt"("organizationId");
CREATE INDEX "WikiReadReceipt_pageId_idx" ON "WikiReadReceipt"("pageId");
CREATE INDEX "WikiReadReceipt_userId_idx" ON "WikiReadReceipt"("userId");
CREATE INDEX "WikiReadReceipt_lastReadAt_idx" ON "WikiReadReceipt"("lastReadAt");
CREATE UNIQUE INDEX "WikiPresence_pageId_userId_key" ON "WikiPresence"("pageId", "userId");
CREATE INDEX "WikiPresence_organizationId_idx" ON "WikiPresence"("organizationId");
CREATE INDEX "WikiPresence_pageId_idx" ON "WikiPresence"("pageId");
CREATE INDEX "WikiPresence_userId_idx" ON "WikiPresence"("userId");
CREATE INDEX "WikiPresence_lastSeenAt_idx" ON "WikiPresence"("lastSeenAt");
