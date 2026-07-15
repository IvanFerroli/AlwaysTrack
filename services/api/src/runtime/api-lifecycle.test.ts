import { EventEmitter } from "node:events";
import type { AddressInfo } from "node:net";
import express from "express";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createApiRuntime, createRuntimeApp, type RuntimeState } from "./api-lifecycle.js";

const runtimes: Array<ReturnType<typeof createApiRuntime>> = [];

afterEach(async () => {
  await Promise.all(runtimes.splice(0).map((runtime) => runtime.shutdown()));
});

async function listen(app: express.Express) {
  const server = app.listen(0);
  await new Promise<void>((resolve) => server.once("listening", resolve));
  return { server, baseUrl: `http://127.0.0.1:${(server.address() as AddressInfo).port}` };
}

describe("API health lifecycle", () => {
  it("keeps liveness independent and reports sanitized dependency readiness", async () => {
    const state: RuntimeState = { draining: false };
    const app = createRuntimeApp(express(), state, [
      { name: "database", check: async () => undefined },
      { name: "redis", check: async () => Promise.reject(new Error("redis://user:secret@private-host")) }
    ]);
    const { server, baseUrl } = await listen(app);

    const live = await fetch(`${baseUrl}/health/live`);
    const ready = await fetch(`${baseUrl}/health/ready`);

    expect(live.status).toBe(200);
    expect(await live.json()).toEqual({ status: "alive" });
    expect(ready.status).toBe(503);
    expect(await ready.json()).toEqual({ status: "not_ready", checks: { database: "up", redis: "down" } });
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it("bounds dependency checks and stops accepting work while draining", async () => {
    const state: RuntimeState = { draining: false };
    const inner = express().get("/work", (_request, response) => response.json({ accepted: true }));
    const app = createRuntimeApp(inner, state, [{ name: "database", check: () => new Promise(() => undefined) }], 10);
    const { server, baseUrl } = await listen(app);

    expect((await fetch(`${baseUrl}/health/ready`)).status).toBe(503);
    state.draining = true;
    const work = await fetch(`${baseUrl}/work`);
    const ready = await fetch(`${baseUrl}/health/ready`);

    expect(work.status).toBe(503);
    expect(work.headers.get("connection")).toBe("close");
    expect(ready.status).toBe(503);
    expect(await ready.json()).toEqual({ status: "not_ready", checks: { lifecycle: "draining" } });
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });
});

describe("API graceful shutdown", () => {
  function runtime(options: Partial<Parameters<typeof createApiRuntime>[0]> = {}) {
    const signalSource = new EventEmitter() as EventEmitter & { exitCode?: number };
    const created = createApiRuntime({
      application: express().get("/work", (_request, response) => response.json({ accepted: true })),
      prisma: { $queryRawUnsafe: vi.fn(async () => [1]), $disconnect: vi.fn(async () => undefined) },
      env: { jobQueueDriver: "inline" },
      signalSource,
      ...options
    });
    runtimes.push(created);
    return { runtime: created, signalSource };
  }

  it("closes resident resources in order and makes repeated shutdown idempotent", async () => {
    const order: string[] = [];
    const prisma = { $queryRawUnsafe: vi.fn(async () => [1]), $disconnect: vi.fn(async () => { order.push("prisma"); }) };
    const { runtime: created } = runtime({
      prisma,
      resources: [
        { name: "worker", kind: "jobs", close: async () => { order.push("jobs"); } },
        { name: "socket", kind: "websocket", close: async () => { order.push("websocket"); } },
        { name: "redis", kind: "redis", close: async () => { order.push("redis"); } }
      ]
    });
    created.listen(0);

    const first = created.shutdown("SIGTERM");
    const second = created.shutdown("SIGINT");

    expect(second).toBe(first);
    await expect(first).resolves.toEqual({ completed: true, timedOut: false, failures: [] });
    expect(order).toEqual(["jobs", "websocket", "redis", "prisma"]);
    expect(prisma.$disconnect).toHaveBeenCalledOnce();
  });

  it("forces an active HTTP connection closed when the drain deadline expires", async () => {
    let requestStarted!: () => void;
    const started = new Promise<void>((resolve) => { requestStarted = resolve; });
    const application = express().get("/slow", (_request, _response) => requestStarted());
    const { runtime: created } = runtime({ application, shutdownTimeoutMs: 25 });
    const server = created.listen(0);
    await new Promise<void>((resolve) => server.once("listening", resolve));
    const pendingRequest = fetch(`http://127.0.0.1:${(server.address() as AddressInfo).port}/slow`).catch(() => undefined);
    await started;

    const result = await created.shutdown("SIGTERM");

    expect(result.timedOut).toBe(true);
    expect(result.completed).toBe(false);
    await pendingRequest;
  });

  it("handles signals and allows a fresh runtime to become ready after restart", async () => {
    const first = runtime();
    const firstServer = first.runtime.listen(0);
    await new Promise<void>((resolve) => firstServer.once("listening", resolve));
    first.signalSource.emit("SIGINT");
    await vi.waitFor(() => expect(first.runtime.state.draining).toBe(true));

    const second = runtime();
    const secondServer = second.runtime.listen(0);
    await new Promise<void>((resolve) => secondServer.once("listening", resolve));
    const response = await fetch(`http://127.0.0.1:${(secondServer.address() as AddressInfo).port}/health/ready`);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ready", checks: { database: "up" } });
  });

  it("requires Redis readiness only when the API is configured for BullMQ", async () => {
    const { runtime: created } = runtime({ env: { jobQueueDriver: "bullmq" } });
    const server = created.listen(0);
    await new Promise<void>((resolve) => server.once("listening", resolve));

    const response = await fetch(`http://127.0.0.1:${(server.address() as AddressInfo).port}/health/ready`);

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ status: "not_ready", checks: { database: "up", redis: "down" } });
  });
});
