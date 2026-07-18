import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { CurrentUser } from "@alwaystrack/shared";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SupportPerformanceView } from "../src/views/support-performance";

const apiMock = vi.fn();
vi.mock("../src/api", () => ({ api: (...args: unknown[]) => apiMock(...args) }));

const sac: CurrentUser = { id: "sac-1", name: "Ana", email: "ana@example.com", role: "SAC", organizationId: "org-1", unitScopeIds: [], sectorScopeIds: [] };
const manager: CurrentUser = { ...sac, id: "manager-1", role: "GESTOR" };
const agent = { id: "sac-1", name: "Ana", email: "ana@example.com" };
const performanceResponse = {
  canManage: true,
  period: { from: "2026-07-01T03:00:00.000Z", to: "2026-07-18T02:59:59.999Z" },
  agents: [agent],
  teams: [{ id: "team-1", name: "SAC Atendimento" }],
  summary: [
    { metric: "CSAT", latest: 94.5, average: 92.25, samples: 40, aggregation: "WEIGHTED" },
    { metric: "PRODUCTIVITY", latest: 18, average: 17, samples: 2, aggregation: "SIMPLE" },
    { metric: "SLA", latest: 88, average: 87, samples: 40, aggregation: "WEIGHTED" },
    { metric: "RECLAME_AQUI_OPEN", latest: 7, average: 8, samples: 2, aggregation: "SIMPLE" }
  ],
  entries: [{
    id: "entry-1", metric: "CSAT", value: 94.5, numerator: 37.8, denominator: 40, scopeType: "USER", userId: "sac-1", user: agent, teamLabel: null, teamId: null, team: null,
    periodStart: "2026-07-14T03:00:00.000Z", periodEnd: "2026-07-15T02:59:59.999Z", source: "Painel diário", note: "Validado",
    createdAt: "2026-07-15T03:00:00.000Z", updatedAt: "2026-07-15T03:00:00.000Z"
  }],
  campaigns: []
};

describe("SupportPerformanceView", () => {
  beforeEach(() => {
    apiMock.mockImplementation((path: string) => Promise.resolve(path.startsWith("/v1/support/performance?") ? performanceResponse : {}));
  });

  it("shows SAC metrics without manager entry controls", async () => {
    render(<SupportPerformanceView user={sac} />);
    expect((await screen.findAllByText("94,5%"))[0]).toBeInTheDocument();
    expect(screen.getByRole("table", { name: "Histórico de indicadores SAC" })).toHaveTextContent("Painel diário");
    expect(screen.queryByRole("tab", { name: "Lançamentos" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Editar" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Agente")).not.toBeInTheDocument();
  });

  it("lets managers create and edit governed KPI entries", async () => {
    const user = userEvent.setup();
    render(<SupportPerformanceView user={manager} />);
    await screen.findAllByText("94,5%");

    await user.click(screen.getByRole("tab", { name: "Lançamentos" }));
    const createSection = screen.getByRole("heading", { name: "Lançar indicador" }).closest("section")!;
    await user.selectOptions(within(createSection).getByLabelText("Métrica"), "SLA");
    await user.type(within(createSection).getByLabelText("Valor"), "91.5");
    await user.type(within(createSection).getByLabelText("Tamanho da amostra"), "80");
    await user.selectOptions(within(createSection).getByLabelText("Escopo"), "USER");
    await user.selectOptions(within(createSection).getByLabelText("Agente"), "sac-1");
    await user.type(within(createSection).getByLabelText("Fonte"), "Relatório semanal");
    await user.click(within(createSection).getByRole("button", { name: "Lançar indicador" }));

    await waitFor(() => expect(apiMock).toHaveBeenCalledWith("/v1/support/performance/entries", expect.objectContaining({
      method: "POST",
      body: expect.stringContaining('"metric":"SLA"')
    })));

    await user.click(screen.getByRole("tab", { name: "Indicadores" }));
    await user.click(screen.getByRole("button", { name: "Editar" }));
    const editSection = screen.getByRole("heading", { name: "Editar indicador" }).closest("section")!;
    const value = within(editSection).getByLabelText("Valor");
    await user.clear(value);
    await user.type(value, "95");
    await user.click(within(editSection).getByRole("button", { name: "Salvar alteração" }));

    await waitFor(() => expect(apiMock).toHaveBeenCalledWith("/v1/support/performance/entries/entry-1", {
      method: "PATCH",
      body: JSON.stringify({ value: 95, sampleSize: 40, source: "Painel diário", note: "Validado" })
    }));
  });
});
