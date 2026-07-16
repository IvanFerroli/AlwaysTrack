import { describe, expect, it } from "vitest";
import { minimumEvidenceKeys } from "@alwaystrack/shared";
import { validateFlowGraph } from "../flow-validation.js";
import {
  ALWAYS_FIT_HEALTH_FLOW_CODE,
  ALWAYS_FIT_HEALTH_FLOW_SLUG,
  alwaysFitHealthCatalogNodes,
  alwaysFitHealthMessages,
  buildAlwaysFitHealthFlow,
  type AlwaysFitHealthMessageCode
} from "./always-fit-health-flow.js";

const scriptIds = Object.fromEntries(alwaysFitHealthMessages.map((message) => [message.code, `script:${message.code}`])) as Record<AlwaysFitHealthMessageCode, string>;
const flow = buildAlwaysFitHealthFlow(scriptIds);

function transition(fromNodeKey: string, label: string) {
  return flow.transitions.find((item) => item.fromNodeKey === fromNodeKey && item.label === label);
}

const acceptanceRoutes = [
  ["TESTE-001", [["ETAPA-013", "Tudo está aberto: dispensar reversa", "ETAPA-019"], ["ETAPA-019", "Estorno", "ETAPA-020"], ["ETAPA-021", "Pix: dados completos coletados", "ETAPA-022"], ["ETAPA-022", "Pix ou boleto solicitado e link registrado", "ETAPA-023"], ["ETAPA-023", "Prazo e encerramento enviados", "RESULTADO-002"]]],
  ["TESTE-002", [["ETAPA-013", "Há ao menos um item lacrado", "ETAPA-014"], ["ETAPA-014", "Devolverá todos os lacrados", "ETAPA-015"], ["ETAPA-017", "Postagem confirmada por foto ou Correios", "ETAPA-019"], ["ETAPA-021", "Cartão: sem dados Pix", "ETAPA-022"], ["ETAPA-022", "Cartão solicitado e link registrado", "ETAPA-030"], ["ETAPA-030", "Encerrar estorno em cartão", "RESULTADO-003"]]],
  ["TESTE-003", [["ETAPA-019", "Troca", "ETAPA-024"], ["ETAPA-025", "Valor igual ao saldo", "ETAPA-027"], ["ETAPA-027", "Novo pedido gerado sem frete", "ETAPA-029"], ["ETAPA-029", "Previsão e rastreio enviados", "ETAPA-030"], ["ETAPA-030", "Encerrar troca ou solução mista", "RESULTADO-004"]]],
  ["TESTE-004", [["ETAPA-025", "Valor maior que o saldo", "ETAPA-026"], ["ETAPA-026", "Pagamento ainda não confirmado", "ETAPA-026"], ["ETAPA-026", "Pagamento da diferença confirmado", "ETAPA-027"]]],
  ["TESTE-005", [["ETAPA-025", "Valor menor que o saldo", "ETAPA-028"], ["ETAPA-028", "Troca gerada e diferença solicitada", "ETAPA-029"]]],
  ["TESTE-006", [["ETAPA-004", "Um ou mais pedidos localizados", "ETAPA-005"], ["ETAPA-005", "Pedido provável identificado e confirmado", "ETAPA-006"]]],
  ["TESTE-007", [["ETAPA-006", "Recebido há mais de 30 dias", "ETAPA-031"], ["ETAPA-031", "Sem exceção aprovada", "RESULTADO-006"]]],
  ["TESTE-008", [["ETAPA-031", "Possível exceção: consultar supervisão", "ETAPA-032"], ["ETAPA-032", "Aprovado com retorno explícito à ETAPA-007", "ETAPA-007"]]],
  ["TESTE-009", [["ETAPA-009", "Uso divergente identificado", "DECISAO-008"], ["DECISAO-008", "Cliente mantém o pedido de solução", "ETAPA-010"]]],
  ["TESTE-010", [["ETAPA-024", "Cliente insiste no mesmo produto", "DECISAO-020"], ["DECISAO-020", "Composição disponível", "ETAPA-025"]]],
  ["TESTE-011", [["ETAPA-017", "Postagem confirmada por foto ou Correios", "ETAPA-019"]]],
  ["TESTE-012", [["ETAPA-017", "Código expirado", "ETAPA-018"], ["ETAPA-018", "Novo código gerado e enviado", "ETAPA-017"]]],
  ["TESTE-013", [["ETAPA-014", "Devolverá parte; descontar os retidos", "ETAPA-015"]]],
  ["TESTE-014", [["ETAPA-019", "Cliente mudou uma escolha já solicitada", "ETAPA-033"], ["ETAPA-033", "Ainda não processada: cancelada manualmente", "ETAPA-019"]]],
  ["TESTE-015", [["ETAPA-033", "Já processada: não alterar", "RESULTADO-005"]]],
  ["TESTE-016", [["DECISAO-020", "Item indisponível: refazer composição", "ETAPA-024"]]],
  ["TESTE-017", [["ETAPA-010", "Sintoma persiste: orientação médica enviada", "ETAPA-011"]]],
  ["TESTE-018", [["ETAPA-003", "CPF ausente após recarregar", "DECISAO-002"], ["DECISAO-002", "Sem CPF e sem resposta do cliente", "RESULTADO-008"]]],
  ["TESTE-019", [["ETAPA-006", "Exatamente 30 dias: bloquear e validar", "ETAPA-032"]]]
] as const;

