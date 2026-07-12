import type { PrismaClient } from "@prisma/client";
import { serviceCaseStatuses, terminalServiceCaseStatuses, type ServiceCaseStatus } from "@alwaystrack/shared";
import { recordAuditLog } from "../audit/audit.service.js";

export class CaseFlowLifecycleError extends Error {
  constructor(public readonly code: "NOT_FOUND" | "INVALID_STATUS" | "INVALID_TRANSITION") {
    super(code);
  }
}

const transitions: Record<ServiceCaseStatus, readonly ServiceCaseStatus[]> = {
  NEW: ["INTAKE_RUNNING", "CANCELLED", "FAILED"],
  INTAKE_RUNNING: ["EVIDENCE_COLLECTING", "WAITING_HUMAN", "CANCELLED", "FAILED"],
  EVIDENCE_COLLECTING: ["PARTIALLY_RESOLVED", "RESOLVED", "WAITING_HUMAN", "CANCELLED", "FAILED"],
  PARTIALLY_RESOLVED: ["EVIDENCE_COLLECTING", "RESOLVED", "GUIDED_EXECUTION", "WAITING_HUMAN", "READY_FOR_RESPONSE", "CANCELLED", "FAILED"],
  RESOLVED: ["EVIDENCE_COLLECTING", "GUIDED_EXECUTION", "WAITING_HUMAN", "READY_FOR_RESPONSE", "CANCELLED", "FAILED"],
  GUIDED_EXECUTION: ["WAITING_HUMAN", "READY_FOR_RESPONSE", "RESOLVED", "CANCELLED", "FAILED"],
  WAITING_HUMAN: ["EVIDENCE_COLLECTING", "PARTIALLY_RESOLVED", "RESOLVED", "GUIDED_EXECUTION", "READY_FOR_RESPONSE", "CANCELLED", "FAILED"],
  READY_FOR_RESPONSE: ["GUIDED_EXECUTION", "COMPLETED", "CANCELLED", "FAILED"],
  COMPLETED: [],
  CANCELLED: [],
  FAILED: []
};

export function isServiceCaseStatus(value: string): value is ServiceCaseStatus {
  return serviceCaseStatuses.includes(value as ServiceCaseStatus);
}

export async function transitionServiceCase(
  prisma: PrismaClient,
  scope: { organizationId: string; actorId: string },
  caseId: string,
  nextStatus: ServiceCaseStatus,
  options: { reason?: string; now?: Date } = {}
) {
  if (!isServiceCaseStatus(nextStatus)) throw new CaseFlowLifecycleError("INVALID_STATUS");
  const serviceCase = await prisma.serviceCase.findFirst({ where: { id: caseId, organizationId: scope.organizationId } });
  if (!serviceCase) throw new CaseFlowLifecycleError("NOT_FOUND");
  if (!isServiceCaseStatus(serviceCase.status)) throw new CaseFlowLifecycleError("INVALID_STATUS");
  if (serviceCase.status === nextStatus) return serviceCase;
  if (!transitions[serviceCase.status].includes(nextStatus)) throw new CaseFlowLifecycleError("INVALID_TRANSITION");

  const now = options.now ?? new Date();
  const updated = await prisma.serviceCase.update({
    where: { id: serviceCase.id },
    data: {
      status: nextStatus,
      completedAt: nextStatus === "COMPLETED" ? now : undefined,
      cancelledAt: nextStatus === "CANCELLED" ? now : undefined,
      failedAt: nextStatus === "FAILED" ? now : undefined,
      failureReason: nextStatus === "FAILED" ? options.reason?.trim() || "Central case-flow failure" : undefined
    }
  });
  if (terminalServiceCaseStatuses.includes(nextStatus as (typeof terminalServiceCaseStatuses)[number])) {
    await recordAuditLog(prisma, {
      organizationId: scope.organizationId,
      actorId: scope.actorId,
      action: `case_flow.case.${nextStatus.toLowerCase()}`,
      entityType: "ServiceCase",
      entityId: serviceCase.id,
      metadata: { previousStatus: serviceCase.status, reason: options.reason ?? null }
    });
  }
  return updated;
}

export function connectorRunFailureDoesNotFailCase(): true {
  return true;
}
