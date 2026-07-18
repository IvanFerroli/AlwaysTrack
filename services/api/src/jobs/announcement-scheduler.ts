import { materializeAnnouncementOccurrences } from "../core/announcements/announcement-series.service.js";
import { prisma } from "../core/db/prisma.js";
import { logEvent } from "../core/diagnostics/logger.js";

async function main() {
  const startedAt = Date.now();
  const result = await materializeAnnouncementOccurrences(prisma, { horizonDays: 62 });
  logEvent(result.publication.failed.length ? "warn" : "info", "announcement.scheduler.completed", {
    durationMs: Date.now() - startedAt,
    series: result.series,
    candidates: result.candidates.length,
    created: result.created.length,
    skipped: result.skipped.length,
    staleCandidates: result.staleCandidates.length,
    expired: result.expiration.expired.length,
    recoveredClaims: result.publication.recoveredClaims,
    due: result.publication.due,
    maxLagMs: result.publication.maxLagMs,
    published: result.publication.published.length,
    failed: result.publication.failed.length,
    failedOccurrenceIds: result.publication.failed.map((item) => item.id)
  });
}

main()
  .catch((error) => {
    logEvent("error", "announcement.scheduler.failed", { error });
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
