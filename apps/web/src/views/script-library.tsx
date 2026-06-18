import { Check, Clipboard } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { commercialManagerRoles, type CurrentUser } from "@alwaystrack/shared";
import { api, uploadWikiImage } from "../api";
import { MarkdownContent, MarkdownEditor } from "../components/markdown-editor";
import { OperationalFilters, OperationalState, PaginationControls } from "../components/operational";
import { formatDateBr } from "../sales";

interface ScriptCategoryItem {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  order: number;
  active: boolean;
  _count?: { scripts: number };
}

interface OperationalScriptItem {
  id: string;
  categoryId: string;
  wikiPageId: string | null;
  faqThreadId: string | null;
  title: string;
  channel: string;
  body: string;
  tags?: string[];
  placeholders?: string[];
  status: string;
  reviewState: string;
  usageCount: number;
  copiedAt: string | null;
  validatedAt: string | null;
  reviewDueAt: string | null;
  recertifiedAt: string | null;
  updatedAt: string;
  category: ScriptCategoryItem;
  validatedBy: { id: string; name: string; role: string } | null;
  recertifiedBy: { id: string; name: string; role: string } | null;
  wikiPage: { id: string; slug: string; title: string; active: boolean } | null;
  faqThread: { id: string; title: string; status: string; wikiPage: { id: string; slug: string; title: string } | null } | null;
  revisions?: Array<{ id: string; version: number; title: string; channel: string; status: string; createdAt: string; author: { id: string; name: string; role: string } }>;
  events?: Array<{ id: string; action: string; metadataJson: string | null; createdAt: string; user: { id: string; name: string; role: string } }>;
}

interface ScriptLibraryResponse {
  categories: ScriptCategoryItem[];
  scripts: OperationalScriptItem[];
  suggestions: ScriptSuggestionItem[];
  metrics: ScriptLibraryMetrics | null;
  total: number;
  canManage: boolean;
}

interface ScriptSuggestionItem {
  id: string;
  categoryId: string | null;
  scriptId: string | null;
  title: string;
  channel: string;
  body: string;
  tags?: string[];
  status: string;
  suggestionType: string;
  decisionComment: string | null;
  createdScriptId: string | null;
  createdAt: string;
  updatedAt: string;
  author: { id: string; name: string; role: string };
  decidedBy: { id: string; name: string; role: string } | null;
  category: { id: string; name: string } | null;
  script: { id: string; title: string } | null;
}

interface ScriptLibraryMetrics {
  mostCopied: Array<{ id: string; title: string; usageCount: number }>;
  neverUsed: number;
  reviewDue: number;
  pendingSuggestions: number;
  zeroSearches: Array<{ id: string; query: string | null; filtersJson: string | null; createdAt: string }>;
}

const channelOptions = [
  { value: "WHATSAPP", label: "WhatsApp" },
  { value: "EMAIL", label: "E-mail" },
  { value: "PHONE", label: "Telefone" },
  { value: "INSTAGRAM", label: "Instagram" },
  { value: "INTERNAL", label: "Interno" }
];

const statusOptions = [
  { value: "DRAFT", label: "Rascunho" },
  { value: "VALIDATED", label: "Validado" },
  { value: "OBSOLETE", label: "Obsoleto" }
];

const defaultTags = ["acareacao", "cadastro", "entrega", "estorno", "pedido", "produto", "rastreio", "vendas"];
const reviewStateLabels: Record<string, string> = {
  VALIDATED: "Validado",
  REVIEW_DUE: "Revisão pendente",
  DRAFT: "Rascunho",
  OBSOLETE: "Obsoleto"
};

