-- Persist runtime counters used by /v1/metrics
CREATE TABLE IF NOT EXISTS "runtime_metrics" (
  "key" TEXT PRIMARY KEY,
  "value" INTEGER NOT NULL DEFAULT 0,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
