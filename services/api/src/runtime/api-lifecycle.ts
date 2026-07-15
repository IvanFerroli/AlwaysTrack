import { randomUUID } from "node:crypto";
import type { Server } from "node:http";
import express, { type Express, type RequestHandler } from "express";
import { Queue } from "bullmq";
import type { ApiEnv } from "../config/env.js";
import { logEvent } from "../core/diagnostics/logger.js";

const DEFAULT_READINESS_TIMEOUT_MS = 1_000;
const DEFAULT_SHUTDOWN_TIMEOUT_MS = 10_000;

type Signal = "SIGINT" | "SIGTERM";
type ResourceKind = "jobs" | "websocket" | "redis" | "prisma";

export interface RuntimeDependency {
  name: string;
  check: () => Promise<void>;
}

export interface RuntimeResource {
  name: string;
  kind: ResourceKind;
  close: () => Promise<void>;
}

export interface RuntimeState {
  draining: boolean;
}

export interface ShutdownResult {
  completed: boolean;
  timedOut: boolean;
  failures: string[];
}

interface SignalSource {
  on(signal: Signal, listener: () => void): unknown;
  off(signal: Signal, listener: () => void): unknown;
  exitCode?: number;
}

interface RuntimePrismaClient {
  $queryRawUnsafe(query: string): Promise<unknown>;
  $disconnect(): Promise<void>;
}

interface ApiRuntimeOptions {
  application: RequestHandler;
  prisma: RuntimePrismaClient;
  env: Pick<ApiEnv, "jobQueueDriver" | "redisUrl">;
  readinessTimeoutMs?: number;
  shutdownTimeoutMs?: number;
  dependencies?: RuntimeDependency[];
  resources?: RuntimeResource[];
  signalSource?: SignalSource;
}

export interface ApiRuntime {
  app: Express;
  state: RuntimeState;
  listen: (port: number, callback?: () => void) => Server;
  shutdown: (signal?: Signal) => Promise<ShutdownResult>;
  disposeSignalHandlers: () => void;
}

function positiveTimeout(value: number | undefined, fallback: number) {
  return Number.isFinite(value) && Number(value) > 0 ? Number(value) : fallback;
}

async function withTimeout<T>(operation: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => reject(new Error("operation timed out")), timeoutMs);
        timer.unref?.();
      })
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function redisConnection(redisUrl: string) {
  const url = new URL(redisUrl);
  return {
    host: url.hostname,
    port: Number(url.port || "6379"),
    username: url.username || undefined,
    password: url.password || undefined,
    db: Number(url.pathname.slice(1) || "0"),
    tls: url.protocol === "rediss:" ? {} : undefined,
    connectTimeout: DEFAULT_READINESS_TIMEOUT_MS,
    maxRetriesPerRequest: 0
  };
}

export function createRedisReadinessDependency(redisUrl: string): RuntimeDependency {
  return {
    name: "redis",
    async check() {
      const queue = new Queue(`runtime-readiness-${randomUUID()}`, {
        connection: redisConnection(redisUrl)
      });
      try {
        await withTimeout(queue.waitUntilReady(), DEFAULT_READINESS_TIMEOUT_MS);
      } finally {
        await withTimeout(queue.close(), 100).catch(() => queue.disconnect().catch(() => undefined));
      }
    }
  };
}

function createDefaultDependencies(
  prisma: Pick<RuntimePrismaClient, "$queryRawUnsafe">,
  env: Pick<ApiEnv, "jobQueueDriver" | "redisUrl">
): RuntimeDependency[] {
  const dependencies: RuntimeDependency[] = [
    {
      name: "database",
      async check() {
        await prisma.$queryRawUnsafe("SELECT 1");
      }
    }
  ];

  if (env.jobQueueDriver === "bullmq") {
    dependencies.push(
      env.redisUrl
        ? createRedisReadinessDependency(env.redisUrl)
        : { name: "redis", check: async () => Promise.reject(new Error("Redis is not configured")) }
    );
  }
  return dependencies;
}

