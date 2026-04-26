import { strict as assert } from "node:assert";
import test from "node:test";
import type { PrismaClient } from "@prisma/client";
import { InMemoryStateStore } from "../../domain/state/store.js";
import { PrismaStateStore } from "../../domain/state/prisma-store.js";
import { IngestionService } from "../ingestion/ingestion.service.js";

test("metrics snapshot tracks ingestion attempts and dedupe rate", async () => {
  const store = new InMemoryStateStore();
  const ingestion = new IngestionService(store);

  const payload = {
    title: "Backend Engineer",
    companyName: "Olympus",
    sourceName: "manual",
    sourceUrl: "https://example.com/jobs/metrics",
    description: "node typescript api",
    location: "remote"
  };

  await ingestion.ingest(payload);
  await ingestion.ingest(payload);

  const metrics = await store.snapshotMetrics();
  assert.equal(metrics.ingestionAttempts, 2);
  assert.equal(metrics.dedupeHits, 1);
  assert.equal(metrics.dedupeRate, 0.5);
});

test("prisma store snapshot keeps runtime counters across store recreation", async () => {
  const metricValues = new Map<string, number>();

  const fakePrisma = {
    runtimeMetric: {
      upsert: async (args: {
        where: { key: string };
        create: { key: string; value: number };
        update: { value: { increment: number } };
      }) => {
        const key = args.where.key;
        const previous = metricValues.get(key);
        const nextValue = previous === undefined ? args.create.value : previous + args.update.value.increment;
        metricValues.set(key, nextValue);
        return { key, value: nextValue, updatedAt: new Date() };
      },
      findMany: async (args: { where: { key: { in: string[] } } }) => {
        return args.where.key.in
          .filter((key) => metricValues.has(key))
          .map((key) => ({
            key,
            value: metricValues.get(key) ?? 0,
            updatedAt: new Date()
          }));
      }
    },
    $transaction: async <T>(queries: Array<Promise<T>>): Promise<T[]> => Promise.all(queries),
    jobPosting: { count: async () => 0 },
    resumeProfile: { count: async () => 0 },
    approvalRequest: { count: async () => 0 },
    applicationRecord: { count: async () => 0 }
  } as unknown as PrismaClient;

  const firstStore = new PrismaStateStore(fakePrisma);
  await firstStore.recordIngestionAttempt(false);
  await firstStore.recordIngestionAttempt(true);
  await firstStore.recordStrategyProposal();

  const secondStore = new PrismaStateStore(fakePrisma);
  const metrics = await secondStore.snapshotMetrics();

  assert.equal(metrics.ingestionAttempts, 2);
  assert.equal(metrics.dedupeHits, 1);
  assert.equal(metrics.dedupeRate, 0.5);
  assert.equal(metrics.strategyProposals, 1);
});
