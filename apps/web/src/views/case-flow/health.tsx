import { Activity, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../../api";
import { OperationalState } from "../../components/operational";

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
      <button type="button" className={tab === "health" ? "active" : ""} onClick={() => setTab("health")}>Saúde</button>
      <button type="button" className={tab === "success" ? "active" : ""} onClick={() => setTab("success")}>Sucesso</button>
    </div>
    {tab === "health" ? <div className="table-panel"><div className="table-scroll"><table><thead><tr><th>Conector</th><th>Estado</th><th>Última execução</th><th>Sucesso 24h</th><th>Mediana</th><th>P95</th><th>Versão</th><th>Drift / login / captcha</th></tr></thead><tbody>
      {health?.connectors.map((item) => <tr key={item.connectorDefinitionId}><td><strong>{item.displayName}</strong><small>{item.connectorId}</small></td><td><span className={`status-badge ${item.state === "HEALTHY" ? "active" : "inactive"}`}>{item.state}</span></td><td>{date(item.lastRunAt)}</td><td>{percent(item.successRate24h)}</td><td>{duration(item.medianMs)}</td><td>{duration(item.p95Ms)}</td><td>{item.version}</td><td><small>Drift: {date(item.lastSelectorDriftAt)}<br />Login: {date(item.lastLoginAt)}<br />Captcha: {date(item.lastCaptchaAt)}</small></td></tr>)}
    </tbody></table></div></div> : success ? <>
      <div className="metrics-grid caseflow-success-grid">
        <div className="metric-card"><span>Casos no dia</span><strong>{success.dailyCases}</strong></div><div className="metric-card"><span>Resposta pronta</span><strong>{duration(success.medianReadyMs)}</strong></div>
        <div className="metric-card"><span>Tempo estimado evitado</span><strong>{success.estimatedMinutesSaved} min</strong></div><div className="metric-card"><span>Digitação estimada evitada</span><strong>{success.estimatedTypingAvoided}</strong></div>
      </div>
      <div className="table-panel"><div className="table-scroll"><table><thead><tr><th>Cliques</th><th>Caracteres digitados</th><th>Abas manuais</th><th>Fluxos corrigidos</th><th>Mensagens reeditadas</th><th>Cópias / drafts</th><th>Sem ChatGPT</th></tr></thead><tbody><tr><td>{success.clicks}</td><td>{success.typedCharacters}</td><td>{success.manualTabs}</td><td>{success.correctedFlows}</td><td>{success.reeditedMessages}</td><td>{success.copiedMessages + success.draftUses}</td><td>{success.resolvedWithoutChatGpt}</td></tr></tbody></table></div></div>
      <div className="table-panel"><div className="table-scroll"><table><thead><tr><th>Conector</th><th>Execuções medidas</th><th>Taxa de sucesso</th></tr></thead><tbody>{success.connectors.map((item) => <tr key={item.connectorId}><td>{item.connectorId}</td><td>{item.total}</td><td>{percent(item.successRate)}</td></tr>)}</tbody></table></div></div>
    </> : null}
  </section>;
}
