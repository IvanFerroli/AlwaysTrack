import { describe, expect, it } from "vitest";
import { prepareSlackDraft } from "./slack-draft.js";

describe("Slack manual draft", () => {
  it("prepares copy-only text with the required checklist and evidence summary", () => {
    const result = prepareSlackDraft({
      id: "slack-demo-1",
      orderId: "AT-SYN-1001",
      value: "R$ 149,90",
      reason: "reenvio por entrega nao reconhecida",
      evidence: ["Loggi sintetico marcou entregue", "cliente nao reconheceu o recebedor"],
      attachments: ["comprovante-sintetico.png"]
    });

    expect(result.action).toMatchObject({ kind: "SLACK_DRAFT", label: "Copiar rascunho Slack" });
    expect(result.action.content).toContain("Pedido: AT-SYN-1001");
    expect(result.action.content).toContain("Valor: R$ 149,90");
    expect(result.action.content).toContain("Motivo: reenvio por entrega nao reconhecida");
    expect(result.action.content).toContain("Anexos: comprovante-sintetico.png");
    expect(result.preparedIntent).toEqual({
      type: "CASE_FLOW_SLACK_DRAFT_PREPARED",
      payload: { actionId: "slack-demo-1", evidenceCount: 2, attachmentCount: 1 }
    });
    expect(JSON.stringify(result)).not.toMatch(/webhook|channelId|postMessage|sendMessage|slack\.com/i);
  });

  it("requires pedido, valor and motivo and keeps missing attachments explicit", () => {
    expect(() => prepareSlackDraft({ id: "invalid", orderId: "", value: "R$ 0,00", reason: "teste", evidence: [] })).toThrow(/order, value and reason/);
    const result = prepareSlackDraft({ id: "valid", orderId: "AT-SYN-2", value: "R$ 0,00", reason: "consulta", evidence: [] });
    expect(result.action.content).toContain("[ ] Anexos: nenhum anexo informado");
  });
});
