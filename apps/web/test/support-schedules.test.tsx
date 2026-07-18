import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { CurrentUser } from "@alwaystrack/shared";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SupportSchedulesView } from "../src/views/support-schedules";
import { SUPPORT_SCHEDULE_POLL_INTERVAL_MS, type SupportScheduleCalendarResponse } from "../src/support-scheduling";
import { expectNoCriticalAccessibilityViolations } from "./accessibility-assertions";

const apiMock = vi.fn();
vi.mock("../src/api", () => ({ api: (...args: unknown[]) => apiMock(...args) }));

const sac: CurrentUser = {
  id: "sac-1", name: "Ana", email: "ana@example.com", role: "SAC", organizationId: "org-1", unitScopeIds: [], sectorScopeIds: []
};
const manager: CurrentUser = { ...sac, id: "manager-1", name: "Gestora", role: "GESTOR" };
const team = { id: "team-1", name: "Atendimento" };
const ana = { id: "sac-1", name: "Ana", email: "ana@example.com" };
const bruno = { id: "sac-2", name: "Bruno", email: "bruno@example.com" };
const ruleSnapshotJson = JSON.stringify({ timezone: "America/Sao_Paulo" });

const anaOccurrence = {
  id: "occ-ana",
  organizationId: "org-1",
  teamId: team.id,
  userId: ana.id,
  assignmentId: "assignment-ana",
  patternVersionId: "pattern-base",
  ruleVersionId: "rule-1",
  localDate: "2099-07-14",
  startsAt: "2099-07-14T11:00:00.000Z",
  endsAt: "2099-07-14T20:00:00.000Z",
  kind: "REGULAR",
  status: "PUBLISHED",
  sourceType: "MATERIALIZED",
  sourceId: "assignment-ana",
  ruleSnapshotJson,
  publishedAt: "2099-07-01T12:00:00.000Z",
  user: ana,
  team,
  pauseBookings: []
};

const brunoOccurrence = {
  ...anaOccurrence,
  id: "occ-bruno",
  userId: bruno.id,
  user: bruno,
  assignmentId: "assignment-bruno",
  sourceId: "assignment-bruno",
  startsAt: "2099-07-14T14:00:00.000Z",
  endsAt: "2099-07-14T22:00:00.000Z"
};

const incomingOffer = {
  id: "offer-incoming",
  organizationId: "org-1",
  teamId: team.id,
  occurrenceId: brunoOccurrence.id,
  targetOccurrenceId: null,
  offeredById: bruno.id,
  targetUserId: ana.id,
  ruleVersionId: "rule-1",
  type: "SWAP" as const,
  status: "OPEN" as const,
  note: "Compromisso",
  expiresAt: "2099-07-13T12:00:00.000Z",
  peerAcceptedAt: null,
  decisionReason: null,
  createdAt: "2099-07-01T12:00:00.000Z",
  updatedAt: "2099-07-01T12:00:00.000Z",
  offeredBy: bruno,
  targetUser: ana,
  occurrence: brunoOccurrence,
  targetOccurrence: null
};

const outgoingOffer = {
  ...incomingOffer,
  id: "offer-outgoing",
  occurrenceId: anaOccurrence.id,
  offeredById: ana.id,
  targetUserId: bruno.id,
  offeredBy: ana,
  targetUser: bruno,
  occurrence: anaOccurrence
};

const extraSlot = {
  id: "extra-1",
  organizationId: "org-1",
  teamId: team.id,
  ruleVersionId: "rule-1",
  startsAt: "2099-07-15T21:00:00.000Z",
  endsAt: "2099-07-16T01:00:00.000Z",
  capacity: 2,
  status: "OPEN",
  note: "Reforço do fechamento",
  policySnapshotJson: ruleSnapshotJson,
  team,
  claims: []
};

const sacCalendar: SupportScheduleCalendarResponse = {
  from: "2099-07-13",
  to: "2099-07-19",
  scope: "SELF",
  teamId: null,
  userId: sac.id,
  occurrences: [anaOccurrence],
  extraSlots: [extraSlot],
  offers: [incomingOffer, outgoingOffer]
};

const managerPendingOffer = {
  ...incomingOffer,
  id: "offer-manager",
  targetOccurrenceId: anaOccurrence.id,
  status: "MANAGER_PENDING" as const,
  peerAcceptedAt: "2099-07-02T12:00:00.000Z",
  targetOccurrence: anaOccurrence
};

