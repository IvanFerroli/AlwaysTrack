import type { PrismaClient } from "@prisma/client";
import { stringifyCaseFlowJson, type ControlledJsonValue } from "./persistence.js";

export const connectorRunStatuses = ["QUEUED", "WAITING_DEPENDENCY", "OPENING", "NAVIGATING", "SEARCHING", "READING", "NORMALIZING", "COMPLETE", "PARTIAL", "NOT_APPLICABLE", "NOT_FOUND", "BLOCKED_AUTH", "BLOCKED_CAPTCHA", "BLOCKED_2FA", "FAILED_SELECTOR_DRIFT", "FAILED_TIMEOUT", "FAILED_UNEXPECTED_PAGE", "CANCELLED"] as const;
export type ConnectorRunStatus = (typeof connectorRunStatuses)[number];
const terminalStatuses = new Set<ConnectorRunStatus>(["COMPLETE", "PARTIAL", "NOT_APPLICABLE", "NOT_FOUND", "BLOCKED_AUTH", "BLOCKED_CAPTCHA", "BLOCKED_2FA", "FAILED_SELECTOR_DRIFT", "FAILED_TIMEOUT", "FAILED_UNEXPECTED_PAGE", "CANCELLED"]);

export class ConnectorRunError extends Error {
  constructor(public readonly code: "NOT_FOUND" | "INVALID_INPUT" | "SCOPE_MISMATCH" | "IDEMPOTENCY_CONFLICT") { super(code); }
}

export interface StartConnectorRunInput { runId: string; connectorDefinitionId: string; installationId: string; userId: string; browserProfileId: string; wave?: number; }

export async function startConnectorRun(prisma: PrismaClient, scope: { organizationId: string }, caseId: string, input: StartConnectorRunInput) {
  if (!input.runId.trim()) throw new ConnectorRunError("INVALID_INPUT");
  const [serviceCase, definition, installation, existing] = await Promise.all([
    prisma.serviceCase.findFirst({ where: { id: caseId, organizationId: scope.organizationId }, select: { id: true } }),
    prisma.connectorDefinition.findFirst({ where: { id: input.connectorDefinitionId, organizationId: scope.organizationId, enabled: true }, select: { id: true } }),
    prisma.companionInstallation.findFirst({ where: { id: input.installationId, organizationId: scope.organizationId, userId: input.userId, browserProfileId: input.browserProfileId, status: "ACTIVE" }, select: { id: true } }),
    prisma.connectorRun.findUnique({ where: { id: input.runId } })
  ]);
  if (!serviceCase || !definition || !installation) throw new ConnectorRunError("SCOPE_MISMATCH");
  if (existing) {
    if (existing.organizationId !== scope.organizationId || existing.caseId !== caseId || existing.connectorDefinitionId !== input.connectorDefinitionId) throw new ConnectorRunError("IDEMPOTENCY_CONFLICT");
    return existing;
  }
  return prisma.connectorRun.create({ data: { id: input.runId, organizationId: scope.organizationId, caseId, connectorDefinitionId: input.connectorDefinitionId, installationId: input.installationId, userId: input.userId, browserProfileId: input.browserProfileId, wave: input.wave, status: "QUEUED" } });
}

export async function startApplicableConnectorRuns(prisma: PrismaClient, scope: { organizationId: string }, caseId: string, inputs: StartConnectorRunInput[]) {
  const connectorIds = inputs.map((input) => input.connectorDefinitionId);
  if (new Set(connectorIds).size !== connectorIds.length) throw new ConnectorRunError("INVALID_INPUT");
  return Promise.all(inputs.map((input) => startConnectorRun(prisma, scope, caseId, input)));
}

export async function finishConnectorRun(prisma: PrismaClient, scope: { organizationId: string }, caseId: string, runId: string, input: { status: ConnectorRunStatus; warnings?: ControlledJsonValue[]; diagnostics?: ControlledJsonValue; interventionCode?: string; failureMessage?: string; finishedAt?: Date }) {
  if (!terminalStatuses.has(input.status)) throw new ConnectorRunError("INVALID_INPUT");
  const run = await prisma.connectorRun.findFirst({ where: { id: runId, caseId, organizationId: scope.organizationId } });
  if (!run) throw new ConnectorRunError("NOT_FOUND");
  if (terminalStatuses.has(run.status as ConnectorRunStatus)) {
    if (run.status !== input.status) throw new ConnectorRunError("IDEMPOTENCY_CONFLICT");
    return run;
  }
  return prisma.connectorRun.update({ where: { id: run.id }, data: { status: input.status, warningsJson: input.warnings ? stringifyCaseFlowJson("CONNECTOR_WARNINGS", input.warnings) : undefined, diagnosticsJson: input.diagnostics ? stringifyCaseFlowJson("CONNECTOR_DIAGNOSTICS", input.diagnostics) : undefined, interventionCode: input.interventionCode, failureMessage: input.failureMessage, finishedAt: input.finishedAt ?? new Date() } });
}

export async function retryConnectorRun(prisma: PrismaClient, scope: { organizationId: string }, caseId: string, previousRunId: string, runId: string) {
  const previous = await prisma.connectorRun.findFirst({ where: { id: previousRunId, caseId, organizationId: scope.organizationId } });
  if (!previous || !terminalStatuses.has(previous.status as ConnectorRunStatus)) throw new ConnectorRunError("NOT_FOUND");
  return startConnectorRun(prisma, scope, caseId, { runId, connectorDefinitionId: previous.connectorDefinitionId, installationId: previous.installationId, userId: previous.userId, browserProfileId: previous.browserProfileId, wave: previous.wave ?? undefined });
}
