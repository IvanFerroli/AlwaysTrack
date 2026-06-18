import { useEffect, useMemo, useState, type FormEvent } from "react";
import { commercialAllRoles, commercialManagerRoles, type CurrentUser, type UserRole } from "@alwaystrack/shared";
import { api, uploadWikiImage } from "../api";
import { MarkdownContent, MarkdownEditor } from "../components/markdown-editor";
import { OperationalFilters, OperationalState, PaginationControls } from "../components/operational";
import { formatDateBr } from "../sales";

interface AnnouncementLink {
  type: string;
  label: string;
  href: string;
}

interface AnnouncementItem {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  content: string;
  contentFormat?: "MARKDOWN";
  tags?: string[];
  links?: AnnouncementLink[];
  targetRoles?: UserRole[];
  status: string;
  priority: string;
  pinned: boolean;
  requiresAck: boolean;
  startsAt: string | null;
  expiresAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: { id: string; name: string; email: string; role: string };
  updatedBy: { id: string; name: string; email: string; role: string };
  readReceipts: Array<{ id: string; acknowledgedAt: string | null; user?: { id: string; name: string; email: string; role: string } }>;
}

interface AnnouncementDraft {
  title: string;
  slug: string;
  summary: string;
  content: string;
  tags: string;
  priority: string;
  status: string;
  pinned: boolean;
  requiresAck: boolean;
  startsAt: string;
  expiresAt: string;
  targetRoles: UserRole[];
  linksText: string;
}

const priorityOptions = [
  { value: "LOW", label: "Baixa" },
  { value: "NORMAL", label: "Normal" },
  { value: "HIGH", label: "Alta" },
  { value: "CRITICAL", label: "Crítica" }
];

const statusOptions = [
  { value: "DRAFT", label: "Rascunho" },
  { value: "PUBLISHED", label: "Publicado" },
  { value: "SCHEDULED", label: "Agendado" },
  { value: "ARCHIVED", label: "Arquivado" },
  { value: "EXPIRED", label: "Expirado" }
];

const defaultTags = ["campanhas", "notas", "processo", "ranking", "sac", "vendas"];

function emptyDraft(): AnnouncementDraft {
  return {
    title: "",
    slug: "",
    summary: "",
    content: "",
    tags: "",
    priority: "NORMAL",
    status: "DRAFT",
    pinned: false,
    requiresAck: false,
    startsAt: "",
    expiresAt: "",
    targetRoles: [...commercialAllRoles],
    linksText: ""
  };
}

