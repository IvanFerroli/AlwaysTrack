import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { supportMetricDefinitions, type CurrentUser } from "@alwaystrack/shared";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SupportCampaignsView } from "../src/views/support-campaigns";

const apiMock = vi.fn();
vi.mock("../src/api", () => ({ api: (...args: unknown[]) => apiMock(...args) }));

const sac: CurrentUser = { id: "sac-1", name: "Ana", email: "ana@example.com", role: "SAC", organizationId: "org-1", unitScopeIds: [], sectorScopeIds: [] };
const manager: CurrentUser = { ...sac, id: "manager-1", role: "ADMIN" };
const agent = { id: "sac-1", name: "Ana", email: "ana@example.com" };
const team = { id: "team-1", name: "Retenção" };
const campaign = {
  id: "campaign-1",
  name: "Tempo de resposta TikTok",
  description: "Reduzir o tempo de primeira resposta",
  metric: "FIRST_RESPONSE_TIME",
  definitionVersion: 2,
  unit: "DURATION_SECONDS",
  channel: "TIKTOK",
  granularity: "REPORTED_MONTH",
  observationType: "ACTUAL",
  targetValue: 9300,
  comparison: "LTE",
  scopeType: "TEAM",
  userId: null,
  user: null,
  teamLabel: "Retenção",
  teamId: "team-1",
  team,
  status: "ACTIVE",
  startsAt: "2026-07-17T03:00:00.000Z",
  endsAt: "2026-08-01T02:59:59.999Z",
  createdAt: "2026-07-17T03:00:00.000Z",
  updatedAt: "2026-07-17T03:00:00.000Z",
  lifecycleVersion: 2,
  audienceRule: "FIXED_AT_ACTIVATION",
  audienceSnapshotAt: "2026-07-17T03:00:00.000Z",
  resultSnapshotAt: null,
  publishedAt: "2026-07-17T03:00:00.000Z",
  pausedAt: null,
  closedAt: null,
  audience: { rule: "FIXED_AT_ACTIVATION", members: [agent] },
  result: {
    current: 778,
    average: 778,
    samples: 40,
    aggregation: "WEIGHTED_MEAN",
    achieved: true,
    progressPercent: 100,
    frozenAt: null,
    trend: [{ entryId: "kpi-1", revision: 1, periodStart: "2026-07-17T03:00:00.000Z", periodEnd: "2026-07-18T02:59:59.999Z", value: 778, samples: 40, channel: "TIKTOK", granularity: "REPORTED_MONTH", observationType: "ACTUAL" }],
    provenance: [{ entryId: "kpi-1", revision: 1, source: "Painel SAC", periodStart: "2026-07-17T03:00:00.000Z", periodEnd: "2026-07-18T02:59:59.999Z" }]
  }
} as const;
const draftCampaign = {
  ...campaign,
  id: "campaign-draft",
  name: "Nova meta em revisão",
  status: "DRAFT",
  lifecycleVersion: 1,
  audienceSnapshotAt: null,
  publishedAt: null,
  audience: { rule: "FIXED_AT_ACTIVATION", members: [] }
} as const;
const campaignResponse = { canManage: true, dictionaryVersion: 2, definitions: supportMetricDefinitions, items: [campaign], teams: [team] };
const managerCampaignResponse = { ...campaignResponse, items: [draftCampaign, campaign] };
const performanceResponse = { canManage: true, dictionaryVersion: 2, definitions: supportMetricDefinitions, period: { from: "", to: "" }, agents: [agent], teams: [team], summary: [], entries: [], campaigns: [] };

