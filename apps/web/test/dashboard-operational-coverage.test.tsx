import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DashboardView } from "../src/views/dashboard";

const apiMock = vi.fn();
vi.mock("../src/api", () => ({ api: (...args: unknown[]) => apiMock(...args) }));

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

const supportDashboard = {
  date: "2026-07-17",
  pauses: {
    summary: { activeAgents: 3, minimumCoverage: 2, bookedPauses: 3, criticalIntervals: 1 },
    timeline: [
      { startsAt: "2026-07-17T15:00:00.000Z", endsAt: "2026-07-17T15:15:00.000Z", pausedCount: 1, availableCount: 2, critical: false },
      { startsAt: "2026-07-17T15:15:00.000Z", endsAt: "2026-07-17T15:30:00.000Z", pausedCount: 2, availableCount: 1, critical: true }
    ],
    slots: [{
      id: "slot-1",
      label: "Almoço",
      startsAt: "2026-07-17T15:00:00.000Z",
      endsAt: "2026-07-17T15:30:00.000Z",
      capacity: 2,
      bookedCount: 2,
      remainingCapacity: 0,
      bookings: [
        { id: "booking-1", user: { id: "sac-1", name: "Ana SAC", email: "ana@example.test" } },
        { id: "booking-2", user: { id: "sac-2", name: "Bruno SAC", email: "bruno@example.test" } }
      ]
    }]
  },
  performance: {
    summary: [
      { metric: "CSAT", latest: 93, average: 91.8, samples: 120, aggregation: "WEIGHTED" },
      { metric: "PRODUCTIVITY", latest: 84, average: 80, samples: 4, aggregation: "SIMPLE" },
      { metric: "SLA", latest: 92, average: 88.5, samples: 140, aggregation: "WEIGHTED" },
      { metric: "RECLAME_AQUI_OPEN", latest: 1, average: 2, samples: 4, aggregation: "SIMPLE" }
    ],
    entries: []
  },
  campaigns: [{
    id: "campaign-1",
    name: "CSAT acima de 92",
    metric: "CSAT",
    targetValue: 92,
    comparison: "GTE",
    endsAt: "2026-08-07T02:59:59.999Z",
    result: { current: 93, achieved: true, progressPercent: 100 }
  }]
};

const operationalKnowledge = {
  generatedAt: "2026-07-17T15:00:00.000Z",
  metrics: { wikiPendingReviews: 2, faqUnanswered: 1, activeAnnouncements: 1 },
  queues: {
    wikiPendingReviews: [],
    faqUnanswered: [],
    activeAnnouncements: [{
      id: "announcement-1",
      slug: "mudanca-critica",
      title: "Mudança crítica",
      summary: "Leia antes de atender",
      priority: "CRITICAL",
      pinned: true,
      requiresAck: true,
      acknowledgement: {
        audienceCount: 3,
        acknowledgedCount: 1,
        openedCount: 2,
        pendingCount: 2,
        completed: false,
        acknowledgedUsers: [{ id: "sac-1", name: "Ana SAC", email: "ana@example.test", role: "SAC" }],
        openedWithoutAckUsers: [{ id: "sac-2", name: "Bruno SAC", email: "bruno@example.test", role: "SAC" }],
        notOpenedUsers: [{ id: "sac-3", name: "Carla SAC", email: "carla@example.test", role: "SAC" }]
      }
    }]
  }
};

function installSuccess(overrides?: { dashboard?: unknown; knowledge?: unknown }) {
  apiMock.mockImplementation((path: string) => {
    if (path.startsWith("/v1/support/dashboard?")) return Promise.resolve(overrides?.dashboard ?? supportDashboard);
    if (path === "/v1/operations/today") return Promise.resolve(overrides?.knowledge ?? operationalKnowledge);
    return Promise.reject(new Error(`Unexpected dashboard request: ${path}`));
  });
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}