function parseTags(value: string) {
  return [...new Set(value.split(",").map((tag) => tag.trim().replace(/^#/, "").toLowerCase()).filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function parseLinksText(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [type = "URL", label = "", href = ""] = line.split("|").map((part) => part.trim());
      return { type: type.toUpperCase(), label, href };
    })
    .filter((item) => item.label && item.href);
}

function linksTextFor(links: AnnouncementLink[] | undefined) {
  return (links ?? []).map((link) => `${link.type}|${link.label}|${link.href}`).join("\n");
}

function statusLabel(value: string) {
  return statusOptions.find((option) => option.value === value)?.label ?? value;
}

function priorityLabel(value: string) {
  return priorityOptions.find((option) => option.value === value)?.label ?? value;
}

function draftFrom(item: AnnouncementItem): AnnouncementDraft {
  return {
    title: item.title,
    slug: item.slug,
    summary: item.summary ?? "",
    content: item.content,
    tags: item.tags?.join(", ") ?? "",
    priority: item.priority,
    status: item.status === "EXPIRED" ? "PUBLISHED" : item.status,
    pinned: item.pinned,
    requiresAck: item.requiresAck,
    startsAt: item.startsAt?.slice(0, 10) ?? "",
    expiresAt: item.expiresAt?.slice(0, 10) ?? "",
    targetRoles: item.targetRoles?.length ? item.targetRoles : [...commercialAllRoles],
    linksText: linksTextFor(item.links)
  };
}

export function AnnouncementsView({ user, initialSlug }: { user: CurrentUser; initialSlug?: string | null }) {
  const [items, setItems] = useState<AnnouncementItem[]>([]);
  const [selected, setSelected] = useState<AnnouncementItem | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [recent, setRecent] = useState("");
  const [page, setPage] = useState(1);
  const [draft, setDraft] = useState<AnnouncementDraft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canManage = (commercialManagerRoles as readonly string[]).includes(user.role);
  const pageSize = 8;

  async function openBySlug(slug: string) {
    const result = await api<{ announcement: AnnouncementItem }>(`/v1/announcements/by-slug/${encodeURIComponent(slug)}`);
    setSelected(result.announcement);
    if (canManage) {
      setEditingId(result.announcement.id);
      setDraft(draftFrom(result.announcement));
    }
  }

  async function load(nextSlug = selected?.slug ?? initialSlug ?? "") {
    setLoading(true);
    setError(null);
    const search = new URLSearchParams();
    if (query) search.set("query", query);
    if (status) search.set("status", status);
    if (priority) search.set("priority", priority);
    if (selectedTag) search.set("tags", selectedTag);
    if (recent) search.set("recent", recent);
    try {
      const result = await api<{ items: AnnouncementItem[]; total: number }>(`/v1/announcements?${search.toString()}`);
      setItems(result.items);
      setPage(1);
      const next = result.items.find((item) => item.slug === nextSlug) ?? result.items[0] ?? null;
      setSelected(next);
      if (canManage && next) {
        setEditingId(next.id);
        setDraft(draftFrom(next));
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Falha ao carregar avisos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (initialSlug) {
      setLoading(true);
      openBySlug(initialSlug).catch((caught) => setError(caught instanceof Error ? caught.message : "Falha ao abrir aviso.")).finally(() => setLoading(false));
      return;
    }
    void load();
  }, [initialSlug]);

  const tags = useMemo(() => [...new Set([...defaultTags, ...items.flatMap((item) => item.tags ?? [])])].sort((a, b) => a.localeCompare(b)), [items]);
  const paginatedItems = items.slice((page - 1) * pageSize, page * pageSize);
  const activeCount = items.filter((item) => item.status === "PUBLISHED").length;
  const ackPending = items.filter((item) => item.requiresAck && !item.readReceipts.some((receipt) => receipt.acknowledgedAt)).length;

  async function run(action: () => Promise<void>) {
    setSaving(true);
    setError(null);
    try {
      await action();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Falha ao salvar aviso.");
    } finally {
      setSaving(false);
    }
  }

  function payloadFromDraft() {
    return {
      title: draft.title,
      slug: draft.slug || null,
      summary: draft.summary || null,
      content: draft.content,
      tags: parseTags(draft.tags),
      links: parseLinksText(draft.linksText),
      targetRoles: draft.targetRoles,
      priority: draft.priority,
      status: draft.status,
      pinned: draft.pinned,
      requiresAck: draft.requiresAck,
      startsAt: draft.startsAt || null,
      expiresAt: draft.expiresAt || null
    };
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    await run(async () => {
      const endpoint = editingId ? `/v1/announcements/${editingId}` : "/v1/announcements";
      const method = editingId ? "PATCH" : "POST";
      const result = await api<{ announcement: AnnouncementItem }>(endpoint, { method, body: JSON.stringify(payloadFromDraft()) });
      await load(result.announcement.slug);
    });
  }

  async function publish() {
    if (!selected) return;
    await run(async () => {
      const result = await api<{ announcement: AnnouncementItem }>(`/v1/announcements/${selected.id}/publish`, { method: "POST" });
      await load(result.announcement.slug);
    });
  }

  async function archive() {
    if (!selected) return;
    await run(async () => {
      const result = await api<{ announcement: AnnouncementItem }>(`/v1/announcements/${selected.id}/archive`, { method: "POST" });
      await load(result.announcement.slug);
    });
  }

  async function acknowledge() {
    if (!selected) return;
    await run(async () => {
      await api(`/v1/announcements/${selected.id}/acknowledge`, { method: "POST" });
      await openBySlug(selected.slug);
    });
  }

  return (
    <div className="content-stack">
      <OperationalFilters
        fields={[
          { key: "query", label: "Busca", value: query, placeholder: "Titulo, resumo, conteudo ou tag", onChange: setQuery },
          { key: "status", label: "Status", value: status, type: "select", placeholder: "Todos", options: statusOptions, onChange: setStatus },
          { key: "priority", label: "Prioridade", value: priority, type: "select", placeholder: "Todas", options: priorityOptions, onChange: setPriority },
          { key: "tag", label: "Tag", value: selectedTag, type: "select", placeholder: "Todas", options: tags.map((tag) => ({ value: tag, label: `#${tag}` })), onChange: setSelectedTag },
          {
            key: "recent",
            label: "Recencia",
            value: recent,
            type: "select",
            placeholder: "Todas",
            options: [
              { value: "7", label: "7 dias" },
              { value: "30", label: "30 dias" }
            ],
            onChange: setRecent
          }
        ]}
        onSubmit={() => void load()}
      />
      {error ? <OperationalState state="error" title="Falha nos avisos" detail={error} /> : null}
      <section className="panel wiki-discovery-panel">
        <div className="wiki-discovery-summary">
          <div>
            <p className="eyebrow">Comunicados</p>
            <h2>Avisos do dia</h2>
            <p className="muted">Mudanças operacionais, prioridades e comunicados que precisam chegar antes da operação rodar.</p>
          </div>
          <div className="wiki-discovery-stats">
            <span>{activeCount} ativo(s)</span>
            <span>{ackPending} pendente(s) de ciencia</span>
            <span>{items.filter((item) => item.priority === "HIGH" || item.priority === "CRITICAL").length} importante(s)</span>
          </div>
        </div>
      </section>

      <div className="wiki-layout">
        <section className="panel table-panel">
          <div className="table-panel-toolbar">
            <div>
              <p className="eyebrow">Avisos</p>
              <h2>Lista</h2>
            </div>
            {canManage ? (
              <button className="secondary" type="button" onClick={() => { setEditingId(null); setDraft(emptyDraft()); }}>
                Novo aviso
              </button>
            ) : null}
          </div>
          {loading ? (
            <OperationalState state="loading" title="Carregando avisos" />
          ) : items.length === 0 ? (
            <OperationalState state="empty" title="Nenhum aviso encontrado" detail="Comunicados publicados aparecerão aqui." />
          ) : (
            <div className="wiki-page-list wiki-page-list-paginated">
              {paginatedItems.map((item) => (
                <button
                  className={selected?.id === item.id ? "wiki-page-button active" : "wiki-page-button"}
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setSelected(item);
                    if (canManage) {
                      setEditingId(item.id);
                      setDraft(draftFrom(item));
                    }
                  }}
                >
                  <strong>{item.pinned ? "Fixado · " : ""}{item.title}</strong>
                  <span>{priorityLabel(item.priority)} / {statusLabel(item.status)}</span>
                  {item.summary ? <small>{item.summary}</small> : null}
                  {item.tags?.length ? <small>{item.tags.map((tag) => `#${tag}`).join(" ")}</small> : null}
                </button>
              ))}
              <PaginationControls page={page} pageSize={pageSize} total={items.length} onPageChange={setPage} />
            </div>
          )}
        </section>

        <section className="panel wiki-reader-panel">
          {selected ? (
            <>
              <div className="detail-header">
                <div>
                  <p className="eyebrow">/{selected.slug}</p>
                  <h2>{selected.title}</h2>
                  <p className="muted">
                    {priorityLabel(selected.priority)} · {statusLabel(selected.status)}
                    {selected.publishedAt ? ` · publicado em ${formatDateBr(selected.publishedAt)}` : ""}
                  </p>
                </div>
                <div className="row-actions">
                  {selected.requiresAck && !selected.readReceipts.some((receipt) => receipt.acknowledgedAt) ? (
                    <button type="button" disabled={saving} onClick={() => void acknowledge()}>
                      Marcar ciência
                    </button>
                  ) : null}
                  {canManage ? (
                    <>
                      <button className="secondary" type="button" disabled={saving || selected.status === "PUBLISHED"} onClick={() => void publish()}>
                        Publicar
                      </button>
                      <button className="secondary" type="button" disabled={saving || selected.status === "ARCHIVED"} onClick={() => void archive()}>
                        Arquivar
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
              {selected.summary ? <p>{selected.summary}</p> : null}
              {selected.tags?.length ? (
                <div className="wiki-tag-row">
                  {selected.tags.map((tag) => (
                    <button key={tag} type="button" onClick={() => setSelectedTag(tag)}>
                      #{tag}
                    </button>
                  ))}
                </div>
              ) : null}
              <div className="knowledge-governance-strip">
                <span>Autor: {selected.createdBy.name}</span>
                <span>Atualizado por {selected.updatedBy.name}</span>
                {selected.expiresAt ? <span>Vigente ate {formatDateBr(selected.expiresAt)}</span> : <span>Sem expiração</span>}
                <span>{selected.targetRoles?.join(", ") || "Todos"}</span>
              </div>
              <MarkdownContent content={selected.content} />
              {selected.links?.length ? (
                <div className="wiki-related-panel">
                  <strong>Links relacionados</strong>
                  <div className="wiki-chip-list">
                    {selected.links.map((link) => (
                      <a className="announcement-link-chip" href={link.href} key={`${link.type}-${link.href}`}>
                        {link.label}
                        <small>{link.type}</small>
                      </a>
                    ))}
                  </div>
                </div>
              ) : null}
              {selected.requiresAck ? (
                <div className="wiki-meta-grid">
                  <div>
                    <strong>Ciência</strong>
                    <p>{selected.readReceipts.filter((receipt) => receipt.acknowledgedAt).length} registro(s)</p>
                  </div>
                  <div>
                    <strong>Status</strong>
                    <p>{selected.readReceipts.some((receipt) => receipt.acknowledgedAt) ? "Você já marcou ciência" : "Pendente para você"}</p>
                  </div>
                  <div>
                    <strong>Obrigatoriedade</strong>
                    <p>{selected.requiresAck ? "Exige ciência" : "Leitura simples"}</p>
                  </div>
                </div>
              ) : null}
            </>
          ) : (
            <OperationalState state="empty" title="Selecione um aviso" />
          )}
        </section>
      </div>

      {canManage ? (
        <section className="panel form-panel">
          <form onSubmit={save}>
            <div className="table-panel-toolbar">
              <div>
                <p className="eyebrow">Editor</p>
                <h2>{editingId ? "Editar aviso" : "Novo aviso"}</h2>
              </div>
            </div>
            <div className="form-grid">
              <label>
                Titulo
                <input value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} />
              </label>
              <label>
                Slug
                <input value={draft.slug} onChange={(event) => setDraft((current) => ({ ...current, slug: event.target.value }))} placeholder="aviso-do-dia" />
              </label>
              <label>
                Prioridade
                <select value={draft.priority} onChange={(event) => setDraft((current) => ({ ...current, priority: event.target.value }))}>
                  {priorityOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
              <label>
                Status
                <select value={draft.status} onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value }))}>
                  {statusOptions.slice(0, 3).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
              <label>
                Início
                <input type="date" value={draft.startsAt} onChange={(event) => setDraft((current) => ({ ...current, startsAt: event.target.value }))} />
              </label>
              <label>
                Expira em
                <input type="date" value={draft.expiresAt} onChange={(event) => setDraft((current) => ({ ...current, expiresAt: event.target.value }))} />
              </label>
              <label className="full-span">
                Resumo
                <input value={draft.summary} onChange={(event) => setDraft((current) => ({ ...current, summary: event.target.value }))} />
              </label>
              <div className="full-span">
                <MarkdownEditor
                  label="Conteudo"
                  rows={8}
                  value={draft.content}
                  onChange={(value) => setDraft((current) => ({ ...current, content: value }))}
                  onUploadImage={(file) => uploadWikiImage(file)}
                />
              </div>
              <label>
                Tags
                <input value={draft.tags} onChange={(event) => setDraft((current) => ({ ...current, tags: event.target.value }))} placeholder="vendas, processo" />
              </label>
              <label>
                Público
                <select
                  multiple
                  value={draft.targetRoles}
                  onChange={(event) => setDraft((current) => ({ ...current, targetRoles: Array.from(event.target.selectedOptions).map((option) => option.value as UserRole) }))}
                >
                  {commercialAllRoles.map((role) => <option key={role} value={role}>{role}</option>)}
                </select>
              </label>
              <label className="full-span">
                Links relacionados
                <textarea
                  rows={3}
                  value={draft.linksText}
                  onChange={(event) => setDraft((current) => ({ ...current, linksText: event.target.value }))}
                  placeholder="WIKI|Procedimento relacionado|/wiki/conferencia-de-danfe"
                />
              </label>
              <label className="checkbox-row">
                <input type="checkbox" checked={draft.pinned} onChange={(event) => setDraft((current) => ({ ...current, pinned: event.target.checked }))} />
                Fixar no topo
              </label>
              <label className="checkbox-row">
                <input type="checkbox" checked={draft.requiresAck} onChange={(event) => setDraft((current) => ({ ...current, requiresAck: event.target.checked }))} />
                Exigir ciência
              </label>
            </div>
            <div className="form-actions">
              <button disabled={saving || !draft.title.trim() || !draft.content.trim()}>Salvar aviso</button>
            </div>
          </form>
        </section>
      ) : null}
    </div>
  );
}
