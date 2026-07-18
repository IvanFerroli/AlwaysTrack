ALTER TABLE "SupportPauseBooking" ADD COLUMN "overrideReason" TEXT;
ALTER TABLE "SupportPauseBooking" ADD COLUMN "coverageBefore" INTEGER;
ALTER TABLE "SupportPauseBooking" ADD COLUMN "coverageAfter" INTEGER;
ALTER TABLE "SupportPauseBooking" ADD COLUMN "minimumCoverage" INTEGER;
ALTER TABLE "SupportPauseBooking" ADD COLUMN "overrideById" TEXT;
ALTER TABLE "SupportPauseBooking" ADD COLUMN "overrideAt" DATETIME;
ALTER TABLE "SupportPauseBooking" ADD COLUMN "overrideRevokedById" TEXT;
ALTER TABLE "SupportPauseBooking" ADD COLUMN "overrideRevokedAt" DATETIME;
ALTER TABLE "SupportPauseBooking" ADD COLUMN "overrideRevokeReason" TEXT;
ALTER TABLE "SupportPauseSwap" ADD COLUMN "expiresAt" DATETIME;

CREATE INDEX "SupportPauseSwap_organizationId_status_expiresAt_idx"
ON "SupportPauseSwap"("organizationId", "status", "expiresAt");
