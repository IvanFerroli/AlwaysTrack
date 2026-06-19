import { Check, Clipboard, GitBranch, Plus } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { commercialManagerRoles, type CurrentUser } from "@alwaystrack/shared";
import { api, uploadOperationalImage } from "../api";
import { MarkdownContent, MarkdownEditor } from "../components/markdown-editor";
import { OperationalFilters, OperationalState } from "../components/operational";
import { formatDateBr } from "../sales";

interface FlowScript {
  id: string;
  title: string;
  channel: string;
  body: string;
  tags?: string[];
  placeholders?: string[];
  status: string;
  usageCount: number;
}

interface ServiceFlowStepScript {
  id: string;
  script: FlowScript;
}

interface ServiceFlowStep {
  id: string;
  title: string;
  body: string | null;
  kind: string;
  decision?: Record<string, unknown> | null;
  order: number;
  required: boolean;
  collapsed: boolean;
  scripts: ServiceFlowStepScript[];
}

interface ServiceFlowItem {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  content: string | null;
  tags?: string[];
  status: string;
  priority: number;
  version: number;
  reviewComment: string | null;
  reviewDueAt: string | null;
  reviewedAt: string | null;
  reviewedBy: { id: string; name: string; role: string } | null;
  wikiPage: { id: string; slug: string; title: string } | null;
  steps: ServiceFlowStep[];
  revisions?: Array<{ id: string; version: number; title: string; status: string; comment: string | null; createdAt: string; author: { id: string; name: string; role: string } }>;
}

interface ScriptLibraryResponse {
  scripts: FlowScript[];
}

interface PersonalScriptItem {
  id: string;
  title: string;
  channel: string;
  body: string;
  tags?: string[];
  placeholders?: string[];
  suggestedAt: string | null;
  flows: Array<{ id: string; slug: string; title: string; status: string }>;
  suggestion: { id: string; status: string; createdScriptId: string | null } | null;
}

interface PersonalScriptsResponse {
  items: PersonalScriptItem[];
}

interface ServiceFlowsResponse {
  items: ServiceFlowItem[];
  canManage: boolean;
}

interface ServiceFlowMetrics {
  summary: { totalFlows: number; publishedFlows: number; reviewDue: number; openSessions: number };
  mostUsedFlows: Array<{ flowId: string; title: string; sessions: number }>;
  stepBottlenecks: Array<{ stepId: string; stepTitle: string; flowTitle: string; status: string; count: number }>;
  topScriptsByFlow: Array<{ id: string; title: string; count: number }>;
  zeroSearches: Array<{ id: string; query: string | null; filtersJson: string | null; createdAt: string }>;
}

interface ServiceFlowSession {
  id: string;
  status: string;
  startedAt: string;
  completedAt: string | null;
  flow: { id: string; slug: string; title: string };
  steps: Array<{
    id: string;
    stepId: string;
    status: string;
    decision: string | null;
    note: string | null;
    completedAt: string | null;
    step: { id: string; title: string; order: number; required: boolean };
  }>;
}

const flowStatuses = [
  { value: "PUBLISHED", label: "Publicado" },
  { value: "DRAFT", label: "Rascunho" },
  { value: "ARCHIVED", label: "Arquivado" }
];

const stepKinds = [
  { value: "MANUAL", label: "Manual" },
  { value: "YES_NO", label: "Sim/Não" },
  { value: "CHECKLIST", label: "Checklist" },
  { value: "DECISION", label: "Decisão" }
];

interface StepDraft {
  title: string;
  body: string;
  kind: string;
  scriptIds: string[];
  yesLabel: string;
  noLabel: string;
  options: string;
}

function emptyStepDraft(): StepDraft {
  return { title: "", body: "", kind: "MANUAL", scriptIds: [], yesLabel: "", noLabel: "", options: "" };
}

