import type { ConnectorId } from "./evidence.js";

export const allowedActionCapabilities = [
  "OPEN_TAB",
  "FOCUS_TAB",
  "NAVIGATE",
  "SEARCH",
  "READ",
  "EXTRACT",
  "COPY"
] as const;
export type AllowedActionCapability = (typeof allowedActionCapabilities)[number];

export const conditionalActionCapabilities = ["INSERT_DRAFT", "FILL_FORM"] as const;
export type ConditionalActionCapability = (typeof conditionalActionCapabilities)[number];

export const forbiddenActionCapabilities = [
  "SUBMIT",
  "SEND_MESSAGE",
  "RESOLVE_CONVERSATION",
  "TRANSFER_CONVERSATION",
  "TABULATE",
  "CHANGE_STATUS",
  "MOVE_OMIE_STATUS",
  "POST_SLACK",
  "CREATE_ORDER",
  "CONFIRM_ORDER",
  "CREATE_RESHIPMENT",
  "CREATE_REVERSE",
  "OPEN_TICKET",
  "OPEN_ACAREACAO",
  "ISSUE_REFUND",
  "CONFIRM_REIMBURSEMENT",
  "CANCEL_ORDER",
  "CHANGE_PAYMENT",
  "CHANGE_ADDRESS",
  "OPEN_BOLETO",
  "TRIGGER_RECOVERY"
] as const;
export type ForbiddenActionCapability = (typeof forbiddenActionCapabilities)[number];

export type ExecutableActionCapability = AllowedActionCapability | ConditionalActionCapability;
export type ActionCapability = ExecutableActionCapability | ForbiddenActionCapability;
export type ActionRisk = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export const actionCapabilityPolicies = {
  OPEN_TAB: { disposition: "ALLOWED", risk: "LOW" },
  FOCUS_TAB: { disposition: "ALLOWED", risk: "LOW" },
  NAVIGATE: { disposition: "ALLOWED", risk: "LOW" },
  SEARCH: { disposition: "ALLOWED", risk: "LOW" },
  READ: { disposition: "ALLOWED", risk: "LOW" },
  EXTRACT: { disposition: "ALLOWED", risk: "MEDIUM" },
  COPY: { disposition: "ALLOWED", risk: "LOW" },
  INSERT_DRAFT: { disposition: "CONDITIONAL", risk: "MEDIUM" },
  FILL_FORM: { disposition: "CONDITIONAL", risk: "HIGH" },
  SUBMIT: { disposition: "FORBIDDEN", risk: "CRITICAL" },
  SEND_MESSAGE: { disposition: "FORBIDDEN", risk: "CRITICAL" },
  RESOLVE_CONVERSATION: { disposition: "FORBIDDEN", risk: "CRITICAL" },
  TRANSFER_CONVERSATION: { disposition: "FORBIDDEN", risk: "HIGH" },
  TABULATE: { disposition: "FORBIDDEN", risk: "HIGH" },
  CHANGE_STATUS: { disposition: "FORBIDDEN", risk: "HIGH" },
  MOVE_OMIE_STATUS: { disposition: "FORBIDDEN", risk: "CRITICAL" },
  POST_SLACK: { disposition: "FORBIDDEN", risk: "HIGH" },
  CREATE_ORDER: { disposition: "FORBIDDEN", risk: "CRITICAL" },
  CONFIRM_ORDER: { disposition: "FORBIDDEN", risk: "CRITICAL" },
  CREATE_RESHIPMENT: { disposition: "FORBIDDEN", risk: "CRITICAL" },
  CREATE_REVERSE: { disposition: "FORBIDDEN", risk: "HIGH" },
  OPEN_TICKET: { disposition: "FORBIDDEN", risk: "HIGH" },
  OPEN_ACAREACAO: { disposition: "FORBIDDEN", risk: "HIGH" },
  ISSUE_REFUND: { disposition: "FORBIDDEN", risk: "CRITICAL" },
  CONFIRM_REIMBURSEMENT: { disposition: "FORBIDDEN", risk: "CRITICAL" },
  CANCEL_ORDER: { disposition: "FORBIDDEN", risk: "CRITICAL" },
  CHANGE_PAYMENT: { disposition: "FORBIDDEN", risk: "CRITICAL" },
  CHANGE_ADDRESS: { disposition: "FORBIDDEN", risk: "HIGH" },
  OPEN_BOLETO: { disposition: "FORBIDDEN", risk: "HIGH" },
  TRIGGER_RECOVERY: { disposition: "FORBIDDEN", risk: "CRITICAL" }
} as const satisfies Record<ActionCapability, { disposition: "ALLOWED" | "CONDITIONAL" | "FORBIDDEN"; risk: ActionRisk }>;

interface ActionContext {
  actionId: string;
  installationId: string;
  browserProfileId: string;
  userId: string;
  caseId: string;
  runId: string;
  connectorId: ConnectorId;
  target: string;
  requestedAt: string;
}

export type ActionRequest = ActionContext & (
  | { capability: AllowedActionCapability; confirmation: { required: false } }
  | {
      capability: ConditionalActionCapability;
      confirmation: { required: true; authorizationRef: string };
    }
);

export interface HumanActionAuthorization {
  authorizationRef: string;
  actionId: string;
  userId: string;
  caseId: string;
  capability: ConditionalActionCapability;
  targetDigest: string;
  issuedAt: string;
  expiresAt: string;
  consumedAt?: string;
}

export type ActionDecision =
  | { allowed: true; actionId: string; capability: AllowedActionCapability; risk: ActionRisk; contextDigest: string; authorizationRef?: never }
  | { allowed: true; actionId: string; capability: ConditionalActionCapability; risk: ActionRisk; contextDigest: string; authorizationRef: string }
  | {
      allowed: false;
      actionId?: string;
      capability: ActionCapability | string;
      risk: ActionRisk;
      contextDigest?: string;
      reason: "FORBIDDEN" | "UNKNOWN" | "CONFIRMATION_REQUIRED" | "AUTHORIZATION_EXPIRED" | "AUTHORIZATION_USED" | "CONTEXT_MISMATCH";
    };

export const actionResultStatuses = ["SUCCEEDED", "BLOCKED", "FAILED", "CANCELLED"] as const;
export type ActionResultStatus = (typeof actionResultStatuses)[number];

export interface ActionAuditResult {
  actionId: string;
  capability: ActionCapability | string;
  connectorId?: ConnectorId;
  caseId: string;
  runId: string;
  status: ActionResultStatus;
  occurredAt: string;
  durationMs?: number;
  reason?: string;
  targetReference?: string;
}

export function actionPolicyFor(capability: string) {
  return Object.prototype.hasOwnProperty.call(actionCapabilityPolicies, capability)
    ? actionCapabilityPolicies[capability as ActionCapability]
    : { disposition: "FORBIDDEN" as const, risk: "CRITICAL" as const };
}
