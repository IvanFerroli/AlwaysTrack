CREATE TABLE "SupportPauseSwapBookingLock" (
  "swapId" TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SupportPauseSwapBookingLock_pkey" PRIMARY KEY ("swapId", "bookingId"),
  CONSTRAINT "SupportPauseSwapBookingLock_swapId_fkey" FOREIGN KEY ("swapId") REFERENCES "SupportPauseSwap" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "SupportPauseSwapBookingLock_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "SupportPauseBooking" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "SupportPauseSwapBookingLock_bookingId_key"
ON "SupportPauseSwapBookingLock"("bookingId");

CREATE INDEX "SupportPauseSwapBookingLock_swapId_idx"
ON "SupportPauseSwapBookingLock"("swapId");

INSERT INTO "SupportPauseSwapBookingLock" ("swapId", "bookingId")
SELECT "id", "requesterBookingId"
FROM "SupportPauseSwap"
WHERE "status" = 'PENDING'
  AND ("expiresAt" IS NULL OR "expiresAt" > CURRENT_TIMESTAMP)
ON CONFLICT ("bookingId") DO NOTHING;

INSERT INTO "SupportPauseSwapBookingLock" ("swapId", "bookingId")
SELECT "id", "targetBookingId"
FROM "SupportPauseSwap"
WHERE "status" = 'PENDING'
  AND ("expiresAt" IS NULL OR "expiresAt" > CURRENT_TIMESTAMP)
ON CONFLICT ("bookingId") DO NOTHING;

-- A legacy pending swap is valid only when it acquired both booking locks.
-- Concurrent legacy proposals sharing a booking are cancelled for explicit reconfirmation.
UPDATE "SupportPauseSwap"
SET "status" = 'CANCELLED',
    "decisionReason" = 'MIGRATION_LOCK_CONFLICT_REQUIRES_RECONFIRMATION',
    "decidedAt" = CURRENT_TIMESTAMP
WHERE "status" = 'PENDING'
  AND (
    SELECT COUNT(*)
    FROM "SupportPauseSwapBookingLock"
    WHERE "SupportPauseSwapBookingLock"."swapId" = "SupportPauseSwap"."id"
  ) <> 2;

DELETE FROM "SupportPauseSwapBookingLock"
WHERE "swapId" IN (
  SELECT "id"
  FROM "SupportPauseSwap"
  WHERE "status" <> 'PENDING'
);
