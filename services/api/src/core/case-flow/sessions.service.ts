import type { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";
import type { CaseFlowPlan, CurrentUser } from "@alwaystrack/shared";
import { recordAuditLog } from "../audit/audit.service.js";

function snapshotCaseId(value: string | null) {
  if (!value) return undefined;
  try { const parsed = JSON.parse(value) as { caseId?: unknown }; return typeof parsed.caseId === "string" ? parsed.caseId : undefined; } catch { return undefined; }
}

export async function createCaseFlowSession(prisma: PrismaClient, actor: CurrentUser, caseId: string, plan: CaseFlowPlan) {
  const serviceCase = await prisma.serviceCase.findFirst({ where: { id: caseId, organizationId: actor.organizationId } });
  if (!serviceCase) throw new Error("NOT_FOUND");
  const primaryVersionId = plan.nodes.find((node) => node.sourceFlowIds.includes(plan.primaryFlowId))?.sourceVersionIds[0];
  const version = primaryVersionId ? await prisma.serviceFlowVersion.findFirst({ where: { id: primaryVersionId, organizationId: actor.organizationId } }) : null;
  if (!version || plan.status !== "READY") throw new Error("PLAN_BLOCKED");
  const session = await prisma.serviceFlowSession.create({ data: {
    id: randomUUID(), organizationId: actor.organizationId, flowId: version.flowId, versionId: version.id, userId: actor.id, status: "OPEN",
    steps: { create: plan.nodes.map((node, visitOrder) => ({ organizationId: actor.organizationId, nodeKey: node.key, visitOrder,
      nodeSnapshotJson: JSON.stringify({ ...node, caseId, planRevision: plan.revision }), status: node.type === "START" ? "DONE" : "PENDING" })) }
  }, include: { steps: { orderBy: { visitOrder: "asc" } } } });
  await recordAuditLog(prisma, { organizationId: actor.organizationId, actorId: actor.id, action: "case_flow.session.started", entityType: "ServiceFlowSession", entityId: session.id,
    metadata: { caseId, planRevision: plan.revision, flowId: version.flowId, versionId: version.id } });
  return session;
}

export async function rewindServiceFlowSession(prisma: PrismaClient, actor: CurrentUser, caseId: string, sessionId: string, nodeKey: string) {
  const session = await prisma.serviceFlowSession.findFirst({ where: { id: sessionId, organizationId: actor.organizationId, userId: actor.id } });
  if (!session) throw new Error("NOT_FOUND");
  const target = await prisma.serviceFlowSessionStep.findFirst({ where: { sessionId, nodeKey, organizationId: actor.organizationId } });
  if (!target || snapshotCaseId(target.nodeSnapshotJson) !== caseId) throw new Error("NOT_FOUND");
  await prisma.serviceFlowSessionStep.updateMany({
    where: { sessionId, organizationId: actor.organizationId, visitOrder: { gte: target.visitOrder } },
    data: { status: "PENDING", completedAt: null }
  });
  await recordAuditLog(prisma, { organizationId: actor.organizationId, actorId: actor.id, action: "service_flow_session.rewind",
    entityType: "ServiceFlowSession", entityId: sessionId, metadata: { caseId, nodeKey, visitOrder: target.visitOrder, versionId: session.versionId } });
  return target;
}

export async function appendServiceFlowSessionChoice(prisma: PrismaClient, actor: CurrentUser, caseId: string, sessionId: string, nodeKey: string, choice: string, plan: CaseFlowPlan) {
  const step = await prisma.serviceFlowSessionStep.findFirst({ where: { sessionId, nodeKey, organizationId: actor.organizationId, session: { userId: actor.id } } });
  if (!step || snapshotCaseId(step.nodeSnapshotJson) !== caseId) throw new Error("NOT_FOUND");
  const history = step.choiceHistoryJson ? JSON.parse(step.choiceHistoryJson) as unknown[] : [];
  history.push({ choice, chosenAt: new Date().toISOString(), actorId: actor.id });
  const transition = plan.transitions.filter((edge) => edge.fromNodeKey === nodeKey).sort((left, right) => left.order - right.order)
    .find((edge) => edge.label === choice) ?? plan.transitions.find((edge) => edge.fromNodeKey === nodeKey && !edge.requiresUserChoice && !edge.condition);
  const updated = await prisma.serviceFlowSessionStep.update({ where: { id: step.id }, data: { status: "DONE", completedAt: new Date(), decision: choice, choiceHistoryJson: JSON.stringify(history) } });
  await recordAuditLog(prisma, { organizationId: actor.organizationId, actorId: actor.id, action: "case_flow.session.choice", entityType: "ServiceFlowSession", entityId: sessionId,
    metadata: { caseId, nodeKey, choice, nextNodeKey: transition?.toNodeKey ?? null, planRevision: plan.revision } });
  return { step: updated, nextNodeKey: transition?.toNodeKey ?? null };
}
