import type { PrismaClient } from "@prisma/client";
import type { CurrentUser } from "@alwaystrack/shared";
import { humanOverrideMetadata, humanOverrideKinds, type CorrectionCause, type HumanOverrideKind } from "./overrides.service.js";

export interface HumanOverrideMetrics {
  total: number;
  active: number;
  undone: number;
  byKind: Record<HumanOverrideKind, number>;
  byCause: Record<CorrectionCause, number>;
}

export async function getHumanOverrideMetrics(prisma: PrismaClient, actor: CurrentUser): Promise<HumanOverrideMetrics> {
  const events = await prisma.auditLog.findMany({ where: { organizationId: actor.organizationId, entityType: "CaseFlowHumanOverride" }, orderBy: { createdAt: "asc" } });
  const created = events.filter((event) => event.action.endsWith(".created"));
  const undoneIds = new Set(events.filter((event) => event.action === "case_flow.override.undone").map((event) => String(humanOverrideMetadata(event.metadataJson).targetOverrideId ?? "")));
  const byKind = Object.fromEntries(humanOverrideKinds.map((kind) => [kind, 0])) as Record<HumanOverrideKind, number>;
  const byCause: Record<CorrectionCause, number> = { CONNECTOR_GAP: 0, RULE_ERROR: 0, HUMAN_DECISION: 0 };
  for (const event of created) {
    const metadata = humanOverrideMetadata(event.metadataJson);
    if (humanOverrideKinds.includes(metadata.kind as HumanOverrideKind)) byKind[metadata.kind as HumanOverrideKind] += 1;
    if (typeof metadata.cause === "string" && metadata.cause in byCause) byCause[metadata.cause as CorrectionCause] += 1;
  }
  return { total: created.length, active: created.filter((event) => !undoneIds.has(event.entityId)).length, undone: undoneIds.size, byKind, byCause };
}