describe("DashboardView SAC operational coverage", () => {
  beforeEach(() => {
    apiMock.mockReset();
  });

  it("announces loading until capacity and knowledge settle", async () => {
    const dashboard = deferred<typeof supportDashboard>();
    const knowledge = deferred<typeof operationalKnowledge>();
    apiMock.mockImplementation((path: string) => path.startsWith("/v1/support/dashboard?") ? dashboard.promise : knowledge.promise);

    render(<DashboardView user={adminUser} onOpen={vi.fn()} />);
    expect(screen.getByRole("status")).toHaveTextContent("Carregando operação SAC");
    expect(apiMock).toHaveBeenCalledWith(expect.stringMatching(/^\/v1\/support\/dashboard\?date=\d{4}-\d{2}-\d{2}$/));
    expect(apiMock).toHaveBeenCalledWith("/v1/operations/today");

    await act(async () => {
      dashboard.resolve(supportDashboard);
      knowledge.resolve(operationalKnowledge);
    });
    expect(await screen.findByText("Overlap das pausas")).toBeInTheDocument();
  });

  it("renders capacity, quality, campaigns and actionable knowledge", async () => {
    installSuccess();
    const onOpen = vi.fn();
    const user = userEvent.setup();
    render(<DashboardView user={adminUser} onOpen={onOpen} />);

    expect(await screen.findByRole("img", { name: "Sobreposição de pausas e capacidade disponível por horário" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /SAC ativos: 3/ })).toHaveTextContent("Cobertura mínima: 2");
    expect(screen.getByText("Ana SAC, Bruno SAC")).toBeInTheDocument();
    expect(screen.getByText("93%")).toBeInTheDocument();
    expect(screen.getByText("CSAT acima de 92")).toBeInTheDocument();
    expect(screen.getByText(/Na meta · atual 93%/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /SAC ativos: 3/ }));
    await user.click(screen.getByRole("button", { name: "Abrir performance" }));
    await user.click(screen.getByRole("button", { name: /CSAT acima de 92/ }));
    await user.click(screen.getByRole("button", { name: /Mudança crítica/ }));
    expect(screen.getByText("Ana SAC")).toBeInTheDocument();
    expect(screen.getByText("Bruno SAC")).toBeInTheDocument();
    expect(screen.getByText("Carla SAC")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Abrir aviso" }));
    await user.click(screen.getByRole("button", { name: /2 revisões da Wiki/ }));
    await user.click(screen.getByRole("button", { name: /1 perguntas sem resposta/ }));

    expect(onOpen).toHaveBeenCalledWith("supportPauses");
    expect(onOpen).toHaveBeenCalledWith("supportPerformance");
    expect(onOpen).toHaveBeenCalledWith("supportCampaigns");
    expect(onOpen).toHaveBeenCalledWith("announcements", { announcements: { slug: "mudanca-critica" } });
    expect(onOpen).toHaveBeenCalledWith("wiki");
    expect(onOpen).toHaveBeenCalledWith("faq");
  });

  it("switches between pause and quality modes without shifting the controls", async () => {
    installSuccess();
    const user = userEvent.setup();
    render(<DashboardView user={adminUser} onOpen={vi.fn()} />);
    const tabs = await screen.findByRole("tablist", { name: "Visão do dashboard" });

    await user.click(within(tabs).getByRole("tab", { name: "Qualidade" }));
    expect(screen.queryByText("Overlap das pausas")).not.toBeInTheDocument();
    expect(screen.getByText("Performance SAC")).toBeInTheDocument();

    await user.click(within(tabs).getByRole("tab", { name: "Pausas" }));
    expect(screen.getByText("Overlap das pausas")).toBeInTheDocument();
    expect(screen.queryByText("Performance SAC")).not.toBeInTheDocument();
  });

  it("reloads the SAC dashboard when the local operation date changes", async () => {
    installSuccess();
    render(<DashboardView user={adminUser} onOpen={vi.fn()} />);
    await screen.findByText("Overlap das pausas");
    fireEvent.change(screen.getByLabelText("Data"), { target: { value: "2026-07-16" } });
    await waitFor(() => expect(apiMock).toHaveBeenCalledWith("/v1/support/dashboard?date=2026-07-16"));
  });

  it("keeps the core dashboard useful when knowledge is temporarily unavailable", async () => {
    apiMock.mockImplementation((path: string) => path.startsWith("/v1/support/dashboard?")
      ? Promise.resolve(supportDashboard)
      : Promise.reject(new Error("knowledge unavailable")));
    render(<DashboardView user={adminUser} onOpen={vi.fn()} />);

    expect(await screen.findByText("Overlap das pausas")).toBeInTheDocument();
    expect(screen.getByText("Sem avisos ativos")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /0 revisões da Wiki/ })).toBeInTheDocument();
  });

  it("renders honest empty states for an operation without slots or campaigns", async () => {
    installSuccess({
      dashboard: {
        ...supportDashboard,
        pauses: { ...supportDashboard.pauses, summary: { ...supportDashboard.pauses.summary, bookedPauses: 0, criticalIntervals: 0 }, timeline: [], slots: [] },
        campaigns: []
      },
      knowledge: { ...operationalKnowledge, metrics: { wikiPendingReviews: 0, faqUnanswered: 0, activeAnnouncements: 0 }, queues: { ...operationalKnowledge.queues, activeAnnouncements: [] } }
    });
    render(<DashboardView user={adminUser} onOpen={vi.fn()} />);

    expect(await screen.findByText("Sem slots neste dia")).toBeInTheDocument();
    expect(screen.getByText("Sem campanha ativa")).toBeInTheDocument();
    expect(screen.getByText("Sem avisos ativos")).toBeInTheDocument();
  });

  it("surfaces the support API error without masking it", async () => {
    apiMock.mockImplementation((path: string) => path.startsWith("/v1/support/dashboard?")
      ? Promise.reject(new Error("Acesso negado para este perfil."))
      : Promise.resolve(operationalKnowledge));
    render(<DashboardView user={adminUser} onOpen={vi.fn()} />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Dashboard SAC indisponível");
    expect(screen.getByRole("alert")).toHaveTextContent("Acesso negado para este perfil.");
  });
});
