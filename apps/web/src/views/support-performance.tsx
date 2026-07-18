import { BarChart3, Check, Pencil, Plus, RefreshCw, Send, ThumbsDown, X } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import type { CurrentUser } from "@alwaystrack/shared";
import { keyboardTabIndex } from "../accessibility/tabs";
import { api } from "../api";
import { OperationalState } from "../components/operational";
import {
  emptySupportKpiDraft,
  formatSupportDate,
  formatSupportMetricValue,
  isSameSupportSeries,
  isSupportManager,
  shiftSupportDate,
  supportAggregationDetail,
  supportDateInputValue,
  supportDayBoundaryIso,
  supportGranularityLabels,
  supportKpiDraftFromEntry,
  supportKpiPayloadFromDraft,
  supportMetricDefinition,
  supportMetricDenominatorLabel,
  supportMetricInputHint,
  supportMetricKeys,
  supportMetricLabels,
  supportObservationTypeLabels,
  supportSeriesContext,
  supportSeriesKey,
  supportScopeLabel,
  supportScopeLabels,
  supportScopeTypes,
  writableSupportMetricKeys,
  type SupportKpiDraft,
  type SupportKpiEntry,
  type SupportPerformanceResponse
} from "../support-operations";
import "../support-operations.css";

type PerformanceTab = "overview" | "entries";

function errorMessage(caught: unknown, fallback: string) {
  return caught instanceof Error ? caught.message : fallback;
}

type SupportSummary = SupportPerformanceResponse["summary"][number];

function MetricTrend({ series, entries }: { series: SupportSummary; entries: SupportKpiEntry[] }) {
  const points = entries.filter((entry) => entry.status === "APPROVED" && isSameSupportSeries(entry, series)).slice(-12);
  if (!points.length) return <span className="support-trend-empty">Sem série</span>;
  const maximum = Math.max(...points.map((entry) => entry.value), 1);
  return (
    <span className="support-mini-trend" role="img" aria-label={`Tendência de ${supportMetricLabels[series.metric]} com ${points.length} pontos`}>
      {points.map((entry) => (
        <i
          key={entry.id}
          style={{ height: `${Math.max(entry.value / maximum * 100, 5)}%` }}
          title={`${formatSupportDate(entry.periodEnd)}: ${formatSupportMetricValue(entry.metric, entry.value, entry.unit)}`}
        />
      ))}
    </span>
  );
}

const reviewStatusLabel: Record<SupportKpiEntry["status"], string> = {
  DRAFT: "Rascunho",
  SUBMITTED: "Em revisão",
  APPROVED: "Aprovado",
  REJECTED: "Rejeitado",
  SUPERSEDED: "Substituído"
};

