import { Queue } from "bullmq";
import { describe, expect, it } from "vitest";
import { createWorker, enqueueJob, getQueueJobStatus } from "./queue.js";

const shouldRun = process.env.RUN_REDIS_JOBS_TESTS === "true" && Boolean(process.env.REDIS_URL);
const describeRedis = shouldRun ? describe : describe.skip;

function redisConnection() {
  const url = new URL(process.env.REDIS_URL ?? "redis://127.0.0.1:6379");
  return {
    host: url.hostname,
    port: Number(url.port || "6379"),
    username: url.username || undefined,
    password: url.password || undefined,
    db: url.pathname ? Number(url.pathname.slice(1) || "0") : 0,
    tls: url.protocol === "rediss:" ? {} : undefined
  };
}

async function waitForStatus(queueName: string, jobName: string, dedupeKey: string, expected: "completed" | "failed") {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 8_000) {
    const status = await getQueueJobStatus(queueName, jobName, dedupeKey);
    if (status.status === expected) return status;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  return getQueueJobStatus(queueName, jobName, dedupeKey);
}

describeRedis("BullMQ queue with Redis", () => {
  it("enqueues, processes, tracks status and deduplicates by job id", async () => {
    process.env.JOB_QUEUE_DRIVER = "bullmq";
    process.env.JOB_CONCURRENCY = "1";

    const queueName = `alwaystrack-test-${Date.now()}-${process.pid}`;
    const jobName = "test.double";
    const dedupeKey = `${jobName}:dedupe`;
    const queue = new Queue(queueName, { connection: redisConnection() });
    let processed = 0;
    const worker = createWorker<{ value: number }, { doubled: number }>(
      queueName,
      async (job) => {
        processed += 1;
        return { doubled: job.data.value * 2 };
      },
      { concurrency: 1 }
    );

    try {
      const first = await enqueueJob({
        queueName,
        jobName,
        dedupeKey,
        data: { value: 21 },
        options: { removeOnComplete: false, removeOnFail: false, backoff: { type: "fixed", delay: 10 } },
        processor: async () => ({ doubled: 42 })
      });
      const second = await enqueueJob({
        queueName,
        jobName,
        dedupeKey,
        data: { value: 99 },
        options: { removeOnComplete: false, removeOnFail: false, backoff: { type: "fixed", delay: 10 } },
        processor: async () => ({ doubled: 198 })
      });

      expect(first.job.driver).toBe("bullmq");
      expect(second.job.id).toBe(first.job.id);

      const completed = await waitForStatus(queueName, jobName, dedupeKey, "completed");
      expect(completed.status).toBe("completed");
      expect(completed.driver).toBe("bullmq");
      expect(completed.attemptsMade).toBeGreaterThanOrEqual(1);
      expect(processed).toBe(1);

      const job = await queue.getJob(dedupeKey);
      expect(await job?.returnvalue).toEqual({ doubled: 42 });
    } finally {
      await worker.close();
      await queue.obliterate({ force: true });
      await queue.close();
    }
  });
});
