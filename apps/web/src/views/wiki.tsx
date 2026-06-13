import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import type { CurrentUser } from "@alwaystrack/shared";
import { api, uploadWikiImage } from "../api";
import { InfoTip, OperationalFilters, OperationalState, OperationalTable, PaginationControls } from "../components/operational";
import { formatDateBr } from "../sales";

interface WikiUserRef {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface WikiPageSummary {
  id: string;
  slug: string;
  title: string;
  content: string;
  contentFormat?: "MARKDOWN";
  tags?: string[];
  version: number;
  active: boolean;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
  updatedBy: WikiUserRef;
  editRequests: Array<{ id: string; authorId: string; createdAt: string }>;
}

interface WikiEditRequestItem {
  id: string;
  pageId: string;
  authorId: string;
  reviewerId: string | null;
  baseVersion: number;
  title: string;
  content: string;
  contentFormat?: "MARKDOWN";
  tags?: string[];
  status: "PENDING" | "APPROVED" | "REJECTED";
  decisionNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  page: { id: string; slug: string; title: string; version: number; content?: string };
  author: WikiUserRef;
  reviewer: WikiUserRef | null;
  review?: {
    currentVersion?: number;
    currentContent?: string;
    baseVersion?: number;
    baseTitle?: string;
    baseContent?: string;
    baseAvailable?: boolean;
  };
}

interface WikiPageDetail extends WikiPageSummary {
  readReceipts: Array<{ id: string; lastReadAt: string; user: WikiUserRef }>;
  presences: Array<{ id: string; mode: "READING" | "EDITING"; lastSeenAt: string; user: WikiUserRef }>;
  revisions: Array<{ id: string; version: number; title: string; content: string; contentFormat?: "MARKDOWN"; createdAt: string; author: WikiUserRef }>;
  editRequests: WikiEditRequestItem[];
}

const defaultKnowledgeTags = ["vendas", "notas", "processo", "treinamento", "sac", "ranking", "campanhas"];

function wikiChangeSummary(before: string, after: string) {
  const beforeLines = before.split(/\r?\n/);
  const afterLines = after.split(/\r?\n/);
  const max = Math.max(beforeLines.length, afterLines.length);
  let changed = 0;
  for (let index = 0; index < max; index += 1) {
    if ((beforeLines[index] ?? "") !== (afterLines[index] ?? "")) changed += 1;
  }
  const delta = after.length - before.length;
  const deltaLabel = delta === 0 ? "mesmo tamanho" : delta > 0 ? `+${delta} caracteres` : `${delta} caracteres`;
  return `${changed} linha(s) alterada(s), ${deltaLabel}`;
}

function extractWikiTags(content: string) {
  const tags = new Set<string>();
  for (const match of content.matchAll(/(^|\s)#([a-z0-9][a-z0-9_-]{1,32})/gi)) {
    tags.add(match[2].toLowerCase());
  }
  return [...tags].sort((a, b) => a.localeCompare(b));
}

function wikiTagsFor(item: { content: string; tags?: string[] }) {
  return item.tags?.length ? item.tags : extractWikiTags(item.content);
}

function faqSourceThreadId(content: string) {
  return content.match(/Fonte:\s*FAQ interna,\s*thread\s+([a-z0-9_-]+)/i)?.[1] ?? null;
}

function validatedByLabel(page: WikiPageDetail) {
  const revision = page.revisions.find((item) => item.version === page.version) ?? page.revisions[0];
  const author = revision?.author ?? page.updatedBy;
  return `${author.name} (${author.role})`;
}

function tagsText(value: string[]) {
  return value.join(", ");
}

function parseTagsText(value: string) {
  return [...new Set(value.split(",").map((tag) => tag.trim().replace(/^#/, "").toLowerCase()).filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function wikiLineDiff(before: string, after: string) {
  const beforeLines = before.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const afterLines = after.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const beforeSet = new Set(beforeLines);
  const afterSet = new Set(afterLines);
  return {
    added: afterLines.filter((line) => !beforeSet.has(line)).slice(0, 8),
    removed: beforeLines.filter((line) => !afterSet.has(line)).slice(0, 8),
    unchanged: afterLines.filter((line) => beforeSet.has(line)).length
  };
}

function wikiImageRefs(content: string) {
  return [...content.matchAll(/!\[([^\]]*)\]\(([^)]+)\)/g)].map((match) => ({
    alt: match[1] || "imagem",
    src: match[2]
  }));
}

function WikiChangeDigest({ before, after }: { before: string; after: string }) {
  const diff = wikiLineDiff(before, after);
  const beforeImages = wikiImageRefs(before);
  const afterImages = wikiImageRefs(after);
  const beforeImageKeys = new Set(beforeImages.map((image) => image.src));
  const afterImageKeys = new Set(afterImages.map((image) => image.src));
  const addedImages = afterImages.filter((image) => !beforeImageKeys.has(image.src));
  const removedImages = beforeImages.filter((image) => !afterImageKeys.has(image.src));
  return (
    <div className="wiki-change-digest">
      <div>
        <strong>Adicoes</strong>
        {diff.added.length ? diff.added.map((line, index) => <p key={index}>+ {line}</p>) : <p className="muted">Sem linhas novas detectadas.</p>}
      </div>
      <div>
        <strong>Remocoes</strong>
        {diff.removed.length ? diff.removed.map((line, index) => <p key={index}>- {line}</p>) : <p className="muted">Sem linhas removidas detectadas.</p>}
      </div>
      <div>
        <strong>Imagens</strong>
        {addedImages.length ? addedImages.map((image, index) => <p key={`add-${index}`}>+ {image.alt}</p>) : null}
        {removedImages.length ? removedImages.map((image, index) => <p key={`remove-${index}`}>- {image.alt}</p>) : null}
        {!addedImages.length && !removedImages.length ? <p className="muted">Sem mudancas de imagem.</p> : null}
      </div>
      <small>{diff.unchanged} linha(s) preservada(s) na proposta.</small>
    </div>
  );
}

function wikiReviewBaseContent(request: WikiEditRequestItem, selected?: WikiPageDetail | null) {
  if (request.review?.baseContent) return request.review.baseContent;
  const selectedRevision = selected?.id === request.pageId ? selected.revisions.find((revision) => revision.version === request.baseVersion) : null;
  if (selectedRevision?.content) return selectedRevision.content;
  if ((request.review?.currentVersion ?? request.page.version) === request.baseVersion) return request.review?.currentContent ?? request.page.content ?? "";
  return "";
}

function WikiReviewSnapshot({ label, version, content, emptyDetail }: { label: string; version?: number; content?: string; emptyDetail?: string }) {
  return (
    <div className="wiki-review-snapshot">
      <strong>{version ? `${label} v${version}` : label}</strong>
      {content ? <WikiMarkdownContent content={content} /> : <OperationalState state="empty" title={emptyDetail ?? "Conteudo indisponivel"} />}
    </div>
  );
}

function WikiRequestReviewPanel({ request, selected }: { request: WikiEditRequestItem; selected?: WikiPageDetail | null }) {
  const currentContent = request.review?.currentContent ?? request.page.content ?? (selected?.id === request.pageId ? selected.content : "");
  const currentVersion = request.review?.currentVersion ?? request.page.version;
  const baseContent = wikiReviewBaseContent(request, selected);
  const hasConflict = currentVersion !== request.baseVersion;

  return (
    <div className="wiki-request-review-panel">
      <div className="wiki-request-review-main">
        <div>
          <p className="muted">{wikiChangeSummary(baseContent || currentContent, request.content)}</p>
          <WikiChangeDigest before={baseContent || currentContent} after={request.content} />
        </div>
        {!baseContent ? (
          <OperationalState
            state="error"
            title="Base nao encontrada no historico carregado"
            detail="A proposta ainda pode ser revisada pela versao atual e pela previa, mas a comparacao da base original ficou limitada."
          />
        ) : null}
      </div>
      <div className={hasConflict ? "wiki-review-grid three" : "wiki-review-grid"}>
        {hasConflict ? (
          <WikiReviewSnapshot
            label="Publicada atual"
            version={currentVersion}
            content={currentContent}
            emptyDetail="Nao foi possivel carregar a versao atual desta pagina."
          />
        ) : null}
        <WikiReviewSnapshot
          label={hasConflict ? "Base da proposta" : "Publicada/base"}
          version={request.baseVersion}
          content={baseContent}
          emptyDetail="A base original nao esta disponivel no pacote de revisao."
        />
        <WikiReviewSnapshot label="Proposta" content={request.content} />
      </div>
    </div>
  );
}

function isRecentlyUpdated(value: string) {
  const updatedAt = new Date(value).getTime();
  if (Number.isNaN(updatedAt)) return false;
  return Date.now() - updatedAt <= 7 * 24 * 60 * 60 * 1000;
}

function safeWikiUrl(value: string) {
  const trimmed = value.trim();
  if (/^(https?:|mailto:|tel:)/i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("/")) return trimmed;
  return "#";
}

function renderWikiInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /(!?\[([^\]]+)\]\(([^)]+)\)|`([^`]+)`|\*\*([^*]+)\*\*|\*([^*]+)\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text))) {
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index));
    const key = `${match.index}-${match[0]}`;
    if (match[1]?.startsWith("!")) {
      const src = safeWikiUrl(match[3] ?? "");
      nodes.push(src === "#" ? match[2] : <img key={key} alt={match[2]} src={src} />);
    } else if (match[2] && match[3]) {
      const href = safeWikiUrl(match[3]);
      nodes.push(
        <a key={key} href={href} rel="noreferrer noopener" target={href.startsWith("http") ? "_blank" : undefined}>
          {match[2]}
        </a>
      );
    } else if (match[4]) {
      nodes.push(<code key={key}>{match[4]}</code>);
    } else if (match[5]) {
      nodes.push(<strong key={key}>{match[5]}</strong>);
    } else if (match[6]) {
      nodes.push(<em key={key}>{match[6]}</em>);
    }
    lastIndex = pattern.lastIndex;
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

function WikiMarkdownContent({ content }: { content: string }) {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const nodes: ReactNode[] = [];
  let index = 0;
  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) {
      index += 1;
      continue;
    }
    if (/^---+$/.test(line.trim())) {
      nodes.push(<hr key={index} />);
      index += 1;
      continue;
    }
    if (/^```/.test(line.trim())) {
      const start = index;
      const code: string[] = [];
      index += 1;
      while (index < lines.length && !/^```/.test(lines[index].trim())) {
        code.push(lines[index]);
        index += 1;
      }
      if (index < lines.length) index += 1;
      nodes.push(
        <pre key={start}>
          <code>{code.join("\n")}</code>
        </pre>
      );
      continue;
    }
    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      const level = heading[1].length;
      const children = renderWikiInline(heading[2]);
      nodes.push(level === 1 ? <h1 key={index}>{children}</h1> : level === 2 ? <h2 key={index}>{children}</h2> : <h3 key={index}>{children}</h3>);
      index += 1;
      continue;
    }
    if (/^>\s+/.test(line)) {
      const start = index;
      const quote: string[] = [];
      while (index < lines.length && /^>\s+/.test(lines[index])) {
        quote.push(lines[index].replace(/^>\s+/, ""));
        index += 1;
      }
      nodes.push(<blockquote key={start}>{quote.map((item, itemIndex) => <p key={itemIndex}>{renderWikiInline(item)}</p>)}</blockquote>);
      continue;
    }
    if (/^[-*]\s+/.test(line) || /^-\s+\[[ xX]\]\s+/.test(line)) {
      const start = index;
      const items: ReactNode[] = [];
      while (index < lines.length && (/^[-*]\s+/.test(lines[index]) || /^-\s+\[[ xX]\]\s+/.test(lines[index]))) {
        const checkbox = lines[index].match(/^-\s+\[([ xX])\]\s+(.+)$/);
        if (checkbox) {
          items.push(
            <li key={index} className="wiki-check-item">
              <input checked={checkbox[1].toLowerCase() === "x"} readOnly type="checkbox" />
              <span>{renderWikiInline(checkbox[2])}</span>
            </li>
          );
        } else {
          items.push(<li key={index}>{renderWikiInline(lines[index].replace(/^[-*]\s+/, ""))}</li>);
        }
        index += 1;
      }
      nodes.push(<ul key={start}>{items}</ul>);
      continue;
    }
    if (/^\d+\.\s+/.test(line)) {
      const start = index;
      const items: ReactNode[] = [];
      while (index < lines.length && /^\d+\.\s+/.test(lines[index])) {
        items.push(<li key={index}>{renderWikiInline(lines[index].replace(/^\d+\.\s+/, ""))}</li>);
        index += 1;
      }
      nodes.push(<ol key={start}>{items}</ol>);
      continue;
    }
    if (/^\|.+\|$/.test(line) && index + 1 < lines.length && /^\|?[-:\s|]+\|?$/.test(lines[index + 1])) {
      const start = index;
      const headers = line.split("|").slice(1, -1).map((cell) => cell.trim());
      index += 2;
      const rows: string[][] = [];
      while (index < lines.length && /^\|.+\|$/.test(lines[index])) {
        rows.push(lines[index].split("|").slice(1, -1).map((cell) => cell.trim()));
        index += 1;
      }
      nodes.push(
        <div className="wiki-table-wrap" key={start}>
          <table>
            <thead>
              <tr>{headers.map((header, cellIndex) => <th key={cellIndex}>{renderWikiInline(header)}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={cellIndex}>{renderWikiInline(cell)}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }
    const start = index;
    const paragraph: string[] = [];
    while (index < lines.length && lines[index].trim() && !/^(#{1,3})\s+|^```|^>\s+|^[-*]\s+|^-\s+\[[ xX]\]\s+|^\d+\.\s+|^\|.+\|$|^---+$/.test(lines[index])) {
      paragraph.push(lines[index]);
      index += 1;
    }
    nodes.push(<p key={start}>{renderWikiInline(paragraph.join(" "))}</p>);
  }
  return <div className="wiki-content">{nodes.length ? nodes : <p className="muted">Sem conteudo publicado.</p>}</div>;
}

