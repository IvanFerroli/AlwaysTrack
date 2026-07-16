import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DashboardView } from "../src/views/dashboard";

const adminUser = {
  id: "admin-1",
  name: "Admin Teste",
  email: "admin@example.test",
  role: "ADMIN" as const,
  organizationId: "org-1",
  unitScopeIds: [],
  sectorScopeIds: [],
  avatarUrl: null
};
const sellerUser = { ...adminUser, id: "seller-user-1", role: "VENDEDOR" as const };

const documentItem = {
  id: "document-1",
  fileName: "danfe-001.pdf",
  status: "PENDING_REVIEW",
  accessKey: null,
  invoiceNumber: null,
  series: null,
  issuedAt: null,
  issuerName: null,
  buyerName: null,
  totalAmountCents: 12500,
  createdAt: "2026-07-15T12:00:00.000Z",
  sellerProfile: {
    id: "seller-1",
    displayName: "Ana Vendas",
    code: "ANA",
    salesGroup: { id: "group-1", name: "Equipe Norte" }
  },
  items: []
};

const dashboardData = {
  metrics: {
    totalDocuments: 12,
    pendingDocuments: 3,
    approvedDocuments: 7,
    rejectedDocuments: 2,
    activeSellers: 4,
    totalAmountCents: 125000
  },
  chart: {
    bucket: "day" as const,
    from: "2026-07-14",
    to: "2026-07-15",
    series: [
      { key: "2026-07-14", label: "14/07", from: "2026-07-14", to: "2026-07-14", documents: 2, quantity: 5, totalAmountCents: 50000, averageTicketCents: 25000 },
      { key: "2026-07-15", label: "15/07", from: "2026-07-15", to: "2026-07-15", documents: 3, quantity: 8, totalAmountCents: 75000, averageTicketCents: 25000 }
    ]
  },
  queues: {
    pendingDocuments: [documentItem],
    topSellers: [{ sellerId: "seller-1", sellerName: "Ana Vendas", groupName: null, totalAmountCents: 125000, quantity: 13 }],
    groups: [{ groupName: "Equipe Norte", totalAmountCents: 125000, quantity: 13 }]
  }
};

const todayData = {
  generatedAt: "2026-07-15T12:30:00.000Z",
  period: { today: "2026-07-15", from: "2026-07-15", to: "2026-07-15" },
  metrics: {
    pendingDocuments: 3,
    approvedToday: 2,
    rejectedToday: 1,
    duplicates: 1,
    extractionFailuresToday: 0,
    activeCampaigns: 2,
    campaignsEndingSoon: 1,
    wikiPendingReviews: 4,
    faqUnanswered: 5,
    unreadNotifications: 6,
    activeAnnouncements: 3
  },
  queues: {
    pendingDocuments: [documentItem],
    ranking: [{ sellerId: "seller-1" }],
    activeCampaigns: [],
    wikiPendingReviews: [{
      id: "wiki-review-1",
      title: "Atualizar política de troca",
      createdAt: "2026-07-15T09:00:00.000Z",
      page: { id: "wiki-1", slug: "politica-de-troca", title: "Política de troca" },
      author: { id: "sac-1", name: "Analista SAC", role: "SAC" }
    }],
    faqUnanswered: [{
      id: "faq-1",
      title: "Como retomar um atendimento?",
      body: "Cliente voltou depois da pausa.",
      createdAt: "2026-07-15T10:00:00.000Z",
      author: { id: "sac-2", name: "Pessoa SAC", role: "SAC" }
    }],
    unreadNotifications: [],
    activeAnnouncements: [
      { id: "announcement-1", slug: "critical-update", title: "Atualização crítica", summary: "Leia antes de operar", priority: "CRITICAL", pinned: true, requiresAck: true, publishedAt: null, expiresAt: null },
      { id: "announcement-2", slug: "high-update", title: "Atenção comercial", summary: null, priority: "HIGH", pinned: false, requiresAck: false, publishedAt: null, expiresAt: null },
      { id: "announcement-3", slug: "daily-update", title: "Resumo diário", summary: "Operação normal", priority: "NORMAL", pinned: false, requiresAck: false, publishedAt: null, expiresAt: null }
    ],
    alerts: [{ severity: "warning" as const, title: "Revisar campanha", detail: "Campanha termina hoje", target: "campaigns" }]
  }
};

