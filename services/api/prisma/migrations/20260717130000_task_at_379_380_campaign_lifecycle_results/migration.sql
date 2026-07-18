ALTER TABLE "SupportCampaign" ADD COLUMN "lifecycleVersion" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "SupportCampaign" ADD COLUMN "audienceRule" TEXT NOT NULL DEFAULT 'FIXED_AT_ACTIVATION';
ALTER TABLE "SupportCampaign" ADD COLUMN "audienceSnapshotJson" TEXT;
ALTER TABLE "SupportCampaign" ADD COLUMN "audienceSnapshotAt" DATETIME;
ALTER TABLE "SupportCampaign" ADD COLUMN "resultSnapshotJson" TEXT;
ALTER TABLE "SupportCampaign" ADD COLUMN "resultSnapshotAt" DATETIME;
ALTER TABLE "SupportCampaign" ADD COLUMN "publishedAt" DATETIME;
ALTER TABLE "SupportCampaign" ADD COLUMN "pausedAt" DATETIME;
ALTER TABLE "SupportCampaign" ADD COLUMN "closedAt" DATETIME;
