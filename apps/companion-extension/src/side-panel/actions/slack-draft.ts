import type { CopyAction } from "./copy-actions.js";

export interface SlackDraftInput {
  id: string;
  orderId: string;
  value: string;
  reason: string;
  evidence: string[];
  attachments?: string[];
}

export interface SlackDraftPreparedIntent {
  type: "CASE_FLOW_SLACK_DRAFT_PREPARED";
  payload: { actionId: string; evidenceCount: number; attachmentCount: number };
}

export interface PreparedSlackDraft {
  action: CopyAction & { kind: "SLACK_DRAFT" };
  preparedIntent: SlackDraftPreparedIntent;
}

const clean = (value: string): string => value.replace(/[\r\n]+/g, " ").trim();

export function prepareSlackDraft(input: SlackDraftInput): PreparedSlackDraft {
  const orderId = clean(input.orderId);
  const value = clean(input.value);
  const reason = clean(input.reason);
  if (!orderId || !value || !reason) throw new TypeError("Slack draft requires order, value and reason");

  const evidence = input.evidence.map(clean).filter(Boolean);
  const attachments = (input.attachments ?? []).map(clean).filter(Boolean);
  const checklist = [
    `[x] Pedido: ${orderId}`,
    `[x] Valor: ${value}`,
    `[x] Motivo: ${reason}`,
    `[${attachments.length ? "x" : " "}] Anexos: ${attachments.length ? attachments.join(", ") : "nenhum anexo informado"}`
  ];
  const content = [
    "Rascunho para envio manual no Slack",
    "",
    ...checklist,
    "",
    "Evidencias:",
    ...(evidence.length ? evidence.map((item) => `- ${item}`) : ["- nenhuma evidencia disponivel"]),
    "",
    "Revise e publique manualmente. O AlwaysTrack nao acessa nem posta no Slack."
  ].join("\n");
  const action = { id: input.id, kind: "SLACK_DRAFT" as const, label: "Copiar rascunho Slack", content };

  return {
    action,
    preparedIntent: {
      type: "CASE_FLOW_SLACK_DRAFT_PREPARED",
      payload: { actionId: action.id, evidenceCount: evidence.length, attachmentCount: attachments.length }
    }
  };
}
