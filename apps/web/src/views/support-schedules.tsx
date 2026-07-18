import {
  ArrowLeftRight,
  CalendarPlus,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  LayoutGrid,
  List,
  RefreshCw,
  Save,
  Send,
  ShieldCheck,
  UserPlus,
  X
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent
} from "react";
import type { CurrentUser } from "@alwaystrack/shared";
import { keyboardTabIndex } from "../accessibility/tabs";
import { api } from "../api";
import { ConfirmButton, OperationalState } from "../components/operational";
import type { NotificationNavigationIntent } from "../notification-navigation";
import {
  SUPPORT_SCHEDULE_POLL_INTERVAL_MS,
  SUPPORT_SCHEDULE_TIMEZONE,
  buildSupportCoverageIntervals,
  formatSupportScheduleDay,
  formatSupportScheduleTime,
  isSupportScheduleManager,
  shiftSupportScheduleDate,
  supportCalendarTimezone,
  supportClaimStatusLabels,
  supportCoveragePosition,
  supportMinutesFromTime,
  supportOfferStatusLabels,
  supportScheduleDate,
  supportScheduleLocalDateTimeIso,
  supportScheduleQuery,
  supportScheduleWeekDates,
  supportShiftKindLabels,
  supportTimeFromMinutes,
  type SupportCreatedPattern,
  type SupportExtraShiftClaim,
  type SupportMaterializationResult,
  type SupportScheduleCalendarResponse,
  type SupportSchedulePlanningResponse,
  type SupportScheduleRosterResponse,
  type SupportShiftOccurrence,
  type SupportShiftOffer
} from "../support-scheduling";
import "../support-scheduling.css";

type SacTab = "week" | "extras" | "exchanges";
type ManagerTab = "coverage" | "pending" | "management";
type ScheduleTab = SacTab | ManagerTab;
type SupportSchedulesIntent = NonNullable<NotificationNavigationIntent["supportSchedules"]>;
type ScheduleEntityIntent = Pick<
  SupportSchedulesIntent,
  "scheduleId" | "occurrenceId" | "slotId" | "claimId" | "offerId" | "swapId" | "at"
>;
interface ResolvedScheduleIds {
  scheduleId?: string;
  scheduleOccurrenceId?: string;
  occurrenceId?: string;
  slotId?: string;
  claimId?: string;
  claimSlotId?: string;
  offerId?: string;
}

const sacTabs = [
  ["week", "Minha semana"],
  ["extras", "Extras"],
  ["exchanges", "Trocas"]
] as const;

const managerTabs = [
  ["coverage", "Cobertura"],
  ["pending", "Pendências"],
  ["management", "Planejamento"]
] as const;

const emptyScheduleEntityIntent: ScheduleEntityIntent = {};

function scheduleDateFromIntent(intent: SupportSchedulesIntent | undefined, fallback: string) {
  if (intent?.date) return intent.date;
  if (!intent?.at) return fallback;
  const instant = new Date(intent.at);
  return Number.isNaN(instant.getTime()) ? fallback : supportScheduleDate(instant);
}

function scheduleTabFromIntent(intent: SupportSchedulesIntent | undefined, canManage: boolean): ScheduleTab {
  const defaultTab: ScheduleTab = canManage ? "coverage" : "week";
  const calendarTab: ScheduleTab = canManage ? "coverage" : "week";
  const extrasTab: ScheduleTab = canManage ? "pending" : "extras";
  const offersTab: ScheduleTab = canManage ? "pending" : "exchanges";
  const requested = intent?.tab?.trim().toLocaleLowerCase("pt-BR");

  if (["extras", "extra", "claims", "claim"].includes(requested ?? "")) return extrasTab;
  if (["offers", "offer", "trocas"].includes(requested ?? "")) return offersTab;
  if (["occurrences", "occurrence", "assignments", "assignment", "calendario"].includes(requested ?? "")) return calendarTab;

  const visibleTabs = canManage ? managerTabs : sacTabs;
  const visibleRequested = visibleTabs.find(([key]) => key === requested)?.[0];
  if (visibleRequested) return visibleRequested;
  if (intent?.claimId || intent?.slotId) return extrasTab;
  if (intent?.offerId || intent?.swapId) return offersTab;
  if (intent?.occurrenceId || intent?.scheduleId) return calendarTab;
  return defaultTab;
}

function scheduleEntityIntent(intent: SupportSchedulesIntent | undefined): ScheduleEntityIntent {
  if (!intent) return emptyScheduleEntityIntent;
  return {
    scheduleId: intent.scheduleId,
    occurrenceId: intent.occurrenceId,
    slotId: intent.slotId,
    claimId: intent.claimId,
    offerId: intent.offerId ?? intent.swapId,
    at: intent.at
  };
}

function scheduleViewHref(intent: SupportSchedulesIntent) {
  const query = new URLSearchParams();
  for (const key of ["date", "teamId", "userId", "scheduleId", "occurrenceId", "slotId", "claimId", "offerId", "at", "tab"] as const) {
    const value = intent[key];
    if (value) query.set(key, value);
  }
  return query.size ? `/escalas?${query.toString()}` : "/escalas";
}

const weekdayOptions = [
  [1, "Seg"],
  [2, "Ter"],
  [3, "Qua"],
  [4, "Qui"],
  [5, "Sex"],
  [6, "Sáb"],
  [0, "Dom"]
] as const;

function caughtMessage(caught: unknown, fallback: string) {
  return caught instanceof Error ? caught.message : fallback;
}

function dateTimeDefault(date: string, time = "00:00") {
  return `${date}T${time}`;
}

function laterDate(left: string, right: string) {
  return left > right ? left : right;
}

function offerStatusClass(status: string) {
  if (status === "APPLIED") return "active";
  if (status === "OPEN" || status === "MANAGER_PENDING") return "pending";
  return status.toLowerCase();
}

function claimStatusClass(status: string) {
  if (status === "APPROVED") return "active";
  if (status === "PENDING") return "pending";
  return "declined";
}

function activeOfferForOccurrence(offers: SupportShiftOffer[], occurrenceId: string) {
  return offers.find((offer) =>
    (offer.occurrenceId === occurrenceId || offer.targetOccurrenceId === occurrenceId)
      && (offer.status === "OPEN" || offer.status === "MANAGER_PENDING")
  );
}

function ScheduleWeek({
  occurrences,
  offers,
  timezone,
  canExchange,
  highlightedOccurrenceId,
  onExchange
}: {
  occurrences: SupportShiftOccurrence[];
  offers: SupportShiftOffer[];
  timezone: string;
  canExchange: boolean;
  highlightedOccurrenceId?: string;
  onExchange: (occurrenceId: string) => void;
}) {
  const dates = supportScheduleWeekDates(occurrences[0]?.localDate ?? supportScheduleDate());
  const displayDates = occurrences.length
    ? supportScheduleWeekDates(occurrences.map((item) => item.localDate).sort()[0])
    : dates;

  return (
    <section className="support-schedule-calendar" aria-labelledby="support-personal-week-title">
      <div className="support-section-heading">
        <div>
          <p className="eyebrow">Agenda publicada</p>
          <h2 id="support-personal-week-title">Turnos da semana</h2>
        </div>
        <span className="support-count">{occurrences.length} turno(s)</span>
      </div>
      <div className="support-week-grid" role="list" aria-label="Calendário semanal de turnos">
        {displayDates.map((localDate) => {
          const dayOccurrences = occurrences.filter((occurrence) => occurrence.localDate === localDate);
          return (
            <section className="support-week-day" key={localDate} role="listitem" aria-labelledby={`support-day-${localDate}`}>
              <header>
                <time id={`support-day-${localDate}`} dateTime={localDate}>{formatSupportScheduleDay(localDate, { compact: true })}</time>
              </header>
              {dayOccurrences.length ? dayOccurrences.map((occurrence) => {
                const activeOffer = activeOfferForOccurrence(offers, occurrence.id);
                const future = new Date(occurrence.startsAt).getTime() > Date.now();
                const highlighted = highlightedOccurrenceId === occurrence.id;
                return (
                  <article
                    id={`support-schedule-occurrence-${occurrence.id}`}
                    className={`support-shift-block ${occurrence.kind.toLowerCase()}${highlighted ? " support-highlight-row" : ""}`}
                    key={occurrence.id}
                    tabIndex={highlighted ? -1 : undefined}
                  >
                    <span className="support-shift-kind">{supportShiftKindLabels[occurrence.kind] ?? occurrence.kind}</span>
                    <strong>
                      <time dateTime={occurrence.startsAt}>{formatSupportScheduleTime(occurrence.startsAt, timezone)}</time>
                      <span aria-hidden="true"> - </span>
                      <time dateTime={occurrence.endsAt}>{formatSupportScheduleTime(occurrence.endsAt, timezone)}</time>
                    </strong>
                    <small>{occurrence.team.name}</small>
                    {occurrence.pauseBookings.map((booking) => (
                      <small className={booking.rescheduleRequiredAt ? "support-pause-warning" : ""} key={booking.id}>
                        Pausa {formatSupportScheduleTime(booking.slot.startsAt, timezone)}
                        {booking.rescheduleRequiredAt ? " · reagendar" : ""}
                      </small>
                    ))}
                    {activeOffer ? <span className="support-status pending">{supportOfferStatusLabels[activeOffer.status]}</span> : null}
                    {canExchange && future && !activeOffer ? (
                      <button className="secondary small" type="button" onClick={() => onExchange(occurrence.id)}>
                        <ArrowLeftRight size={14} /> Negociar
                      </button>
                    ) : null}
                  </article>
                );
              }) : <span className="support-day-empty">Sem turno</span>}
            </section>
          );
        })}
      </div>
    </section>
  );
}

