import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { CurrentUser } from "@alwaystrack/shared";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ServiceFlowsView } from "../src/views/service-flows";

const apiMock = vi.fn();
const clipboardWriteMock = vi.fn();

vi.mock("../src/api", () => ({
  api: (...args: unknown[]) => apiMock(...args),
  uploadOperationalImage: vi.fn()
}));

const users = {
  sac: {
    id: "sac-1",
    name: "Analista Sintetica",
    email: "sac@example.invalid",
    role: "SAC",
    organizationId: "organization-1",
    unitScopeIds: [],
    sectorScopeIds: []
  },
  manager: {
    id: "manager-1",
    name: "Gestora Sintetica",
    email: "manager@example.invalid",
    role: "GESTOR",
    organizationId: "organization-1",
    unitScopeIds: [],
    sectorScopeIds: []
  }
} satisfies Record<string, CurrentUser>;

const canonicalScript = {
  id: "script-1",
  title: "Confirmacao de troca",
  channel: "WHATSAPP",
  body: "Ola, {cliente}. A troca esta autorizada.",
  tags: ["troca", "pedido"],
  placeholders: ["cliente"],
  status: "VALIDATED",
  usageCount: 7
};

const obsoleteScript = { ...canonicalScript, id: "script-obsolete", title: "Texto obsoleto", status: "OBSOLETE" };

const baseFlow = {
  id: "flow-1",
  slug: "troca-segura",
  title: "Troca segura",
  summary: "Fluxo sintetico para troca auditada",
  content: "## Orientacao\n<script>nao executar</script> [inseguro](javascript:alert(1))",
  tags: ["troca", "seguranca"],
  status: "DRAFT",
  priority: 10,
  version: 2,
  reviewComment: null,
  reviewDueAt: "2026-08-15T00:00:00.000Z",
  reviewedAt: null,
  reviewedBy: null,
  wikiPage: null,
  revisions: [{
    id: "revision-1",
    version: 1,
    title: "Troca segura",
    status: "DRAFT",
    comment: "Criacao inicial",
    createdAt: "2026-07-14T12:00:00.000Z",
    author: { id: "manager-1", name: "Gestora Sintetica", role: "GESTOR" }
  }],
  steps: [
    {
      id: "step-1",
      title: "Validar pedido",
      body: "Confira titularidade e prazo.",
      kind: "YES_NO",
      decision: { yes: "Continuar", no: "Escalar" },
      order: 1,
      required: true,
      collapsed: false,
      scripts: [{ id: "link-1", script: canonicalScript }]
    },
    {
      id: "step-2",
      title: "Registrar desfecho",
      body: null,
      kind: "CHECKLIST",
      decision: { options: ["Troca", "Estorno"] },
      order: 2,
      required: false,
      collapsed: true,
      scripts: []
    }
  ]
};

const pilotFlow = {
  ...baseFlow,
  id: "flow-health",
  slug: "saude-dev-troca-estorno",
  title: "Problema de saúde após suplemento",
  status: "PUBLISHED",
  steps: [
    {
      ...baseFlow.steps[0],
      id: "pilot-step-1",
      title: "ETAPA-001 — Receber relato",
      kind: "DECISION",
      decision: { nodeKey: "ETAPA-001", options: [
        { label: "Relato reconhecido como caso deste fluxo", target: "ETAPA-002" },
        { label: "Fora do escopo", target: "RESULTADO-009" }
      ] },
      scripts: []
    },
    {
      ...baseFlow.steps[1],
      id: "pilot-step-2",
      title: "ETAPA-002 — Apresentação com nome",
      kind: "MANUAL",
      decision: { nodeKey: "ETAPA-002", options: [{ label: "Apresentação enviada", target: "ETAPA-003" }] },
      scripts: [{ id: "pilot-link", script: canonicalScript }]
    }
  ]
};

const personalScript = {
  id: "personal-1",
  title: "Resposta pessoal",
  channel: "EMAIL",
  body: "Retorno para {cliente}",
  tags: ["troca"],
  placeholders: ["cliente"],
  suggestedAt: null,
  flows: [{ id: baseFlow.id, slug: baseFlow.slug, title: baseFlow.title, status: baseFlow.status }],
  suggestion: null
};

const metrics = {
  summary: { totalFlows: 1, publishedFlows: 0, reviewDue: 1, openSessions: 0 },
  mostUsedFlows: [{ flowId: baseFlow.id, title: baseFlow.title, sessions: 3 }],
  stepBottlenecks: [{ stepId: "step-1", stepTitle: "Validar pedido", flowTitle: baseFlow.title, status: "PENDING", count: 2 }],
  topScriptsByFlow: [{ id: canonicalScript.id, title: canonicalScript.title, count: 4 }],
  zeroSearches: [{ id: "zero-1", query: "cancelamento", filtersJson: null, createdAt: "2026-07-15T12:00:00.000Z" }]
};

