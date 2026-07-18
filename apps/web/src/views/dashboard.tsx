import { CalendarDays } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { CurrentUser } from "@alwaystrack/shared";
import { api } from "../api";
import { OperationalState } from "../components/operational";
import {
  formatSupportDate,
  formatSupportMetricValue,
  formatSupportTime,
  isSupportManager,
  supportAggregationDetail,
  supportMetricDefinition,
  supportSeriesContext,
  supportSeriesKey,
  supportDateInputValue,
  type SupportMetricAggregation,
  type SupportMetricGranularity,
  type SupportMetricUnit,
  type SupportObservationType,
  type SupportScopeType
} from "../support-operations";
import {
  formatSupportScheduleTime,
  supportCalendarTimezone,
  supportScheduleDate,
  supportScheduleQuery,
  type SupportScheduleCalendarResponse,
  type SupportScheduleDayStatusValue
} from "../support-scheduling";
import "../support-dashboard.css";

type DashboardTargetView = "announcements" | "faq" | "wiki" | "supportSchedules" | "supportPauses" | "supportPerformance" | "supportCampaigns";
type DashboardMode = "overview" | "pauses" | "quality";
type DashboardIntent = {
  faq?: { status?: string };
  announcements?: { slug?: string | null };
  supportSchedules?: { date?: string; tab?: string };
};

interface SupportDashboardData {
  date: string;
  pauses: {
    summary: { activeAgents: number; minimumCoverage: number; bookedPauses: number; criticalIntervals: number };
    timeline: Array<{ startsAt: string; endsAt: string; pausedCount: number; availableCount: number; critical: boolean }>;
    slots: Array<{
      id: string;
      label: string | null;
      startsAt: string;
      endsAt: string;
      capacity: number;
      bookedCount: number;
      remainingCapacity: number;
      bookings: Array<{ id: string; user: { id: string; name: string; email: string } }>;
    }>;
  };
  performance: {
    summary: Array<{
      metric: string;
      definitionVersion: number;
      unit: SupportMetricUnit;
      channel: string | null;
      granularity: SupportMetricGranularity;
      observationType: SupportObservationType;
      scopeType: SupportScopeType;
      userId: string | null;
      teamId: string | null;
      teamLabel: string | null;
      latest: number | null;
      average: number | null;
      samples: number;
      aggregation: SupportMetricAggregation;
    }>;
    entries: Array<{
      id: string;
      userId: string | null;
      user: { id: string; name: string } | null;
      teamId: string | null;
      team: { id: string; name: string } | null;
    }>;
  };
  campaigns: Array<{
    id: string;
    name: string;
    metric: string;
    definitionVersion: number;
    unit: SupportMetricUnit;
    channel: string | null;
    granularity: SupportMetricGranularity;
    observationType: SupportObservationType;
    targetValue: number;
    comparison: string;
    endsAt: string;
    result: { current: number | null; achieved: boolean; progressPercent: number };
  }>;
}

interface OperationalKnowledgeData {
  generatedAt: string;
  metrics: { wikiPendingReviews: number; faqUnanswered: number; activeAnnouncements: number };
  queues: {
    wikiPendingReviews: Array<{ id: string; page: { title: string }; author: { name: string }; createdAt: string }>;
    faqUnanswered: Array<{ id: string; title: string; body: string | null }>;
    activeAnnouncements: Array<{
      id: string;
      slug: string;
      title: string;
      summary: string | null;
      priority: string;
      pinned: boolean;
      requiresAck: boolean;
      acknowledgement?: {
        audienceCount: number;
        acknowledgedCount: number;
        openedCount: number;
        pendingCount: number;
        completed: boolean;
        acknowledgedUsers: Array<{ id: string; name: string; email: string; role: string }>;
        openedWithoutAckUsers: Array<{ id: string; name: string; email: string; role: string }>;
        notOpenedUsers: Array<{ id: string; name: string; email: string; role: string }>;
      } | null;
    }>;
  };
}

function formatTime(value: string) {
  return formatSupportTime(value);
}

function formatDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo" }).format(new Date(`${value}T12:00:00-03:00`))
    : formatSupportDate(value);
}

