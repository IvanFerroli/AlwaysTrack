import { useEffect, useMemo, useState } from "react";
import type { CurrentUser } from "@alwaystrack/shared";
import { api } from "../api";
import { OperationalState } from "../components/operational";
import { formatSupportDate, formatSupportTime, supportDateInputValue } from "../support-operations";
import "../support-dashboard.css";

type DashboardTargetView = "announcements" | "faq" | "wiki" | "supportPauses" | "supportPerformance" | "supportCampaigns";
type DashboardMode = "overview" | "pauses" | "quality";
type DashboardIntent = { faq?: { status?: string }; announcements?: { slug?: string | null } };

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
    summary: Array<{ metric: string; latest: number | null; average: number | null; samples: number; aggregation: "WEIGHTED" | "SIMPLE" }>;
    entries: Array<{ id: string; metric: string; value: number; periodStart: string }>;
  };
  campaigns: Array<{
    id: string;
    name: string;
    metric: string;
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
        pendingCount: number;
        completed: boolean;
        acknowledgedUsers: Array<{ id: string; name: string; email: string; role: string }>;
        openedWithoutAckUsers: Array<{ id: string; name: string; email: string; role: string }>;
        notOpenedUsers: Array<{ id: string; name: string; email: string; role: string }>;
      } | null;
    }>;
  };
}

const metricLabels: Record<string, string> = {
  CSAT: "CSAT",
  PRODUCTIVITY: "Produtividade",
  SLA: "SLA",
  RECLAME_AQUI_OPEN: "ReclameAqui abertos"
};

function formatTime(value: string) {
  return formatSupportTime(value);
}

function formatDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo" }).format(new Date(`${value}T12:00:00-03:00`))
    : formatSupportDate(value);
}

function formatMetric(metric: string, value: number | null) {
  if (value === null) return "-";
  if (metric === "CSAT" || metric === "SLA") return `${value.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
  return value.toLocaleString("pt-BR", { maximumFractionDigits: 1 });
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

export function DashboardView({ user, onOpen }: { user: CurrentUser; onOpen: (view: DashboardTargetView, options?: DashboardIntent) => void }) {
  const [date, setDate] = useState(supportDateInputValue());
  const [mode, setMode] = useState<DashboardMode>("overview");
  const [dashboard, setDashboard] = useState<SupportDashboardData | null>(null);
  const [knowledge, setKnowledge] = useState<OperationalKnowledgeData | null>(null);
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

  const criticalSlots = useMemo(() => dashboard?.pauses.timeline.filter((point) => point.critical) ?? [], [dashboard]);
  const showPauses = mode === "overview" || mode === "pauses";
  const showQuality = mode === "overview" || mode === "quality";

  if (loading) return <OperationalState state="loading" title="Carregando operação SAC" detail="Consolidando cobertura, qualidade e comunicados." />;
  if (error || !dashboard) return <OperationalState state="error" title="Dashboard SAC indisponível" detail={error ?? "Dados operacionais não encontrados."} />;

  return (
    <div className="support-dashboard-page">
      <section className="panel support-dashboard-controls">
        <label>Data<input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label>
        <div className="segmented-control" role="tablist" aria-label="Visão do dashboard">
          {([[
            "overview", "Visão geral"
          ], ["pauses", "Pausas"], ["quality", "Qualidade"]] as Array<[DashboardMode, string]>).map(([key, label]) => (
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
              <div key={item.metric}>
                <span>{metricLabels[item.metric] ?? item.metric}</span>
                <strong>{formatMetric(item.metric, item.latest)}</strong>
                <small>{item.samples ? `Média ${formatMetric(item.metric, item.average)}` : "Sem lançamento"}</small>
              </div>
            ))}
          </div>
          <div className="support-campaign-list">
            {dashboard.campaigns.map((campaign) => (
              <button key={campaign.id} type="button" aria-label={`${campaign.name}: ${campaign.result.current === null ? "sem medição" : campaign.result.achieved ? "na meta" : "em evolução"}`} onClick={() => onOpen("supportCampaigns")}>
                <strong>{campaign.name}</strong>
                <span>{metricLabels[campaign.metric] ?? campaign.metric} {campaign.comparison === "LTE" ? "≤" : "≥"} {formatMetric(campaign.metric, campaign.targetValue)}</span>
                <small>{campaign.result.current === null ? "Sem medição" : `${campaign.result.achieved ? "Na meta" : "Em evolução"} · atual ${formatMetric(campaign.metric, campaign.result.current)}`} · até {formatDate(campaign.endsAt)}</small>
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
                      </button>
                      {expanded ? (
                        <div className="announcement-compliance-detail">
                          {compliance ? <p>{compliance.acknowledgedUsers.map((person) => person.name).join(", ") || "Nenhuma ciência registrada."}</p> : null}
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
