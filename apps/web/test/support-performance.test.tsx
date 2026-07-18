import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { supportMetricDefinitions, type CurrentUser } from "@alwaystrack/shared";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SupportPerformanceView } from "../src/views/support-performance";

const apiMock = vi.fn();
vi.mock("../src/api", () => ({ api: (...args: unknown[]) => apiMock(...args) }));

const sac: CurrentUser = { id: "sac-1", name: "Ana", email: "ana@example.com", role: "SAC", organizationId: "org-1", unitScopeIds: [], sectorScopeIds: [] };
const manager: CurrentUser = { ...sac, id: "manager-1", role: "GESTOR" };
const agent = { id: "sac-1", name: "Ana", email: "ana@example.com" };
const team = { id: "team-1", name: "SAC Atendimento" };

const baseEntry = {
  id: "entry-csat",
  metric: "CSAT_SCORE",
  definitionVersion: 2,
  unit: "SCORE_1_5",
  channel: null,
  granularity: "REPORTED_INTERVAL",
  observationType: "ACTUAL",
  rawValue: "4,4",
  dataState: "AVAILABLE",
  value: 4.4,
  numerator: 352,
  denominator: 80,
  scopeType: "USER",
  userId: "sac-1",
  user: agent,
  teamLabel: null,
  teamId: null,
  team: null,
  periodStart: "2026-07-14T03:00:00.000Z",
  periodEnd: "2026-07-15T02:59:59.999Z",
  source: "Painel diário",
  note: "Validado",
  status: "APPROVED",
  revision: 1,
  supersedesId: null,
  submittedAt: "2026-07-15T03:00:00.000Z",
  reviewedAt: "2026-07-15T03:00:00.000Z",
  reviewedById: "manager-1",
  reviewNote: null,
  createdAt: "2026-07-15T03:00:00.000Z",
  updatedAt: "2026-07-15T03:00:00.000Z"
} as const;

const performanceResponse = {
  canManage: true,
  dictionaryVersion: 2,
  definitions: supportMetricDefinitions,
  period: { from: "2026-07-01T03:00:00.000Z", to: "2026-07-18T02:59:59.999Z" },
  agents: [agent],
  teams: [team],
  pendingReviewCount: 0,
  summary: [
    { metric: "CSAT_SCORE", definitionVersion: 2, unit: "SCORE_1_5", channel: null, granularity: "REPORTED_INTERVAL", observationType: "ACTUAL", scopeType: "USER", userId: "sac-1", teamId: null, teamLabel: null, latest: 4.4, average: 4.3, samples: 80, aggregation: "WEIGHTED_MEAN" },
    { metric: "SLA_DURATION", definitionVersion: 2, unit: "DURATION_SECONDS", channel: null, granularity: "REPORTED_INTERVAL", observationType: "ACTUAL", scopeType: "USER", userId: "sac-1", teamId: null, teamLabel: null, latest: 778, average: 778, samples: 40, aggregation: "WEIGHTED_MEAN" },
    { metric: "SATISFACTION_RATE", definitionVersion: 2, unit: "PERCENT", channel: "TIKTOK", granularity: "REPORTED_MONTH", observationType: "ACTUAL", scopeType: "ORGANIZATION", userId: null, teamId: null, teamLabel: null, latest: 82.8, average: 82.8, samples: 100, aggregation: "RATIO" },
    { metric: "FIRST_RESPONSE_TIME", definitionVersion: 2, unit: "DURATION_SECONDS", channel: "TIKTOK", granularity: "REPORTED_MONTH", observationType: "ACTUAL", scopeType: "ORGANIZATION", userId: null, teamId: null, teamLabel: null, latest: 9300, average: 9300, samples: 20, aggregation: "WEIGHTED_MEAN" }
  ],
  entries: [baseEntry],
  campaigns: []
};

