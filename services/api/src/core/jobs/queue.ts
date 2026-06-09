import { Queue, type JobsOptions, type Processor, Worker } from "bullmq";
import { loadEnv } from "../../config/env.js";
import { logEvent } from "../diagnostics/logger.js";

export interface QueueJobResult {
  id: string;
  name: string;
  status: "completed" | "queued";
  driver: "inline" | "bullmq";
  dedupeKey: string;
}

export interface QueueJobStatus {
  id: string;
  name: string;
  driver: "inline" | "bullmq";
  dedupeKey: string;
  status:
    | "not_tracked"
    | "waiting"
    | "waiting-children"
    | "active"
    | "completed"
    | "failed"
    | "delayed"
    | "prioritized"
    | "paused"
    | "unknown"
    | "not_found"
    | "unavailable";
  attemptsMade?: number;
  failedReason?: string;
  finishedAt?: string;
  processedAt?: string;
  timestamp?: string;
}

export interface EnqueuedJob<TResult> {
  job: QueueJobResult;
  result?: TResult;
}

export interface QueueJobConfig<TData, TResult> {
  queueName: string;
  jobName: string;
  dedupeKey: string;
  data: TData;
  options?: JobsOptions;
  processor: (data: TData) => Promise<TResult>;
}

function redisConnection() {
  const env = loadEnv();
  if (!env.redisUrl) return undefined;
  const url = new URL(env.redisUrl);
  return {
    host: url.hostname,
    port: Number(url.port || "6379"),
    username: url.username || undefined,
    password: url.password || undefined,
    db: url.pathname ? Number(url.pathname.slice(1) || "0") : 0,
    tls: url.protocol === "rediss:" ? {} : undefined
  };
}

export async function enqueueJob<TData, TResult>(config: QueueJobConfig<TData, TResult>): Promise<EnqueuedJob<TResult>> {
  const env = loadEnv();
  if (env.jobQueueDriver !== "bullmq") {
    const result = await config.processor(config.data);
    return {
      job: {
        id: config.dedupeKey,
        name: config.jobName,
        status: "completed",
        driver: "inline",
        dedupeKey: config.dedupeKey
      },
      result
    };
  }

  const connection = redisConnection();
  if (!connection) {
    throw new Error("REDIS_URL is required when JOB_QUEUE_DRIVER=bullmq.");
  }

  const queue = new Queue(config.queueName, { connection });
  const job = await queue.add(config.jobName, config.data, {
    jobId: config.dedupeKey,
    attempts: 3,
    backoff: { type: "exponential", delay: 5_000 },
    removeOnComplete: 100,
    removeOnFail: 250,
    ...config.options
  });
  await queue.close();
  return {
    job: {
      id: String(job.id),
      name: config.jobName,
      status: "queued",
      driver: "bullmq",
      dedupeKey: config.dedupeKey
    }
  };
}

export async function getQueueJobStatus(queueName: string, jobName: string, dedupeKey: string): Promise<QueueJobStatus> {
  const env = loadEnv();
  if (env.jobQueueDriver !== "bullmq") {
    return {
      id: dedupeKey,
      name: jobName,
      driver: "inline",
      dedupeKey,
      status: "not_tracked"
    };
  }

  const connection = redisConnection();
  if (!connection) {
    return {
      id: dedupeKey,
      name: jobName,
      driver: "bullmq",
      dedupeKey,
      status: "unavailable",
      failedReason: "REDIS_URL is required when JOB_QUEUE_DRIVER=bullmq."
    };
  }

  const queue = new Queue(queueName, { connection });
  try {
    const job = await queue.getJob(dedupeKey);
    if (!job) {
      return {
        id: dedupeKey,
        name: jobName,
        driver: "bullmq",
        dedupeKey,
        status: "not_found"
      };
    }
    return {
      id: String(job.id),
      name: job.name,
      driver: "bullmq",
      dedupeKey,
      status: await job.getState(),
      attemptsMade: job.attemptsMade,
      failedReason: job.failedReason,
      finishedAt: job.finishedOn ? new Date(job.finishedOn).toISOString() : undefined,
      processedAt: job.processedOn ? new Date(job.processedOn).toISOString() : undefined,
      timestamp: job.timestamp ? new Date(job.timestamp).toISOString() : undefined
    };
  } finally {
    await queue.close();
  }
}

export function createWorker<TData, TResult>(
  queueName: string,
  processor: Processor<TData, TResult, string>,
  options: { concurrency?: number } = {}
) {
  const env = loadEnv();
  const connection = redisConnection();
  if (env.jobQueueDriver !== "bullmq" || !connection) {
    throw new Error("JOB_QUEUE_DRIVER=bullmq and REDIS_URL are required to start a BullMQ worker.");
  }

  const worker = new Worker(queueName, processor, {
    connection,
    concurrency: options.concurrency ?? env.jobConcurrency ?? 2
  });
  worker.on("completed", (job) => logEvent("info", "job.completed", { queueName, jobId: job.id, name: job.name }));
  worker.on("failed", (job, error) => logEvent("error", "job.failed", { queueName, jobId: job?.id, name: job?.name, error }));
  return worker;
}
