import { randomUUID } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import type { CurrentUser, EvidenceFreshness, EvidenceSensitivity } from "@alwaystrack/shared";
import type { ControlledJsonValue } from "./persistence.js";
import { createEvidenceFact } from "./evidence.service.js";
import { recordHumanOverride, type CorrectionCause } from "./overrides.service.js";
import { HumanOverrideError } from "./overrides.service.js";
import { resolveCase } from "./resolve.service.js";

export async function createManualEvidence(
  prisma: PrismaClient,
  actor: CurrentUser,
  caseId: string,
  input: {
    key: string; value: ControlledJsonValue; normalizedValue: ControlledJsonValue; reason: string; cause?: CorrectionCause;
    observedAt?: Date; confidence?: number; freshness?: EvidenceFreshness; sensitivity?: EvidenceSensitivity; recompute?: boolean;
  }
) {
  if (!input.reason.trim()) throw new HumanOverrideError("INVALID_INPUT");
  const factId = randomUUID();
  const fact = await createEvidenceFact(prisma, { organizationId: actor.organizationId }, caseId, {
    id: factId, key: input.key, value: input.value, normalizedValue: input.normalizedValue, sourceSystem: "MANUAL",
    sourceReference: `user:${actor.id}`, observedAt: input.observedAt ?? new Date(), confidence: input.confidence ?? 1,
    freshness: input.freshness ?? "FRESH", sensitivity: input.sensitivity ?? "INTERNAL", acquisition: "MANUAL"
  });
  const override = await recordHumanOverride(prisma, actor, caseId, {
    kind: "MANUAL_EVIDENCE", reason: input.reason, cause: input.cause ?? "CONNECTOR_GAP", payload: { factId, key: input.key }
  });
  return { fact, override, recomputed: input.recompute ? await resolveCase(prisma, actor, caseId) : null };
}
