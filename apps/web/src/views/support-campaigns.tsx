import { CircleStop, Pause, Pencil, Play, Plus, RefreshCw, Save, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import type { CurrentUser } from "@alwaystrack/shared";
import { api } from "../api";
import { ConfirmButton, OperationalState } from "../components/operational";
import {
  emptySupportCampaignDraft,
  formatSupportDate,
  formatSupportMetricValue,
  isSupportManager,
  supportAggregationDetail,
  supportCampaignDraftFromItem,
  supportCampaignPayloadFromDraft,
  supportCampaignStatusLabels,
  supportDefaultComparison,
  supportGranularityLabels,
  supportMetricDefinition,
  supportMetricInputHint,
  supportMetricKeys,
  supportMetricLabels,
  supportObservationTypeLabels,
  supportSeriesContext,
  supportScopeLabel,
  supportScopeLabels,
  supportScopeTypes,
  writableSupportMetricKeys,
  type SupportAgent,
  type SupportCampaign,
  type SupportCampaignDraft,
  type SupportCampaignsResponse,
  type SupportPerformanceResponse,
  type SupportTeam
} from "../support-operations";
import "../support-operations.css";

function errorMessage(caught: unknown, fallback: string) {
  return caught instanceof Error ? caught.message : fallback;
}

function CampaignTrend({ campaign }: { campaign: SupportCampaign }) {
  const points = campaign.result.trend.slice(-8);
  if (!points.length) return null;
  const maximum = Math.max(...points.map((point) => point.value), campaign.targetValue, 1);
  return (
    <ol className="support-campaign-trend" aria-label={`Tendência de ${campaign.name}`}>
      {points.map((point, index) => (
        <li
          key={point.entryId ?? `${point.periodEnd}-${index}`}
          style={{ height: `${Math.max(point.value / maximum * 100, 6)}%` }}
          title={`${formatSupportDate(point.periodEnd)}: ${formatSupportMetricValue(campaign.metric, point.value, campaign.unit)}`}
        >
          <span className="sr-only">{formatSupportDate(point.periodEnd)}: {formatSupportMetricValue(campaign.metric, point.value, campaign.unit)}</span>
        </li>
      ))}
    </ol>
  );
}

const emptyCampaignFilters = { status: "", metric: "", channel: "", granularity: "", observationType: "" };

export function SupportCampaignsView({ user, initialCampaignId }: { user: CurrentUser; initialCampaignId?: string }) {
  const canManage = isSupportManager(user);
  const [items, setItems] = useState<SupportCampaign[] | null>(null);
  const [agents, setAgents] = useState<SupportAgent[]>([]);
  const [teams, setTeams] = useState<SupportTeam[]>([]);
  const [draft, setDraft] = useState<SupportCampaignDraft>(emptySupportCampaignDraft);
  const [filters, setFilters] = useState(emptyCampaignFilters);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const focusedCampaignId = useRef("");

  async function load(showLoading = true) {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const campaignPromise = api<SupportCampaignsResponse>("/v1/support/campaigns");
      const performancePromise = canManage
        ? api<SupportPerformanceResponse>("/v1/support/performance")
        : Promise.resolve(null);
      const [campaignResult, performanceResult] = await Promise.all([campaignPromise, performancePromise]);
      setItems(campaignResult.items);
      setTeams(campaignResult.teams ?? performanceResult?.teams ?? []);
      if (performanceResult) setAgents(performanceResult.agents);
    } catch (caught) {
      setError(errorMessage(caught, "Falha ao carregar as campanhas SAC."));
    } finally {
      if (showLoading) setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (!items || !initialCampaignId || focusedCampaignId.current === initialCampaignId) return;
    if (!items.some((item) => item.id === initialCampaignId)) return;
    if (Object.values(filters).some(Boolean)) {
      setFilters(emptyCampaignFilters);
      return;
    }
    const frame = window.requestAnimationFrame(() => {
      const target = document.getElementById(`support-campaign-${initialCampaignId}`);
      if (!target) return;
      focusedCampaignId.current = initialCampaignId;
      target.focus();
      target.scrollIntoView({ block: "center" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [filters, initialCampaignId, items]);

  async function saveCampaign(event: FormEvent) {
    event.preventDefault();
    if (!canManage) return;
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      await api(draft.id ? `/v1/support/campaigns/${draft.id}` : "/v1/support/campaigns", {
        method: draft.id ? "PATCH" : "POST",
        body: JSON.stringify(supportCampaignPayloadFromDraft(draft))
      });
      setNotice(draft.id ? "Campanha atualizada." : "Campanha criada.");
      setDraft(emptySupportCampaignDraft());
      await load(false);
    } catch (caught) {
      setError(errorMessage(caught, "Falha ao salvar a campanha."));
    } finally {
      setSaving(false);
    }
  }

  async function transitionCampaign(campaignId: string, status: "ACTIVE" | "PAUSED" | "CLOSED") {
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      await api(`/v1/support/campaigns/${campaignId}`, {
        method: "PATCH",
        body: JSON.stringify({ status })
      });
      setNotice(status === "ACTIVE" ? "Campanha publicada." : status === "PAUSED" ? "Campanha pausada." : "Campanha encerrada com resultado congelado.");
      setDraft(emptySupportCampaignDraft());
      await load(false);
    } catch (caught) {
      setError(errorMessage(caught, "Falha ao alterar o estado da campanha."));
    } finally {
      setSaving(false);
    }
  }

  const filteredItems = useMemo(() => (items ?? []).filter((item) => {
    if (filters.status && item.status !== filters.status) return false;
    if (filters.metric && item.metric !== filters.metric) return false;
    if (filters.channel === "__NONE__" && item.channel) return false;
    if (filters.channel && filters.channel !== "__NONE__" && item.channel !== filters.channel) return false;
    if (filters.granularity && item.granularity !== filters.granularity) return false;
    if (filters.observationType && item.observationType !== filters.observationType) return false;
    return true;
  }), [filters, items]);
  const channels = useMemo(() => [...new Set((items ?? []).map((item) => item.channel).filter((channel): channel is string => Boolean(channel)))].sort(), [items]);
  const draftDefinition = supportMetricDefinition(draft.metric);
  const campaignSummary = useMemo(() => {
    const active = (items ?? []).filter((item) => item.status === "ACTIVE");
    const endingSoon = active.filter((item) => {
      const remaining = new Date(item.endsAt).getTime() - Date.now();
      return remaining >= 0 && remaining <= 7 * 24 * 60 * 60 * 1000;
    });
    return {
      active: active.length,
      achieved: active.filter((item) => item.result.achieved).length,
      withoutData: active.filter((item) => item.result.current === null).length,
      endingSoon: endingSoon.length
    };
  }, [items]);

  if (loading && !items) {
    return <OperationalState state="loading" title="Carregando campanhas" detail="Consultando metas e escopos da operação SAC." />;
  }
  if (error && !items) {
    return <OperationalState state="error" title="Campanhas indisponíveis" detail={error} />;
  }
  if (!items) return null;

  return (
    <section className="support-operations support-campaigns-view">
      <header className="support-view-header">
        <div><p className="eyebrow">Operação SAC</p><h1>Campanhas</h1></div>
        <button className="secondary support-icon-button" type="button" aria-label="Atualizar campanhas" title="Atualizar campanhas" onClick={() => void load()}><RefreshCw size={17} /></button>
      </header>

      {notice ? <p className="support-notice" role="status">{notice}</p> : null}
      {error ? <p className="error" role="alert">{error}</p> : null}

      <section className="support-metrics-grid" aria-label="Resumo das campanhas">
        <div className="support-metric-card"><span>Ativas</span><strong>{campaignSummary.active}</strong></div>
        <div className="support-metric-card"><span>Na meta</span><strong>{campaignSummary.achieved}</strong></div>
        <div className="support-metric-card"><span>Sem medição</span><strong>{campaignSummary.withoutData}</strong></div>
        <div className="support-metric-card"><span>Encerram em 7 dias</span><strong>{campaignSummary.endingSoon}</strong></div>
      </section>

      {canManage ? (
        <section className="support-form-section" aria-labelledby="support-campaign-form-title">
          <div className="support-section-heading">
            <div><p className="eyebrow">{draft.id ? "Revisão" : "Nova meta"}</p><h2 id="support-campaign-form-title">{draft.id ? "Editar campanha" : "Criar campanha"}</h2></div>
            {draft.id ? <button className="secondary small" type="button" onClick={() => setDraft(emptySupportCampaignDraft())}><X size={15} /> Cancelar edição</button> : null}
          </div>
          <form className="support-form-grid support-campaign-form" onSubmit={saveCampaign}>
            <label className="support-wide-field">Nome<input required maxLength={160} value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} /></label>
            <label>Métrica
              <select value={draft.metric} onChange={(event) => {
                const metric = event.target.value as SupportCampaignDraft["metric"];
                setDraft((current) => ({ ...current, metric, targetValue: "", comparison: supportDefaultComparison(metric) }));
              }}>
                {writableSupportMetricKeys.map((metric) => <option key={metric} value={metric}>{supportMetricLabels[metric]}</option>)}
              </select>
            </label>
            <label>Meta<input required inputMode={draftDefinition.unit === "COUNT" ? "numeric" : "decimal"} placeholder={supportMetricInputHint(draft.metric)} type="text" value={draft.targetValue} onChange={(event) => setDraft((current) => ({ ...current, targetValue: event.target.value }))} /></label>
            <fieldset className="support-segmented-field">
              <legend>Comparação</legend>
              <div>
                <label className={draft.comparison === "GTE" ? "active" : ""}><input type="radio" name="support-comparison" value="GTE" checked={draft.comparison === "GTE"} onChange={() => setDraft((current) => ({ ...current, comparison: "GTE" }))} /> ≥ Pelo menos</label>
                <label className={draft.comparison === "LTE" ? "active" : ""}><input type="radio" name="support-comparison" value="LTE" checked={draft.comparison === "LTE"} onChange={() => setDraft((current) => ({ ...current, comparison: "LTE" }))} /> ≤ No máximo</label>
              </div>
            </fieldset>
            <label>Canal<input maxLength={40} placeholder="Ex.: TIKTOK" value={draft.channel} onChange={(event) => setDraft((current) => ({ ...current, channel: event.target.value }))} /></label>
            <label>Período da série
              <select value={draft.granularity} onChange={(event) => setDraft((current) => ({ ...current, granularity: event.target.value as SupportCampaignDraft["granularity"] }))}>
                {Object.entries(supportGranularityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <label>Escopo
              <select value={draft.scopeType} onChange={(event) => setDraft((current) => ({ ...current, scopeType: event.target.value as SupportCampaignDraft["scopeType"], userId: "", teamId: "", teamLabel: "" }))}>
                {supportScopeTypes.map((scope) => <option key={scope} value={scope}>{supportScopeLabels[scope]}</option>)}
              </select>
            </label>
            {draft.scopeType === "USER" ? <label>Agente<select required value={draft.userId} onChange={(event) => setDraft((current) => ({ ...current, userId: event.target.value }))}><option value="">Selecione</option>{agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.name}</option>)}</select></label> : null}
            {draft.scopeType === "TEAM" ? <label>Equipe<select required value={draft.teamId} onChange={(event) => {
              const team = teams.find((item) => item.id === event.target.value);
              setDraft((current) => ({ ...current, teamId: event.target.value, teamLabel: team?.name ?? "" }));
            }}><option value="">Selecione</option>{teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}</select></label> : null}
            <label>Início<input required type="date" value={draft.startsAt} onChange={(event) => setDraft((current) => ({ ...current, startsAt: event.target.value }))} /></label>
            <label>Fim<input required type="date" value={draft.endsAt} onChange={(event) => setDraft((current) => ({ ...current, endsAt: event.target.value }))} /></label>
            <label className="support-full-span">Descrição<textarea maxLength={1000} rows={3} value={draft.description} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} /></label>
            <div className="support-form-actions support-full-span"><button type="submit" disabled={saving}>{draft.id ? <Save size={16} /> : <Plus size={16} />}{draft.id ? "Salvar campanha" : "Criar campanha"}</button></div>
          </form>
        </section>
      ) : null}

      <section className="support-table-section" aria-labelledby="support-campaign-list-title">
        <div className="support-section-heading support-filter-heading">
          <div><p className="eyebrow">Metas operacionais</p><h2 id="support-campaign-list-title">Campanhas SAC</h2></div>
          <div className="support-inline-filters">
            <label>Status<select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}><option value="">Todos</option>{Object.entries(supportCampaignStatusLabels).map(([status, label]) => <option key={status} value={status}>{label}</option>)}</select></label>
            <label>Métrica<select value={filters.metric} onChange={(event) => setFilters((current) => ({ ...current, metric: event.target.value }))}><option value="">Todas</option>{supportMetricKeys.map((metric) => <option key={metric} value={metric}>{supportMetricLabels[metric]}</option>)}</select></label>
            <label>Canal<select value={filters.channel} onChange={(event) => setFilters((current) => ({ ...current, channel: event.target.value }))}><option value="">Todos</option><option value="__NONE__">Sem canal</option>{channels.map((channel) => <option key={channel} value={channel}>{channel}</option>)}</select></label>
            <label>Período<select value={filters.granularity} onChange={(event) => setFilters((current) => ({ ...current, granularity: event.target.value }))}><option value="">Todos</option>{Object.entries(supportGranularityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label>Tipo<select value={filters.observationType} onChange={(event) => setFilters((current) => ({ ...current, observationType: event.target.value }))}><option value="">Todos</option>{Object.entries(supportObservationTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          </div>
        </div>
        {filteredItems.length ? (
          <div className="table-scroll">
            <table aria-label="Campanhas SAC">
              <thead><tr><th scope="col">Campanha</th><th scope="col">Métrica</th><th scope="col">Regra</th><th scope="col">Resultado</th><th scope="col">Escopo</th><th scope="col">Período</th><th scope="col">Status</th>{canManage ? <th scope="col">Ações</th> : null}</tr></thead>
              <tbody>{filteredItems.map((item) => (
                <tr
                  className={item.id === initialCampaignId ? "support-campaign-target" : undefined}
                  id={`support-campaign-${item.id}`}
                  key={item.id}
                  tabIndex={-1}
                >
                  <td><strong>{item.name}</strong>{item.description ? <small>{item.description}</small> : null}</td>
                  <td>{supportMetricLabels[item.metric]}<small>{supportSeriesContext(item)}{supportMetricDefinition(item.metric, item.unit).status !== "CURRENT" ? " · somente leitura" : ""}</small></td>
                  <td><strong>{item.comparison === "GTE" ? "≥" : "≤"} {formatSupportMetricValue(item.metric, item.targetValue, item.unit)}</strong></td>
                  <td className="support-campaign-result">
                    <strong>{formatSupportMetricValue(item.metric, item.result.current, item.unit)}</strong>
                    <span className={`support-status ${item.result.current === null ? "draft" : item.result.achieved ? "active" : "paused"}`}>
                      {item.result.current === null ? "Sem medição" : item.result.achieved ? "Na meta" : "Fora da meta"}
                    </span>
                    <span className="support-progress" role="progressbar" aria-label={`Progresso de ${item.name}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(item.result.progressPercent)}>
                      <i style={{ width: `${item.result.progressPercent}%` }} />
                    </span>
                    <CampaignTrend campaign={item} />
                    <small>{supportAggregationDetail({ ...item.result, unit: item.unit })}{item.result.frozenAt ? ` · fechado em ${formatSupportDate(item.result.frozenAt)}` : ""}</small>
                  </td>
                  <td>{supportScopeLabel(item)}<small>{item.audience.members.length} pessoa(s)</small>{item.audience.members.length ? <details><summary>Ver público</summary><ul>{item.audience.members.map((member) => <li key={member.id}>{member.name}</li>)}</ul></details> : null}</td>
                  <td>{formatSupportDate(item.startsAt)}<small>até {formatSupportDate(item.endsAt)}</small></td>
                  <td><span className={`support-status ${item.status.toLowerCase()}`}>{supportCampaignStatusLabels[item.status]}</span></td>
                  {canManage ? <td><div className="inline-actions support-campaign-actions">
                    {item.status === "DRAFT" && supportMetricDefinition(item.metric, item.unit).status === "CURRENT" ? <><button className="secondary small" type="button" disabled={saving} onClick={() => { setDraft(supportCampaignDraftFromItem(item)); window.scrollTo({ top: 0, behavior: "smooth" }); }}><Pencil size={15} /> Editar</button><button className="small" type="button" disabled={saving} onClick={() => void transitionCampaign(item.id, "ACTIVE")}><Play size={15} /> Publicar</button></> : null}
                    {item.status === "ACTIVE" && supportMetricDefinition(item.metric, item.unit).status === "CURRENT" ? <button className="secondary small" type="button" disabled={saving} onClick={() => void transitionCampaign(item.id, "PAUSED")}><Pause size={15} /> Pausar</button> : null}
                    {item.status === "PAUSED" && supportMetricDefinition(item.metric, item.unit).status === "CURRENT" ? <button className="small" type="button" disabled={saving} onClick={() => void transitionCampaign(item.id, "ACTIVE")}><Play size={15} /> Retomar</button> : null}
                    {(item.status === "ACTIVE" || item.status === "PAUSED") && supportMetricDefinition(item.metric, item.unit).status === "CURRENT" ? <ConfirmButton confirmLabel="Confirmar encerramento" disabled={saving} onConfirm={() => void transitionCampaign(item.id, "CLOSED")}><CircleStop size={15} /> Encerrar</ConfirmButton> : null}
                    {supportMetricDefinition(item.metric, item.unit).status !== "CURRENT" ? <span className="muted">Somente leitura</span> : null}
                    {item.status === "CLOSED" ? <span className="muted">Sem ações</span> : null}
                  </div></td> : null}
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : <OperationalState state="empty" title="Nenhuma campanha encontrada" detail={items.length ? "Ajuste os filtros para ampliar a busca." : "Ainda não há campanhas SAC cadastradas."} />}
      </section>
    </section>
  );
}
