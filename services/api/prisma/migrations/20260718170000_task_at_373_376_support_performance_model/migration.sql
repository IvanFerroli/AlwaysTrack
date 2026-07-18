ALTER TABLE "SupportKpiEntry" ADD COLUMN "definitionVersion" INTEGER NOT NULL DEFAULT 2;
ALTER TABLE "SupportKpiEntry" ADD COLUMN "unit" TEXT NOT NULL DEFAULT 'COUNT';
ALTER TABLE "SupportKpiEntry" ADD COLUMN "channel" TEXT;
ALTER TABLE "SupportKpiEntry" ADD COLUMN "granularity" TEXT NOT NULL DEFAULT 'REPORTED_INTERVAL';
ALTER TABLE "SupportKpiEntry" ADD COLUMN "observationType" TEXT NOT NULL DEFAULT 'ACTUAL';
ALTER TABLE "SupportKpiEntry" ADD COLUMN "rawValue" TEXT;
ALTER TABLE "SupportKpiEntry" ADD COLUMN "dataState" TEXT NOT NULL DEFAULT 'AVAILABLE';

-- Historical CSAT and SLA values were persisted as percentages. Keep their
-- numeric values and aggregation components unchanged under explicit legacy keys.
UPDATE "SupportKpiEntry"
SET "metric" = 'CSAT_LEGACY_PERCENT',
    "definitionVersion" = 1,
    "unit" = 'PERCENT'
WHERE "metric" = 'CSAT';

UPDATE "SupportKpiEntry"
SET "metric" = 'SLA_LEGACY_PERCENT',
    "definitionVersion" = 1,
    "unit" = 'PERCENT'
WHERE "metric" = 'SLA';

ALTER TABLE "SupportCampaign" ADD COLUMN "definitionVersion" INTEGER NOT NULL DEFAULT 2;
ALTER TABLE "SupportCampaign" ADD COLUMN "unit" TEXT NOT NULL DEFAULT 'COUNT';
ALTER TABLE "SupportCampaign" ADD COLUMN "channel" TEXT;
ALTER TABLE "SupportCampaign" ADD COLUMN "granularity" TEXT NOT NULL DEFAULT 'REPORTED_INTERVAL';
ALTER TABLE "SupportCampaign" ADD COLUMN "observationType" TEXT NOT NULL DEFAULT 'ACTUAL';

UPDATE "SupportCampaign"
SET "metric" = 'CSAT_LEGACY_PERCENT',
    "definitionVersion" = 1,
    "unit" = 'PERCENT'
WHERE "metric" = 'CSAT';

UPDATE "SupportCampaign"
SET "metric" = 'SLA_LEGACY_PERCENT',
    "definitionVersion" = 1,
    "unit" = 'PERCENT'
WHERE "metric" = 'SLA';

CREATE INDEX "SupportKpiEntry_organizationId_metric_channel_granularity_observationType_periodStart_idx"
ON "SupportKpiEntry"("organizationId", "metric", "channel", "granularity", "observationType", "periodStart");

CREATE INDEX "SupportCampaign_organizationId_metric_channel_granularity_observationType_idx"
ON "SupportCampaign"("organizationId", "metric", "channel", "granularity", "observationType");
