export type ShadowDifferenceKind = "SUMMARY" | "FLOW" | "EVIDENCE";

export interface ShadowDecision {
  summary: string;
  flowKey: string;
  evidenceKeys: readonly string[];
}

export interface ShadowComparisonRecord {
  id: string;
  organizationId: string;
  caseId: string;
  actorId: string;
  actorKind: "HUMAN_REVIEW";
  manual: ShadowDecision;
  caseFlow: ShadowDecision;
  differences: readonly ShadowDifferenceKind[];
  createdAt: string;
}

export interface ShadowComparisonStorage {
  append(record: ShadowComparisonRecord): Promise<void>;
}

export interface ShadowComparisonInput {
  organizationId: string;
  caseId: string;
  actorId: string;
  manual: ShadowDecision;
  caseFlow: ShadowDecision;
}

const normalizedKeys = (keys: readonly string[]) => [...new Set(keys.map((key) => key.trim()).filter(Boolean))].sort();

export class ShadowComparisonError extends Error {}

export async function recordShadowComparison(
  storage: ShadowComparisonStorage,
  input: ShadowComparisonInput,
  options: { id: () => string; now: () => Date }
): Promise<ShadowComparisonRecord> {
  if (![input.organizationId, input.caseId, input.actorId, input.manual.summary, input.manual.flowKey, input.caseFlow.summary, input.caseFlow.flowKey].every((value) => value.trim())) {
    throw new ShadowComparisonError("INVALID_SHADOW_COMPARISON");
  }
  const manual = { ...input.manual, evidenceKeys: normalizedKeys(input.manual.evidenceKeys) };
  const caseFlow = { ...input.caseFlow, evidenceKeys: normalizedKeys(input.caseFlow.evidenceKeys) };
  const differences: ShadowDifferenceKind[] = [];
  if (manual.summary.trim() !== caseFlow.summary.trim()) differences.push("SUMMARY");
  if (manual.flowKey.trim() !== caseFlow.flowKey.trim()) differences.push("FLOW");
  if (manual.evidenceKeys.join("\0") !== caseFlow.evidenceKeys.join("\0")) differences.push("EVIDENCE");
  const record: ShadowComparisonRecord = {
    id: options.id(), organizationId: input.organizationId, caseId: input.caseId, actorId: input.actorId,
    actorKind: "HUMAN_REVIEW", manual, caseFlow, differences, createdAt: options.now().toISOString()
  };
  await storage.append(record);
  return record;
}
