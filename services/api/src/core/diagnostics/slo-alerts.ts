import { createHash } from "node:crypto";

export type DependencyState = "UP" | "DEGRADED" | "DOWN";
export type OperationalState = "HEALTHY" | "PARTIAL_FAILURE" | "DEGRADED" | "UNAVAILABLE";
export type AlertSeverity = "warning" | "critical";

export interface ObservabilitySample {
  windowMinutes: number;
  http: { requests: number; serverErrors: number; p95Ms: number };
  jobs: { waiting: number; failed: number; oldestWaitingSeconds: number };
  data: { database: DependencyState; storage: DependencyState };
  connectors: Array<{
    connectorId: string;
    state: "HEALTHY" | "DEGRADED" | "UNAVAILABLE" | "UNKNOWN";
    successRate: number | null;
    selectorDriftCount: number;
  }>;
  companion: { hostConnected: boolean; extensionPaired: boolean; reconnectFailures: number };
}

export interface AlertCorrelationInput {
  requestId?: string;
  caseId?: string;
  runId?: string;
}

export interface AlertCorrelation {
  requestId?: string;
  caseReferenceHash?: string;
  runId?: string;
}

export interface SloAlert {
  id: string;
  owner: string;
  severity: AlertSeverity;
  signal: "error_rate" | "latency" | "queue" | "dependency" | "connector" | "drift" | "companion";
  state: "FIRING";
  observed: number | string;
  threshold: number | string;
  correlation?: AlertCorrelation;
}

export interface AlertTransition extends Omit<SloAlert, "state"> {
  state: "FIRING" | "RESOLVED";
}

const safeIdentifier = /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,79}$/;

