import { createHash, randomUUID } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import type { CurrentUser, ServiceCaseStatus } from "@alwaystrack/shared";
import { transitionServiceCase } from "./cases.service.js";
import { createEvidenceFact, listEvidenceFacts, type CreateEvidenceFactInput } from "./evidence.service.js";
import { parseCaseFlowJson, stringifyCaseFlowJson, type ControlledJsonValue } from "./persistence.js";

export class CaseFlowApiError extends Error {
  constructor(public readonly code: "NOT_FOUND" | "INVALID_INPUT" | "IDEMPOTENCY_CONFLICT") { super(code); }
}

export type CaseFlowSourceInput = {
  kind: string;
  sourceReference: string;
  sourceUrl?: string;
  observedAt: Date;
  metadata?: ControlledJsonValue;
};

function scope(actor: CurrentUser) { return { organizationId: actor.organizationId }; }

export async function createCase(prisma: PrismaClient, actor: CurrentUser, input: { summary?: string; source?: CaseFlowSourceInput }) {
  const id = randomUUID();
  const summary = input.summary?.trim() || null;
  if (input.summary !== undefined && !summary) throw new CaseFlowApiError("INVALID_INPUT");
  if (!input.source) return prisma.serviceCase.create({ data: { id, organizationId: actor.organizationId, createdByUserId: actor.id, summary } });
  const sourceId = randomUUID();
  return prisma.$transaction(async (tx) => {
    await tx.serviceCase.create({ data: { id, organizationId: actor.organizationId, createdByUserId: actor.id, summary } });
    await tx.serviceCaseSource.create({ data: {
      id: sourceId, organizationId: actor.organizationId, caseId: id, kind: input.source!.kind,
      sourceReference: input.source!.sourceReference, sourceUrl: input.source!.sourceUrl,
      observedAt: input.source!.observedAt,
      metadataJson: input.source!.metadata === undefined ? null : stringifyCaseFlowJson("CASE_SOURCE_METADATA", input.source!.metadata)
    } });
    return tx.serviceCase.update({ where: { id }, data: { primarySourceId: sourceId }, include: { sources: true } });
  });
}

export async function getCase(prisma: PrismaClient, actor: CurrentUser, caseId: string) {
  const item = await prisma.serviceCase.findFirst({ where: { id: caseId, organizationId: actor.organizationId }, include: { sources: true } });
  if (!item) throw new CaseFlowApiError("NOT_FOUND");
  return item;
}

export async function updateCase(prisma: PrismaClient, actor: CurrentUser, caseId: string, input: { summary?: string | null; status?: ServiceCaseStatus; reason?: string }) {
  await getCase(prisma, actor, caseId);
  if (input.summary !== undefined) await prisma.serviceCase.update({ where: { id: caseId }, data: { summary: input.summary?.trim() || null } });
  if (input.status) await transitionServiceCase(prisma, { organizationId: actor.organizationId, actorId: actor.id }, caseId, input.status, { reason: input.reason });
  return getCase(prisma, actor, caseId);
}

export async function addIntake(prisma: PrismaClient, actor: CurrentUser, caseId: string, source: CaseFlowSourceInput) {
  const serviceCase = await getCase(prisma, actor, caseId);
  const item = await prisma.serviceCaseSource.upsert({
    where: { caseId_kind_sourceReference: { caseId, kind: source.kind, sourceReference: source.sourceReference } },
    create: { id: randomUUID(), organizationId: actor.organizationId, caseId, kind: source.kind, sourceReference: source.sourceReference, sourceUrl: source.sourceUrl, observedAt: source.observedAt, metadataJson: source.metadata === undefined ? null : stringifyCaseFlowJson("CASE_SOURCE_METADATA", source.metadata) },
    update: { sourceUrl: source.sourceUrl, observedAt: source.observedAt, metadataJson: source.metadata === undefined ? undefined : stringifyCaseFlowJson("CASE_SOURCE_METADATA", source.metadata) }
  });
  if (!serviceCase.primarySourceId) await prisma.serviceCase.update({ where: { id: caseId }, data: { primarySourceId: item.id } });
  if (serviceCase.status === "NEW") await transitionServiceCase(prisma, { organizationId: actor.organizationId, actorId: actor.id }, caseId, "INTAKE_RUNNING");
  return item;
}

function idempotentFactId(caseId: string, input: Pick<CreateEvidenceFactInput, "connectorRunId" | "key" | "sourceReference">) {
  if (!input.connectorRunId) return randomUUID();
  if (!input.sourceReference?.trim()) throw new CaseFlowApiError("INVALID_INPUT");
  return `fact_${createHash("sha256").update(`${caseId}\0${input.connectorRunId}\0${input.key}\0${input.sourceReference.trim()}`).digest("hex").slice(0, 32)}`;
}

export async function ingestFacts(prisma: PrismaClient, actor: CurrentUser, caseId: string, facts: Omit<CreateEvidenceFactInput, "id">[]) {
  if (!facts.length || facts.length > 100) throw new CaseFlowApiError("INVALID_INPUT");
  const items = [];
  for (const fact of facts) items.push(await createEvidenceFact(prisma, scope(actor), caseId, { ...fact, id: idempotentFactId(caseId, fact) }));
  return items.map(serializeFact);
}

export async function getFacts(prisma: PrismaClient, actor: CurrentUser, caseId: string) {
  await getCase(prisma, actor, caseId);
  return (await listEvidenceFacts(prisma, scope(actor), caseId)).map(serializeFact);
}

function serializeFact(fact: { valueJson: string; normalizedValueJson: string; sensitivity: string; [key: string]: unknown }) {
  const { valueJson, normalizedValueJson, ...rest } = fact;
  const redacted = fact.sensitivity === "PII" || fact.sensitivity === "FINANCIAL";
  return { ...rest, value: redacted ? "[redacted]" : parseCaseFlowJson(valueJson), normalizedValue: redacted ? "[redacted]" : parseCaseFlowJson(normalizedValueJson) };
}

export async function getConflicts(prisma: PrismaClient, actor: CurrentUser, caseId: string) {
  await getCase(prisma, actor, caseId);
  const conflicts = await prisma.evidenceConflict.findMany({ where: { organizationId: actor.organizationId, caseId }, orderBy: [{ status: "asc" }, { createdAt: "asc" }] });
  const factIds = [...new Set(conflicts.flatMap((item) => parseCaseFlowJson(item.factIdsJson) as string[]))];
  const facts = factIds.length ? await prisma.evidenceFact.findMany({ where: { organizationId: actor.organizationId, caseId, id: { in: factIds } } }) : [];
  const byId = new Map(facts.map((fact) => [fact.id, serializeFact(fact)]));
  return conflicts.map(({ factIdsJson, ...conflict }) => ({ ...conflict, facts: (parseCaseFlowJson(factIdsJson) as string[]).flatMap((id) => byId.get(id) ?? []) }));
}
