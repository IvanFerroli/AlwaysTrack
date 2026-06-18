import { Check, Clipboard, GitBranch, Plus } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { commercialManagerRoles, type CurrentUser } from "@alwaystrack/shared";
import { api, uploadWikiImage } from "../api";
import { MarkdownContent, MarkdownEditor } from "../components/markdown-editor";
import { OperationalFilters, OperationalState } from "../components/operational";

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
  wikiPage: { id: string; slug: string; title: string } | null;
  steps: ServiceFlowStep[];
}

interface ScriptLibraryResponse {
  scripts: FlowScript[];
}

interface ServiceFlowsResponse {
  items: ServiceFlowItem[];
  canManage: boolean;
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
  const [selectedId, setSelectedId] = useState("");
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState("");
  const [status, setStatus] = useState("");
  const [openSteps, setOpenSteps] = useState<Record<string, boolean>>({});
  const [placeholderValues, setPlaceholderValues] = useState<Record<string, Record<string, string>>>({});
  const [copyFeedback, setCopyFeedback] = useState("");
  const [flowDraft, setFlowDraft] = useState({ title: "", summary: "", content: "", tags: "", status: "PUBLISHED" });
  const [stepDrafts, setStepDrafts] = useState<StepDraft[]>([emptyStepDraft()]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canManage = (commercialManagerRoles as readonly string[]).includes(user.role);
  const selected = flows.find((flow) => flow.id === selectedId) ?? flows[0] ?? null;
  const tags = useMemo(() => [...new Set(flows.flatMap((flow) => flow.tags ?? []))].sort(), [flows]);

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
      setFlows(flowResult.items);
      setScripts(scriptResult.scripts.filter((script) => script.status !== "OBSOLETE"));
      const next = nextSelectedId && flowResult.items.some((flow) => flow.id === nextSelectedId) ? nextSelectedId : flowResult.items[0]?.id ?? "";
      setSelectedId(next);
      setOpenSteps(Object.fromEntries((flowResult.items.find((flow) => flow.id === next)?.steps ?? flowResult.items[0]?.steps ?? []).map((step, index) => [step.id, index === 0])));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Falha ao carregar fluxos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load("");
  }, [tag, status]);

  async function copyScript(script: FlowScript) {
    const rendered = renderScript(script.body, placeholderValues[script.id] ?? {});
    try {
      await navigator.clipboard.writeText(rendered);
      setCopyFeedback(script.id);
    } catch {
      setCopyFeedback("");
    }
    await api(`/v1/script-library/scripts/${script.id}/copy`, { method: "POST", body: JSON.stringify({ renderedText: rendered, placeholders: placeholderValues[script.id] ?? {} }) }).catch(() => null);
    window.setTimeout(() => setCopyFeedback(""), 1600);
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
      <div className="service-flow-layout">
        <section className="panel table-panel">
          <div className="table-panel-toolbar">
            <div>
              <p className="eyebrow">Fluxos</p>
              <h2>Tipos de atendimento</h2>
            </div>
          </div>
          {loading ? <OperationalState state="loading" title="Carregando fluxos" /> : null}
          <div className="wiki-page-list">
            {flows.map((flow) => (
              <button className={selected?.id === flow.id ? "wiki-page-button active" : "wiki-page-button"} key={flow.id} type="button" onClick={() => { setSelectedId(flow.id); setOpenSteps(Object.fromEntries(flow.steps.map((step, index) => [step.id, index === 0]))); }}>
                <strong>{flow.title}</strong>
                {flow.summary ? <small>{flow.summary}</small> : null}
                <small>{flow.steps.length} etapa(s) · {flow.status}</small>
              </button>
            ))}
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
                  {selected.summary ? <p className="muted">{selected.summary}</p> : null}
                </div>
                {selected.wikiPage ? <button className="secondary" type="button" onClick={() => window.location.assign(`/wiki/${selected.wikiPage!.slug}`)}>Abrir Wiki</button> : null}
              </div>
              {selected.content ? <MarkdownContent content={selected.content} /> : null}
              <div className="service-flow-steps">
                {selected.steps.map((step, index) => {
                  const expanded = openSteps[step.id] ?? index === 0;
                  return (
                    <article className="service-flow-step" key={step.id}>
                      <button className="service-flow-step-header" type="button" onClick={() => setOpenSteps((current) => ({ ...current, [step.id]: !expanded }))}>
                        <span>{index + 1}</span>
                        <strong>{step.title}</strong>
                        <small>{step.kind}{step.required ? " · obrigatório" : ""}</small>
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
                        </div>
                      ) : null}
                    </article>
                  );
                })}
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
              onUploadImage={(file) => uploadWikiImage(file)}
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
                    onUploadImage={(file) => uploadWikiImage(file)}
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
