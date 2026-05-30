-- CreateTable
CREATE TABLE "SellerProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT,
    "salesGroupId" TEXT,
    "code" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "document" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "monthlyGoalCents" INTEGER,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SellerProfile_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SellerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "SellerProfile_salesGroupId_fkey" FOREIGN KEY ("salesGroupId") REFERENCES "SalesGroup" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SalesGroup" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "supervisorId" TEXT,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SalesGroup_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SalesGroup_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SalesDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "sellerProfileId" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "reviewedById" TEXT,
    "fileKey" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'UPLOADED',
    "accessKey" TEXT,
    "invoiceNumber" TEXT,
    "series" TEXT,
    "issuedAt" DATETIME,
    "issuerName" TEXT,
    "buyerName" TEXT,
    "totalAmountCents" INTEGER,
    "extractionConfidence" REAL,
    "rejectionReason" TEXT,
    "reviewedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SalesDocument_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SalesDocument_sellerProfileId_fkey" FOREIGN KEY ("sellerProfileId") REFERENCES "SellerProfile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SalesDocument_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SalesDocument_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SalesDocumentExtraction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "salesDocumentId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "rawText" TEXT,
    "extractedJson" TEXT NOT NULL,
    "confidence" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SalesDocumentExtraction_salesDocumentId_fkey" FOREIGN KEY ("salesDocumentId") REFERENCES "SalesDocument" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SalesItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "salesDocumentId" TEXT NOT NULL,
    "sellerProfileId" TEXT NOT NULL,
    "sku" TEXT,
    "description" TEXT NOT NULL,
    "category" TEXT,
    "quantity" REAL NOT NULL,
    "unitAmountCents" INTEGER,
    "totalAmountCents" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SalesItem_salesDocumentId_fkey" FOREIGN KEY ("salesDocumentId") REFERENCES "SalesDocument" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SalesItem_sellerProfileId_fkey" FOREIGN KEY ("sellerProfileId") REFERENCES "SellerProfile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SalesCampaign" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "salesGroupId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "metric" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "startsAt" DATETIME NOT NULL,
    "endsAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SalesCampaign_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SalesCampaign_salesGroupId_fkey" FOREIGN KEY ("salesGroupId") REFERENCES "SalesGroup" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RankingSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "campaignId" TEXT,
    "periodStart" DATETIME NOT NULL,
    "periodEnd" DATETIME NOT NULL,
    "scopeType" TEXT NOT NULL,
    "scopeId" TEXT,
    "payloadJson" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RankingSnapshot_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RankingSnapshot_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "SalesCampaign" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "SellerProfile_userId_key" ON "SellerProfile"("userId");

-- CreateIndex
CREATE INDEX "SellerProfile_organizationId_idx" ON "SellerProfile"("organizationId");

-- CreateIndex
CREATE INDEX "SellerProfile_salesGroupId_idx" ON "SellerProfile"("salesGroupId");

-- CreateIndex
CREATE INDEX "SellerProfile_active_idx" ON "SellerProfile"("active");

-- CreateIndex
CREATE UNIQUE INDEX "SellerProfile_organizationId_code_key" ON "SellerProfile"("organizationId", "code");

-- CreateIndex
CREATE INDEX "SalesGroup_organizationId_idx" ON "SalesGroup"("organizationId");

-- CreateIndex
CREATE INDEX "SalesGroup_supervisorId_idx" ON "SalesGroup"("supervisorId");

-- CreateIndex
CREATE INDEX "SalesGroup_active_idx" ON "SalesGroup"("active");

-- CreateIndex
CREATE UNIQUE INDEX "SalesGroup_organizationId_name_key" ON "SalesGroup"("organizationId", "name");

-- CreateIndex
CREATE INDEX "SalesDocument_organizationId_idx" ON "SalesDocument"("organizationId");

-- CreateIndex
CREATE INDEX "SalesDocument_sellerProfileId_idx" ON "SalesDocument"("sellerProfileId");

-- CreateIndex
CREATE INDEX "SalesDocument_uploadedById_idx" ON "SalesDocument"("uploadedById");

-- CreateIndex
CREATE INDEX "SalesDocument_reviewedById_idx" ON "SalesDocument"("reviewedById");

-- CreateIndex
CREATE INDEX "SalesDocument_status_idx" ON "SalesDocument"("status");

-- CreateIndex
CREATE INDEX "SalesDocument_issuedAt_idx" ON "SalesDocument"("issuedAt");

-- CreateIndex
CREATE UNIQUE INDEX "SalesDocument_organizationId_accessKey_key" ON "SalesDocument"("organizationId", "accessKey");

-- CreateIndex
CREATE INDEX "SalesDocumentExtraction_salesDocumentId_idx" ON "SalesDocumentExtraction"("salesDocumentId");

-- CreateIndex
CREATE INDEX "SalesDocumentExtraction_provider_idx" ON "SalesDocumentExtraction"("provider");

-- CreateIndex
CREATE INDEX "SalesItem_salesDocumentId_idx" ON "SalesItem"("salesDocumentId");

-- CreateIndex
CREATE INDEX "SalesItem_sellerProfileId_idx" ON "SalesItem"("sellerProfileId");

-- CreateIndex
CREATE INDEX "SalesItem_sku_idx" ON "SalesItem"("sku");

-- CreateIndex
CREATE INDEX "SalesItem_category_idx" ON "SalesItem"("category");

-- CreateIndex
CREATE INDEX "SalesCampaign_organizationId_idx" ON "SalesCampaign"("organizationId");

-- CreateIndex
CREATE INDEX "SalesCampaign_salesGroupId_idx" ON "SalesCampaign"("salesGroupId");

-- CreateIndex
CREATE INDEX "SalesCampaign_status_idx" ON "SalesCampaign"("status");

-- CreateIndex
CREATE INDEX "SalesCampaign_startsAt_idx" ON "SalesCampaign"("startsAt");

-- CreateIndex
CREATE INDEX "SalesCampaign_endsAt_idx" ON "SalesCampaign"("endsAt");

-- CreateIndex
CREATE INDEX "RankingSnapshot_organizationId_idx" ON "RankingSnapshot"("organizationId");

-- CreateIndex
CREATE INDEX "RankingSnapshot_campaignId_idx" ON "RankingSnapshot"("campaignId");

-- CreateIndex
CREATE INDEX "RankingSnapshot_periodStart_idx" ON "RankingSnapshot"("periodStart");

-- CreateIndex
CREATE INDEX "RankingSnapshot_periodEnd_idx" ON "RankingSnapshot"("periodEnd");

-- CreateIndex
CREATE INDEX "RankingSnapshot_scopeType_idx" ON "RankingSnapshot"("scopeType");
