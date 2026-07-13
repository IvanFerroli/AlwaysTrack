import { describe, expect, it, vi } from "vitest";
import { ConnectorResultCache, InFlightDeduplicator, connectorCacheKey } from "./cache/index.js";
import { runLocalPreflight } from "./diagnostics/index.js";
import { ProgressiveOrchestrator, type OrchestratorJob } from "./orchestrator/index.js";
import { CompanionApiClient } from "./protocol/index.js";

const scope = (extra = {}) => ({ tenantId: "tenant", caseId: "case", connectorId: "crm", browserProfileId: "profile", base: "main", search: { cpf: "1" }, ...extra });
const result = (job: OrchestratorJob) => ({ connectorId: job.connectorId as any, runId: job.runId, status: "COMPLETE" as const, startedAt: "2026-01-01T00:00:00.000Z", facts: [], warnings: [] });

describe("Companion runtime controls", () => {
  it("scopes cache by tenant, case, connector, profile, base and normalized search", () => {
    expect(connectorCacheKey(scope({ search: { order: "2", cpf: "1" } }))).toBe(connectorCacheKey(scope({ search: { cpf: "1", order: "2" } })));
    expect(connectorCacheKey(scope())).not.toBe(connectorCacheKey(scope({ caseId: "other" })));
    let now = 10; const cache = new ConnectorResultCache<string>(() => now); cache.set(scope(), "value", 20); now = 15;
    expect(cache.get(scope())).toMatchObject({ value: "value", ageMs: 5 }); now = 30; expect(cache.get(scope())).toBeUndefined();
  });

  it("deduplicates only simultaneous identical searches", async () => {
    const dedupe = new InFlightDeduplicator<number>(); let calls = 0; let release!: () => void; const wait = new Promise<void>((resolve) => { release = resolve; });
    const operation = () => dedupe.run(scope(), async () => { calls++; await wait; return 7; });
    const a = operation(); const b = operation(); expect(calls).toBe(1); release(); expect(await Promise.all([a, b])).toEqual([7, 7]);
  });

  it("runs waves in order with bounded concurrency and isolates failures", async () => {
    let active = 0; let peak = 0; const order: string[] = [];
    const job = (runId: string, wave: 0 | 1, fail = false): OrchestratorJob => ({ connectorId: runId, runId, wave, execute: async () => { active++; peak = Math.max(peak, active); order.push(runId); await Promise.resolve(); active--; if (fail) throw new Error("broken"); return result(job(runId, wave)); } });
    const events: any[] = []; const output = await new ProgressiveOrchestrator({ enabled: true, concurrency: 2, timeoutMs: 100 }).run([job("a", 0), job("b", 0, true), job("c", 1)], (event) => events.push(event));
    expect(peak).toBe(2); expect(order.indexOf("c")).toBeGreaterThan(order.indexOf("b")); expect(output.map((item) => item.status)).toEqual(["COMPLETE", "FAILED_UNEXPECTED_PAGE", "COMPLETE"]); expect(events.filter((event) => event.type === "result")).toHaveLength(3);
  });

  it("cancels one run without cancelling its peer", async () => {
    const orchestrator = new ProgressiveOrchestrator({ enabled: true, concurrency: 2, timeoutMs: 1000 });
    const waiting = (runId: string): OrchestratorJob => ({ connectorId: runId, runId, wave: 0, execute: (signal) => new Promise((resolve, reject) => { signal.addEventListener("abort", () => reject(new Error("aborted"))); if (runId === "keep") setTimeout(() => resolve(result(waiting(runId))), 5); }) });
    const pending = orchestrator.run([waiting("cancel"), waiting("keep")], () => {}); await Promise.resolve(); expect(orchestrator.cancel("cancel")).toBe(true);
    expect((await pending).map((item) => item.status)).toEqual(["CANCELLED", "COMPLETE"]);
  });

  it("enforces a hard timeout when a connector ignores abort", async () => {
    vi.useFakeTimers();
    try {
      const stuck: OrchestratorJob = { connectorId: "stuck", runId: "stuck", wave: 0, execute: async () => new Promise(() => {}) };
      const pending = new ProgressiveOrchestrator({ enabled: true, concurrency: 1, timeoutMs: 30 }).run([stuck], () => {});
      await vi.advanceTimersByTimeAsync(30);
      await expect(pending).resolves.toMatchObject([{ status: "FAILED_TIMEOUT" }]);
    } finally { vi.useRealTimers(); }
  });

  it("keeps preflight local and disabled by default", async () => {
    const probe = { connectorId: "crm", probeLocal: vi.fn(async () => ({ state: "BLOCKED_AUTH" as const, version: "1" })) };
    expect(await runLocalPreflight({ enabled: false, hostActive: true, extensionPaired: true, activeProfile: true, probes: [probe], now: () => 0 })).toMatchObject({ enabled: false, connectors: [] }); expect(probe.probeLocal).not.toHaveBeenCalled();
    expect(await runLocalPreflight({ enabled: true, hostActive: true, extensionPaired: true, activeProfile: true, probes: [probe], now: () => 0 })).toMatchObject({ ready: true, connectors: [{ connectorId: "crm", state: "BLOCKED_AUTH" }] });
  });

  it("sends the complete correlation and rejects mismatched facts before transport", async () => {
    const transport = { request: vi.fn(async () => ({ status: 201 })) }; const now = () => 0;
    const client = new CompanionApiClient("http://api", { credentialId: "cred", token: "secret", expiresAt: "2030-01-01T00:00:00.000Z" }, transport, now);
    const correlation = { installationId: "i", userId: "u", browserProfileId: "p", caseId: "c", runId: "r" };
    await expect(client.ingestFacts(correlation, [{ caseId: "other", connectorRunId: "r" } as any])).rejects.toThrow("CORRELATION_MISMATCH"); expect(transport.request).not.toHaveBeenCalled();
  });
});
