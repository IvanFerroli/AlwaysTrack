import type { CurrentUser } from "@alwaystrack/shared";
import type { PrismaClient } from "@prisma/client";
import { createRankingSnapshot } from "../sales-documents/sales-documents.service.js";
import { enqueueJob, getQueueJobStatus } from "./queue.js";

export const rankingSnapshotQueueName = "ranking-snapshots";
export const createRankingSnapshotJobName = "ranking-snapshot.create";

export interface RankingSnapshotJobData {
  campaignId: string;
  actor: CurrentUser;
}

export function rankingSnapshotDedupeKey(input: RankingSnapshotJobData) {
  return `${createRankingSnapshotJobName}:${input.actor.organizationId}:${input.campaignId}`;
}

export async function processRankingSnapshotJob(prisma: PrismaClient, data: RankingSnapshotJobData) {
  return createRankingSnapshot(prisma, data.actor, data.campaignId);
}

export async function enqueueRankingSnapshotJob(prisma: PrismaClient, data: RankingSnapshotJobData) {
  return enqueueJob({
    queueName: rankingSnapshotQueueName,
    jobName: createRankingSnapshotJobName,
    dedupeKey: rankingSnapshotDedupeKey(data),
    data,
    processor: (payload) => processRankingSnapshotJob(prisma, payload)
  });
}

export async function getRankingSnapshotJobStatus(data: RankingSnapshotJobData) {
  return getQueueJobStatus(rankingSnapshotQueueName, createRankingSnapshotJobName, rankingSnapshotDedupeKey(data));
}