function parseTags(value: string) {
  return [...new Set(value.split(",").map((tag) => tag.trim().replace(/^#/, "").toLowerCase()).filter(Boolean))].sort();
}

function renderScript(body: string, values: Record<string, string>) {
  return body.replace(/\{([a-zA-Z0-9_.-]+)\}/g, (_, key: string) => values[key] || `{${key}}`);
}

function optionsFromDecision(decision: Record<string, unknown> | null | undefined) {
  if (!decision) return [];
  if (Array.isArray(decision.options)) return decision.options.filter((item): item is string => typeof item === "string");
  return Object.entries(decision).map(([key, value]) => `${key}: ${String(value)}`);
}

function decisionPayload(step: StepDraft) {
  if (step.kind === "YES_NO") {
    return {
      yes: step.yesLabel || "Seguir para a próxima etapa.",
      no: step.noLabel || "Revisar manualmente antes de seguir."
    };
  }
  if (step.kind === "DECISION" || step.kind === "CHECKLIST") {
    const options = parseTags(step.options).map((item) => item.replace(/-/g, " "));
    return options.length ? { options } : null;
  }
  return null;
}

function wordsFor(value: string) {
  return new Set(
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((item) => item.length >= 3)
  );
}

export function ServiceFlowsView({ user }: { user: CurrentUser }) {
  const [flows, setFlows] = useState<ServiceFlowItem[]>([]);
  const [scripts, setScripts] = useState<FlowScript[]>([]);
  const [personalScripts, setPersonalScripts] = useState<PersonalScriptItem[]>([]);
  const [metrics, setMetrics] = useState<ServiceFlowMetrics | null>(null);
  const [selectedId, setSelectedId] = useState("");
  const [flowPickerQuery, setFlowPickerQuery] = useState("");
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState("");
  const [status, setStatus] = useState("");
  const [openSteps, setOpenSteps] = useState<Record<string, boolean>>({});
  const [placeholderValues, setPlaceholderValues] = useState<Record<string, Record<string, string>>>({});
  const [activeSession, setActiveSession] = useState<ServiceFlowSession | null>(null);
  const [stepNotes, setStepNotes] = useState<Record<string, string>>({});
  const [stepDecisions, setStepDecisions] = useState<Record<string, string>>({});
  const [copyFeedback, setCopyFeedback] = useState("");
  const [flowDraft, setFlowDraft] = useState({ title: "", summary: "", content: "", tags: "", status: "PUBLISHED" });
  const [governanceDraft, setGovernanceDraft] = useState({ comment: "", reviewDueAt: "" });
  const [personalDraft, setPersonalDraft] = useState({ title: "", channel: "WHATSAPP", body: "", tags: "", flowIds: [] as string[] });
  const [stepDrafts, setStepDrafts] = useState<StepDraft[]>([emptyStepDraft()]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canManage = (commercialManagerRoles as readonly string[]).includes(user.role);
  const selected = flows.find((flow) => flow.id === selectedId) ?? flows[0] ?? null;
  const tags = useMemo(() => [...new Set(flows.flatMap((flow) => flow.tags ?? []))].sort(), [flows]);
  const selectableFlows = useMemo(() => {
    const needle = flowPickerQuery.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
    if (!needle) return flows;
    return flows.filter((flow) => `${flow.title} ${flow.summary ?? ""} ${flow.tags?.join(" ") ?? ""}`.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().includes(needle));
  }, [flowPickerQuery, flows]);
  const visiblePersonalScripts = useMemo(() => personalScripts.filter((script) => !selected || script.flows.length === 0 || script.flows.some((flow) => flow.id === selected.id)), [personalScripts, selected]);

  async function load(nextSelectedId = selectedId) {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (query) params.set("query", query);
    if (tag) params.set("tag", tag);
    if (status) params.set("status", status);
    try {
      const [flowResult, scriptResult] = await Promise.all([
        api<ServiceFlowsResponse>(`/v1/service-flows?${params.toString()}`),
        api<ScriptLibraryResponse>("/v1/script-library")
      ]);
      const personalResult = await api<PersonalScriptsResponse>("/v1/script-library/personal-scripts").catch(() => ({ items: [] }));
      setFlows(flowResult.items);
      setScripts(scriptResult.scripts.filter((script) => script.status !== "OBSOLETE"));
      setPersonalScripts(personalResult.items);
      const next = nextSelectedId && flowResult.items.some((flow) => flow.id === nextSelectedId) ? nextSelectedId : flowResult.items[0]?.id ?? "";
      setSelectedId(next);
      setOpenSteps(Object.fromEntries((flowResult.items.find((flow) => flow.id === next)?.steps ?? flowResult.items[0]?.steps ?? []).map((step, index) => [step.id, index === 0])));
      if (canManage) {
        const metricResult = await api<ServiceFlowMetrics>("/v1/service-flows/metrics/summary").catch(() => null);
        setMetrics(metricResult);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Falha ao carregar fluxos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load("");
  }, [tag, status]);

  useEffect(() => {
    setActiveSession(null);
    setStepNotes({});
    setStepDecisions({});
    setPersonalDraft((current) => ({ ...current, flowIds: selectedId ? [selectedId] : [] }));
  }, [selectedId]);

  async function copyScript(script: FlowScript) {
    const rendered = renderScript(script.body, placeholderValues[script.id] ?? {});
    try {
      await navigator.clipboard.writeText(rendered);
      setCopyFeedback(script.id);
    } catch {
      setCopyFeedback("");
    }
    await api(`/v1/script-library/scripts/${script.id}/copy`, {
      method: "POST",
      body: JSON.stringify({ renderedText: rendered, placeholders: placeholderValues[script.id] ?? {}, serviceFlowSessionId: activeSession?.id ?? null })
    }).catch(() => null);
    window.setTimeout(() => setCopyFeedback(""), 1600);
  }

  async function copyPersonalScript(script: PersonalScriptItem) {
    const key = `personal:${script.id}`;
    const rendered = renderScript(script.body, placeholderValues[key] ?? {});
    try {
      await navigator.clipboard.writeText(rendered);
      setCopyFeedback(key);
    } catch {
      setCopyFeedback("");
    }
    window.setTimeout(() => setCopyFeedback(""), 1600);
  }

  async function startSession() {
    if (!selected) return;
    setSaving(true);
    setError(null);
    try {
      const result = await api<{ session: ServiceFlowSession }>(`/v1/service-flows/${selected.id}/sessions`, { method: "POST" });
      setActiveSession(result.session);
      setStepNotes(Object.fromEntries(result.session.steps.map((step) => [step.stepId, step.note ?? ""])));
      setStepDecisions(Object.fromEntries(result.session.steps.map((step) => [step.stepId, step.decision ?? ""])));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Falha ao iniciar atendimento.");
    } finally {
      setSaving(false);
    }
  }

  async function saveSessionStep(stepId: string, statusValue: "DONE" | "SKIPPED" | "PENDING") {
    if (!activeSession) return;
    setSaving(true);
    setError(null);
    try {
      const result = await api<{ session: ServiceFlowSession }>(`/v1/service-flow-sessions/${activeSession.id}/steps/${stepId}`, {
        method: "POST",
        body: JSON.stringify({ status: statusValue, decision: stepDecisions[stepId] || null, note: stepNotes[stepId] || null })
      });
      setActiveSession(result.session);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Falha ao registrar etapa.");
    } finally {
      setSaving(false);
    }
  }

  async function completeSession() {
    if (!activeSession) return;
    setSaving(true);
    setError(null);
    try {
      const result = await api<{ session: ServiceFlowSession }>(`/v1/service-flow-sessions/${activeSession.id}/complete`, { method: "POST" });
      setActiveSession(result.session);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Falha ao finalizar atendimento.");
    } finally {
      setSaving(false);
    }
  }

  async function decideFlow(action: "publish" | "archive") {
    if (!selected) return;
    setSaving(true);
    setError(null);
    try {
      const result = await api<{ flow: ServiceFlowItem }>(`/v1/service-flows/${selected.id}/${action}`, {
        method: "POST",
        body: JSON.stringify({ comment: governanceDraft.comment, reviewDueAt: governanceDraft.reviewDueAt || null })
      });
      setGovernanceDraft({ comment: "", reviewDueAt: "" });
      await load(result.flow.id);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Falha na governança do fluxo.");
    } finally {
      setSaving(false);
    }
  }

  async function createPersonalScript(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api("/v1/script-library/personal-scripts", {
        method: "POST",
        body: JSON.stringify({
          ...personalDraft,
          tags: parseTags(personalDraft.tags),
          flowIds: personalDraft.flowIds
        })
      });
      setPersonalDraft({ title: "", channel: "WHATSAPP", body: "", tags: "", flowIds: selected ? [selected.id] : [] });
      const result = await api<PersonalScriptsResponse>("/v1/script-library/personal-scripts");
      setPersonalScripts(result.items);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Falha ao salvar script pessoal.");
    } finally {
      setSaving(false);
    }
  }

  async function suggestPersonalScript(scriptId: string) {
    setSaving(true);
    setError(null);
    try {
      await api(`/v1/script-library/personal-scripts/${scriptId}/suggest`, { method: "POST" });
      const result = await api<PersonalScriptsResponse>("/v1/script-library/personal-scripts");
      setPersonalScripts(result.items);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Falha ao sugerir script pessoal.");
    } finally {
      setSaving(false);
    }
  }

  function updateStep(index: number, patch: Partial<StepDraft>) {
    setStepDrafts((current) => current.map((step, currentIndex) => currentIndex === index ? { ...step, ...patch } : step));
  }

  function recommendedScriptsFor(step: StepDraft) {
    const flowTagSet = new Set(parseTags(flowDraft.tags));
    const stepWords = wordsFor(`${step.title} ${step.body}`);
    return scripts
      .map((script) => {
        const tagScore = (script.tags ?? []).filter((item) => flowTagSet.has(item) || stepWords.has(item)).length * 3;
        const titleScore = [...stepWords].filter((word) => script.title.toLowerCase().includes(word) || script.body.toLowerCase().includes(word)).length;
        const usageScore = Math.min(script.usageCount, 5) / 5;
        return { script, score: tagScore + titleScore + usageScore };
      })
      .filter((item) => item.score > 0 && !step.scriptIds.includes(item.script.id))
      .sort((left, right) => right.score - left.score)
      .slice(0, 5)
      .map((item) => item.script);
  }

  async function createFlow(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        ...flowDraft,
        tags: parseTags(flowDraft.tags),
        steps: stepDrafts.filter((step) => step.title.trim()).map((step, index) => ({
          title: step.title,
          body: step.body || null,
          kind: step.kind,
          order: index + 1,
          required: index === 0,
          decision: decisionPayload(step),
          scriptIds: step.scriptIds
        }))
      };
      const result = await api<{ flow: ServiceFlowItem }>("/v1/service-flows", { method: "POST", body: JSON.stringify(payload) });
      setFlowDraft({ title: "", summary: "", content: "", tags: "", status: "PUBLISHED" });
      setStepDrafts([emptyStepDraft()]);
      await load(result.flow.id);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Falha ao criar fluxo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="content-stack service-flow-view">
      <OperationalFilters
        fields={[
          { key: "query", label: "Busca", value: query, placeholder: "Título, texto ou tag", onChange: setQuery },
          { key: "tag", label: "Tag", value: tag, type: "select", placeholder: "Todas", options: tags.map((item) => ({ value: item, label: `#${item}` })), onChange: setTag },
          ...(canManage ? [{ key: "status", label: "Status", value: status, type: "select" as const, placeholder: "Todos", options: flowStatuses, onChange: setStatus }] : [])
        ]}
        onSubmit={() => void load("")}
      />
      {error ? <OperationalState state="error" title="Falha nos fluxos" detail={error} /> : null}
      {canManage && metrics ? (
        <section className="panel service-flow-metrics-panel">
          <div>
            <p className="eyebrow">Governança</p>
            <h2>Uso dos fluxos</h2>
          </div>
          <div className="script-metrics-grid">
            <div className="script-metric-card"><span>Fluxos publicados</span><strong>{metrics.summary.publishedFlows}/{metrics.summary.totalFlows}</strong></div>
            <div className="script-metric-card"><span>Revisão vencida</span><strong>{metrics.summary.reviewDue}</strong></div>
            <div className="script-metric-card"><span>Sessões abertas</span><strong>{metrics.summary.openSessions}</strong></div>
          </div>
          <div className="script-metrics-columns">
            <div className="script-metric-list">
              <h3>Mais usados</h3>
              <div>
                {metrics.mostUsedFlows.map((item) => <span key={item.flowId}><strong>{item.title}</strong><small>{item.sessions} sessão(ões)</small></span>)}
                {metrics.mostUsedFlows.length ? null : <span className="muted">Sem sessões registradas.</span>}
              </div>
            </div>
            <div className="script-metric-list">
              <h3>Etapas com pendência</h3>
              <div>
                {metrics.stepBottlenecks.map((item) => <span key={`${item.stepId}-${item.status}`}><strong>{item.stepTitle}</strong><small>{item.status} / {item.count}</small></span>)}
                {metrics.stepBottlenecks.length ? null : <span className="muted">Sem gargalos recentes.</span>}
              </div>
            </div>
            <div className="script-metric-list">
              <h3>Scripts em fluxo</h3>
              <div>
                {metrics.topScriptsByFlow.map((item) => <span key={item.id}><strong>{item.title}</strong><small>{item.count} cópia(s)</small></span>)}
                {metrics.topScriptsByFlow.length ? null : <span className="muted">Sem cópias vinculadas a fluxo.</span>}
              </div>
            </div>
            <div className="script-metric-list">
              <h3>Buscas sem fluxo</h3>
              <div>
                {metrics.zeroSearches.map((item) => <span key={item.id}><strong>{item.query || "Filtro vazio"}</strong><small>{formatDateBr(item.createdAt)}</small></span>)}
                {metrics.zeroSearches.length ? null : <span className="muted">Sem lacunas de busca.</span>}
              </div>
            </div>
          </div>
        </section>
      ) : null}
      <div className="service-flow-layout">
        <section className="panel table-panel">
          <div className="table-panel-toolbar">
            <div>
              <p className="eyebrow">Fluxos</p>
              <h2>Tipos de atendimento</h2>
            </div>
          </div>
          {loading ? <OperationalState state="loading" title="Carregando fluxos" /> : null}
          <div className="service-flow-picker">
            <label>
              Buscar fluxo
              <input value={flowPickerQuery} onChange={(event) => setFlowPickerQuery(event.target.value)} placeholder="Digite parte do atendimento, tag ou contexto" />
            </label>
            <label>
              Selecionar fluxo
              <select
                value={selected?.id ?? ""}
                onChange={(event) => {
                  const flow = flows.find((item) => item.id === event.target.value);
                  setSelectedId(event.target.value);
                  setOpenSteps(Object.fromEntries((flow?.steps ?? []).map((step, index) => [step.id, index === 0])));
                  setPersonalDraft((current) => ({ ...current, flowIds: event.target.value ? [event.target.value] : [] }));
                }}
              >
                {selectableFlows.map((flow) => <option key={flow.id} value={flow.id}>{flow.title} · {flow.status}</option>)}
              </select>
            </label>
            {selected ? (
              <div className="service-flow-picker-summary">
                <strong>{selected.title}</strong>
                {selected.summary ? <span>{selected.summary}</span> : null}
                <small>{selected.steps.length} etapa(s) · v{selected.version}</small>
              </div>
            ) : null}
            {!loading && flows.length === 0 ? <OperationalState state="empty" title="Nenhum fluxo encontrado" detail="Cadastre um fluxo para guiar atendimentos recorrentes." /> : null}
          </div>
        </section>
        <section className="panel service-flow-runner">
          {selected ? (
            <>
              <div className="detail-header">
                <div>
                  <p className="eyebrow">/{selected.slug}</p>
                  <h2>{selected.title}</h2>
                  <p className="muted">
                    v{selected.version} · {selected.status}
                    {selected.reviewedBy ? ` · validado por ${selected.reviewedBy.name}` : ""}
                    {selected.reviewDueAt ? ` · revisar até ${formatDateBr(selected.reviewDueAt)}` : ""}
                  </p>
                  {selected.summary ? <p className="muted">{selected.summary}</p> : null}
                </div>
                <div className="row-actions">
                  {activeSession ? <span className="status-pill">{activeSession.status === "COMPLETED" ? "Atendimento finalizado" : "Atendimento em andamento"}</span> : null}
                  {selected.wikiPage ? <button className="secondary" type="button" onClick={() => window.location.assign(`/wiki/${selected.wikiPage!.slug}`)}>Abrir Wiki</button> : null}
                  {activeSession?.status === "OPEN" ? <button type="button" disabled={saving} onClick={() => void completeSession()}>Finalizar</button> : <button type="button" disabled={saving} onClick={() => void startSession()}>Iniciar atendimento</button>}
                </div>
              </div>
              {selected.content ? <MarkdownContent content={selected.content} /> : null}
              {canManage ? (
                <div className="service-flow-governance-box">
                  <div>
                    <h3>Governança do fluxo</h3>
                    <p className="muted">{selected.reviewComment || "Sem comentário de aprovação/arquivamento."}</p>
                  </div>
                  <div className="form-grid">
                    <label>Comentário obrigatório<input value={governanceDraft.comment} onChange={(event) => setGovernanceDraft((current) => ({ ...current, comment: event.target.value }))} placeholder="O que mudou ou por que arquivar/publicar?" /></label>
                    <label>Revisar até<input type="date" value={governanceDraft.reviewDueAt} onChange={(event) => setGovernanceDraft((current) => ({ ...current, reviewDueAt: event.target.value }))} /></label>
                  </div>
                  <div className="row-actions">
                    <button type="button" disabled={saving || !governanceDraft.comment.trim()} onClick={() => void decideFlow("publish")}>Publicar versão</button>
                    <button className="secondary" type="button" disabled={saving || !governanceDraft.comment.trim()} onClick={() => void decideFlow("archive")}>Arquivar</button>
                  </div>
                  {selected.revisions?.length ? (
                    <div className="script-history-list">
                      {selected.revisions.map((revision) => (
                        <div className="script-history-item" key={revision.id}>
                          <div>
                            <strong>v{revision.version} / {revision.status}</strong>
                            <span>{revision.author.name} em {formatDateBr(revision.createdAt)}{revision.comment ? ` / ${revision.comment}` : ""}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}
              <div className="service-flow-steps">
                {selected.steps.map((step, index) => {
                  const expanded = openSteps[step.id] ?? index === 0;
                  const sessionStep = activeSession?.steps.find((item) => item.stepId === step.id);
                  return (
                    <article className={sessionStep?.status === "DONE" ? "service-flow-step completed" : "service-flow-step"} key={step.id}>
                      <button className="service-flow-step-header" type="button" onClick={() => setOpenSteps((current) => ({ ...current, [step.id]: !expanded }))}>
                        <span>{index + 1}</span>
                        <strong>{step.title}</strong>
                        <small>{sessionStep ? `${sessionStep.status} · ` : ""}{step.kind}{step.required ? " · obrigatório" : ""}</small>
                      </button>
                      {expanded ? (
                        <div className="service-flow-step-body">
                          {step.body ? <p>{step.body}</p> : null}
                          {optionsFromDecision(step.decision).length ? (
                            <div className="service-flow-decision">
                              <GitBranch size={16} aria-hidden="true" />
                              {optionsFromDecision(step.decision).map((option) => <span key={option}>{option}</span>)}
                            </div>
                          ) : null}
                          {step.scripts.length ? (
                            <div className="service-flow-script-list">
                              {step.scripts.map(({ script }) => (
                                <div className="service-flow-script-card" key={script.id}>
                                  <div>
                                    <strong>{script.title}</strong>
                                    <small>{script.channel} · {script.usageCount} copia(s)</small>
                                  </div>
                                  {script.placeholders?.length ? (
                                    <div className="script-placeholder-grid">
                                      {script.placeholders.map((placeholder) => (
                                        <label key={placeholder}>
                                          {placeholder}
                                          <input value={placeholderValues[script.id]?.[placeholder] ?? ""} onChange={(event) => setPlaceholderValues((current) => ({ ...current, [script.id]: { ...(current[script.id] ?? {}), [placeholder]: event.target.value } }))} />
                                        </label>
                                      ))}
                                    </div>
                                  ) : null}
                                  <div className="script-preview">
                                    <MarkdownContent content={renderScript(script.body, placeholderValues[script.id] ?? {})} />
                                  </div>
                                  <button className={copyFeedback === script.id ? "script-copy-button copied" : "script-copy-button"} type="button" onClick={() => void copyScript(script)} title="Copiar script">
                                    {copyFeedback === script.id ? <Check size={18} aria-hidden="true" /> : <Clipboard size={18} aria-hidden="true" />}
                                    <span className="sr-only">Copiar script</span>
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : <p className="muted">Sem script relacionado nesta etapa.</p>}
                          {activeSession ? (
                            <div className="service-flow-session-box">
                              <label>
                                Decisão tomada
                                <input value={stepDecisions[step.id] ?? ""} onChange={(event) => setStepDecisions((current) => ({ ...current, [step.id]: event.target.value }))} placeholder="Ex.: reversa, troca, estorno, escalado" />
                              </label>
                              <label>
                                Nota interna
                                <textarea rows={3} value={stepNotes[step.id] ?? ""} onChange={(event) => setStepNotes((current) => ({ ...current, [step.id]: event.target.value }))} placeholder="Registre o contexto para auditoria do atendimento." />
                              </label>
                              <div className="row-actions">
                                <button className="secondary" type="button" disabled={saving || activeSession.status === "COMPLETED"} onClick={() => void saveSessionStep(step.id, "PENDING")}>Reabrir</button>
                                <button className="secondary" type="button" disabled={saving || activeSession.status === "COMPLETED"} onClick={() => void saveSessionStep(step.id, "SKIPPED")}>Pular</button>
                                <button type="button" disabled={saving || activeSession.status === "COMPLETED"} onClick={() => void saveSessionStep(step.id, "DONE")}>Concluir etapa</button>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </article>
                  );
                })}
              </div>
              <div className="service-flow-personal-scripts">
                <div>
                  <p className="eyebrow">Privado</p>
                  <h3>Meus scripts</h3>
                  <p className="muted">Textos pessoais aparecem só para você e podem ser sugeridos para virar canon da Scriptoteca.</p>
                </div>
                <div className="service-flow-script-list">
                  {visiblePersonalScripts.map((script) => {
                    const key = `personal:${script.id}`;
                    return (
                      <div className="service-flow-script-card" key={script.id}>
                        <div>
                          <strong>{script.title}</strong>
                          <small>{script.channel} · {script.flows.length ? script.flows.map((flow) => flow.title).join(", ") : "sem fluxo fixo"}</small>
                        </div>
                        {script.placeholders?.length ? (
                          <div className="script-placeholder-grid">
                            {script.placeholders.map((placeholder) => (
                              <label key={placeholder}>
                                {placeholder}
                                <input value={placeholderValues[key]?.[placeholder] ?? ""} onChange={(event) => setPlaceholderValues((current) => ({ ...current, [key]: { ...(current[key] ?? {}), [placeholder]: event.target.value } }))} />
                              </label>
                            ))}
                          </div>
                        ) : null}
                        <div className="script-preview">
                          <MarkdownContent content={renderScript(script.body, placeholderValues[key] ?? {})} />
                        </div>
                        <div className="row-actions">
                          <button className={copyFeedback === key ? "script-copy-button copied" : "script-copy-button"} type="button" onClick={() => void copyPersonalScript(script)} title="Copiar script pessoal">
                            {copyFeedback === key ? <Check size={18} aria-hidden="true" /> : <Clipboard size={18} aria-hidden="true" />}
                            <span className="sr-only">Copiar script pessoal</span>
                          </button>
                          <button className="secondary" type="button" disabled={saving || Boolean(script.suggestion)} onClick={() => void suggestPersonalScript(script.id)}>
                            {script.suggestion ? "Sugerido" : "Sugerir canon"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {visiblePersonalScripts.length ? null : <p className="muted">Nenhum script pessoal para este fluxo.</p>}
                </div>
                <form className="service-flow-personal-form" onSubmit={createPersonalScript}>
                  <div className="form-grid">
                    <label>Título<input value={personalDraft.title} onChange={(event) => setPersonalDraft((current) => ({ ...current, title: event.target.value }))} /></label>
                    <label>Canal<select value={personalDraft.channel} onChange={(event) => setPersonalDraft((current) => ({ ...current, channel: event.target.value }))}>{["WHATSAPP", "EMAIL", "PHONE", "INSTAGRAM", "INTERNAL"].map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
                    <label>Fluxos relacionados<select multiple value={personalDraft.flowIds} onChange={(event) => setPersonalDraft((current) => ({ ...current, flowIds: Array.from(event.target.selectedOptions).map((option) => option.value) }))}>{flows.map((flow) => <option key={flow.id} value={flow.id}>{flow.title}</option>)}</select></label>
                    <label>Tags<input value={personalDraft.tags} onChange={(event) => setPersonalDraft((current) => ({ ...current, tags: event.target.value }))} placeholder="saude, troca, prazo" /></label>
                  </div>
                  <MarkdownEditor
                    label="Texto pessoal"
                    rows={4}
                    value={personalDraft.body}
                    onChange={(body) => setPersonalDraft((current) => ({ ...current, body }))}
                    onUploadImage={(file) => uploadOperationalImage(file, "service-flow", selected?.id)}
                  />
                  <button disabled={saving || !personalDraft.title.trim() || !personalDraft.body.trim()}>Salvar script pessoal</button>
                </form>
              </div>
            </>
          ) : <OperationalState state="empty" title="Selecione um fluxo" />}
        </section>
      </div>
      {canManage ? (
        <section className="panel">
          <div>
            <p className="eyebrow">Gestão</p>
            <h2>Novo fluxo de atendimento</h2>
          </div>
          <form className="content-stack" onSubmit={createFlow}>
            <div className="form-grid">
              <label>Título<input value={flowDraft.title} onChange={(event) => setFlowDraft((current) => ({ ...current, title: event.target.value }))} /></label>
              <label>Status<select value={flowDraft.status} onChange={(event) => setFlowDraft((current) => ({ ...current, status: event.target.value }))}>{flowStatuses.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
              <label>Tags<input value={flowDraft.tags} onChange={(event) => setFlowDraft((current) => ({ ...current, tags: event.target.value }))} placeholder="sac, saude, reversa" /></label>
              <label>Resumo<input value={flowDraft.summary} onChange={(event) => setFlowDraft((current) => ({ ...current, summary: event.target.value }))} /></label>
            </div>
            <MarkdownEditor
              label="Conteúdo de apoio"
              rows={5}
              value={flowDraft.content}
              onChange={(content) => setFlowDraft((current) => ({ ...current, content }))}
              onUploadImage={(file) => uploadOperationalImage(file, "service-flow", selected?.id)}
            />
            <div className="service-flow-step-editor">
              {stepDrafts.map((step, index) => (
                <div className="service-flow-step-draft" key={index}>
                  <div className="form-grid">
                    <label>Etapa<input value={step.title} onChange={(event) => updateStep(index, { title: event.target.value })} /></label>
                    <label>Tipo<select value={step.kind} onChange={(event) => updateStep(index, { kind: event.target.value })}>{stepKinds.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
                  </div>
                  <MarkdownEditor
                    label="Orientação da etapa"
                    rows={4}
                    value={step.body}
                    onChange={(body) => updateStep(index, { body })}
                    onUploadImage={(file) => uploadOperationalImage(file, "service-flow", selected?.id)}
                  />
                  {step.kind === "YES_NO" ? (
                    <div className="form-grid">
                      <label>Se sim<input value={step.yesLabel} onChange={(event) => updateStep(index, { yesLabel: event.target.value })} placeholder="Seguir para reversa/troca" /></label>
                      <label>Se não<input value={step.noLabel} onChange={(event) => updateStep(index, { noLabel: event.target.value })} placeholder="Manter orientação ou escalar" /></label>
                    </div>
                  ) : null}
                  {step.kind === "DECISION" || step.kind === "CHECKLIST" ? (
                    <label>Opções<input value={step.options} onChange={(event) => updateStep(index, { options: event.target.value })} placeholder="estorno, troca, escalar supervisor" /></label>
                  ) : null}
                  <label>Scripts relacionados<select multiple value={step.scriptIds} onChange={(event) => updateStep(index, { scriptIds: Array.from(event.target.selectedOptions).map((option) => option.value) })}>{scripts.map((script) => <option key={script.id} value={script.id}>{script.title}</option>)}</select></label>
                  <div className="service-flow-recommendations">
                    <strong>Recomendados</strong>
                    {recommendedScriptsFor(step).map((script) => (
                      <button key={script.id} className="secondary small" type="button" onClick={() => updateStep(index, { scriptIds: [...step.scriptIds, script.id] })}>
                        {script.title}
                      </button>
                    ))}
                    {recommendedScriptsFor(step).length ? null : <span className="muted">Preencha título, orientação ou tags para sugerir scripts.</span>}
                  </div>
                </div>
              ))}
              <button className="secondary" type="button" onClick={() => setStepDrafts((current) => [...current, emptyStepDraft()])}><Plus size={16} aria-hidden="true" /> Adicionar etapa</button>
            </div>
            <button disabled={saving || !flowDraft.title}>Criar fluxo</button>
          </form>
        </section>
      ) : null}
    </div>
  );
}
