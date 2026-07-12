import type { EvidenceFact } from "../case-flow/evidence.js";
import type { ConnectorId } from "../case-flow/evidence.js";
import type { Intervention } from "./intervention.js";

export const connectorRunStatuses = [
  "QUEUED",
  "WAITING_DEPENDENCY",
  "OPENING",
  "NAVIGATING",
  "SEARCHING",
  "READING",
  "NORMALIZING",
  "COMPLETE",
  "PARTIAL",
  "NOT_APPLICABLE",
  "NOT_FOUND",
  "BLOCKED_AUTH",
  "BLOCKED_CAPTCHA",
  "BLOCKED_2FA",
  "FAILED_SELECTOR_DRIFT",
  "FAILED_TIMEOUT",
  "FAILED_UNEXPECTED_PAGE",
  "CANCELLED"
] as const;
export type ConnectorRunStatus = (typeof connectorRunStatuses)[number];

export const connectorTerminalStatuses = [
  "COMPLETE",
  "PARTIAL",
  "NOT_APPLICABLE",
  "NOT_FOUND",
  "BLOCKED_AUTH",
  "BLOCKED_CAPTCHA",
  "BLOCKED_2FA",
  "FAILED_SELECTOR_DRIFT",
  "FAILED_TIMEOUT",
  "FAILED_UNEXPECTED_PAGE",
  "CANCELLED"
] as const satisfies readonly ConnectorRunStatus[];
export type ConnectorTerminalStatus = (typeof connectorTerminalStatuses)[number];

export interface ConnectorWarning {
  code: string;
  message: string;
  field?: string;
}

export interface ConnectorDiagnostics {
  connectorVersion: string;
  selectorVersion?: string;
  pageKind?: string;
  durationMs?: number;
  cacheAgeMs?: number;
  redactedReference?: string;
}

export interface ConnectorResult {
  connectorId: ConnectorId;
  runId: string;
  status: ConnectorTerminalStatus;
  startedAt: string;
  finishedAt?: string;
  facts: EvidenceFact[];
  warnings: ConnectorWarning[];
  intervention?: Intervention;
  diagnostics?: ConnectorDiagnostics;
}
