import { Activity, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../../api";
import { OperationalState } from "../../components/operational";
import { keyboardTabIndex } from "../../accessibility/tabs";

interface ConnectorHealth {
  connectorDefinitionId: string; connectorId: string; displayName: string; state: string; lastRunAt: string | null;
  successRate24h: number | null; medianMs: number | null; p95Ms: number | null; version: string;
  lastSelectorDriftAt: string | null; lastLoginAt: string | null; lastCaptchaAt: string | null;
}
interface HealthResponse { generatedAt: string; targetsMs: Record<string, number>; connectors: ConnectorHealth[]; }
interface SuccessResponse {
  windowHours: number; dailyCases: number; medianReadyMs: number | null; clicks: number; typedCharacters: number; manualTabs: number;
  correctedFlows: number; reeditedMessages: number; copiedMessages: number; draftUses: number; resolvedWithoutChatGpt: number;
  estimatedTypingAvoided: number; estimatedMinutesSaved: number; connectors: Array<{ connectorId: string; total: number; successRate: number }>;
}
const date = (value: string | null) => value ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)) : "Sem registro";
const duration = (value: number | null) => value === null ? "-" : `${(value / 1000).toFixed(value < 1000 ? 2 : 1)} s`;
const percent = (value: number | null) => value === null ? "-" : `${Math.round(value * 100)}%`;
const healthTabs = [["health", "Saúde"], ["success", "Sucesso"]] as const;

export function CaseFlowHealthView() {
  const [tab, setTab] = useState<"health" | "success">("health");
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [success, setSuccess] = useState<SuccessResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  async function load() {
    setLoading(true); setError(null);
    try {
      const [nextHealth, nextSuccess] = await Promise.all([api<HealthResponse>("/v1/case-flow/connectors/health"), api<SuccessResponse>("/v1/case-flow/metrics/success")]);
      setHealth(nextHealth); setSuccess(nextSuccess);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Falha ao carregar métricas."); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);
  if (loading && !health) return <OperationalState state="loading" title="Carregando diagnóstico" detail="Consultando métricas redigidas do CaseFlow." />;
  if (error && !health) return <OperationalState state="error" title="Diagnóstico indisponível" detail={error} />;
  return <section className="caseflow-health-view">
    <div className="section-heading">
      <div><span className="eyebrow"><Activity size={14} /> CaseFlow</span><h1>Saúde operacional</h1><p>Métricas agregadas das últimas 24 horas.</p></div>
      <button className="icon-button" type="button" title="Atualizar métricas" aria-label="Atualizar métricas" onClick={() => void load()}><RefreshCw size={18} /></button>
    </div>
    <div className="segmented-control" role="tablist" aria-label="Visão de diagnóstico">
      {healthTabs.map(([key, label], index) => <button key={key} id={`caseflow-health-${key}-tab`} type="button" role="tab" className={tab === key ? "active" : ""} aria-controls={`caseflow-health-${key}-panel`} aria-selected={tab === key} tabIndex={tab === key ? 0 : -1} onClick={() => setTab(key)} onKeyDown={(event) => {
        const nextIndex = keyboardTabIndex(event.key, index, healthTabs.length);
        if (nextIndex === null) return;
        event.preventDefault();
        setTab(healthTabs[nextIndex][0]);
        event.currentTarget.parentElement?.querySelectorAll<HTMLElement>("[role=tab]")[nextIndex]?.focus();
      }}>{label}</button>)}
    </div>
    {tab === "health" ? <div id="caseflow-health-health-panel" role="tabpanel" aria-labelledby="caseflow-health-health-tab" className="table-panel"><div className="table-scroll"><table aria-label="Saúde dos conectores"><thead><tr><th scope="col">Conector</th><th scope="col">Estado</th><th scope="col">Última execução</th><th scope="col">Sucesso 24h</th><th scope="col">Mediana</th><th scope="col">P95</th><th scope="col">Versão</th><th scope="col">Drift / login / captcha</th></tr></thead><tbody>
      {health?.connectors.map((item) => <tr key={item.connectorDefinitionId}><td><strong>{item.displayName}</strong><small>{item.connectorId}</small></td><td><span className={`status-badge ${item.state === "HEALTHY" ? "active" : "inactive"}`}>{item.state}</span></td><td>{date(item.lastRunAt)}</td><td>{percent(item.successRate24h)}</td><td>{duration(item.medianMs)}</td><td>{duration(item.p95Ms)}</td><td>{item.version}</td><td><small>Drift: {date(item.lastSelectorDriftAt)}<br />Login: {date(item.lastLoginAt)}<br />Captcha: {date(item.lastCaptchaAt)}</small></td></tr>)}
    </tbody></table></div></div> : success ? <div id="caseflow-health-success-panel" role="tabpanel" aria-labelledby="caseflow-health-success-tab">
      <div className="metrics-grid caseflow-success-grid">
        <div className="metric-card"><span>Casos no dia</span><strong>{success.dailyCases}</strong></div><div className="metric-card"><span>Resposta pronta</span><strong>{duration(success.medianReadyMs)}</strong></div>
        <div className="metric-card"><span>Tempo estimado evitado</span><strong>{success.estimatedMinutesSaved} min</strong></div><div className="metric-card"><span>Digitação estimada evitada</span><strong>{success.estimatedTypingAvoided}</strong></div>
      </div>
      <div className="table-panel"><div className="table-scroll"><table aria-label="Eficiência operacional"><thead><tr><th scope="col">Cliques</th><th scope="col">Caracteres digitados</th><th scope="col">Abas manuais</th><th scope="col">Fluxos corrigidos</th><th scope="col">Mensagens reeditadas</th><th scope="col">Cópias / drafts</th><th scope="col">Sem ChatGPT</th></tr></thead><tbody><tr><td>{success.clicks}</td><td>{success.typedCharacters}</td><td>{success.manualTabs}</td><td>{success.correctedFlows}</td><td>{success.reeditedMessages}</td><td>{success.copiedMessages + success.draftUses}</td><td>{success.resolvedWithoutChatGpt}</td></tr></tbody></table></div></div>
      <div className="table-panel"><div className="table-scroll"><table aria-label="Sucesso por conector"><thead><tr><th scope="col">Conector</th><th scope="col">Execuções medidas</th><th scope="col">Taxa de sucesso</th></tr></thead><tbody>{success.connectors.map((item) => <tr key={item.connectorId}><td>{item.connectorId}</td><td>{item.total}</td><td>{percent(item.successRate)}</td></tr>)}</tbody></table></div></div>
    </div> : null}
  </section>;
}
