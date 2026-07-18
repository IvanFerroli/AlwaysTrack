import { useEffect, useMemo, useState, type FormEvent } from "react";
import { commercialAllRoles, commercialManagerRoles, type CurrentUser, type UserRole } from "@alwaystrack/shared";
import { Archive as ArchiveIcon, CalendarClock, CirclePlus, History, X, XCircle } from "lucide-react";
import { api, uploadOperationalImage } from "../api";
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
  readReceipts: Array<{
    id: string;
    userId?: string;
    acknowledgedAt: string | null;
    user?: { id: string; name: string; email: string; role: string };
  }>;
  acknowledgement?: AnnouncementAcknowledgementCompliance | null;
}

interface AnnouncementAcknowledgementPerson {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AnnouncementAcknowledgementCompliance {
  audienceCount: number;
  acknowledgedCount: number;
  openedCount: number;
  pendingCount: number;
  completed: boolean;
  acknowledgedUsers: AnnouncementAcknowledgementPerson[];
  openedWithoutAckUsers: AnnouncementAcknowledgementPerson[];
  notOpenedUsers: AnnouncementAcknowledgementPerson[];
}

function AnnouncementCompliance({ compliance }: { compliance: AnnouncementAcknowledgementCompliance }) {
  const groups = [
    { label: `Cientes (${compliance.acknowledgedUsers.length})`, people: compliance.acknowledgedUsers, empty: "Nenhuma ciência registrada." },
    { label: `Abriram sem ciência (${compliance.openedWithoutAckUsers.length})`, people: compliance.openedWithoutAckUsers, empty: "Ninguém aguardando confirmação após abrir." },
    { label: `Não abriram (${compliance.notOpenedUsers.length})`, people: compliance.notOpenedUsers, empty: "Todos já abriram o aviso." }
  ];
  return <section className="announcement-detail-compliance" aria-labelledby="announcement-compliance-title">
    <div className="table-panel-toolbar">
      <div><strong id="announcement-compliance-title">Acompanhamento da ciência</strong><p className="muted">{compliance.acknowledgedCount} de {compliance.audienceCount} pessoas confirmaram.</p></div>
      <span className={compliance.completed ? "status-badge published" : "status-badge pending"}>{compliance.completed ? "Todos cientes" : `${compliance.pendingCount} pendente(s)`}</span>
    </div>
    <div className="announcement-compliance-grid">
      {groups.map((group) => <div className="announcement-compliance-people" key={group.label}>
        <strong>{group.label}</strong>
        {group.people.length ? <ul>{group.people.map((person) => <li key={person.id}><span>{person.name}</span><small>{person.role}</small></li>)}</ul> : <small>{group.empty}</small>}
      </div>)}
    </div>
  </section>;
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

interface AnnouncementSeriesVersionItem {
  id: string;
  version: number;
  effectiveFromDate: string;
  validFromDate: string;
  validToDate: string | null;
  recurrenceType: "MONTHLY_DAYS";
  recurrenceDays: number[];
  missingDayPolicy: "SKIP";
  timezone: string;
  localTime: string;
  durationMinutes: number;
  title: string;
  summary: string | null;
  content: string;
  targetRoles: UserRole[];
  priority: string;
  requiresAck: boolean;
}

interface AnnouncementOccurrenceItem {
  id: string;
  localDate: string;
  scheduledFor: string;
  expiresAt: string;
  status: string;
  cancellationReason: string | null;
  announcement: { id: string; slug: string; status: string; publishedAt: string | null };
}

interface AnnouncementSeriesItem {
  id: string;
  slug: string;
  status: string;
  archivedAt: string | null;
  versions: AnnouncementSeriesVersionItem[];
  occurrences: AnnouncementOccurrenceItem[];
}

interface AnnouncementSeriesDraft {
  title: string;
  summary: string;
  content: string;
  validFromDate: string;
  validToDate: string;
  effectiveFromDate: string;
  timezone: string;
  localTime: string;
  recurrenceDays: number[];
  priority: string;
  requiresAck: boolean;
  targetRoles: UserRole[];
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

function localDateInTimezone(value = new Date(), timezone = "America/Sao_Paulo") {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(value);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function addLocalDays(value: string, days: number) {
  const [year, month, day] = value.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + days));
  return `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}-${String(next.getUTCDate()).padStart(2, "0")}`;
}

function formatLocalDateBr(value: string) {
  const [year, month, day] = value.split("-");
  return year && month && day ? `${day}/${month}/${year}` : value;
}

function formatOccurrenceDate(value: string, timezone: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: timezone,
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

function latestSeriesVersion(series: AnnouncementSeriesItem) {
  return [...series.versions].sort((left, right) => right.version - left.version)[0];
}

function emptySeriesDraft(): AnnouncementSeriesDraft {
  const today = localDateInTimezone();
  return {
    title: "",
    summary: "",
    content: "",
    validFromDate: today,
    validToDate: "",
    effectiveFromDate: addLocalDays(today, 1),
    timezone: "America/Sao_Paulo",
    localTime: "09:00",
    recurrenceDays: [14, 29],
    priority: "NORMAL",
    requiresAck: false,
    targetRoles: [...commercialAllRoles]
  };
}

function seriesDraftFrom(series: AnnouncementSeriesItem): AnnouncementSeriesDraft {
  const version = latestSeriesVersion(series);
  const tomorrow = addLocalDays(localDateInTimezone(new Date(), version.timezone), 1);
  return {
    title: version.title,
    summary: version.summary ?? "",
    content: version.content,
    validFromDate: version.validFromDate,
    validToDate: version.validToDate ?? "",
    effectiveFromDate: version.effectiveFromDate > tomorrow ? version.effectiveFromDate : tomorrow,
    timezone: version.timezone,
    localTime: version.localTime,
    recurrenceDays: version.recurrenceDays,
    priority: version.priority,
    requiresAck: version.requiresAck,
    targetRoles: version.targetRoles?.length ? version.targetRoles : [...commercialAllRoles]
  };
}

function occurrenceStatusLabel(value: string) {
  return {
    SCHEDULED: "Agendada",
    PROCESSING: "Processando",
    PUBLISHED: "Publicada",
    CANCELLED: "Cancelada",
    EXPIRED: "Expirada",
    FAILED: "Aguardando nova tentativa"
  }[value] ?? value;
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

function receiptBelongsToUser(receipt: AnnouncementItem["readReceipts"][number], userId: string) {
  return receipt.userId === userId || receipt.user?.id === userId;
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
  const [seriesItems, setSeriesItems] = useState<AnnouncementSeriesItem[]>([]);
  const [seriesLoading, setSeriesLoading] = useState(false);
  const [seriesSaving, setSeriesSaving] = useState(false);
  const [seriesError, setSeriesError] = useState<string | null>(null);
  const [seriesNotice, setSeriesNotice] = useState<string | null>(null);
  const [seriesEditor, setSeriesEditor] = useState<{ mode: "create" } | { mode: "version"; seriesId: string } | null>(null);
  const [seriesDraft, setSeriesDraft] = useState<AnnouncementSeriesDraft>(emptySeriesDraft);
  const [cancelOccurrenceId, setCancelOccurrenceId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [archiveSeriesId, setArchiveSeriesId] = useState<string | null>(null);
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

  async function loadSeries() {
    if (!canManage) return;
    setSeriesLoading(true);
    setSeriesError(null);
    try {
      const result = await api<{ items: AnnouncementSeriesItem[]; total: number }>("/v1/announcements/series");
      setSeriesItems(result.items);
    } catch (caught) {
      setSeriesError(caught instanceof Error ? caught.message : "Falha ao carregar recorrências.");
    } finally {
      setSeriesLoading(false);
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

  useEffect(() => {
    if (canManage) void loadSeries();
  }, [canManage]);

  const tags = useMemo(() => [...new Set([...defaultTags, ...items.flatMap((item) => item.tags ?? [])])].sort((a, b) => a.localeCompare(b)), [items]);
  const paginatedItems = items.slice((page - 1) * pageSize, page * pageSize);
  const cancellationOccurrence = useMemo(
    () => seriesItems.flatMap((series) => series.occurrences).find((occurrence) => occurrence.id === cancelOccurrenceId) ?? null,
    [cancelOccurrenceId, seriesItems]
  );
  const versionSeries = seriesEditor?.mode === "version" ? seriesItems.find((series) => series.id === seriesEditor.seriesId) ?? null : null;
  const activeCount = items.filter((item) => item.status === "PUBLISHED").length;
  const ackPending = items.filter((item) => item.status === "PUBLISHED" && item.requiresAck && item.targetRoles?.includes(user.role) && !item.readReceipts.some(
    (receipt) => receiptBelongsToUser(receipt, user.id) && receipt.acknowledgedAt
  )).length;
  const currentUserIsTarget = selected?.targetRoles?.includes(user.role) ?? false;
  const currentUserAcknowledged = selected?.readReceipts.some(
    (receipt) => receiptBelongsToUser(receipt, user.id) && receipt.acknowledgedAt
  ) ?? false;

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

  async function runSeries(action: () => Promise<void>) {
    setSeriesSaving(true);
    setSeriesError(null);
    setSeriesNotice(null);
    try {
      await action();
    } catch (caught) {
      setSeriesError(caught instanceof Error ? caught.message : "Falha ao salvar recorrência.");
    } finally {
      setSeriesSaving(false);
    }
  }

  function seriesPayload() {
    return {
      title: seriesDraft.title,
      summary: seriesDraft.summary || null,
      content: seriesDraft.content,
      validFromDate: seriesDraft.validFromDate,
      validToDate: seriesDraft.validToDate || null,
      timezone: seriesDraft.timezone,
      localTime: seriesDraft.localTime,
      recurrenceDays: seriesDraft.recurrenceDays,
      missingDayPolicy: "SKIP",
      durationMinutes: 1440,
      priority: seriesDraft.priority,
      requiresAck: seriesDraft.requiresAck,
      targetRoles: seriesDraft.targetRoles
    };
  }

  function openSeriesCreator() {
    setSeriesDraft(emptySeriesDraft());
    setSeriesEditor({ mode: "create" });
    setSeriesNotice(null);
  }

  function openFutureVersion(series: AnnouncementSeriesItem) {
    setSeriesDraft(seriesDraftFrom(series));
    setSeriesEditor({ mode: "version", seriesId: series.id });
    setSeriesNotice(null);
  }

  function toggleRecurrenceDay(day: number, checked: boolean) {
    setSeriesDraft((current) => ({
      ...current,
      recurrenceDays: checked
        ? [...new Set([...current.recurrenceDays, day])].sort((left, right) => left - right)
        : current.recurrenceDays.filter((item) => item !== day)
    }));
  }

  async function saveSeries(event: FormEvent) {
    event.preventDefault();
    await runSeries(async () => {
      let notice: string;
      if (seriesEditor?.mode === "version") {
        await api(`/v1/announcements/series/${seriesEditor.seriesId}/versions`, {
          method: "POST",
          body: JSON.stringify({ ...seriesPayload(), effectiveFromDate: seriesDraft.effectiveFromDate })
        });
        notice = "Versão futura criada. Ocorrências anteriores permanecem preservadas.";
      } else {
        await api("/v1/announcements/series", { method: "POST", body: JSON.stringify(seriesPayload()) });
        notice = "Série mensal criada para os dias selecionados.";
      }
      await api("/v1/announcements/materialize", {
        method: "POST",
        body: JSON.stringify({ horizonDays: 62, catchUpDays: 0, publishDue: false })
      });
      setSeriesNotice(notice);
      setSeriesEditor(null);
      await loadSeries();
    });
  }

  async function archiveSeries(series: AnnouncementSeriesItem) {
    await runSeries(async () => {
      await api(`/v1/announcements/series/${series.id}/archive`, {
        method: "POST",
        body: JSON.stringify({ reason: "Série arquivada pela gestão no painel de avisos." })
      });
      setArchiveSeriesId(null);
      setSeriesNotice(`Série “${latestSeriesVersion(series).title}” arquivada.`);
      await loadSeries();
    });
  }

  async function cancelOccurrence(event: FormEvent) {
    event.preventDefault();
    if (!cancelOccurrenceId) return;
    await runSeries(async () => {
      await api(`/v1/announcements/occurrences/${cancelOccurrenceId}/cancel`, {
        method: "POST",
        body: JSON.stringify({ reason: cancelReason })
      });
      setCancelOccurrenceId(null);
      setCancelReason("");
      setSeriesNotice("Ocorrência futura cancelada; o histórico da série foi mantido.");
      await loadSeries();
    });
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

      {canManage ? (
        <section className="panel table-panel" aria-labelledby="announcement-series-title">
          <div className="table-panel-toolbar">
            <div>
              <p className="eyebrow">Programação mensal</p>
              <h2 id="announcement-series-title">Avisos recorrentes</h2>
              <p className="muted" id="announcement-recurrence-february-note">
                Nos anos em que fevereiro não tem dia 29, essa ocorrência é pulada; ela não muda para outro dia.
              </p>
            </div>
            <button className="secondary" type="button" disabled={seriesSaving} onClick={openSeriesCreator}>
              <CirclePlus aria-hidden="true" size={16} /> Nova série
            </button>
          </div>

          {seriesNotice ? <p className="support-notice" role="status">{seriesNotice}</p> : null}
          {seriesError ? <p className="error" role="alert">{seriesError}</p> : null}

          {seriesLoading ? (
            <OperationalState state="loading" title="Carregando recorrências" />
          ) : seriesItems.length === 0 ? (
            <OperationalState state="empty" title="Nenhuma série recorrente" detail="Crie uma série mensal para programar os próximos avisos." />
          ) : (
            <div className="table-scroll">
              <table aria-label="Séries de avisos recorrentes">
                <thead>
                  <tr>
                    <th scope="col">Série</th>
                    <th scope="col">Agenda</th>
                    <th scope="col">Vigência</th>
                    <th scope="col">Próximas ocorrências</th>
                    <th scope="col">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {seriesItems.map((series) => {
                    const version = latestSeriesVersion(series);
                    const upcoming = series.occurrences
                      .filter((occurrence) => new Date(occurrence.scheduledFor).getTime() > Date.now() && !["CANCELLED", "EXPIRED"].includes(occurrence.status))
                      .sort((left, right) => left.scheduledFor.localeCompare(right.scheduledFor))
                      .slice(0, 3);
                    return (
                      <tr key={series.id}>
                        <td>
                          <strong>{version.title}</strong>
                          <small>/{series.slug} · versão {version.version}</small>
                          <span className={series.status === "ACTIVE" ? "status-badge published" : "status-badge archived"}>
                            {series.status === "ACTIVE" ? "Ativa" : "Arquivada"}
                          </span>
                        </td>
                        <td>
                          <strong>Dias {version.recurrenceDays.join(" e ")}</strong>
                          <small>{version.localTime} · {version.timezone}</small>
                        </td>
                        <td>
                          {formatLocalDateBr(version.validFromDate)}
                          <small>{version.validToDate ? `até ${formatLocalDateBr(version.validToDate)}` : "sem data final"}</small>
                        </td>
                        <td>
                          {upcoming.length ? (
                            <ul aria-label={`Próximas ocorrências de ${version.title}`}>
                              {upcoming.map((occurrence) => (
                                <li key={occurrence.id}>
                                  <time dateTime={occurrence.scheduledFor}>{formatOccurrenceDate(occurrence.scheduledFor, version.timezone)}</time>
                                  <small>{occurrenceStatusLabel(occurrence.status)}</small>
                                  {series.status === "ACTIVE" ? (
                                    <button
                                      className="secondary small"
                                      type="button"
                                      disabled={seriesSaving}
                                      onClick={() => { setCancelOccurrenceId(occurrence.id); setCancelReason(""); }}
                                    >
                                      <XCircle aria-hidden="true" size={14} /> Cancelar ocorrência de {formatLocalDateBr(occurrence.localDate)}
                                    </button>
                                  ) : null}
                                </li>
                              ))}
                            </ul>
                          ) : <span className="muted">Nenhuma ocorrência futura materializada.</span>}
                        </td>
                        <td>
                          {series.status === "ACTIVE" ? (
                            <div className="row-actions">
                              <button className="secondary small" type="button" disabled={seriesSaving} onClick={() => openFutureVersion(series)}>
                                <History aria-hidden="true" size={15} /> Nova versão
                              </button>
                              {archiveSeriesId === series.id ? (
                                <div className="row-actions" role="group" aria-label={`Confirmar arquivamento de ${version.title}`}>
                                  <button className="small" type="button" disabled={seriesSaving} onClick={() => void archiveSeries(series)}>
                                    Confirmar arquivamento
                                  </button>
                                  <button className="secondary small" type="button" disabled={seriesSaving} onClick={() => setArchiveSeriesId(null)}>
                                    Voltar
                                  </button>
                                </div>
                              ) : (
                                <button className="secondary small" type="button" disabled={seriesSaving} onClick={() => setArchiveSeriesId(series.id)}>
                                  <ArchiveIcon aria-hidden="true" size={15} /> Arquivar série
                                </button>
                              )}
                            </div>
                          ) : <span className="muted">Somente histórico</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {cancelOccurrenceId ? (
            <form aria-labelledby="announcement-occurrence-cancel-title" onSubmit={cancelOccurrence}>
              <div className="table-panel-toolbar">
                <div>
                  <p className="eyebrow">Exceção auditada</p>
                  <h3 id="announcement-occurrence-cancel-title">
                    Cancelar ocorrência{cancellationOccurrence ? ` de ${formatLocalDateBr(cancellationOccurrence.localDate)}` : ""}
                  </h3>
                </div>
                <button className="secondary small" type="button" onClick={() => { setCancelOccurrenceId(null); setCancelReason(""); }}>
                  <X aria-hidden="true" size={15} /> Fechar
                </button>
              </div>
              <div className="form-grid">
                <label className="full-span">
                  Motivo do cancelamento
                  <textarea
                    required
                    minLength={3}
                    maxLength={500}
                    rows={2}
                    value={cancelReason}
                    onChange={(event) => setCancelReason(event.target.value)}
                    placeholder="Descreva por que esta data deve ser pulada"
                  />
                </label>
              </div>
              <div className="form-actions">
                <button disabled={seriesSaving || cancelReason.trim().length < 3}>
                  <XCircle aria-hidden="true" size={16} /> Confirmar cancelamento
                </button>
              </div>
            </form>
          ) : null}

          {seriesEditor ? (
            <form aria-labelledby="announcement-series-form-title" onSubmit={saveSeries}>
              <div className="table-panel-toolbar">
                <div>
                  <p className="eyebrow">{seriesEditor.mode === "version" ? "Mudança futura" : "Nova programação"}</p>
                  <h3 id="announcement-series-form-title">
                    {seriesEditor.mode === "version" && versionSeries ? `Nova versão de ${latestSeriesVersion(versionSeries).title}` : "Criar série mensal"}
                  </h3>
                </div>
                <button className="secondary small" type="button" onClick={() => setSeriesEditor(null)}>
                  <X aria-hidden="true" size={15} /> Fechar
                </button>
              </div>
              <div className="form-grid">
                <label>
                  Título
                  <input required maxLength={140} value={seriesDraft.title} onChange={(event) => setSeriesDraft((current) => ({ ...current, title: event.target.value }))} />
                </label>
                <label>
                  Prioridade
                  <select value={seriesDraft.priority} onChange={(event) => setSeriesDraft((current) => ({ ...current, priority: event.target.value }))}>
                    {priorityOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </label>
                {seriesEditor.mode === "version" ? (
                  <label>
                    Aplicar a partir de
                    <input
                      required
                      min={addLocalDays(localDateInTimezone(new Date(), seriesDraft.timezone), 1)}
                      type="date"
                      value={seriesDraft.effectiveFromDate}
                      onChange={(event) => setSeriesDraft((current) => ({ ...current, effectiveFromDate: event.target.value }))}
                    />
                  </label>
                ) : null}
                <label>
                  Início da vigência
                  <input required type="date" value={seriesDraft.validFromDate} onChange={(event) => setSeriesDraft((current) => ({ ...current, validFromDate: event.target.value }))} />
                </label>
                <label>
                  Fim da vigência
                  <input min={seriesEditor.mode === "version" ? seriesDraft.effectiveFromDate : seriesDraft.validFromDate} type="date" value={seriesDraft.validToDate} onChange={(event) => setSeriesDraft((current) => ({ ...current, validToDate: event.target.value }))} />
                </label>
                <label>
                  Horário local
                  <input required type="time" value={seriesDraft.localTime} onChange={(event) => setSeriesDraft((current) => ({ ...current, localTime: event.target.value }))} />
                </label>
                <label>
                  Timezone
                  <select value={seriesDraft.timezone} onChange={(event) => setSeriesDraft((current) => ({ ...current, timezone: event.target.value }))}>
                    <option value="America/Sao_Paulo">America/Sao_Paulo</option>
                    <option value="America/Recife">America/Recife</option>
                    <option value="America/Manaus">America/Manaus</option>
                    <option value="UTC">UTC</option>
                  </select>
                </label>
                <fieldset className="full-span" aria-describedby="announcement-recurrence-february-note">
                  <legend>Dias do mês</legend>
                  <div className="row-actions">
                    {[14, 29].map((day) => (
                      <label className="checkbox-row" key={day}>
                        <input
                          type="checkbox"
                          checked={seriesDraft.recurrenceDays.includes(day)}
                          onChange={(event) => toggleRecurrenceDay(day, event.target.checked)}
                        />
                        Dia {day}
                      </label>
                    ))}
                  </div>
                </fieldset>
                <label className="full-span">
                  Resumo
                  <input maxLength={240} value={seriesDraft.summary} onChange={(event) => setSeriesDraft((current) => ({ ...current, summary: event.target.value }))} />
                </label>
                <label className="full-span">
                  Conteúdo da série
                  <textarea
                    required
                    maxLength={20_000}
                    rows={5}
                    value={seriesDraft.content}
                    onChange={(event) => setSeriesDraft((current) => ({ ...current, content: event.target.value }))}
                  />
                </label>
                <label>
                  Público
                  <select
                    multiple
                    value={seriesDraft.targetRoles}
                    onChange={(event) => setSeriesDraft((current) => ({ ...current, targetRoles: Array.from(event.target.selectedOptions).map((option) => option.value as UserRole) }))}
                  >
                    {commercialAllRoles.map((role) => <option key={role} value={role}>{role}</option>)}
                  </select>
                </label>
                <label className="checkbox-row">
                  <input type="checkbox" checked={seriesDraft.requiresAck} onChange={(event) => setSeriesDraft((current) => ({ ...current, requiresAck: event.target.checked }))} />
                  Exigir ciência em cada ocorrência
                </label>
              </div>
              <div className="form-actions">
                <button disabled={seriesSaving || !seriesDraft.title.trim() || !seriesDraft.content.trim() || seriesDraft.recurrenceDays.length === 0}>
                  <CalendarClock aria-hidden="true" size={16} /> {seriesEditor.mode === "version" ? "Criar versão futura" : "Criar série"}
                </button>
              </div>
            </form>
          ) : null}
        </section>
      ) : null}

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
                  onClick={() => void openBySlug(item.slug).catch((caught) => setError(caught instanceof Error ? caught.message : "Falha ao abrir aviso."))}
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
                  {selected.status === "PUBLISHED" && selected.requiresAck && currentUserIsTarget && !currentUserAcknowledged ? (
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
                <><div className="wiki-meta-grid">
                  {canManage ? (
                    <div>
                      <strong>Ciência</strong>
                      <p>{selected.readReceipts.filter((receipt) => receipt.acknowledgedAt).length} registro(s)</p>
                    </div>
                  ) : null}
                  <div>
                    <strong>Status</strong>
                    <p>{!currentUserIsTarget ? "Acompanhamento gerencial" : currentUserAcknowledged ? "Você já marcou ciência" : "Pendente para você"}</p>
                  </div>
                  <div>
                    <strong>Obrigatoriedade</strong>
                    <p>{selected.requiresAck ? "Exige ciência" : "Leitura simples"}</p>
                  </div>
                </div>
                {canManage && selected.acknowledgement ? <AnnouncementCompliance compliance={selected.acknowledgement} /> : null}</>
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
                  onUploadImage={(file) => uploadOperationalImage(file, "announcement", selected?.id)}
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