function dashboardSeriesScope(
  item: SupportDashboardData["performance"]["summary"][number],
  entries: SupportDashboardData["performance"]["entries"]
) {
  if (item.scopeType === "USER") {
    return entries.find((entry) => entry.userId === item.userId)?.user?.name ?? "Pessoa";
  }
  if (item.scopeType === "TEAM") {
    return entries.find((entry) => entry.teamId === item.teamId)?.team?.name ?? item.teamLabel ?? "Equipe";
  }
  return "Toda a operação";
}

function OverlapChart({ data }: { data: SupportDashboardData["pauses"] }) {
  const maximum = Math.max(data.summary.activeAgents, 1);
  if (!data.timeline.length) return <OperationalState state="empty" title="Sem slots neste dia" detail="A gestão ainda não publicou a grade de pausas." />;
  return (
    <div className="support-overlap-chart" role="img" aria-label="Sobreposição de pausas e capacidade disponível por horário">
      {data.timeline.map((point, index) => (
        <div className="support-overlap-column" key={point.startsAt}>
          <span
            className={point.critical ? "support-overlap-bar critical" : "support-overlap-bar"}
            style={{ height: `${Math.max((point.pausedCount / maximum) * 100, point.pausedCount ? 12 : 3)}%` }}
            title={`${formatTime(point.startsAt)}: ${point.pausedCount} em pausa, ${point.availableCount} disponíveis`}
          />
          {index % Math.max(Math.ceil(data.timeline.length / 8), 1) === 0 ? <small>{formatTime(point.startsAt)}</small> : <small aria-hidden="true">&nbsp;</small>}
        </div>
      ))}
    </div>
  );
}

function MetricButton({ label, value, detail, onClick }: { label: string; value: string | number; detail: string; onClick: () => void }) {
  return (
    <button className="support-dashboard-metric" type="button" aria-label={`${label}: ${value}. ${detail}`} onClick={onClick}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </button>
  );
}

function isOwnScheduleCalendar(calendar: SupportScheduleCalendarResponse, user: CurrentUser, today: string) {
  return calendar.scope === "SELF"
    && calendar.userId === user.id
    && calendar.from <= today
    && calendar.to >= today
    && calendar.occurrences.every((occurrence) =>
      occurrence.userId === user.id && occurrence.organizationId === user.organizationId
    );
}

function scheduleDayStatus(calendar: SupportScheduleCalendarResponse | null, date: string): SupportScheduleDayStatusValue | null {
  return calendar?.dayStatuses?.find((item) => item.localDate === date)?.status ?? null;
}

function TodayScheduleHighlight({
  calendar,
  error,
  loading,
  today,
  onOpen
}: {
  calendar: SupportScheduleCalendarResponse | null;
  error: string | null;
  loading: boolean;
  today: string;
  onOpen: (view: DashboardTargetView, options?: DashboardIntent) => void;
}) {
  const occurrences = calendar?.occurrences
    .filter((occurrence) => occurrence.localDate === today)
    .sort((left, right) => left.startsAt.localeCompare(right.startsAt)) ?? [];
  const timezone = supportCalendarTimezone(calendar);
  const intervals = occurrences.map((occurrence) =>
    `${formatSupportScheduleTime(occurrence.startsAt, timezone)} a ${formatSupportScheduleTime(occurrence.endsAt, timezone)}`
  );
  const dayStatus = scheduleDayStatus(calendar, today);
  const isDouble = dayStatus === "DOUBLE" || occurrences.length > 1 || occurrences.some((occurrence) => occurrence.kind === "DOUBLE");
  const missingPublishedIntervals = !occurrences.length && (dayStatus === "WORKING" || dayStatus === "DOUBLE");
  const title = loading
    ? "Carregando sua jornada de hoje"
    : error
      ? "Escala de hoje indisponível"
      : occurrences.length
        ? isDouble
          ? "Hoje é dobra"
          : `Hoje você trabalha das ${formatSupportScheduleTime(occurrences[0].startsAt, timezone)} às ${formatSupportScheduleTime(occurrences[0].endsAt, timezone)}`
        : dayStatus === "OFF"
          ? "Hoje é folga"
          : missingPublishedIntervals
            ? "Escala de hoje indisponível"
            : "Escala de hoje ainda não publicada";
  const detail = loading
    ? "Consultando a escala publicada para a data local de hoje."
    : error
      ? error
      : occurrences.length
        ? isDouble
          ? intervals.join(" e ")
          : "Jornada confirmada na sua escala publicada."
        : dayStatus === "OFF"
          ? "Sua escala publicada confirma folga para hoje."
          : missingPublishedIntervals
            ? "O status da jornada foi publicado, mas os intervalos não estão disponíveis."
            : "Ainda não há jornada publicada para confirmar trabalho ou folga.";

  return (
    <section className="panel support-dashboard-section" aria-labelledby="support-today-schedule-title">
      <div className="table-panel-toolbar">
        <div>
          <p className="eyebrow">Jornada de hoje</p>
          <h2 id="support-today-schedule-title">{title}</h2>
        </div>
        <button
          className="secondary"
          type="button"
          onClick={() => onOpen("supportSchedules", { supportSchedules: { date: today, tab: "calendario" } })}
        >
          <CalendarDays aria-hidden="true" size={16} /> Abrir minha escala
        </button>
      </div>
      <p className="muted">{detail}</p>
    </section>
  );
}