describe("SupportCampaignsView", () => {
  beforeEach(() => {
    apiMock.mockReset();
    vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", { configurable: true, value: vi.fn() });
    apiMock.mockImplementation((path: string) => {
      if (path === "/v1/support/campaigns") return Promise.resolve(campaignResponse);
      if (path === "/v1/support/performance") return Promise.resolve(performanceResponse);
      return Promise.resolve({});
    });
  });

  it("focuses and highlights the campaign requested by a deep link", async () => {
    render(<SupportCampaignsView user={sac} initialCampaignId={campaign.id} />);

    const row = (await screen.findByText(campaign.name)).closest("tr")!;
    expect(row).toHaveClass("support-campaign-target");
    await waitFor(() => expect(row).toHaveFocus());
  });

  it("keeps SAC on a unit-aware read-only campaign table", async () => {
    render(<SupportCampaignsView user={sac} />);
    const table = await screen.findByRole("table", { name: "Campanhas SAC" });
    expect(table).toHaveTextContent("Tempo de resposta TikTok");
    expect(table).toHaveTextContent("≤ 2h35min");
    expect(table).toHaveTextContent("12min58s");
    expect(table).toHaveTextContent("TikTok · Fechamento mensal · Realizado");
    expect(table).toHaveTextContent("40 atendimentos na média ponderada");
    expect(table).toHaveTextContent("Retenção");
    expect(screen.queryByRole("heading", { name: "Criar campanha" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Editar" })).not.toBeInTheDocument();
    expect(apiMock).not.toHaveBeenCalledWith("/v1/support/performance");
  });

  it("defaults lower-is-better campaigns and converts a human duration target", async () => {
    apiMock.mockImplementation((path: string) => {
      if (path === "/v1/support/campaigns") return Promise.resolve(managerCampaignResponse);
      if (path === "/v1/support/performance") return Promise.resolve(performanceResponse);
      return Promise.resolve({});
    });
    const user = userEvent.setup();
    render(<SupportCampaignsView user={manager} />);
    const createSection = (await screen.findByRole("heading", { name: "Criar campanha" })).closest("section")!;
    await user.type(within(createSection).getByLabelText("Nome"), "Resposta sob controle");
    await user.selectOptions(within(createSection).getByLabelText("Métrica"), "FIRST_RESPONSE_TIME");
    expect(within(createSection).getByLabelText("≤ No máximo")).toBeChecked();
    await user.type(within(createSection).getByLabelText("Meta"), "2h35min");
    await user.type(within(createSection).getByLabelText("Canal"), "tiktok");
    await user.selectOptions(within(createSection).getByLabelText("Período da série"), "REPORTED_MONTH");
    await user.selectOptions(within(createSection).getByLabelText("Escopo"), "TEAM");
    await user.selectOptions(within(createSection).getByLabelText("Equipe"), "team-1");
    await user.click(within(createSection).getByRole("button", { name: "Criar campanha" }));

    await waitFor(() => expect(apiMock).toHaveBeenCalledWith("/v1/support/campaigns", expect.objectContaining({
      method: "POST",
      body: expect.stringContaining('"metric":"FIRST_RESPONSE_TIME","targetValue":9300,"comparison":"LTE","channel":"TIKTOK","granularity":"REPORTED_MONTH","observationType":"ACTUAL","scopeType":"TEAM"')
    })));
    expect(apiMock).toHaveBeenCalledWith("/v1/support/campaigns", expect.objectContaining({ body: expect.stringContaining('"status":"DRAFT"') }));

    const draftRow = screen.getByText("Nova meta em revisão").closest("tr")!;
    await user.click(within(draftRow).getByRole("button", { name: "Editar" }));
    const editSection = screen.getByRole("heading", { name: "Editar campanha" }).closest("section")!;
    const name = within(editSection).getByLabelText("Nome");
    await user.clear(name);
    await user.type(name, "Fila zerada");
    await user.click(within(editSection).getByRole("button", { name: "Salvar campanha" }));

    await waitFor(() => expect(apiMock).toHaveBeenCalledWith("/v1/support/campaigns/campaign-draft", expect.objectContaining({
      method: "PATCH",
      body: expect.stringContaining('"name":"Fila zerada"')
    })));

    await user.click(within(draftRow).getByRole("button", { name: "Publicar" }));
    await waitFor(() => expect(apiMock).toHaveBeenCalledWith("/v1/support/campaigns/campaign-draft", {
      method: "PATCH",
      body: JSON.stringify({ status: "ACTIVE" })
    }));

    const activeRow = screen.getByText("Tempo de resposta TikTok").closest("tr")!;
    await user.click(within(activeRow).getByRole("button", { name: "Pausar" }));
    await waitFor(() => expect(apiMock).toHaveBeenCalledWith("/v1/support/campaigns/campaign-1", {
      method: "PATCH",
      body: JSON.stringify({ status: "PAUSED" })
    }));
  });

  it("filters campaigns without merging channel, granularity or observation type", async () => {
    const user = userEvent.setup();
    render(<SupportCampaignsView user={sac} />);
    const section = (await screen.findByRole("heading", { name: "Campanhas SAC" })).closest("section")!;

    await user.selectOptions(within(section).getByLabelText("Canal"), "TIKTOK");
    await user.selectOptions(within(section).getByLabelText("Período"), "REPORTED_MONTH");
    await user.selectOptions(within(section).getByLabelText("Tipo"), "ACTUAL");
    expect(screen.getByText("Tempo de resposta TikTok")).toBeInTheDocument();
    await user.selectOptions(within(section).getByLabelText("Tipo"), "EXPECTATION");
    expect(screen.queryByText("Tempo de resposta TikTok")).not.toBeInTheDocument();
  });
});
