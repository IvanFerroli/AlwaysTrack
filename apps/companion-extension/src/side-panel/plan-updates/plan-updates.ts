export type PlanUpdateKind = "PLAN_UPDATED" | "BRANCH_INVALIDATED" | "MESSAGE_RECOMPILED";

export interface PlanUpdate {
  revision: number;
  kind: PlanUpdateKind;
  recommendationChanged: boolean;
  copiedMessageBecameObsolete: boolean;
  message: string;
}

const labels: Record<PlanUpdateKind, string> = {
  PLAN_UPDATED: "Plano atualizado",
  BRANCH_INVALIDATED: "Opcao indisponivel",
  MESSAGE_RECOMPILED: "Mensagem atualizada"
};

export function getPlanUpdateLabel(kind: PlanUpdateKind): string {
  return labels[kind];
}

export function shouldKeepVisibleStep(update: PlanUpdate, visibleStepStillExists: boolean): boolean {
  return visibleStepStillExists && update.kind !== "BRANCH_INVALIDATED";
}