export function DashboardView({ user, onOpen }: { user: CurrentUser; onOpen: (view: DashboardTargetView, options?: DashboardIntent) => void }) {
  const canManagePauses = isSupportManager(user);
  const today = useMemo(() => supportScheduleDate(), []);
  const [date, setDate] = useState(supportDateInputValue());
  const [mode, setMode] = useState<DashboardMode>("overview");
  const [dashboard, setDashboard] = useState<SupportDashboardData | null>(null);
  const [knowledge, setKnowledge] = useState<OperationalKnowledgeData | null>(null);
  const [todaySchedule, setTodaySchedule] = useState<SupportScheduleCalendarResponse | null>(null);
  const [todayScheduleLoading, setTodayScheduleLoading] = useState(user.role === "SAC");
  const [todayScheduleError, setTodayScheduleError] = useState<string | null>(null);
  const [expandedAnnouncement, setExpandedAnnouncement] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([
      api<SupportDashboardData>(`/v1/support/dashboard?date=${date}`),
      api<OperationalKnowledgeData>("/v1/operations/today").catch(() => null)
    ]).then(([supportResult, knowledgeResult]) => {
      if (cancelled) return;
      setDashboard(supportResult);
      setKnowledge(knowledgeResult);
    }).catch((caught) => {
      if (!cancelled) setError(caught instanceof Error ? caught.message : "Falha ao carregar o dashboard SAC.");
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [date]);

  useEffect(() => {
    let cancelled = false;
    if (user.role !== "SAC") {
      setTodaySchedule(null);
      setTodayScheduleError(null);
      setTodayScheduleLoading(false);
      return () => { cancelled = true; };
    }
    setTodaySchedule(null);
    setTodayScheduleError(null);
    setTodayScheduleLoading(true);
    api<SupportScheduleCalendarResponse>(supportScheduleQuery({ date: today, scope: "SELF" })).then((result) => {
      if (cancelled) return;
      if (!isOwnScheduleCalendar(result, user, today)) {
        throw new Error("Não foi possível validar a escala pessoal retornada.");
      }
      setTodaySchedule(result);
    }).catch((caught) => {
      if (!cancelled) setTodayScheduleError(caught instanceof Error ? caught.message : "Não foi possível carregar sua escala de hoje.");
    }).finally(() => {
      if (!cancelled) setTodayScheduleLoading(false);
    });
    return () => { cancelled = true; };
  }, [today, user.id, user.organizationId, user.role]);

  const criticalSlots = useMemo(() => dashboard?.pauses.timeline.filter((point) => point.critical) ?? [], [dashboard]);
  const showPauses = canManagePauses && (mode === "overview" || mode === "pauses");
  const showQuality = mode === "overview" || mode === "quality";
  const dashboardModes: Array<[DashboardMode, string]> = canManagePauses
    ? [["overview", "Visão geral"], ["pauses", "Pausas"], ["quality", "Qualidade"]]
    : [["overview", "Visão geral"], ["quality", "Qualidade"]];

  if (loading) return <OperationalState state="loading" title="Carregando operação SAC" detail="Consolidando cobertura, qualidade e comunicados." />;
  if (error || !dashboard) return <OperationalState state="error" title="Dashboard SAC indisponível" detail={error ?? "Dados operacionais não encontrados."} />;

  return (
    <div className="support-dashboard-page">
      {user.role === "SAC" ? (
        <TodayScheduleHighlight
          calendar={todaySchedule}
          error={todayScheduleError}
          loading={todayScheduleLoading}
          today={today}
          onOpen={onOpen}
        />
      ) : null}

      <section className="panel support-dashboard-controls">
        <label>Data<input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label>
        <div className="segmented-control" role="tablist" aria-label="Visão do dashboard">
          {dashboardModes.map(([key, label]) => (
            <button key={key} type="button" role="tab" aria-selected={mode === key} className={mode === key ? "active" : ""} onClick={() => setMode(key)}>{label}</button>
          ))}
        </div>
      </section>

      <section className="support-dashboard-metrics" aria-label="Indicadores principais">
        <MetricButton label="SAC ativos" value={dashboard.pauses.summary.activeAgents} detail={`Cobertura mínima: ${dashboard.pauses.summary.minimumCoverage}`} onClick={() => onOpen("supportPauses")} />
        <MetricButton label="Pausas reservadas" value={dashboard.pauses.summary.bookedPauses} detail={date === supportDateInputValue() ? "Grade de hoje" : formatDate(date)} onClick={() => onOpen("supportPauses")} />
        <MetricButton label="Faixas críticas" value={dashboard.pauses.summary.criticalIntervals} detail={criticalSlots.length ? `Primeira às ${formatTime(criticalSlots[0].startsAt)}` : "Cobertura saudável"} onClick={() => onOpen("supportPauses")} />
        <MetricButton label="Campanhas ativas" value={dashboard.campaigns.length} detail="Metas operacionais SAC" onClick={() => onOpen("supportCampaigns")} />
        <MetricButton label="Avisos ativos" value={knowledge?.metrics.activeAnnouncements ?? 0} detail="Comunicados da operação" onClick={() => onOpen("announcements")} />
      </section>

      {showPauses ? (
        <section className="panel support-dashboard-section">
          <div className="table-panel-toolbar">
            <div><p className="eyebrow">Capacidade</p><h2>Overlap das pausas</h2></div>
            <button className="secondary" type="button" onClick={() => onOpen("supportPauses")}>Gerenciar pausas</button>
          </div>
          <OverlapChart data={dashboard.pauses} />
          <div className="support-dashboard-slot-strip">
            {dashboard.pauses.slots.map((slot) => (
              <button key={slot.id} type="button" aria-label={`${formatTime(slot.startsAt)} a ${formatTime(slot.endsAt)}: ${slot.bookedCount} de ${slot.capacity} em pausa`} onClick={() => onOpen("supportPauses")}>
                <strong>{formatTime(slot.startsAt)}–{formatTime(slot.endsAt)}</strong>
                <span>{slot.bookedCount}/{slot.capacity} em pausa</span>
                <small>{slot.bookings.map((booking) => booking.user.name).join(", ") || "Livre"}</small>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {showQuality ? (
        <section className="panel support-dashboard-section">
          <div className="table-panel-toolbar">
            <div><p className="eyebrow">Qualidade</p><h2>Performance SAC</h2></div>
            <button className="secondary" type="button" onClick={() => onOpen("supportPerformance")}>Abrir performance</button>
          </div>
          <div className="support-quality-grid">
            {dashboard.performance.summary.map((item) => (
              <div key={supportSeriesKey(item)}>
                <span>{supportMetricDefinition(item.metric, item.unit).label}</span>
                <strong>{formatSupportMetricValue(item.metric, item.aggregation === "SUM" || item.aggregation === "LATEST" ? item.average : item.latest, item.unit)}</strong>
                <small>{dashboardSeriesScope(item, dashboard.performance.entries)} · {supportSeriesContext(item)}</small>
                <small>{item.samples ? item.aggregation === "SUM" || item.aggregation === "LATEST"
                  ? supportAggregationDetail(item)
                  : `Consolidado ${formatSupportMetricValue(item.metric, item.average, item.unit)} · ${supportAggregationDetail(item)}` : "Sem lançamento"}</small>
              </div>
            ))}
          </div>
          <div className="support-campaign-list">
            {dashboard.campaigns.map((campaign) => (
              <button key={campaign.id} type="button" aria-label={`${campaign.name}: ${campaign.result.current === null ? "sem medição" : campaign.result.achieved ? "na meta" : "em evolução"}`} onClick={() => onOpen("supportCampaigns")}>
                <strong>{campaign.name}</strong>
                <span>{supportMetricDefinition(campaign.metric, campaign.unit).label} {campaign.comparison === "LTE" ? "≤" : "≥"} {formatSupportMetricValue(campaign.metric, campaign.targetValue, campaign.unit)}</span>
                <small>{supportSeriesContext(campaign)}</small>
                <small>{campaign.result.current === null ? "Sem medição" : `${campaign.result.achieved ? "Na meta" : "Em evolução"} · atual ${formatSupportMetricValue(campaign.metric, campaign.result.current, campaign.unit)}`} · até {formatDate(campaign.endsAt)}</small>
              </button>
            ))}
            {dashboard.campaigns.length ? null : <OperationalState state="empty" title="Sem campanha ativa" detail="A gestão pode criar uma meta operacional em Campanhas." />}
          </div>
        </section>
      ) : null}

      {mode === "overview" ? (
        <section className="panel support-dashboard-section">
          <div className="table-panel-toolbar"><div><p className="eyebrow">Comunicação</p><h2>Avisos e conhecimento</h2></div></div>
          <div className="support-knowledge-grid">
            <div>
              <h3>Avisos ativos</h3>
              <div className="today-alert-list">
                {(knowledge?.queues.activeAnnouncements ?? []).map((announcement) => {
                  const compliance = announcement.acknowledgement;
                  const expanded = expandedAnnouncement === announcement.id;
                  return (
                    <article className={`announcement-compliance-card ${announcement.priority === "CRITICAL" ? "danger" : announcement.priority === "HIGH" ? "warning" : "info"}`} key={announcement.id}>
                      <button className="announcement-compliance-trigger" type="button" aria-expanded={expanded} onClick={() => setExpandedAnnouncement((current) => current === announcement.id ? null : announcement.id)}>
                        <strong>{announcement.pinned ? "Fixado · " : ""}{announcement.title}</strong>
                        <span>{announcement.summary ?? "Comunicado interno"}</span>
                        {compliance ? <small>{compliance.acknowledgedCount} cientes · {compliance.pendingCount} pendentes</small> : null}
                        {compliance ? <span className="announcement-compliance-tooltip" role="tooltip">
                          {compliance.acknowledgedCount} cientes · {compliance.openedWithoutAckUsers.length} abriram sem ciência · {compliance.notOpenedUsers.length} não abriram
                        </span> : null}
                      </button>
                      {expanded ? (
                        <div className="announcement-compliance-detail">
                          {compliance ? <div className="announcement-compliance-grid">
                            {[
                              { label: `Cientes (${compliance.acknowledgedUsers.length})`, people: compliance.acknowledgedUsers, empty: "Nenhuma ciência registrada." },
                              { label: `Abriram sem ciência (${compliance.openedWithoutAckUsers.length})`, people: compliance.openedWithoutAckUsers, empty: "Ninguém aguardando confirmação após abrir." },
                              { label: `Não abriram (${compliance.notOpenedUsers.length})`, people: compliance.notOpenedUsers, empty: "Todos já abriram o aviso." }
                            ].map((group) => <div className="announcement-compliance-people" key={group.label}>
                              <strong>{group.label}</strong>
                              {group.people.length ? <ul>{group.people.map((person) => <li key={person.id}><span>{person.name}</span><small>{person.role}</small></li>)}</ul> : <small>{group.empty}</small>}
                            </div>)}
                          </div> : null}
                          <button className="secondary" type="button" onClick={() => onOpen("announcements", { announcements: { slug: announcement.slug } })}>Abrir aviso</button>
                        </div>
                      ) : null}
                    </article>
                  );
                })}
                {knowledge?.queues.activeAnnouncements.length ? null : <OperationalState state="empty" title="Sem avisos ativos" detail="A operação está sem comunicados pendentes." />}
              </div>
            </div>
            <div>
              <h3>Conhecimento pendente</h3>
              <button className="support-knowledge-action" type="button" aria-label={`${knowledge?.metrics.wikiPendingReviews ?? 0} revisões da Wiki`} onClick={() => onOpen("wiki")}><strong>{knowledge?.metrics.wikiPendingReviews ?? 0}</strong><span>revisões da Wiki</span></button>
              <button className="support-knowledge-action" type="button" aria-label={`${knowledge?.metrics.faqUnanswered ?? 0} perguntas sem resposta`} onClick={() => onOpen("faq")}><strong>{knowledge?.metrics.faqUnanswered ?? 0}</strong><span>perguntas sem resposta</span></button>
            </div>
          </div>
        </section>
      ) : null}
      <span className="sr-only">Dashboard de {user.name}</span>
    </div>
  );
}
