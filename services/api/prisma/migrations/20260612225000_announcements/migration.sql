-- CreateTable
CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "content" TEXT NOT NULL,
    "tagsJson" TEXT,
    "linksJson" TEXT,
    "targetRolesJson" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "requiresAck" BOOLEAN NOT NULL DEFAULT false,
    "startsAt" DATETIME,
    "expiresAt" DATETIME,
    "publishedAt" DATETIME,
    "archivedAt" DATETIME,
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Announcement_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Announcement_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Announcement_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AnnouncementReadReceipt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "announcementId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "acknowledgedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AnnouncementReadReceipt_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AnnouncementReadReceipt_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "Announcement" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AnnouncementReadReceipt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Announcement_organizationId_slug_key" ON "Announcement"("organizationId", "slug");

-- CreateIndex
CREATE INDEX "Announcement_organizationId_idx" ON "Announcement"("organizationId");

-- CreateIndex
CREATE INDEX "Announcement_status_idx" ON "Announcement"("status");

-- CreateIndex
CREATE INDEX "Announcement_priority_idx" ON "Announcement"("priority");

-- CreateIndex
CREATE INDEX "Announcement_pinned_idx" ON "Announcement"("pinned");

-- CreateIndex
CREATE INDEX "Announcement_startsAt_idx" ON "Announcement"("startsAt");

-- CreateIndex
CREATE INDEX "Announcement_expiresAt_idx" ON "Announcement"("expiresAt");

-- CreateIndex
CREATE INDEX "Announcement_publishedAt_idx" ON "Announcement"("publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "AnnouncementReadReceipt_announcementId_userId_key" ON "AnnouncementReadReceipt"("announcementId", "userId");

-- CreateIndex
CREATE INDEX "AnnouncementReadReceipt_organizationId_idx" ON "AnnouncementReadReceipt"("organizationId");

-- CreateIndex
CREATE INDEX "AnnouncementReadReceipt_announcementId_idx" ON "AnnouncementReadReceipt"("announcementId");

-- CreateIndex
CREATE INDEX "AnnouncementReadReceipt_userId_idx" ON "AnnouncementReadReceipt"("userId");

-- CreateIndex
CREATE INDEX "AnnouncementReadReceipt_acknowledgedAt_idx" ON "AnnouncementReadReceipt"("acknowledgedAt");
