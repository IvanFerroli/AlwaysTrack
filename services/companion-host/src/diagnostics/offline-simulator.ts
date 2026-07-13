export type OfflineConnectorOutcome = "COMPLETE" | "PARTIAL" | "FAILED_TIMEOUT" | "CANCELLED";
export interface OfflineClock { now(): number; sleep(ms: number, signal: AbortSignal): Promise<void>; }
export interface FakeConnector { id: string; delayMs: number; outcome?: Exclude<OfflineConnectorOutcome, "CANCELLED">; value?: string; }
export interface OfflineConnectorResult { tenantId: string; caseId: string; connectorId: string; outcome: OfflineConnectorOutcome; durationMs: number; fromCache: boolean; cacheAgeMs?: number; value?: string; }

interface CacheEntry { tenantId: string; caseId: string; connectorId: string; storedAt: number; result: OfflineConnectorResult; }
const key = (tenantId: string, caseId: string, connectorId: string) => `${tenantId}\u0000${caseId}\u0000${connectorId}`;

export class OfflineCaseFlowSimulator {
  private readonly cache = new Map<string, CacheEntry>();
  private readonly active = new Map<string, AbortController>();
  constructor(private readonly clock: OfflineClock, private readonly options = { timeoutMs: 30_000, cacheTtlMs: 120_000 }) {}

  cancel(tenantId: string, caseId: string) { this.active.get(key(tenantId, caseId, "run"))?.abort(); }

  async *run(tenantId: string, caseId: string, connectors: FakeConnector[]): AsyncGenerator<OfflineConnectorResult> {
    const runKey = key(tenantId, caseId, "run");
    this.active.get(runKey)?.abort();
    const controller = new AbortController();
    this.active.set(runKey, controller);
    const pending = connectors.map((connector) => {
      const token = Symbol(connector.id);
      return { token, promise: this.execute(tenantId, caseId, connector, controller.signal).then((result) => ({ result, token })) };
    });
    try {
      while (pending.length) {
        const completed = await Promise.race(pending.map((item) => item.promise));
        pending.splice(pending.findIndex((item) => item.token === completed.token), 1);
        yield completed.result;
      }
    } finally { if (this.active.get(runKey) === controller) this.active.delete(runKey); }
  }

  private async execute(tenantId: string, caseId: string, connector: FakeConnector, signal: AbortSignal): Promise<OfflineConnectorResult> {
    const startedAt = this.clock.now();
    const cacheKey = key(tenantId, caseId, connector.id);
    const cached = this.cache.get(cacheKey);
    if (cached && startedAt - cached.storedAt <= this.options.cacheTtlMs) return { ...cached.result, durationMs: 0, fromCache: true, cacheAgeMs: startedAt - cached.storedAt };
    try {
      await this.clock.sleep(Math.min(connector.delayMs, this.options.timeoutMs), signal);
      if (connector.delayMs > this.options.timeoutMs) return { tenantId, caseId, connectorId: connector.id, outcome: "FAILED_TIMEOUT", durationMs: this.options.timeoutMs, fromCache: false };
      const result = { tenantId, caseId, connectorId: connector.id, outcome: connector.outcome ?? "COMPLETE", durationMs: this.clock.now() - startedAt, fromCache: false, value: connector.value } satisfies OfflineConnectorResult;
      this.cache.set(cacheKey, { tenantId, caseId, connectorId: connector.id, storedAt: this.clock.now(), result });
      return result;
    } catch { return { tenantId, caseId, connectorId: connector.id, outcome: "CANCELLED", durationMs: this.clock.now() - startedAt, fromCache: false }; }
  }
}

export function fiveFakeConnectors(): FakeConnector[] {
  return [
    { id: "FAKE_FAST", delayMs: 100, value: "ok" }, { id: "FAKE_CACHE", delayMs: 200, value: "cached" },
    { id: "FAKE_PARTIAL", delayMs: 300, outcome: "PARTIAL", value: "partial" }, { id: "FAKE_SLOW", delayMs: 10_500, value: "slow" },
    { id: "FAKE_STUCK", delayMs: 60_000 }
  ];
}
