export const connectorDiagnosticCodes = ["SELECTOR_DRIFT", "UNEXPECTED_PAGE"] as const;
export type ConnectorDiagnosticCode = (typeof connectorDiagnosticCodes)[number];

export interface ConnectorDiagnosticInput {
  connectorId: string;
  connectorVersion: string;
  selectorVersion?: string;
  code: ConnectorDiagnosticCode;
  pageKind?: string;
  durationMs?: number;
  occurredAt: string;
  caseId: string;
  runId: string;
  url?: string;
  html?: string;
  screenshot?: string;
}

export interface RedactedConnectorDiagnostic {
  connectorId: string;
  connectorVersion: string;
  selectorVersion?: string;
  code: ConnectorDiagnosticCode;
  pageKind?: string;
  durationMs?: number;
  occurredAt: string;
  caseId: string;
  runId: string;
}

export function redactConnectorDiagnostic(input: ConnectorDiagnosticInput): RedactedConnectorDiagnostic {
  return {
    connectorId: input.connectorId,
    connectorVersion: input.connectorVersion,
    selectorVersion: input.selectorVersion,
    code: input.code,
    pageKind: input.pageKind,
    durationMs: input.durationMs,
    occurredAt: input.occurredAt,
    caseId: input.caseId,
    runId: input.runId
  };
}

export function degradedHealthFromDiagnostic(input: ConnectorDiagnosticInput) {
  return {
    connectorId: input.connectorId,
    state: "DEGRADED" as const,
    version: input.connectorVersion,
    checkedAt: input.occurredAt,
    lastSelectorDriftAt: input.code === "SELECTOR_DRIFT" ? input.occurredAt : undefined
  };
}

export const hostDiagnosticsLayerReady = true;
export * from "./offline-simulator.js";
export * from "./slo.js";

export const caseFlowSloTargetsMs = { sidePanelInteractive: 500, intakeVisible: 2_000, firstPartialSummary: 3_000, firstActionableFlow: 5_000, slowConnector: 10_000, connectorTimeout: 30_000 } as const;
export function caseFlowSloDiagnostic(milestone: keyof typeof caseFlowSloTargetsMs, durationMs: number) {
  const targetMs = caseFlowSloTargetsMs[milestone];
  return { milestone, durationMs: Math.max(0, Math.round(durationMs)), targetMs, met: durationMs <= targetMs };
}

export type LocalPreflightState = "READY" | "BLOCKED_AUTH" | "UNAVAILABLE";
export interface LocalConnectorProbe { connectorId: string; probeLocal(): Promise<{ state: LocalPreflightState; version: string; detail?: string }>; }
export interface LocalPreflightInput { enabled: boolean; hostActive: boolean; extensionPaired: boolean; activeProfile: boolean; probes: readonly LocalConnectorProbe[]; now?: () => number; }
export async function runLocalPreflight(input: LocalPreflightInput) {
  if (!input.enabled) return { enabled: false, ready: false, checkedAt: new Date((input.now ?? Date.now)()).toISOString(), connectors: [] };
  const connectors = await Promise.all(input.probes.map(async (probe) => ({ connectorId: probe.connectorId, ...await probe.probeLocal() })));
  return { enabled: true, ready: input.hostActive && input.extensionPaired && input.activeProfile, checkedAt: new Date((input.now ?? Date.now)()).toISOString(), hostActive: input.hostActive, extensionPaired: input.extensionPaired, activeProfile: input.activeProfile, connectors };
}