const managerCalendar: SupportScheduleCalendarResponse = {
  ...sacCalendar,
  scope: "TEAM",
  teamId: team.id,
  userId: null,
  occurrences: [anaOccurrence, brunoOccurrence],
  extraSlots: [{
    ...extraSlot,
    claims: [{ id: "claim-1", userId: ana.id, status: "PENDING", occurrenceId: null, decisionReason: null, note: "Posso cobrir", user: ana }]
  }],
  offers: [managerPendingOffer]
};

const roster = { teams: [team], agents: [ana, bruno], selectedTeamId: null };
const planning = {
  teamId: team.id,
  rules: [{
    id: "rule-1",
    teamId: team.id,
    version: 1,
    timezone: "America/Sao_Paulo",
    maxDailyMinutes: 540,
    maxWeeklyMinutes: 2700,
    minimumRestMinutes: 660,
    minimumNoticeMinutes: 120,
    maxMonthlyExchanges: 8,
    autoApproveEligibleSwaps: true,
    requireManagerExtraApproval: true,
    effectiveFrom: "2099-07-01T03:00:00.000Z",
    effectiveTo: null
  }],
  ruleDrafts: [],
  archivedRuleVersions: [],
  patterns: [{
    id: "pattern-persisted",
    teamId: team.id,
    name: "Turno manhã",
    version: 2,
    startMinute: 480,
    endMinute: 885,
    weekdays: [1, 2, 3, 4, 5],
    timezone: "America/Sao_Paulo",
    effectiveFrom: "2099-07-01T03:00:00.000Z",
    effectiveTo: null
  }],
  assignments: []
};