export function SupportPerformanceView({ user }: { user: CurrentUser }) {
  const canManage = isSupportManager(user);
  const today = supportDateInputValue();
  const [tab, setTab] = useState<PerformanceTab>("overview");
  const [filters, setFilters] = useState({
    from: shiftSupportDate(today, -30),
    to: today,
    metric: "",
    userId: "",
    channel: "",
    granularity: "",
    observationType: ""
  });
  const [data, setData] = useState<SupportPerformanceResponse | null>(null);
  const [draft, setDraft] = useState<SupportKpiDraft>(() => emptySupportKpiDraft(today));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function load(showLoading = true) {
    if (showLoading) setLoading(true);
    setError(null);
    const search = new URLSearchParams({
      from: supportDayBoundaryIso(filters.from, "start"),
      to: supportDayBoundaryIso(filters.to, "end")
    });
    if (filters.metric) search.set("metric", filters.metric);
    if (canManage && filters.userId) search.set("userId", filters.userId);
    if (filters.channel.trim()) search.set("channel", filters.channel.trim().toUpperCase());
    if (filters.granularity) search.set("granularity", filters.granularity);
    if (filters.observationType) search.set("observationType", filters.observationType);
    try {
      setData(await api<SupportPerformanceResponse>(`/v1/support/performance?${search.toString()}`));
    } catch (caught) {
      setError(errorMessage(caught, "Falha ao carregar o desempenho SAC."));
    } finally {
      if (showLoading) setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function saveEntry(event: FormEvent) {
    event.preventDefault();
    if (!canManage) return;
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      await api(draft.id ? `/v1/support/performance/entries/${draft.id}` : "/v1/support/performance/entries", {
        method: draft.id ? "PATCH" : "POST",
        body: JSON.stringify(supportKpiPayloadFromDraft(draft))
      });
      const existing = data?.entries.find((entry) => entry.id === draft.id);
      setNotice(draft.id && existing?.status === "APPROVED" ? "Correção criada como novo rascunho." : draft.id ? "Rascunho atualizado." : "Rascunho criado.");
      setDraft(emptySupportKpiDraft(today));
      await load(false);
    } catch (caught) {
      setError(errorMessage(caught, "Falha ao salvar o indicador."));
    } finally {
      setSaving(false);
    }
  }

  async function submitEntry(entry: SupportKpiEntry) {
    setSaving(true);
    setError(null);
    try {
      await api(`/v1/support/performance/entries/${entry.id}/submit`, { method: "POST" });
      setNotice("Indicador enviado para revisão.");
      await load(false);
    } catch (caught) {
      setError(errorMessage(caught, "Falha ao enviar o indicador para revisão."));
    } finally {
      setSaving(false);
    }
  }

  async function reviewEntry(entry: SupportKpiEntry, decision: "APPROVED" | "REJECTED") {
    const reviewNote = decision === "REJECTED" ? window.prompt("Motivo da rejeição")?.trim() : "Conferido na gestão SAC.";
    if (decision === "REJECTED" && !reviewNote) return;
    setSaving(true);
    setError(null);
    try {
      await api(`/v1/support/performance/entries/${entry.id}/review`, {
        method: "POST",
        body: JSON.stringify({ decision, reviewNote })
      });
      setNotice(decision === "APPROVED" ? "Indicador aprovado e publicado." : "Indicador rejeitado para correção.");
      await load(false);
    } catch (caught) {
      setError(errorMessage(caught, "Falha ao revisar o indicador."));
    } finally {
      setSaving(false);
    }
  }

  function editEntry(entry: SupportKpiEntry) {
    setDraft(supportKpiDraftFromEntry(entry));
    setTab("entries");
  }

  const tabs: ReadonlyArray<readonly [PerformanceTab, string]> = canManage
    ? [["overview", "Indicadores"], ["entries", "Lançamentos"]]
    : [["overview", "Indicadores"]];
  const draftDefinition = supportMetricDefinition(draft.metric);
  const denominatorLabel = supportMetricDenominatorLabel(draft.metric);

  function summaryScopeLabel(item: SupportSummary) {
    if (item.scopeType === "USER") return data?.agents.find((agent) => agent.id === item.userId)?.name ?? "Pessoa não identificada";
    if (item.scopeType === "TEAM") return data?.teams.find((team) => team.id === item.teamId)?.name ?? item.teamLabel ?? "Equipe não identificada";
    return supportScopeLabels.ORGANIZATION;
  }

  if (loading && !data) {
    return <OperationalState state="loading" title="Carregando desempenho" detail="Consolidando os indicadores do período." />;
  }
  if (error && !data) {
    return <OperationalState state="error" title="Desempenho indisponível" detail={error} />;
  }
  if (!data) return null;

  return (
    <section className="support-operations support-performance-view">
      <header className="support-view-header">
        <div><p className="eyebrow">Operação SAC</p><h1>Desempenho</h1></div>
        <button className="secondary support-icon-button" type="button" aria-label="Atualizar indicadores" title="Atualizar indicadores" onClick={() => void load()}>
          <RefreshCw size={17} />
        </button>
      </header>

      <form className="support-filter-bar" onSubmit={(event) => { event.preventDefault(); void load(); }}>
        <label>De<input required type="date" value={filters.from} onChange={(event) => setFilters((current) => ({ ...current, from: event.target.value }))} /></label>
        <label>Até<input required type="date" value={filters.to} onChange={(event) => setFilters((current) => ({ ...current, to: event.target.value }))} /></label>
        <label>Métrica
          <select value={filters.metric} onChange={(event) => setFilters((current) => ({ ...current, metric: event.target.value }))}>
            <option value="">Todas</option>
            {supportMetricKeys.map((metric) => <option key={metric} value={metric}>{supportMetricLabels[metric]}</option>)}
          </select>
        </label>
        <label>Canal<input maxLength={40} placeholder="Todos" value={filters.channel} onChange={(event) => setFilters((current) => ({ ...current, channel: event.target.value }))} /></label>
        <label>Período
          <select value={filters.granularity} onChange={(event) => setFilters((current) => ({ ...current, granularity: event.target.value }))}>
            <option value="">Todos</option>
            {Object.entries(supportGranularityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label>Tipo
          <select value={filters.observationType} onChange={(event) => setFilters((current) => ({ ...current, observationType: event.target.value }))}>
            <option value="">Todos</option>
            {Object.entries(supportObservationTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        {canManage ? <label>Agente
          <select value={filters.userId} onChange={(event) => setFilters((current) => ({ ...current, userId: event.target.value }))}>
            <option value="">Todos</option>
            {data.agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.name}</option>)}
          </select>
        </label> : null}
        <button type="submit"><BarChart3 size={16} /> Aplicar</button>
      </form>

      <div className="segmented-control support-tabs" role="tablist" aria-label="Áreas de desempenho">
        {tabs.map(([key, label], index) => (
          <button
            id={`support-performance-${key}-tab`}
            key={key}
            type="button"
            role="tab"
            className={tab === key ? "active" : ""}
            aria-controls={`support-performance-${key}-panel`}
            aria-selected={tab === key}
            tabIndex={tab === key ? 0 : -1}
            onClick={() => setTab(key)}
            onKeyDown={(event) => {
              const nextIndex = keyboardTabIndex(event.key, index, tabs.length);
              if (nextIndex === null) return;
              event.preventDefault();
              setTab(tabs[nextIndex][0]);
              event.currentTarget.parentElement?.querySelectorAll<HTMLElement>("[role=tab]")[nextIndex]?.focus();
            }}
          >{label}</button>
        ))}
      </div>

      {notice ? <p className="support-notice" role="status">{notice}</p> : null}
      {error ? <p className="error" role="alert">{error}</p> : null}

      {tab === "overview" ? (
        <div id="support-performance-overview-panel" role="tabpanel" aria-labelledby="support-performance-overview-tab" className="support-tab-panel">
          <div className="support-metrics-grid">
            {data.summary.map((item) => (
              <div className="support-metric-card" key={supportSeriesKey(item)}>
                <span>{supportMetricLabels[item.metric]}</span>
                <strong>{formatSupportMetricValue(item.metric, item.aggregation === "SUM" || item.aggregation === "LATEST" ? item.average : item.latest, item.unit)}</strong>
                <MetricTrend series={item} entries={data.entries} />
                <small>{summaryScopeLabel(item)} · {supportSeriesContext(item)}</small>
                <small>{item.aggregation === "SUM" || item.aggregation === "LATEST" ? supportAggregationDetail(item) : `Consolidado ${formatSupportMetricValue(item.metric, item.average, item.unit)} · ${supportAggregationDetail(item)}`}</small>
              </div>
            ))}
          </div>

          <section className="support-table-section" aria-labelledby="support-entry-history-title">
            <div className="support-section-heading"><div><p className="eyebrow">Série governada</p><h2 id="support-entry-history-title">Histórico de indicadores</h2></div><span className="support-count">{data.pendingReviewCount} em revisão · {data.entries.length} registro(s)</span></div>
            {data.entries.length ? (
              <div className="table-scroll">
                <table aria-label="Histórico de indicadores SAC">
                  <thead><tr><th scope="col">Período</th><th scope="col">Métrica</th><th scope="col">Resultado</th><th scope="col">Escopo</th><th scope="col">Fonte</th><th scope="col">Estado</th>{canManage ? <th scope="col">Ações</th> : null}</tr></thead>
                  <tbody>{[...data.entries].reverse().map((entry) => (
                    <tr key={entry.id}>
                      <td>{formatSupportDate(entry.periodStart)}<small>até {formatSupportDate(entry.periodEnd)}</small></td>
                      <td><strong>{supportMetricLabels[entry.metric]}</strong><small>{supportSeriesContext(entry)}{supportMetricDefinition(entry.metric, entry.unit).status === "LEGACY_READ_ONLY" ? " · somente leitura" : ""}</small></td>
                      <td>{formatSupportMetricValue(entry.metric, entry.value, entry.unit)}{entry.denominator ? <small>{entry.denominator.toLocaleString("pt-BR")} {entry.unit === "DURATION_SECONDS" ? "atendimentos" : "respostas"}</small> : null}</td>
                      <td>{supportScopeLabel(entry)}</td>
                      <td>{entry.source || "-"}{entry.note ? <small>{entry.note}</small> : null}</td>
                      <td><span className={`support-review-status ${entry.status.toLowerCase()}`}>{reviewStatusLabel[entry.status]}</span><small>revisão {entry.revision}</small>{entry.reviewNote ? <small>{entry.reviewNote}</small> : null}</td>
                      {canManage ? <td><div className="row-actions">
                        {entry.status === "DRAFT" && supportMetricDefinition(entry.metric, entry.unit).status === "CURRENT" ? <><button className="secondary small" type="button" onClick={() => editEntry(entry)}><Pencil size={15} /> Editar</button><button className="small" disabled={saving} type="button" onClick={() => void submitEntry(entry)}><Send size={15} /> Enviar</button></> : null}
                        {entry.status === "SUBMITTED" && supportMetricDefinition(entry.metric, entry.unit).status === "CURRENT" ? <><button className="small" disabled={saving} type="button" onClick={() => void reviewEntry(entry, "APPROVED")}><Check size={15} /> Aprovar</button><button className="secondary small" disabled={saving} type="button" onClick={() => void reviewEntry(entry, "REJECTED")}><ThumbsDown size={15} /> Rejeitar</button></> : null}
                        {(entry.status === "APPROVED" || entry.status === "REJECTED") && supportMetricDefinition(entry.metric, entry.unit).status === "CURRENT" ? <button className="secondary small" type="button" onClick={() => editEntry(entry)}><Pencil size={15} /> {entry.status === "APPROVED" ? "Criar correção" : "Corrigir"}</button> : null}
                      </div></td> : null}
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            ) : <OperationalState state="empty" title="Nenhum indicador no período" />}
          </section>

          {data.campaigns.length ? (
            <section className="support-table-section" aria-labelledby="support-active-targets-title">
              <div className="support-section-heading"><div><p className="eyebrow">Referência</p><h2 id="support-active-targets-title">Metas em andamento</h2></div></div>
              <div className="table-scroll"><table aria-label="Metas SAC em andamento"><thead><tr><th scope="col">Campanha</th><th scope="col">Métrica</th><th scope="col">Meta</th><th scope="col">Escopo</th><th scope="col">Até</th></tr></thead><tbody>{data.campaigns.map((campaign) => <tr key={campaign.id}><td><strong>{campaign.name}</strong></td><td>{supportMetricLabels[campaign.metric]}<small>{supportSeriesContext(campaign)}</small></td><td>{campaign.comparison === "GTE" ? "≥" : "≤"} {formatSupportMetricValue(campaign.metric, campaign.targetValue, campaign.unit)}</td><td>{supportScopeLabel(campaign)}</td><td>{formatSupportDate(campaign.endsAt)}</td></tr>)}</tbody></table></div>
            </section>
          ) : null}
        </div>
      ) : null}

      {tab === "entries" && canManage ? (
        <div id="support-performance-entries-panel" role="tabpanel" aria-labelledby="support-performance-entries-tab" className="support-tab-panel">
          <section className="support-form-section" aria-labelledby="support-entry-form-title">
            <div className="support-section-heading">
              <div><p className="eyebrow">{draft.id ? "Correção manual" : "Entrada manual"}</p><h2 id="support-entry-form-title">{draft.id ? "Editar rascunho" : "Criar rascunho"}</h2></div>
              {draft.id ? <button className="secondary small" type="button" onClick={() => setDraft(emptySupportKpiDraft(today))}><X size={15} /> Cancelar edição</button> : null}
            </div>
            <form className="support-form-grid support-kpi-form" onSubmit={saveEntry}>
              <label>Métrica
                <select disabled={Boolean(draft.id)} value={draft.metric} onChange={(event) => setDraft((current) => ({ ...current, metric: event.target.value as SupportKpiDraft["metric"], value: "", sampleSize: "" }))}>
                  {writableSupportMetricKeys.map((metric) => <option key={metric} value={metric}>{supportMetricLabels[metric]}</option>)}
                </select>
              </label>
              <label>Valor<input required inputMode={draftDefinition.unit === "COUNT" ? "numeric" : "decimal"} placeholder={supportMetricInputHint(draft.metric)} type="text" value={draft.value} onChange={(event) => setDraft((current) => ({ ...current, value: event.target.value }))} /></label>
              {denominatorLabel ? <label>{denominatorLabel}<input min={1} step={1} type="number" value={draft.sampleSize} onChange={(event) => setDraft((current) => ({ ...current, sampleSize: event.target.value }))} /></label> : null}
              <label>Canal<input maxLength={40} placeholder="Ex.: TIKTOK" value={draft.channel} onChange={(event) => setDraft((current) => ({ ...current, channel: event.target.value }))} /></label>
              <label>Período
                <select value={draft.granularity} onChange={(event) => setDraft((current) => ({ ...current, granularity: event.target.value as SupportKpiDraft["granularity"] }))}>
                  {Object.entries(supportGranularityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
              <label>Tipo
                <select value={draft.observationType} onChange={(event) => setDraft((current) => ({ ...current, observationType: event.target.value as SupportKpiDraft["observationType"] }))}>
                  {Object.entries(supportObservationTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
              <label>Escopo
                <select disabled={Boolean(draft.id)} value={draft.scopeType} onChange={(event) => setDraft((current) => ({ ...current, scopeType: event.target.value as SupportKpiDraft["scopeType"], userId: "", teamId: "", teamLabel: "" }))}>
                  {supportScopeTypes.map((scope) => <option key={scope} value={scope}>{supportScopeLabels[scope]}</option>)}
                </select>
              </label>
              {draft.scopeType === "USER" ? <label>Agente<select required disabled={Boolean(draft.id)} value={draft.userId} onChange={(event) => setDraft((current) => ({ ...current, userId: event.target.value }))}><option value="">Selecione</option>{data.agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.name}</option>)}</select></label> : null}
              {draft.scopeType === "TEAM" ? <label>Equipe<select required disabled={Boolean(draft.id)} value={draft.teamId} onChange={(event) => {
                const team = data.teams.find((item) => item.id === event.target.value);
                setDraft((current) => ({ ...current, teamId: event.target.value, teamLabel: team?.name ?? "" }));
              }}><option value="">Selecione</option>{data.teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}</select></label> : null}
              <label>Início<input required disabled={Boolean(draft.id)} type="date" value={draft.periodStart} onChange={(event) => setDraft((current) => ({ ...current, periodStart: event.target.value }))} /></label>
              <label>Fim<input required disabled={Boolean(draft.id)} type="date" value={draft.periodEnd} onChange={(event) => setDraft((current) => ({ ...current, periodEnd: event.target.value }))} /></label>
              <label className="support-full-span">Fonte<input maxLength={160} placeholder="Ex.: relatório semanal" value={draft.source} onChange={(event) => setDraft((current) => ({ ...current, source: event.target.value }))} /></label>
              <label className="support-full-span">Observação<textarea maxLength={1000} rows={3} value={draft.note} onChange={(event) => setDraft((current) => ({ ...current, note: event.target.value }))} /></label>
              <div className="support-form-actions support-full-span"><button type="submit" disabled={saving}>{draft.id ? <Pencil size={16} /> : <Plus size={16} />}{draft.id ? "Salvar rascunho" : "Criar rascunho"}</button></div>
            </form>
          </section>
        </div>
      ) : null}
    </section>
  );
}
