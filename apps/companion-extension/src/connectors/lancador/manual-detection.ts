import type { EvidenceFact } from "@alwaystrack/shared";

export interface LancadorManualObservation { manualConfirmationObserved: boolean; generatedOrderNumber?: string }
export interface LancadorManualObservationSource { readonly mode: "OBSERVE_ONLY"; observe(): Promise<LancadorManualObservation> }

export async function detectManualLancadorConfirmation(input: { enabled?: boolean; caseId: string; runId: string; draftActionId: string; source: LancadorManualObservationSource; observedAt?: string }): Promise<EvidenceFact | null> {
  if (input.enabled !== true) return null;
  const observation = await input.source.observe();
  const orderNumber = observation.generatedOrderNumber?.trim();
  if (!observation.manualConfirmationObserved || !orderNumber) return null;
  const observedAt = input.observedAt ?? new Date().toISOString();
  return { id: `${input.runId}:manual-order:${orderNumber}`, caseId: input.caseId, key: "order.manualId", value: orderNumber, normalizedValue: orderNumber, sourceSystem: "DERIVED", sourceReference: input.draftActionId, observedAt, collectedAt: observedAt, confidence: 1, freshness: "FRESH", sensitivity: "INTERNAL", acquisition: "DERIVED", connectorRunId: input.runId, ruleId: "lancador.manual-confirmation" };
}