function applyWikiMarkdownFormat(value: string, selectionStart: number, selectionEnd: number, format: string) {
  const selected = value.slice(selectionStart, selectionEnd);
  const lineStart = value.lastIndexOf("\n", selectionStart - 1) + 1;
  const lineEnd = value.indexOf("\n", selectionEnd);
  const blockEnd = lineEnd === -1 ? value.length : lineEnd;
  const block = value.slice(lineStart, blockEnd);
  const replaceSelection = (next: string) => ({ nextValue: `${value.slice(0, selectionStart)}${next}${value.slice(selectionEnd)}`, cursor: selectionStart + next.length });
  const replaceBlock = (next: string) => ({ nextValue: `${value.slice(0, lineStart)}${next}${value.slice(blockEnd)}`, cursor: lineStart + next.length });

  if (format === "bold") return replaceSelection(`**${selected || "texto"}**`);
  if (format === "italic") return replaceSelection(`*${selected || "texto"}*`);
  if (format === "code") return replaceSelection(`\`${selected || "codigo"}\``);
  if (format === "link") return replaceSelection(`[${selected || "texto"}](https://exemplo.com)`);
  if (format === "h2") return replaceBlock(`## ${block || "Secao"}`);
  if (format === "h3") return replaceBlock(`### ${block || "Subsecao"}`);
  if (format === "quote") return replaceBlock(block.split("\n").map((line) => `> ${line || "citacao"}`).join("\n"));
  if (format === "ul") return replaceBlock(block.split("\n").map((line) => `- ${line || "item"}`).join("\n"));
  if (format === "ol") return replaceBlock(block.split("\n").map((line, lineIndex) => `${lineIndex + 1}. ${line || "item"}`).join("\n"));
  if (format === "check") return replaceBlock(block.split("\n").map((line) => `- [ ] ${line || "tarefa"}`).join("\n"));
  if (format === "table") return replaceSelection(`| Coluna A | Coluna B |\n| --- | --- |\n| ${selected || "valor"} | detalhe |`);
  if (format === "hr") return replaceSelection(`${selected ? `${selected}\n` : ""}---`);
  return { nextValue: value, cursor: selectionEnd };
}