function parseTags(value: string) {
  return [...new Set(value.split(",").map((tag) => tag.trim().replace(/^#/, "").toLowerCase()).filter(Boolean))].sort((left, right) => left.localeCompare(right));
}

function renderScript(body: string, values: Record<string, string>) {
  return body.replace(/\{([a-zA-Z0-9_.-]+)\}/g, (_, key: string) => values[key] || `{${key}}`);
}

function emptyScriptDraft(categoryId = "") {
  return { categoryId, wikiPageId: "", faqThreadId: "", title: "", channel: "WHATSAPP", body: "", tags: "", status: "DRAFT", reviewDueAt: "", comment: "" };
}

function emptySuggestionDraft(categoryId = "", scriptId = "") {
  return { categoryId, scriptId, suggestionType: scriptId ? "CHANGE" : "NEW", title: "", channel: "WHATSAPP", body: "", tags: "" };
}

function dateInputValue(value: string | null | undefined) {
  return value ? value.slice(0, 10) : "";
}

function payloadDate(value: string) {
  return value ? new Date(`${value}T12:00:00.000Z`).toISOString() : null;
}

export function ScriptLibraryView({ user }: { user: CurrentUser }) {
  const [categories, setCategories] = useState<ScriptCategoryItem[]>([]);
  const [scripts, setScripts] = useState<OperationalScriptItem[]>([]);
  const [suggestions, setSuggestions] = useState<ScriptSuggestionItem[]>([]);
  const [metrics, setMetrics] = useState<ScriptLibraryMetrics | null>(null);
  const [wikiPages, setWikiPages] = useState<Array<{ id: string; slug: string; title: string }>>([]);
  const [faqThreads, setFaqThreads] = useState<Array<{ id: string; title: string; status: string }>>([]);
  const [total, setTotal] = useState(0);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [query, setQuery] = useState("");
  const [channel, setChannel] = useState("");
  const [status, setStatus] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [includeObsolete, setIncludeObsolete] = useState(false);
  const [reviewDueOnly, setReviewDueOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [placeholderValues, setPlaceholderValues] = useState<Record<string, string>>({});
  const [copyFeedback, setCopyFeedback] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");
  const [scriptDraft, setScriptDraft] = useState(emptyScriptDraft());
  const [suggestionDraft, setSuggestionDraft] = useState(emptySuggestionDraft());
  const [decisionComment, setDecisionComment] = useState("");
  const [editingScriptId, setEditingScriptId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canManage = (commercialManagerRoles as readonly string[]).includes(user.role);
  const canRestore = user.role === "ADMIN";
  const pageSize = 8;

  async function load(nextSelectedId = selectedId) {
    setLoading(true);
    setError(null);
    const search = new URLSearchParams();
    if (query) search.set("query", query);
    if (selectedCategoryId) search.set("categoryId", selectedCategoryId);
    if (channel) search.set("channel", channel);
    if (status) search.set("status", status);
    if (selectedTag) search.set("tags", selectedTag);
    if (includeObsolete) search.set("includeObsolete", "1");
    if (reviewDueOnly) search.set("reviewDue", "1");
    try {
      const result = await api<ScriptLibraryResponse>(`/v1/script-library?${search.toString()}`);
      setCategories(result.categories);
      setScripts(result.scripts);
      setSuggestions(result.suggestions ?? []);
      setMetrics(result.metrics ?? null);
      setTotal(result.total);
      setPage(1);
      const next = nextSelectedId && result.scripts.some((script) => script.id === nextSelectedId) ? nextSelectedId : result.scripts[0]?.id ?? "";
      setSelectedId(next);
      const nextScript = result.scripts.find((script) => script.id === next);
      if (nextScript) setScriptDraft(draftFrom(nextScript));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Falha ao carregar scriptoteca.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    void load("");
  }, [selectedCategoryId, selectedTag, includeObsolete, reviewDueOnly]);

  useEffect(() => {
    async function loadReferences() {
      if (!canManage) return;
      const [wikiResult, faqResult] = await Promise.all([
        api<{ items: Array<{ id: string; slug: string; title: string }> }>("/v1/wiki/pages?pageSize=100").catch(() => ({ items: [] })),
        api<{ items: Array<{ id: string; title: string; status: string }> }>("/v1/faq/threads?pageSize=100").catch(() => ({ items: [] }))
      ]);
      setWikiPages(wikiResult.items);
      setFaqThreads(faqResult.items);
    }
    void loadReferences();
  }, [canManage]);

  const selected = scripts.find((script) => script.id === selectedId) ?? null;
  const tags = useMemo(() => [...new Set([...defaultTags, ...scripts.flatMap((script) => script.tags ?? [])])].sort((left, right) => left.localeCompare(right)), [scripts]);
  const paginatedScripts = scripts.slice((page - 1) * pageSize, page * pageSize);
  const rendered = selected ? renderScript(selected.body, placeholderValues) : "";

  function draftFrom(script: OperationalScriptItem) {
    setEditingScriptId(script.id);
    return {
      categoryId: script.categoryId,
      wikiPageId: script.wikiPageId ?? "",
      faqThreadId: script.faqThreadId ?? "",
      title: script.title,
      channel: script.channel,
      body: script.body,
      tags: script.tags?.join(", ") ?? "",
      status: script.status,
      reviewDueAt: dateInputValue(script.reviewDueAt),
      comment: ""
    };
  }

  async function run(action: () => Promise<void>) {
    setSaving(true);
    setError(null);
    try {
      await action();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Falha ao salvar scriptoteca.");
    } finally {
      setSaving(false);
    }
  }

  async function createCategory(event: FormEvent) {
    event.preventDefault();
    await run(async () => {
      await api("/v1/script-library/categories", { method: "POST", body: JSON.stringify({ name: categoryName, description: categoryDescription || null }) });
      setCategoryName("");
      setCategoryDescription("");
      await load();
    });
  }

  async function saveScript(event: FormEvent) {
    event.preventDefault();
    await run(async () => {
      const payload = {
        ...scriptDraft,
        wikiPageId: scriptDraft.wikiPageId || null,
        faqThreadId: scriptDraft.faqThreadId || null,
        reviewDueAt: payloadDate(scriptDraft.reviewDueAt),
        tags: parseTags(scriptDraft.tags)
      };
      const endpoint = editingScriptId ? `/v1/script-library/scripts/${editingScriptId}` : "/v1/script-library/scripts";
      const method = editingScriptId ? "PATCH" : "POST";
      const result = await api<{ script: OperationalScriptItem }>(endpoint, { method, body: JSON.stringify(payload) });
      await load(result.script.id);
    });
  }

  async function createSuggestion(event: FormEvent) {
    event.preventDefault();
    await run(async () => {
      await api("/v1/script-library/suggestions", {
        method: "POST",
        body: JSON.stringify({
          ...suggestionDraft,
          categoryId: suggestionDraft.categoryId || selectedCategoryId || null,
          scriptId: suggestionDraft.scriptId || null,
          tags: parseTags(suggestionDraft.tags)
        })
      });
      setSuggestionDraft(emptySuggestionDraft(selectedCategoryId, ""));
      await load();
    });
  }

  async function decideSuggestion(suggestion: ScriptSuggestionItem, decision: "ACCEPTED" | "REJECTED" | "MERGED") {
    await run(async () => {
      await api(`/v1/script-library/suggestions/${suggestion.id}/decision`, {
        method: "POST",
        body: JSON.stringify({
          decision,
          decisionComment: decisionComment || null,
          categoryId: suggestion.categoryId || selectedCategoryId || categories[0]?.id || null,
          title: suggestion.title,
          channel: suggestion.channel,
          body: suggestion.body,
          tags: suggestion.tags ?? []
        })
      });
      setDecisionComment("");
      await load(selectedId);
    });
  }

  async function validateScript() {
    if (!selected) return;
    await run(async () => {
      const result = await api<{ script: OperationalScriptItem }>(`/v1/script-library/scripts/${selected.id}/validate`, { method: "POST" });
      await load(result.script.id);
    });
  }

  async function obsoleteScript() {
    if (!selected) return;
    await run(async () => {
      const result = await api<{ script: OperationalScriptItem }>(`/v1/script-library/scripts/${selected.id}/obsolete`, { method: "POST" });
      await load(result.script.id);
    });
  }

  async function recertifyScript() {
    if (!selected) return;
    await run(async () => {
      const result = await api<{ script: OperationalScriptItem }>(`/v1/script-library/scripts/${selected.id}/recertify`, {
        method: "POST",
        body: JSON.stringify({ reviewDueAt: payloadDate(scriptDraft.reviewDueAt), comment: scriptDraft.comment || null })
      });
      setScriptDraft((current) => ({ ...current, comment: "" }));
      await load(result.script.id);
    });
  }

  async function copyScript() {
    if (!selected) return;
    try {
      await navigator.clipboard.writeText(rendered);
      setCopyFeedback("Copiado");
    } catch {
      setCopyFeedback("Copie manualmente");
    }
    await api(`/v1/script-library/scripts/${selected.id}/copy`, { method: "POST", body: JSON.stringify({ renderedText: rendered, placeholders: placeholderValues }) }).catch(() => null);
    window.setTimeout(() => setCopyFeedback(""), 1800);
  }

  async function restoreRevision(revisionId: string) {
    if (!selected) return;
    await run(async () => {
      const result = await api<{ script: OperationalScriptItem }>(`/v1/script-library/scripts/${selected.id}/revisions/${revisionId}/restore`, { method: "POST" });
      await load(result.script.id);
    });
  }

  return (
    <div className="content-stack">
      <OperationalFilters
        fields={[
          { key: "query", label: "Busca", value: query, placeholder: "Titulo, texto, tag ou categoria", onChange: setQuery },
          { key: "channel", label: "Canal", value: channel, type: "select", placeholder: "Todos", options: channelOptions, onChange: setChannel },
          { key: "status", label: "Status", value: status, type: "select", placeholder: "Principal", options: statusOptions, onChange: setStatus },
          { key: "tag", label: "Tag", value: selectedTag, type: "select", placeholder: "Todas", options: tags.map((tag) => ({ value: tag, label: `#${tag}` })), onChange: setSelectedTag }
        ]}
        onSubmit={() => void load()}
      />
      <div className="knowledge-curation-bar">
        <button className={includeObsolete ? "active" : ""} type="button" onClick={() => { setIncludeObsolete((current) => !current); setPage(1); }}>
          Incluir obsoletos
        </button>
        {canManage ? (
          <button className={reviewDueOnly ? "active" : ""} type="button" onClick={() => { setReviewDueOnly((current) => !current); setPage(1); }}>
            Revisão pendente
          </button>
        ) : null}
        <span>{scripts.filter((script) => script.status === "VALIDATED").length} validado(s)</span>
        <span>{scripts.filter((script) => script.reviewState === "REVIEW_DUE").length} pendente(s)</span>
        <span>{scripts.reduce((sum, script) => sum + script.usageCount, 0)} copia(s)</span>
      </div>
      {error ? <OperationalState state="error" title="Falha na Scriptoteca" detail={error} /> : null}
      {canManage && metrics ? (
        <section className="panel script-metrics-panel">
          <div>
            <p className="eyebrow">Métricas</p>
            <h2>Uso e lacunas</h2>
          </div>
          <div className="script-metrics-grid">
            <div className="script-metric-card"><span>Sugestões pendentes</span><strong>{metrics.pendingSuggestions}</strong></div>
            <div className="script-metric-card"><span>Sem uso</span><strong>{metrics.neverUsed}</strong></div>
            <div className="script-metric-card"><span>Revisão vencida</span><strong>{metrics.reviewDue}</strong></div>
          </div>
          <div className="script-metrics-columns">
            <div className="script-metric-list">
              <h3>Mais copiados</h3>
              <div>
                {metrics.mostCopied.map((item) => (
                  <span key={item.id}><strong>{item.title}</strong><small>{item.usageCount} copia(s)</small></span>
                ))}
                {metrics.mostCopied.length ? null : <span className="muted">Sem copias registradas.</span>}
              </div>
            </div>
            <div className="script-metric-list">
              <h3>Buscas sem resultado</h3>
              <div>
                {metrics.zeroSearches.map((item) => (
                  <span key={item.id}><strong>{item.query || "Filtro sem texto"}</strong><small>{formatDateBr(item.createdAt)}</small></span>
                ))}
                {metrics.zeroSearches.length ? null : <span className="muted">Sem lacunas recentes.</span>}
              </div>
            </div>
          </div>
        </section>
      ) : null}
      <div className="script-library-layout">
        <section className="panel table-panel">
          <div className="table-panel-toolbar">
            <div>
              <p className="eyebrow">Categorias</p>
              <h2>Menu SAC</h2>
            </div>
          </div>
          <div className="wiki-page-list">
            <button className={!selectedCategoryId ? "wiki-page-button active" : "wiki-page-button"} type="button" onClick={() => { setSelectedCategoryId(""); setPage(1); }}>
              <strong>Todas</strong>
              <small>{total} script(s)</small>
            </button>
            {categories.map((category) => (
              <button className={selectedCategoryId === category.id ? "wiki-page-button active" : "wiki-page-button"} key={category.id} type="button" onClick={() => { setSelectedCategoryId(category.id); setPage(1); }}>
                <strong>{category.name}</strong>
                {category.description ? <small>{category.description}</small> : null}
                <small>{category._count?.scripts ?? 0} script(s)</small>
              </button>
            ))}
          </div>
        </section>
        <section className="panel table-panel">
          <div className="table-panel-toolbar">
            <div>
              <p className="eyebrow">Scripts</p>
              <h2>Textos prontos</h2>
            </div>
          </div>
          {loading ? (
            <OperationalState state="loading" title="Carregando scripts" />
          ) : scripts.length === 0 ? (
            <OperationalState state="empty" title="Nenhum script encontrado" detail="Crie uma categoria e cadastre textos validados para o SAC." />
          ) : (
            <div className="wiki-page-list wiki-page-list-paginated">
              {paginatedScripts.map((script) => (
                <button
                  className={selectedId === script.id ? "wiki-page-button active" : "wiki-page-button"}
                  key={script.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(script.id);
                    setPlaceholderValues({});
                    setScriptDraft(draftFrom(script));
                  }}
                >
                  <strong>{script.title}</strong>
                  <span>{script.category.name} / {script.channel} / {reviewStateLabels[script.reviewState] ?? script.status}</span>
                  {script.tags?.length ? <small>{script.tags.map((tag) => `#${tag}`).join(" ")}</small> : null}
                  {script.wikiPage || script.faqThread ? <small>{script.wikiPage ? `Wiki: /${script.wikiPage.slug}` : ""}{script.wikiPage && script.faqThread ? " · " : ""}{script.faqThread ? `FAQ: ${script.faqThread.title}` : ""}</small> : null}
                  <small>{script.usageCount} copia(s) · atualizado {formatDateBr(script.updatedAt)}</small>
                </button>
              ))}
              <PaginationControls page={page} pageSize={pageSize} total={scripts.length} onPageChange={setPage} />
            </div>
          )}
        </section>
        <section className="panel wiki-reader-panel">
          {selected ? (
            <>
              <div className="detail-header">
                <div>
                  <p className="eyebrow">{selected.category.name}</p>
                  <h2>{selected.title}</h2>
                  <p className="muted">{selected.channel} · {reviewStateLabels[selected.reviewState] ?? selected.status}</p>
                </div>
                <div className="row-actions">
                  <button
                    className={copyFeedback ? "script-copy-button copied" : "script-copy-button"}
                    type="button"
                    onClick={() => void copyScript()}
                    aria-label={copyFeedback || "Copiar script para a area de transferencia"}
                    title={copyFeedback || "Copiar script"}
                  >
                    {copyFeedback ? <Check size={18} aria-hidden="true" /> : <Clipboard size={18} aria-hidden="true" />}
                    <span className="sr-only">{copyFeedback || "Copiar script"}</span>
                  </button>
                  {canManage ? (
                    <>
                      <button className="secondary" type="button" disabled={saving || selected.status === "VALIDATED"} onClick={() => void validateScript()}>Validar</button>
                      <button className="secondary" type="button" disabled={saving || selected.status === "OBSOLETE"} onClick={() => void recertifyScript()}>Recertificar</button>
                      <button className="secondary" type="button" disabled={saving || selected.status === "OBSOLETE"} onClick={() => void obsoleteScript()}>Obsoletar</button>
                    </>
                  ) : null}
                </div>
              </div>
              <div className="knowledge-governance-strip">
                <span>{selected.validatedBy ? `Validado por ${selected.validatedBy.name}` : "Sem validação"}</span>
                <span>{selected.validatedAt ? `Validado em ${formatDateBr(selected.validatedAt)}` : "Aguardando validação"}</span>
                <span>{selected.reviewDueAt ? `Revisar até ${formatDateBr(selected.reviewDueAt)}` : "Sem vencimento"}</span>
                <span>{selected.usageCount} copia(s)</span>
              </div>
              {(selected.wikiPage || selected.faqThread) ? (
                <div className="script-link-row">
                  {selected.wikiPage ? <button className="secondary" type="button" onClick={() => window.location.assign(`/wiki/${selected.wikiPage!.slug}`)}>Abrir Wiki</button> : null}
                  {selected.faqThread ? <button className="secondary" type="button" onClick={() => window.location.assign("/faq")}>Abrir FAQ</button> : null}
                  {selected.faqThread?.wikiPage ? <button className="secondary" type="button" onClick={() => window.location.assign(`/wiki/${selected.faqThread!.wikiPage!.slug}`)}>Wiki da FAQ</button> : null}
                </div>
              ) : null}
              {selected.placeholders?.length ? (
                <div className="script-placeholder-grid">
                  {selected.placeholders.map((placeholder) => (
                    <label key={placeholder}>
                      {placeholder}
                      <input value={placeholderValues[placeholder] ?? ""} onChange={(event) => setPlaceholderValues((current) => ({ ...current, [placeholder]: event.target.value }))} />
                    </label>
                  ))}
                </div>
              ) : null}
              <div className="script-preview">
                <MarkdownContent content={rendered} emptyText="Sem texto publicado." />
              </div>
              {selected.tags?.length ? (
                <div className="wiki-tag-row">
                  {selected.tags.map((tag) => <button key={tag} type="button" onClick={() => { setSelectedTag(tag); setPage(1); }}>#{tag}</button>)}
                </div>
              ) : null}
              {canManage ? (
                <div className="script-history-grid">
                  <div>
                    <h3>Revisões</h3>
                    <div className="script-history-list">
                      {(selected.revisions ?? []).map((revision) => (
                        <div className="script-history-item" key={revision.id}>
                          <div>
                            <strong>v{revision.version} / {revision.status}</strong>
                            <span>{revision.author.name} em {formatDateBr(revision.createdAt)}</span>
                          </div>
                          {canRestore ? <button className="secondary" type="button" disabled={saving} onClick={() => void restoreRevision(revision.id)}>Restaurar</button> : null}
                        </div>
                      ))}
                      {selected.revisions?.length ? null : <span className="muted">Sem revisões registradas.</span>}
                    </div>
                  </div>
                  <div>
                    <h3>Eventos</h3>
                    <div className="script-history-list">
                      {(selected.events ?? []).map((event) => (
                        <div className="script-history-item" key={event.id}>
                          <div>
                            <strong>{event.action}</strong>
                            <span>{event.user.name} em {formatDateBr(event.createdAt)}</span>
                          </div>
                        </div>
                      ))}
                      {selected.events?.length ? null : <span className="muted">Sem eventos recentes.</span>}
                    </div>
                  </div>
                </div>
              ) : null}
            </>
          ) : (
            <OperationalState state="empty" title="Selecione um script" />
          )}
        </section>
      </div>

      <section className="panel form-panel">
        <div className="table-panel-toolbar">
          <div>
            <p className="eyebrow">Sugestões</p>
            <h2>Melhorias de script</h2>
          </div>
        </div>
        <form onSubmit={createSuggestion}>
          <div className="form-grid">
            <label>
              Tipo
              <select value={suggestionDraft.suggestionType} onChange={(event) => setSuggestionDraft((current) => ({ ...current, suggestionType: event.target.value, scriptId: event.target.value === "NEW" ? "" : current.scriptId }))}>
                <option value="NEW">Novo script</option>
                <option value="CHANGE">Alterar existente</option>
              </select>
            </label>
            <label>
              Script relacionado
              <select value={suggestionDraft.scriptId} onChange={(event) => setSuggestionDraft((current) => ({ ...current, scriptId: event.target.value, suggestionType: event.target.value ? "CHANGE" : "NEW" }))}>
                <option value="">Nenhum</option>
                {scripts.map((script) => <option key={script.id} value={script.id}>{script.title}</option>)}
              </select>
            </label>
            <label>
              Categoria
              <select value={suggestionDraft.categoryId} onChange={(event) => setSuggestionDraft((current) => ({ ...current, categoryId: event.target.value }))}>
                <option value="">Sem categoria</option>
                {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
            </label>
            <label>
              Canal
              <select value={suggestionDraft.channel} onChange={(event) => setSuggestionDraft((current) => ({ ...current, channel: event.target.value }))}>
                {channelOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            <label className="full-span">
              Título
              <input value={suggestionDraft.title} onChange={(event) => setSuggestionDraft((current) => ({ ...current, title: event.target.value }))} />
            </label>
            <div className="full-span">
              <MarkdownEditor
                label="Texto sugerido"
                rows={5}
                value={suggestionDraft.body}
                onChange={(value) => setSuggestionDraft((current) => ({ ...current, body: value }))}
                onUploadImage={(file) => uploadWikiImage(file)}
              />
            </div>
            <label className="full-span">
              Tags
              <input value={suggestionDraft.tags} onChange={(event) => setSuggestionDraft((current) => ({ ...current, tags: event.target.value }))} />
            </label>
          </div>
          <div className="form-actions">
            <button disabled={saving || !suggestionDraft.title.trim() || !suggestionDraft.body.trim()}>Enviar sugestão</button>
          </div>
        </form>
        <div className="script-history-grid">
          <div>
            <h3>{canManage ? "Fila de decisão" : "Minhas sugestões"}</h3>
            <div className="script-history-list">
              {suggestions.map((suggestion) => (
                <div className="script-history-item" key={suggestion.id}>
                  <div>
                    <strong>{suggestion.title} / {suggestion.status}</strong>
                    <span>{suggestion.author.name} / {suggestion.suggestionType}{suggestion.decisionComment ? ` / ${suggestion.decisionComment}` : ""}</span>
                  </div>
                  {canManage && suggestion.status === "SUGGESTED" ? (
                    <div className="row-actions">
                      <button className="secondary" type="button" disabled={saving || suggestion.suggestionType === "CHANGE"} onClick={() => void decideSuggestion(suggestion, "ACCEPTED")}>Aceitar</button>
                      <button className="secondary" type="button" disabled={saving || !suggestion.scriptId} onClick={() => void decideSuggestion(suggestion, "MERGED")}>Mesclar</button>
                      <button className="secondary" type="button" disabled={saving} onClick={() => void decideSuggestion(suggestion, "REJECTED")}>Rejeitar</button>
                    </div>
                  ) : null}
                </div>
              ))}
              {suggestions.length ? null : <span className="muted">Sem sugestões registradas.</span>}
            </div>
          </div>
          {canManage ? (
            <label>
              Comentário da decisão
              <input value={decisionComment} onChange={(event) => setDecisionComment(event.target.value)} />
            </label>
          ) : null}
        </div>
      </section>

      {canManage ? (
        <section className="panel form-panel">
          <div className="table-panel-toolbar">
            <div>
              <p className="eyebrow">Gestão</p>
              <h2>Categorias e scripts</h2>
            </div>
          </div>
          <form onSubmit={createCategory}>
            <div className="form-grid">
              <label>
                Categoria
                <input value={categoryName} onChange={(event) => setCategoryName(event.target.value)} />
              </label>
              <label>
                Descrição
                <input value={categoryDescription} onChange={(event) => setCategoryDescription(event.target.value)} />
              </label>
            </div>
            <div className="form-actions">
              <button className="secondary" disabled={saving || !categoryName.trim()}>Criar categoria</button>
            </div>
          </form>
          <form onSubmit={saveScript}>
            <div className="form-grid">
              <label>
                Categoria
                <select value={scriptDraft.categoryId} onChange={(event) => setScriptDraft((current) => ({ ...current, categoryId: event.target.value }))}>
                  <option value="">Selecione</option>
                  {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                </select>
              </label>
              <label>
                Canal
                <select value={scriptDraft.channel} onChange={(event) => setScriptDraft((current) => ({ ...current, channel: event.target.value }))}>
                  {channelOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
              <label>
                Título
                <input value={scriptDraft.title} onChange={(event) => setScriptDraft((current) => ({ ...current, title: event.target.value }))} />
              </label>
              <label>
                Status
                <select value={scriptDraft.status} onChange={(event) => setScriptDraft((current) => ({ ...current, status: event.target.value }))}>
                  {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
              <label>
                Wiki relacionada
                <select value={scriptDraft.wikiPageId} onChange={(event) => setScriptDraft((current) => ({ ...current, wikiPageId: event.target.value }))}>
                  <option value="">Nenhuma</option>
                  {wikiPages.map((page) => <option key={page.id} value={page.id}>{page.title}</option>)}
                </select>
              </label>
              <label>
                FAQ relacionada
                <select value={scriptDraft.faqThreadId} onChange={(event) => setScriptDraft((current) => ({ ...current, faqThreadId: event.target.value }))}>
                  <option value="">Nenhuma</option>
                  {faqThreads.map((thread) => <option key={thread.id} value={thread.id}>{thread.title}</option>)}
                </select>
              </label>
              <label>
                Revisar até
                <input type="date" value={scriptDraft.reviewDueAt} onChange={(event) => setScriptDraft((current) => ({ ...current, reviewDueAt: event.target.value }))} />
              </label>
              <label>
                Comentário de recertificação
                <input value={scriptDraft.comment} onChange={(event) => setScriptDraft((current) => ({ ...current, comment: event.target.value }))} />
              </label>
              <div className="full-span">
                <MarkdownEditor
                  label="Texto"
                  rows={8}
                  value={scriptDraft.body}
                  onChange={(value) => setScriptDraft((current) => ({ ...current, body: value }))}
                  onUploadImage={(file) => uploadWikiImage(file)}
                />
              </div>
              <label className="full-span">
                Tags
                <input value={scriptDraft.tags} onChange={(event) => setScriptDraft((current) => ({ ...current, tags: event.target.value }))} placeholder="entrega, pedido, whatsapp" />
              </label>
            </div>
            <div className="form-actions">
              <button disabled={saving || !scriptDraft.categoryId || !scriptDraft.title.trim() || !scriptDraft.body.trim()}>{editingScriptId ? "Salvar script" : "Criar script"}</button>
              <button className="secondary" type="button" onClick={() => { setEditingScriptId(null); setScriptDraft(emptyScriptDraft(selectedCategoryId)); }}>Novo script</button>
            </div>
          </form>
        </section>
      ) : null}
    </div>
  );
}