describe("SupportSchedulesView", () => {
  let response: SupportScheduleCalendarResponse;

  beforeEach(() => {
    response = sacCalendar;
    Object.defineProperty(Element.prototype, "scrollIntoView", { configurable: true, value: vi.fn() });
    apiMock.mockReset();
    apiMock.mockImplementation((path: string, options?: RequestInit) => {
      if (path.startsWith("/v1/support/pauses?")) return Promise.resolve(roster);
      if (path.startsWith("/v1/support/schedules?") && !options) return Promise.resolve(response);
      if (path.startsWith("/v1/support/schedules/planning?")) return Promise.resolve(planning);
      if (path === "/v1/support/schedules/rule-drafts") {
        const body = JSON.parse(String(options?.body));
        const draft = {
          ...body,
          id: "rule-draft-new",
          status: "DRAFT",
          revision: 1,
          normalizedPayloadJson: JSON.stringify(body),
          checksum: "a".repeat(64),
          publishedVersionId: null,
          archivedAt: null,
          updatedAt: "2099-07-01T12:00:00.000Z"
        };
        return Promise.resolve({ draft, payload: body, checksum: draft.checksum });
      }
      if (path === "/v1/support/schedules/patterns") {
        return Promise.resolve({ pattern: { id: "pattern-new", teamId: team.id, name: "Turno padrão", version: 1, startMinute: 480, endMinute: 1020 } });
      }
      if (path === "/v1/support/schedules/occurrences/materialize") {
        return Promise.resolve({ candidates: 2, conflicts: [], createdCount: 2, updatedCount: 0, reusedCount: 0, preservedCount: 0, dryRun: JSON.parse(String(options?.body)).dryRun });
      }
      return Promise.resolve({});
    });
  });

  it("shows the personal week and lets SAC claim, accept and cancel without manager controls", async () => {
    const intervalSpy = vi.spyOn(window, "setInterval");
    const user = userEvent.setup();
    const { container } = render(<SupportSchedulesView user={sac} initialIntent={{ date: "2099-07-15" }} />);

    expect(await screen.findByRole("heading", { name: "Turnos da semana" })).toBeInTheDocument();
    expect(screen.getByText("Turno-base")).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Planejamento" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Governança de regras" })).not.toBeInTheDocument();
    expect(intervalSpy).toHaveBeenCalledWith(expect.any(Function), SUPPORT_SCHEDULE_POLL_INTERVAL_MS);
    expectNoCriticalAccessibilityViolations(container);

    await user.click(screen.getByRole("tab", { name: "Extras" }));
    await user.click(screen.getByRole("button", { name: "Candidatar-se" }));
    await waitFor(() => expect(apiMock).toHaveBeenCalledWith("/v1/support/schedules/extra-slots/extra-1/claim", { method: "POST", body: "{}" }));

    await user.click(screen.getByRole("tab", { name: "Trocas" }));
    const negotiations = screen.getByRole("table", { name: "Negociações de escala" });
    const acceptSelect = within(negotiations).getByLabelText("Turno para aceitar proposta de Bruno");
    const incomingRow = acceptSelect.closest("tr")!;
    await user.selectOptions(acceptSelect, anaOccurrence.id);
    await user.click(within(incomingRow).getByRole("button", { name: "Aceitar" }));
    await waitFor(() => expect(apiMock).toHaveBeenCalledWith("/v1/support/schedules/offers/offer-incoming/accept", {
      method: "POST",
      body: JSON.stringify({ targetOccurrenceId: anaOccurrence.id })
    }));

    const outgoingRow = document.getElementById("support-schedule-offer-offer-outgoing")!;
    await user.click(within(outgoingRow).getByRole("button", { name: "Cancelar" }));
    await user.click(within(outgoingRow).getByRole("button", { name: "Confirmar cancelamento" }));
    await waitFor(() => expect(apiMock).toHaveBeenCalledWith("/v1/support/schedules/offers/offer-outgoing", { method: "DELETE", body: "{}" }));
    intervalSpy.mockRestore();
  });

  it("requires an explicit team before loading manager coverage and exposes the table alternative", async () => {
    response = managerCalendar;
    const user = userEvent.setup();
    const { container } = render(<SupportSchedulesView user={manager} initialIntent={{ date: "2099-07-15" }} />);

    expect(await screen.findByText("Nenhuma equipe é selecionada automaticamente.")).toBeInTheDocument();
    expect(apiMock.mock.calls.some(([path]) => String(path).startsWith("/v1/support/schedules?"))).toBe(false);

    await user.selectOptions(screen.getByLabelText("Equipe"), team.id);
    expect(await screen.findByRole("figure", { name: "Gráfico da cobertura semanal por horário" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Tabela" }));
    expect(screen.getByRole("table", { name: "Cobertura semanal em formato de tabela" })).toBeInTheDocument();
    expectNoCriticalAccessibilityViolations(container);
  });

  it("lets managers decide extra claims and peer-accepted swaps", async () => {
    response = managerCalendar;
    const user = userEvent.setup();
    render(<SupportSchedulesView user={manager} initialIntent={{ date: "2099-07-15", teamId: team.id }} />);

    await screen.findByRole("heading", { name: "Cobertura semanal" });
    await user.click(screen.getByRole("tab", { name: /Pendências/ }));

    const claims = screen.getByRole("table", { name: "Candidaturas a turnos extras" });
    await user.type(within(claims).getByLabelText("Motivo da decisão para Ana"), "Capacidade preenchida");
    await user.click(within(claims).getByRole("button", { name: "Recusar" }));
    await waitFor(() => expect(apiMock).toHaveBeenCalledWith("/v1/support/schedules/extra-claims/claim-1/decision", {
      method: "POST",
      body: JSON.stringify({ decision: "REJECTED", reason: "Capacidade preenchida" })
    }));

    const offers = screen.getByRole("table", { name: "Trocas aguardando decisão gerencial" });
    await user.click(within(offers).getByRole("button", { name: "Aprovar" }));
    await waitFor(() => expect(apiMock).toHaveBeenCalledWith("/v1/support/schedules/offers/offer-manager/decision", {
      method: "POST",
      body: JSON.stringify({ decision: "APPROVED", reason: null })
    }));
  });

  it("submits every manager planning command with the selected team", async () => {
    response = managerCalendar;
    const user = userEvent.setup();
    render(<SupportSchedulesView user={manager} initialIntent={{ date: "2099-07-15", teamId: team.id }} />);

    await screen.findByRole("heading", { name: "Cobertura semanal" });
    await user.click(screen.getByRole("tab", { name: "Planejamento" }));

    expect(await screen.findByRole("table", { name: "Padrões de turno persistidos" })).toHaveTextContent("Turno manhã");
    expect(screen.getByRole("option", { name: "Turno manhã · v2" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Salvar rascunho" }));
    await waitFor(() => expect(apiMock).toHaveBeenCalledWith("/v1/support/schedules/rule-drafts", expect.objectContaining({ method: "POST", body: expect.stringContaining(`"teamId":"${team.id}"`) })));
    expect(apiMock.mock.calls.some(([path]) => path === "/v1/support/schedules/rules")).toBe(false);

    await user.click(screen.getByRole("button", { name: "Criar padrão" }));
    await waitFor(() => expect(apiMock).toHaveBeenCalledWith("/v1/support/schedules/patterns", expect.objectContaining({ method: "POST" })));

    const assignment = screen.getByRole("heading", { name: "Atribuir padrão" }).closest("section")!;
    await user.selectOptions(within(assignment).getByLabelText("Atendente"), ana.id);
    await user.selectOptions(within(assignment).getByLabelText("Padrão"), "pattern-new");
    await user.click(within(assignment).getByRole("button", { name: "Atribuir" }));
    await waitFor(() => expect(apiMock).toHaveBeenCalledWith("/v1/support/schedules/assignments", expect.objectContaining({ method: "POST", body: expect.stringContaining('"patternVersionId":"pattern-new"') })));

    await user.click(screen.getByRole("button", { name: "Gerar prévia" }));
    expect(await screen.findByText("Candidatos")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Publicar escala" }));
    await waitFor(() => expect(apiMock.mock.calls.filter(([path]) => path === "/v1/support/schedules/occurrences/materialize")).toHaveLength(2));

    await user.click(screen.getByRole("button", { name: "Publicar extra" }));
    await waitFor(() => expect(apiMock).toHaveBeenCalledWith("/v1/support/schedules/extra-slots", expect.objectContaining({ method: "POST", body: expect.stringContaining(`"teamId":"${team.id}"`) })));
  });

  it("maps a canonical offer tab for managers and restores focus to the loaded row", async () => {
    response = managerCalendar;
    render(<SupportSchedulesView user={manager} initialIntent={{ date: "2099-07-15", teamId: team.id, offerId: managerPendingOffer.id, tab: "offers" }} />);

    const pendingTab = await screen.findByRole("tab", { name: /Pendências/ });
    expect(pendingTab).toHaveAttribute("aria-selected", "true");
    const row = await screen.findByText("com Ana");
    await waitFor(() => expect(row.closest("tr")).toHaveFocus());
  });

  it("maps claim deep links to manager pending and only highlights a claim from the payload", async () => {
    response = managerCalendar;
    render(<SupportSchedulesView user={manager} initialIntent={{ date: "2099-07-15", teamId: team.id, claimId: "claim-1", tab: "claims" }} />);

    expect(await screen.findByRole("tab", { name: /Pendências/ })).toHaveAttribute("aria-selected", "true");
    const claimRow = document.getElementById("support-schedule-claim-claim-1")!;
    await waitFor(() => expect(claimRow).toHaveFocus());
    expect(claimRow).toHaveClass("support-highlight-row");
  });

  it("maps offer and occurrence targets to the visible SAC tabs", async () => {
    const { rerender } = render(<SupportSchedulesView user={sac} initialIntent={{ date: "2099-07-15", offerId: incomingOffer.id, tab: "trocas" }} />);

    expect(await screen.findByRole("tab", { name: "Trocas" })).toHaveAttribute("aria-selected", "true");
    const offerRow = document.getElementById("support-schedule-offer-offer-incoming")!;
    await waitFor(() => expect(offerRow).toHaveFocus());

    rerender(<SupportSchedulesView user={sac} initialIntent={{ at: "2099-07-15T12:00:00.000Z", occurrenceId: anaOccurrence.id, tab: "occurrences" }} />);
    expect(await screen.findByRole("tab", { name: "Minha semana" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByLabelText("Semana de")).toHaveValue("2099-07-15");
    const occurrence = await waitFor(() => {
      const target = document.getElementById("support-schedule-occurrence-occ-ana");
      expect(target).toHaveFocus();
      return target!;
    });
    expect(occurrence).toHaveClass("support-highlight-row");
  });

  it("maps occurrence targets to manager coverage without exposing a hidden SAC tab", async () => {
    response = managerCalendar;
    render(<SupportSchedulesView user={manager} initialIntent={{ date: "2099-07-15", teamId: team.id, occurrenceId: anaOccurrence.id, tab: "occurrences" }} />);

    expect(await screen.findByRole("tab", { name: "Cobertura" })).toHaveAttribute("aria-selected", "true");
    const coverage = document.getElementById("support-schedules-coverage-panel")!;
    await waitFor(() => expect(coverage).toHaveFocus());
    expect(screen.queryByRole("tab", { name: "Minha semana" })).not.toBeInTheDocument();
  });
});
