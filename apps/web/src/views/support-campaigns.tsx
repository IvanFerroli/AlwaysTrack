import { Pencil, Plus, RefreshCw, Save, X } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { CurrentUser } from "@alwaystrack/shared";
import { api } from "../api";
import { OperationalState } from "../components/operational";
import {
  emptySupportCampaignDraft,
  formatSupportDate,
  formatSupportMetricValue,
  isSupportManager,
  supportCampaignDraftFromItem,
  supportCampaignPayloadFromDraft,
  supportCampaignStatusLabels,
  supportMetricKeys,
  supportMetricLabels,
  supportScopeLabel,
  supportScopeLabels,
  supportScopeTypes,
  type SupportAgent,
  type SupportCampaign,
  type SupportCampaignDraft,
  type SupportCampaignsResponse,
  type SupportMetricKey,
  type SupportPerformanceResponse,
  type SupportTeam
} from "../support-operations";
import "../support-operations.css";

function errorMessage(caught: unknown, fallback: string) {
  return caught instanceof Error ? caught.message : fallback;
}

export function SupportCampaignsView({ user }: { user: CurrentUser }) {
  const canManage = isSupportManager(user);
  const [items, setItems] = useState<SupportCampaign[] | null>(null);
  const [agents, setAgents] = useState<SupportAgent[]>([]);
  const [teams, setTeams] = useState<SupportTeam[]>([]);
  const [draft, setDraft] = useState<SupportCampaignDraft>(emptySupportCampaignDraft);
  const [filters, setFilters] = useState({ status: "", metric: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

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

  const filteredItems = useMemo(() => (items ?? []).filter((item) => {
    if (filters.status && item.status !== filters.status) return false;
    if (filters.metric && item.metric !== filters.metric) return false;
    return true;
  }), [filters, items]);
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
                const metric = event.target.value as SupportMetricKey;
                setDraft((current) => ({ ...current, metric, comparison: metric === "RECLAME_AQUI_OPEN" ? "LTE" : current.comparison }));
              }}>
                {supportMetricKeys.map((metric) => <option key={metric} value={metric}>{supportMetricLabels[metric]}</option>)}
              </select>
            </label>
            <label>Meta<input required min={0} max={draft.metric === "CSAT" || draft.metric === "SLA" ? 100 : undefined} step={draft.metric === "RECLAME_AQUI_OPEN" ? 1 : "any"} type="number" value={draft.targetValue} onChange={(event) => setDraft((current) => ({ ...current, targetValue: event.target.value }))} /></label>
            <fieldset className="support-segmented-field">
              <legend>Comparação</legend>
              <div>
                <label className={draft.comparison === "GTE" ? "active" : ""}><input type="radio" name="support-comparison" value="GTE" checked={draft.comparison === "GTE"} onChange={() => setDraft((current) => ({ ...current, comparison: "GTE" }))} /> ≥ Pelo menos</label>
                <label className={draft.comparison === "LTE" ? "active" : ""}><input type="radio" name="support-comparison" value="LTE" checked={draft.comparison === "LTE"} onChange={() => setDraft((current) => ({ ...current, comparison: "LTE" }))} /> ≤ No máximo</label>
              </div>
            </fieldset>
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
            <label>Status
              <select value={draft.status} onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value as SupportCampaignDraft["status"] }))}>
                {Object.entries(supportCampaignStatusLabels).map(([status, label]) => <option key={status} value={status}>{label}</option>)}
              </select>
            </label>
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
          </div>
        </div>
        {filteredItems.length ? (
          <div className="table-scroll">
            <table aria-label="Campanhas SAC">
              <thead><tr><th scope="col">Campanha</th><th scope="col">Métrica</th><th scope="col">Regra</th><th scope="col">Resultado</th><th scope="col">Escopo</th><th scope="col">Período</th><th scope="col">Status</th>{canManage ? <th scope="col">Ações</th> : null}</tr></thead>
              <tbody>{filteredItems.map((item) => (
                <tr key={item.id}>
                  <td><strong>{item.name}</strong>{item.description ? <small>{item.description}</small> : null}</td>
                  <td>{supportMetricLabels[item.metric]}</td>
                  <td><strong>{item.comparison === "GTE" ? "≥" : "≤"} {formatSupportMetricValue(item.metric, item.targetValue)}</strong></td>
                  <td className="support-campaign-result">
                    <strong>{formatSupportMetricValue(item.metric, item.result.current)}</strong>
                    <span className={`support-status ${item.result.current === null ? "draft" : item.result.achieved ? "active" : "paused"}`}>
                      {item.result.current === null ? "Sem medição" : item.result.achieved ? "Na meta" : "Abaixo da meta"}
                    </span>
                    <span className="support-progress" role="progressbar" aria-label={`Progresso de ${item.name}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(item.result.progressPercent)}>
                      <i style={{ width: `${item.result.progressPercent}%` }} />
                    </span>
                  </td>
                  <td>{supportScopeLabel(item)}</td>
                  <td>{formatSupportDate(item.startsAt)}<small>até {formatSupportDate(item.endsAt)}</small></td>
                  <td><span className={`support-status ${item.status.toLowerCase()}`}>{supportCampaignStatusLabels[item.status]}</span></td>
                  {canManage ? <td><button className="secondary small" type="button" onClick={() => { setDraft(supportCampaignDraftFromItem(item)); window.scrollTo({ top: 0, behavior: "smooth" }); }}><Pencil size={15} /> Editar</button></td> : null}
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : <OperationalState state="empty" title="Nenhuma campanha encontrada" detail={items.length ? "Ajuste os filtros para ampliar a busca." : "Ainda não há campanhas SAC cadastradas."} />}
      </section>
    </section>
  );
}