function finiteNonNegative(value: number) {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function safe(value: string | undefined) {
  const normalized = value?.trim();
  return normalized && safeIdentifier.test(normalized) ? normalized : undefined;
}

function hash(value: string) {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

export function sanitizeAlertCorrelation(input: AlertCorrelationInput): AlertCorrelation {
  const requestId = safe(input.requestId);
  const runId = safe(input.runId);
  const caseId = input.caseId?.trim();
  return {
    requestId,
    caseReferenceHash: caseId ? hash(caseId) : undefined,
    runId
  };
}

export function evaluateSloAlerts(sample: ObservabilitySample, correlationInput: AlertCorrelationInput = {}): SloAlert[] {
  if (sample.windowMinutes !== 5) throw new Error("SLO alert samples must use the canonical 5-minute window.");
  const alerts: SloAlert[] = [];
  const correlation = sanitizeAlertCorrelation(correlationInput);
  const withCorrelation = Object.values(correlation).some(Boolean) ? correlation : undefined;
  const push = (alert: Omit<SloAlert, "state" | "correlation">) => alerts.push({ ...alert, state: "FIRING", correlation: withCorrelation });
  const requests = finiteNonNegative(sample.http.requests);
  const errors = Math.min(requests, finiteNonNegative(sample.http.serverErrors));
  const errorRate = requests === 0 ? 0 : errors / requests;

  if (errorRate > 0.01) push({ id: "api.error-rate", owner: "api-oncall", severity: "critical", signal: "error_rate", observed: Number(errorRate.toFixed(4)), threshold: 0.01 });
  if (finiteNonNegative(sample.http.p95Ms) > 500) push({ id: "api.latency-p95", owner: "api-oncall", severity: "warning", signal: "latency", observed: sample.http.p95Ms, threshold: 500 });
  if (finiteNonNegative(sample.jobs.waiting) > 100 || finiteNonNegative(sample.jobs.oldestWaitingSeconds) > 300) {
    push({ id: "jobs.backlog", owner: "platform-oncall", severity: "warning", signal: "queue", observed: Math.max(sample.jobs.waiting, sample.jobs.oldestWaitingSeconds), threshold: "waiting<=100 and oldest<=300s" });
  }
  if (finiteNonNegative(sample.jobs.failed) > 0) push({ id: "jobs.failed", owner: "platform-oncall", severity: "warning", signal: "queue", observed: sample.jobs.failed, threshold: 0 });

  for (const [name, state] of Object.entries(sample.data) as Array<["database" | "storage", DependencyState]>) {
    if (state !== "UP") push({ id: `dependency.${name}`, owner: name === "database" ? "data-oncall" : "platform-oncall", severity: state === "DOWN" ? "critical" : "warning", signal: "dependency", observed: state, threshold: "UP" });
  }

  for (const connector of sample.connectors) {
    const connectorId = safe(connector.connectorId) ?? "invalid-connector";
    if (connector.state === "UNAVAILABLE" || connector.state === "DEGRADED") {
      push({ id: `connector.${connectorId}.health`, owner: "integrations-oncall", severity: connector.state === "UNAVAILABLE" ? "critical" : "warning", signal: "connector", observed: connector.state, threshold: "HEALTHY" });
    }
    if (connector.successRate !== null && finiteNonNegative(connector.successRate) < 0.9) {
      push({ id: `connector.${connectorId}.success`, owner: "integrations-oncall", severity: "warning", signal: "connector", observed: Number(connector.successRate.toFixed(4)), threshold: 0.9 });
    }
    if (finiteNonNegative(connector.selectorDriftCount) > 0) {
      push({ id: `connector.${connectorId}.drift`, owner: "companion-oncall", severity: "warning", signal: "drift", observed: connector.selectorDriftCount, threshold: 0 });
    }
  }

  if (!sample.companion.hostConnected) push({ id: "companion.host", owner: "companion-oncall", severity: "critical", signal: "companion", observed: "DISCONNECTED", threshold: "CONNECTED" });
  if (!sample.companion.extensionPaired) push({ id: "companion.extension", owner: "companion-oncall", severity: "warning", signal: "companion", observed: "UNPAIRED", threshold: "PAIRED" });
  if (finiteNonNegative(sample.companion.reconnectFailures) > 3) push({ id: "companion.reconnect", owner: "companion-oncall", severity: "warning", signal: "companion", observed: sample.companion.reconnectFailures, threshold: 3 });

  return alerts.sort((left, right) => left.id.localeCompare(right.id));
}

export function deriveOperationalState(sample: ObservabilitySample, alerts = evaluateSloAlerts(sample)): OperationalState {
  if (sample.data.database === "DOWN") return "UNAVAILABLE";
  if (!sample.companion.hostConnected || sample.data.storage === "DOWN" || sample.connectors.some(({ state }) => state === "UNAVAILABLE")) return "DEGRADED";
  if (alerts.length > 0) return "PARTIAL_FAILURE";
  return "HEALTHY";
}

export function buildSloDashboard(sample: ObservabilitySample, correlationInput: AlertCorrelationInput = {}) {
  const alerts = evaluateSloAlerts(sample, correlationInput);
  return {
    windowMinutes: Math.max(1, Math.round(finiteNonNegative(sample.windowMinutes))),
    state: deriveOperationalState(sample, alerts),
    alerts,
    summary: {
      firing: alerts.length,
      warning: alerts.filter(({ severity }) => severity === "warning").length,
      critical: alerts.filter(({ severity }) => severity === "critical").length
    }
  };
}

export function alertTransitions(previousAlerts: readonly SloAlert[], currentAlerts: readonly SloAlert[]): AlertTransition[] {
  const previous = new Map(previousAlerts.map((alert) => [alert.id, alert]));
  const current = new Map(currentAlerts.map((alert) => [alert.id, alert]));
  const firing = currentAlerts.filter(({ id }) => !previous.has(id));
  const resolved = [...previous.keys()]
    .filter((id) => !current.has(id))
    .map((id): AlertTransition => ({ ...previous.get(id)!, state: "RESOLVED", observed: "RECOVERED" }));
  return [...firing, ...resolved].sort((left, right) => left.id.localeCompare(right.id));
}
