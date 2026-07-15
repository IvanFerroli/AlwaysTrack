import { useEffect, useState } from "react";
import { Download, RefreshCw, ShieldAlert, Upload } from "lucide-react";
import { api } from "../../../api";
import { keyboardTabIndex } from "../../../accessibility/tabs";

type Tab = "history" | "rules" | "connectors" | "backup";
type CaseItem = { id: string; status: string; summary: string | null; updatedAt: string; conflicts: Array<{ status: string }>; connectorRuns: Array<{ status: string }> };
type RuleItem = { id?: string; code?: string; version?: number; active?: boolean; priority?: number; flowId?: string };
type ConnectorItem = { id: string; connectorId: string; displayName: string; version: string; riskLevel: string; enabled: boolean; lastValidatedAt: string | null; health: { state: string; checkedAt: string } | null; domains: unknown[]; capabilities: unknown[] };
const adminTabs = [['history', 'Histórico'], ['rules', 'Regras'], ['connectors', 'Conectores'], ['backup', 'Backup']] as const;

export function CaseFlowAdminView() {
  const [tab, setTab] = useState<Tab>("history");
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [rules, setRules] = useState<RuleItem[]>([]);
  const [connectors, setConnectors] = useState<ConnectorItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [restoreText, setRestoreText] = useState("");
  const [notice, setNotice] = useState("");

  async function load() {
    setBusy(true); setError("");
    try {
      const [history, ruleData, connectorData] = await Promise.all([
        api<{ items: CaseItem[] }>("/v1/case-flow/admin/cases"),
        api<{ latest: RuleItem[] }>("/v1/case-flow/admin/rules"),
        api<ConnectorItem[]>("/v1/case-flow/admin/connectors")
      ]);
      setCases(history.items); setRules(ruleData.latest); setConnectors(connectorData);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Falha ao carregar administração CaseFlow."); }
    finally { setBusy(false); }
  }
  useEffect(() => { void load(); }, []);

  async function setHealth(item: ConnectorItem, healthState: "HEALTHY" | "DEGRADED" | "UNAVAILABLE") {
    setBusy(true); setError("");
    try { await api(`/v1/case-flow/admin/connectors/${item.id}`, { method: "PATCH", body: JSON.stringify({ healthState, validated: true }) }); await load(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Falha ao atualizar conector."); setBusy(false); }
  }
  async function downloadBackup() {
    const envelope = await api<Record<string, unknown>>("/v1/case-flow/admin/config/export");
    const url = URL.createObjectURL(new Blob([JSON.stringify(envelope, null, 2)], { type: "application/json" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = `caseflow-config-${new Date().toISOString().slice(0, 10)}.json`; anchor.click(); URL.revokeObjectURL(url);
  }
  async function restore() {
    setBusy(true); setError(""); setNotice("");
    try { const envelope: unknown = JSON.parse(restoreText); const result = await api<{ mode: string; restoreId: string }>("/v1/case-flow/admin/config/restore", { method: "POST", body: JSON.stringify(envelope) }); setNotice(`Restore ${result.mode.toLowerCase()} registrado: ${result.restoreId}`); setRestoreText(""); await load(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Backup inválido."); setBusy(false); }
  }

  return <section className="caseflow-admin">
    <div className="caseflow-admin-toolbar">
      <div className="segmented-control" role="tablist" aria-label="Administração CaseFlow">
        {adminTabs.map(([key, label], index) => <button key={key} id={`caseflow-admin-${key}-tab`} className={tab === key ? "active" : "secondary"} type="button" role="tab" aria-controls={`caseflow-admin-${key}-panel`} aria-selected={tab === key} tabIndex={tab === key ? 0 : -1} onClick={() => setTab(key)} onKeyDown={(event) => {
          const nextIndex = keyboardTabIndex(event.key, index, adminTabs.length);
          if (nextIndex === null) return;
          event.preventDefault();
          setTab(adminTabs[nextIndex][0]);
          (event.currentTarget.parentElement?.querySelectorAll<HTMLElement>("[role=tab]")[nextIndex])?.focus();
        }}>{label}</button>)}
      </div>
      <button className="secondary" type="button" title="Atualizar dados" aria-label="Atualizar dados" disabled={busy} onClick={() => void load()}><RefreshCw /></button>
    </div>
    {error ? <p className="error" role="alert"><ShieldAlert aria-hidden="true" /> {error}</p> : null}{notice ? <p className="success-message" role="status">{notice}</p> : null}
    {tab === "history" ? <div id="caseflow-admin-history-panel" role="tabpanel" aria-labelledby="caseflow-admin-history-tab" className="table-wrap"><table aria-label="Histórico de casos"><thead><tr><th scope="col">Caso</th><th scope="col">Status</th><th scope="col">Resumo mascarado</th><th scope="col">Conflitos</th><th scope="col">Execuções</th><th scope="col">Atualizado</th></tr></thead><tbody>{cases.map((item) => <tr key={item.id}><td><code>{item.id}</code></td><td>{item.status}</td><td>{item.summary || "Sem resumo"}</td><td>{item.conflicts.filter((entry) => entry.status === "OPEN").length}</td><td>{item.connectorRuns.length}</td><td>{new Date(item.updatedAt).toLocaleString("pt-BR")}</td></tr>)}</tbody></table></div> : null}
    {tab === "rules" ? <div id="caseflow-admin-rules-panel" role="tabpanel" aria-labelledby="caseflow-admin-rules-tab" className="table-wrap"><table aria-label="Regras CaseFlow"><thead><tr><th scope="col">Código</th><th scope="col">Versão</th><th scope="col">Fluxo</th><th scope="col">Prioridade</th><th scope="col">Estado</th></tr></thead><tbody>{rules.map((item, index) => <tr key={`${item.code}-${item.version}-${index}`}><td>{item.code}</td><td>{item.version}</td><td>{item.flowId}</td><td>{item.priority}</td><td>{item.active ? "Ativa" : "Inativa"}</td></tr>)}</tbody></table></div> : null}
    {tab === "connectors" ? <div id="caseflow-admin-connectors-panel" role="tabpanel" aria-labelledby="caseflow-admin-connectors-tab" className="table-wrap"><table aria-label="Conectores CaseFlow"><thead><tr><th scope="col">Sistema</th><th scope="col">Versão</th><th scope="col">Risco</th><th scope="col">Health</th><th scope="col">Última validação</th><th scope="col">Ações</th></tr></thead><tbody>{connectors.map((item) => <tr key={item.id}><td><strong>{item.displayName}</strong><br/><small>{item.connectorId}</small></td><td>{item.version}</td><td>{item.riskLevel}</td><td>{item.health?.state ?? "UNKNOWN"}</td><td>{item.lastValidatedAt ? new Date(item.lastValidatedAt).toLocaleString("pt-BR") : "Nunca"}</td><td><select aria-label={`Estado de ${item.displayName}`} value={item.health?.state ?? ""} disabled={busy} onChange={(event) => void setHealth(item, event.target.value as "HEALTHY" | "DEGRADED" | "UNAVAILABLE")}><option value="" disabled>Marcar estado</option><option value="HEALTHY">Saudável</option><option value="DEGRADED">Degradado</option><option value="UNAVAILABLE">Indisponível</option></select></td></tr>)}</tbody></table></div> : null}
    {tab === "backup" ? <div id="caseflow-admin-backup-panel" role="tabpanel" aria-labelledby="caseflow-admin-backup-tab" className="caseflow-backup-layout"><section><h2>Exportar configuração</h2><p className="muted">Regras, versões de fluxo e definições declarativas. Instalações, cookies e credenciais ficam de fora.</p><button type="button" onClick={() => void downloadBackup()}><Download aria-hidden="true" /> Exportar JSON</button></section><section><h2>Restore aditivo</h2><textarea rows={12} value={restoreText} onChange={(event) => setRestoreText(event.target.value)} placeholder="Cole o envelope JSON exportado" aria-label="Envelope de backup"/><button type="button" disabled={busy || !restoreText.trim()} onClick={() => void restore()}><Upload aria-hidden="true" /> Criar novas versões</button></section></div> : null}
  </section>;
}
