import { useEffect, useState, type FormEvent } from "react";
import type { CurrentUser } from "@alwaystrack/shared";
import { api } from "../api";
import { OperationalFilters, OperationalState } from "../components/operational";
import { formatDateBr } from "../sales";

interface FaqReactionItem {
  id: string;
  type: string;
  targetType: string;
  targetId: string;
  userId: string;
  user: { id: string; name: string };
}

interface FaqCommentItem {
  id: string;
  body: string;
  createdAt: string;
  author: { id: string; name: string; email: string; role: string };
  reactions: FaqReactionItem[];
}

interface FaqThreadItem {
  id: string;
  title: string;
  body: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  promotedAt: string | null;
  author: { id: string; name: string; email: string; role: string };
  wikiPage: { id: string; slug: string; title: string } | null;
  comments: FaqCommentItem[];
  reactions: FaqReactionItem[];
}

function formatDateTimeBr(value: string | null | undefined) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString("pt-BR");
}

function wikiPathForSlug(slug: string) {
  return `/wiki/${encodeURIComponent(slug)}`;
}

function faqReactionCount(reactions: FaqReactionItem[], type: string) {
  return reactions.filter((reaction) => reaction.type === type).length;
}

export function FaqThreadsView({ user }: { user: CurrentUser }) {
  const [threads, setThreads] = useState<FaqThreadItem[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canModerate = ["ADMIN", "GESTOR", "SUPERVISOR"].includes(user.role);

  async function load(nextSelectedId = selectedId) {
    setLoading(true);
    setError(null);
    const search = new URLSearchParams();
    if (query) search.set("query", query);
    if (status) search.set("status", status);
    try {
      const result = await api<{ items: FaqThreadItem[]; total: number }>(`/v1/faq/threads?${search.toString()}`);
      setThreads(result.items);
      const nextId = nextSelectedId && result.items.some((item) => item.id === nextSelectedId) ? nextSelectedId : result.items[0]?.id ?? "";
      setSelectedId(nextId);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Falha ao carregar FAQ.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function run(action: () => Promise<void>) {
    setSaving(true);
    setError(null);
    try {
      await action();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Falha ao salvar FAQ.");
    } finally {
      setSaving(false);
    }
  }

  async function createThread(event: FormEvent) {
    event.preventDefault();
    await run(async () => {
      const result = await api<{ thread: FaqThreadItem }>("/v1/faq/threads", {
        method: "POST",
        body: JSON.stringify({ title, body: body || null })
      });
      setTitle("");
      setBody("");
      await load(result.thread.id);
    });
  }

  async function addComment(event: FormEvent) {
    event.preventDefault();
    if (!selectedId) return;
    await run(async () => {
      await api<{ thread: FaqThreadItem }>(`/v1/faq/threads/${selectedId}/comments`, {
        method: "POST",
        body: JSON.stringify({ body: comment })
      });
      setComment("");
      await load(selectedId);
    });
  }

  async function setReaction(targetType: "THREAD" | "COMMENT", targetId: string, type: string, active = true) {
    if (!selectedId) return;
    await run(async () => {
      await api<{ thread: FaqThreadItem }>(`/v1/faq/threads/${selectedId}/reactions`, {
        method: "POST",
        body: JSON.stringify({ targetType, targetId, type, active })
      });
      await load(selectedId);
    });
  }

  async function updateStatus(nextStatus: string) {
    if (!selectedId) return;
    await run(async () => {
      await api<{ thread: FaqThreadItem }>(`/v1/faq/threads/${selectedId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus })
      });
      await load(selectedId);
    });
  }

  async function promoteToWiki() {
    if (!selectedId) return;
    await run(async () => {
      await api<{ thread: FaqThreadItem }>(`/v1/faq/threads/${selectedId}/promote-to-wiki`, { method: "POST" });
      await load(selectedId);
    });
  }

  const selected = threads.find((thread) => thread.id === selectedId) ?? null;
  const statusOptions = [
    { value: "OPEN", label: "Aberta" },
    { value: "ANSWERED", label: "Respondida" },
    { value: "RESOLVED", label: "Resolvida" },
    { value: "ARCHIVED", label: "Arquivada" }
  ];

  return (
    <div className="content-stack">
      <OperationalFilters
        fields={[
          { key: "query", label: "Busca", value: query, placeholder: "Pergunta, resposta ou autor", help: "Busca em titulo, corpo e comentarios da FAQ.", helpHref: "#faq", onChange: setQuery },
          { key: "status", label: "Status", value: status, type: "select", placeholder: "Todos", options: statusOptions, help: "Estado operacional da thread.", helpHref: "#faq", onChange: setStatus }
        ]}
        onSubmit={() => void load()}
      />
      {error ? <OperationalState state="error" title="Falha na FAQ" detail={error} /> : null}
      <section className="panel form-panel">
        <form onSubmit={createThread}>
          <div className="table-panel-toolbar">
            <div>
              <p className="eyebrow">FAQ</p>
              <h2>Nova pergunta</h2>
            </div>
          </div>
          <label>
            Pergunta
            <input value={title} onChange={(event) => setTitle(event.target.value)} />
          </label>
          <label>
            Contexto
            <textarea rows={3} value={body} onChange={(event) => setBody(event.target.value)} />
          </label>
          <div className="form-actions">
            <button disabled={saving || !title.trim()}>Publicar pergunta</button>
          </div>
        </form>
      </section>
      <div className="wiki-layout">
        <section className="panel table-panel">
          <div className="table-panel-toolbar">
            <div>
              <p className="eyebrow">Threads</p>
              <h2>Perguntas</h2>
            </div>
          </div>
          {loading ? (
            <OperationalState state="loading" title="Carregando threads" />
          ) : threads.length === 0 ? (
            <OperationalState state="empty" title="Nenhuma pergunta encontrada" />
          ) : (
            <div className="wiki-page-list">
              {threads.map((thread) => (
                <button className={selectedId === thread.id ? "wiki-page-button active" : "wiki-page-button"} key={thread.id} type="button" onClick={() => setSelectedId(thread.id)}>
                  <strong>{thread.title}</strong>
                  <span>{thread.status} / {thread.comments.length} resposta(s)</span>
                  <small>{thread.author.name} em {formatDateBr(thread.createdAt)}</small>
                  {thread.wikiPage ? <small>Wiki: /{thread.wikiPage.slug}</small> : null}
                </button>
              ))}
            </div>
          )}
        </section>
        <section className="panel wiki-reader-panel">
          {selected ? (
            <>
              <div className="detail-header">
                <div>
                  <p className="eyebrow">{selected.status}</p>
                  <h2>{selected.title}</h2>
                  <p className="muted">{selected.author.name} em {formatDateTimeBr(selected.createdAt)}</p>
                </div>
                <div className="row-actions">
                  {selected.wikiPage ? (
                    <button className="secondary" type="button" onClick={() => window.location.assign(wikiPathForSlug(selected.wikiPage!.slug))}>
                      Abrir Wiki
                    </button>
                  ) : null}
                  {canModerate ? (
                    <>
                      <select value={selected.status} onChange={(event) => void updateStatus(event.target.value)}>
                        {statusOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <button className="secondary" disabled={saving || Boolean(selected.wikiPage)} type="button" onClick={() => void promoteToWiki()}>
                        Promover para Wiki
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
              {selected.body ? <p>{selected.body}</p> : null}
              <div className="row-actions">
                <button className="secondary small" type="button" disabled={saving} onClick={() => void setReaction("THREAD", selected.id, "SAME_DOUBT")}>
                  Tambem tenho ({faqReactionCount(selected.reactions, "SAME_DOUBT")})
                </button>
                <button className="secondary small" type="button" disabled={saving} onClick={() => void setReaction("THREAD", selected.id, "HELPFUL")}>
                  Util ({faqReactionCount(selected.reactions, "HELPFUL")})
                </button>
              </div>
              {selected.wikiPage ? (
                <OperationalState state="success" title="Promovida para Wiki" detail={`/${selected.wikiPage.slug}`} />
              ) : null}
              <div className="help-section-grid">
                {selected.comments.map((item) => (
                  <article className="panel help-card" key={item.id}>
                    <p className="eyebrow">{item.author.name} / {formatDateTimeBr(item.createdAt)}</p>
                    <p>{item.body}</p>
                    <button className="secondary small" type="button" disabled={saving} onClick={() => void setReaction("COMMENT", item.id, "THANKS")}>
                      Obrigado ({faqReactionCount(item.reactions, "THANKS")})
                    </button>
                  </article>
                ))}
              </div>
              <form className="wiki-edit-form" onSubmit={addComment}>
                <h3>Responder</h3>
                <textarea rows={4} value={comment} onChange={(event) => setComment(event.target.value)} />
                <div className="form-actions">
                  <button disabled={saving || !comment.trim()}>Publicar resposta</button>
                </div>
              </form>
            </>
          ) : (
            <OperationalState state="empty" title="Selecione uma pergunta" />
          )}
        </section>
      </div>
    </div>
  );
}
