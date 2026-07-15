import {
  actionCapabilityPolicies,
  actionPolicyFor,
  type ActionAuditResult,
  type ActionCapability,
  type ActionDecision,
  type ActionRisk,
  type ExecutableActionCapability,
  type HumanActionAuthorization
} from "../case-flow/action-capabilities.js";
import type { ConnectorId } from "../case-flow/evidence.js";

export interface ActionFirewallAttempt {
  actionId?: string;
  installationId?: string;
  browserProfileId?: string;
  userId?: string;
  caseId?: string;
  runId?: string;
  connectorId?: ConnectorId | string;
  capability: ActionCapability | string;
  target?: string;
  risk?: ActionRisk | string;
  confirmation?: { required?: boolean; authorizationRef?: string };
  requestedAt?: string;
}

export interface ActionFirewallScope {
  connectorId: ConnectorId;
  nodeCapabilities: readonly ExecutableActionCapability[];
  connectorCapabilities: readonly ExecutableActionCapability[];
  target: string;
  targetDigest: string;
  contextDigest: string;
  authorization?: HumanActionAuthorization;
  now?: string;
}

export type ActionFirewallResult =
  | { decision: Extract<ActionDecision, { allowed: true }>; audit?: never }
  | { decision: Extract<ActionDecision, { allowed: false }>; audit: ActionAuditResult };

function blocked(
  attempt: ActionFirewallAttempt,
  scope: ActionFirewallScope,
  reason: Extract<ActionDecision, { allowed: false }>["reason"]
): ActionFirewallResult {
  const policy = actionPolicyFor(attempt.capability);
  const occurredAt = scope.now ?? new Date().toISOString();
  const decision: Extract<ActionDecision, { allowed: false }> = {
    allowed: false,
    actionId: attempt.actionId,
    capability: attempt.capability,
    risk: policy.risk,
    contextDigest: scope.contextDigest || undefined,
    reason
  };
  return {
    decision,
    audit: {
      actionId: attempt.actionId ?? "UNKNOWN_ACTION",
      capability: attempt.capability,
      connectorId: typeof attempt.connectorId === "string" && attempt.connectorId ? attempt.connectorId as ConnectorId : undefined,
      caseId: attempt.caseId ?? "UNKNOWN_CASE",
      runId: attempt.runId ?? "UNKNOWN_RUN",
      status: "BLOCKED",
      occurredAt,
      reason,
      targetReference: scope.targetDigest || undefined
    }
  };
}

function hasRequiredContext(attempt: ActionFirewallAttempt, scope: ActionFirewallScope): boolean {
  return Boolean(
    attempt.actionId && attempt.installationId && attempt.browserProfileId && attempt.userId && attempt.caseId &&
    attempt.runId && attempt.connectorId && attempt.target && attempt.requestedAt && scope.target &&
    scope.targetDigest && scope.contextDigest
  );
}

export function enforceActionFirewall(attempt: ActionFirewallAttempt, scope: ActionFirewallScope): ActionFirewallResult {
  const policy = actionPolicyFor(attempt.capability);
  if (policy.disposition === "FORBIDDEN") {
    const known = Object.prototype.hasOwnProperty.call(actionCapabilityPolicies, attempt.capability);
    return blocked(attempt, scope, known ? "FORBIDDEN" : "UNKNOWN");
  }

  if (!hasRequiredContext(attempt, scope) || attempt.connectorId !== scope.connectorId || attempt.target !== scope.target || attempt.risk !== policy.risk) {
    return blocked(attempt, scope, "CONTEXT_MISMATCH");
  }
  if (!scope.nodeCapabilities.includes(attempt.capability as ExecutableActionCapability) ||
      !scope.connectorCapabilities.includes(attempt.capability as ExecutableActionCapability)) {
    return blocked(attempt, scope, "FORBIDDEN");
  }

  if (policy.disposition === "ALLOWED") {
    if (attempt.confirmation?.required !== false || attempt.confirmation.authorizationRef) {
      return blocked(attempt, scope, "CONTEXT_MISMATCH");
    }
    return { decision: { allowed: true, actionId: attempt.actionId!, capability: attempt.capability as never, risk: policy.risk, contextDigest: scope.contextDigest } };
  }

  const authorization = scope.authorization;
  if (!attempt.confirmation?.required || !attempt.confirmation.authorizationRef || !authorization) {
    return blocked(attempt, scope, "CONFIRMATION_REQUIRED");
  }
  if (authorization.consumedAt) return blocked(attempt, scope, "AUTHORIZATION_USED");
  const now = Date.parse(scope.now ?? new Date().toISOString());
  const expiresAt = Date.parse(authorization.expiresAt);
  if (!Number.isFinite(now) || !Number.isFinite(expiresAt) || expiresAt <= now) {
    return blocked(attempt, scope, "AUTHORIZATION_EXPIRED");
  }
  if (
    authorization.authorizationRef !== attempt.confirmation.authorizationRef || authorization.actionId !== attempt.actionId ||
    authorization.userId !== attempt.userId || authorization.caseId !== attempt.caseId ||
    authorization.capability !== attempt.capability || authorization.targetDigest !== scope.targetDigest
  ) return blocked(attempt, scope, "CONTEXT_MISMATCH");

  return {
    decision: {
      allowed: true,
      actionId: attempt.actionId!,
      capability: attempt.capability as never,
      risk: policy.risk,
      contextDigest: scope.contextDigest,
      authorizationRef: authorization.authorizationRef
    }
  };
}
