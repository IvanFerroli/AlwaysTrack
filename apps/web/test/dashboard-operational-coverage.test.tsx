import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  supportScheduleDate,
  supportScheduleQuery,
  supportScheduleWeekDates,
  type SupportScheduleCalendarResponse,
  type SupportShiftOccurrence,
  type SupportScheduleDayStatus
} from "../src/support-scheduling";
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

const sacUser = { ...adminUser, id: "sac-1", name: "SAC Teste", email: "sac@example.test", role: "SAC" as const };
const localToday = supportScheduleDate();
const localWeek = supportScheduleWeekDates(localToday);

function scheduleOccurrence(overrides: Partial<SupportShiftOccurrence> = {}): SupportShiftOccurrence {
  return {
    id: "occurrence-today",
    organizationId: sacUser.organizationId,
    teamId: "team-1",
    userId: sacUser.id,
    assignmentId: "assignment-1",
    patternVersionId: "pattern-1",
    ruleVersionId: "rule-1",
    localDate: localToday,
    startsAt: `${localToday}T11:00:00.000Z`,
    endsAt: `${localToday}T20:00:00.000Z`,
    kind: "REGULAR",
    status: "PUBLISHED",
    sourceType: "MATERIALIZED",
    sourceId: "assignment-1",
    ruleSnapshotJson: JSON.stringify({ timezone: "America/Sao_Paulo" }),
    publishedAt: `${localToday}T10:00:00.000Z`,
    user: { id: sacUser.id, name: sacUser.name },
    team: { id: "team-1", name: "Atendimento" },
    pauseBookings: [],
    ...overrides
  };
}

function personalSchedule(occurrences: SupportShiftOccurrence[] = [], dayStatuses?: SupportScheduleDayStatus[]): SupportScheduleCalendarResponse {
  return {
    from: localWeek[0],
    to: localWeek[6],
    scope: "SELF",
    teamId: null,
    userId: sacUser.id,
    occurrences,
    extraSlots: [],
    offers: [],
    dayStatuses
  };
}

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

