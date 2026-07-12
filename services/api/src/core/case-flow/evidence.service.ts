import type { PrismaClient } from "@prisma/client";
import {
  evidenceAcquisitionMethods,
  evidenceFreshnesses,
  evidenceSensitivities,
  minimumEvidenceKeys,
  type EvidenceAcquisition,
  type EvidenceFreshness,
  type EvidenceSensitivity
} from "@alwaystrack/shared";
import { stringifyCaseFlowJson, type ControlledJsonValue } from "./persistence.js";

export class EvidenceFactError extends Error {
  constructor(public readonly code: "NOT_FOUND" | "INVALID_INPUT" | "SCOPE_MISMATCH" | "IDEMPOTENCY_CONFLICT") {
    super(code);
  }
}

export interface CreateEvidenceFactInput {
  id: string;
  key: string;
  value: ControlledJsonValue;
  normalizedValue: ControlledJsonValue;
  sourceSystem: string;
  sourceReference?: string;
  observedAt: Date;
  collectedAt?: Date;
  confidence: number;
  freshness: EvidenceFreshness;
  sensitivity: EvidenceSensitivity;
  acquisition: EvidenceAcquisition;
  connectorRunId?: string;
  ruleId?: string;
}

function validate(input: CreateEvidenceFactInput) {
  if (!input.id.trim() || !input.sourceSystem.trim() || !minimumEvidenceKeys.includes(input.key as never)) throw new EvidenceFactError("INVALID_INPUT");
  if (!Number.isFinite(input.confidence) || input.confidence < 0 || input.confidence > 1) throw new EvidenceFactError("INVALID_INPUT");
  if (!evidenceFreshnesses.includes(input.freshness) || !evidenceSensitivities.includes(input.sensitivity) || !evidenceAcquisitionMethods.includes(input.acquisition)) {
    throw new EvidenceFactError("INVALID_INPUT");
  }
  if (input.acquisition === "SCRAPED" && !input.connectorRunId) throw new EvidenceFactError("INVALID_INPUT");
  if (input.acquisition === "MANUAL" && input.sourceSystem !== "MANUAL") throw new EvidenceFactError("INVALID_INPUT");
  if (input.acquisition === "DERIVED" && (input.sourceSystem !== "DERIVED" || !input.ruleId)) throw new EvidenceFactError("INVALID_INPUT");
}

export async function createEvidenceFact(
  prisma: PrismaClient,
  scope: { organizationId: string },
  caseId: string,
  input: CreateEvidenceFactInput
) {
  validate(input);
  const [serviceCase, existing, connectorRun] = await Promise.all([
    prisma.serviceCase.findFirst({ where: { id: caseId, organizationId: scope.organizationId }, select: { id: true } }),
    prisma.evidenceFact.findUnique({ where: { id: input.id } }),
    input.connectorRunId
      ? prisma.connectorRun.findFirst({ where: { id: input.connectorRunId, caseId, organizationId: scope.organizationId }, select: { id: true } })
      : Promise.resolve(null)
  ]);
  if (!serviceCase) throw new EvidenceFactError("NOT_FOUND");
  if (input.connectorRunId && !connectorRun) throw new EvidenceFactError("SCOPE_MISMATCH");
  const valueJson = stringifyCaseFlowJson("EVIDENCE_VALUE", input.value);
  const normalizedValueJson = stringifyCaseFlowJson("EVIDENCE_NORMALIZED_VALUE", input.normalizedValue);
  if (existing) {
    if (existing.organizationId !== scope.organizationId || existing.caseId !== caseId) throw new EvidenceFactError("IDEMPOTENCY_CONFLICT");
    if (existing.key !== input.key || existing.valueJson !== valueJson || existing.normalizedValueJson !== normalizedValueJson) {
      throw new EvidenceFactError("IDEMPOTENCY_CONFLICT");
    }
    return existing;
  }
  return prisma.evidenceFact.create({
    data: {
      id: input.id,
      organizationId: scope.organizationId,
      caseId,
      connectorRunId: input.connectorRunId,
      key: input.key,
      valueJson,
      normalizedValueJson,
      sourceSystem: input.sourceSystem.trim(),
      sourceReference: input.sourceReference?.trim() || null,
      observedAt: input.observedAt,
      collectedAt: input.collectedAt,
      confidence: input.confidence,
      freshness: input.freshness,
      sensitivity: input.sensitivity,
      acquisition: input.acquisition,
      ruleId: input.ruleId
    }
  });
}

export function listEvidenceFacts(prisma: PrismaClient, scope: { organizationId: string }, caseId: string) {
  return prisma.evidenceFact.findMany({ where: { organizationId: scope.organizationId, caseId }, orderBy: [{ key: "asc" }, { observedAt: "desc" }] });
}
