import { randomUUID } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import type { CurrentUser } from "@alwaystrack/shared";
import { recordAuditLog } from "../audit/audit.service.js";
import { resolveCase } from "./resolve.service.js";

export const humanOverrideKinds = ["MANUAL_EVIDENCE", "CONFLICT_RESOLUTION", "FLOW_CLASSIFICATION"] as const;
export type HumanOverrideKind = (typeof humanOverrideKinds)[number];
export type CorrectionCause = "CONNECTOR_GAP" | "RULE_ERROR" | "HUMAN_DECISION";
export const correctionCauses = ["CONNECTOR_GAP", "RULE_ERROR", "HUMAN_DECISION"] as const;

export class HumanOverrideError extends Error {
  constructor(public readonly code: "NOT_FOUND" | "INVALID_INPUT" | "ALREADY_UNDONE" | "SCOPE_MISMATCH") { super(code); }
}

export interface HumanOverrideRecord {
  id: string;
  organizationId: string;
  caseId: string;
  actorId: string;
  kind: HumanOverrideKind;
  reason: string;
  cause: CorrectionCause;
  createdAt: Date;
  payload: Record<string, unknown>;
}

const actionByKind: Record<HumanOverrideKind, string> = {
  MANUAL_EVIDENCE: "case_flow.override.manual_evidence.created",
  CONFLICT_RESOLUTION: "case_flow.override.conflict_resolution.created",
  FLOW_CLASSIFICATION: "case_flow.override.flow_classification.created"
};

function parseMetadata(value: string | null): Record<string, unknown> {
  if (!value) return {};
  const parsed: unknown = JSON.parse(value);
  return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {};
}

export async function assertCaseScope(prisma: PrismaClient, actor: CurrentUser, caseId: string) {
  const serviceCase = await prisma.serviceCase.findFirst({ where: { id: caseId, organizationId: actor.organizationId }, select: { id: true } });
  if (!serviceCase) throw new HumanOverrideError("NOT_FOUND");
  return serviceCase;
}

export async function recordHumanOverride(
  prisma: PrismaClient,
  actor: CurrentUser,
  caseId: string,
  input: { id?: string; kind: HumanOverrideKind; reason: string; cause: CorrectionCause; payload: Record<string, unknown>; now?: Date }
): Promise<HumanOverrideRecord> {
  const reason = input.reason.trim();
  if (!reason || !humanOverrideKinds.includes(input.kind) || !correctionCauses.includes(input.cause)) throw new HumanOverrideError("INVALID_INPUT");
  await assertCaseScope(prisma, actor, caseId);
  const id = input.id ?? randomUUID();
  const createdAt = input.now ?? new Date();
  await recordAuditLog(prisma, {
    organizationId: actor.organizationId,
    actorId: actor.id,
    action: actionByKind[input.kind],
    entityType: "CaseFlowHumanOverride",
    entityId: id,
    metadata: { caseId, reason, cause: input.cause, kind: input.kind, payload: input.payload, createdAt: createdAt.toISOString() }
  });
  return { id, organizationId: actor.organizationId, caseId, actorId: actor.id, kind: input.kind, reason, cause: input.cause, createdAt, payload: input.payload };
}

export async function getActiveFlowOverride(prisma: PrismaClient, actor: CurrentUser, caseId: string) {
  const events = await prisma.auditLog.findMany({
    where: { organizationId: actor.organizationId, entityType: "CaseFlowHumanOverride", action: { in: [actionByKind.FLOW_CLASSIFICATION, "case_flow.override.undone"] } },
    orderBy: { createdAt: "asc" }
  });
  const undone = new Set(events.filter((event) => event.action === "case_flow.override.undone").map((event) => String(parseMetadata(event.metadataJson).targetOverrideId ?? "")));
  return events.reverse().find((event) => {
    const metadata = parseMetadata(event.metadataJson);
    return event.action === actionByKind.FLOW_CLASSIFICATION && metadata.caseId === caseId && !undone.has(event.entityId);
  });
}

