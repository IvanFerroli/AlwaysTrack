ALTER TABLE "SupportPausePolicy" ADD COLUMN "pauseDurationMinutes" INTEGER NOT NULL DEFAULT 75;
ALTER TABLE "SupportPausePolicy" ADD COLUMN "boundaryBufferMinutes" INTEGER NOT NULL DEFAULT 15;
ALTER TABLE "SupportPausePolicy" ADD COLUMN "shiftWindowsJson" TEXT NOT NULL DEFAULT '[{"start":"08:00","end":"14:45"},{"start":"15:00","end":"22:00"}]';
ALTER TABLE "SupportPausePolicy" ADD COLUMN "templateStartsJson" TEXT NOT NULL DEFAULT '["09:45","10:30","10:45","11:15","11:30","11:45","12:15","13:00","15:15","17:15","17:45","18:15","19:15","19:45","20:15"]';
ALTER TABLE "SupportPauseSlot" ADD COLUMN "policySnapshotJson" TEXT;
