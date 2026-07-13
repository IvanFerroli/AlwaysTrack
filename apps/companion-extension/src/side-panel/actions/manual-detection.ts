import type { EvidenceFact } from "@alwaystrack/shared";
import { prepareSlackDraft, type PreparedSlackDraft } from "./slack-draft.js";

export function prepareManualOrderAlert(input: { evidence: EvidenceFact; value: string; reason: string; attachments?: string[] }): PreparedSlackDraft {
  if (input.evidence.key !== "order.manualId" || input.evidence.acquisition !== "DERIVED" || input.evidence.ruleId !== "lancador.manual-confirmation") throw new TypeError("A verified manual Lancador order is required");
  return prepareSlackDraft({ id: `slack:${input.evidence.id}`, orderId: String(input.evidence.normalizedValue), value: input.value, reason: input.reason, evidence: [`Pedido detectado apos confirmacao manual: ${String(input.evidence.normalizedValue)}`], attachments: input.attachments });
}