describe("Always Fit health flow pilot catalog", () => {
  it("keeps one stable pilot identity and the complete source inventory", () => {
    expect(ALWAYS_FIT_HEALTH_FLOW_CODE).toBe("SAUDE-DEV-TROCA-ESTORNO");
    expect(ALWAYS_FIT_HEALTH_FLOW_SLUG).toBe("saude-dev-troca-estorno");
    expect(alwaysFitHealthMessages).toHaveLength(17);
    expect(alwaysFitHealthMessages.filter((message) => message.status === "DRAFT")).toHaveLength(7);
    expect(alwaysFitHealthCatalogNodes.filter((node) => /^ETAPA-\d{3}$/.test(node.key))).toHaveLength(34);
    expect(alwaysFitHealthCatalogNodes.filter((node) => /^RESULTADO-\d{3}$/.test(node.key))).toHaveLength(9);
    expect(new Set(alwaysFitHealthCatalogNodes.map((node) => node.key)).size).toBe(alwaysFitHealthCatalogNodes.length);
  });

  it("builds a valid directed graph with every Scriptoteca message bound", () => {
    expect(validateFlowGraph(flow.nodes, flow.transitions)).toEqual({ valid: true, issues: [] });
    const bindings = new Set(flow.nodes.flatMap((node) => node.scripts.map((script) => script.scriptId)));
    expect(bindings).toEqual(new Set(Object.values(scriptIds)));
    expect(flow.steps).toHaveLength(alwaysFitHealthCatalogNodes.length);
    expect(flow.steps.every((step) => typeof step.decision.nodeKey === "string")).toBe(true);
    const standardFacts = new Set<string>(minimumEvidenceKeys);
    const invalidFacts = flow.nodes.flatMap((node) => [...node.requiredFacts, ...node.optionalFacts]).filter((key) =>
      !standardFacts.has(key) && !/^custom\.[a-z0-9]+(?:\.[a-z0-9]+)+$/.test(key)
    );
    expect(invalidFacts).toEqual([]);
  });

  it("preserves the closed decisions instead of guessing pending business rules", () => {
    expect(transition("ETAPA-006", "Exatamente 30 dias: bloquear e validar")).toMatchObject({ toNodeKey: "ETAPA-032", requiresUserChoice: true });
    expect(transition("ETAPA-013", "Tudo está aberto: dispensar reversa")).toMatchObject({ toNodeKey: "ETAPA-019" });
    expect(transition("ETAPA-017", "Postagem confirmada por foto ou Correios")).toMatchObject({ toNodeKey: "ETAPA-019" });
    expect(transition("ETAPA-026", "Pagamento ainda não confirmado")).toMatchObject({ toNodeKey: "ETAPA-026", allowLoop: true });
    expect(transition("ETAPA-032", "Aprovado com outro retorno: handoff manual")).toMatchObject({ toNodeKey: "RESULTADO-009" });
  });

  it("gates only positive identification choices and exposes their required facts to the UI", () => {
    expect(transition("ETAPA-003", "CPF visível ou recuperado")?.condition).toEqual({ operator: "FACT_EXISTS", factKey: "customer.cpf" });
    expect(transition("DECISAO-002", "CPF obtido pela Yampi ou pelo cliente")?.condition).toEqual({ operator: "FACT_EXISTS", factKey: "customer.cpf" });
    expect(transition("ETAPA-005", "Pedido provável identificado e confirmado")?.condition).toEqual({ operator: "FACT_EXISTS", factKey: "order.primaryId" });
    expect(transition("ETAPA-003", "CPF ausente após recarregar")?.condition).toBeUndefined();
    expect(flow.steps.find((step) => step.decision.nodeKey === "ETAPA-003")?.decision.options).toContainEqual({
      label: "CPF visível ou recuperado", target: "ETAPA-004", requiredFacts: ["customer.cpf"]
    });
    expect(flow.steps.find((step) => step.decision.nodeKey === "ETAPA-005")?.decision.options).toContainEqual({
      label: "Pedido provável identificado e confirmado", target: "ETAPA-006", requiredFacts: ["order.primaryId"]
    });
  });

  it("keeps progressive intake optional while preserving downstream safety gates", () => {
    const node = (key: string) => flow.nodes.find((item) => item.key === key)!;
    expect(node("ETAPA-002").requiredFacts).toEqual([]);
    expect(node("ETAPA-004").requiredFacts).toEqual([]);
    expect(node("ETAPA-005").requiredFacts).toEqual([]);
    expect(node("ETAPA-008").requiredFacts).toEqual([]);
    expect(node("ETAPA-009").requiredFacts).toEqual([]);
    expect(node("DECISAO-008").requiredFacts).toEqual([]);
    expect(node("ETAPA-012").requiredFacts).toEqual([]);
    expect(node("ETAPA-006").requiredFacts).toEqual(["logistics.deliveredAt"]);
    expect(node("ETAPA-007").requiredFacts).toEqual(["order.products"]);
    expect(node("ETAPA-010").requiredFacts).toEqual([]);
    expect(node("ETAPA-013").requiredFacts).toEqual([]);
    expect(transition("ETAPA-013", "Há ao menos um item lacrado")?.condition).toEqual({ operator: "FACT_EXISTS", factKey: "custom.alwaysfit.return.sealed.items" });
    expect(transition("ETAPA-013", "Tudo está aberto: dispensar reversa")?.condition).toEqual({ operator: "FACT_EXISTS", factKey: "custom.alwaysfit.return.open.items" });
    expect(node("ETAPA-014").requiredFacts).toEqual(["custom.alwaysfit.return.sealed.items"]);
  });

  it("uses one structured order-products placeholder in MSG-004", () => {
    const message = alwaysFitHealthMessages.find((item) => item.code === "MSG-004")!;
    expect(message.body).toContain("{produtos_pedido}");
    expect(message.body).not.toMatch(/\{produto_[123]\}/);
  });

  it("records usage and symptom answers in decisions instead of duplicate case fields", () => {
    const node = (key: string) => flow.nodes.find((item) => item.key === key)!;
    expect(node("ETAPA-009").optionalFacts).not.toContain("custom.alwaysfit.health.usage");
    expect(node("DECISAO-008").optionalFacts).not.toContain("custom.alwaysfit.product.recommended.usage");
    expect(node("ETAPA-010").requiredFacts).not.toContain("custom.alwaysfit.health.symptom.persistent");
    expect(alwaysFitHealthMessages.find((item) => item.code === "MSG-017")?.body).not.toContain("{modo_de_uso}");
  });

  it("keeps every numbered decision, rule and pending validation traceable", () => {
    const corpus = alwaysFitHealthCatalogNodes.map((node) => `${node.instruction} ${(node.dependencies ?? []).join(" ")}`).join(" ");
    const decisions = ["001", "002", "003", "004", "005", "006", "007", "008", "009", "010", "011", "012", "013", "015", "017", "018", "019", "020", "021", "022", "023"];
    const rules = Array.from({ length: 23 }, (_, index) => String(index + 1).padStart(3, "0"));
    const pending = Array.from({ length: 10 }, (_, index) => String(index + 1).padStart(3, "0"));
    expect(decisions.filter((id) => !corpus.includes(`DECISAO-${id}`))).toEqual([]);
    expect(rules.filter((id) => !corpus.includes(`REGRA-${id}`))).toEqual([]);
    expect(pending.filter((id) => !corpus.includes(`PENDENCIA-${id}`))).toEqual([]);
  });

  it.each(acceptanceRoutes)("maps %s to executable graph transitions", (_testCode, routes) => {
    for (const [fromNodeKey, label, toNodeKey] of routes) {
      expect(transition(fromNodeKey, label), `${fromNodeKey}: ${label}`).toMatchObject({ toNodeKey });
    }
  });

  it("keeps messages and irreversible external actions behind the human firewall", () => {
    const scriptedNodes = flow.nodes.filter((node) => node.scripts.length > 0);
    expect(scriptedNodes.every((node) => node.forbiddenCapabilities.includes("SEND_MESSAGE"))).toBe(true);
    const forbiddenByNode = new Map(flow.nodes.map((node) => [node.key, node.forbiddenCapabilities]));
    expect(forbiddenByNode.get("ETAPA-015")).toContain("CREATE_REVERSE");
    expect(forbiddenByNode.get("ETAPA-022")).toEqual(expect.arrayContaining(["POST_SLACK", "ISSUE_REFUND"]));
    expect(forbiddenByNode.get("ETAPA-026")).toEqual(expect.arrayContaining(["POST_SLACK", "CREATE_ORDER"]));
    expect(forbiddenByNode.get("ETAPA-027")).toContain("CONFIRM_ORDER");
    expect(forbiddenByNode.get("ETAPA-033")).toContain("CANCEL_ORDER");
  });

  it("makes every declared outcome reachable while isolating this flow from unrelated cases", () => {
    const reachable = new Set<string>();
    const visit = (key: string) => {
      if (reachable.has(key)) return;
      reachable.add(key);
      flow.transitions.filter((item) => item.fromNodeKey === key).forEach((item) => visit(item.toNodeKey));
    };
    visit("START");
    expect(alwaysFitHealthCatalogNodes.filter((node) => node.terminal).every((node) => reachable.has(node.key))).toBe(true);
    expect(flow.nodes.find((node) => node.key === "ETAPA-001")?.operatorInstruction).toContain("somente este caso");
  });
});
