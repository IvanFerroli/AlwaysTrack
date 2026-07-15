import { describe, expect, it } from "vitest";
import { alertTransitions, buildSloDashboard, deriveOperationalState, evaluateSloAlerts, sanitizeAlertCorrelation, type ObservabilitySample } from "./slo-alerts.js";

const healthy = (): ObservabilitySample => ({
  windowMinutes: 5,
  http: { requests: 1_000, serverErrors: 1, p95Ms: 180 },
  jobs: { waiting: 0, failed: 0, oldestWaitingSeconds: 0 },
  data: { database: "UP", storage: "UP" },
  connectors: [{ connectorId: "rastreio", state: "HEALTHY", successRate: 0.99, selectorDriftCount: 0 }],
  companion: { hostConnected: true, extensionPaired: true, reconnectFailures: 0 }
});

describe("SLO alert evaluation", () => {
  it("keeps a healthy sample quiet and distinguishes operational states", () => {
    const sample = healthy();
    expect(evaluateSloAlerts(sample)).toEqual([]);
    expect(deriveOperationalState(sample)).toBe("HEALTHY");
    expect(deriveOperationalState({ ...sample, http: { ...sample.http, p95Ms: 900 } })).toBe("PARTIAL_FAILURE");
    expect(deriveOperationalState({ ...sample, companion: { ...sample.companion, hostConnected: false } })).toBe("DEGRADED");
    expect(deriveOperationalState({ ...sample, data: { ...sample.data, database: "DOWN" } })).toBe("UNAVAILABLE");
    expect(() => evaluateSloAlerts({ ...sample, windowMinutes: 60 })).toThrow("5-minute window");
  });

  it("fires bounded alerts for API, queue, dependency, connector and Companion failures", () => {
    const sample: ObservabilitySample = {
      ...healthy(),
      http: { requests: 100, serverErrors: 5, p95Ms: 800 },
      jobs: { waiting: 101, failed: 2, oldestWaitingSeconds: 301 },
      data: { database: "DEGRADED", storage: "DOWN" },
      connectors: [{ connectorId: "rastreio", state: "UNAVAILABLE", successRate: 0.4, selectorDriftCount: 2 }],
      companion: { hostConnected: false, extensionPaired: false, reconnectFailures: 4 }
    };
    const alerts = evaluateSloAlerts(sample, { requestId: "req-1", caseId: "case-sensitive-1", runId: "run-1" });

    expect(alerts.map(({ id }) => id)).toEqual([
      "api.error-rate", "api.latency-p95", "companion.extension", "companion.host", "companion.reconnect",
      "connector.rastreio.drift", "connector.rastreio.health", "connector.rastreio.success",
      "dependency.database", "dependency.storage", "jobs.backlog", "jobs.failed"
    ]);
    expect(alerts.every(({ correlation }) => correlation?.requestId === "req-1" && correlation.runId === "run-1")).toBe(true);
    expect(JSON.stringify(alerts)).not.toContain("case-sensitive-1");
    expect(alerts[0].correlation?.caseReferenceHash).toMatch(/^sha256:[a-f0-9]{64}$/);
  });

  it("emits firing and resolved transitions without carrying prior payloads", () => {
    const firing = evaluateSloAlerts({ ...healthy(), http: { requests: 100, serverErrors: 3, p95Ms: 180 } });
    expect(alertTransitions([], firing)).toEqual([expect.objectContaining({ id: "api.error-rate", state: "FIRING" })]);
    expect(alertTransitions(firing, [])).toEqual([expect.objectContaining({ id: "api.error-rate", owner: "api-oncall", state: "RESOLVED", observed: "RECOVERED" })]);
  });

  it("drops unsafe correlation fields and hashes only the case reference", () => {
    expect(sanitizeAlertCorrelation({ requestId: "https://user:secret@host", caseId: "case-1", runId: "run 1" })).toEqual({
      requestId: undefined,
      caseReferenceHash: expect.stringMatching(/^sha256:[a-f0-9]{64}$/),
      runId: undefined
    });
  });

  it("builds a bounded dashboard that exposes partial, degraded and unavailable states", () => {
    const partial = buildSloDashboard({ ...healthy(), http: { requests: 100, serverErrors: 0, p95Ms: 700 } });
    const degraded = buildSloDashboard({ ...healthy(), data: { database: "UP", storage: "DOWN" } });
    const unavailable = buildSloDashboard({ ...healthy(), data: { database: "DOWN", storage: "UP" } });

    expect(partial).toMatchObject({ state: "PARTIAL_FAILURE", summary: { firing: 1, warning: 1, critical: 0 } });
    expect(degraded).toMatchObject({ state: "DEGRADED", summary: { firing: 1, warning: 0, critical: 1 } });
    expect(unavailable).toMatchObject({ state: "UNAVAILABLE", summary: { firing: 1, warning: 0, critical: 1 } });
  });
});