const sellersData = {
  items: [
    { id: "seller-2", displayName: "Bruno Vendas", code: "BRU", salesGroup: { id: "group-2", name: "Equipe Sul" } },
    { id: "seller-1", displayName: "Ana Vendas", code: "ANA", salesGroup: { id: "group-1", name: "Equipe Norte" } },
    { id: "seller-3", displayName: "Carla Vendas", code: "CAR", salesGroup: { id: "group-1", name: "Equipe Norte" } },
    { id: "seller-4", displayName: "Diego Vendas", code: "DIE", salesGroup: null }
  ]
};

function response(data: unknown) {
  return { json: vi.fn().mockResolvedValue({ ok: true, data }) };
}

function installSuccessfulHttp(overrides?: { dashboard?: unknown; today?: unknown; sellers?: unknown }) {
  const fetchMock = vi.fn((input: RequestInfo | URL) => {
    const url = String(input);
    if (url.startsWith("/v1/sales/dashboard?")) return Promise.resolve(response(overrides?.dashboard ?? dashboardData));
    if (url === "/v1/operations/today") return Promise.resolve(response(overrides?.today ?? todayData));
    if (url === "/v1/sales/sellers") return Promise.resolve(response(overrides?.sellers ?? sellersData));
    throw new Error(`Unexpected dashboard request: ${url}`);
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("DashboardView operational coverage", () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("announces loading before rendering the successful HTTP payload", async () => {
    const resolvers: Array<(value: ReturnType<typeof response>) => void> = [];
    const fetchMock = vi.fn(() => new Promise<ReturnType<typeof response>>((resolve) => resolvers.push(resolve)));
    vi.stubGlobal("fetch", fetchMock);
    render(<DashboardView user={adminUser} onOpen={vi.fn()} />);

    expect(screen.getByRole("status")).toHaveTextContent("Carregando dashboard");
    expect(fetchMock).toHaveBeenCalledTimes(3);
    const urls = fetchMock.mock.calls.map(([input]) => String(input));
    resolvers[urls.findIndex((url) => url.startsWith("/v1/sales/dashboard?"))](response(dashboardData));
    resolvers[urls.indexOf("/v1/operations/today")](response(todayData));
    resolvers[urls.indexOf("/v1/sales/sellers")](response(sellersData));

    expect(await screen.findByRole("heading", { name: "Vendas aprovadas" })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(expect.stringMatching(/^\/v1\/sales\/dashboard\?/), expect.objectContaining({
      credentials: "include",
      headers: { "content-type": "application/json" }
    }));
  });

  it("renders operational queues and routes every actionable shortcut", async () => {
    installSuccessfulHttp();
    const user = userEvent.setup();
    const onOpen = vi.fn();
    render(<DashboardView user={adminUser} onOpen={onOpen} />);

    expect(await screen.findByText("danfe-001.pdf")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Grafico de vendas aprovadas por periodo" })).toBeInTheDocument();
    expect(screen.getAllByText("R$ 1.250,00")).toHaveLength(4);
    expect(screen.getByText("Fixado · Atualização crítica")).toBeInTheDocument();
    expect(screen.getByText("Abrir comunicado interno")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Notas pendentes/ }));
    expect(onOpen).toHaveBeenLastCalledWith("notes", { notes: { status: "PENDING_REVIEW" } });
    await user.click(screen.getByRole("button", { name: /Aprovadas hoje/ }));
    expect(onOpen).toHaveBeenLastCalledWith("notes", { notes: { status: "APPROVED" } });
    await user.click(screen.getByRole("button", { name: /Rejeições hoje/ }));
    await user.click(screen.getByRole("button", { name: /Duplicidades/ }));
    await user.click(screen.getByRole("button", { name: /Ranking parcial/ }));
    expect(onOpen).toHaveBeenLastCalledWith("ranking", { ranking: { from: "2026-07-15", to: "2026-07-15" } });
    await user.click(screen.getByRole("button", { name: /Campanhas ativas/ }));
    await user.click(screen.getByRole("button", { name: /Wiki pendente/ }));
    await user.click(screen.getByRole("button", { name: /FAQ sem resposta/ }));
    expect(onOpen).toHaveBeenLastCalledWith("faq", { faq: { status: "OPEN" } });
    await user.click(screen.getByRole("button", { name: /Avisos ativos/ }));
    await user.click(screen.getByRole("button", { name: /Revisar campanha/ }));
    expect(onOpen).toHaveBeenLastCalledWith("campaigns");
    await user.click(screen.getByRole("button", { name: /Fixado · Atualização crítica/ }));
    expect(onOpen).toHaveBeenLastCalledWith("announcements", { announcements: { slug: "critical-update" } });
    await user.click(screen.getByRole("button", { name: "Revisar" }));
    expect(onOpen).toHaveBeenLastCalledWith("notes");

    const priorities = screen.getByRole("heading", { name: "Prioridades comerciais" }).closest("section");
    await user.click(within(priorities!).getByRole("button", { name: /vendedor\(es\) no ranking/ }));
    await user.click(within(priorities!).getByRole("button", { name: /em vendas aprovadas/ }));
    await user.click(within(priorities!).getByRole("button", { name: /procedimentos do SAC/ }));
    expect(onOpen).toHaveBeenCalledWith("ranking");
    expect(onOpen).toHaveBeenCalledWith("statements");
    expect(onOpen).toHaveBeenCalledWith("wiki");
  });

  it("lets an admin switch between general, SAC and sales operational panels", async () => {
    installSuccessfulHttp();
    const user = userEvent.setup();
    const onOpen = vi.fn();
    render(<DashboardView user={adminUser} onOpen={onOpen} />);

    expect(await screen.findByRole("heading", { name: "Hoje" })).toBeInTheDocument();
    const modeSelector = screen.getByRole("tablist", { name: "Visão do dashboard" });
    expect(within(modeSelector).getAllByRole("tab").map((tab) => tab.textContent)).toEqual(["Geral", "SAC", "Vendas"]);
    expect(within(modeSelector).getByRole("tab", { name: "Geral" })).toHaveAttribute("aria-selected", "true");

    await user.click(within(modeSelector).getByRole("tab", { name: "SAC" }));
    expect(screen.getByRole("heading", { name: "Operação SAC" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Exportar dashboard CSV" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Vendas aprovadas" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Notas pendentes/ })).not.toBeInTheDocument();
    expect(screen.getByText("Política de troca")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Como retomar um atendimento/ }));
    expect(onOpen).toHaveBeenLastCalledWith("faq", { faq: { status: "OPEN" } });

    await user.click(within(modeSelector).getByRole("tab", { name: "Vendas" }));
    expect(screen.getByRole("heading", { name: "Operação de vendas" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Exportar dashboard CSV" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Vendas aprovadas" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /FAQ sem resposta/ })).not.toBeInTheDocument();
    expect(within(modeSelector).getByRole("tab", { name: "Vendas" })).toHaveAttribute("aria-selected", "true");
  });

  it("keeps the administrative mode selector hidden and sales-focused for sellers", async () => {
    installSuccessfulHttp();
    render(<DashboardView user={sellerUser} onOpen={vi.fn()} />);

    expect(await screen.findByRole("heading", { name: "Operação de vendas" })).toBeInTheDocument();
    expect(screen.queryByRole("tablist", { name: "Visão do dashboard" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Exportar dashboard CSV" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /FAQ sem resposta/ })).not.toBeInTheDocument();
  });

  it("reloads through HTTP when date, group and seller filters change", async () => {
    const fetchMock = installSuccessfulHttp();
    const { container } = render(<DashboardView user={adminUser} onOpen={vi.fn()} />);
    await screen.findByText("danfe-001.pdf");
    let [fromInput, toInput] = Array.from(container.querySelectorAll<HTMLInputElement>('input[type="date"]'));

    const groupSelect = screen.getByRole("combobox", { name: "Grupo" });
    expect(within(groupSelect).getAllByRole("option").map((option) => option.textContent)).toEqual([
      "Todos", "Equipe Norte", "Equipe Sul"
    ]);

    fireEvent.change(fromInput, { target: { value: "2026-07-01" } });
    await screen.findByText("danfe-001.pdf");
    [fromInput, toInput] = Array.from(container.querySelectorAll<HTMLInputElement>('input[type="date"]'));
    fireEvent.change(toInput, { target: { value: "2026-07-20" } });
    await screen.findByText("danfe-001.pdf");
    fireEvent.change(screen.getByRole("combobox", { name: "Grupo" }), { target: { value: "group-2" } });
    await screen.findByText("danfe-001.pdf");
    fireEvent.change(screen.getByRole("combobox", { name: "Vendedor" }), { target: { value: "seller-2" } });

    await waitFor(() => expect(fetchMock.mock.calls.some(([input]) => {
      const url = String(input);
      return url.startsWith("/v1/sales/dashboard?")
        && url.includes("from=2026-07-01")
        && url.includes("to=2026-07-20")
        && url.includes("salesGroupId=group-2")
        && url.includes("sellerProfileId=seller-2");
    })).toBe(true));
    expect(screen.getByRole("link", { name: "Exportar dashboard CSV" })).toHaveAttribute(
      "href",
      expect.stringContaining("salesGroupId=group-2")
    );

    await screen.findByText("danfe-001.pdf");
    [fromInput] = Array.from(container.querySelectorAll<HTMLInputElement>('input[type="date"]'));
    fireEvent.change(fromInput, { target: { value: "" } });
    await screen.findByText("danfe-001.pdf");
    fireEvent.change(screen.getByRole("combobox", { name: "Grupo" }), { target: { value: "" } });
    await waitFor(() => expect(screen.getByRole("link", { name: "Exportar dashboard CSV" }).getAttribute("href")).not.toContain("salesGroupId"));
  });

  it("shows real empty states when the operation has no activity", async () => {
    installSuccessfulHttp({
      dashboard: {
        ...dashboardData,
        metrics: { ...dashboardData.metrics, pendingDocuments: 0, totalAmountCents: 0 },
        chart: { ...dashboardData.chart, series: [{ ...dashboardData.chart.series[0], totalAmountCents: 0 }] },
        queues: { pendingDocuments: [], topSellers: [], groups: [] }
      },
      today: {
        ...todayData,
        queues: { ...todayData.queues, pendingDocuments: [], activeAnnouncements: [], alerts: [] }
      },
      sellers: { items: [] }
    });
    render(<DashboardView user={adminUser} onOpen={vi.fn()} />);

    expect(await screen.findByText("Sem vendas aprovadas no período")).toBeInTheDocument();
    expect(screen.getByText("Nenhum alerta crítico")).toBeInTheDocument();
    expect(screen.getByText("Sem notas na fila")).toBeInTheDocument();
    expect(screen.getByText("Sem avisos ativos")).toBeInTheDocument();
    expect(screen.getByText("Nenhuma nota pendente")).toBeInTheDocument();
    expect(screen.getByText("Ranking sem vendas aprovadas")).toBeInTheDocument();
    expect(screen.getByText("Nenhum grupo com venda aprovada")).toBeInTheDocument();
  });

  it("surfaces role denial and retries successfully when the view is reopened", async () => {
    const deniedFetch = vi.fn((input: RequestInfo | URL) => Promise.resolve({
      json: vi.fn().mockResolvedValue(String(input) === "/v1/sales/sellers"
        ? { ok: true, data: sellersData }
        : { ok: false, error: { code: "FORBIDDEN", message: "Acesso negado para este perfil." } })
    }));
    vi.stubGlobal("fetch", deniedFetch);
    const first = render(<DashboardView user={adminUser} onOpen={vi.fn()} />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Acesso negado para este perfil.");
    first.unmount();

    const retryFetch = installSuccessfulHttp();
    render(<DashboardView user={adminUser} onOpen={vi.fn()} />);
    expect(await screen.findByRole("heading", { name: "Hoje" })).toBeInTheDocument();
    expect(retryFetch).toHaveBeenCalledWith(expect.stringMatching(/^\/v1\/sales\/dashboard\?/), expect.any(Object));
  });

  it("degrades seller filters safely and exposes the top-level empty fallback", async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.startsWith("/v1/sales/dashboard?")) return Promise.resolve(response(null));
      if (url === "/v1/operations/today") return Promise.resolve(response(todayData));
      if (url === "/v1/sales/sellers") return Promise.reject(new Error("seller directory unavailable"));
      throw new Error(`Unexpected dashboard request: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<DashboardView user={adminUser} onOpen={vi.fn()} />);

    expect(await screen.findByRole("status")).toHaveTextContent("Dashboard indisponível");
    expect(fetchMock).toHaveBeenCalledWith("/v1/sales/sellers", expect.any(Object));
  });
});