export async function getCaseOverrideState(prisma: PrismaClient, actor: CurrentUser, caseId: string) {
  const events = await prisma.auditLog.findMany({
    where: { organizationId: actor.organizationId, entityType: "CaseFlowHumanOverride" },
    orderBy: { createdAt: "asc" }
  });
  const undone = new Set(events.filter((event) => event.action === "case_flow.override.undone").map((event) => String(parseMetadata(event.metadataJson).targetOverrideId ?? "")));
  const byId = new Map(events.map((event) => [event.entityId, event]));
  const active = events.filter((event) => event.action.endsWith(".created") && parseMetadata(event.metadataJson).caseId === caseId && !undone.has(event.entityId));
  const undoneManualFactIds = new Set([...undone].flatMap((id) => {
    const metadata = parseMetadata(byId.get(id)?.metadataJson ?? null);
    const payload = metadata.payload as Record<string, unknown> | undefined;
    return metadata.kind === "MANUAL_EVIDENCE" && typeof payload?.factId === "string" ? [payload.factId] : [];
  }));
  const flowEvent = [...active].reverse().find((event) => parseMetadata(event.metadataJson).kind === "FLOW_CLASSIFICATION");
  const flowPayload = flowEvent ? parseMetadata(flowEvent.metadataJson).payload as Record<string, unknown> | undefined : undefined;
  return {
    undoneManualFactIds,
    flow: flowEvent && typeof flowPayload?.chosenFlowId === "string"
      ? { overrideId: flowEvent.entityId, chosenFlowId: flowPayload.chosenFlowId, suggestedFlowId: String(flowPayload.suggestedFlowId ?? "") }
      : null
  };
}

export async function createFlowClassificationOverride(
  prisma: PrismaClient,
  actor: CurrentUser,
  caseId: string,
  input: { suggestedFlowId: string; chosenFlowId: string; reason: string; cause?: CorrectionCause; markCandidateIncorrect?: boolean; recompute?: boolean }
) {
  if (!input.suggestedFlowId.trim() || !input.chosenFlowId.trim()) throw new HumanOverrideError("INVALID_INPUT");
  const override = await recordHumanOverride(prisma, actor, caseId, {
    kind: "FLOW_CLASSIFICATION", reason: input.reason, cause: input.cause ?? "RULE_ERROR",
    payload: { suggestedFlowId: input.suggestedFlowId.trim(), chosenFlowId: input.chosenFlowId.trim(), markCandidateIncorrect: input.markCandidateIncorrect === true }
  });
  return { override, recomputed: input.recompute ? await resolveCase(prisma, actor, caseId) : null };
}

export async function undoHumanOverride(
  prisma: PrismaClient,
  actor: CurrentUser,
  caseId: string,
  overrideId: string,
  input: { reason: string; recompute?: boolean }
) {
  const reason = input.reason.trim();
  if (!reason) throw new HumanOverrideError("INVALID_INPUT");
  await assertCaseScope(prisma, actor, caseId);
  const target = await prisma.auditLog.findFirst({ where: { organizationId: actor.organizationId, entityType: "CaseFlowHumanOverride", entityId: overrideId } });
  if (!target || target.action === "case_flow.override.undone") throw new HumanOverrideError("NOT_FOUND");
  const metadata = parseMetadata(target.metadataJson);
  if (metadata.caseId !== caseId) throw new HumanOverrideError("SCOPE_MISMATCH");
  const undoEvents = await prisma.auditLog.findMany({ where: { organizationId: actor.organizationId, action: "case_flow.override.undone", entityType: "CaseFlowHumanOverride" } });
  if (undoEvents.some((event) => parseMetadata(event.metadataJson).targetOverrideId === overrideId)) throw new HumanOverrideError("ALREADY_UNDONE");

  if (metadata.kind === "CONFLICT_RESOLUTION") {
    const payload = metadata.payload as Record<string, unknown> | undefined;
    const conflictId = typeof payload?.conflictId === "string" ? payload.conflictId : "";
    const conflict = await prisma.evidenceConflict.findFirst({ where: { id: conflictId, caseId, organizationId: actor.organizationId } });
    if (!conflict) throw new HumanOverrideError("SCOPE_MISMATCH");
    await prisma.evidenceConflict.update({ where: { id: conflict.id }, data: { status: "OPEN", chosenFactId: null, resolutionReason: null, resolvedByKind: null, resolvedByUserId: null, resolvedAt: null } });
  }
  await recordAuditLog(prisma, {
    organizationId: actor.organizationId, actorId: actor.id, action: "case_flow.override.undone",
    entityType: "CaseFlowHumanOverride", entityId: randomUUID(),
    metadata: { caseId, targetOverrideId: overrideId, targetKind: metadata.kind, reason }
  });
  return { overrideId, undone: true as const, recomputed: input.recompute ? await resolveCase(prisma, actor, caseId) : null };
}

export function humanOverrideMetadata(value: string | null) { return parseMetadata(value); }
