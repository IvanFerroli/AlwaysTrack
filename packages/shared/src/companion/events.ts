import type { ActionAuditResult, HumanActionAuthorization } from "../case-flow/action-capabilities.js";
import type { EvidenceFact } from "../case-flow/evidence.js";
import type { ConnectorHealth, SearchPlan } from "../connectors/connector.js";
import type { ConnectorResult, ConnectorRunStatus } from "../connectors/execution.js";
import type { Intervention, InterventionAction } from "../connectors/intervention.js";
import type { CaseEnvelope, CompanionEnvelopeBase, PrePairingEnvelope, RunEnvelope } from "./envelope.js";

export const companionEventTypes = [
  "COMPANION_HELLO",
  "COMPANION_PAIRED",
  "BROWSER_READY",
  "START_CASE",
  "CASE_INTAKE",
  "RUN_CONNECTOR",
  "CONNECTOR_PROGRESS",
  "CONNECTOR_RESULT",
  "INTERVENTION_REQUIRED",
  "INTERVENTION_RESOLVED",
  "INSERT_DRAFT",
  "DRAFT_INSERTED",
  "CANCEL_RUN",
  "HEALTH_REPORT"
] as const;
export type CompanionEventType = (typeof companionEventTypes)[number];

export type CompanionHelloEvent = PrePairingEnvelope & {
  type: "COMPANION_HELLO";
  payload: { supportedProtocolVersions: string[]; pairingChallengeId?: string };
};

export type CompanionPairedEvent = CompanionEnvelopeBase & {
  type: "COMPANION_PAIRED";
  payload: { sessionId: string; expiresAt: string };
};

export type BrowserReadyEvent = CompanionEnvelopeBase & {
  type: "BROWSER_READY";
  payload: { extensionVersion: string; activeProfile: boolean };
};

export type StartCaseEvent = CaseEnvelope & {
  type: "START_CASE";
  payload: { conversationReference: string };
};

export type CaseIntakeEvent = CaseEnvelope & {
  type: "CASE_INTAKE";
  payload: { facts: EvidenceFact[]; partial: boolean };
};

export type RunConnectorEvent = RunEnvelope & {
  type: "RUN_CONNECTOR";
  payload: { plan: Omit<SearchPlan, "connectorId" | "runId"> };
};

export type ConnectorProgressEvent = RunEnvelope & {
  type: "CONNECTOR_PROGRESS";
  payload: { status: ConnectorRunStatus; message?: string; occurredAt: string };
};

export type ConnectorResultEvent = RunEnvelope & {
  type: "CONNECTOR_RESULT";
  payload: { result: Omit<ConnectorResult, "connectorId" | "runId"> };
};

export type InterventionRequiredEvent = RunEnvelope & {
  type: "INTERVENTION_REQUIRED";
  payload: { intervention: Omit<Intervention, "connectorId" | "runId"> };
};

export type InterventionResolvedEvent = RunEnvelope & {
  type: "INTERVENTION_RESOLVED";
  payload: { interventionId: string; action: InterventionAction; resolvedAt: string };
};

export type InsertDraftEvent = RunEnvelope & {
  type: "INSERT_DRAFT";
  payload: { text: string; authorization: Pick<HumanActionAuthorization, "authorizationRef" | "actionId" | "expiresAt"> };
};

export type DraftInsertedEvent = RunEnvelope & {
  type: "DRAFT_INSERTED";
  payload: { result: Omit<ActionAuditResult, "connectorId" | "caseId" | "runId"> };
};

export type CancelRunEvent = RunEnvelope & {
  type: "CANCEL_RUN";
  payload: { reason: "USER_CANCELLED" | "CASE_CANCELLED" | "TIMEOUT" | "SECURITY" };
};

export type HealthReportEvent = CompanionEnvelopeBase & {
  type: "HEALTH_REPORT";
  payload: { hostVersion: string; extensionVersion?: string; connectors: ConnectorHealth[]; reportedAt: string };
};

export type CompanionEvent =
  | CompanionHelloEvent
  | CompanionPairedEvent
  | BrowserReadyEvent
  | StartCaseEvent
  | CaseIntakeEvent
  | RunConnectorEvent
  | ConnectorProgressEvent
  | ConnectorResultEvent
  | InterventionRequiredEvent
  | InterventionResolvedEvent
  | InsertDraftEvent
  | DraftInsertedEvent
  | CancelRunEvent
  | HealthReportEvent;

export type ExtensionToHostEvent =
  | CompanionHelloEvent
  | BrowserReadyEvent
  | CaseIntakeEvent
  | ConnectorProgressEvent
  | ConnectorResultEvent
  | InterventionRequiredEvent
  | InterventionResolvedEvent
  | DraftInsertedEvent;

export type HostToExtensionEvent = CompanionPairedEvent | StartCaseEvent | RunConnectorEvent | InsertDraftEvent | CancelRunEvent;

export type HostToCoreEvent =
  | CaseIntakeEvent
  | ConnectorProgressEvent
  | ConnectorResultEvent
  | InterventionRequiredEvent
  | InterventionResolvedEvent
  | DraftInsertedEvent
  | HealthReportEvent;

export type CoreToHostEvent = StartCaseEvent | RunConnectorEvent | InsertDraftEvent | CancelRunEvent;

export function assertNeverCompanionEvent(event: never): never {
  void event;
  throw new Error("Unhandled Companion event type");
}
