import type { PrismaClient } from "@prisma/client";
import type { CurrentUser } from "@alwaystrack/shared";
import { recordAuditLog } from "../audit/audit.service.js";

export async function rewindServiceFlowSession(prisma: PrismaClient, actor: CurrentUser, sessionId: string, nodeKey: string) {
  const session = await prisma.serviceFlowSession.findFirst({ where: { id: sessionId, organizationId: actor.organizationId, userId: actor.id } });
  if (!session) throw new Error("NOT_FOUND");
  const target = await prisma.serviceFlowSessionStep.findFirst({ where: { sessionId, nodeKey, organizationId: actor.organizationId } });
  if (!target) throw new Error("NOT_FOUND");
  await prisma.serviceFlowSessionStep.updateMany({
    where: { sessionId, organizationId: actor.organizationId, visitOrder: { gte: target.visitOrder } },
    data: { status: "PENDING", completedAt: null }
  });
  await recordAuditLog(prisma, { organizationId: actor.organizationId, actorId: actor.id, action: "service_flow_session.rewind",
    entityType: "ServiceFlowSession", entityId: sessionId, metadata: { nodeKey, visitOrder: target.visitOrder, versionId: session.versionId } });
  return target;
}

export async function appendServiceFlowSessionChoice(prisma: PrismaClient, actor: CurrentUser, sessionId: string, nodeKey: string, choice: string) {
  const step = await prisma.serviceFlowSessionStep.findFirst({ where: { sessionId, nodeKey, organizationId: actor.organizationId, session: { userId: actor.id } } });
  if (!step) throw new Error("NOT_FOUND");
  const history = step.choiceHistoryJson ? JSON.parse(step.choiceHistoryJson) as unknown[] : [];
  history.push({ choice, chosenAt: new Date().toISOString(), actorId: actor.id });
  return prisma.serviceFlowSessionStep.update({ where: { id: step.id }, data: { decision: choice, choiceHistoryJson: JSON.stringify(history) } });
}