function session(status = "OPEN", stepStatus = "PENDING") {
  return {
    id: "session-1",
    status,
    startedAt: "2026-07-15T12:00:00.000Z",
    completedAt: status === "COMPLETED" ? "2026-07-15T12:10:00.000Z" : null,
    flow: { id: baseFlow.id, slug: baseFlow.slug, title: baseFlow.title },
    caseData: {},
    report: stepStatus === "PENDING"
      ? "Atendimento - Troca segura"
      : "Troca segura · v2\n- Validar pedido — Decisão: Troca · Nota: Cliente validado",
    steps: baseFlow.steps.map((step, index) => ({
      id: `session-step-${index + 1}`,
      stepId: step.id,
      status: index === 0 ? stepStatus : "PENDING",
      decision: index === 0 && stepStatus !== "PENDING" ? "Troca" : null,
      note: index === 0 && stepStatus !== "PENDING" ? "Cliente validado" : null,
      completedAt: stepStatus === "DONE" && index === 0 ? "2026-07-15T12:05:00.000Z" : null,
      step: { id: step.id, title: step.title, order: step.order, required: step.required }
    }))
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((next) => {
    resolve = next;
  });
  return { promise, resolve };
}

function successfulApi(path: string, init?: RequestInit) {
  if (path.startsWith("/v1/service-flows?")) return Promise.resolve({ items: [baseFlow], canManage: true });
  if (path === "/v1/script-library") return Promise.resolve({ scripts: [canonicalScript, obsoleteScript] });
  if (path === "/v1/script-library/personal-scripts") return Promise.resolve({ items: [personalScript] });
  if (path === "/v1/service-flows/metrics/summary") return Promise.resolve(metrics);
  if (path === `/v1/service-flows/${baseFlow.id}/sessions`) return Promise.resolve({ session: session() });
  if (path === "/v1/service-flow-sessions/session-1/case-data") {
    const body = JSON.parse(String(init?.body));
    return Promise.resolve({ session: { ...session(), caseData: body.values } });
  }
  if (path.startsWith("/v1/service-flow-sessions/session-1/steps/")) {
    const body = JSON.parse(String(init?.body));
    return Promise.resolve({ session: session("OPEN", body.status) });
  }
  if (path === "/v1/service-flow-sessions/session-1/complete") return Promise.resolve({ session: session("COMPLETED", "DONE") });
  if (path === "/v1/service-flows" && init?.method === "POST") return Promise.resolve({ flow: { ...baseFlow, id: "flow-created" } });
  if (path === `/v1/service-flows/${baseFlow.id}/publish`) return Promise.resolve({ flow: { ...baseFlow, status: "PUBLISHED", version: 3 } });
  if (path === `/v1/service-flows/${baseFlow.id}/archive`) return Promise.resolve({ flow: { ...baseFlow, status: "ARCHIVED" } });
  if (path === `/v1/script-library/scripts/${canonicalScript.id}/copy`) return Promise.resolve({});
  return Promise.resolve({});
}

describe("ServiceFlowsView", () => {
  beforeEach(() => {
    apiMock.mockReset().mockImplementation(successfulApi);
    clipboardWriteMock.mockReset().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: clipboardWriteMock }
    });
  });

  it("keeps loading visible, lists sanitized API data and renders the empty state", async () => {
    const pendingFlows = deferred<{ items: typeof baseFlow[]; canManage: boolean }>();
    apiMock.mockImplementation((path: string, init?: RequestInit) => path.startsWith("/v1/service-flows?")
      ? pendingFlows.promise
      : successfulApi(path, init));

    const loaded = render(<ServiceFlowsView user={users.sac} />);
    expect(screen.getByText("Carregando fluxos").closest("[role='status']")).toBeInTheDocument();

    pendingFlows.resolve({ items: [baseFlow], canManage: false });
    expect(await screen.findByRole("heading", { name: baseFlow.title })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Orientacao" }).nextElementSibling).toHaveTextContent("<script>nao executar</script>");
    expect(document.querySelector("script")).toBeNull();
    expect(screen.getByRole("link", { name: "inseguro" })).toHaveAttribute("href", "#");
    expect(screen.queryByText("Texto obsoleto")).not.toBeInTheDocument();
    loaded.unmount();

    apiMock.mockImplementation((path: string, init?: RequestInit) => path.startsWith("/v1/service-flows?")
      ? Promise.resolve({ items: [], canManage: false })
      : successfulApi(path, init));
    render(<ServiceFlowsView user={users.sac} />);
    expect(await screen.findByText("Nenhum fluxo encontrado")).toBeInTheDocument();
    expect(screen.getByText("Selecione um fluxo")).toBeInTheDocument();
  });

  it("filters the listing while keeping governance and creation unavailable to SAC", async () => {
    const user = userEvent.setup();
    render(<ServiceFlowsView user={users.sac} />);
    await screen.findByRole("heading", { name: baseFlow.title });

    expect(screen.queryByRole("heading", { name: "Governança do fluxo" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Novo fluxo de atendimento" })).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: "Status" })).not.toBeInTheDocument();
    expect(apiMock).not.toHaveBeenCalledWith("/v1/service-flows/metrics/summary");

    await user.type(screen.getByRole("textbox", { name: "Busca" }), "troca segura");
    await user.click(screen.getByRole("button", { name: "Filtrar" }));
    await waitFor(() => expect(apiMock).toHaveBeenCalledWith("/v1/service-flows?query=troca+segura"));
    await user.selectOptions(screen.getByRole("combobox", { name: "Tag" }), "seguranca");
    await waitFor(() => expect(apiMock).toHaveBeenCalledWith(expect.stringContaining("tag=seguranca")));
  });

  it("creates a governed flow with normalized tags, decisions and related scripts", async () => {
    const user = userEvent.setup();
    render(<ServiceFlowsView user={users.manager} />);
    await screen.findByRole("heading", { name: "Novo fluxo de atendimento" });
    expect(await screen.findByRole("heading", { name: "Uso dos fluxos" })).toBeInTheDocument();

    const creation = screen.getByRole("heading", { name: "Novo fluxo de atendimento" }).closest("section");
    const form = within(creation as HTMLElement);
    await user.type(form.getByRole("textbox", { name: "Título" }), "Cancelamento assistido");
    await user.type(form.getByRole("textbox", { name: "Resumo" }), "Decisao segura");
    await user.type(form.getByRole("textbox", { name: "Tags" }), " Cancelamento, #Pedido, cancelamento ");
    await user.type(form.getByRole("textbox", { name: "Conteúdo de apoio" }), "## Politica\nSem automacao.");
    await user.type(form.getByRole("textbox", { name: "Etapa" }), "Validar pedido para troca");
    await user.selectOptions(form.getByRole("combobox", { name: "Tipo" }), "YES_NO");
    await user.type(form.getByRole("textbox", { name: "Orientação da etapa" }), "Confirme dados do pedido.");
    await user.type(form.getByRole("textbox", { name: "Se sim" }), "Prosseguir com cancelamento");
    await user.type(form.getByRole("textbox", { name: "Se não" }), "Escalar para gestao");
    await user.selectOptions(form.getByRole("listbox", { name: "Scripts relacionados" }), canonicalScript.id);
    await user.click(form.getByRole("button", { name: "Criar fluxo" }));

    await waitFor(() => expect(apiMock).toHaveBeenCalledWith("/v1/service-flows", expect.objectContaining({ method: "POST" })));
    const request = apiMock.mock.calls.find(([path, init]) => path === "/v1/service-flows" && (init as RequestInit)?.method === "POST");
    const payload = JSON.parse(String((request?.[1] as RequestInit).body));
    expect(payload).toMatchObject({
      title: "Cancelamento assistido",
      summary: "Decisao segura",
      tags: ["cancelamento", "pedido"],
      steps: [{
        title: "Validar pedido para troca",
        kind: "YES_NO",
        order: 1,
        required: true,
        decision: { yes: "Prosseguir com cancelamento", no: "Escalar para gestao" },
        scriptIds: [canonicalScript.id]
      }]
    });
    await waitFor(() => expect(apiMock.mock.calls.filter(([path]) => String(path).startsWith("/v1/service-flows?")).length).toBeGreaterThan(1));
  });

  it("publishes and archives through HTTP while preserving the visible version on conflict", async () => {
    const user = userEvent.setup();
    let publishAttempts = 0;
    apiMock.mockImplementation((path: string, init?: RequestInit) => {
      if (path === `/v1/service-flows/${baseFlow.id}/publish`) {
        publishAttempts += 1;
        return publishAttempts === 1
          ? Promise.reject(new Error("Conflito: o fluxo ganhou uma nova versao."))
          : successfulApi(path, init);
      }
      return successfulApi(path, init);
    });
    render(<ServiceFlowsView user={users.manager} />);
    await screen.findByText("v2 · DRAFT", { exact: false });

    await user.type(screen.getByRole("textbox", { name: "Comentário obrigatório" }), "Revisao da politica");
    await user.click(screen.getByRole("button", { name: "Publicar versão" }));
    expect(await screen.findByText("Conflito: o fluxo ganhou uma nova versao.")).toBeInTheDocument();
    expect(screen.getByText("v2 · DRAFT", { exact: false })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Comentário obrigatório" })).toHaveValue("Revisao da politica");

    await user.click(screen.getByRole("button", { name: "Publicar versão" }));
    await waitFor(() => expect(publishAttempts).toBe(2));
    expect(screen.getByRole("textbox", { name: "Comentário obrigatório" })).toHaveValue("");

    await user.type(screen.getByRole("textbox", { name: "Comentário obrigatório" }), "Fluxo substituido");
    await user.click(screen.getByRole("button", { name: "Arquivar" }));
    await waitFor(() => expect(apiMock).toHaveBeenCalledWith(
      `/v1/service-flows/${baseFlow.id}/archive`,
      expect.objectContaining({ method: "POST", body: JSON.stringify({ comment: "Fluxo substituido", reviewDueAt: null }) })
    ));
  });

  it("runs the guided session with audited decision, rollback-safe error and completion", async () => {
    const user = userEvent.setup();
    vi.spyOn(navigator.clipboard, "writeText").mockImplementation(clipboardWriteMock);
    let stepAttempts = 0;
    apiMock.mockImplementation((path: string, init?: RequestInit) => {
      if (path === "/v1/service-flow-sessions/session-1/steps/step-1") {
        stepAttempts += 1;
        return stepAttempts === 1 ? Promise.reject(new Error("Etapa alterada em outra sessao.")) : successfulApi(path, init);
      }
      return successfulApi(path, init);
    });
    render(<ServiceFlowsView user={users.sac} />);
    await screen.findByRole("heading", { name: baseFlow.title });

    await user.click(screen.getByRole("button", { name: "Iniciar atendimento" }));
    expect(await screen.findByText("Atendimento em andamento")).toBeInTheDocument();
    const partialReport = screen.getByRole("heading", { name: "Resumo para sussurro" }).closest("section");
    expect(partialReport).not.toBeNull();
    expect(within(partialReport!).getByText("Parcial")).toBeInTheDocument();
    await user.click(within(partialReport!).getByRole("button", { name: "Copiar resumo" }));
    expect(clipboardWriteMock).toHaveBeenLastCalledWith("Atendimento - Troca segura");
    await user.type(screen.getByRole("textbox", { name: "Decisão tomada" }), "Troca");
    await user.type(screen.getByRole("textbox", { name: "Nota interna" }), "Cliente validado");
    await user.click(screen.getByRole("button", { name: "Concluir etapa" }));

    expect(await screen.findByText("Etapa alterada em outra sessao.")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Decisão tomada" })).toHaveValue("Troca");
    expect(screen.getByRole("textbox", { name: "Nota interna" })).toHaveValue("Cliente validado");
    await user.click(screen.getByRole("button", { name: "Concluir etapa" }));
    await waitFor(() => expect(apiMock).toHaveBeenLastCalledWith(
      "/v1/service-flow-sessions/session-1/steps/step-1",
      { method: "POST", body: JSON.stringify({ status: "DONE", decision: "Troca", note: "Cliente validado" }) }
    ));
    expect(await screen.findByText("DONE · YES_NO · obrigatório")).toBeInTheDocument();
    expect(partialReport).toHaveTextContent("Validar pedido — Decisão: Troca · Nota: Cliente validado");

    await user.click(screen.getByRole("button", { name: "Concluir atendimento" }));
    expect(await screen.findByText("Atendimento concluído")).toBeInTheDocument();
    const finalReport = screen.getByRole("heading", { name: "Resumo para sussurro" }).closest("section");
    expect(finalReport).not.toBeNull();
    expect(within(finalReport!).getByText("Final")).toBeInTheDocument();
    await user.click(screen.getByTitle("Copiar resumo"));
    expect(clipboardWriteMock).toHaveBeenCalledWith("Troca segura · v2\n- Validar pedido — Decisão: Troca · Nota: Cliente validado");
    expect(screen.getAllByRole("button", { name: "Concluir etapa" }).every((button) => button.hasAttribute("disabled"))).toBe(true);
  });

  it("turns a versioned decision into a clickable audited path", async () => {
    const user = userEvent.setup();
    const started = {
      id: "pilot-session", status: "OPEN", startedAt: "2026-07-15T12:00:00.000Z", completedAt: null,
      flow: { id: pilotFlow.id, slug: pilotFlow.slug, title: pilotFlow.title },
      version: { id: "pilot-version", version: 1, title: pilotFlow.title, publishedAt: "2026-07-15T12:00:00.000Z" },
      steps: [
        { id: "visit-start", stepId: null, nodeKey: "START", nodeSnapshotJson: JSON.stringify({ terminal: false }), status: "DONE", decision: null, note: null, completedAt: null, step: null },
        { id: "visit-1", stepId: null, nodeKey: "ETAPA-001", nodeSnapshotJson: JSON.stringify({ terminal: false }), status: "PENDING", decision: null, note: null, completedAt: null, step: null }
      ]
    };
    apiMock.mockImplementation((path: string, init?: RequestInit) => {
      if (path.startsWith("/v1/service-flows?")) return Promise.resolve({ items: [pilotFlow], canManage: false });
      if (path === "/v1/script-library") return Promise.resolve({ scripts: [canonicalScript] });
      if (path === "/v1/script-library/personal-scripts") return Promise.resolve({ items: [] });
      if (path === `/v1/service-flows/${pilotFlow.id}/sessions`) return Promise.resolve({ session: started });
      if (path === "/v1/service-flow-sessions/pilot-session/steps/ETAPA-001") {
        return Promise.resolve({ session: {
          ...started,
          steps: [
            started.steps[0],
            { ...started.steps[1], status: "DONE", decision: "Relato reconhecido como caso deste fluxo" },
            { id: "visit-2", stepId: null, nodeKey: "ETAPA-002", status: "PENDING", decision: null, note: null, completedAt: null, step: null }
          ]
        } });
      }
      return successfulApi(path, init);
    });

    render(<ServiceFlowsView user={users.sac} />);
    await screen.findByRole("heading", { name: pilotFlow.title });
    const runner = within(document.querySelector(".service-flow-runner") as HTMLElement);
    expect(runner.queryByText(`/${pilotFlow.slug}`)).not.toBeInTheDocument();
    expect(runner.queryByText(pilotFlow.summary)).not.toBeInTheDocument();
    expect(runner.queryByRole("heading", { name: "Orientacao" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Iniciar atendimento" }));
    expect(await screen.findByText("ETAPA-001 — Receber relato")).toBeInTheDocument();
    expect(screen.queryByText("ETAPA-002 — Apresentação com nome")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Concluir atendimento" })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Relato reconhecido como caso deste fluxo" }));

    await waitFor(() => expect(apiMock).toHaveBeenCalledWith(
      "/v1/service-flow-sessions/pilot-session/steps/ETAPA-001",
      { method: "POST", body: JSON.stringify({ status: "DONE", decision: "Relato reconhecido como caso deste fluxo", note: null }) }
    ));
    expect(await screen.findByText("ETAPA-002 — Apresentação com nome")).toBeInTheDocument();
    const nextStep = screen.getByText("ETAPA-002 — Apresentação com nome").closest("article");
    await waitFor(() => expect(nextStep).toHaveFocus());
    expect(screen.queryByText("Fora do escopo")).not.toBeInTheDocument();
  });

  it("advances from the health decision into the reverse-logistics subflow without a generic completion button", async () => {
    const user = userEvent.setup();
    const reverseFlow = {
      ...pilotFlow,
      steps: [
        {
          ...pilotFlow.steps[0],
          id: "pilot-step-13",
          title: "ETAPA-013 — Verificar necessidade de reversa",
          decision: { nodeKey: "ETAPA-013", options: [
            { label: "Há ao menos um item lacrado: iniciar reversa", target: "ETAPA-015" },
            { label: "Tudo está aberto: dispensar reversa", target: "ETAPA-019" }
          ] }
        },
        {
          ...pilotFlow.steps[1],
          id: "pilot-step-15",
          title: "ETAPA-015 — Calcular valor e gerar logística reversa",
          decision: { nodeKey: "ETAPA-015", options: [{ label: "Código válido gerado manualmente", target: "ETAPA-016" }] }
        }
      ]
    };
    const started = {
      id: "reverse-session", status: "OPEN", startedAt: "2026-07-16T12:00:00.000Z", completedAt: null,
      flow: { id: reverseFlow.id, slug: reverseFlow.slug, title: reverseFlow.title },
      version: { id: "pilot-version", version: 7, title: reverseFlow.title, publishedAt: "2026-07-16T12:00:00.000Z" },
      caseData: {},
      steps: [{ id: "visit-13", stepId: null, nodeKey: "ETAPA-013", nodeSnapshotJson: '{"requiredFacts":[]}', status: "PENDING", decision: null, note: null, completedAt: null, step: null }]
    };
    apiMock.mockImplementation((path: string, init?: RequestInit) => {
      if (path.startsWith("/v1/service-flows?")) return Promise.resolve({ items: [reverseFlow], canManage: false });
      if (path === "/v1/script-library") return Promise.resolve({ scripts: [] });
      if (path === "/v1/script-library/personal-scripts") return Promise.resolve({ items: [] });
      if (path === `/v1/service-flows/${reverseFlow.id}/sessions`) return Promise.resolve({ session: started });
      if (path === "/v1/service-flow-sessions/reverse-session/steps/ETAPA-013") return Promise.resolve({ session: {
        ...started,
        steps: [
          { ...started.steps[0], status: "DONE", decision: "Há ao menos um item lacrado: iniciar reversa" },
          { id: "visit-15", stepId: null, nodeKey: "ETAPA-015", nodeSnapshotJson: '{"requiredFacts":[]}', status: "PENDING", decision: null, note: null, completedAt: null, step: null }
        ]
      } });
      return successfulApi(path, init);
    });

    render(<ServiceFlowsView user={users.sac} />);
    await screen.findByRole("heading", { name: reverseFlow.title });
    await user.click(screen.getByRole("button", { name: "Iniciar atendimento" }));
    expect(screen.queryByRole("button", { name: "Concluir etapa" })).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "Decisão tomada" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Há ao menos um item lacrado: iniciar reversa" }));

    expect(await screen.findByText("ETAPA-015 — Calcular valor e gerar logística reversa")).toBeInTheDocument();
    const reverseStep = screen.getByText("ETAPA-015 — Calcular valor e gerar logística reversa").closest("article");
    await waitFor(() => expect(reverseStep).toHaveFocus());
  });

  it("blocks a versioned health gate until its declared case facts are filled", async () => {
    const user = userEvent.setup();
    const started = {
      id: "required-session", status: "OPEN", startedAt: "2026-07-15T12:00:00.000Z", completedAt: null,
      flow: { id: pilotFlow.id, slug: pilotFlow.slug, title: pilotFlow.title },
      version: { id: "pilot-version", version: 1, title: pilotFlow.title, publishedAt: "2026-07-15T12:00:00.000Z" },
      caseData: {},
      steps: [{
        id: "visit-1", stepId: null, nodeKey: "ETAPA-001",
        nodeSnapshotJson: JSON.stringify({
          type: "CONTEXT",
          requiredFacts: [
            "customer.name",
            "custom.alwaysfit.health.usage",
            "custom.alwaysfit.health.symptom.persistent",
            "custom.alwaysfit.treatment.unusable.scope",
            "custom.alwaysfit.return.open.items",
            "custom.alwaysfit.return.returned.sealed.items",
            "custom.alwaysfit.return.retained.sealed.items",
            "custom.alwaysfit.financial.retained.sealed.value"
          ],
          optionalFacts: ["produto_1", "produto_2", "produto_3", "custom.alwaysfit.return.sealed.items"],
          terminal: false
        }),
        status: "PENDING", decision: null, note: null, completedAt: null, step: null
      }]
    };
    apiMock.mockImplementation((path: string, init?: RequestInit) => {
      if (path.startsWith("/v1/service-flows?")) return Promise.resolve({ items: [pilotFlow], canManage: false });
      if (path === "/v1/script-library") return Promise.resolve({ scripts: [] });
      if (path === "/v1/script-library/personal-scripts") return Promise.resolve({ items: [] });
      if (path === `/v1/service-flows/${pilotFlow.id}/sessions`) return Promise.resolve({ session: started });
      if (path === "/v1/service-flow-sessions/required-session/case-data") {
        const values = JSON.parse(String(init?.body)).values;
        return Promise.resolve({ session: { ...started, caseData: values } });
      }
      if (path === "/v1/service-flow-sessions/required-session/steps/ETAPA-001") return Promise.resolve({ session: {
        ...started,
        caseData: { "customer.name": "Maria" },
        steps: [{ ...started.steps[0], status: "DONE", decision: "Relato reconhecido como caso deste fluxo" }]
      } });
      return successfulApi(path, init);
    });

    render(<ServiceFlowsView user={users.sac} />);
    await screen.findByRole("heading", { name: pilotFlow.title });
    await user.click(screen.getByRole("button", { name: "Iniciar atendimento" }));
    const decision = screen.getByRole("button", { name: "Relato reconhecido como caso deste fluxo" });
    expect(decision).toBeDisabled();
    expect(screen.getByText("Complete a ficha antes de avançar")).toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "Forma e período de uso" })).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "O mal-estar permanece?" })).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: /Escopo que não poderá/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "Produto 1" })).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "Itens abertos" })).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: /Lacrados que serão devolvidos/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: /Lacrados que ficarão/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: /Valor dos lacrados retidos/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: "Itens lacrados" })).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "Data de recebimento" })).not.toBeInTheDocument();
    const caseSheet = screen.getByRole("region", { name: "Dados do caso" });
    expect(within(caseSheet).getAllByRole("textbox")).toHaveLength(2);
    expect(within(caseSheet).getByRole("textbox", { name: "CPF do cliente" })).toBeRequired();
    expect(within(caseSheet).getByRole("combobox", { name: "Produtos do pedido" })).toBeRequired();
    const customerName = screen.getByRole("textbox", { name: /Nome do cliente/ });
    expect(customerName).toBeRequired();
    await user.type(customerName, "Maria");
    expect(decision).toBeEnabled();
    await user.click(decision);
    expect(apiMock).toHaveBeenCalledWith(
      "/v1/service-flow-sessions/required-session/case-data",
      { method: "PATCH", body: JSON.stringify({ values: { "customer.name": "Maria" } }) }
    );
  });

  it("masks CPF and requires it only for the decision that confirms collection", async () => {
    const user = userEvent.setup();
    const cpfFlow = {
      ...pilotFlow,
      steps: [{
        ...pilotFlow.steps[0],
        title: "ETAPA-003 — Conseguir CPF",
        decision: { nodeKey: "ETAPA-003", options: [
          { label: "CPF obtido", target: "ETAPA-004", requiredFacts: ["customer.cpf"] },
          { label: "Cliente não informou", target: "RESULTADO-009" }
        ] }
      }]
    };
    const started = {
      id: "cpf-session", status: "OPEN", startedAt: "2026-07-15T12:00:00.000Z", completedAt: null,
      flow: { id: cpfFlow.id, slug: cpfFlow.slug, title: cpfFlow.title },
      version: { id: "pilot-version", version: 1, title: cpfFlow.title, publishedAt: "2026-07-15T12:00:00.000Z" },
      caseData: {},
      steps: [{
        id: "visit-cpf", stepId: null, nodeKey: "ETAPA-003",
        nodeSnapshotJson: JSON.stringify({ optionalFacts: ["customer.cpf"], terminal: false }),
        status: "PENDING", decision: null, note: null, completedAt: null, step: null
      }]
    };
    apiMock.mockImplementation((path: string, init?: RequestInit) => {
      if (path.startsWith("/v1/service-flows?")) return Promise.resolve({ items: [cpfFlow], canManage: false });
      if (path === "/v1/script-library") return Promise.resolve({ scripts: [] });
      if (path === "/v1/script-library/personal-scripts") return Promise.resolve({ items: [] });
      if (path === `/v1/service-flows/${cpfFlow.id}/sessions`) return Promise.resolve({ session: started });
      return successfulApi(path, init);
    });

    render(<ServiceFlowsView user={users.sac} />);
    await screen.findByRole("heading", { name: cpfFlow.title });
    await user.click(screen.getByRole("button", { name: "Iniciar atendimento" }));
    const positive = screen.getByRole("button", { name: "CPF obtido" });
    const negative = screen.getByRole("button", { name: "Cliente não informou" });
    expect(positive).toBeDisabled();
    expect(negative).toBeEnabled();

    const cpf = screen.getByRole("textbox", { name: "CPF do cliente" });
    await user.type(cpf, "70048683469");
    expect(cpf).toHaveValue("700.486.834-69");
    expect(positive).toBeEnabled();
  });

  it("keeps an allow-loop decision open and focused on the same step", async () => {
    const user = userEvent.setup();
    const loopFlow = {
      ...pilotFlow,
      steps: [{
        ...pilotFlow.steps[0],
        decision: { nodeKey: "ETAPA-001", options: [{ label: "Resposta incompleta", target: "ETAPA-001" }] }
      }]
    };
    const started = {
      id: "loop-session", status: "OPEN", startedAt: "2026-07-15T12:00:00.000Z", completedAt: null,
      flow: { id: loopFlow.id, slug: loopFlow.slug, title: loopFlow.title },
      version: { id: "pilot-version", version: 1, title: loopFlow.title, publishedAt: "2026-07-15T12:00:00.000Z" },
      caseData: {},
      steps: [{ id: "visit-loop", stepId: null, nodeKey: "ETAPA-001", nodeSnapshotJson: '{"requiredFacts":[]}', status: "PENDING", decision: null, note: null, completedAt: null, step: null }]
    };
    apiMock.mockImplementation((path: string, init?: RequestInit) => {
      if (path.startsWith("/v1/service-flows?")) return Promise.resolve({ items: [loopFlow], canManage: false });
      if (path === "/v1/script-library") return Promise.resolve({ scripts: [] });
      if (path === "/v1/script-library/personal-scripts") return Promise.resolve({ items: [] });
      if (path === `/v1/service-flows/${loopFlow.id}/sessions`) return Promise.resolve({ session: started });
      if (path === "/v1/service-flow-sessions/loop-session/steps/ETAPA-001") return Promise.resolve({ session: {
        ...started,
        steps: [{ ...started.steps[0], status: "PENDING", decision: "Resposta incompleta" }]
      } });
      return successfulApi(path, init);
    });

    render(<ServiceFlowsView user={users.sac} />);
    await screen.findByRole("heading", { name: loopFlow.title });
    await user.click(screen.getByRole("button", { name: "Iniciar atendimento" }));
    await user.click(screen.getByRole("button", { name: "Resposta incompleta" }));
    const loopStep = screen.getByText("ETAPA-001 — Receber relato").closest("article");
    await waitFor(() => expect(loopStep).toHaveFocus());
    expect(screen.getByRole("button", { name: "Resposta incompleta" })).toBeInTheDocument();
  });

  it("persists one case form for every macro and restores it in the session", async () => {
    const user = userEvent.setup();
    render(<ServiceFlowsView user={users.sac} />);
    await screen.findByRole("heading", { name: baseFlow.title });
    await user.click(screen.getByRole("button", { name: "Iniciar atendimento" }));

    const customer = screen.getByRole("textbox", { name: "Nome do cliente" });
    await user.type(customer, "Maria Silva");
    expect(screen.getByText("Ola, Maria Silva. A troca esta autorizada.")).toBeInTheDocument();
    expect(screen.getByText("Retorno para Maria Silva")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => expect(apiMock).toHaveBeenCalledWith(
      "/v1/service-flow-sessions/session-1/case-data",
      { method: "PATCH", body: JSON.stringify({ values: { "customer.name": "Maria Silva" } }) }
    ));
    expect(await screen.findByText("Dados salvos")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Nome do cliente" })).toHaveValue("Maria Silva");
  });

  it("resumes a completed step while preserving following records for reconfirmation", async () => {
    const user = userEvent.setup();
    const completed = session("OPEN", "DONE");
    completed.steps[1] = { ...completed.steps[1], status: "DONE", decision: "Troca", note: "Pedido preparado", completedAt: "2026-07-15T12:06:00.000Z" };
    apiMock.mockImplementation((path: string, init?: RequestInit) => {
      if (path === `/v1/service-flows/${baseFlow.id}/sessions`) return Promise.resolve({ session: completed });
      if (path === "/v1/service-flow-sessions/session-1/steps/step-1/rewind") return Promise.resolve({ session: {
        ...completed,
        steps: [
          { ...completed.steps[0], status: "PENDING", completedAt: null },
          { ...completed.steps[1], status: "RECONFIRMATION_REQUIRED", completedAt: null }
        ]
      } });
      return successfulApi(path, init);
    });
    render(<ServiceFlowsView user={users.sac} />);
    await screen.findByRole("heading", { name: baseFlow.title });
    await user.click(screen.getByRole("button", { name: "Iniciar atendimento" }));
    await user.click(screen.getByRole("button", { name: "Retomar daqui" }));
    expect(screen.getByRole("dialog", { name: "Validar pedido" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Editar e reconfirmar caminho/ }));

    await waitFor(() => expect(apiMock).toHaveBeenCalledWith(
      "/v1/service-flow-sessions/session-1/steps/step-1/rewind",
      { method: "POST", body: JSON.stringify({ strategy: "RECONFIRM_FOLLOWING" }) }
    ));
    expect(screen.getByText("RECONFIRMATION_REQUIRED · CHECKLIST")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Concluir atendimento" })).toBeDisabled();
  });

  it("confirms restart and replaces the active case with a fresh audited session", async () => {
    const user = userEvent.setup();
    const fresh = { ...session(), id: "session-2", caseData: {}, steps: session().steps.map((step) => ({ ...step, id: `${step.id}-new` })) };
    apiMock.mockImplementation((path: string, init?: RequestInit) => {
      if (path === "/v1/service-flow-sessions/session-1/restart") return Promise.resolve({ session: fresh });
      return successfulApi(path, init);
    });
    render(<ServiceFlowsView user={users.sac} />);
    await screen.findByRole("heading", { name: baseFlow.title });
    await user.click(screen.getByRole("button", { name: "Iniciar atendimento" }));
    await user.type(screen.getByRole("textbox", { name: "Nome do cliente" }), "Maria");
    await user.click(screen.getByRole("button", { name: "Reiniciar" }));
    expect(screen.getByRole("dialog", { name: "Começar este caso novamente?" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Reiniciar com ficha vazia" }));

    await waitFor(() => expect(apiMock).toHaveBeenCalledWith("/v1/service-flow-sessions/session-1/restart", { method: "POST" }));
    expect(screen.getByRole("textbox", { name: "Nome do cliente" })).toHaveValue("");
  });

  it("renders placeholders safely and audits canonical script copy in the active session", async () => {
    const user = userEvent.setup();
    vi.spyOn(navigator.clipboard, "writeText").mockImplementation(clipboardWriteMock);
    render(<ServiceFlowsView user={users.sac} />);
    await screen.findByRole("heading", { name: baseFlow.title });
    await user.click(screen.getByRole("button", { name: "Iniciar atendimento" }));
    await screen.findByText("Atendimento em andamento");

    await user.type(screen.getByRole("textbox", { name: "Nome do cliente" }), "Maria <script>");
    await user.click(screen.getByRole("button", { name: "Copiar script" }));
    const rendered = "Ola, Maria <script>. A troca esta autorizada.";
    await waitFor(() => expect(clipboardWriteMock).toHaveBeenCalledWith(rendered));
    expect(apiMock).toHaveBeenCalledWith(
      `/v1/script-library/scripts/${canonicalScript.id}/copy`,
      {
        method: "POST",
        body: JSON.stringify({ renderedText: rendered, placeholders: { cliente: "Maria <script>" }, serviceFlowSessionId: "session-1" })
      }
    );
    expect(document.querySelectorAll("script")).toHaveLength(0);
  });
});
