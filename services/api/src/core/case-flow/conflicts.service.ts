import type { PrismaClient } from "@prisma/client";
import type { EvidenceConflictResolver } from "@alwaystrack/shared";
import { stringifyCaseFlowJson } from "./persistence.js";
import type { CurrentUser } from "@alwaystrack/shared";
import { recordHumanOverride, type CorrectionCause } from "./overrides.service.js";
import { resolveCase } from "./resolve.service.js";

export class EvidenceConflictError extends Error {
  constructor(public readonly code: "NOT_FOUND" | "INVALID_INPUT" | "SCOPE_MISMATCH" | "IDEMPOTENCY_CONFLICT") { super(code); }
}

export const defaultEvidenceAuthority: Readonly<Record<string, readonly string[]>> = {
  "conversation.intentText": ["ALWAYSCHAT"],
  "conversation.promise": ["ALWAYSCHAT"],
  "payment.status": ["YAMPI"],
  "invoice.status": ["OMIE"],
  "logistics.status": ["CARRIER", "RASTREIO"],
  "order.source": ["LANCADOR"],
  "logistics.returnState": ["CORREIOS_REVERSA"],
  "risk.money": ["MANUAL", "SLACK"]
};

export const sourceAbsenceMeaning = "NOT_FOUND_IN_SOURCE" as const;

export function preferredFact<T extends { sourceSystem: string }>(key: string, facts: readonly T[], authority = defaultEvidenceAuthority): T | undefined {
  const priorities = authority[key] ?? [];
  return [...facts].sort((a, b) => {
    const ai = priorities.indexOf(a.sourceSystem);
    const bi = priorities.indexOf(b.sourceSystem);
    return (ai < 0 ? Number.MAX_SAFE_INTEGER : ai) - (bi < 0 ? Number.MAX_SAFE_INTEGER : bi);
  })[0];
}

export async function createEvidenceConflict(prisma: PrismaClient, scope: { organizationId: string }, caseId: string, input: { id: string; key: string; factIds: string[] }) {
  const factIds = [...new Set(input.factIds.filter(Boolean))].sort();
  if (!input.id.trim() || !input.key.trim() || factIds.length < 2) throw new EvidenceConflictError("INVALID_INPUT");
  const [serviceCase, facts, existing] = await Promise.all([
    prisma.serviceCase.findFirst({ where: { id: caseId, organizationId: scope.organizationId }, select: { id: true } }),
    prisma.evidenceFact.findMany({ where: { id: { in: factIds }, caseId, organizationId: scope.organizationId }, select: { id: true, key: true } }),
    prisma.evidenceConflict.findUnique({ where: { id: input.id } })
  ]);
  if (!serviceCase) throw new EvidenceConflictError("NOT_FOUND");
  if (facts.length !== factIds.length || facts.some((fact) => fact.key !== input.key)) throw new EvidenceConflictError("SCOPE_MISMATCH");
  const factIdsJson = stringifyCaseFlowJson("EVIDENCE_CONFLICT_FACT_IDS", factIds);
  if (existing) {
    if (existing.organizationId !== scope.organizationId || existing.caseId !== caseId || existing.key !== input.key || existing.factIdsJson !== factIdsJson) {
      throw new EvidenceConflictError("IDEMPOTENCY_CONFLICT");
    }
    return existing;
  }
  return prisma.evidenceConflict.create({ data: { id: input.id, organizationId: scope.organizationId, caseId, key: input.key, factIdsJson, status: "OPEN" } });
}

export async function resolveEvidenceConflict(prisma: PrismaClient, scope: { organizationId: string; actorId?: string }, caseId: string, conflictId: string, input: { chosenFactId?: string; reason: string; resolvedBy: EvidenceConflictResolver; now?: Date }) {
  const conflict = await prisma.evidenceConflict.findFirst({ where: { id: conflictId, caseId, organizationId: scope.organizationId } });
  if (!conflict) throw new EvidenceConflictError("NOT_FOUND");
  if (conflict.status === "RESOLVED") return conflict;
  const factIds = JSON.parse(conflict.factIdsJson) as string[];
  if (!input.reason.trim() || (input.chosenFactId && !factIds.includes(input.chosenFactId)) || (input.resolvedBy === "USER" && !scope.actorId)) {
    throw new EvidenceConflictError("INVALID_INPUT");
  }
  return prisma.evidenceConflict.update({
    where: { id: conflict.id },
    data: { status: "RESOLVED", chosenFactId: input.chosenFactId, resolutionReason: input.reason.trim(), resolvedByKind: input.resolvedBy, resolvedByUserId: input.resolvedBy === "USER" ? scope.actorId : null, resolvedAt: input.now ?? new Date() }
  });
}

export async function resolveEvidenceConflictManually(
  prisma: PrismaClient,
  actor: CurrentUser,
  caseId: string,
  conflictId: string,
  input: { chosenFactId?: string; reason: string; cause?: CorrectionCause; recompute?: boolean }
) {
  const conflict = await prisma.evidenceConflict.findFirst({ where: { id: conflictId, caseId, organizationId: actor.organizationId } });
  if (!conflict) throw new EvidenceConflictError("NOT_FOUND");
  if (conflict.status !== "OPEN") throw new EvidenceConflictError("INVALID_INPUT");
  const resolved = await resolveEvidenceConflict(prisma, { organizationId: actor.organizationId, actorId: actor.id }, caseId, conflictId, {
    chosenFactId: input.chosenFactId, reason: input.reason, resolvedBy: "USER"
  });
  const override = await recordHumanOverride(prisma, actor, caseId, {
    kind: "CONFLICT_RESOLUTION", reason: input.reason, cause: input.cause ?? "HUMAN_DECISION",
    payload: { conflictId, chosenFactId: input.chosenFactId ?? null, previousStatus: conflict.status, previousChosenFactId: conflict.chosenFactId }
  });
  return { conflict: resolved, override, recomputed: input.recompute ? await resolveCase(prisma, actor, caseId) : null };
}
