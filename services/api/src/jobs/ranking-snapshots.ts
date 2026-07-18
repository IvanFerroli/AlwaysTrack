import { prisma } from "../core/db/prisma.js";
import { loadEnv } from "../config/env.js";
import { createWorker } from "../core/jobs/queue.js";
import {
  createRankingSnapshotJobName,
  processRankingSnapshotJob,
  rankingSnapshotQueueName,
  type RankingSnapshotJobData
} from "../core/jobs/ranking-snapshot.jobs.js";

const env = loadEnv();
if (!env.enableLegacySalesWrites) {
  console.info("Ranking snapshot worker disabled: legacy sales writes are retired.");
  await prisma.$disconnect();
  process.exit(0);
}

const worker = createWorker<RankingSnapshotJobData, unknown>(rankingSnapshotQueueName, async (job) => {
  if (job.name !== createRankingSnapshotJobName) {
    throw new Error(`Unsupported ranking snapshot job: ${job.name}`);
  }
  return processRankingSnapshotJob(prisma, job.data);
});

process.on("SIGINT", async () => {
  await worker.close();
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await worker.close();
  await prisma.$disconnect();
  process.exit(0);
});
