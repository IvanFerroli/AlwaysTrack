DROP INDEX "NotificationJob_providerMessageId_idx";

-- A provider/message pair can identify only one job. For legacy duplicates, keep
-- the oldest association deterministically and retain the later jobs' provider
-- and notification logs while removing only their ambiguous message link.
UPDATE "NotificationJob"
SET "providerMessageId" = NULL
WHERE "id" IN (
  SELECT duplicate."id"
  FROM "NotificationJob" AS duplicate
  INNER JOIN "NotificationJob" AS keeper
    ON keeper."provider" = duplicate."provider"
   AND keeper."providerMessageId" = duplicate."providerMessageId"
   AND (
     keeper."createdAt" < duplicate."createdAt"
     OR (keeper."createdAt" = duplicate."createdAt" AND keeper."id" < duplicate."id")
   )
  WHERE duplicate."provider" IS NOT NULL
    AND duplicate."providerMessageId" IS NOT NULL
);

CREATE UNIQUE INDEX "NotificationJob_provider_providerMessageId_key"
ON "NotificationJob"("provider", "providerMessageId");
