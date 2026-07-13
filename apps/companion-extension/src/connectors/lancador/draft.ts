import type { LancadorDraftFields } from "@alwaystrack/shared";

export interface AuthorizedFormDecision { allowed: true; capability: "FILL_FORM"; authorizationRef: string }
export interface LancadorDraftTarget { readonly mode: "DRAFT_ONLY"; fillDraft(fields: LancadorDraftFields): Promise<void>; clearDraft(): Promise<void> }
export interface PreparedLancadorDraft { type: "LANCADOR_DRAFT_PREPARED"; payload: { actionId: string; authorizationRef: string }; checklist: readonly string[] }

export async function prepareAuthorizedLancadorDraft(input: {
  enabled?: boolean;
  explicitClick: boolean;
  actionId: string;
  fields: LancadorDraftFields;
  decision: AuthorizedFormDecision | { allowed: false };
  target: LancadorDraftTarget;
}): Promise<PreparedLancadorDraft> {
  if (input.enabled !== true) throw new Error("RUNTIME_DISABLED");
  if (!input.explicitClick) throw new Error("EXPLICIT_CLICK_REQUIRED");
  if (!input.decision.allowed || input.decision.capability !== "FILL_FORM" || !input.decision.authorizationRef.trim()) throw new Error("AUTHORIZATION_REQUIRED");
  if (!input.fields.type?.trim() || !input.fields.reason?.trim() || !input.fields.products?.length) throw new TypeError("Draft requires type, products and reason");
  if (input.fields.products.some((product) => !product.name.trim() || !Number.isInteger(product.quantity) || product.quantity < 1)) throw new TypeError("Draft products are invalid");
  await input.target.fillDraft(input.fields);
  return {
    type: "LANCADOR_DRAFT_PREPARED",
    payload: { actionId: input.actionId, authorizationRef: input.decision.authorizationRef },
    checklist: ["Revisar tipo, produtos e quantidades", "Revisar endereco e pagamento", "Gerar ou confirmar somente de forma manual", "Registrar pedido, valor e motivo no Slack manualmente"]
  };
}

export async function undoLancadorDraft(target: LancadorDraftTarget): Promise<void> { await target.clearDraft(); }
