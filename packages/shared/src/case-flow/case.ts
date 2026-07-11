export const serviceCaseStatuses = [
  "NEW",
  "INTAKE_RUNNING",
  "EVIDENCE_COLLECTING",
  "PARTIALLY_RESOLVED",
  "RESOLVED",
  "GUIDED_EXECUTION",
  "WAITING_HUMAN",
  "READY_FOR_RESPONSE",
  "COMPLETED",
  "CANCELLED",
  "FAILED"
] as const;

export type ServiceCaseStatus = (typeof serviceCaseStatuses)[number];

export const terminalServiceCaseStatuses = ["COMPLETED", "CANCELLED", "FAILED"] as const satisfies readonly ServiceCaseStatus[];
export type TerminalServiceCaseStatus = (typeof terminalServiceCaseStatuses)[number];

export const serviceCaseSourceKinds = ["ALWAYSCHAT", "MANUAL"] as const;
export type ServiceCaseSourceKind = (typeof serviceCaseSourceKinds)[number];

export interface ServiceCaseSource {
  id: string;
  caseId: string;
  kind: ServiceCaseSourceKind;
  sourceReference: string;
  sourceUrl?: string;
  observedAt: string;
}

export interface ServiceCase {
  id: string;
  organizationId: string;
  createdByUserId: string;
  status: ServiceCaseStatus;
  primarySourceId?: string;
  summary?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  cancelledAt?: string;
  failedAt?: string;
  failureReason?: string;
}