function installSuccess(overrides?: { dashboard?: unknown; knowledge?: unknown; schedule?: DashboardScheduleCalendarResponse | Error }) {
  apiMock.mockImplementation((path: string) => {
    if (path.startsWith("/v1/support/dashboard?")) return Promise.resolve(overrides?.dashboard ?? supportDashboard);
    if (path === "/v1/operations/today") return Promise.resolve(overrides?.knowledge ?? operationalKnowledge);
    if (path.startsWith("/v1/support/schedules?")) {
      return overrides?.schedule instanceof Error
        ? Promise.reject(overrides.schedule)
        : Promise.resolve(overrides?.schedule ?? personalSchedule());
    }
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
    await user.click(screen.getByRole("button", { name: /Pausas reservadas: 3/ }));
    await user.click(screen.getByRole("button", { name: /Faixas críticas: 1/ }));
    await user.click(screen.getByRole("button", { name: /Campanhas ativas: 1/ }));
    await user.click(screen.getByRole("button", { name: /Avisos ativos: 1/ }));
    await user.click(screen.getByRole("button", { name: "Gerenciar pausas" }));
    await user.click(screen.getByRole("button", { name: /12:00 a 12:30: 2 de 2 em pausa/ }));
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

  it("covers honest fallback labels for free slots, unknown metrics and incomplete campaigns", async () => {
    const timeline = Array.from({ length: 10 }, (_, index) => ({
      startsAt: new Date(Date.UTC(2026, 6, 17, 12, index * 15)).toISOString(),
      endsAt: new Date(Date.UTC(2026, 6, 17, 12, (index + 1) * 15)).toISOString(),
      pausedCount: 0,
      availableCount: 3,
      critical: false
    }));
    installSuccess({
      dashboard: {
        ...supportDashboard,
        pauses: {
          ...supportDashboard.pauses,
          summary: { ...supportDashboard.pauses.summary, bookedPauses: 0, criticalIntervals: 0 },
          timeline,
          slots: [{ ...supportDashboard.pauses.slots[0], bookedCount: 0, remainingCapacity: 2, bookings: [] }]
        },
        performance: {
          summary: [{ metric: "CUSTOM", latest: null, average: null, samples: 0, aggregation: "SIMPLE" }],
          entries: []
        },
        campaigns: [
          { ...supportDashboard.campaigns[0], id: "campaign-empty", metric: "CUSTOM", comparison: "LTE", result: { current: null, achieved: false, progressPercent: 0 } },
          { ...supportDashboard.campaigns[0], id: "campaign-progress", name: "SLA em evolução", result: { current: 80, achieved: false, progressPercent: 87 } }
        ]
      },
      knowledge: {
        ...operationalKnowledge,
        queues: {
          ...operationalKnowledge.queues,
          activeAnnouncements: [
            { ...operationalKnowledge.queues.activeAnnouncements[0], id: "high", priority: "HIGH", pinned: false, summary: null, acknowledgement: null },
            { ...operationalKnowledge.queues.activeAnnouncements[0], id: "normal", title: "Aviso informativo", priority: "NORMAL", pinned: false }
          ]
        }
      }
    });
    const user = userEvent.setup();
    render(<DashboardView user={adminUser} onOpen={vi.fn()} />);

    expect(await screen.findByText("Livre")).toBeInTheDocument();
    expect(screen.getByText("CUSTOM")).toBeInTheDocument();
    expect(screen.getAllByText("Sem lançamento").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /CSAT acima de 92: sem medição/ })).toHaveTextContent("≤");
    expect(screen.getByRole("button", { name: /SLA em evolução: em evolução/ })).toBeInTheDocument();
    expect(screen.getByText("Comunicado interno")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Mudança crítica/ }));
    await user.click(screen.getByRole("button", { name: /Aviso informativo/ }));
    await user.click(screen.getByRole("button", { name: /Aviso informativo/ }));
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

  it("keeps pause overlap exclusive to management roles", async () => {
    installSuccess();
    render(<DashboardView user={sacUser} onOpen={vi.fn()} />);

    const tabs = await screen.findByRole("tablist", { name: "Visão do dashboard" });
    expect(within(tabs).queryByRole("tab", { name: "Pausas" })).not.toBeInTheDocument();
    expect(screen.queryByText("Overlap das pausas")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Gerenciar pausas" })).not.toBeInTheDocument();
    expect(screen.getByText("Performance SAC")).toBeInTheDocument();
  });

  it("highlights today's normal shift from the self-scoped published schedule", async () => {
    installSuccess({ schedule: personalSchedule([scheduleOccurrence()], [{ localDate: localToday, status: "WORKING", occurrenceIds: ["occurrence-today"] }]) });
    const onOpen = vi.fn();
    const user = userEvent.setup();
    render(<DashboardView user={sacUser} onOpen={onOpen} />);

    expect(await screen.findByRole("heading", { name: "Hoje você trabalha das 08:00 às 17:00" })).toBeInTheDocument();
    const expectedQuery = supportScheduleQuery({ date: localToday, scope: "SELF" });
    expect(apiMock).toHaveBeenCalledWith(expectedQuery);
    expect(expectedQuery).not.toContain("userId=");
    expect(expectedQuery).not.toContain("teamId=");

    await user.click(screen.getByRole("button", { name: "Abrir minha escala" }));
    expect(onOpen).toHaveBeenCalledWith("supportSchedules", {
      supportSchedules: { date: localToday, tab: "calendario" }
    });
  });

  it("labels a double shift and shows every published interval in chronological order", async () => {
    installSuccess({
      schedule: personalSchedule([
        scheduleOccurrence({ endsAt: `${localToday}T15:00:00.000Z` }),
        scheduleOccurrence({
          id: "occurrence-double",
          assignmentId: null,
          sourceId: "extra-1",
          startsAt: `${localToday}T16:00:00.000Z`,
          kind: "DOUBLE"
        })
      ], [{ localDate: localToday, status: "DOUBLE", occurrenceIds: ["occurrence-today", "occurrence-double"] }])
    });
    render(<DashboardView user={sacUser} onOpen={vi.fn()} />);

    expect(await screen.findByRole("heading", { name: "Hoje é dobra" })).toBeInTheDocument();
    expect(screen.getByText("08:00 a 12:00 e 13:00 a 17:00")).toBeInTheDocument();
  });

  it("does not infer a day off from occurrences published on another day", async () => {
    const publishedWorkday = localWeek.find((date) => date !== localToday) as string;
    installSuccess({
      schedule: personalSchedule([scheduleOccurrence({
        id: "occurrence-published-week",
        localDate: publishedWorkday,
        startsAt: `${publishedWorkday}T11:00:00.000Z`,
        endsAt: `${publishedWorkday}T20:00:00.000Z`
      })])
    });
    render(<DashboardView user={sacUser} onOpen={vi.fn()} />);

    expect(await screen.findByRole("heading", { name: "Escala de hoje ainda não publicada" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Hoje é folga" })).not.toBeInTheDocument();
  });

  it("declares today a day off only from an explicit OFF day status", async () => {
    installSuccess({ schedule: personalSchedule([], [{ localDate: localToday, status: "OFF", occurrenceIds: [] }]) });
    render(<DashboardView user={sacUser} onOpen={vi.fn()} />);

    expect(await screen.findByRole("heading", { name: "Hoje é folga" })).toBeInTheDocument();
    expect(screen.getByText("Sua escala publicada confirma folga para hoje.")).toBeInTheDocument();
  });

  it("does not call an empty unpublished week a day off", async () => {
    installSuccess({ schedule: personalSchedule([], [{ localDate: localToday, status: "UNPUBLISHED", occurrenceIds: [] }]) });
    render(<DashboardView user={sacUser} onOpen={vi.fn()} />);

    expect(await screen.findByRole("heading", { name: "Escala de hoje ainda não publicada" })).toBeInTheDocument();
    expect(screen.getByText("Ainda não há jornada publicada para confirmar trabalho ou folga.")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Hoje é folga" })).not.toBeInTheDocument();
  });

  it("keeps the rest of the dashboard available when the personal schedule fails", async () => {
    installSuccess({ schedule: new Error("Falha temporaria na escala.") });
    render(<DashboardView user={sacUser} onOpen={vi.fn()} />);

    expect(await screen.findByRole("heading", { name: "Escala de hoje indisponível" })).toBeInTheDocument();
    expect(screen.getByText("Falha temporaria na escala.")).toBeInTheDocument();
    expect(screen.getByText("Performance SAC")).toBeInTheDocument();
  });

  it("shows personal schedule loading without blocking the operational dashboard", async () => {
    const schedule = deferred<SupportScheduleCalendarResponse>();
    apiMock.mockImplementation((path: string) => {
      if (path.startsWith("/v1/support/dashboard?")) return Promise.resolve(supportDashboard);
      if (path === "/v1/operations/today") return Promise.resolve(operationalKnowledge);
      if (path.startsWith("/v1/support/schedules?")) return schedule.promise;
      return Promise.reject(new Error(`Unexpected dashboard request: ${path}`));
    });
    render(<DashboardView user={sacUser} onOpen={vi.fn()} />);

    expect(await screen.findByRole("heading", { name: "Carregando sua jornada de hoje" })).toBeInTheDocument();
    expect(screen.getByText("Performance SAC")).toBeInTheDocument();

    await act(async () => schedule.resolve(personalSchedule([], [{ localDate: localToday, status: "OFF", occurrenceIds: [] }])));
    expect(await screen.findByRole("heading", { name: "Hoje é folga" })).toBeInTheDocument();
  });

  it("rejects a schedule payload that is not self-scoped to the current tenant user", async () => {
    installSuccess({
      schedule: {
        ...personalSchedule([scheduleOccurrence()]),
        scope: "TEAM",
        userId: "sac-other"
      }
    });
    render(<DashboardView user={sacUser} onOpen={vi.fn()} />);

    expect(await screen.findByRole("heading", { name: "Escala de hoje indisponível" })).toBeInTheDocument();
    expect(screen.getByText("Não foi possível validar a escala pessoal retornada.")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Hoje você trabalha/ })).not.toBeInTheDocument();
    expect(screen.getByText("Performance SAC")).toBeInTheDocument();
  });

  it("does not request or show a personal journey highlight for admins", async () => {
    installSuccess();
    render(<DashboardView user={adminUser} onOpen={vi.fn()} />);

    expect(await screen.findByText("Overlap das pausas")).toBeInTheDocument();
    expect(screen.queryByText("Jornada de hoje")).not.toBeInTheDocument();
    expect(apiMock.mock.calls.some(([path]) => String(path).startsWith("/v1/support/schedules?"))).toBe(false);
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