function WikiMarkdownEditor({
  label,
  value,
  onChange,
  onUploadImage,
  rows = 10
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onUploadImage?: (file: File) => Promise<string>;
  rows?: number;
}) {
  const ref = useRef<HTMLTextAreaElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const [preview, setPreview] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  function format(type: string) {
    const textarea = ref.current;
    if (!textarea) return;
    const result = applyWikiMarkdownFormat(value, textarea.selectionStart, textarea.selectionEnd, type);
    onChange(result.nextValue);
    window.requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(result.cursor, result.cursor);
    });
  }

  async function uploadImage(file: File | undefined) {
    if (!file || !onUploadImage) return;
    setUploadingImage(true);
    try {
      const markdown = await onUploadImage(file);
      const textarea = ref.current;
      const selectionStart = textarea?.selectionStart ?? value.length;
      const selectionEnd = textarea?.selectionEnd ?? value.length;
      const prefix = selectionStart > 0 && value[selectionStart - 1] !== "\n" ? "\n" : "";
      const suffix = selectionEnd < value.length && value[selectionEnd] !== "\n" ? "\n" : "";
      const nextValue = `${value.slice(0, selectionStart)}${prefix}${markdown}${suffix}${value.slice(selectionEnd)}`;
      onChange(nextValue);
      window.requestAnimationFrame(() => {
        textarea?.focus();
        const cursor = selectionStart + prefix.length + markdown.length + suffix.length;
        textarea?.setSelectionRange(cursor, cursor);
      });
    } finally {
      setUploadingImage(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  }

  return (
    <div className="wiki-editor">
      <div className="wiki-editor-header">
        <span>{label}</span>
        <div className="wiki-editor-tabs">
          <button className={!preview ? "active" : ""} type="button" onClick={() => setPreview(false)}>
            Escrever
          </button>
          <button className={preview ? "active" : ""} type="button" onClick={() => setPreview(true)}>
            Preview
          </button>
        </div>
      </div>
      <div className="wiki-editor-toolbar" aria-label="Ferramentas de formatacao">
        {[
          ["h2", "H2"],
          ["h3", "H3"],
          ["bold", "B"],
          ["italic", "I"],
          ["ul", "Lista"],
          ["ol", "1."],
          ["check", "Check"],
          ["quote", "Quote"],
          ["code", "Code"],
          ["link", "Link"],
          ["table", "Tabela"],
          ["hr", "Linha"]
        ].map(([type, buttonLabel]) => (
          <button key={type} className="ghost-button small" type="button" onClick={() => format(type)}>
            {buttonLabel}
          </button>
        ))}
        {onUploadImage ? (
          <>
            <button className="ghost-button small" type="button" disabled={uploadingImage} onClick={() => imageInputRef.current?.click()}>
              {uploadingImage ? "Enviando..." : "Imagem"}
            </button>
            <input
              ref={imageInputRef}
              accept="image/png,image/jpeg,image/webp"
              className="visually-hidden-input"
              type="file"
              onChange={(event) => void uploadImage(event.target.files?.[0])}
            />
          </>
        ) : null}
      </div>
      {preview ? <WikiMarkdownContent content={value} /> : <textarea ref={ref} rows={rows} value={value} onChange={(event) => onChange(event.target.value)} />}
    </div>
  );
}

function formatDateTimeBr(value: string | null | undefined) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

function wikiPathForSlug(slug: string) {
  return `/wiki/${encodeURIComponent(slug)}`;
}

export function WikiView({ user, initialSlug }: { user: CurrentUser; initialSlug?: string }) {
  const [pages, setPages] = useState<WikiPageSummary[]>([]);
  const [requests, setRequests] = useState<WikiEditRequestItem[]>([]);
  const [reviewedRequests, setReviewedRequests] = useState<WikiEditRequestItem[]>([]);
  const [selected, setSelected] = useState<WikiPageDetail | null>(null);
  const [pendingSlug, setPendingSlug] = useState(initialSlug ?? "");
  const [query, setQuery] = useState("");
  const [pageStatus, setPageStatus] = useState("ACTIVE");
  const [selectedTag, setSelectedTag] = useState("");
  const [recent, setRecent] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const [total, setTotal] = useState(0);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const [tagDraft, setTagDraft] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editTagDraft, setEditTagDraft] = useState("");
  const [decisionNote, setDecisionNote] = useState("");
  const [selectedRevisionVersion, setSelectedRevisionVersion] = useState<number | null>(null);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [draftMessage, setDraftMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function draftKey(pageId: string) {
    return `alwaystrack:wiki-draft:${user.id}:${pageId}`;
  }

  async function loadPages(nextSelectedId = selected?.id, pageOverride = page) {
    setLoading(true);
    setError(null);
    const search = new URLSearchParams();
    if (query) search.set("query", query);
    if (selectedTag) search.set("tags", selectedTag);
    if (recent) search.set("recent", recent);
    if (user.role === "ADMIN" && pageStatus !== "ACTIVE") search.set("status", pageStatus);
    search.set("page", String(pageOverride));
    search.set("pageSize", String(pageSize));
    try {
      const result = await api<{ items: WikiPageSummary[]; total: number; page?: number }>(`/v1/wiki/pages?${search.toString()}`);
      setPages(result.items);
      setTotal(result.total);
      const slugToOpen = pendingSlug;
      const slugMatch = slugToOpen ? result.items.find((item) => item.slug === slugToOpen) : null;
      const nextId = nextSelectedId && result.items.some((item) => item.id === nextSelectedId) ? nextSelectedId : result.items[0]?.id;
      setPage(result.page ?? pageOverride);
      if (slugToOpen) {
        if (slugMatch) {
          await openPage(slugMatch.id, false);
        } else {
          await openPageBySlug(slugToOpen, false);
        }
      } else {
        if (nextId) {
          await openPage(nextId, false);
        } else {
          setSelected(null);
        }
      }
      if (slugToOpen) setPendingSlug("");
      if (user.role === "ADMIN") {
        const [queue, approved, rejected] = await Promise.all([
          api<{ items: WikiEditRequestItem[]; total: number }>("/v1/wiki/edit-requests?status=PENDING"),
          api<{ items: WikiEditRequestItem[]; total: number }>("/v1/wiki/edit-requests?status=APPROVED"),
          api<{ items: WikiEditRequestItem[]; total: number }>("/v1/wiki/edit-requests?status=REJECTED")
        ]);
        setRequests(queue.items);
        setReviewedRequests([...approved.items, ...rejected.items].sort((a, b) => String(b.reviewedAt ?? b.createdAt).localeCompare(String(a.reviewedAt ?? a.createdAt))).slice(0, 12));
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Falha ao carregar wiki.");
    } finally {
      setLoading(false);
    }
  }

  function applySelectedPage(page: WikiPageDetail, updateUrl = true) {
    setSelected(page);
    setEditTitle(page.title);
    setEditSlug(page.slug);
    setEditContent(page.content);
    setEditTagDraft(tagsText(wikiTagsFor(page)));
    setSelectedRevisionVersion(null);
    setDraftMessage(null);
    if (updateUrl) window.history.replaceState(null, "", wikiPathForSlug(page.slug));
  }

  async function openPage(pageId: string, markRead = true, updateUrl = true) {
    const result = await api<{ page: WikiPageDetail }>(`/v1/wiki/pages/${pageId}`);
    applySelectedPage(result.page, updateUrl);
    if (markRead && result.page.active) {
      await api(`/v1/wiki/pages/${pageId}/read`, { method: "POST", body: JSON.stringify({}) });
      await api(`/v1/wiki/pages/${pageId}/presence`, { method: "POST", body: JSON.stringify({ mode: "READING" }) });
    }
  }

  async function openPageBySlug(slug: string, markRead = true) {
    const result = await api<{ page: WikiPageDetail }>(`/v1/wiki/pages/by-slug/${encodeURIComponent(slug)}`);
    applySelectedPage(result.page, true);
    if (markRead && result.page.active) {
      await api(`/v1/wiki/pages/${result.page.id}/read`, { method: "POST", body: JSON.stringify({}) });
      await api(`/v1/wiki/pages/${result.page.id}/presence`, { method: "POST", body: JSON.stringify({ mode: "READING" }) });
    }
  }

  useEffect(() => {
    void loadPages();
  }, []);

  useEffect(() => {
    if (!selected || !selected.active) return;
    const pageId = selected.id;
    const timer = window.setInterval(() => {
      void api(`/v1/wiki/pages/${pageId}/presence`, { method: "POST", body: JSON.stringify({ mode: "READING" }) }).catch(() => null);
    }, 45_000);
    return () => window.clearInterval(timer);
  }, [selected?.id]);

  useEffect(() => {
    if (!selected) return;
    const rawDraft = window.localStorage.getItem(draftKey(selected.id));
    if (!rawDraft) return;
    try {
      const draft = JSON.parse(rawDraft) as { title?: string; slug?: string; content?: string; baseVersion?: number; savedAt?: string };
      if (draft.baseVersion === selected.version && typeof draft.title === "string" && typeof draft.content === "string") {
        setEditTitle(draft.title);
        setEditSlug(typeof draft.slug === "string" ? draft.slug : selected.slug);
        setEditContent(draft.content);
        setDraftMessage(`Rascunho local recuperado de ${formatDateTimeBr(draft.savedAt ?? null)}.`);
      } else {
        setDraftMessage("Existe um rascunho local baseado em versão anterior; revise antes de reaproveitar.");
      }
    } catch {
      setDraftMessage("Rascunho local inválido ignorado.");
    }
  }, [selected?.id, selected?.version]);

  async function run(action: () => Promise<void>) {
    setSaving(true);
    setError(null);
    try {
      await action();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Falha ao salvar wiki.");
    } finally {
      setSaving(false);
    }
  }

  async function createPage(event: FormEvent) {
    event.preventDefault();
    await run(async () => {
      const result = await api<{ page: WikiPageSummary }>("/v1/wiki/pages", {
        method: "POST",
        body: JSON.stringify({ title, slug: slug || undefined, content, tags: parseTagsText(tagDraft) })
      });
      setTitle("");
      setSlug("");
      setContent("");
      setTagDraft("");
      await loadPages(result.page.id);
    });
  }

  async function publishEdit(event: FormEvent) {
    event.preventDefault();
    if (!selected) return;
    await run(async () => {
      await api(`/v1/wiki/pages/${selected.id}`, {
        method: "PATCH",
        body: JSON.stringify({ title: editTitle, slug: editSlug || undefined, content: editContent, tags: parseTagsText(editTagDraft), baseVersion: selected.version })
      });
      window.localStorage.removeItem(draftKey(selected.id));
      setDraftMessage(null);
      await loadPages(selected.id);
    });
  }

  async function requestEdit(event: FormEvent) {
    event.preventDefault();
    if (!selected) return;
    await run(async () => {
      await api("/v1/wiki/edit-requests", {
        method: "POST",
        body: JSON.stringify({ pageId: selected.id, title: editTitle, content: editContent, baseVersion: selected.version })
      });
      window.localStorage.removeItem(draftKey(selected.id));
      setDraftMessage(null);
      await openPage(selected.id);
    });
  }

  function saveDraft() {
    if (!selected) return;
    window.localStorage.setItem(
      draftKey(selected.id),
      JSON.stringify({ title: editTitle, slug: editSlug, content: editContent, baseVersion: selected.version, savedAt: new Date().toISOString() })
    );
    setDraftMessage("Rascunho local salvo neste navegador.");
  }

  function discardDraft() {
    if (!selected) return;
    window.localStorage.removeItem(draftKey(selected.id));
    setEditTitle(selected.title);
    setEditSlug(selected.slug);
    setEditContent(selected.content);
    setDraftMessage("Rascunho descartado; editor voltou para a versão publicada.");
  }

  async function decideRequest(requestId: string, decision: "approve" | "reject") {
    await run(async () => {
      await api(`/v1/wiki/edit-requests/${requestId}/${decision}`, {
        method: "POST",
        body: JSON.stringify({ decisionNote: decisionNote || null })
      });
      setDecisionNote("");
      await loadPages(selected?.id);
    });
  }

  async function setSelectedArchived(archived: boolean) {
    if (!selected) return;
    await run(async () => {
      await api(`/v1/wiki/pages/${selected.id}/${archived ? "archive" : "unarchive"}`, { method: "POST", body: JSON.stringify({}) });
      await loadPages(selected.id);
    });
  }

  async function restoreComparedRevision() {
    if (!selected || !comparedRevision) return;
    await run(async () => {
      const result = await api<{ page: WikiPageSummary }>(`/v1/wiki/pages/${selected.id}/revisions/${comparedRevision.id}/restore`, {
        method: "POST",
        body: JSON.stringify({})
      });
      await loadPages(result.page.id);
    });
  }

  const pendingForSelected = selected?.editRequests.filter((request) => request.status === "PENDING") ?? [];
  const wikiTags = useMemo(() => {
    const tags = new Set<string>(defaultKnowledgeTags);
    for (const page of pages) {
      for (const tag of wikiTagsFor(page)) tags.add(tag);
    }
    return [...tags].sort((a, b) => a.localeCompare(b));
  }, [pages]);
  const visiblePages = pages;
  const paginatedPages = visiblePages;
  const activePages = visiblePages.filter((page) => page.active);
  const archivedPages = visiblePages.filter((page) => !page.active);
  const pagesWithPendingRequests = visiblePages.filter((page) => page.editRequests.length > 0);
  const recentPages = visiblePages.filter((page) => isRecentlyUpdated(page.updatedAt)).slice(0, 4);
  const comparedRevision = selected
    ? selected.revisions.find((revision) => revision.version === selectedRevisionVersion) ??
      selected.revisions.find((revision) => revision.version !== selected.version) ??
      selected.revisions[0] ??
      null
    : null;
  const selectedRequest =
    (selectedRequestId ? requests.find((request) => request.id === selectedRequestId) ?? selected?.editRequests.find((request) => request.id === selectedRequestId) : null) ??
    null;
  const reviewedForSelected = selected?.editRequests.filter((request) => request.status !== "PENDING") ?? [];
  const selectedTags = selected ? wikiTagsFor(selected) : [];
  const selectedFaqSource = selected ? faqSourceThreadId(selected.content) : null;
  const relatedPages = selected
    ? pages
        .filter((item) => item.id !== selected.id && item.active && wikiTagsFor(item).some((tag) => selectedTags.includes(tag)))
        .slice(0, 4)
    : [];

  return (
    <div className="content-stack">
      <OperationalFilters
        fields={[
          {
            key: "query",
            label: "Busca",
            value: query,
            placeholder: "Titulo, slug, conteudo ou tag",
            help: "Busca paginas por titulo, slug, conteudo publicado e tags.",
            helpHref: "#wiki",
            onChange: setQuery
          },
          {
            key: "tag",
            label: "Tag",
            value: selectedTag,
            type: "select",
            placeholder: "Todas",
            options: wikiTags.map((tag) => ({ value: tag, label: `#${tag}` })),
            help: "Filtra por tag normalizada.",
            helpHref: "#wiki",
            onChange: setSelectedTag
          },
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
            help: "Filtra paginas atualizadas recentemente.",
            helpHref: "#wiki",
            onChange: setRecent
          },
          ...(user.role === "ADMIN"
            ? [
                {
                  key: "pageStatus",
                  label: "Status",
                  value: pageStatus,
                  type: "select" as const,
                  placeholder: "Ativas",
                  options: [
                    { value: "ACTIVE", label: "Ativas" },
                    { value: "ARCHIVED", label: "Arquivadas" },
                    { value: "ALL", label: "Todas" }
                  ],
                  help: "Admin pode incluir paginas arquivadas para consulta ou restauracao.",
                  helpHref: "#wiki",
                  onChange: setPageStatus
                }
              ]
            : [])
        ]}
        onSubmit={() => {
          setPage(1);
          void loadPages(undefined, 1);
        }}
      />

      {error ? <OperationalState state="error" title="Falha na wiki" detail={error} /> : null}

      <section className="panel wiki-discovery-panel">
        <div className="wiki-discovery-summary">
          <div>
            <p className="eyebrow">Descoberta</p>
            <h2>Mapa da Wiki</h2>
          </div>
          <div className="wiki-discovery-stats">
            <span>{activePages.length} ativa(s)</span>
            {user.role === "ADMIN" ? <span>{archivedPages.length} arquivada(s)</span> : null}
            <span>{pagesWithPendingRequests.length} com pendencia</span>
          </div>
        </div>
        <div className="wiki-discovery-grid">
          <div>
            <strong>Atualizadas recentemente</strong>
            {recentPages.length ? (
              <div className="wiki-chip-list">
                {recentPages.map((page) => (
                  <button key={page.id} type="button" onClick={() => void openPage(page.id)}>
                    {page.title}
                    <small>{formatDateBr(page.updatedAt)}</small>
                  </button>
                ))}
              </div>
            ) : (
              <p className="muted">Sem movimentacao recente.</p>
            )}
          </div>
          <div>
            <strong>Precisam de atencao</strong>
            {pagesWithPendingRequests.length ? (
              <div className="wiki-chip-list">
                {pagesWithPendingRequests.slice(0, 4).map((page) => (
                  <button key={page.id} type="button" onClick={() => void openPage(page.id)}>
                    {page.title}
                    <small>{page.editRequests.length} pendente(s)</small>
                  </button>
                ))}
              </div>
            ) : (
              <p className="muted">Nenhuma requisicao pendente nas paginas listadas.</p>
            )}
          </div>
          <div>
            <strong>Tags</strong>
            {wikiTags.length ? (
              <div className="wiki-tag-filter">
                <button className={!selectedTag ? "active" : ""} type="button" onClick={() => setSelectedTag("")}>
                  Todas
                </button>
                {wikiTags.map((tag) => (
                  <button className={selectedTag === tag ? "active" : ""} key={tag} type="button" onClick={() => setSelectedTag(tag)}>
                    #{tag}
                  </button>
                ))}
              </div>
            ) : (
              <p className="muted">Use #tags no conteudo para criar filtros automaticos.</p>
            )}
          </div>
        </div>
      </section>

      {user.role === "ADMIN" ? (
        <section className="panel form-panel">
          <h2>Nova pagina</h2>
          <form onSubmit={createPage}>
            <div className="form-grid">
              <label>
                Titulo
                <input value={title} onChange={(event) => setTitle(event.target.value)} />
              </label>
              <label>
                <span className="label-row">Slug opcional <InfoTip text="Slug vira o endereco /wiki/slug-da-pagina; use texto curto e estavel." href="#wiki" /></span>
                <input value={slug} onChange={(event) => setSlug(event.target.value)} placeholder="primeiros-passos" />
              </label>
              <div className="full-span">
                <label>
                  Tags
                  <input value={tagDraft} onChange={(event) => setTagDraft(event.target.value)} placeholder="vendas, processo, treinamento" />
                </label>
              </div>
              <div className="full-span">
                <WikiMarkdownEditor label="Conteudo" rows={6} value={content} onChange={setContent} onUploadImage={(file) => uploadWikiImage(file)} />
              </div>
            </div>
            <div className="form-actions">
              <button disabled={saving || !title.trim() || !content.trim()}>Publicar</button>
            </div>
          </form>
        </section>
      ) : null}

      <div className="wiki-layout">
        <section className="panel table-panel">
          <div className="table-panel-toolbar">
            <div>
              <p className="eyebrow">Wiki</p>
              <h2>Paginas</h2>
            </div>
          </div>
          {loading ? (
            <OperationalState state="loading" title="Carregando wiki" />
          ) : visiblePages.length === 0 ? (
            <OperationalState state="empty" title="Nenhuma pagina publicada" detail="Publique um procedimento ou promova uma pergunta resolvida do FAQ." />
          ) : (
            <div className="wiki-page-list wiki-page-list-paginated">
              {paginatedPages.map((page) => (
                <button
                  className={selected?.id === page.id ? "wiki-page-button active" : "wiki-page-button"}
                  key={page.id}
                  type="button"
                  onClick={() => void openPage(page.id)}
                >
                  <strong>{page.title}</strong>
                  <span>v{page.version} / {formatDateBr(page.updatedAt)}</span>
                  {wikiTagsFor(page).length ? <span>{wikiTagsFor(page).map((tag) => `#${tag}`).join(" ")}</span> : null}
                  <small>Validada por {page.updatedBy.name}</small>
                  {isRecentlyUpdated(page.updatedAt) ? <small>Atualizada recentemente</small> : null}
                  {!page.active ? <small>Arquivada</small> : null}
                  {page.editRequests.length ? <small>{page.editRequests.length} pendente(s)</small> : null}
                </button>
              ))}
              <PaginationControls
                page={page}
                pageSize={pageSize}
                total={total}
                onPageChange={(nextPage) => {
                  setPage(nextPage);
                  void loadPages(undefined, nextPage);
                }}
              />
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
                  <p className="muted">Versao {selected.version} publicada em {formatDateBr(selected.publishedAt)}</p>
                </div>
                {user.role === "ADMIN" ? (
                  <div className="row-actions">
                    <button className="secondary" type="button" disabled={saving} onClick={() => void setSelectedArchived(selected.active)}>
                      {selected.active ? "Arquivar" : "Desarquivar"}
                    </button>
                  </div>
                ) : null}
              </div>
              {!selected.active ? <OperationalState state="empty" title="Pagina arquivada" detail="Ela fica fora da Wiki padrao, mas historico e restauracao continuam disponiveis para admin." /> : null}
              {selectedTags.length ? (
                <div className="wiki-tag-row">
                  {selectedTags.map((tag) => (
                    <button key={tag} type="button" onClick={() => setSelectedTag(tag)}>
                      #{tag}
                    </button>
                  ))}
                </div>
              ) : null}
              <div className="knowledge-governance-strip">
                <span>Validada por {validatedByLabel(selected)}</span>
                <span>{selected.readReceipts.length} leitura(s) registrada(s)</span>
                <span>{pendingForSelected.length} pendencia(s)</span>
                {selectedFaqSource ? <span>Origem FAQ: {selectedFaqSource}</span> : null}
              </div>
              <WikiMarkdownContent content={selected.content} />
              {relatedPages.length ? (
                <div className="wiki-related-panel">
                  <strong>Artigos relacionados</strong>
                  <div className="wiki-chip-list">
                    {relatedPages.map((item) => (
                      <button key={item.id} type="button" onClick={() => void openPage(item.id)}>
                        {item.title}
                        <small>{wikiTagsFor(item).map((tag) => `#${tag}`).join(" ")}</small>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
              <div className="wiki-meta-grid">
                <div>
                  <strong>Lendo agora</strong>
                  <p>{selected.presences.length ? selected.presences.map((item) => `${item.user.name} (${item.mode})`).join(", ") : "Ninguem agora"}</p>
                </div>
                <div>
                  <strong>Leitores recentes</strong>
                  <p>{selected.readReceipts.length ? selected.readReceipts.map((item) => item.user.name).join(", ") : "Sem leitura registrada"}</p>
                </div>
                <div>
                  <strong>Revisoes</strong>
                  <p>{selected.revisions.map((item) => `v${item.version} ${item.author.name}`).join(", ") || "Sem historico"}</p>
                </div>
              </div>
              {comparedRevision ? (
                <div className="wiki-compare-panel">
                  <div className="table-panel-toolbar">
                    <div>
                      <p className="eyebrow">Historico</p>
                      <h3>Comparar revisao</h3>
                    </div>
                    <label>
                      Versao
                      <select
                        value={comparedRevision.version}
                        onChange={(event) => setSelectedRevisionVersion(Number(event.target.value))}
                      >
                        {selected.revisions.map((revision) => (
                          <option key={revision.id} value={revision.version}>
                            v{revision.version} - {revision.author.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    {user.role === "ADMIN" && comparedRevision.version !== selected.version ? (
                      <button className="secondary" type="button" disabled={saving} onClick={() => void restoreComparedRevision()}>
                        Restaurar esta versao
                      </button>
                    ) : null}
                  </div>
                  <p className="muted">{wikiChangeSummary(comparedRevision.content, selected.content)}</p>
                  <WikiChangeDigest before={comparedRevision.content} after={selected.content} />
                  <div className="wiki-compare-grid">
                    <div>
                      <strong>v{comparedRevision.version}</strong>
                      <WikiMarkdownContent content={comparedRevision.content} />
                    </div>
                    <div>
                      <strong>v{selected.version} publicada</strong>
                      <WikiMarkdownContent content={selected.content} />
                    </div>
                  </div>
                </div>
              ) : null}
              {pendingForSelected.length ? (
                <OperationalState state="success" title={`${pendingForSelected.length} requisicao(oes) pendente(s) nesta pagina`} />
              ) : null}
              {reviewedForSelected.length ? (
                <div className="wiki-decision-history">
                  <strong>Decisoes das suas propostas</strong>
                  {reviewedForSelected.map((request) => (
                    <div key={request.id}>
                      <span>{request.status}</span>
                      <span>{request.reviewer?.name ?? "Revisor"}</span>
                      <span>{formatDateTimeBr(request.reviewedAt)}</span>
                      <p>{request.decisionNote || "Sem comentario de decisao."}</p>
                    </div>
                  ))}
                </div>
              ) : null}
              {selected.active ? (
                <form className="wiki-edit-form" onSubmit={user.role === "ADMIN" ? publishEdit : requestEdit}>
                  <h3>{user.role === "ADMIN" ? "Editar e publicar" : "Sugerir alteracao"}</h3>
                  {draftMessage ? <p className="muted">{draftMessage}</p> : null}
                  <label>
                    Titulo
                    <input value={editTitle} onChange={(event) => setEditTitle(event.target.value)} />
                  </label>
                  {user.role === "ADMIN" ? (
                    <label>
                      <span className="label-row">Slug <InfoTip text="Alterar slug muda o link compartilhavel da pagina." href="#wiki" /></span>
                      <input value={editSlug} onChange={(event) => setEditSlug(event.target.value)} />
                    </label>
                  ) : null}
                  {user.role === "ADMIN" ? (
                    <label>
                      Tags
                      <input value={editTagDraft} onChange={(event) => setEditTagDraft(event.target.value)} placeholder="vendas, processo, treinamento" />
                    </label>
                  ) : null}
                  <WikiMarkdownEditor label="Conteudo" value={editContent} onChange={setEditContent} onUploadImage={(file) => uploadWikiImage(file, selected.id)} />
                  <div className="form-actions">
                    <button disabled={saving || !editTitle.trim() || !editContent.trim()}>
                      {user.role === "ADMIN" ? "Publicar versao" : "Enviar para aprovacao"}
                    </button>
                    <button className="secondary" type="button" disabled={!selected || saving} onClick={saveDraft}>
                      Salvar rascunho
                    </button>
                    <button className="secondary" type="button" disabled={!selected || saving} onClick={discardDraft}>
                      Descartar rascunho
                    </button>
                  </div>
                </form>
              ) : null}
            </>
          ) : (
            <OperationalState state="empty" title="Selecione uma pagina" />
          )}
        </section>
      </div>

      {user.role === "ADMIN" ? (
        <section className="panel table-panel">
          <div className="table-panel-toolbar">
            <div>
              <p className="eyebrow">Moderacao</p>
              <h2>Requisicoes pendentes</h2>
            </div>
            <label className="decision-note-field">
              <span className="label-row">Nota da decisao <InfoTip text="Comentario fica no historico para explicar aprovacoes e reprovacoes de propostas." href="#wiki" /></span>
              <input value={decisionNote} onChange={(event) => setDecisionNote(event.target.value)} />
            </label>
          </div>
          {requests.length === 0 ? (
            <OperationalState state="empty" title="Nenhuma requisicao pendente" />
          ) : (
            <>
              {selectedRequest ? (
                <div className="wiki-request-preview">
                  <div>
                    <p className="eyebrow">Preview</p>
                    <h3>{selectedRequest.title}</h3>
                    <p className="muted">
                      {selectedRequest.author.name} sugeriu sobre {selectedRequest.page.title} a partir da v{selectedRequest.baseVersion}.
                    </p>
                    {selectedRequest.page.version !== selectedRequest.baseVersion ? (
                      <OperationalState
                        state="error"
                        title="Base desatualizada"
                        detail={`A pagina publicada esta na v${selectedRequest.page.version}; esta proposta nasceu da v${selectedRequest.baseVersion}.`}
                      />
                    ) : null}
                  </div>
                  <WikiRequestReviewPanel request={selectedRequest} selected={selected} />
                </div>
              ) : null}
              <OperationalTable
                items={requests}
                getRowKey={(item) => item.id}
                columns={[
                  { key: "page", header: "Pagina", render: (item) => item.page.title },
                  { key: "author", header: "Autor", render: (item) => item.author.name },
                  { key: "base", header: "Base", render: (item) => `v${item.baseVersion}` },
                  { key: "created", header: "Criada", render: (item) => formatDateTimeBr(item.createdAt) },
                  {
                    key: "actions",
                    header: "Acoes",
                    render: (item) => (
                      <span className="row-actions">
                        <button
                          className="secondary"
                          type="button"
                          onClick={() => {
                            setSelectedRequestId(item.id);
                            void openPage(item.pageId);
                          }}
                        >
                          Preview
                        </button>
                        <button type="button" onClick={() => void decideRequest(item.id, "approve")}>Aprovar</button>
                        <button className="secondary" type="button" onClick={() => void decideRequest(item.id, "reject")}>Reprovar</button>
                      </span>
                    )
                  }
                ]}
              />
              {reviewedRequests.length ? (
                <div className="wiki-decision-history">
                  <strong>Historico recente de decisoes</strong>
                  <OperationalTable
                    items={reviewedRequests}
                    getRowKey={(item) => item.id}
                    columns={[
                      { key: "page", header: "Pagina", render: (item) => item.page.title },
                      { key: "status", header: "Status", render: (item) => item.status },
                      { key: "author", header: "Autor", render: (item) => item.author.name },
                      { key: "reviewer", header: "Revisor", render: (item) => item.reviewer?.name ?? "-" },
                      { key: "reviewedAt", header: "Decidida", render: (item) => formatDateTimeBr(item.reviewedAt) },
                      { key: "note", header: "Comentario", render: (item) => item.decisionNote || "Sem comentario" }
                    ]}
                  />
                </div>
              ) : null}
            </>
          )}
        </section>
      ) : null}
    </div>
  );
}