export function createRuntimeApp(
  application: RequestHandler,
  state: RuntimeState,
  dependencies: RuntimeDependency[],
  readinessTimeoutMs = DEFAULT_READINESS_TIMEOUT_MS
) {
  const app = express();
  const timeoutMs = positiveTimeout(readinessTimeoutMs, DEFAULT_READINESS_TIMEOUT_MS);

  app.get("/health/live", (_request, response) => {
    response.status(200).json({ status: "alive" });
  });

  app.get("/health/ready", async (_request, response) => {
    if (state.draining) {
      return response.status(503).json({ status: "not_ready", checks: { lifecycle: "draining" } });
    }

    const results = await Promise.all(
      dependencies.map(async (dependency) => {
        try {
          await withTimeout(dependency.check(), timeoutMs);
          return [dependency.name, "up"] as const;
        } catch {
          return [dependency.name, "down"] as const;
        }
      })
    );
    const checks = Object.fromEntries(results);
    const ready = results.every(([, status]) => status === "up") && !state.draining;
    return response.status(ready ? 200 : 503).json({ status: ready ? "ready" : "not_ready", checks });
  });

  app.use((request, response, next) => {
    if (!state.draining) return next();
    response.setHeader("connection", "close");
    return response.status(503).json({ status: "draining" });
  });
  app.use(application);
  return app;
}

async function closeServer(server: Server, timeoutMs: number) {
  let callbackCompleted = false;
  const closed = new Promise<void>((resolve, reject) => {
    server.close((error) => {
      callbackCompleted = true;
      if (error) reject(error);
      else resolve();
    });
    server.closeIdleConnections();
  });

  try {
    await withTimeout(closed, timeoutMs);
    return false;
  } catch {
    server.closeAllConnections();
    if (!callbackCompleted) await closed.catch(() => undefined);
    return true;
  }
}

export function createApiRuntime(options: ApiRuntimeOptions): ApiRuntime {
  const state: RuntimeState = { draining: false };
  const readinessTimeoutMs = positiveTimeout(options.readinessTimeoutMs, DEFAULT_READINESS_TIMEOUT_MS);
  const shutdownTimeoutMs = positiveTimeout(options.shutdownTimeoutMs, DEFAULT_SHUTDOWN_TIMEOUT_MS);
  const dependencies = options.dependencies ?? createDefaultDependencies(options.prisma, options.env);
  const resources: RuntimeResource[] = [
    ...(options.resources ?? []),
    { name: "prisma", kind: "prisma", close: () => options.prisma.$disconnect() }
  ];
  const app = createRuntimeApp(options.application, state, dependencies, readinessTimeoutMs);
  const signalSource = options.signalSource ?? process;
  let server: Server | undefined;
  let shutdownPromise: Promise<ShutdownResult> | undefined;

  const shutdown = (signal: Signal = "SIGTERM") => {
    if (shutdownPromise) return shutdownPromise;
    state.draining = true;
    shutdownPromise = (async () => {
      const startedAt = Date.now();
      const failures: string[] = [];
      let timedOut = false;
      logEvent("info", "api.shutdown.started", { signal, timeoutMs: shutdownTimeoutMs });

      for (const resource of resources.filter(({ kind }) => kind === "jobs" || kind === "websocket")) {
        const remainingMs = Math.max(1, shutdownTimeoutMs - (Date.now() - startedAt));
        try {
          await withTimeout(resource.close(), remainingMs);
        } catch {
          failures.push(resource.name);
        }
      }

      if (server) {
        const remainingMs = Math.max(1, shutdownTimeoutMs - (Date.now() - startedAt));
        timedOut = await closeServer(server, remainingMs);
      }

      for (const resource of resources.filter(({ kind }) => kind === "redis" || kind === "prisma")) {
        const remainingMs = Math.max(1, shutdownTimeoutMs - (Date.now() - startedAt));
        try {
          await withTimeout(resource.close(), remainingMs);
        } catch {
          failures.push(resource.name);
        }
      }

      const result = { completed: !timedOut && failures.length === 0, timedOut, failures };
      logEvent(result.completed ? "info" : "error", "api.shutdown.completed", {
        signal,
        durationMs: Date.now() - startedAt,
        timedOut,
        failures
      });
      return result;
    })();
    return shutdownPromise;
  };

  const handleSigint = () => {
    void shutdown("SIGINT").then((result) => {
      if (!result.completed) signalSource.exitCode = 1;
    });
  };
  const handleSigterm = () => {
    void shutdown("SIGTERM").then((result) => {
      if (!result.completed) signalSource.exitCode = 1;
    });
  };
  signalSource.on("SIGINT", handleSigint);
  signalSource.on("SIGTERM", handleSigterm);

  return {
    app,
    state,
    listen(port, callback) {
      if (server) throw new Error("API runtime is already listening.");
      server = app.listen(port, callback);
      return server;
    },
    shutdown,
    disposeSignalHandlers() {
      signalSource.off("SIGINT", handleSigint);
      signalSource.off("SIGTERM", handleSigterm);
    }
  };
}