describe("SupportPerformanceView", () => {
  beforeEach(() => {
    apiMock.mockReset();
    apiMock.mockImplementation((path: string) => Promise.resolve(path.startsWith("/v1/support/performance?") ? performanceResponse : {}));
  });

  it("shows native SAC units and dimensions without manager entry controls", async () => {
    render(<SupportPerformanceView user={sac} />);

    expect((await screen.findAllByText("4,4 / 5"))[0]).toBeInTheDocument();
    expect(screen.getAllByText("12min58s").length).toBeGreaterThan(0);
    expect(screen.getAllByText("82,8%").length).toBeGreaterThan(0);
    expect(screen.getAllByText("2h35min").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/TikTok · Fechamento mensal · Realizado/)).toHaveLength(2);
    expect(screen.getByRole("table", { name: "Histórico de indicadores SAC" })).toHaveTextContent("Painel diário");
    expect(screen.queryByRole("tab", { name: "Lançamentos" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Criar correção" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Agente")).not.toBeInTheDocument();
  });

  it("converts a human duration and submits every series dimension", async () => {
    const user = userEvent.setup();
    render(<SupportPerformanceView user={manager} />);
    await screen.findAllByText("4,4 / 5");

    await user.click(screen.getByRole("tab", { name: "Lançamentos" }));
    const createSection = screen.getByRole("heading", { name: "Criar rascunho" }).closest("section")!;
    await user.selectOptions(within(createSection).getByLabelText("Métrica"), "SLA_DURATION");
    await user.type(within(createSection).getByLabelText("Valor"), "12min58s");
    await user.type(within(createSection).getByLabelText("Atendimentos considerados"), "40");
    await user.type(within(createSection).getByLabelText("Canal"), "whatsapp");
    await user.selectOptions(within(createSection).getByLabelText("Tipo"), "EXPECTATION");
    await user.selectOptions(within(createSection).getByLabelText("Escopo"), "USER");
    await user.selectOptions(within(createSection).getByLabelText("Agente"), "sac-1");
    await user.type(within(createSection).getByLabelText("Fonte"), "Relatório semanal");
    await user.click(within(createSection).getByRole("button", { name: "Criar rascunho" }));

    await waitFor(() => expect(apiMock).toHaveBeenCalledWith("/v1/support/performance/entries", expect.objectContaining({
      method: "POST",
      body: expect.stringContaining('"metric":"SLA_DURATION","value":778,"sampleSize":40,"dataState":"AVAILABLE","channel":"WHATSAPP","granularity":"REPORTED_INTERVAL","observationType":"EXPECTATION","rawValue":"12min58s"')
    })));
  });

  it("edits current metrics but keeps legacy history read-only", async () => {
    const user = userEvent.setup();
    const legacyEntry = {
      ...baseEntry,
      id: "legacy-1",
      metric: "CSAT_LEGACY_PERCENT",
      definitionVersion: 1,
      unit: "PERCENT",
      rawValue: "94,5%",
      value: 94.5,
      numerator: 75.6
    };
    apiMock.mockImplementation((path: string) => Promise.resolve(path.startsWith("/v1/support/performance?")
      ? { ...performanceResponse, entries: [baseEntry, legacyEntry] }
      : {}));
    render(<SupportPerformanceView user={manager} />);

    expect(await screen.findAllByText("CSAT (legado percentual)")).toHaveLength(2);
    expect(screen.getByText(/somente leitura/)).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Criar correção" })).toHaveLength(1);
    await user.click(screen.getByRole("button", { name: "Criar correção" }));
    const editSection = screen.getByRole("heading", { name: "Editar rascunho" }).closest("section")!;
    const value = within(editSection).getByLabelText("Valor");
    await user.clear(value);
    await user.type(value, "4,8");
    await user.click(within(editSection).getByRole("button", { name: "Salvar rascunho" }));

    await waitFor(() => expect(apiMock).toHaveBeenCalledWith("/v1/support/performance/entries/entry-csat", {
      method: "PATCH",
      body: JSON.stringify({
        value: 4.8,
        sampleSize: 80,
        dataState: "AVAILABLE",
        channel: null,
        granularity: "REPORTED_INTERVAL",
        observationType: "ACTUAL",
        rawValue: "4,8",
        source: "Painel diário",
        note: "Validado"
      })
    }));
  });

  it("sends channel, granularity and observation filters to the API", async () => {
    const user = userEvent.setup();
    render(<SupportPerformanceView user={manager} />);
    await screen.findAllByText("4,4 / 5");

    const filters = screen.getByRole("button", { name: "Aplicar" }).closest("form")!;
    await user.type(within(filters).getByLabelText("Canal"), "tiktok");
    await user.selectOptions(within(filters).getByLabelText("Período"), "REPORTED_MONTH");
    await user.selectOptions(within(filters).getByLabelText("Tipo"), "EXPECTATION");
    await user.click(within(filters).getByRole("button", { name: "Aplicar" }));

    await waitFor(() => expect(apiMock.mock.calls.some(([path]) => String(path).includes("channel=TIKTOK")
      && String(path).includes("granularity=REPORTED_MONTH")
      && String(path).includes("observationType=EXPECTATION"))).toBe(true));
  });

  it("submits drafts and reviews submitted KPIs before publication", async () => {
    const user = userEvent.setup();
    const governedResponse = {
      ...performanceResponse,
      pendingReviewCount: 1,
      entries: [
        { ...baseEntry, id: "draft-1", status: "DRAFT", revision: 2, supersedesId: "entry-csat", reviewedAt: null, reviewedById: null },
        { ...baseEntry, id: "submitted-1", status: "SUBMITTED", revision: 1, submittedAt: "2026-07-16T03:00:00.000Z", reviewedAt: null, reviewedById: null }
      ]
    };
    apiMock.mockImplementation((path: string) => Promise.resolve(path.startsWith("/v1/support/performance?") ? governedResponse : {}));
    render(<SupportPerformanceView user={manager} />);

    expect(await screen.findByText(/1 em revisão/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Enviar" }));
    await waitFor(() => expect(apiMock).toHaveBeenCalledWith("/v1/support/performance/entries/draft-1/submit", { method: "POST" }));
    await user.click(screen.getByRole("button", { name: "Aprovar" }));
    await waitFor(() => expect(apiMock).toHaveBeenCalledWith("/v1/support/performance/entries/submitted-1/review", {
      method: "POST",
      body: JSON.stringify({ decision: "APPROVED", reviewNote: "Conferido na gestão SAC." })
    }));
  });
});
