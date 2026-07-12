import type { ConnectorId } from "../case-flow/evidence.js";

export interface PrePairingEnvelope {
  protocolVersion: string;
  messageId: string;
  timestamp: string;
  extensionInstanceId: string;
}

export interface CompanionEnvelopeBase {
  protocolVersion: string;
  messageId: string;
  timestamp: string;
  installationId: string;
  browserProfileId: string;
  userId: string;
}

export interface CaseEnvelope extends CompanionEnvelopeBase {
  caseId: string;
}

export interface RunEnvelope extends CaseEnvelope {
  runId: string;
  connectorId: ConnectorId;
}
