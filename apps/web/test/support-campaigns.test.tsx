import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { CurrentUser } from "@alwaystrack/shared";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SupportCampaignsView } from "../src/views/support-campaigns";

const apiMock = vi.fn();
vi.mock("../src/api", () => ({ api: (...args: unknown[]) => apiMock(...args) }));

const sac: CurrentUser = { id: "sac-1", name: "Ana", email: "ana@example.com", role: "SAC", organizationId: "org-1", unitScopeIds: [], sectorScopeIds: [] };
const manager: CurrentUser = { ...sac, id: "manager-1", role: "ADMIN" };
const agent = { id: "sac-1", name: "Ana", email: "ana@example.com" };
const team = { id: "team-1", name: "Retenção" };
const campaign = {
  id: "campaign-1", name: "Fila sob controle", description: "Reduzir o estoque aberto", metric: "RECLAME_AQUI_OPEN", targetValue: 8,
  comparison: "LTE", scopeType: "TEAM", userId: null, user: null, teamLabel: "Retenção", teamId: "team-1", team, status: "ACTIVE",
  startsAt: "2026-07-17T03:00:00.000Z", endsAt: "2026-08-01T02:59:59.999Z", createdAt: "2026-07-17T03:00:00.000Z", updatedAt: "2026-07-17T03:00:00.000Z",
  result: { current: 6, average: 7, samples: 4, aggregation: "SIMPLE", achieved: true, progressPercent: 100 }
};
const campaignResponse = { canManage: true, items: [campaign], teams: [team] };
const performanceResponse = { canManage: true, period: { from: "", to: "" }, agents: [agent], teams: [team], summary: [], entries: [], campaigns: [] };

describe("SupportCampaignsView", () => {
  beforeEach(() => {
    vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
    apiMock.mockImplementation((path: string) => {
      if (path === "/v1/support/campaigns") return Promise.resolve(campaignResponse);
      if (path === "/v1/support/performance") return Promise.resolve(performanceResponse);
      return Promise.resolve({});
    });
  });

  it("keeps SAC on a read-only campaign table", async () => {
    render(<SupportCampaignsView user={sac} />);
    const table = await screen.findByRole("table", { name: "Campanhas SAC" });
    expect(table).toHaveTextContent("Fila sob controle");
    expect(table).toHaveTextContent("≤ 8");
    expect(table).toHaveTextContent("Retenção");
    expect(screen.queryByRole("heading", { name: "Criar campanha" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Editar" })).not.toBeInTheDocument();
    expect(apiMock).not.toHaveBeenCalledWith("/v1/support/performance");
  });

  it("lets managers create an LTE team campaign and edit an existing one", async () => {
    const user = userEvent.setup();
    render(<SupportCampaignsView user={manager} />);
    const createSection = (await screen.findByRole("heading", { name: "Criar campanha" })).closest("section")!;
    await user.type(within(createSection).getByLabelText("Nome"), "Backlog saudável");
    await user.selectOptions(within(createSection).getByLabelText("Métrica"), "RECLAME_AQUI_OPEN");
    await user.type(within(createSection).getByLabelText("Meta"), "5");
    await user.click(within(createSection).getByLabelText("≤ No máximo"));
    await user.selectOptions(within(createSection).getByLabelText("Escopo"), "TEAM");
    await user.selectOptions(within(createSection).getByLabelText("Equipe"), "team-1");
    await user.selectOptions(within(createSection).getByLabelText("Status"), "ACTIVE");
    await user.click(within(createSection).getByRole("button", { name: "Criar campanha" }));

    await waitFor(() => expect(apiMock).toHaveBeenCalledWith("/v1/support/campaigns", expect.objectContaining({
      method: "POST",
      body: expect.stringContaining('"comparison":"LTE","scopeType":"TEAM"')
    })));

    await user.click(screen.getByRole("button", { name: "Editar" }));
    const editSection = screen.getByRole("heading", { name: "Editar campanha" }).closest("section")!;
    const name = within(editSection).getByLabelText("Nome");
    await user.clear(name);
    await user.type(name, "Fila zerada");
    await user.click(within(editSection).getByRole("button", { name: "Salvar campanha" }));

    await waitFor(() => expect(apiMock).toHaveBeenCalledWith("/v1/support/campaigns/campaign-1", expect.objectContaining({
      method: "PATCH",
      body: expect.stringContaining('"name":"Fila zerada"')
    })));
  });
});
