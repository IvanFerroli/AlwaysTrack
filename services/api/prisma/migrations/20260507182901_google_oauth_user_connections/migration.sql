-- CreateTable
CREATE TABLE "GoogleConnection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "refreshTokenEncrypted" TEXT NOT NULL,
    "scopesJson" TEXT NOT NULL,
    "connectedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" DATETIME,
    "revokedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GoogleConnection_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "GoogleConnection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GoogleOauthState" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "stateHash" TEXT NOT NULL,
    "codeVerifier" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "usedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GoogleOauthState_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "GoogleOauthState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "GoogleConnection_userId_key" ON "GoogleConnection"("userId");

-- CreateIndex
CREATE INDEX "GoogleConnection_organizationId_idx" ON "GoogleConnection"("organizationId");

-- CreateIndex
CREATE INDEX "GoogleConnection_provider_idx" ON "GoogleConnection"("provider");

-- CreateIndex
CREATE INDEX "GoogleConnection_revokedAt_idx" ON "GoogleConnection"("revokedAt");

-- CreateIndex
CREATE UNIQUE INDEX "GoogleConnection_organizationId_userId_provider_key" ON "GoogleConnection"("organizationId", "userId", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "GoogleOauthState_stateHash_key" ON "GoogleOauthState"("stateHash");

-- CreateIndex
CREATE INDEX "GoogleOauthState_organizationId_idx" ON "GoogleOauthState"("organizationId");

-- CreateIndex
CREATE INDEX "GoogleOauthState_userId_idx" ON "GoogleOauthState"("userId");

-- CreateIndex
CREATE INDEX "GoogleOauthState_provider_idx" ON "GoogleOauthState"("provider");

-- CreateIndex
CREATE INDEX "GoogleOauthState_expiresAt_idx" ON "GoogleOauthState"("expiresAt");
