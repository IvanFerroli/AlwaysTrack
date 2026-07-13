import type { LancadorDraftFields } from "@alwaystrack/shared";

export interface FormDraftAction { id: string; kind: "LANCADOR_DRAFT"; label: string; fields: LancadorDraftFields; reviewChecklist: readonly string[] }

export function createLancadorFormDraftAction(id: string, fields: LancadorDraftFields): FormDraftAction {
  if (!id.trim()) throw new TypeError("Action id is required");
  return { id, kind: "LANCADOR_DRAFT", label: "Preparar rascunho no Lancador", fields, reviewChecklist: ["Conferir produtos e quantidades", "Conferir endereco e pagamento", "Confirmar manualmente fora do Companion"] };
}
