import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CaseFlowHealthView } from "../src/views/case-flow/health";

const apiMock = vi.fn();

vi.mock("../src/api", () => ({ api: (...args: unknown[]) => apiMock(...args) }));

const healthResponse = {
  generatedAt: "2026-07-15T12:00:00.000Z",
  targetsMs: { ready: 1000 },
  connectors: [
    {
      connectorDefinitionId: "definition-healthy",
      connectorId: "tracking",
      displayName: "Rastreio",
      state: "HEALTHY",
      lastRunAt: "2026-07-15T12:00:00.000Z",
      successRate24h: 0.956,
      medianMs: 840,
      p95Ms: 2450,
      version: "2.1.0",
      lastSelectorDriftAt: null,
      lastLoginAt: "2026-07-15T11:00:00.000Z",
      lastCaptchaAt: null
    },
    {
      connectorDefinitionId: "definition-degraded",
      connectorId: "billing",
      displayName: "Faturamento",
      state: "DEGRADED",
      lastRunAt: null,
      successRate24h: null,
      medianMs: null,
      p95Ms: null,
      version: "1.4.2",
      lastSelectorDriftAt: null,
      lastLoginAt: null,
      lastCaptchaAt: null
    }
  ]
};

const successResponse = {
  windowHours: 24,
  dailyCases: 18,
  medianReadyMs: 950,
  clicks: 31,
  typedCharacters: 220,
  manualTabs: 4,
  correctedFlows: 3,
  reeditedMessages: 5,
  copiedMessages: 7,
  draftUses: 2,
  resolvedWithoutChatGpt: 11,
  estimatedTypingAvoided: 780,
  estimatedMinutesSaved: 26,
  connectors: [{ connectorId: "tracking", total: 15, successRate: 0.8 }]
};

function successfulApi(path: string) {
  return Promise.resolve(path.endsWith("/health") ? healthResponse : successResponse);
}

describe("CaseFlowHealthView operational coverage", () => {
  beforeEach(() => {
    apiMock.mockImplementation(successfulApi);
  });

  it("keeps loading announced until both diagnostics resolve", async () => {
    let resolveHealth!: (value: typeof healthResponse) => void;
    let resolveSuccess!: (value: typeof successResponse) => void;
    apiMock
      .mockImplementationOnce(() => new Promise((resolve) => { resolveHealth = resolve; }))
      .mockImplementationOnce(() => new Promise((resolve) => { resolveSuccess = resolve; }));

    render(<CaseFlowHealthView />);

    expect(screen.getByRole("status")).toHaveTextContent("Carregando diagnóstico");
    resolveHealth(healthResponse);
    expect(screen.getByRole("status")).toHaveTextContent("Consultando métricas redigidas do CaseFlow.");
    resolveSuccess(successResponse);

    expect(await screen.findByRole("heading", { name: "Saúde operacional" })).toBeInTheDocument();
  });

  it("renders healthy and degraded connector details and the success metrics", async () => {
    const user = userEvent.setup();
    render(<CaseFlowHealthView />);

    const healthTable = await screen.findByRole("table", { name: "Saúde dos conectores" });
    const healthyRow = within(healthTable).getByText("Rastreio").closest("tr");
    const degradedRow = within(healthTable).getByText("Faturamento").closest("tr");
    expect(healthyRow).toHaveTextContent("HEALTHY");
    expect(healthyRow).toHaveTextContent("96%");
    expect(healthyRow).toHaveTextContent("0.84 s");
    expect(healthyRow).toHaveTextContent("2.5 s");
    expect(healthyRow).toHaveTextContent("Sem registro");
    expect(within(healthyRow!).getByText("HEALTHY")).toHaveClass("active");
    expect(degradedRow).toHaveTextContent("DEGRADED");
    expect(degradedRow).toHaveTextContent("Sem registro");
    expect(within(degradedRow!).getByText("DEGRADED")).toHaveClass("inactive");

    await user.click(screen.getByRole("tab", { name: "Sucesso" }));

    expect(screen.getByRole("tabpanel")).toHaveAccessibleName("Sucesso");
    expect(screen.getByText("18")).toBeInTheDocument();
    expect(screen.getByText("0.95 s")).toBeInTheDocument();
    expect(screen.getByText("26 min")).toBeInTheDocument();
    expect(screen.getByRole("table", { name: "Eficiência operacional" })).toHaveTextContent("9");
    expect(screen.getByRole("table", { name: "Sucesso por conector" })).toHaveTextContent("80%");
  });

  it("exposes empty health and success tables without fabricating rows", async () => {
    apiMock.mockImplementation((path: string) => Promise.resolve(path.endsWith("/health")
      ? { ...healthResponse, connectors: [] }
      : { ...successResponse, connectors: [], medianReadyMs: null }));
    const user = userEvent.setup();
    render(<CaseFlowHealthView />);

    const healthTable = await screen.findByRole("table", { name: "Saúde dos conectores" });
    expect(within(healthTable).queryAllByRole("row")).toHaveLength(1);

    await user.click(screen.getByRole("tab", { name: "Sucesso" }));
    expect(screen.getByText("-", { selector: "strong" })).toBeInTheDocument();
    expect(within(screen.getByRole("table", { name: "Sucesso por conector" })).queryAllByRole("row")).toHaveLength(1);
  });

  it("announces API errors, including the non-Error fallback", async () => {
    apiMock.mockRejectedValueOnce(new Error("Métricas expiraram."));
    const first = render(<CaseFlowHealthView />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Métricas expiraram.");
    first.unmount();

    apiMock.mockReset();
    apiMock.mockRejectedValue("timeout");
    render(<CaseFlowHealthView />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Falha ao carregar métricas.");
  });

  it("refreshes stale diagnostics and supports roving keyboard tabs", async () => {
    const user = userEvent.setup();
    render(<CaseFlowHealthView />);
    await screen.findByText("Rastreio");

    apiMock.mockImplementation((path: string) => Promise.resolve(path.endsWith("/health")
      ? { ...healthResponse, connectors: [{ ...healthResponse.connectors[1], state: "UNAVAILABLE" }] }
      : { ...successResponse, dailyCases: 25 }));
    await user.click(screen.getByRole("button", { name: "Atualizar métricas" }));
    expect(await screen.findByText("UNAVAILABLE")).toBeInTheDocument();
    expect(screen.queryByText("Rastreio")).not.toBeInTheDocument();
    expect(apiMock).toHaveBeenCalledTimes(4);

    const healthTab = screen.getByRole("tab", { name: "Saúde" });
    healthTab.focus();
    await user.keyboard("x");
    expect(healthTab).toHaveFocus();
    await user.keyboard("{ArrowLeft}");
    expect(screen.getByRole("tab", { name: "Sucesso" })).toHaveFocus();
    expect(screen.getByText("25")).toBeInTheDocument();
  });
});