function CoverageView({ calendar, timezone }: { calendar: SupportScheduleCalendarResponse; timezone: string }) {
  const [mode, setMode] = useState<"visual" | "table">("visual");
  const intervals = useMemo(() => buildSupportCoverageIntervals(calendar.occurrences), [calendar.occurrences]);
  const dates = supportScheduleWeekDates(calendar.from);
  const maxCoverage = Math.max(1, ...intervals.map((interval) => interval.activeCount));

  if (!intervals.length) {
    return <OperationalState state="empty" title="Sem cobertura publicada" detail="Materialize a escala para visualizar a cobertura da equipe nesta semana." />;
  }

  return (
    <section className="support-coverage" aria-labelledby="support-coverage-title">
      <div className="support-section-heading">
        <div>
          <p className="eyebrow">Capacidade por faixa</p>
          <h2 id="support-coverage-title">Cobertura semanal</h2>
        </div>
        <div className="support-view-switch" aria-label="Formato da cobertura">
          <button type="button" className={mode === "visual" ? "active" : ""} aria-pressed={mode === "visual"} onClick={() => setMode("visual")}>
            <LayoutGrid size={15} /> Visual
          </button>
          <button type="button" className={mode === "table" ? "active" : ""} aria-pressed={mode === "table"} onClick={() => setMode("table")}>
            <List size={15} /> Tabela
          </button>
        </div>
      </div>
      {mode === "visual" ? (
        <figure className="support-coverage-figure" aria-label="Gráfico da cobertura semanal por horário">
          <div className="support-coverage-axis" aria-hidden="true">
            {["00h", "06h", "12h", "18h", "24h"].map((label) => <span key={label}>{label}</span>)}
          </div>
          {dates.map((date) => (
            <div className="support-coverage-row" key={date}>
              <time dateTime={date}>{formatSupportScheduleDay(date, { compact: true })}</time>
              <div className="support-coverage-track">
                {intervals.filter((interval) => interval.localDate === date).map((interval) => {
                  const position = supportCoveragePosition(interval, timezone);
                  const label = `${formatSupportScheduleTime(interval.startsAt, timezone)} a ${formatSupportScheduleTime(interval.endsAt, timezone)}: ${interval.activeCount} atendente(s), ${interval.agents.join(", ")}.`;
                  return (
                    <span
                      className="support-coverage-bar"
                      key={`${interval.startsAt}-${interval.endsAt}`}
                      aria-label={label}
                      role="img"
                      tabIndex={0}
                      style={{
                        ...position,
                        "--coverage-opacity": String(0.36 + (interval.activeCount / maxCoverage) * 0.64)
                      } as CSSProperties}
                    >
                      <b>{interval.activeCount}</b>
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
          <figcaption>As barras mostram quantas pessoas têm turno publicado em cada faixa; passe o foco para identificar os nomes.</figcaption>
        </figure>
      ) : (
        <div className="table-scroll">
          <table aria-label="Cobertura semanal em formato de tabela">
            <thead><tr><th scope="col">Dia</th><th scope="col">Faixa</th><th scope="col">Cobertura</th><th scope="col">Atendentes</th></tr></thead>
            <tbody>
              {intervals.map((interval) => (
                <tr key={`${interval.localDate}-${interval.startsAt}-${interval.endsAt}`}>
                  <td>{formatSupportScheduleDay(interval.localDate, { compact: true })}</td>
                  <td>{formatSupportScheduleTime(interval.startsAt, timezone)} - {formatSupportScheduleTime(interval.endsAt, timezone)}</td>
                  <td>{interval.activeCount}</td>
                  <td>{interval.agents.join(", ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export function SupportSchedulesView({ user, initialIntent }: { user: CurrentUser; initialIntent?: SupportSchedulesIntent }) {
  const canManage = isSupportScheduleManager(user);
  const today = supportScheduleDate();
  const nextDay = shiftSupportScheduleDate(today, 1);
  const initialDate = scheduleDateFromIntent(initialIntent, today);
  const [tab, setTab] = useState<ScheduleTab>(() => scheduleTabFromIntent(initialIntent, canManage));
  const [date, setDate] = useState(initialDate);
  const [teamId, setTeamId] = useState(initialIntent?.teamId ?? "");
  const [userId, setUserId] = useState(initialIntent?.userId ?? "");
  const [requestedEntityIntent, setRequestedEntityIntent] = useState<ScheduleEntityIntent>(() => scheduleEntityIntent(initialIntent));
  const [calendar, setCalendar] = useState<SupportScheduleCalendarResponse | null>(null);
  const [planning, setPlanning] = useState<SupportSchedulePlanningResponse | null>(null);
  const [roster, setRoster] = useState<SupportScheduleRosterResponse>({ teams: [], agents: [], selectedTeamId: null });
  const [loading, setLoading] = useState(!canManage || Boolean(initialIntent?.teamId));
  const [rosterLoading, setRosterLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rosterError, setRosterError] = useState<string | null>(null);
  const [planningError, setPlanningError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [createdPatterns, setCreatedPatterns] = useState<SupportCreatedPattern[]>([]);
  const [materialization, setMaterialization] = useState<SupportMaterializationResult | null>(null);
  const [decisionReasons, setDecisionReasons] = useState<Record<string, string>>({});
  const [acceptOccurrenceIds, setAcceptOccurrenceIds] = useState<Record<string, string>>({});
  const [offerDraft, setOfferDraft] = useState({ occurrenceId: "", type: "SWAP" as "SWAP" | "OFFER", targetUserId: "", note: "" });
  const [ruleDraft, setRuleDraft] = useState({
    timezone: SUPPORT_SCHEDULE_TIMEZONE,
    effectiveFrom: dateTimeDefault(nextDay),
    maxDailyMinutes: "540",
    maxWeeklyMinutes: "2700",
    minimumRestMinutes: "660",
    minimumNoticeMinutes: "120",
    maxMonthlyExchanges: "8",
    autoApproveEligibleSwaps: true,
    requireManagerExtraApproval: true
  });
  const [patternDraft, setPatternDraft] = useState({
    name: "Turno padrão",
    startsAt: "08:00",
    endsAt: "17:00",
    weekdays: [1, 2, 3, 4, 5],
    effectiveFrom: dateTimeDefault(nextDay)
  });
  const [assignmentDraft, setAssignmentDraft] = useState({ userId: "", patternVersionId: "", validFrom: dateTimeDefault(nextDay), validTo: "" });
  const [materializeDraft, setMaterializeDraft] = useState({ from: supportScheduleWeekDates(initialDate)[0], to: supportScheduleWeekDates(initialDate)[6] });
  const [extraDraft, setExtraDraft] = useState({ date: laterDate(initialDate, nextDay), startsAt: "18:00", endsAt: "22:00", capacity: "1", note: "" });
  const requestSequence = useRef(0);
  const lastIntent = useRef<SupportSchedulesIntent | undefined>(undefined);
  const lastFocusedTarget = useRef("");

  const visibleTabs: ReadonlyArray<readonly [ScheduleTab, string]> = canManage ? managerTabs : sacTabs;
  const timezone = supportCalendarTimezone(calendar);
  const weekDates = supportScheduleWeekDates(date);
  const pendingClaims = calendar?.extraSlots.flatMap((slot) => slot.claims
    .filter((claim) => claim.status === "PENDING")
    .map((claim) => ({ claim, slot }))) ?? [];
  const pendingOffers = calendar?.offers.filter((offer) => offer.status === "MANAGER_PENDING") ?? [];
  const resolvedScheduleIds = useMemo<ResolvedScheduleIds>(() => {
    const calendarMatchesSelection = Boolean(
      calendar
      && date >= calendar.from
      && date <= calendar.to
      && (!canManage || calendar.teamId === teamId)
      && (!canManage || calendar.userId === (userId || null))
    );
    if (!calendar || !calendarMatchesSelection) return {};
    const scheduleOccurrence = requestedEntityIntent.scheduleId
      ? calendar.occurrences.find((occurrence) => occurrence.assignmentId === requestedEntityIntent.scheduleId)
      : undefined;
    const occurrence = requestedEntityIntent.occurrenceId
      ? calendar.occurrences.find((item) => item.id === requestedEntityIntent.occurrenceId)
      : undefined;
    const slot = requestedEntityIntent.slotId
      ? calendar.extraSlots.find((item) => item.id === requestedEntityIntent.slotId)
      : undefined;
    const claimMatch = requestedEntityIntent.claimId
      ? calendar.extraSlots.flatMap((item) => item.claims.map((claim) => ({ claim, slot: item })))
        .find(({ claim }) => claim.id === requestedEntityIntent.claimId)
      : undefined;
    const offer = requestedEntityIntent.offerId
      ? calendar.offers.find((item) => item.id === requestedEntityIntent.offerId)
      : undefined;
    const planningAssignment = requestedEntityIntent.scheduleId
      ? planning?.assignments.find((assignment) => assignment.id === requestedEntityIntent.scheduleId)
      : undefined;

    return {
      scheduleId: scheduleOccurrence || planningAssignment ? requestedEntityIntent.scheduleId : undefined,
      scheduleOccurrenceId: scheduleOccurrence?.id,
      occurrenceId: occurrence?.id,
      slotId: slot?.id,
      claimId: claimMatch?.claim.id,
      claimSlotId: claimMatch?.slot.id,
      offerId: offer?.id
    };
  }, [calendar, canManage, date, planning?.assignments, requestedEntityIntent, teamId, userId]);
  const highlightedOccurrenceId = resolvedScheduleIds.occurrenceId ?? resolvedScheduleIds.scheduleOccurrenceId;
  const highlightedSlotId = resolvedScheduleIds.slotId ?? resolvedScheduleIds.claimSlotId;
  const highlightedClaimId = resolvedScheduleIds.claimId;
  const highlightedOfferId = resolvedScheduleIds.offerId;
  const focusElementId = highlightedClaimId
    ? canManage ? `support-schedule-claim-${highlightedClaimId}` : highlightedSlotId ? `support-schedule-slot-${highlightedSlotId}` : null
    : highlightedOfferId
      ? `support-schedule-offer-${highlightedOfferId}`
      : highlightedOccurrenceId
        ? canManage ? "support-schedules-coverage-panel" : `support-schedule-occurrence-${highlightedOccurrenceId}`
        : resolvedScheduleIds.scheduleId && canManage
          ? "support-schedules-coverage-panel"
          : highlightedSlotId
            ? canManage ? "support-schedules-pending-panel" : `support-schedule-slot-${highlightedSlotId}`
            : null;

  const loadRoster = useCallback(async () => {
    setRosterLoading(true);
    setRosterError(null);
    const query = new URLSearchParams({ date });
    if (teamId) query.set("teamId", teamId);
    try {
      const result = await api<SupportScheduleRosterResponse>(`/v1/support/pauses?${query.toString()}`);
      setRoster(result);
    } catch (caught) {
      setRosterError(caughtMessage(caught, "Não foi possível carregar equipes e atendentes."));
    } finally {
      setRosterLoading(false);
    }
  }, [date, teamId]);

  const loadCalendar = useCallback(async (showLoading = false) => {
    if (canManage && !teamId) {
      setCalendar(null);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    const sequence = ++requestSequence.current;
    if (showLoading) setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const result = await api<SupportScheduleCalendarResponse>(supportScheduleQuery({
        date,
        scope: canManage ? "TEAM" : "SELF",
        teamId: teamId || undefined,
        userId: canManage && userId ? userId : undefined
      }));
      if (sequence !== requestSequence.current) return;
      setCalendar(result);
      setUpdatedAt(new Date());
    } catch (caught) {
      if (sequence === requestSequence.current) setError(caughtMessage(caught, "Não foi possível carregar as escalas."));
    } finally {
      if (sequence === requestSequence.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [canManage, date, teamId, userId]);

  const loadPlanning = useCallback(async () => {
    if (!canManage || !teamId) {
      setPlanning(null);
      setPlanningError(null);
      return;
    }
    setPlanningError(null);
    try {
      setPlanning(await api<SupportSchedulePlanningResponse>(
        `/v1/support/schedules/planning?${new URLSearchParams({ teamId }).toString()}`
      ));
    } catch (caught) {
      setPlanning(null);
      setPlanningError(caughtMessage(caught, "Não foi possível carregar regras e padrões da equipe."));
    }
  }, [canManage, teamId]);

  useEffect(() => {
    void loadRoster();
  }, [loadRoster]);

  useEffect(() => {
    void loadCalendar(true);
    if (canManage && !teamId) return;
    const timer = window.setInterval(() => void loadCalendar(false), SUPPORT_SCHEDULE_POLL_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [canManage, loadCalendar, teamId]);

  useEffect(() => {
    void loadPlanning();
  }, [loadPlanning]);

  useEffect(() => {
    if (!initialIntent) return;
    if (initialIntent === lastIntent.current) return;
    lastIntent.current = initialIntent;
    lastFocusedTarget.current = "";
    setDate(scheduleDateFromIntent(initialIntent, today));
    setTeamId(initialIntent.teamId ?? "");
    setUserId(canManage ? initialIntent.userId ?? "" : "");
    setRequestedEntityIntent(scheduleEntityIntent(initialIntent));
    setTab(scheduleTabFromIntent(initialIntent, canManage));
  }, [canManage, initialIntent, today]);

  useEffect(() => {
    if (window.location.pathname !== "/escalas") return;
    const hasRequestedEntity = Boolean(
      requestedEntityIntent.scheduleId
      || requestedEntityIntent.occurrenceId
      || requestedEntityIntent.slotId
      || requestedEntityIntent.claimId
      || requestedEntityIntent.offerId
    );
    const calendarMatchesSelection = Boolean(
      calendar
      && date >= calendar.from
      && date <= calendar.to
      && (!canManage || calendar.teamId === teamId)
    );
    if (hasRequestedEntity && !calendarMatchesSelection) return;
    window.history.replaceState(null, "", scheduleViewHref({
      date,
      teamId: teamId || undefined,
      userId: canManage && userId ? userId : undefined,
      scheduleId: resolvedScheduleIds.scheduleId,
      occurrenceId: resolvedScheduleIds.occurrenceId,
      slotId: resolvedScheduleIds.slotId,
      claimId: resolvedScheduleIds.claimId,
      offerId: resolvedScheduleIds.offerId,
      at: requestedEntityIntent.at,
      tab
    }));
  }, [calendar, canManage, date, requestedEntityIntent, resolvedScheduleIds, tab, teamId, userId]);

  useEffect(() => {
    if (!focusElementId) return;
    const focusKey = `${JSON.stringify(requestedEntityIntent)}:${tab}:${focusElementId}`;
    if (focusKey === lastFocusedTarget.current) return;
    const frame = window.requestAnimationFrame(() => {
      const target = document.getElementById(focusElementId);
      if (!target) return;
      lastFocusedTarget.current = focusKey;
      target.focus();
      target.scrollIntoView({ block: "center" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [calendar, focusElementId, requestedEntityIntent, tab]);

  async function perform(actionKey: string, action: () => Promise<unknown>, success: string, reload = true) {
    setBusyAction(actionKey);
    setError(null);
    setNotice(null);
    try {
      await action();
      setNotice(success);
      if (reload) await loadCalendar(false);
      return true;
    } catch (caught) {
      setError(caughtMessage(caught, "Não foi possível concluir a operação."));
      return false;
    } finally {
      setBusyAction(null);
    }
  }

  function clearEntityIntent() {
    setRequestedEntityIntent(emptyScheduleEntityIntent);
  }

  function moveWeek(days: number) {
    setDate((current) => shiftSupportScheduleDate(current, days));
    clearEntityIntent();
  }

  function startExchange(occurrenceId: string) {
    clearEntityIntent();
    setOfferDraft((current) => ({ ...current, occurrenceId }));
    setTab("exchanges");
    window.requestAnimationFrame(() => document.getElementById("support-offer-source")?.focus());
  }

  async function claimExtra(slotId: string) {
    await perform(
      `claim-${slotId}`,
      () => api(`/v1/support/schedules/extra-slots/${slotId}/claim`, { method: "POST", body: "{}" }),
      "Candidatura registrada."
    );
  }

  async function createOffer(event: FormEvent) {
    event.preventDefault();
    const completed = await perform(
      "create-offer",
      () => api("/v1/support/schedules/offers", {
        method: "POST",
        body: JSON.stringify({
          occurrenceId: offerDraft.occurrenceId,
          type: offerDraft.type,
          targetUserId: offerDraft.targetUserId || null,
          note: offerDraft.note || null
        })
      }),
      offerDraft.type === "SWAP" ? "Proposta de troca enviada." : "Turno oferecido."
    );
    if (completed) setOfferDraft({ occurrenceId: "", type: "SWAP", targetUserId: "", note: "" });
  }

  async function acceptOffer(offer: SupportShiftOffer) {
    const targetOccurrenceId = acceptOccurrenceIds[offer.id];
    if (offer.type === "SWAP" && !targetOccurrenceId) return;
    await perform(
      `accept-${offer.id}`,
      () => api(`/v1/support/schedules/offers/${offer.id}/accept`, {
        method: "POST",
        body: JSON.stringify(targetOccurrenceId ? { targetOccurrenceId } : {})
      }),
      offer.type === "SWAP" ? "Troca aceita." : "Turno aceito."
    );
  }

  async function cancelOffer(offerId: string) {
    await perform(
      `cancel-${offerId}`,
      () => api(`/v1/support/schedules/offers/${offerId}`, { method: "DELETE", body: "{}" }),
      "Negociação cancelada."
    );
  }

  async function decideClaim(claim: SupportExtraShiftClaim, decision: "APPROVED" | "REJECTED") {
    const reason = decisionReasons[claim.id]?.trim() || "";
    if (decision === "REJECTED" && !reason) return;
    await perform(
      `claim-decision-${claim.id}`,
      () => api(`/v1/support/schedules/extra-claims/${claim.id}/decision`, {
        method: "POST",
        body: JSON.stringify({ decision, reason: reason || null })
      }),
      decision === "APPROVED" ? "Candidatura aprovada." : "Candidatura recusada."
    );
  }

  async function decideOffer(offer: SupportShiftOffer, decision: "APPROVED" | "REJECTED") {
    const reason = decisionReasons[offer.id]?.trim() || "";
    if (decision === "REJECTED" && !reason) return;
    await perform(
      `offer-decision-${offer.id}`,
      () => api(`/v1/support/schedules/offers/${offer.id}/decision`, {
        method: "POST",
        body: JSON.stringify({ decision, reason: reason || null })
      }),
      decision === "APPROVED" ? "Troca aprovada e aplicada." : "Troca recusada."
    );
  }

  async function saveRule(event: FormEvent) {
    event.preventDefault();
    if (!teamId) return;
    const completed = await perform(
      "rule",
      () => api("/v1/support/schedules/rules", {
        method: "POST",
        body: JSON.stringify({
          teamId,
          timezone: ruleDraft.timezone,
          effectiveFrom: supportScheduleLocalDateTimeIso(ruleDraft.effectiveFrom, ruleDraft.timezone),
          maxDailyMinutes: Number(ruleDraft.maxDailyMinutes),
          maxWeeklyMinutes: Number(ruleDraft.maxWeeklyMinutes),
          minimumRestMinutes: Number(ruleDraft.minimumRestMinutes),
          minimumNoticeMinutes: Number(ruleDraft.minimumNoticeMinutes),
          maxMonthlyExchanges: Number(ruleDraft.maxMonthlyExchanges),
          autoApproveEligibleSwaps: ruleDraft.autoApproveEligibleSwaps,
          requireManagerExtraApproval: ruleDraft.requireManagerExtraApproval
        })
      }),
      "Nova versão da regra criada."
    );
    if (completed) await loadPlanning();
  }

  async function savePattern(event: FormEvent) {
    event.preventDefault();
    if (!teamId) return;
    let result: { pattern: SupportCreatedPattern } | null = null;
    const completed = await perform(
      "pattern",
      async () => {
        result = await api<{ pattern: SupportCreatedPattern }>("/v1/support/schedules/patterns", {
          method: "POST",
          body: JSON.stringify({
            teamId,
            name: patternDraft.name,
            startMinute: supportMinutesFromTime(patternDraft.startsAt),
            endMinute: supportMinutesFromTime(patternDraft.endsAt),
            weekdays: patternDraft.weekdays,
            timezone: ruleDraft.timezone,
            effectiveFrom: supportScheduleLocalDateTimeIso(patternDraft.effectiveFrom, ruleDraft.timezone)
          })
        });
      },
      "Padrão de turno criado."
    );
    if (completed && result) {
      const pattern = (result as { pattern: SupportCreatedPattern }).pattern;
      setCreatedPatterns((current) => [...current.filter((item) => item.id !== pattern.id), pattern]);
      setAssignmentDraft((current) => ({ ...current, patternVersionId: pattern.id }));
      await loadPlanning();
    }
  }

  async function saveAssignment(event: FormEvent) {
    event.preventDefault();
    if (!teamId) return;
    const completed = await perform(
      "assignment",
      () => api("/v1/support/schedules/assignments", {
        method: "POST",
        body: JSON.stringify({
          teamId,
          userId: assignmentDraft.userId,
          patternVersionId: assignmentDraft.patternVersionId,
          validFrom: supportScheduleLocalDateTimeIso(assignmentDraft.validFrom, ruleDraft.timezone),
          validTo: assignmentDraft.validTo ? supportScheduleLocalDateTimeIso(assignmentDraft.validTo, ruleDraft.timezone) : null
        })
      }),
      "Padrão atribuído ao atendente."
    );
    if (completed) await loadPlanning();
  }

  async function materialize(dryRun: boolean) {
    if (!teamId) return;
    let result: SupportMaterializationResult | null = null;
    const completed = await perform(
      dryRun ? "materialize-preview" : "materialize",
      async () => {
        result = await api<SupportMaterializationResult>("/v1/support/schedules/occurrences/materialize", {
          method: "POST",
          body: JSON.stringify({ teamId, from: materializeDraft.from, to: materializeDraft.to, dryRun })
        });
      },
      dryRun ? "Prévia calculada." : "Escala publicada.",
      !dryRun
    );
    if (completed && result) setMaterialization(result);
  }

  async function createExtra(event: FormEvent) {
    event.preventDefault();
    if (!teamId) return;
    const completed = await perform(
      "extra",
      () => api("/v1/support/schedules/extra-slots", {
        method: "POST",
        body: JSON.stringify({
          teamId,
          startsAt: supportScheduleLocalDateTimeIso(`${extraDraft.date}T${extraDraft.startsAt}`, ruleDraft.timezone),
          endsAt: supportScheduleLocalDateTimeIso(`${extraDraft.date}T${extraDraft.endsAt}`, ruleDraft.timezone),
          capacity: Number(extraDraft.capacity),
          note: extraDraft.note || null
        })
      }),
      "Slot extra publicado."
    );
    if (completed) setExtraDraft((current) => ({ ...current, note: "" }));
  }

  const patternOptions = useMemo(() => {
    const options = new Map<string, string>();
    for (const pattern of planning?.patterns ?? []) {
      options.set(pattern.id, `${pattern.name} · v${pattern.version}`);
    }
    for (const pattern of createdPatterns.filter((item) => item.teamId === teamId)) {
      options.set(pattern.id, `${pattern.name} · v${pattern.version}`);
    }
    for (const occurrence of calendar?.occurrences ?? []) {
      if (occurrence.patternVersionId && !options.has(occurrence.patternVersionId)) {
        options.set(
          occurrence.patternVersionId,
          `${formatSupportScheduleTime(occurrence.startsAt, timezone)} - ${formatSupportScheduleTime(occurrence.endsAt, timezone)} · padrão publicado`
        );
      }
    }
    return [...options.entries()].map(([id, label]) => ({ id, label }));
  }, [calendar?.occurrences, createdPatterns, planning?.patterns, teamId, timezone]);

  const ownOccurrences = calendar?.occurrences.filter((occurrence) => occurrence.userId === user.id) ?? [];
  const futureOwnOccurrences = ownOccurrences.filter((occurrence) => new Date(occurrence.startsAt).getTime() > Date.now());
  const targetAgents = roster.agents.filter((agent) => agent.id !== user.id);
  const selectedTeam = roster.teams.find((team) => team.id === teamId);
  const uniqueAgents = new Set(calendar?.occurrences.map((occurrence) => occurrence.userId) ?? []).size;
  const extraOccurrences = calendar?.occurrences.filter((occurrence) => occurrence.kind !== "REGULAR").length ?? 0;
  const openExtraCapacity = calendar?.extraSlots.filter((slot) => slot.status === "OPEN").reduce((total, slot) => {
    const approved = slot.claims.filter((claim) => claim.status === "APPROVED").length;
    return total + Math.max(0, slot.capacity - approved);
  }, 0) ?? 0;

  return (
    <section className="support-operations support-schedules-view">
      <header className="support-view-header support-schedule-header">
        <div>
          <p className="eyebrow">Operação SAC</p>
          <h1>Escalas</h1>
        </div>
        <div className="support-schedule-period">
          <button className="secondary support-icon-button" type="button" aria-label="Semana anterior" title="Semana anterior" onClick={() => moveWeek(-7)}>
            <ChevronLeft size={17} />
          </button>
          <label htmlFor="support-schedule-date">Semana de
            <input id="support-schedule-date" type="date" value={date} onChange={(event) => { setDate(event.target.value); clearEntityIntent(); }} />
          </label>
          <button className="secondary support-icon-button" type="button" aria-label="Próxima semana" title="Próxima semana" onClick={() => moveWeek(7)}>
            <ChevronRight size={17} />
          </button>
          <button className="secondary support-icon-button" type="button" aria-label="Atualizar escalas" title="Atualizar escalas" disabled={refreshing || (canManage && !teamId)} onClick={() => void loadCalendar(false)}>
            <RefreshCw size={17} className={refreshing ? "spin" : ""} />
          </button>
          <span className="support-updated-indicator" aria-live="polite">
            {refreshing ? "Atualizando..." : updatedAt ? `Atualizado às ${updatedAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}` : "Aguardando atualização"}
          </span>
        </div>
      </header>

      {canManage ? (
        <div className="support-schedule-scope" aria-label="Escopo da escala">
          <label>Equipe
            <select
              aria-describedby="support-team-selection-help"
              disabled={rosterLoading && !roster.teams.length}
              value={teamId}
              onChange={(event) => {
                setTeamId(event.target.value);
                setUserId("");
                setCalendar(null);
                setMaterialization(null);
                clearEntityIntent();
              }}
            >
              <option value="">Selecione uma equipe</option>
              {roster.teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
            </select>
          </label>
          <label>Atendente
            <select disabled={!teamId || rosterLoading} value={userId} onChange={(event) => { setUserId(event.target.value); clearEntityIntent(); }}>
              <option value="">Toda a equipe</option>
              {roster.agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.name}</option>)}
            </select>
          </label>
          <small id="support-team-selection-help">A cobertura só é carregada depois da escolha explícita da equipe.</small>
        </div>
      ) : null}

      <div className="segmented-control support-tabs" role="tablist" aria-label="Áreas de escalas">
        {visibleTabs.map(([key, label], index) => (
          <button
            id={`support-schedules-${key}-tab`}
            key={key}
            type="button"
            role="tab"
            className={tab === key ? "active" : ""}
            aria-controls={`support-schedules-${key}-panel`}
            aria-selected={tab === key}
            tabIndex={tab === key ? 0 : -1}
            onClick={() => setTab(key)}
            onKeyDown={(event) => {
              const nextIndex = keyboardTabIndex(event.key, index, visibleTabs.length);
              if (nextIndex === null) return;
              event.preventDefault();
              setTab(visibleTabs[nextIndex][0]);
              event.currentTarget.parentElement?.querySelectorAll<HTMLElement>("[role=tab]")[nextIndex]?.focus();
            }}
          >
            {label}
            {key === "pending" && pendingClaims.length + pendingOffers.length > 0 ? <span className="support-tab-count">{pendingClaims.length + pendingOffers.length}</span> : null}
          </button>
        ))}
      </div>

      {notice ? <p className="support-notice" role="status">{notice}</p> : null}
      {error ? <p className="error" role="alert">{error}</p> : null}
      {rosterError ? <p className="error" role="alert">{rosterError}</p> : null}
      {planningError ? <p className="error" role="alert">{planningError}</p> : null}

      {canManage && !teamId ? (
        <OperationalState
          state={rosterLoading ? "loading" : rosterError ? "error" : "empty"}
          title={rosterLoading ? "Carregando equipes" : rosterError ? "Equipes indisponíveis" : "Selecione uma equipe"}
          detail={rosterLoading ? "Consultando o escopo operacional." : rosterError ?? "Nenhuma equipe é selecionada automaticamente."}
        />
      ) : loading && !calendar ? (
        <OperationalState state="loading" title="Carregando a semana" detail="Consultando turnos, extras e negociações publicadas." />
      ) : !calendar && error ? (
        <div className="support-retry-state">
          <OperationalState state="error" title="Escala indisponível" detail={error} />
          <button type="button" onClick={() => void loadCalendar(true)}><RefreshCw size={16} /> Tentar novamente</button>
        </div>
      ) : calendar ? (
        <>
          {tab === "week" && !canManage ? (
            <div id="support-schedules-week-panel" role="tabpanel" aria-labelledby="support-schedules-week-tab" className="support-tab-panel">
              <div className="support-metrics-grid">
                <div className="support-metric-card"><span>Turnos publicados</span><strong>{calendar.occurrences.length}</strong></div>
                <div className="support-metric-card"><span>Turnos-base</span><strong>{calendar.occurrences.filter((item) => item.kind === "REGULAR").length}</strong></div>
                <div className="support-metric-card"><span>Extras</span><strong>{extraOccurrences}</strong></div>
                <div className="support-metric-card"><span>Trocas em aberto</span><strong>{calendar.offers.filter((item) => item.status === "OPEN" || item.status === "MANAGER_PENDING").length}</strong></div>
              </div>
              {calendar.occurrences.length ? (
                <ScheduleWeek
                  occurrences={calendar.occurrences}
                  offers={calendar.offers}
                  timezone={timezone}
                  canExchange
                  highlightedOccurrenceId={highlightedOccurrenceId}
                  onExchange={startExchange}
                />
              ) : (
                <OperationalState state="empty" title="Nenhum turno publicado" detail="Sua gestão ainda não materializou turnos para esta semana." />
              )}
            </div>
          ) : null}

          {tab === "extras" && !canManage ? (
            <div id="support-schedules-extras-panel" role="tabpanel" aria-labelledby="support-schedules-extras-tab" className="support-tab-panel">
              <section className="support-unframed-section" aria-labelledby="support-extra-slots-title">
                <div className="support-section-heading">
                  <div><p className="eyebrow">Reforços publicados</p><h2 id="support-extra-slots-title">Turnos extras</h2></div>
                  <span className="support-count">{calendar.extraSlots.length} slot(s)</span>
                </div>
                {calendar.extraSlots.length ? (
                  <div className="support-slot-grid support-extra-grid">
                    {calendar.extraSlots.map((slot) => {
                      const myClaim = slot.claims.find((claim) => claim.userId === user.id);
                      const available = slot.status === "OPEN" && new Date(slot.startsAt).getTime() > Date.now();
                      return (
                        <article
                          id={`support-schedule-slot-${slot.id}`}
                          className={`support-slot-card support-extra-card${highlightedSlotId === slot.id ? " support-highlight-row" : ""}`}
                          key={slot.id}
                          tabIndex={highlightedSlotId === slot.id ? -1 : undefined}
                        >
                          <header>
                            <div><Clock3 size={15} /><time dateTime={slot.startsAt}>{formatSupportScheduleDay(supportScheduleDate(new Date(slot.startsAt), timezone), { compact: true })}</time></div>
                            <span className={`support-status ${available ? "active" : "closed"}`}>{available ? "Aberto" : "Encerrado"}</span>
                          </header>
                          <h3>{formatSupportScheduleTime(slot.startsAt, timezone)} - {formatSupportScheduleTime(slot.endsAt, timezone)}</h3>
                          <p>{slot.team.name} · {slot.capacity} vaga(s)</p>
                          {slot.note ? <p>{slot.note}</p> : null}
                          {myClaim ? <span className={`support-status ${claimStatusClass(myClaim.status)}`}>{supportClaimStatusLabels[myClaim.status] ?? myClaim.status}</span> : null}
                          <footer>
                            <button type="button" disabled={!available || myClaim?.status === "PENDING" || myClaim?.status === "APPROVED" || busyAction !== null} onClick={() => void claimExtra(slot.id)}>
                              <UserPlus size={16} /> {myClaim?.status === "REJECTED" ? "Candidatar novamente" : "Candidatar-se"}
                            </button>
                          </footer>
                        </article>
                      );
                    })}
                  </div>
                ) : <OperationalState state="empty" title="Nenhum turno extra aberto" detail="Novas oportunidades aparecem aqui assim que forem publicadas." />}
              </section>
            </div>
          ) : null}

          {tab === "exchanges" && !canManage ? (
            <div id="support-schedules-exchanges-panel" role="tabpanel" aria-labelledby="support-schedules-exchanges-tab" className="support-tab-panel support-schedule-exchanges">
              <section className="support-form-section" aria-labelledby="support-create-offer-title">
                <div className="support-section-heading"><div><p className="eyebrow">Nova negociação</p><h2 id="support-create-offer-title">Oferecer turno ou propor troca</h2></div></div>
                <form className="support-form-grid" onSubmit={createOffer}>
                  <label>Meu turno
                    <select id="support-offer-source" required value={offerDraft.occurrenceId} onChange={(event) => setOfferDraft((current) => ({ ...current, occurrenceId: event.target.value }))}>
                      <option value="">Selecione</option>
                      {futureOwnOccurrences.map((occurrence) => <option key={occurrence.id} value={occurrence.id}>{formatSupportScheduleDay(occurrence.localDate, { compact: true })} · {formatSupportScheduleTime(occurrence.startsAt, timezone)} - {formatSupportScheduleTime(occurrence.endsAt, timezone)}</option>)}
                    </select>
                  </label>
                  <fieldset className="support-segmented-field">
                    <legend>Tipo</legend>
                    <div>
                      <label className={offerDraft.type === "SWAP" ? "active" : ""}><input type="radio" checked={offerDraft.type === "SWAP"} onChange={() => setOfferDraft((current) => ({ ...current, type: "SWAP" }))} /> Troca</label>
                      <label className={offerDraft.type === "OFFER" ? "active" : ""}><input type="radio" checked={offerDraft.type === "OFFER"} onChange={() => setOfferDraft((current) => ({ ...current, type: "OFFER" }))} /> Cessão</label>
                    </div>
                  </fieldset>
                  <label>Destinatário
                    <select required value={offerDraft.targetUserId} onChange={(event) => setOfferDraft((current) => ({ ...current, targetUserId: event.target.value }))}>
                      <option value="">Selecione</option>
                      {targetAgents.map((agent) => <option key={agent.id} value={agent.id}>{agent.name}</option>)}
                    </select>
                  </label>
                  <label>Observação
                    <input maxLength={300} value={offerDraft.note} onChange={(event) => setOfferDraft((current) => ({ ...current, note: event.target.value }))} />
                  </label>
                  <div className="support-form-actions support-full-span">
                    <button type="submit" disabled={!offerDraft.occurrenceId || !offerDraft.targetUserId || busyAction !== null}><Send size={16} /> Enviar proposta</button>
                  </div>
                </form>
              </section>
              <section className="support-table-section" aria-labelledby="support-offers-title">
                <div className="support-section-heading"><div><p className="eyebrow">Histórico da semana</p><h2 id="support-offers-title">Negociações</h2></div></div>
                {calendar.offers.length ? (
                  <div className="table-scroll">
                    <table aria-label="Negociações de escala">
                      <thead><tr><th scope="col">Turno</th><th scope="col">Partes</th><th scope="col">Tipo/status</th><th scope="col">Ação</th></tr></thead>
                      <tbody>
                        {calendar.offers.map((offer) => {
                          const incoming = offer.offeredById !== user.id && (!offer.targetUserId || offer.targetUserId === user.id);
                          const active = offer.status === "OPEN" || offer.status === "MANAGER_PENDING";
                          const canCancel = active && (offer.offeredById === user.id || offer.targetUserId === user.id);
                          return (
                            <tr
                              id={`support-schedule-offer-${offer.id}`}
                              className={highlightedOfferId === offer.id ? "support-highlight-row" : ""}
                              key={offer.id}
                              tabIndex={highlightedOfferId === offer.id ? -1 : undefined}
                            >
                              <td><strong>{formatSupportScheduleDay(offer.occurrence.localDate, { compact: true })}</strong><small>{formatSupportScheduleTime(offer.occurrence.startsAt, timezone)} - {formatSupportScheduleTime(offer.occurrence.endsAt, timezone)}</small></td>
                              <td>{offer.offeredBy.name}<small>para {offer.targetUser?.name ?? "equipe"}</small>{offer.note ? <small>{offer.note}</small> : null}</td>
                              <td>{offer.type === "SWAP" ? "Troca" : "Cessão"}<small><span className={`support-status ${offerStatusClass(offer.status)}`}>{supportOfferStatusLabels[offer.status] ?? offer.status}</span></small></td>
                              <td>
                                {incoming && offer.status === "OPEN" ? (
                                  <div className="support-offer-accept">
                                    {offer.type === "SWAP" ? (
                                      <label>Turno para trocar
                                        <select aria-label={`Turno para aceitar proposta de ${offer.offeredBy.name}`} value={acceptOccurrenceIds[offer.id] ?? ""} onChange={(event) => setAcceptOccurrenceIds((current) => ({ ...current, [offer.id]: event.target.value }))}>
                                          <option value="">Selecione</option>
                                          {futureOwnOccurrences.map((occurrence) => <option key={occurrence.id} value={occurrence.id}>{formatSupportScheduleDay(occurrence.localDate, { compact: true })} · {formatSupportScheduleTime(occurrence.startsAt, timezone)}</option>)}
                                        </select>
                                      </label>
                                    ) : null}
                                    <button className="small" type="button" disabled={busyAction !== null || (offer.type === "SWAP" && !acceptOccurrenceIds[offer.id])} onClick={() => void acceptOffer(offer)}><Check size={14} /> Aceitar</button>
                                  </div>
                                ) : null}
                                {canCancel ? <ConfirmButton confirmLabel="Confirmar cancelamento" disabled={busyAction !== null} onConfirm={() => void cancelOffer(offer.id)}>Cancelar</ConfirmButton> : !incoming || offer.status !== "OPEN" ? "-" : null}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : <OperationalState state="empty" title="Nenhuma negociação registrada" />}
              </section>
            </div>
          ) : null}

          {tab === "coverage" && canManage ? (
            <div
              id="support-schedules-coverage-panel"
              role="tabpanel"
              aria-labelledby="support-schedules-coverage-tab"
              className={`support-tab-panel${highlightedOccurrenceId || resolvedScheduleIds.scheduleId ? " support-highlight-row" : ""}`}
              tabIndex={highlightedOccurrenceId || resolvedScheduleIds.scheduleId ? -1 : undefined}
            >
              <div className="support-metrics-grid">
                <div className="support-metric-card"><span>Atendentes escalados</span><strong>{uniqueAgents}</strong></div>
                <div className="support-metric-card"><span>Turnos publicados</span><strong>{calendar.occurrences.length}</strong></div>
                <div className="support-metric-card"><span>Extras publicados</span><strong>{extraOccurrences}</strong></div>
                <div className="support-metric-card"><span>Vagas extras abertas</span><strong>{openExtraCapacity}</strong></div>
              </div>
              <CoverageView calendar={calendar} timezone={timezone} />
            </div>
          ) : null}

          {tab === "pending" && canManage ? (
            <div
              id="support-schedules-pending-panel"
              role="tabpanel"
              aria-labelledby="support-schedules-pending-tab"
              className={`support-tab-panel${resolvedScheduleIds.slotId && !highlightedClaimId ? " support-highlight-row" : ""}`}
              tabIndex={resolvedScheduleIds.slotId && !highlightedClaimId ? -1 : undefined}
            >
              <section className="support-table-section" aria-labelledby="support-pending-claims-title">
                <div className="support-section-heading"><div><p className="eyebrow">Turnos extras</p><h2 id="support-pending-claims-title">Candidaturas pendentes</h2></div><span className="support-count">{pendingClaims.length}</span></div>
                {pendingClaims.length ? (
                  <div className="table-scroll">
                    <table aria-label="Candidaturas a turnos extras">
                      <thead><tr><th scope="col">Atendente</th><th scope="col">Horário</th><th scope="col">Motivo da decisão</th><th scope="col">Ações</th></tr></thead>
                      <tbody>{pendingClaims.map(({ claim, slot }) => (
                        <tr
                          id={`support-schedule-claim-${claim.id}`}
                          className={highlightedClaimId === claim.id ? "support-highlight-row" : ""}
                          key={claim.id}
                          tabIndex={highlightedClaimId === claim.id ? -1 : undefined}
                        >
                          <td><strong>{claim.user?.name ?? claim.userId}</strong>{claim.note ? <small>{claim.note}</small> : null}</td>
                          <td>{formatSupportScheduleDay(supportScheduleDate(new Date(slot.startsAt), timezone), { compact: true })}<small>{formatSupportScheduleTime(slot.startsAt, timezone)} - {formatSupportScheduleTime(slot.endsAt, timezone)}</small></td>
                          <td><label className="sr-only" htmlFor={`support-claim-reason-${claim.id}`}>Motivo da decisão para {claim.user?.name ?? claim.userId}</label><input id={`support-claim-reason-${claim.id}`} maxLength={300} placeholder="Obrigatório ao recusar" value={decisionReasons[claim.id] ?? ""} onChange={(event) => setDecisionReasons((current) => ({ ...current, [claim.id]: event.target.value }))} /></td>
                          <td><div className="inline-actions"><button className="small" type="button" disabled={busyAction !== null} onClick={() => void decideClaim(claim, "APPROVED")}><Check size={14} /> Aprovar</button><button className="secondary small" type="button" disabled={busyAction !== null || !decisionReasons[claim.id]?.trim()} onClick={() => void decideClaim(claim, "REJECTED")}><X size={14} /> Recusar</button></div></td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                ) : <OperationalState state="empty" title="Nenhuma candidatura pendente" />}
              </section>
              <section className="support-table-section" aria-labelledby="support-pending-offers-title">
                <div className="support-section-heading"><div><p className="eyebrow">Trocas aceitas pelas partes</p><h2 id="support-pending-offers-title">Aprovação da gestão</h2></div><span className="support-count">{pendingOffers.length}</span></div>
                {pendingOffers.length ? (
                  <div className="table-scroll">
                    <table aria-label="Trocas aguardando decisão gerencial">
                      <thead><tr><th scope="col">Partes</th><th scope="col">Turno</th><th scope="col">Motivo da decisão</th><th scope="col">Ações</th></tr></thead>
                      <tbody>{pendingOffers.map((offer) => (
                        <tr id={`support-schedule-offer-${offer.id}`} className={highlightedOfferId === offer.id ? "support-highlight-row" : ""} key={offer.id} tabIndex={highlightedOfferId === offer.id ? -1 : undefined}>
                          <td><strong>{offer.offeredBy.name}</strong><small>com {offer.targetUser?.name ?? "destinatário"}</small></td>
                          <td>{formatSupportScheduleDay(offer.occurrence.localDate, { compact: true })}<small>{formatSupportScheduleTime(offer.occurrence.startsAt, timezone)} - {formatSupportScheduleTime(offer.occurrence.endsAt, timezone)}</small></td>
                          <td><label className="sr-only" htmlFor={`support-offer-reason-${offer.id}`}>Motivo da decisão para troca de {offer.offeredBy.name}</label><input id={`support-offer-reason-${offer.id}`} maxLength={300} placeholder="Obrigatório ao recusar" value={decisionReasons[offer.id] ?? ""} onChange={(event) => setDecisionReasons((current) => ({ ...current, [offer.id]: event.target.value }))} /></td>
                          <td><div className="inline-actions"><button className="small" type="button" disabled={busyAction !== null} onClick={() => void decideOffer(offer, "APPROVED")}><ShieldCheck size={14} /> Aprovar</button><button className="secondary small" type="button" disabled={busyAction !== null || !decisionReasons[offer.id]?.trim()} onClick={() => void decideOffer(offer, "REJECTED")}><X size={14} /> Recusar</button></div></td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                ) : <OperationalState state="empty" title="Nenhuma troca aguardando aprovação" />}
              </section>
            </div>
          ) : null}

          {tab === "management" && canManage ? (
            <div id="support-schedules-management-panel" role="tabpanel" aria-labelledby="support-schedules-management-tab" className="support-tab-panel support-schedule-management">
              <section className="support-table-section support-full-span" aria-labelledby="support-current-planning-title">
                <div className="support-section-heading">
                  <div><p className="eyebrow">Configuração persistida</p><h2 id="support-current-planning-title">Planejamento vigente e futuro</h2></div>
                  <span className="support-count">{planning?.patterns.length ?? 0} padrão(ões)</span>
                </div>
                {!planning && !planningError ? (
                  <OperationalState state="loading" title="Carregando planejamento" />
                ) : planning ? (
                  <div className="support-planning-overview">
                    {planning.rules[0] ? (
                      <dl className="support-materialization-summary">
                        <div><dt>Regra</dt><dd>v{planning.rules[0].version}</dd></div>
                        <div><dt>Fuso</dt><dd>{planning.rules[0].timezone}</dd></div>
                        <div><dt>Máximo diário</dt><dd>{planning.rules[0].maxDailyMinutes} min</dd></div>
                        <div><dt>Descanso mínimo</dt><dd>{planning.rules[0].minimumRestMinutes} min</dd></div>
                      </dl>
                    ) : <p className="support-attention">Nenhuma regra ativa. Crie a primeira versão antes dos padrões.</p>}
                    {planning.patterns.length ? (
                      <div className="table-scroll">
                        <table aria-label="Padrões de turno persistidos">
                          <thead><tr><th scope="col">Padrão</th><th scope="col">Horário</th><th scope="col">Dias</th><th scope="col">Vigência</th></tr></thead>
                          <tbody>{planning.patterns.map((pattern) => (
                            <tr key={pattern.id}>
                              <td><strong>{pattern.name}</strong><small>versão {pattern.version}</small></td>
                              <td>{supportTimeFromMinutes(pattern.startMinute)} - {supportTimeFromMinutes(pattern.endMinute)}</td>
                              <td>{pattern.weekdays.map((day) => weekdayOptions.find(([value]) => value === day)?.[1] ?? day).join(", ")}</td>
                              <td>{new Date(pattern.effectiveFrom).toLocaleDateString("pt-BR", { timeZone: pattern.timezone })}</td>
                            </tr>
                          ))}</tbody>
                        </table>
                      </div>
                    ) : <OperationalState state="empty" title="Nenhum padrão cadastrado" />}
                    {planning.assignments.length ? (
                      <details className="support-conflicts">
                        <summary>{planning.assignments.length} atribuição(ões) ativa(s)</summary>
                        <div className="table-scroll">
                          <table aria-label="Atribuições de turno ativas">
                            <thead><tr><th scope="col">Atendente</th><th scope="col">Padrão</th><th scope="col">Válido a partir de</th><th scope="col">Válido até</th></tr></thead>
                            <tbody>{planning.assignments.map((assignment) => (
                              <tr key={assignment.id}>
                                <td>{assignment.user.name}</td>
                                <td>{assignment.patternVersion.name} · v{assignment.patternVersion.version}</td>
                                <td>{new Date(assignment.validFrom).toLocaleDateString("pt-BR", { timeZone: assignment.patternVersion.timezone })}</td>
                                <td>{assignment.validTo ? new Date(assignment.validTo).toLocaleDateString("pt-BR", { timeZone: assignment.patternVersion.timezone }) : "Sem término"}</td>
                              </tr>
                            ))}</tbody>
                          </table>
                        </div>
                      </details>
                    ) : null}
                  </div>
                ) : null}
              </section>

              <section className="support-form-section" aria-labelledby="support-rule-title">
                <div className="support-section-heading"><div><p className="eyebrow">Governança de jornada</p><h2 id="support-rule-title">Nova versão da regra</h2></div><span className="support-count">{selectedTeam?.name}</span></div>
                <form className="support-form-grid support-rule-form" onSubmit={saveRule}>
                  <label className="support-wide-field">Fuso horário<input required value={ruleDraft.timezone} onChange={(event) => setRuleDraft((current) => ({ ...current, timezone: event.target.value }))} /></label>
                  <label className="support-wide-field">Vigência a partir de<input required type="datetime-local" value={ruleDraft.effectiveFrom} onChange={(event) => setRuleDraft((current) => ({ ...current, effectiveFrom: event.target.value }))} /></label>
                  <label>Máximo diário (min)<input required min={60} max={1440} type="number" value={ruleDraft.maxDailyMinutes} onChange={(event) => setRuleDraft((current) => ({ ...current, maxDailyMinutes: event.target.value }))} /></label>
                  <label>Máximo semanal (min)<input required min={60} max={10080} type="number" value={ruleDraft.maxWeeklyMinutes} onChange={(event) => setRuleDraft((current) => ({ ...current, maxWeeklyMinutes: event.target.value }))} /></label>
                  <label>Descanso mínimo (min)<input required min={0} max={1440} type="number" value={ruleDraft.minimumRestMinutes} onChange={(event) => setRuleDraft((current) => ({ ...current, minimumRestMinutes: event.target.value }))} /></label>
                  <label>Antecedência mínima (min)<input required min={0} max={43200} type="number" value={ruleDraft.minimumNoticeMinutes} onChange={(event) => setRuleDraft((current) => ({ ...current, minimumNoticeMinutes: event.target.value }))} /></label>
                  <label>Trocas mensais<input required min={0} max={100} type="number" value={ruleDraft.maxMonthlyExchanges} onChange={(event) => setRuleDraft((current) => ({ ...current, maxMonthlyExchanges: event.target.value }))} /></label>
                  <label className="support-check"><input type="checkbox" checked={ruleDraft.autoApproveEligibleSwaps} onChange={(event) => setRuleDraft((current) => ({ ...current, autoApproveEligibleSwaps: event.target.checked }))} /> Aprovar trocas elegíveis automaticamente</label>
                  <label className="support-check support-wide-field"><input type="checkbox" checked={ruleDraft.requireManagerExtraApproval} onChange={(event) => setRuleDraft((current) => ({ ...current, requireManagerExtraApproval: event.target.checked }))} /> Exigir aprovação para turno extra</label>
                  <div className="support-form-actions support-full-span"><button type="submit" disabled={busyAction !== null}><Save size={16} /> Criar regra</button></div>
                </form>
              </section>

              <section className="support-form-section" aria-labelledby="support-pattern-title">
                <div className="support-section-heading"><div><p className="eyebrow">Turno-base</p><h2 id="support-pattern-title">Criar padrão</h2></div></div>
                <form className="support-form-grid" onSubmit={savePattern}>
                  <label className="support-full-span">Nome<input required maxLength={80} value={patternDraft.name} onChange={(event) => setPatternDraft((current) => ({ ...current, name: event.target.value }))} /></label>
                  <label>Início<input required type="time" value={patternDraft.startsAt} onChange={(event) => setPatternDraft((current) => ({ ...current, startsAt: event.target.value }))} /></label>
                  <label>Fim<input required type="time" value={patternDraft.endsAt} onChange={(event) => setPatternDraft((current) => ({ ...current, endsAt: event.target.value }))} /></label>
                  <fieldset className="support-weekday-field support-full-span">
                    <legend>Dias da semana</legend>
                    <div>{weekdayOptions.map(([value, label]) => <label key={value} className={patternDraft.weekdays.includes(value) ? "active" : ""}><input type="checkbox" checked={patternDraft.weekdays.includes(value)} onChange={(event) => setPatternDraft((current) => ({ ...current, weekdays: event.target.checked ? [...current.weekdays, value] : current.weekdays.filter((day) => day !== value) }))} />{label}</label>)}</div>
                  </fieldset>
                  <label className="support-full-span">Vigência a partir de<input required type="datetime-local" value={patternDraft.effectiveFrom} onChange={(event) => setPatternDraft((current) => ({ ...current, effectiveFrom: event.target.value }))} /></label>
                  <div className="support-form-actions support-full-span"><button type="submit" disabled={!patternDraft.weekdays.length || busyAction !== null}><CalendarPlus size={16} /> Criar padrão</button></div>
                </form>
              </section>

              <section className="support-form-section" aria-labelledby="support-assignment-title">
                <div className="support-section-heading"><div><p className="eyebrow">Vínculo individual</p><h2 id="support-assignment-title">Atribuir padrão</h2></div></div>
                <form className="support-form-grid" onSubmit={saveAssignment}>
                  <label>Atendente<select required value={assignmentDraft.userId} onChange={(event) => setAssignmentDraft((current) => ({ ...current, userId: event.target.value }))}><option value="">Selecione</option>{roster.agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.name}</option>)}</select></label>
                  <label>Padrão<select required value={assignmentDraft.patternVersionId} onChange={(event) => setAssignmentDraft((current) => ({ ...current, patternVersionId: event.target.value }))}><option value="">Selecione</option>{patternOptions.map((pattern) => <option key={pattern.id} value={pattern.id}>{pattern.label}</option>)}</select></label>
                  <label>Válido a partir de<input required type="datetime-local" value={assignmentDraft.validFrom} onChange={(event) => setAssignmentDraft((current) => ({ ...current, validFrom: event.target.value }))} /></label>
                  <label>Válido até<input type="datetime-local" value={assignmentDraft.validTo} onChange={(event) => setAssignmentDraft((current) => ({ ...current, validTo: event.target.value }))} /></label>
                  {!patternOptions.length ? <p className="support-attention support-full-span">Crie um padrão antes de atribuí-lo.</p> : null}
                  <div className="support-form-actions support-full-span"><button type="submit" disabled={!assignmentDraft.userId || !assignmentDraft.patternVersionId || busyAction !== null}><UserPlus size={16} /> Atribuir</button></div>
                </form>
              </section>

              <section className="support-form-section" aria-labelledby="support-materialize-title">
                <div className="support-section-heading"><div><p className="eyebrow">Publicação idempotente</p><h2 id="support-materialize-title">Materializar escala</h2></div></div>
                <div className="support-form-grid">
                  <label>De<input required type="date" value={materializeDraft.from} onChange={(event) => setMaterializeDraft((current) => ({ ...current, from: event.target.value }))} /></label>
                  <label>Até<input required type="date" value={materializeDraft.to} onChange={(event) => setMaterializeDraft((current) => ({ ...current, to: event.target.value }))} /></label>
                  {materialization ? (
                    <dl className="support-materialization-summary support-full-span">
                      <div><dt>Candidatos</dt><dd>{materialization.candidates}</dd></div>
                      <div><dt>Criados</dt><dd>{materialization.createdCount}</dd></div>
                      <div><dt>Reusados</dt><dd>{materialization.reusedCount}</dd></div>
                      <div><dt>Conflitos</dt><dd>{materialization.conflicts.length}</dd></div>
                    </dl>
                  ) : null}
                  {materialization?.conflicts.length ? <details className="support-conflicts support-full-span"><summary>Ver conflitos</summary><ul>{materialization.conflicts.map((conflict, index) => <li key={`${conflict.assignmentId}-${conflict.localDate}-${index}`}>{conflict.localDate} · {conflict.reason}</li>)}</ul></details> : null}
                  <div className="support-form-actions support-full-span"><button className="secondary" type="button" disabled={busyAction !== null} onClick={() => void materialize(true)}><Eye size={16} /> Gerar prévia</button><button type="button" disabled={busyAction !== null} onClick={() => void materialize(false)}><Send size={16} /> Publicar escala</button></div>
                </div>
              </section>

              <section className="support-form-section support-full-span" aria-labelledby="support-create-extra-title">
                <div className="support-section-heading"><div><p className="eyebrow">Capacidade adicional</p><h2 id="support-create-extra-title">Publicar turno extra</h2></div></div>
                <form className="support-form-grid support-extra-form" onSubmit={createExtra}>
                  <label>Data<input required type="date" value={extraDraft.date} onChange={(event) => setExtraDraft((current) => ({ ...current, date: event.target.value }))} /></label>
                  <label>Início<input required type="time" value={extraDraft.startsAt} onChange={(event) => setExtraDraft((current) => ({ ...current, startsAt: event.target.value }))} /></label>
                  <label>Fim<input required type="time" value={extraDraft.endsAt} onChange={(event) => setExtraDraft((current) => ({ ...current, endsAt: event.target.value }))} /></label>
                  <label>Vagas<input required min={1} max={500} type="number" value={extraDraft.capacity} onChange={(event) => setExtraDraft((current) => ({ ...current, capacity: event.target.value }))} /></label>
                  <label className="support-full-span">Observação<textarea maxLength={300} rows={2} value={extraDraft.note} onChange={(event) => setExtraDraft((current) => ({ ...current, note: event.target.value }))} /></label>
                  <div className="support-form-actions support-full-span"><button type="submit" disabled={busyAction !== null}><CalendarPlus size={16} /> Publicar extra</button></div>
                </form>
              </section>
            </div>
          ) : null}
        </>
      ) : null}

      <span className="sr-only" aria-live="polite">Período exibido: {formatSupportScheduleDay(weekDates[0])} a {formatSupportScheduleDay(weekDates[6])}.</span>
    </section>
  );
}
