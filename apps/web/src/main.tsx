import { Fragment, StrictMode, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import {
  BadgeCheck,
  BarChart3,
  Bell,
  BookOpen,
  Check,
  CircleHelp,
  Download,
  FileText,
  LayoutDashboard,
  LogOut,
  ScrollText,
  Settings,
  ScanSearch,
  Users,
  type LucideIcon
} from "lucide-react";
import {
  documentStatuses,
  licenseStatuses,
  notificationChannels,
  notificationStatuses,
  userRoles,
  type ApiResult,
  type CurrentUser,
  type LicenseStatus,
  type UserRole
} from "@alwaystrack/shared";
import { api, apiBaseUrl, appName, uploadWikiImage } from "./api";
import { BrandMark } from "./components/brand";
import {
  ConfirmButton,
  InfoTip,
  OperationalFilters,
  OperationalState,
  OperationalTable,
  PaginationSummary,
  StatusBadge
} from "./components/operational";
import { AuditView } from "./views/audit";
import { CampaignsView } from "./views/campaigns";
import { DashboardView } from "./views/dashboard";
import { FaqThreadsView } from "./views/faq";
import { NotesView } from "./views/notes";
import { RankingView } from "./views/ranking";
import { StatementsView } from "./views/statements";
import { UsersTeamsView } from "./views/users-teams";
import "./styles.css";

type ViewKey =
  | "dashboard"
  | "notes"
  | "ranking"
  | "campaigns"
  | "statements"
  | "wiki"
  | "faq"
  | "users"
  | "audit"
  | "help"
  | "professionals"
  | "licenses"
  | "documents"
  | "reports"
  | "settings";
type IconName =
  | "home"
  | "users"
  | "badge"
  | "file"
  | "chart"
  | "wiki"
  | "audit"
  | "settings"
  | "help"
  | "logout"
  | "download"
  | "check"
  | "bell"
  | "scan";

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

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

function formatCpfInput(value: string) {
  const digits = digitsOnly(value).slice(0, 11);
  if (!digits) return "";
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function formatBrazilPhoneCore(value: string) {
  const digits = digitsOnly(value).slice(0, 11);
  if (!digits) return "";
  if (digits.length <= 2) return `(${digits}`;

  const areaCode = digits.slice(0, 2);
  const local = digits.slice(2);

  if (local.length <= 4) return `(${areaCode}) ${local}`;
  if (local.length <= 8) return `(${areaCode}) ${local.slice(0, 4)}-${local.slice(4)}`;
  return `(${areaCode}) ${local.slice(0, 5)}-${local.slice(5, 9)}`;
}

function formatPhoneInput(value: string) {
  const digits = digitsOnly(value).slice(0, 13);
  if (!digits) return "";
  if (digits.startsWith("55")) {
    const local = digits.slice(2);
    return local ? `+55 ${formatBrazilPhoneCore(local)}` : "+55";
  }
  if (digits.length <= 11) return formatBrazilPhoneCore(digits);
  return `+${digits}`;
}

function toFilterOptions(items: Array<{ value: string; label: string }>) {
  return items;
}

const activeFilterOptions = toFilterOptions([
  { value: "true", label: "Ativos" },
  { value: "false", label: "Inativos" }
]);

const documentStatusFilterOptions = toFilterOptions(documentStatuses.map((value) => ({ value, label: value })));
const licenseStatusFilterOptions = toFilterOptions(licenseStatuses.map((value) => ({ value, label: value })));
const notificationStatusFilterOptions = toFilterOptions(notificationStatuses.map((value) => ({ value, label: value })));
const notificationChannelFilterOptions = toFilterOptions(notificationChannels.map((value) => ({ value, label: value })));
const pageSizeFilterOptions = toFilterOptions(["10", "25", "50", "100"].map((value) => ({ value, label: value })));
const reportWindowFilterOptions = toFilterOptions(["7", "15", "30", "60", "90"].map((value) => ({ value, label: `${value} dias` })));
interface SectorItem {
  id: string;
  unitId: string;
  name: string;
  active: boolean;
}

interface UnitItem {
  id: string;
  organizationId: string;
  name: string;
  active: boolean;
  sectors: SectorItem[];
}

interface OrganizationItem {
  id: string;
  name: string;
  document: string | null;
  active: boolean;
  units: UnitItem[];
}

interface ManagedUserItem {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone: string | null;
  active: boolean;
  organizationId: string;
  unitScopeIds: string[];
  sectorScopeIds: string[];
  sellerProfile?: {
    id: string;
    code: string;
    displayName: string;
    email: string | null;
    phone: string | null;
    active: boolean;
    salesGroupId: string | null;
    salesGroup: { id: string; name: string } | null;
  } | null;
  supervisedSalesGroups?: Array<{ id: string; name: string; active: boolean }>;
  createdAt: string;
  updatedAt: string;
}

interface SalesGroupOption {
  id: string;
  name: string;
  active: boolean;
  supervisorId?: string | null;
}

interface ProfessionalSummary {
  id: string;
  name: string;
  cpf: string | null;
  email: string | null;
  phone: string | null;
  position: string | null;
  active: boolean;
  unitId: string;
  sectorId: string;
  responsibleRtId: string | null;
  userId: string | null;
  unit: { id: string; name: string };
  sector: { id: string; name: string };
  responsibleRt: null | { id: string; name: string; email: string; role: string };
  user: null | { id: string; name: string; email: string; role: string; active: boolean };
  _count: { licenses: number; documents: number; notificationJobs: number };
}

interface ProfessionalDetail extends Omit<ProfessionalSummary, "_count"> {
  notes: string | null;
  licenses: Array<{
    id: string;
    number: string | null;
    status: string;
    expiresAt: string | null;
    licenseType: { name: string };
  }>;
  documents: Array<{ id: string; fileName: string; status: string; createdAt: string }>;
  notificationJobs: Array<{ id: string; channel: string; status: string; scheduledFor: string; createdAt: string }>;
}

interface CsvImportRow {
  line: number;
  professionalName: string;
  cpf: string;
  licenseType: string;
  licenseNumber: string | null;
  action: "create" | "update" | "error";
  professionalAction: "create" | "update" | "error";
  licenseAction: "create" | "update" | "error";
  errors: string[];
}

interface CsvImportResult {
  totalRows: number;
  validRows: number;
  errorRows: number;
  willCreateProfessionals: number;
  willUpdateProfessionals: number;
  willCreateLicenses: number;
  willUpdateLicenses: number;
  professionalsCreated?: number;
  professionalsUpdated?: number;
  licensesCreated?: number;
  licensesUpdated?: number;
  rows: CsvImportRow[];
}

interface GoogleIntegrationStatus {
  oauthConfigured: boolean;
  connected: boolean;
  fallbackAvailable: boolean;
  preferredMode: "oauth" | "service-account" | "unavailable";
  connectedAt: string | null;
  lastUsedAt: string | null;
}

interface GoogleLoginStatus {
  configured: boolean;
}

interface LicenseTypeItem {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  defaultWarningDays: string | null;
  active: boolean;
}

interface LicenseItem {
  id: string;
  professionalId: string;
  licenseTypeId: string;
  number: string | null;
  issuer: string | null;
  uf: string | null;
  issuedAt: string | null;
  expiresAt: string | null;
  status: LicenseStatus;
  notes: string | null;
  licenseType: LicenseTypeItem;
  professional: {
    id: string;
    name: string;
    cpf: string | null;
    email: string | null;
    phone: string | null;
    position: string | null;
    active: boolean;
    unitId: string;
    sectorId: string;
    responsibleRtId: string | null;
    unit: { id: string; name: string };
    sector: { id: string; name: string };
    responsibleRt: null | { id: string; name: string; email: string; role: string };
  };
  validatedBy: null | { id: string; name: string; email: string; role: string };
  _count: { documents: number; notificationJobs: number };
}

interface PublicUploadToken {
  id: string;
  expiresAt: string;
  professional: { name: string };
  license: {
    number: string | null;
    expiresAt: string | null;
    licenseType: { name: string };
  };
}

interface DocumentItem {
  id: string;
  professionalId: string;
  licenseId: string;
  fileName: string;
  mimeType: string;
  size: number;
  status: "UPLOADED" | "APPROVED" | "REJECTED" | "ARCHIVED";
  rejectionReason: string | null;
  validatedAt: string | null;
  createdAt: string;
  professional: {
    id: string;
    name: string;
    unit: { id: string; name: string };
    sector: { id: string; name: string };
    responsibleRt: null | { id: string; name: string; email: string; role: string };
  };
  license: {
    id: string;
    number: string | null;
    status: LicenseStatus;
    licenseType: { id: string; name: string };
  };
  uploadedByUser: null | { id: string; name: string; email: string; role: string };
  uploadToken: null | { id: string; usedAt: string | null; expiresAt: string };
  validatedBy: null | { id: string; name: string; email: string; role: string };
}

interface DocumentAiField {
  value: string | null;
  confidence: number | null;
  evidence: string | null;
}

interface DocumentAiResult {
  documentKind: string | null;
  rawText: string | null;
  fields: {
    professionalName: DocumentAiField;
    cpf: DocumentAiField;
    licenseTypeName: DocumentAiField;
    licenseNumber: DocumentAiField;
    issuer: DocumentAiField;
    uf: DocumentAiField;
    issuedAt: DocumentAiField;
    expiresAt: DocumentAiField;
  };
  warnings: string[];
}

interface DocumentAiExtractionItem {
  id: string;
  provider: string;
  model: string | null;
  status: "PROCESSING" | "COMPLETED" | "FAILED";
  resultJson: string | null;
  errorMessage: string | null;
  appliedAt: string | null;
  createdAt: string;
}

interface NotificationTemplateItem {
  id: string;
  key: string;
  channel: string;
  metaTemplateName: string | null;
  language: string;
  bodyPreview: string | null;
  active: boolean;
}

interface NotificationRuleItem {
  id: string;
  licenseTypeId: string | null;
  daysBeforeExpiration: number | null;
  repeatAfterExpiredDays: number | null;
  channel: string;
  templateKey: string;
  notifyProfessional: boolean;
  notifyRt: boolean;
  active: boolean;
  licenseType: null | { id: string; name: string };
}

interface NotificationJobItem {
  id: string;
  status: string;
  channel: string;
  templateKey: string;
  recipientPhone: string | null;
  providerMessageId: string | null;
  attempts: number;
  scheduledFor: string;
  professional: { id: string; name: string };
  license: { id: string; number: string | null; licenseType: { name: string } };
}

interface InAppNotificationItem {
  id: string;
  type: string;
  title: string;
  body?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  href?: string | null;
  readAt?: string | null;
  createdAt: string;
}

interface FaqItem {
  id: string;
  category: string;
  question: string;
  answer: string;
  order: number;
  active?: boolean;
}

type ReportKey =
  | "licensesExpired"
  | "licensesExpiring"
  | "rtSummary"
  | "areaSummary"
  | "documentsPending"
  | "documentsRejected"
  | "notifications"
  | "regularization";

interface ReportResponse {
  items: Array<Record<string, unknown>>;
  page: number;
  pageSize: number;
  total: number;
}

interface NavItem {
  key: ViewKey;
  label: string;
  description: string;
  icon: IconName;
  roles: CurrentUser["role"][];
}

const navItems: NavItem[] = [
  { key: "dashboard", label: "Dashboard", description: "Vendas, notas e ranking do dia", icon: "home", roles: ["ADMIN", "GESTOR", "SAC", "FINANCEIRO", "VENDEDOR", "SUPERVISOR"] },
  { key: "notes", label: "Notas", description: "Upload e revisão de DANFEs", icon: "file", roles: ["ADMIN", "GESTOR", "SAC", "FINANCEIRO", "VENDEDOR", "SUPERVISOR"] },
  { key: "ranking", label: "Ranking", description: "Campanhas e posições", icon: "chart", roles: ["ADMIN", "GESTOR", "VENDEDOR", "SUPERVISOR"] },
  { key: "campaigns", label: "Campanhas", description: "Regras comerciais", icon: "bell", roles: ["ADMIN", "GESTOR", "SUPERVISOR"] },
  { key: "statements", label: "Extratos", description: "Geral, grupos e vendedores", icon: "download", roles: ["ADMIN", "GESTOR", "SAC", "FINANCEIRO", "VENDEDOR", "SUPERVISOR"] },
  { key: "wiki", label: "Wiki", description: "Procedimentos transversais", icon: "wiki", roles: ["ADMIN", "GESTOR", "SAC", "FINANCEIRO", "VENDEDOR", "SUPERVISOR"] },
  { key: "faq", label: "FAQ", description: "Perguntas e threads", icon: "help", roles: ["ADMIN", "GESTOR", "SAC", "FINANCEIRO", "VENDEDOR", "SUPERVISOR"] },
  { key: "users", label: "Usuários/Times", description: "Vendedores e grupos", icon: "users", roles: ["ADMIN", "GESTOR"] },
  { key: "audit", label: "Auditoria", description: "Trilha de eventos", icon: "audit", roles: ["ADMIN"] },
  { key: "help", label: "Como usar", description: "Ajuda operacional", icon: "help", roles: [] }
];

const helpAnchorIds = new Set([
  "visao-geral",
  "primeiro-acesso",
  "dashboard-comercial",
  "upload-danfe",
  "status-das-notas",
  "reprocessamento-ia",
  "duplicidade-danfe",
  "aprovacao-de-notas",
  "ranking",
  "campanhas",
  "extratos",
  "wiki",
  "faq",
  "usuarios-times",
  "perfis-e-permissoes",
  "auditoria",
  "notificacoes-in-app",
  "glossario",
  "problemas-comuns"
]);

const iconComponents: Record<IconName, LucideIcon> = {
  home: LayoutDashboard,
  users: Users,
  badge: BadgeCheck,
  file: FileText,
  chart: BarChart3,
  wiki: BookOpen,
  audit: ScrollText,
  settings: Settings,
  help: CircleHelp,
  logout: LogOut,
  download: Download,
  check: Check,
  bell: Bell,
  scan: ScanSearch
};

function Icon({ name }: { name: IconName }) {
  const IconComponent = iconComponents[name];
  return <IconComponent className="icon" aria-hidden="true" strokeWidth={2.25} />;
}

document.title = appName;

function LoginForm({ onLogin }: { onLogin: (user: CurrentUser) => void }) {
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleConfigured, setGoogleConfigured] = useState(false);

  useEffect(() => {
    api<GoogleLoginStatus>("/v1/auth/google/status")
      .then((status) => setGoogleConfigured(status.configured))
      .catch(() => setGoogleConfigured(false));
  }, []);

  function expectedAuthOrigin() {
    return new URL(apiBaseUrl || window.location.origin, window.location.origin).origin;
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await api<{ user: CurrentUser }>("/v1/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });
      onLogin(result.user);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Falha ao entrar.");
    } finally {
      setLoading(false);
    }
  }

  async function startGoogleLogin() {
    setGoogleLoading(true);
    setError(null);
    return new Promise<void>((resolve) => {
      const popup = window.open("", "alwaystrack-google-login", "popup=yes,width=560,height=720");
      if (!popup) {
        window.location.assign(`${apiBaseUrl}/v1/auth/google/start`);
        setGoogleLoading(false);
        resolve();
        return;
      }

      popup.location.href = `${apiBaseUrl}/v1/auth/google/start`;
      const timer = window.setInterval(() => {
        if (popup.closed) {
          cleanup();
          setGoogleLoading(false);
          resolve();
        }
      }, 500);

      function cleanup() {
        window.clearInterval(timer);
        window.removeEventListener("message", handleMessage);
      }

      async function handleMessage(event: MessageEvent) {
        if (event.origin !== expectedAuthOrigin()) return;
        const payload = event.data as { type?: string; status?: string; message?: string } | null;
        if (!payload || payload.type !== "alwaystrack-google-login") return;
        cleanup();
        if (popup && !popup.closed) {
          popup.close();
        }
        if (payload.status === "success") {
          try {
            const result = await api<{ user: CurrentUser }>("/v1/auth/me");
            onLogin(result.user);
          } catch (caught) {
            setError(caught instanceof Error ? caught.message : "Falha ao carregar sessão Google.");
          }
        } else {
          setError(payload.message || "Não foi possível concluir o login com Google.");
        }
        setGoogleLoading(false);
        resolve();
      }

      window.addEventListener("message", handleMessage);
    });
  }

  return (
    <main className="auth-page">
      <form className="panel login-panel" onSubmit={submit}>
        <div className="login-brand">
          <BrandMark className="login-brand-mark" />
          <div>
            <p className="eyebrow">{appName}</p>
            <h1>Entrar</h1>
          </div>
        </div>
        <div>
          <p className="muted">Acesso operacional para notas, ranking, campanhas e extratos comerciais.</p>
        </div>
        <button type="button" disabled={!googleConfigured || googleLoading || loading} onClick={() => void startGoogleLogin()}>
          {googleLoading ? "Conectando..." : "Entrar com Google"}
        </button>
        <div className="login-divider">
          <span>Email e senha</span>
        </div>
        <label>
          Email
          <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" />
        </label>
        <label>
          Senha
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            autoComplete="current-password"
          />
        </label>
        {error ? <p className="error">{error}</p> : null}
        <button className="secondary" disabled={loading || googleLoading}>{loading ? "Entrando..." : "Entrar com senha"}</button>
      </form>
    </main>
  );
}

function PlaceholderView({ item }: { item: NavItem }) {
  return (
    <section className="panel empty-state">
      <p className="eyebrow">{item.label}</p>
      <h2>{item.description}</h2>
      <p className="muted">Módulo reservado no shell. A implementação funcional entra nas próximas tasks do roadmap.</p>
    </section>
  );
}

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

const reportOptions: Array<{ key: ReportKey; label: string; endpoint: string; fileName: string }> = [
  { key: "licensesExpired", label: "Licenças vencidas", endpoint: "/v1/reports/licenses/expired", fileName: "licenças-vencidas.csv" },
  { key: "licensesExpiring", label: "Licenças a vencer", endpoint: "/v1/reports/licenses/expiring", fileName: "licenças-a-vencer.csv" },
  { key: "rtSummary", label: "Resumo por RT", endpoint: "/v1/reports/groups/rt", fileName: "resumo-por-rt.csv" },
  { key: "areaSummary", label: "Resumo por unidade/setor", endpoint: "/v1/reports/groups/areas", fileName: "resumo-por-area.csv" },
  { key: "documentsPending", label: "Documentos pendentes", endpoint: "/v1/reports/documents/pending", fileName: "documentos-pendentes.csv" },
  { key: "documentsRejected", label: "Documentos recusados", endpoint: "/v1/reports/documents/rejected", fileName: "documentos-recusados.csv" },
  { key: "notifications", label: "Notificações", endpoint: "/v1/reports/notifications", fileName: "notificações.csv" },
  { key: "regularization", label: "Regularização", endpoint: "/v1/reports/regularization", fileName: "regularização.csv" }
];

function reportText(row: Record<string, unknown>, key: string) {
  const value = row[key];
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "number") return String(value);
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) return formatDateTimeBr(value);
  return String(value);
}

function formatDateBr(value: string | null | undefined) {
  if (!value) return "-";
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) return `${match[3]}/${match[2]}/${match[1]}`;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString("pt-BR");
}

function formatDateTimeBr(value: string | null | undefined) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString("pt-BR");
}

function parseDocumentAiResult(extraction: DocumentAiExtractionItem | null) {
  if (!extraction?.resultJson) return null;
  try {
    return JSON.parse(extraction.resultJson) as DocumentAiResult;
  } catch {
    return null;
  }
}

function reportColumns(report: ReportKey) {
  const base = {
    professionalName: "Profissional",
    unitName: "Unidade",
    sectorName: "Setor",
    rtName: "RT",
    licenseTypeName: "Tipo",
    status: "Status"
  };

  const byReport: Record<ReportKey, Record<string, string>> = {
    licensesExpired: {
      ...base,
      number: "Número",
      expiresAt: "Venceu em",
      daysExpired: "Dias vencida",
      lastNotificationStatus: "Última notif.",
      lastDocumentStatus: "Ultimo doc."
    },
    licensesExpiring: {
      ...base,
      number: "Número",
      expiresAt: "Vence em",
      daysRemaining: "Dias restantes",
      lastNotificationStatus: "Última notif.",
      lastDocumentStatus: "Ultimo doc."
    },
    rtSummary: {
      label: "RT",
      total: "Profissionais",
      regular: "Regulares",
      expiring: "A vencer",
      expired: "Vencidas",
      pendingValidation: "Validações",
      failedNotifications: "Falhas",
      pendingPercent: "% pendência"
    },
    areaSummary: {
      label: "Unidade / setor",
      total: "Profissionais",
      regular: "Regulares",
      expiring: "A vencer",
      expired: "Vencidas",
      pendingValidation: "Validações",
      failedNotifications: "Falhas",
      pendingPercent: "% pendência"
    },
    documentsPending: {
      fileName: "Arquivo",
      ...base,
      licenseStatus: "Licença",
      uploadedAt: "Enviado em",
      waitingDays: "Dias aguardando"
    },
    documentsRejected: {
      fileName: "Arquivo",
      ...base,
      licenseStatus: "Licença",
      rejectedAt: "Recusado em",
      rejectedBy: "Recusado por",
      rejectionReason: "Motivo"
    },
    notifications: {
      ...base,
      channel: "Canal",
      templateKey: "Template",
      recipient: "Destinatário",
      scheduledFor: "Agendada",
      sentAt: "Enviada",
      errorMessage: "Erro",
      providerMessageId: "Provider ID"
    },
    regularization: {
      ...base,
      notificationAt: "Notificação",
      notificationStatus: "Status notif.",
      uploadedAt: "Upload",
      validationAt: "Validação",
      validationStatus: "Status validação",
      totalDays: "Dias totais"
    }
  };

  return Object.entries(byReport[report]).map(([key, header]) => ({
    key,
    header,
    render: (row: Record<string, unknown>) => reportText(row, key)
  }));
}

function ReportsView() {
  const [report, setReport] = useState<ReportKey>("licensesExpired");
  const [data, setData] = useState<ReportResponse | null>(null);
  const [organization, setOrganization] = useState<OrganizationItem | null>(null);
  const [users, setUsers] = useState<ManagedUserItem[]>([]);
  const [licenseTypes, setLicenseTypes] = useState<LicenseTypeItem[]>([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [unitId, setUnitId] = useState("");
  const [sectorId, setSectorId] = useState("");
  const [rtId, setRtId] = useState("");
  const [licenseTypeId, setLicenseTypeId] = useState("");
  const [status, setStatus] = useState("");
  const [channel, setChannel] = useState("");
  const [windowDays, setWindowDays] = useState("30");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState("25");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  function buildReportSearch(nextPage: number) {
    const search = new URLSearchParams();
    if (from) search.set("from", from);
    if (to) search.set("to", to);
    if (unitId) search.set("unitId", unitId);
    if (sectorId) search.set("sectorId", sectorId);
    if (rtId) search.set("rtId", rtId);
    if (licenseTypeId) search.set("licenseTypeId", licenseTypeId);
    if (status) search.set("status", status);
    if (channel) search.set("channel", channel);
    if (windowDays) search.set("windowDays", windowDays);
    if (pageSize) search.set("pageSize", pageSize);
    search.set("page", String(nextPage));
    return search;
  }

  async function load(nextPage = page) {
    setLoading(true);
    setError(null);
    const selected = reportOptions.find((option) => option.key === report) ?? reportOptions[0];
    const search = buildReportSearch(nextPage);

    try {
      const result = await api<ReportResponse>(`${selected.endpoint}?${search.toString()}`);
      setData(result);
      setPage(nextPage);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Falha ao carregar relatório.");
    } finally {
      setLoading(false);
    }
  }

  async function downloadCsv() {
    const selected = reportOptions.find((option) => option.key === report) ?? reportOptions[0];
    const response = await fetch(`${apiBaseUrl}${selected.endpoint}/csv?${buildReportSearch(1).toString()}`, { credentials: "include" });
    if (!response.ok) {
      setError("Falha ao exportar CSV.");
      return;
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = selected.fileName;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function loadFilterData() {
    try {
      const [organizationResult, usersResult, licenseTypesResult] = await Promise.all([
        api<{ organization: OrganizationItem }>("/v1/organization"),
        api<{ users: ManagedUserItem[] }>("/v1/users"),
        api<{ items: LicenseTypeItem[]; total: number }>("/v1/license-types")
      ]);
      setOrganization(organizationResult.organization);
      setUsers(usersResult.users);
      setLicenseTypes(licenseTypesResult.items);
    } catch {
      // Keep report execution available even if supporting filter data fails.
    }
  }

  useEffect(() => {
    void loadFilterData();
    void load(1);
  }, [report]);

  const selected = reportOptions.find((option) => option.key === report) ?? reportOptions[0];
  const pageSizeNumber = Number(pageSize) || 25;
  const sectors = organization?.units.flatMap((unit) => unit.sectors.map((sector) => ({ value: sector.id, label: `${sector.name} / ${unit.name}` }))) ?? [];
  const rtUsers = users.filter((item) => item.role === "RT" && item.active);
  const statusOptions =
    report === "notifications"
      ? notificationStatusFilterOptions
      : report === "documentsPending" || report === "documentsRejected"
        ? documentStatusFilterOptions
        : licenseStatusFilterOptions;

  return (
    <div className="content-stack">
      <section className="panel report-selector">
        <label>
          Relatório
          <select value={report} onChange={(event) => setReport(event.target.value as ReportKey)}>
            {reportOptions.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <button className="secondary" type="button" onClick={() => void downloadCsv()}>
          <Icon name="download" /> Exportar CSV
        </button>
      </section>

      <OperationalFilters
        fields={[
          { key: "from", label: "Início", type: "date", value: from, onChange: setFrom },
          { key: "to", label: "Fim", type: "date", value: to, onChange: setTo },
          {
            key: "unitId",
            label: "Unidade",
            type: "select",
            value: unitId,
            placeholder: "Todas as unidades",
            options: organization?.units.map((unit) => ({ value: unit.id, label: unit.name })) ?? [],
            help: "Restringe a consulta a uma unidade específica.",
            helpHref: "#filtros-e-ids",
            onChange: setUnitId
          },
          {
            key: "sectorId",
            label: "Setor",
            type: "select",
            value: sectorId,
            placeholder: "Todos os setores",
            options: sectors,
            help: "Setor refinado dentro da estrutura operacional.",
            helpHref: "#filtros-e-ids",
            onChange: setSectorId
          },
          {
            key: "rtId",
            label: "RT responsável",
            type: "select",
            value: rtId,
            placeholder: "Todos os RTs",
            options: rtUsers.map((item) => ({ value: item.id, label: `${item.name} (${item.email})` })),
            help: "Filtra profissionais vinculados a um RT específico.",
            helpHref: "#perfis-e-permissoes",
            onChange: setRtId
          },
          {
            key: "licenseTypeId",
            label: "Tipo de licença",
            type: "select",
            value: licenseTypeId,
            placeholder: "Todos os tipos",
            options: licenseTypes.filter((item) => item.active).map((item) => ({ value: item.id, label: item.name })),
            help: "Filtra pelo tipo cadastrado em Licenças.",
            helpHref: "#licencas",
            onChange: setLicenseTypeId
          },
          {
            key: "status",
            label: "Status",
            type: "select",
            value: status,
            placeholder: "Todos os status",
            options: statusOptions,
            help: "Use o status técnico adequado ao relatório selecionado.",
            helpHref: "#relatorios",
            onChange: setStatus
          },
          { key: "channel", label: "Canal", type: "select", value: channel, placeholder: "Todos os canais", options: notificationChannelFilterOptions, onChange: setChannel },
          { key: "windowDays", label: "Janela em dias", type: "select", value: windowDays, placeholder: "Selecione", options: reportWindowFilterOptions, onChange: setWindowDays },
          { key: "pageSize", label: "Por página", type: "select", value: pageSize, placeholder: "25", options: pageSizeFilterOptions, onChange: setPageSize }
        ]}
        onSubmit={() => void load(1)}
      />

      <section className="panel table-panel">
        <h2>{selected.label}</h2>
        {error ? (
          <OperationalState state="error" title="Falha ao carregar relatório" detail={error} />
        ) : loading ? (
          <OperationalState state="loading" title="Carregando relatório" />
        ) : !data || data.items.length === 0 ? (
          <OperationalState state="empty" title="Nenhum dado encontrado" detail="Ajuste os filtros ou gere novos eventos operacionais." />
        ) : (
          <>
            <OperationalTable
              items={data.items}
              getRowKey={(item) => reportText(item, "id") + reportText(item, "label")}
              columns={reportColumns(report)}
            />
            <div className="pagination-actions">
              <PaginationSummary page={page} pageSize={pageSizeNumber} total={data.total} />
              <div>
                <button className="secondary" type="button" disabled={page <= 1 || loading} onClick={() => void load(page - 1)}>
                  Anterior
                </button>
                <button
                  className="secondary"
                  type="button"
                  disabled={page * pageSizeNumber >= data.total || loading}
                  onClick={() => void load(page + 1)}
                >
                  Próxima
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function ProfessionalsView({ user }: { user: CurrentUser }) {
  const [items, setItems] = useState<ProfessionalSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [organization, setOrganization] = useState<OrganizationItem | null>(null);
  const [users, setUsers] = useState<ManagedUserItem[]>([]);
  const [selected, setSelected] = useState<ProfessionalDetail | null>(null);
  const [showProfessionalCpf, setShowProfessionalCpf] = useState(true);
  const [showProfessionalPhone, setShowProfessionalPhone] = useState(true);
  const [showProfessionalEmail, setShowProfessionalEmail] = useState(false);
  const [showProfessionalPosition, setShowProfessionalPosition] = useState(false);
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [unitFilter, setUnitFilter] = useState("");
  const [sectorFilter, setSectorFilter] = useState("");
  const [rtFilter, setRtFilter] = useState("");
  const [name, setName] = useState("");
  const [cpf, setCpf] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [position, setPosition] = useState("");
  const [unitId, setUnitId] = useState("");
  const [sectorId, setSectorId] = useState("");
  const [responsibleRtId, setResponsibleRtId] = useState("");
  const [linkedUserId, setLinkedUserId] = useState("");
  const [notes, setNotes] = useState("");
  const [editingProfessionalId, setEditingProfessionalId] = useState("");
  const [editProfessionalName, setEditProfessionalName] = useState("");
  const [editProfessionalEmail, setEditProfessionalEmail] = useState("");
  const [editProfessionalPhone, setEditProfessionalPhone] = useState("");
  const [editProfessionalPosition, setEditProfessionalPosition] = useState("");
  const [editProfessionalUnitId, setEditProfessionalUnitId] = useState("");
  const [editProfessionalSectorId, setEditProfessionalSectorId] = useState("");
  const [editProfessionalRtId, setEditProfessionalRtId] = useState("");
  const [editProfessionalUserId, setEditProfessionalUserId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importCsv, setImportCsv] = useState("");
  const [importResult, setImportResult] = useState<CsvImportResult | null>(null);
  const [importing, setImporting] = useState(false);
  const [googleAuthBusy, setGoogleAuthBusy] = useState(false);
  const [googleStatus, setGoogleStatus] = useState<GoogleIntegrationStatus | null>(null);
  const [googleSheetLink, setGoogleSheetLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function loadGoogleStatus() {
    if (user.role !== "ADMIN") return;
    const result = await api<GoogleIntegrationStatus>("/v1/integrations/google/status");
    setGoogleStatus(result);
  }

  async function load() {
    setLoading(true);
    setError(null);
    const search = new URLSearchParams();
    if (query) search.set("query", query);
    if (activeFilter === "true" || activeFilter === "false") search.set("active", activeFilter);
    if (unitFilter) search.set("unitId", unitFilter);
    if (sectorFilter) search.set("sectorId", sectorFilter);
    if (rtFilter) search.set("responsibleRtId", rtFilter);

    try {
      const [professionalsResult, organizationResult, usersResult, googleStatusResult] = await Promise.all([
        api<{ items: ProfessionalSummary[]; total: number }>(`/v1/professionals?${search.toString()}`),
        user.role === "ADMIN" ? api<{ organization: OrganizationItem }>("/v1/organization") : Promise.resolve(null),
        user.role === "ADMIN" ? api<{ users: ManagedUserItem[] }>("/v1/users") : Promise.resolve(null),
        user.role === "ADMIN" ? api<GoogleIntegrationStatus>("/v1/integrations/google/status") : Promise.resolve(null)
      ]);
      setItems(professionalsResult.items);
      setTotal(professionalsResult.total);
      if (organizationResult) {
        setOrganization(organizationResult.organization);
        setUnitId((current) => current || organizationResult.organization.units[0]?.id || "");
        setSectorId((current) => current || organizationResult.organization.units[0]?.sectors[0]?.id || "");
      }
      if (usersResult) setUsers(usersResult.users);
      if (googleStatusResult) setGoogleStatus(googleStatusResult);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Falha ao carregar profissionais.");
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
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Falha ao salvar profissional.");
    } finally {
      setSaving(false);
    }
  }

  async function create(event: FormEvent) {
    event.preventDefault();
    await run(async () => {
      await api("/v1/professionals", {
        method: "POST",
        body: JSON.stringify({
          name,
          cpf: cpf || null,
          email: email || null,
          phone: phone || null,
          position: position || null,
          unitId,
          sectorId,
          responsibleRtId: responsibleRtId || null,
          userId: linkedUserId || null,
          notes: notes || null
        })
      });
      setName("");
      setCpf("");
      setEmail("");
      setPhone("");
      setPosition("");
      setResponsibleRtId("");
      setLinkedUserId("");
      setNotes("");
    });
  }

  async function showDetail(professional: ProfessionalSummary) {
    setError(null);
    try {
      const result = await api<{ professional: ProfessionalDetail }>(`/v1/professionals/${professional.id}`);
      setSelected(result.professional);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Falha ao carregar detalhe.");
    }
  }

  function startProfessionalEdit(professional: ProfessionalSummary) {
    setEditingProfessionalId(professional.id);
    setEditProfessionalName(professional.name);
    setEditProfessionalEmail(professional.email ?? "");
    setEditProfessionalPhone(formatPhoneInput(professional.phone ?? ""));
    setEditProfessionalPosition(professional.position ?? "");
    setEditProfessionalUnitId(professional.unitId);
    setEditProfessionalSectorId(professional.sectorId);
    setEditProfessionalRtId(professional.responsibleRtId ?? "");
    setEditProfessionalUserId(professional.userId ?? "");
  }

  function cancelProfessionalEdit() {
    setEditingProfessionalId("");
    setEditProfessionalName("");
    setEditProfessionalEmail("");
    setEditProfessionalPhone("");
    setEditProfessionalPosition("");
    setEditProfessionalUnitId("");
    setEditProfessionalSectorId("");
    setEditProfessionalRtId("");
    setEditProfessionalUserId("");
  }

  async function saveProfessionalEdit(event: FormEvent) {
    event.preventDefault();
    if (!editingProfessionalId) return;
    await run(async () => {
      await api(`/v1/professionals/${editingProfessionalId}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: editProfessionalName,
          email: editProfessionalEmail || null,
          phone: editProfessionalPhone || null,
          position: editProfessionalPosition || null,
          unitId: editProfessionalUnitId,
          sectorId: editProfessionalSectorId,
          responsibleRtId: editProfessionalRtId || null,
          userId: editProfessionalUserId || null
        })
      });
      cancelProfessionalEdit();
    });
  }

  async function readImportFile() {
    if (!importFile) throw new Error("Selecione um arquivo CSV.");
    const text = await importFile.text();
    setImportCsv(text);
    return text;
  }

  async function downloadImportTemplate() {
    const response = await fetch(`${apiBaseUrl}/v1/imports/professionals-licenses/template`, { credentials: "include" });
    if (!response.ok) throw new Error("Falha ao baixar modelo.");
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "modelo-profissionais-licencas.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  async function downloadImportWorkbook() {
    const response = await fetch(`${apiBaseUrl}/v1/imports/professionals-licenses/template.xlsx`, { credentials: "include" });
    if (!response.ok) throw new Error("Falha ao baixar planilha guiada.");
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "modelo-profissionais-licencas.xlsx";
    link.click();
    URL.revokeObjectURL(url);
  }

  function openPreparedWindow(name: string, features?: string) {
    return window.open("", name, features);
  }

  function navigateWindow(targetWindow: Window | null, url: string) {
    if (targetWindow && !targetWindow.closed) {
      targetWindow.location.href = url;
      return true;
    }
    return false;
  }

  function expectedGoogleOauthOrigin() {
    return new URL(apiBaseUrl || window.location.origin, window.location.origin).origin;
  }

  async function requestGoogleSheetTemplate(targetWindow?: Window | null) {
    setImporting(true);
    setImportError(null);
    setGoogleSheetLink(null);
    try {
      const result = await api<{ spreadsheetId: string; spreadsheetUrl: string; sharedWith: string[] }>(
        "/v1/imports/professionals-licenses/template/google-sheet"
      );
      const opened = navigateWindow(targetWindow ?? null, result.spreadsheetUrl);
      if (!opened) {
        const popup = window.open(result.spreadsheetUrl, "_blank", "noopener,noreferrer");
        if (popup) {
          return;
        }
        setGoogleSheetLink(result.spreadsheetUrl);
        setImportError("A planilha foi criada, mas o navegador bloqueou a nova aba. Use o link abaixo.");
      }
    } catch (caught) {
      if (targetWindow && !targetWindow.closed) {
        targetWindow.close();
      }
      setImportError(
        caught instanceof Error
          ? caught.message
          : "Não foi possível gerar a planilha Google. Verifique credenciais e permissões do Google Sheets."
      );
    } finally {
      setImporting(false);
    }
  }

  async function connectGoogleAndGenerateSheet(preparedWindow?: Window | null) {
    setGoogleAuthBusy(true);
    setImportError(null);
    return new Promise<void>((resolve) => {
      const popup = preparedWindow ?? openPreparedWindow("alwaystrack-google-oauth", "popup=yes,width=560,height=720");
      if (!popup) {
        window.location.assign(`${apiBaseUrl}/v1/integrations/google/oauth/start`);
        setGoogleAuthBusy(false);
        resolve();
        return;
      }
      navigateWindow(popup, `${apiBaseUrl}/v1/integrations/google/oauth/start`);

      const timer = window.setInterval(() => {
        if (popup.closed) {
          cleanup();
          setGoogleAuthBusy(false);
          resolve();
        }
      }, 500);

      function cleanup() {
        window.clearInterval(timer);
        window.removeEventListener("message", handleMessage);
      }

      async function handleMessage(event: MessageEvent) {
        if (event.origin !== expectedGoogleOauthOrigin()) return;
        const payload = event.data as { type?: string; status?: string; message?: string } | null;
        if (!payload || payload.type !== "alwaystrack-google-oauth") return;
        cleanup();
        if (payload.status === "success") {
          await loadGoogleStatus();
          await requestGoogleSheetTemplate(popup);
        } else {
          if (popup && !popup.closed) {
            popup.close();
          }
          setImportError(payload.message || "Não foi possível concluir a conexão com o Google.");
        }
        setGoogleAuthBusy(false);
        resolve();
      }

      window.addEventListener("message", handleMessage);
    });
  }

  async function disconnectGoogleIntegration() {
    setGoogleAuthBusy(true);
    setImportError(null);
    try {
      await api<{ disconnected: boolean }>("/v1/integrations/google", { method: "DELETE" });
      await loadGoogleStatus();
    } catch (caught) {
      setImportError(caught instanceof Error ? caught.message : "Falha ao desconectar Google.");
    } finally {
      setGoogleAuthBusy(false);
    }
  }

  async function createGoogleSheetTemplate() {
    if (googleStatus?.oauthConfigured && !googleStatus.connected) {
      const preparedWindow = openPreparedWindow("alwaystrack-google-oauth", "popup=yes,width=560,height=720");
      await connectGoogleAndGenerateSheet(preparedWindow);
      return;
    }
    const preparedWindow = openPreparedWindow("alwaystrack-google-sheet");
    await requestGoogleSheetTemplate(preparedWindow);
  }

  async function validateImport() {
    setImporting(true);
    setImportError(null);
    try {
      const csv = await readImportFile();
      const result = await api<CsvImportResult>("/v1/imports/professionals-licenses/validate", {
        method: "POST",
        body: JSON.stringify({ csv })
      });
      setImportResult(result);
    } catch (caught) {
      setImportError(caught instanceof Error ? caught.message : "Falha ao validar CSV.");
    } finally {
      setImporting(false);
    }
  }

  async function commitImport() {
    if (!importResult || importResult.errorRows > 0) return;
    setImporting(true);
    setImportError(null);
    try {
      const csv = importCsv || (await readImportFile());
      const result = await api<CsvImportResult>("/v1/imports/professionals-licenses/commit", {
        method: "POST",
        body: JSON.stringify({ csv })
      });
      setImportResult(result);
      await load();
    } catch (caught) {
      setImportError(caught instanceof Error ? caught.message : "Falha ao importar CSV.");
    } finally {
      setImporting(false);
    }
  }

  const sectors = organization?.units.flatMap((unit) => unit.sectors.map((sector) => ({ ...sector, unitName: unit.name }))) ?? [];
  const selectedUnitSectors = organization?.units.find((unit) => unit.id === unitId)?.sectors ?? [];
  const editUnitSectors = organization?.units.find((unit) => unit.id === editProfessionalUnitId)?.sectors ?? [];
  const rtUsers = users.filter((item) => item.role === "RT" && item.active);
  const linkableUsers = users.filter((item) => !items.some((professional) => professional.userId === item.id));
  const editableUsers = users.filter(
    (item) => !items.some((professional) => professional.userId === item.id && professional.id !== editingProfessionalId)
  );

  return (
    <div className="content-stack">
      <OperationalFilters
        fields={[
          { key: "query", label: "Busca", value: query, placeholder: "Nome, CPF, email ou cargo", onChange: setQuery },
          {
            key: "active",
            label: "Situação",
            type: "select",
            value: activeFilter,
            placeholder: "Ativos e inativos",
            options: activeFilterOptions,
            help: "Filtra entre profissionais ativos e inativos.",
            helpHref: "#profissionais",
            onChange: setActiveFilter
          },
          {
            key: "unit",
            label: "Unidade",
            type: "select",
            value: unitFilter,
            placeholder: "Todas as unidades",
            options: organization?.units.map((unit) => ({ value: unit.id, label: unit.name })) ?? [],
            help: "Filtra pela unidade operacional.",
            helpHref: "#filtros-e-ids",
            onChange: setUnitFilter
          },
          {
            key: "sector",
            label: "Setor",
            type: "select",
            value: sectorFilter,
            placeholder: "Todos os setores",
            options: sectors.map((sector) => ({ value: sector.id, label: `${sector.name} / ${sector.unitName}` })),
            help: "Filtra pelo setor operacional.",
            helpHref: "#filtros-e-ids",
            onChange: setSectorFilter
          },
          {
            key: "rt",
            label: "RT responsável",
            type: "select",
            value: rtFilter,
            placeholder: "Todos os RTs",
            options: rtUsers.map((rt) => ({ value: rt.id, label: `${rt.name} (${rt.email})` })),
            help: "Filtra pelo usuário RT responsável.",
            helpHref: "#perfis-e-permissoes",
            onChange: setRtFilter
          }
        ]}
        onSubmit={load}
      />

      {error ? <OperationalState state="error" title="Falha operacional" detail={error} /> : null}

      {user.role === "ADMIN" && organization ? (
        <section className="panel form-panel">
          <h2>Importar CSV</h2>
          <p className="muted">Carga inicial de profissionais e licenças. Valide o arquivo antes de confirmar.</p>
          <div className="import-preview import-hints">
            <p><strong>Antes de importar</strong></p>
            <ul>
              <li>O arquivo deve usar exatamente o cabeçalho do modelo baixado.</li>
              <li>`rt_email` precisa ser o email real de um usuário com perfil `RT` já cadastrado e ativo.</li>
              <li>`unit_name`, `sector_name` e `license_type` precisam existir no sistema antes da validação.</li>
              <li>Datas devem estar em `YYYY-MM-DD` e o `status` deve usar valores como `REGULAR`, `EXPIRING` ou `EXPIRED`.</li>
              <li>A planilha guiada `.xlsx` já traz listas válidas para unidade, setor, RT e tipo de licença. Depois de preencher, exporte como CSV para importar.</li>
            </ul>
          </div>
          <div className="form-grid">
            <label>
              <span className="label-row">Arquivo CSV <InfoTip text="Use o modelo oficial; uma linha por licenca." href="#importacao-csv" /></span>
              <input
                accept=".csv,text/csv"
                type="file"
                onChange={(event) => {
                  setImportFile(event.target.files?.[0] ?? null);
                  setImportResult(null);
                  setImportError(null);
                }}
              />
            </label>
          </div>
          <div className="form-actions">
            <button className="secondary" disabled={importing || googleAuthBusy} type="button" onClick={() => void createGoogleSheetTemplate()}>
              {googleAuthBusy
                ? "Conectando..."
                : googleStatus?.oauthConfigured && !googleStatus.connected
                  ? "Conectar Google e gerar planilha"
                  : "Gerar Google Sheet"}
            </button>
            <button className="secondary" disabled={importing} type="button" onClick={() => void downloadImportWorkbook()}>
              Baixar planilha guiada (.xlsx)
            </button>
            <button className="secondary" disabled={importing} type="button" onClick={() => void downloadImportTemplate()}>
              Baixar CSV simples
            </button>
            <button className="secondary" disabled={importing || !importFile} type="button" onClick={() => void validateImport()}>
              Validar
            </button>
            <button disabled={importing || !importResult || importResult.errorRows > 0} type="button" onClick={() => void commitImport()}>
              Confirmar importação
            </button>
          </div>
          {importError ? <OperationalState state="error" title="Falha na importação" detail={importError} /> : null}
          {googleStatus ? (
            <div className="import-preview">
              <p>
                Google:{" "}
                {googleStatus.connected
                  ? "conectado para criar planilhas no Drive da sua conta."
                  : googleStatus.oauthConfigured
                    ? "não conectado; o primeiro clique abrirá a autorização do Google."
                    : googleStatus.fallbackAvailable
                      ? "sem OAuth por usuário; será usado o fallback configurado no backend."
                      : "não configurado."}
              </p>
              {googleStatus.connected ? (
                <div className="form-actions">
                  <button
                    className="secondary"
                    disabled={googleAuthBusy || importing}
                    type="button"
                    onClick={() => void disconnectGoogleIntegration()}
                  >
                    Desconectar Google
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
          {googleSheetLink ? (
            <div className="import-preview">
              <p>
                Link da planilha:{" "}
                <a href={googleSheetLink} rel="noreferrer noopener" target="_blank">
                  Abrir Google Sheet
                </a>
              </p>
            </div>
          ) : null}
          {importResult ? (
            <div className="import-preview">
              <p>
                {importResult.validRows} válidas / {importResult.errorRows} com erro. Profissionais: +{importResult.willCreateProfessionals} / atualiza {importResult.willUpdateProfessionals}. Licenças: +{importResult.willCreateLicenses} / atualiza {importResult.willUpdateLicenses}.
              </p>
              {importResult.professionalsCreated !== undefined ? (
                <p className="muted">
                  Importado: {importResult.professionalsCreated} profissionais criados, {importResult.professionalsUpdated} atualizados, {importResult.licensesCreated} licenças criadas, {importResult.licensesUpdated} atualizadas.
                </p>
              ) : null}
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Linha</th>
                      <th>Profissional</th>
                      <th>CPF</th>
                      <th>Licença</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importResult.rows.slice(0, 25).map((row) => (
                      <tr key={row.line}>
                        <td>{row.line}</td>
                        <td>{row.professionalName}</td>
                        <td>{row.cpf}</td>
                        <td>{row.licenseType}{row.licenseNumber ? ` / ${row.licenseNumber}` : ""}</td>
                        <td>{row.errors.length ? row.errors.join(" ") : row.action === "create" ? "Criar" : "Atualizar"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      {user.role === "ADMIN" && organization ? (
        <section className="panel form-panel">
          <form onSubmit={create}>
            <h2>Novo profissional</h2>
            <div className="form-grid">
              <label>
                Nome
                <input value={name} onChange={(event) => setName(event.target.value)} />
              </label>
              <label>
                <span className="label-row">CPF <InfoTip text="Use o CPF para evitar duplicidade de profissional." href="#cadastro-profissional" /></span>
                <input
                  inputMode="numeric"
                  maxLength={14}
                  placeholder="000.000.000-00"
                  value={cpf}
                  onChange={(event) => setCpf(formatCpfInput(event.target.value))}
                />
              </label>
              <label>
                <span className="label-row">Email <InfoTip text="Use email correto quando a pessoa tambem precisar acessar ou receber contato." href="#cadastro-profissional" /></span>
                <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" />
              </label>
              <label>
                <span className="label-row">Telefone <InfoTip text="Informe telefone de contato operacional; notificacoes reais dependem de configuracao." href="#notificacoes" /></span>
                <input
                  inputMode="tel"
                  maxLength={19}
                  placeholder="+55 (83) 90000-0000"
                  value={phone}
                  onChange={(event) => setPhone(formatPhoneInput(event.target.value))}
                />
              </label>
              <label>
                Cargo
                <input value={position} onChange={(event) => setPosition(event.target.value)} />
              </label>
              <label>
                <span className="label-row">Unidade <InfoTip text="Unidade define escopo, filtros e relatorios deste profissional." href="#configuracao-organizacao" /></span>
                <select
                  value={unitId}
                  onChange={(event) => {
                    const nextUnitId = event.target.value;
                    setUnitId(nextUnitId);
                    setSectorId(organization.units.find((unit) => unit.id === nextUnitId)?.sectors[0]?.id ?? "");
                  }}
                >
                  {organization.units.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="label-row">Setor <InfoTip text="Setor limita visualizacao e ajuda a localizar pendencias." href="#configuracao-organizacao" /></span>
                <select value={sectorId} onChange={(event) => setSectorId(event.target.value)}>
                  {selectedUnitSectors.map((sector) => (
                    <option key={sector.id} value={sector.id}>
                      {sector.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="label-row">RT responsável <InfoTip text="Pessoa responsável técnica pelo acompanhamento deste profissional." href="#perfis-e-permissoes" /></span>
                <select value={responsibleRtId} onChange={(event) => setResponsibleRtId(event.target.value)}>
                  <option value="">Sem RT</option>
                  {rtUsers.map((rt) => (
                    <option key={rt.id} value={rt.id}>
                      {rt.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="label-row">Usuário vinculado <InfoTip text="Opcional. Use quando o profissional também acessa o sistema." href="#profissionais" /></span>
                <select value={linkedUserId} onChange={(event) => setLinkedUserId(event.target.value)}>
                  <option value="">Sem usuário</option>
                  {linkableUsers.map((linkedUser) => (
                    <option key={linkedUser.id} value={linkedUser.id}>
                      {linkedUser.name} ({linkedUser.role})
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="label-row">Observações <InfoTip text="Registre apenas contexto operacional; nao cole senhas, tokens ou segredos." href="#glossario" /></span>
                <input value={notes} onChange={(event) => setNotes(event.target.value)} />
              </label>
            </div>
            <button disabled={saving || !name.trim() || !unitId || !sectorId}>Criar profissional</button>
          </form>
        </section>
      ) : null}

      <section className="panel table-panel">
        <div className="table-panel-toolbar">
          <span className="label-row">
            <strong>Exibir na tabela</strong>
          </span>
          <div className="table-panel-toggle-group">
            <label className="checkbox-row compact-toggle">
              <input checked={showProfessionalCpf} onChange={() => setShowProfessionalCpf((current) => !current)} type="checkbox" />
              CPF
            </label>
            <label className="checkbox-row compact-toggle">
              <input checked={showProfessionalPhone} onChange={() => setShowProfessionalPhone((current) => !current)} type="checkbox" />
              Telefone
            </label>
            <label className="checkbox-row compact-toggle">
              <input checked={showProfessionalEmail} onChange={() => setShowProfessionalEmail((current) => !current)} type="checkbox" />
              Email
            </label>
            <label className="checkbox-row compact-toggle">
              <input checked={showProfessionalPosition} onChange={() => setShowProfessionalPosition((current) => !current)} type="checkbox" />
              Cargo
            </label>
          </div>
        </div>
        {loading ? (
          <OperationalState state="loading" title="Carregando profissionais" />
        ) : items.length === 0 ? (
          <OperationalState state="empty" title="Nenhum profissional encontrado" />
        ) : (
          <>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Profissional</th>
                    <th>Unidade</th>
                    <th>Setor</th>
                    <th>RT</th>
                    <th>Histórico</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const isEditing = editingProfessionalId === item.id;
                    return (
                      <Fragment key={item.id}>
                        <tr className={isEditing ? "table-row-editing" : undefined} key={item.id}>
                          <td>
                            <div className="table-identity">
                              <strong>{item.name}</strong>
                              <div className="table-identity-meta">
                                {showProfessionalCpf && item.cpf ? <span>CPF: {item.cpf}</span> : null}
                                {showProfessionalPhone && item.phone ? <span>Tel: {item.phone}</span> : null}
                                {showProfessionalEmail && item.email ? <span>Email: {item.email}</span> : null}
                                {showProfessionalPosition && item.position ? <span>Cargo: {item.position}</span> : null}
                              </div>
                            </div>
                          </td>
                          <td>{item.unit.name}</td>
                          <td>{item.sector.name}</td>
                          <td>{item.responsibleRt?.name ?? "Sem RT"}</td>
                          <td>{`${item._count.licenses} licenças / ${item._count.documents} docs / ${item._count.notificationJobs} avisos`}</td>
                          <td>
                            <StatusBadge kind="active" value={item.active ? "ACTIVE" : "INACTIVE"} />
                          </td>
                          <td>
                            <div className="row-actions">
                              <button className="secondary" type="button" onClick={() => void showDetail(item)}>
                                Detalhe
                              </button>
                              {user.role === "ADMIN" ? (
                                <>
                                  <button className="secondary" type="button" onClick={() => startProfessionalEdit(item)}>
                                    {isEditing ? "Editando" : "Editar"}
                                  </button>
                                  <ConfirmButton
                                    disabled={saving}
                                    confirmLabel={item.active ? "Confirmar desativação" : "Confirmar reativação"}
                                    onConfirm={() =>
                                      void run(async () => {
                                        await api(`/v1/professionals/${item.id}`, {
                                          method: "PATCH",
                                          body: JSON.stringify({ active: !item.active })
                                        });
                                      })
                                    }
                                  >
                                    {item.active ? "Desativar" : "Reativar"}
                                  </ConfirmButton>
                                </>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                        {user.role === "ADMIN" && organization && isEditing ? (
                          <tr className="inline-editor-row">
                            <td colSpan={7}>
                              <div className="inline-editor-shell">
                                <form className="inline-editor-form" onSubmit={saveProfessionalEdit}>
                                  <div className="inline-editor-header">
                                    <h3>Editar profissional</h3>
                                    <span className="muted">Ajuste os dados do cadastro sem sair da linha.</span>
                                  </div>
                                  <div className="form-grid">
                                    <label>
                                      Nome
                                      <input value={editProfessionalName} onChange={(event) => setEditProfessionalName(event.target.value)} />
                                    </label>
                                    <label>
                                      Email
                                      <input value={editProfessionalEmail} onChange={(event) => setEditProfessionalEmail(event.target.value)} type="email" />
                                    </label>
                                    <label>
                                      Telefone
                                      <input
                                        inputMode="tel"
                                        maxLength={19}
                                        placeholder="+55 (83) 90000-0000"
                                        value={editProfessionalPhone}
                                        onChange={(event) => setEditProfessionalPhone(formatPhoneInput(event.target.value))}
                                      />
                                    </label>
                                    <label>
                                      Cargo
                                      <input value={editProfessionalPosition} onChange={(event) => setEditProfessionalPosition(event.target.value)} />
                                    </label>
                                    <label>
                                      Unidade
                                      <select
                                        value={editProfessionalUnitId}
                                        onChange={(event) => {
                                          const nextUnitId = event.target.value;
                                          setEditProfessionalUnitId(nextUnitId);
                                          setEditProfessionalSectorId(organization.units.find((unit) => unit.id === nextUnitId)?.sectors[0]?.id ?? "");
                                        }}
                                      >
                                        {organization.units.map((unit) => (
                                          <option key={unit.id} value={unit.id}>
                                            {unit.name}
                                          </option>
                                        ))}
                                      </select>
                                    </label>
                                    <label>
                                      Setor
                                      <select value={editProfessionalSectorId} onChange={(event) => setEditProfessionalSectorId(event.target.value)}>
                                        {editUnitSectors.map((sector) => (
                                          <option key={sector.id} value={sector.id}>
                                            {sector.name}
                                          </option>
                                        ))}
                                      </select>
                                    </label>
                                    <label>
                                      RT responsável
                                      <select value={editProfessionalRtId} onChange={(event) => setEditProfessionalRtId(event.target.value)}>
                                        <option value="">Sem RT</option>
                                        {rtUsers.map((rt) => (
                                          <option key={rt.id} value={rt.id}>
                                            {rt.name}
                                          </option>
                                        ))}
                                      </select>
                                    </label>
                                    <label>
                                      Usuário vinculado
                                      <select value={editProfessionalUserId} onChange={(event) => setEditProfessionalUserId(event.target.value)}>
                                        <option value="">Sem usuário</option>
                                        {editableUsers.map((linkedUser) => (
                                          <option key={linkedUser.id} value={linkedUser.id}>
                                            {linkedUser.name} ({linkedUser.role})
                                          </option>
                                        ))}
                                      </select>
                                    </label>
                                  </div>
                                  <div className="form-actions">
                                    <button disabled={saving || !editProfessionalName.trim() || !editProfessionalUnitId || !editProfessionalSectorId}>
                                      Salvar edição
                                    </button>
                                    <button className="secondary" disabled={saving} type="button" onClick={cancelProfessionalEdit}>
                                      Cancelar
                                    </button>
                                  </div>
                                </form>
                              </div>
                            </td>
                          </tr>
                        ) : null}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <PaginationSummary page={1} pageSize={25} total={total} />
          </>
        )}
      </section>

      {selected ? (
        <section className="panel table-panel">
          <div className="detail-header">
            <div>
              <h2>{selected.name}</h2>
              <p className="muted">
                {selected.unit.name} / {selected.sector.name} / {selected.responsibleRt?.name ?? "Sem RT"}
              </p>
            </div>
            <button className="secondary" type="button" onClick={() => setSelected(null)}>
              Fechar
            </button>
          </div>
          <div className="detail-grid">
            <div>
              <strong>Licenças</strong>
              {selected.licenses.length === 0 ? (
                <p className="muted">Sem licenças.</p>
              ) : (
                selected.licenses.map((license) => (
                  <p key={license.id}>
                    {license.licenseType.name} / {license.number ?? "sem número"} / {license.status}
                  </p>
                ))
              )}
            </div>
            <div>
              <strong>Documentos</strong>
              {selected.documents.length === 0 ? (
                <p className="muted">Sem documentos.</p>
              ) : (
                selected.documents.map((document) => (
                  <p key={document.id}>
                    {document.fileName} / {document.status}
                  </p>
                ))
              )}
            </div>
            <div>
              <strong>Notificações</strong>
              {selected.notificationJobs.length === 0 ? (
                <p className="muted">Sem notificações.</p>
              ) : (
                selected.notificationJobs.map((job) => (
                  <p key={job.id}>
                    {job.channel} / {job.status}
                  </p>
                ))
              )}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}

function toDateInput(value: string | null) {
  return value ? value.slice(0, 10) : "";
}

function LicensesView({ user }: { user: CurrentUser }) {
  const [licenses, setLicenses] = useState<LicenseItem[]>([]);
  const [licenseTypes, setLicenseTypes] = useState<LicenseTypeItem[]>([]);
  const [professionals, setProfessionals] = useState<ProfessionalSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [professionalFilter, setProfessionalFilter] = useState("");
  const [licenseTypeFilter, setLicenseTypeFilter] = useState("");
  const [typeName, setTypeName] = useState("");
  const [typeDescription, setTypeDescription] = useState("");
  const [typeWarningDays, setTypeWarningDays] = useState("");
  const [professionalId, setProfessionalId] = useState("");
  const [licenseTypeId, setLicenseTypeId] = useState("");
  const [number, setNumber] = useState("");
  const [issuer, setIssuer] = useState("");
  const [uf, setUf] = useState("");
  const [issuedAt, setIssuedAt] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [status, setStatus] = useState<LicenseStatus>("REGULAR");
  const [notes, setNotes] = useState("");
  const [editingLicenseTypeId, setEditingLicenseTypeId] = useState("");
  const [editTypeName, setEditTypeName] = useState("");
  const [editTypeDescription, setEditTypeDescription] = useState("");
  const [editTypeWarningDays, setEditTypeWarningDays] = useState("");
  const [editingLicenseId, setEditingLicenseId] = useState("");
  const [editLicenseNumber, setEditLicenseNumber] = useState("");
  const [editLicenseIssuer, setEditLicenseIssuer] = useState("");
  const [editLicenseUf, setEditLicenseUf] = useState("");
  const [editLicenseExpiresAt, setEditLicenseExpiresAt] = useState("");
  const [editLicenseStatus, setEditLicenseStatus] = useState<LicenseStatus>("REGULAR");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastUploadLink, setLastUploadLink] = useState<{ link: string; label: string; expiresAt: string } | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    const search = new URLSearchParams();
    if (query) search.set("query", query);
    if (statusFilter) search.set("status", statusFilter);
    if (professionalFilter) search.set("professionalId", professionalFilter);
    if (licenseTypeFilter) search.set("licenseTypeId", licenseTypeFilter);

    try {
      const [licensesResult, typesResult, professionalsResult] = await Promise.all([
        api<{ items: LicenseItem[]; total: number }>(`/v1/licenses?${search.toString()}`),
        api<{ items: LicenseTypeItem[]; total: number }>("/v1/license-types"),
        api<{ items: ProfessionalSummary[]; total: number }>("/v1/professionals")
      ]);
      setLicenses(licensesResult.items);
      setTotal(licensesResult.total);
      setLicenseTypes(typesResult.items);
      setProfessionals(professionalsResult.items);
      setProfessionalId((current) => current || professionalsResult.items[0]?.id || "");
      setLicenseTypeId((current) => current || typesResult.items[0]?.id || "");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Falha ao carregar licenças.");
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
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Falha ao salvar licença.");
    } finally {
      setSaving(false);
    }
  }

  async function createType(event: FormEvent) {
    event.preventDefault();
    await run(async () => {
      await api("/v1/license-types", {
        method: "POST",
        body: JSON.stringify({
          name: typeName,
          description: typeDescription || null,
          defaultWarningDays: typeWarningDays || null
        })
      });
      setTypeName("");
      setTypeDescription("");
      setTypeWarningDays("");
    });
  }

  async function createLicenseRecord(event: FormEvent) {
    event.preventDefault();
    await run(async () => {
      await api("/v1/licenses", {
        method: "POST",
        body: JSON.stringify({
          professionalId,
          licenseTypeId,
          number: number || null,
          issuer: issuer || null,
          uf: uf || null,
          issuedAt: issuedAt || null,
          expiresAt: expiresAt || null,
          status,
          notes: notes || null
        })
      });
      setNumber("");
      setIssuer("");
      setUf("");
      setIssuedAt("");
      setExpiresAt("");
      setStatus("REGULAR");
      setNotes("");
    });
  }

  function startLicenseTypeEdit(licenseType: LicenseTypeItem) {
    setEditingLicenseTypeId(licenseType.id);
    setEditTypeName(licenseType.name);
    setEditTypeDescription(licenseType.description ?? "");
    setEditTypeWarningDays(licenseType.defaultWarningDays ?? "");
  }

  function cancelLicenseTypeEdit() {
    setEditingLicenseTypeId("");
    setEditTypeName("");
    setEditTypeDescription("");
    setEditTypeWarningDays("");
  }

  async function saveLicenseTypeEdit(event: FormEvent) {
    event.preventDefault();
    if (!editingLicenseTypeId) return;
    await run(async () => {
      await api(`/v1/license-types/${editingLicenseTypeId}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: editTypeName,
          description: editTypeDescription || null,
          defaultWarningDays: editTypeWarningDays || null
        })
      });
      cancelLicenseTypeEdit();
    });
  }

  function startLicenseEdit(license: LicenseItem) {
    setEditingLicenseId(license.id);
    setEditLicenseNumber(license.number ?? "");
    setEditLicenseIssuer(license.issuer ?? "");
    setEditLicenseUf(license.uf ?? "");
    setEditLicenseExpiresAt(toDateInput(license.expiresAt));
    setEditLicenseStatus(license.status);
  }

  function cancelLicenseEdit() {
    setEditingLicenseId("");
    setEditLicenseNumber("");
    setEditLicenseIssuer("");
    setEditLicenseUf("");
    setEditLicenseExpiresAt("");
    setEditLicenseStatus("REGULAR");
  }

  async function saveLicenseEdit(event: FormEvent) {
    event.preventDefault();
    if (!editingLicenseId) return;
    await run(async () => {
      await api(`/v1/licenses/${editingLicenseId}`, {
        method: "PATCH",
        body: JSON.stringify({
          number: editLicenseNumber || null,
          issuer: editLicenseIssuer || null,
          uf: editLicenseUf || null,
          expiresAt: editLicenseExpiresAt || null,
          status: editLicenseStatus
        })
      });
      cancelLicenseEdit();
    });
  }

  async function recalculateStatuses() {
    await run(async () => {
      await api("/v1/licenses/recalculate", { method: "POST", body: JSON.stringify({}) });
    });
  }

  async function generateUploadLink(license: LicenseItem) {
    await run(async () => {
      const result = await api<{ uploadToken: { id: string; expiresAt: string }; token: string }>("/v1/upload-tokens", {
        method: "POST",
        body: JSON.stringify({ professionalId: license.professionalId, licenseId: license.id })
      });
      const link = `${window.location.origin}/upload/${result.token}`;
      setLastUploadLink({
        link,
        label: `${license.professional.name} / ${license.licenseType.name}${license.number ? ` ${license.number}` : ""}`,
        expiresAt: result.uploadToken.expiresAt
      });
      try {
        await navigator.clipboard?.writeText(link);
      } catch {
        // Browser permissions can block clipboard writes; the prompt still exposes the link.
      }
      window.prompt("Link de upload", link);
    });
  }

  async function copyLastUploadLink() {
    if (!lastUploadLink) return;
    try {
      await navigator.clipboard?.writeText(lastUploadLink.link);
    } catch {
      window.prompt("Link de upload", lastUploadLink.link);
    }
  }

  async function notifyLicense(license: LicenseItem) {
    await run(async () => {
      let result = await api<{ created: unknown[]; skipped: unknown[]; processed: unknown[] }>("/v1/notifications/manual-license", {
        method: "POST",
        body: JSON.stringify({ licenseId: license.id, processNow: true })
      });
      if (result.created.length === 0 && result.skipped.length > 0) {
        const retry = window.confirm(
          "Nenhuma nova mensagem foi criada agora, provavelmente por duplicidade do mesmo dia. Deseja forçar um reenvio manual?"
        );
        if (retry) {
          result = await api<{ created: unknown[]; skipped: unknown[]; processed: unknown[] }>("/v1/notifications/manual-license", {
            method: "POST",
            body: JSON.stringify({ licenseId: license.id, processNow: true, force: true })
          });
        }
      }
      window.alert(
        `Notificação manual concluída. Criadas: ${result.created.length}. Enviadas/processadas: ${result.processed.length}. Ignoradas: ${result.skipped.length}.`
      );
    });
  }

  const activeLicenseTypes = licenseTypes.filter((item) => item.active);
  const activeProfessionals = professionals.filter((item) => item.active);

  return (
    <div className="content-stack">
      <OperationalFilters
        fields={[
          { key: "query", label: "Busca", value: query, placeholder: "Profissional, CPF, tipo ou número", onChange: setQuery },
          {
            key: "status",
            label: "Status",
            type: "select",
            value: statusFilter,
            placeholder: "Todos os status",
            options: licenseStatusFilterOptions,
            help: "Use o status técnico da licença quando necessário.",
            helpHref: "#licencas",
            onChange: setStatusFilter
          },
          {
            key: "professional",
            label: "Profissional",
            type: "select",
            value: professionalFilter,
            placeholder: "Todos os profissionais",
            options: professionals.map((item) => ({ value: item.id, label: `${item.name}${item.cpf ? ` / ${item.cpf}` : ""}` })),
            help: "Filtra por um profissional específico.",
            helpHref: "#filtros-e-ids",
            onChange: setProfessionalFilter
          },
          {
            key: "type",
            label: "Tipo de licença",
            type: "select",
            value: licenseTypeFilter,
            placeholder: "Todos os tipos",
            options: licenseTypes.map((item) => ({ value: item.id, label: item.name })),
            help: "Filtra pelo tipo cadastrado em Licenças.",
            helpHref: "#licencas",
            onChange: setLicenseTypeFilter
          }
        ]}
        onSubmit={load}
      />

      {error ? <OperationalState state="error" title="Falha operacional" detail={error} /> : null}

      {lastUploadLink ? (
        <section className="panel upload-link-panel" aria-label="Último link de upload gerado">
          <div>
            <p className="eyebrow">Último link de upload</p>
            <strong>{lastUploadLink.label}</strong>
            <p className="muted">Expira em {formatDateBr(lastUploadLink.expiresAt)}</p>
          </div>
          <label>
            Link
            <input readOnly value={lastUploadLink.link} onFocus={(event) => event.currentTarget.select()} />
          </label>
          <button className="secondary" type="button" onClick={() => void copyLastUploadLink()}>
            Copiar
          </button>
        </section>
      ) : null}

      {user.role === "ADMIN" ? (
        <section className="panel action-panel">
          <span className="label-row">
            <button className="secondary" disabled={saving} type="button" onClick={() => void recalculateStatuses()}>
              Recalcular status
            </button>
            <InfoTip text="Reavalia vencimentos das licencas sem alterar documentos enviados." href="#cadastro-licenca" />
          </span>
        </section>
      ) : null}

      {user.role === "ADMIN" && editingLicenseTypeId ? (
        <section className="panel form-panel">
          <form onSubmit={saveLicenseTypeEdit}>
            <h2>Editar tipo de licença</h2>
            <div className="form-grid">
              <label>
                Nome
                <input value={editTypeName} onChange={(event) => setEditTypeName(event.target.value)} />
              </label>
              <label>
                Descrição
                <input value={editTypeDescription} onChange={(event) => setEditTypeDescription(event.target.value)} />
              </label>
              <label>
                Avisos padrão
                <input value={editTypeWarningDays} onChange={(event) => setEditTypeWarningDays(event.target.value)} placeholder="90,60,30" />
              </label>
            </div>
            <div className="form-actions">
              <button disabled={saving || !editTypeName.trim()}>Salvar edição</button>
              <button className="secondary" disabled={saving} type="button" onClick={cancelLicenseTypeEdit}>
                Cancelar
              </button>
            </div>
          </form>
        </section>
      ) : null}

      {user.role === "ADMIN" ? (
        <div className="settings-grid">
          <section className="panel form-panel">
            <form onSubmit={createType}>
              <h2>Novo tipo de licença</h2>
              <label>
                Nome
                <input value={typeName} onChange={(event) => setTypeName(event.target.value)} />
              </label>
              <label>
                Descrição
                <input value={typeDescription} onChange={(event) => setTypeDescription(event.target.value)} />
              </label>
              <label>
                <span className="label-row">Avisos padrão <InfoTip text="Dias antes do vencimento, separados por vírgula. Exemplo: 90,60,30." href="#notificacoes" /></span>
                <input
                  value={typeWarningDays}
                  onChange={(event) => setTypeWarningDays(event.target.value)}
                  placeholder="90,60,30"
                />
              </label>
              <button disabled={saving || !typeName.trim()}>Criar tipo</button>
            </form>
          </section>

          <section className="panel form-panel full-span">
            <form onSubmit={createLicenseRecord}>
              <h2>Nova licença</h2>
              <div className="form-grid">
                <label>
                  <span className="label-row">Profissional <InfoTip text="A licenca ficara vinculada a este profissional." href="#cadastro-licenca" /></span>
                  <select value={professionalId} onChange={(event) => setProfessionalId(event.target.value)}>
                    {activeProfessionals.map((professional) => (
                      <option key={professional.id} value={professional.id}>
                        {professional.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className="label-row">Tipo <InfoTip text="O tipo influencia relatorios e avisos padrao de vencimento." href="#cadastro-licenca" /></span>
                  <select value={licenseTypeId} onChange={(event) => setLicenseTypeId(event.target.value)}>
                    {activeLicenseTypes.map((licenseType) => (
                      <option key={licenseType.id} value={licenseType.id}>
                        {licenseType.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className="label-row">Número <InfoTip text="Copie o numero exatamente como aparece no documento." href="#cadastro-licenca" /></span>
                  <input value={number} onChange={(event) => setNumber(event.target.value)} />
                </label>
                <label>
                  <span className="label-row">Emissor <InfoTip text="Informe o orgao ou entidade emissora da licenca." href="#cadastro-licenca" /></span>
                  <input value={issuer} onChange={(event) => setIssuer(event.target.value)} />
                </label>
                <label>
                  <span className="label-row">UF <InfoTip text="Use a sigla do estado do registro, com duas letras." href="#cadastro-licenca" /></span>
                  <input value={uf} onChange={(event) => setUf(event.target.value)} maxLength={2} />
                </label>
                <label>
                  <span className="label-row">Emissão <InfoTip text="Confira a data de emissao antes de salvar." href="#cadastro-licenca" /></span>
                  <input value={issuedAt} onChange={(event) => setIssuedAt(event.target.value)} type="date" />
                </label>
                <label>
                  <span className="label-row">Vencimento <InfoTip text="Esta data alimenta status, dashboard e notificacoes." href="#cadastro-licenca" /></span>
                  <input value={expiresAt} onChange={(event) => setExpiresAt(event.target.value)} type="date" />
                </label>
                <label>
                  <span className="label-row">Status <InfoTip text="Use status manual com cuidado; o recalculo pode reavaliar vencimentos." href="#cadastro-licenca" /></span>
                  <select value={status} onChange={(event) => setStatus(event.target.value as LicenseStatus)}>
                    {licenseStatuses.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className="label-row">Observações <InfoTip text="Use para contexto operacional, nunca para credenciais." href="#glossario" /></span>
                  <input value={notes} onChange={(event) => setNotes(event.target.value)} />
                </label>
              </div>
              <button disabled={saving || !professionalId || !licenseTypeId}>Criar licença</button>
            </form>
          </section>
        </div>
      ) : null}

      <section className="panel table-panel">
        {loading ? (
          <OperationalState state="loading" title="Carregando licenças" />
        ) : licenses.length === 0 ? (
          <OperationalState state="empty" title="Nenhuma licença encontrada" />
        ) : (
          <>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Profissional</th>
                    <th>Tipo</th>
                    <th>Número</th>
                    <th>Emissor/UF</th>
                    <th>Vencimento</th>
                    <th>Status</th>
                    <th>Histórico</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {licenses.map((item) => {
                    const isEditing = editingLicenseId === item.id;
                    return (
                      <Fragment key={item.id}>
                        <tr className={isEditing ? "table-row-editing" : undefined}>
                          <td>{item.professional.name}</td>
                          <td>{item.licenseType.name}</td>
                          <td>{item.number ?? "Sem número"}</td>
                          <td>{`${item.issuer ?? "Sem emissor"} / ${item.uf ?? "--"}`}</td>
                          <td>{item.expiresAt ? formatDateBr(item.expiresAt) : "Sem data"}</td>
                          <td><StatusBadge kind="license" value={item.status} /></td>
                          <td>{`${item._count.documents} docs / ${item._count.notificationJobs} avisos`}</td>
                          <td>
                            {user.role === "ADMIN" ? (
                              <div className="row-actions">
                                <button className="secondary" type="button" onClick={() => startLicenseEdit(item)}>
                                  {isEditing ? "Editando" : "Editar"}
                                </button>
                                <span className="label-row">
                                  <button className="secondary" type="button" onClick={() => void generateUploadLink(item)}>
                                    Gerar link
                                  </button>
                                  <InfoTip text="Gera link temporario para upload do documento desta licenca." href="#links-de-upload" />
                                </span>
                                <span className="label-row">
                                  <button className="secondary" disabled={saving} type="button" onClick={() => void notifyLicense(item)}>
                                    <Icon name="bell" /> Notificar
                                  </button>
                                  <InfoTip text="Cria e envia manualmente os avisos WhatsApp aplicaveis para esta licenca." href="#jobs-notificacao" />
                                </span>
                                <ConfirmButton
                                  disabled={saving}
                                  confirmLabel="Confirmar inativação"
                                  onConfirm={() =>
                                    void run(async () => {
                                      await api(`/v1/licenses/${item.id}`, {
                                        method: "PATCH",
                                        body: JSON.stringify({ status: "INACTIVE" })
                                      });
                                    })
                                  }
                                >
                                  Inativar
                                </ConfirmButton>
                              </div>
                            ) : (
                              "Consulta"
                            )}
                          </td>
                        </tr>
                        {user.role === "ADMIN" && isEditing ? (
                          <tr className="inline-editor-row">
                            <td colSpan={8}>
                              <div className="inline-editor-shell">
                                <form className="inline-editor-form" onSubmit={saveLicenseEdit}>
                                  <div className="inline-editor-header">
                                    <h3>Editar licença</h3>
                                    <span className="muted">
                                      Atualize os dados desta licença sem sair da tabela.
                                    </span>
                                  </div>
                                  <div className="form-grid">
                                    <label>
                                      Número
                                      <input value={editLicenseNumber} onChange={(event) => setEditLicenseNumber(event.target.value)} />
                                    </label>
                                    <label>
                                      Emissor
                                      <input value={editLicenseIssuer} onChange={(event) => setEditLicenseIssuer(event.target.value)} />
                                    </label>
                                    <label>
                                      UF
                                      <input value={editLicenseUf} onChange={(event) => setEditLicenseUf(event.target.value.toUpperCase())} maxLength={2} />
                                    </label>
                                    <label>
                                      Vencimento
                                      <input value={editLicenseExpiresAt} onChange={(event) => setEditLicenseExpiresAt(event.target.value)} type="date" />
                                    </label>
                                    <label>
                                      Status
                                      <select value={editLicenseStatus} onChange={(event) => setEditLicenseStatus(event.target.value as LicenseStatus)}>
                                        {licenseStatuses.map((statusItem) => (
                                          <option key={statusItem} value={statusItem}>
                                            {statusItem}
                                          </option>
                                        ))}
                                      </select>
                                    </label>
                                  </div>
                                  <div className="form-actions">
                                    <button disabled={saving}>Salvar edição</button>
                                    <button className="secondary" disabled={saving} type="button" onClick={cancelLicenseEdit}>
                                      Cancelar
                                    </button>
                                  </div>
                                </form>
                              </div>
                            </td>
                          </tr>
                        ) : null}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <PaginationSummary page={1} pageSize={25} total={total} />
          </>
        )}
      </section>

      <section className="panel table-panel">
        {licenseTypes.length === 0 ? (
          <OperationalState state="empty" title="Nenhum tipo de licença cadastrado" />
        ) : (
          <OperationalTable
            items={licenseTypes}
            getRowKey={(item) => item.id}
            columns={[
              { key: "name", header: "Tipo", render: (item) => item.name },
              { key: "warning", header: "Avisos", render: (item) => item.defaultWarningDays ?? "Sem padrão" },
              {
                key: "status",
                header: "Status",
                render: (item) => <StatusBadge kind="active" value={item.active ? "ACTIVE" : "INACTIVE"} />
              },
              {
                key: "actions",
                header: "Ações",
                render: (item) =>
                  user.role === "ADMIN" ? (
                    <div className="row-actions">
                      <button className="secondary" type="button" onClick={() => startLicenseTypeEdit(item)}>
                        Editar
                      </button>
                      <ConfirmButton
                        disabled={saving}
                        confirmLabel={item.active ? "Confirmar desativação" : "Confirmar reativação"}
                        onConfirm={() =>
                          void run(async () => {
                            await api(`/v1/license-types/${item.id}`, {
                              method: "PATCH",
                              body: JSON.stringify({ active: !item.active })
                            });
                          })
                        }
                      >
                        {item.active ? "Desativar" : "Reativar"}
                      </ConfirmButton>
                    </div>
                  ) : (
                    "Consulta"
                  )
              }
            ]}
          />
        )}
      </section>
    </div>
  );
}

function DocumentsView({ user }: { user: CurrentUser }) {
  const [items, setItems] = useState<DocumentItem[]>([]);
  const [analysisDocument, setAnalysisDocument] = useState<DocumentItem | null>(null);
  const [analysisPreview, setAnalysisPreview] = useState<DocumentAiExtractionItem | null>(null);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState("UPLOADED");
  const [professionalFilter, setProfessionalFilter] = useState("");
  const [licenseFilter, setLicenseFilter] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    const search = new URLSearchParams();
    if (statusFilter) search.set("status", statusFilter);
    if (professionalFilter) search.set("professionalId", professionalFilter);
    if (licenseFilter) search.set("licenseId", licenseFilter);
    try {
      const result = await api<{ items: DocumentItem[]; total: number }>(`/v1/documents?${search.toString()}`);
      setItems(result.items);
      setTotal(result.total);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Falha ao carregar documentos.");
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
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Falha ao validar documento.");
    } finally {
      setSaving(false);
    }
  }

  function download(document: DocumentItem) {
    window.open(`/v1/documents/${document.id}/download`, "_blank", "noopener,noreferrer");
  }

  async function approve(document: DocumentItem) {
    await run(async () => {
      await api(`/v1/documents/${document.id}/validation`, {
        method: "PATCH",
        body: JSON.stringify({ status: "APPROVED" })
      });
    });
  }

  async function reject(document: DocumentItem) {
    const rejectionReason = window.prompt("Motivo da recusa");
    if (!rejectionReason?.trim()) return;
    await run(async () => {
      await api(`/v1/documents/${document.id}/validation`, {
        method: "PATCH",
        body: JSON.stringify({ status: "REJECTED", rejectionReason })
      });
    });
  }

  async function analyze(document: DocumentItem) {
    setSaving(true);
    setError(null);
    try {
      const result = await api<{ extraction: DocumentAiExtractionItem }>(`/v1/documents/${document.id}/analyze`, {
        method: "POST",
        body: JSON.stringify({})
      });
      setAnalysisDocument(document);
      setAnalysisPreview(result.extraction);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Falha ao analisar documento.");
    } finally {
      setSaving(false);
    }
  }

  async function loadAnalysis(document: DocumentItem) {
    setSaving(true);
    setError(null);
    try {
      const result = await api<{ items: DocumentAiExtractionItem[] }>(`/v1/documents/${document.id}/analysis`);
      setAnalysisDocument(document);
      setAnalysisPreview(result.items[0] ?? null);
      if (result.items.length === 0) setError("Este documento ainda nao tem analise automatica.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Falha ao carregar analise.");
    } finally {
      setSaving(false);
    }
  }

  async function applyAnalysis() {
    if (!analysisDocument || !analysisPreview) return;
    await run(async () => {
      const result = await api<{ changed: Record<string, unknown>; warnings: string[] }>(
        `/v1/documents/${analysisDocument.id}/analysis/apply`,
        {
          method: "POST",
          body: JSON.stringify({ extractionId: analysisPreview.id })
        }
      );
      setAnalysisPreview(null);
      setAnalysisDocument(null);
      window.alert(
        `Sugestões aplicadas. Campos alterados: ${Object.keys(result.changed).length}. Avisos: ${result.warnings.length}.`
      );
    });
  }

  const parsedAnalysis = parseDocumentAiResult(analysisPreview);

  return (
    <div className="content-stack">
      <OperationalFilters
        fields={[
          {
            key: "status",
            label: "Status",
            type: "select",
            value: statusFilter,
            placeholder: "Todos os status",
            options: documentStatusFilterOptions,
            help: "UPLOADED indica documentos aguardando validação.",
            helpHref: "#documentos",
            onChange: setStatusFilter
          },
          {
            key: "professional",
            label: "Profissional",
            value: professionalFilter,
            placeholder: "ID do profissional",
            help: "Filtra pelo identificador interno do profissional.",
            helpHref: "#filtros-e-ids",
            onChange: setProfessionalFilter
          },
          { key: "license", label: "Licença", value: licenseFilter, placeholder: "ID da licença", help: "Filtra por uma licença específica.", helpHref: "#filtros-e-ids", onChange: setLicenseFilter }
        ]}
        onSubmit={load}
      />

      {error ? <OperationalState state="error" title="Falha operacional" detail={error} /> : null}

      {analysisPreview ? (
        <section className="panel analysis-panel">
          <div className="detail-header">
            <div>
              <p className="eyebrow">Analise automatica</p>
              <h2>{analysisDocument?.fileName ?? "Documento"}</h2>
              <p className="muted">
                {analysisPreview.provider}
                {analysisPreview.model ? ` / ${analysisPreview.model}` : ""} / {analysisPreview.status}
              </p>
            </div>
            <div className="row-actions">
              {analysisPreview.status === "COMPLETED" ? (
                <button disabled={saving} type="button" onClick={() => void applyAnalysis()}>
                  Aplicar sugestões
                </button>
              ) : null}
              <button className="secondary" type="button" onClick={() => setAnalysisPreview(null)}>
                Fechar
              </button>
            </div>
          </div>
          {parsedAnalysis ? (
            <>
              <div className="analysis-grid">
                {([
                  ["Profissional", parsedAnalysis.fields.professionalName],
                  ["CPF", parsedAnalysis.fields.cpf],
                  ["Tipo", parsedAnalysis.fields.licenseTypeName],
                  ["Número", parsedAnalysis.fields.licenseNumber],
                  ["Emissor", parsedAnalysis.fields.issuer],
                  ["UF", parsedAnalysis.fields.uf],
                  ["Emissão", parsedAnalysis.fields.issuedAt],
                  ["Vencimento", parsedAnalysis.fields.expiresAt]
                ] as Array<[string, DocumentAiField]>).map(([label, field]) => (
                  <div key={String(label)}>
                    <span>{label}</span>
                    <strong>{field.value ?? "-"}</strong>
                    <small>Confiança: {field.confidence ?? "-"}</small>
                  </div>
                ))}
              </div>
              {parsedAnalysis.warnings.length ? <p className="error">{parsedAnalysis.warnings.join(" ")}</p> : null}
            </>
          ) : (
            <p className="error">{analysisPreview.errorMessage ?? "Resultado indisponivel."}</p>
          )}
        </section>
      ) : null}

      <section className="panel table-panel">
        {loading ? (
          <OperationalState state="loading" title="Carregando documentos" />
        ) : items.length === 0 ? (
          <OperationalState state="empty" title="Nenhum documento encontrado" />
        ) : (
          <>
            <OperationalTable
              items={items}
              getRowKey={(item) => item.id}
              columns={[
                { key: "file", header: "Arquivo", render: (item) => `${item.fileName} / ${Math.ceil(item.size / 1024)} KB` },
                { key: "professional", header: "Profissional", render: (item) => item.professional.name },
                {
                  key: "license",
                  header: "Licença",
                  render: (item) => `${item.license.licenseType.name}${item.license.number ? ` / ${item.license.number}` : ""}`
                },
                { key: "unit", header: "Unidade/Setor", render: (item) => `${item.professional.unit.name} / ${item.professional.sector.name}` },
                { key: "status", header: "Status", render: (item) => <StatusBadge kind="document" value={item.status} /> },
                {
                  key: "validated",
                  header: "Validação",
                  render: (item) =>
                    item.validatedBy
                      ? `${item.validatedBy.name} / ${item.validatedAt ? formatDateTimeBr(item.validatedAt) : ""}`
                      : item.rejectionReason ?? "Pendente"
                },
                {
                  key: "actions",
                  header: "Ações",
                  render: (item) => (
                    <div className="row-actions">
                      <button className="secondary" type="button" onClick={() => download(item)}>
                        <Icon name="download" /> Baixar
                      </button>
                      {(user.role === "ADMIN" || user.role === "RT") && item.status === "UPLOADED" ? (
                        <>
                          <span className="label-row">
                            <button className="secondary" disabled={saving} type="button" onClick={() => void analyze(item)}>
                              <Icon name="scan" /> Analisar
                            </button>
                            <InfoTip text="Extrai sugestoes de cadastro do documento para revisao humana antes de aplicar." href="#validacao-documentos" />
                          </span>
                          <button className="secondary" disabled={saving} type="button" onClick={() => void loadAnalysis(item)}>
                            Ver análise
                          </button>
                          <span className="label-row">
                            <button disabled={saving} type="button" onClick={() => void approve(item)}>
                              <Icon name="check" /> Aprovar
                            </button>
                            <InfoTip text="Aprove somente depois de conferir profissional, licenca, validade e legibilidade." href="#validacao-documentos" />
                          </span>
                          <span className="label-row">
                            <button className="danger" disabled={saving} type="button" onClick={() => void reject(item)}>
                              Recusar
                            </button>
                            <InfoTip text="Recuse com motivo claro para orientar a correcao do profissional." href="#validacao-documentos" />
                          </span>
                        </>
                      ) : null}
                    </div>
                  )
                }
              ]}
            />
            <PaginationSummary page={1} pageSize={25} total={total} />
          </>
        )}
      </section>
    </div>
  );
}

function SettingsView() {
  const [organization, setOrganization] = useState<OrganizationItem | null>(null);
  const [users, setUsers] = useState<ManagedUserItem[]>([]);
  const [notificationTemplates, setNotificationTemplates] = useState<NotificationTemplateItem[]>([]);
  const [notificationRules, setNotificationRules] = useState<NotificationRuleItem[]>([]);
  const [notificationJobs, setNotificationJobs] = useState<NotificationJobItem[]>([]);
  const [faqItems, setFaqItems] = useState<FaqItem[]>([]);
  const [orgName, setOrgName] = useState("");
  const [orgDocument, setOrgDocument] = useState("");
  const [unitName, setUnitName] = useState("");
  const [sectorName, setSectorName] = useState("");
  const [sectorUnitId, setSectorUnitId] = useState("");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [userRole, setUserRole] = useState<UserRole>("SUPERVISOR");
  const [userUnitScopeIds, setUserUnitScopeIds] = useState<string[]>([]);
  const [userSectorScopeIds, setUserSectorScopeIds] = useState<string[]>([]);
  const [editingUnitId, setEditingUnitId] = useState("");
  const [editingUnitName, setEditingUnitName] = useState("");
  const [editingSectorId, setEditingSectorId] = useState("");
  const [editingSectorName, setEditingSectorName] = useState("");
  const [editingUserId, setEditingUserId] = useState("");
  const [editingUserName, setEditingUserName] = useState("");
  const [editingUserEmail, setEditingUserEmail] = useState("");
  const [editingUserPhone, setEditingUserPhone] = useState("");
  const [editingUserRole, setEditingUserRole] = useState<UserRole>("SUPERVISOR");
  const [editingUserUnitScopeIds, setEditingUserUnitScopeIds] = useState<string[]>([]);
  const [editingUserSectorScopeIds, setEditingUserSectorScopeIds] = useState<string[]>([]);
  const [templateKey, setTemplateKey] = useState("");
  const [templateMetaName, setTemplateMetaName] = useState("");
  const [templatePreview, setTemplatePreview] = useState("");
  const [ruleTemplateKey, setRuleTemplateKey] = useState("");
  const [ruleLicenseTypeId, setRuleLicenseTypeId] = useState("");
  const [ruleDaysBefore, setRuleDaysBefore] = useState("30");
  const [ruleRepeatAfter, setRuleRepeatAfter] = useState("");
  const [ruleNotifyProfessional, setRuleNotifyProfessional] = useState(true);
  const [ruleNotifyRt, setRuleNotifyRt] = useState(false);
  const [faqCategory, setFaqCategory] = useState("");
  const [faqQuestion, setFaqQuestion] = useState("");
  const [faqAnswer, setFaqAnswer] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [result, usersResult, faqResult] = await Promise.all([
        api<{ organization: OrganizationItem }>("/v1/organization"),
        api<{ users: ManagedUserItem[] }>("/v1/users"),
        api<{ items: FaqItem[]; total: number }>("/v1/faq")
      ]);
      const notificationsResult = await api<{
        templates: NotificationTemplateItem[];
        rules: NotificationRuleItem[];
        jobs: NotificationJobItem[];
      }>("/v1/notifications/config");
      setOrganization(result.organization);
      setUsers(usersResult.users);
      setNotificationTemplates(notificationsResult.templates);
      setNotificationRules(notificationsResult.rules);
      setNotificationJobs(notificationsResult.jobs);
      setFaqItems(faqResult.items);
      setOrgName(result.organization.name);
      setOrgDocument(result.organization.document ?? "");
      setSectorUnitId(result.organization.units[0]?.id ?? "");
      setRuleTemplateKey((current) => current || notificationsResult.templates[0]?.key || "");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Falha ao carregar configurações.");
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
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Falha ao salvar configuração.");
    } finally {
      setSaving(false);
    }
  }

  async function saveOrganization(event: FormEvent) {
    event.preventDefault();
    await run(async () => {
      await api("/v1/organization", {
        method: "PATCH",
        body: JSON.stringify({ name: orgName, document: orgDocument })
      });
    });
  }

  async function addUnit(event: FormEvent) {
    event.preventDefault();
    await run(async () => {
      await api("/v1/organization/units", {
        method: "POST",
        body: JSON.stringify({ name: unitName })
      });
      setUnitName("");
    });
  }

  async function addSector(event: FormEvent) {
    event.preventDefault();
    await run(async () => {
      await api(`/v1/organization/units/${sectorUnitId}/sectors`, {
        method: "POST",
        body: JSON.stringify({ name: sectorName })
      });
      setSectorName("");
    });
  }

  async function addUser(event: FormEvent) {
    event.preventDefault();
    await run(async () => {
      await api("/v1/users", {
        method: "POST",
        body: JSON.stringify({
          name: userName,
          email: userEmail,
          phone: userPhone || null,
          password: userPassword,
          role: userRole,
          unitScopeIds: userRole === "ADMIN" ? [] : userUnitScopeIds,
          sectorScopeIds: userRole === "ADMIN" ? [] : userSectorScopeIds
        })
      });
      setUserName("");
      setUserEmail("");
      setUserPhone("");
      setUserPassword("");
      setUserRole("SUPERVISOR");
      setUserUnitScopeIds([]);
      setUserSectorScopeIds([]);
    });
  }

  async function addNotificationTemplate(event: FormEvent) {
    event.preventDefault();
    await run(async () => {
      await api("/v1/notifications/templates", {
        method: "POST",
        body: JSON.stringify({
          key: templateKey,
          channel: "WHATSAPP",
          metaTemplateName: templateMetaName || null,
          language: "pt_BR",
          bodyPreview: templatePreview || null
        })
      });
      setTemplateKey("");
      setTemplateMetaName("");
      setTemplatePreview("");
    });
  }

  async function addNotificationRule(event: FormEvent) {
    event.preventDefault();
    await run(async () => {
      await api("/v1/notifications/rules", {
        method: "POST",
        body: JSON.stringify({
          licenseTypeId: ruleLicenseTypeId || null,
          daysBeforeExpiration: ruleDaysBefore ? Number(ruleDaysBefore) : null,
          repeatAfterExpiredDays: ruleRepeatAfter ? Number(ruleRepeatAfter) : null,
          channel: "WHATSAPP",
          templateKey: ruleTemplateKey,
          notifyProfessional: ruleNotifyProfessional,
          notifyRt: ruleNotifyRt
        })
      });
      setRuleDaysBefore("30");
      setRuleRepeatAfter("");
      setRuleNotifyProfessional(true);
      setRuleNotifyRt(false);
    });
  }

  async function addFaqItem(event: FormEvent) {
    event.preventDefault();
    await run(async () => {
      await api("/v1/faq", {
        method: "POST",
        body: JSON.stringify({ category: faqCategory, question: faqQuestion, answer: faqAnswer })
      });
      setFaqCategory("");
      setFaqQuestion("");
      setFaqAnswer("");
    });
  }

  async function scanNotifications() {
    await run(async () => {
      await api("/v1/notifications/scan", { method: "POST", body: JSON.stringify({}) });
    });
  }

  async function processNotifications() {
    await run(async () => {
      await api("/v1/notifications/process", { method: "POST", body: JSON.stringify({}) });
    });
  }

  function startUnitEdit(unit: UnitItem) {
    setEditingUnitId(unit.id);
    setEditingUnitName(unit.name);
  }

  function cancelUnitEdit() {
    setEditingUnitId("");
    setEditingUnitName("");
  }

  async function saveUnitEdit(event: FormEvent) {
    event.preventDefault();
    if (!editingUnitId) return;
    await run(async () => {
      await api(`/v1/organization/units/${editingUnitId}`, {
        method: "PATCH",
        body: JSON.stringify({ name: editingUnitName })
      });
      cancelUnitEdit();
    });
  }

  function startSectorEdit(sector: SectorItem) {
    setEditingSectorId(sector.id);
    setEditingSectorName(sector.name);
  }

  function cancelSectorEdit() {
    setEditingSectorId("");
    setEditingSectorName("");
  }

  async function saveSectorEdit(event: FormEvent) {
    event.preventDefault();
    if (!editingSectorId) return;
    await run(async () => {
      await api(`/v1/organization/sectors/${editingSectorId}`, {
        method: "PATCH",
        body: JSON.stringify({ name: editingSectorName })
      });
      cancelSectorEdit();
    });
  }

  function startUserEdit(user: ManagedUserItem) {
    setEditingUserId(user.id);
    setEditingUserName(user.name);
    setEditingUserEmail(user.email);
    setEditingUserPhone(formatPhoneInput(user.phone ?? ""));
    setEditingUserRole(user.role);
    setEditingUserUnitScopeIds(user.unitScopeIds);
    setEditingUserSectorScopeIds(user.sectorScopeIds);
  }

  function cancelUserEdit() {
    setEditingUserId("");
    setEditingUserName("");
    setEditingUserEmail("");
    setEditingUserPhone("");
    setEditingUserRole("SUPERVISOR");
    setEditingUserUnitScopeIds([]);
    setEditingUserSectorScopeIds([]);
  }

  async function saveUserEdit(event: FormEvent) {
    event.preventDefault();
    await run(async () => {
      await api(`/v1/users/${editingUserId}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: editingUserName,
          email: editingUserEmail,
          phone: editingUserPhone || null,
          role: editingUserRole,
          unitScopeIds: editingUserRole === "ADMIN" ? [] : editingUserUnitScopeIds,
          sectorScopeIds: editingUserRole === "ADMIN" ? [] : editingUserSectorScopeIds
        })
      });
      cancelUserEdit();
    });
  }

  async function resetPassword(user: ManagedUserItem) {
    const password = window.prompt(`Nova senha para ${user.email}`);
    if (!password) return;
    await run(async () => {
      await api(`/v1/users/${user.id}/reset-password`, {
        method: "POST",
        body: JSON.stringify({ password })
      });
    });
  }

  function toggleUnitScope(unitId: string) {
    setUserUnitScopeIds((current) =>
      current.includes(unitId) ? current.filter((item) => item !== unitId) : [...current, unitId]
    );
  }

  function toggleSectorScope(sectorId: string) {
    setUserSectorScopeIds((current) =>
      current.includes(sectorId) ? current.filter((item) => item !== sectorId) : [...current, sectorId]
    );
  }

  function toggleEditingUserUnitScope(unitId: string) {
    setEditingUserUnitScopeIds((current) =>
      current.includes(unitId) ? current.filter((item) => item !== unitId) : [...current, unitId]
    );
  }

  function toggleEditingUserSectorScope(sectorId: string) {
    setEditingUserSectorScopeIds((current) =>
      current.includes(sectorId) ? current.filter((item) => item !== sectorId) : [...current, sectorId]
    );
  }

  if (loading) {
    return <OperationalState state="loading" title="Carregando configurações" />;
  }

  if (error && !organization) {
    return <OperationalState state="error" title="Falha ao carregar configurações" detail={error} />;
  }

  if (!organization) {
    return <OperationalState state="empty" title="Organização nao encontrada" />;
  }

  const sectors = organization.units.flatMap((unit) =>
    unit.sectors.map((sector) => ({
      ...sector,
      unitName: unit.name
    }))
  );

  return (
    <div className="content-stack settings-grid">
      {error ? <OperationalState state="error" title="Falha ao salvar" detail={error} /> : null}

      <section className="panel form-panel">
        <form onSubmit={saveOrganization}>
              <h2>Organização</h2>
              <label>
                Nome
                <input value={orgName} onChange={(event) => setOrgName(event.target.value)} />
              </label>
              <label>
                <span className="label-row">Documento <InfoTip text="Identificador institucional, como CNPJ, para referencia administrativa." href="#configuracao-organizacao" /></span>
                <input value={orgDocument} onChange={(event) => setOrgDocument(event.target.value)} />
              </label>
          <div className="form-actions">
            <StatusBadge kind="active" value={organization.active ? "ACTIVE" : "INACTIVE"} />
            <button disabled={saving || !orgName.trim()}>Salvar</button>
            <ConfirmButton
              disabled={saving}
              confirmLabel={organization.active ? "Confirmar desativação" : "Confirmar reativação"}
              onConfirm={() =>
                void run(async () => {
                  await api("/v1/organization", {
                    method: "PATCH",
                    body: JSON.stringify({ active: !organization.active })
                  });
                })
              }
            >
              {organization.active ? "Desativar" : "Reativar"}
            </ConfirmButton>
          </div>
        </form>
      </section>

      <section className="panel form-panel">
        <form onSubmit={addUnit}>
          <h2>Nova unidade</h2>
          <label>
            <span className="label-row">Nome <InfoTip text="Unidades organizam escopo, filtros e relatorios." href="#configuracao-organizacao" /></span>
            <input value={unitName} onChange={(event) => setUnitName(event.target.value)} />
          </label>
          <button disabled={saving || !unitName.trim()}>Criar unidade</button>
        </form>
      </section>

      <section className="panel form-panel">
        <form onSubmit={addSector}>
          <h2>Novo setor</h2>
          <label>
            <span className="label-row">Unidade <InfoTip text="Escolha onde o novo setor sera criado." href="#configuracao-organizacao" /></span>
            <select value={sectorUnitId} onChange={(event) => setSectorUnitId(event.target.value)}>
              {organization.units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="label-row">Nome <InfoTip text="Setores ajudam a limitar acesso e localizar pendencias." href="#configuracao-organizacao" /></span>
            <input value={sectorName} onChange={(event) => setSectorName(event.target.value)} />
          </label>
          <button disabled={saving || !sectorName.trim() || !sectorUnitId}>Criar setor</button>
        </form>
      </section>

      <section className="panel form-panel full-span">
        <form onSubmit={addUser}>
          <h2>Novo usuário administrativo</h2>
          <div className="form-grid">
            <label>
              Nome
              <input value={userName} onChange={(event) => setUserName(event.target.value)} />
            </label>
            <label>
              Email
              <input value={userEmail} onChange={(event) => setUserEmail(event.target.value)} type="email" />
            </label>
            <label>
              <span className="label-row">WhatsApp <InfoTip text="Use DDI e DDD. O telefone do RT/responsavel e usado nos avisos por WhatsApp." href="#configuracao-usuarios" /></span>
              <input
                inputMode="tel"
                maxLength={19}
                value={userPhone}
                onChange={(event) => setUserPhone(formatPhoneInput(event.target.value))}
                placeholder="+55 (83) 90000-0000"
              />
            </label>
            <label>
              <span className="label-row">Senha inicial <InfoTip text="Use ao menos 8 caracteres e compartilhe por canal seguro." href="#configuracao-usuarios" /></span>
              <input
                value={userPassword}
                onChange={(event) => setUserPassword(event.target.value)}
                type="password"
                minLength={8}
              />
            </label>
            <label>
              <span className="label-row">Perfil <InfoTip text="Admin opera tudo; RT e Supervisor dependem do escopo definido." href="#perfis-e-permissoes" /></span>
              <select value={userRole} onChange={(event) => setUserRole(event.target.value as UserRole)}>
                {userRoles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {userRole === "ADMIN" ? null : (
            <div className="scope-grid">
              <fieldset>
                <legend>Unidades <InfoTip text="Unidades marcadas limitam o que o usuario pode ver." href="#configuracao-usuarios" /></legend>
                {organization.units.map((unit) => (
                  <label className="checkbox-row" key={unit.id}>
                    <input
                      checked={userUnitScopeIds.includes(unit.id)}
                      onChange={() => toggleUnitScope(unit.id)}
                      type="checkbox"
                    />
                    {unit.name}
                  </label>
                ))}
              </fieldset>
              <fieldset>
                <legend>Setores <InfoTip text="Setores marcados refinam o escopo de visualizacao." href="#configuracao-usuarios" /></legend>
                {sectors.map((sector) => (
                  <label className="checkbox-row" key={sector.id}>
                    <input
                      checked={userSectorScopeIds.includes(sector.id)}
                      onChange={() => toggleSectorScope(sector.id)}
                      type="checkbox"
                    />
                    {sector.name} / {sector.unitName}
                  </label>
                ))}
              </fieldset>
            </div>
          )}
          <button disabled={saving || !userName.trim() || !userEmail.trim() || userPassword.length < 8}>
            {saving ? "Salvando..." : "Criar usuário"}
          </button>
        </form>
      </section>

      <section className="panel table-panel full-span">
        {users.length === 0 ? (
          <OperationalState state="empty" title="Nenhum usuário cadastrado" />
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Usuário</th>
                  <th>WhatsApp</th>
                  <th>Perfil</th>
                  <th>Escopo</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.map((item) => {
                  const isEditing = editingUserId === item.id;
                  return (
                    <Fragment key={item.id}>
                      <tr className={isEditing ? "table-row-editing" : undefined}>
                        <td>{`${item.name} (${item.email})`}</td>
                        <td>{item.phone ?? "Sem telefone"}</td>
                        <td>{item.role}</td>
                        <td>
                          {item.role === "ADMIN"
                            ? "Todas as unidades"
                            : `${item.unitScopeIds.length} unidades / ${item.sectorScopeIds.length} setores`}
                        </td>
                        <td><StatusBadge kind="active" value={item.active ? "ACTIVE" : "INACTIVE"} /></td>
                        <td>
                          <div className="row-actions">
                            <button className="secondary" type="button" onClick={() => startUserEdit(item)}>
                              {isEditing ? "Editando" : "Editar"}
                            </button>
                            <button className="secondary" type="button" onClick={() => void resetPassword(item)}>
                              Resetar senha
                            </button>
                            <ConfirmButton
                              disabled={saving}
                              confirmLabel={item.active ? "Confirmar desativação" : "Confirmar reativação"}
                              onConfirm={() =>
                                void run(async () => {
                                  await api(`/v1/users/${item.id}`, {
                                    method: "PATCH",
                                    body: JSON.stringify({ active: !item.active })
                                  });
                                })
                              }
                            >
                              {item.active ? "Desativar" : "Reativar"}
                            </ConfirmButton>
                          </div>
                        </td>
                      </tr>
                      {isEditing ? (
                        <tr className="inline-editor-row">
                          <td colSpan={6}>
                            <div className="inline-editor-shell">
                              <form className="inline-editor-form" onSubmit={saveUserEdit}>
                                <div className="inline-editor-header">
                                  <h3>Editar usuário</h3>
                                  <span className="muted">Ajuste perfil, contato e escopo sem sair da tabela.</span>
                                </div>
                                <div className="form-grid">
                                  <label>
                                    Nome
                                    <input value={editingUserName} onChange={(event) => setEditingUserName(event.target.value)} />
                                  </label>
                                  <label>
                                    Email
                                    <input value={editingUserEmail} onChange={(event) => setEditingUserEmail(event.target.value)} type="email" />
                                  </label>
                                  <label>
                                    WhatsApp
                                    <input
                                      inputMode="tel"
                                      maxLength={19}
                                      placeholder="+55 (83) 90000-0000"
                                      value={editingUserPhone}
                                      onChange={(event) => setEditingUserPhone(formatPhoneInput(event.target.value))}
                                    />
                                  </label>
                                  <label>
                                    Perfil
                                    <select value={editingUserRole} onChange={(event) => setEditingUserRole(event.target.value as UserRole)}>
                                      {userRoles.map((role) => (
                                        <option key={role} value={role}>
                                          {role}
                                        </option>
                                      ))}
                                    </select>
                                  </label>
                                </div>
                                {editingUserRole === "ADMIN" ? null : (
                                  <div className="scope-grid">
                                    <fieldset>
                                      <legend>Unidades</legend>
                                      {organization.units.map((unit) => (
                                        <label className="checkbox-row" key={unit.id}>
                                          <input
                                            checked={editingUserUnitScopeIds.includes(unit.id)}
                                            onChange={() => toggleEditingUserUnitScope(unit.id)}
                                            type="checkbox"
                                          />
                                          {unit.name}
                                        </label>
                                      ))}
                                    </fieldset>
                                    <fieldset>
                                      <legend>Setores</legend>
                                      {sectors.map((sector) => (
                                        <label className="checkbox-row" key={sector.id}>
                                          <input
                                            checked={editingUserSectorScopeIds.includes(sector.id)}
                                            onChange={() => toggleEditingUserSectorScope(sector.id)}
                                            type="checkbox"
                                          />
                                          {sector.name} / {sector.unitName}
                                        </label>
                                      ))}
                                    </fieldset>
                                  </div>
                                )}
                                <div className="form-actions">
                                  <button disabled={saving || !editingUserName.trim() || !editingUserEmail.trim()}>Salvar edição</button>
                                  <button className="secondary" disabled={saving} type="button" onClick={cancelUserEdit}>
                                    Cancelar
                                  </button>
                                </div>
                              </form>
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="panel form-panel full-span">
        <form onSubmit={addNotificationTemplate}>
          <h2>Novo template WhatsApp</h2>
          <div className="form-grid">
            <label>
              Chave
              <input value={templateKey} onChange={(event) => setTemplateKey(event.target.value)} placeholder="license-expiration" />
            </label>
            <label>
              <span className="label-row">Template Meta <InfoTip text="Nome aprovado no painel da Meta. Deixe vazio para provider fake/local." href="#notificacoes" /></span>
              <input value={templateMetaName} onChange={(event) => setTemplateMetaName(event.target.value)} />
            </label>
            <label>
              <span className="label-row">Preview <InfoTip text="Pode usar professionalName, licenseTypeName, licenseNumber, issuer, uf, issuedAt, expiresAt, daysUntilExpiration, daysExpired, responsibleRtName e willEscalateToRt." href="#jobs-notificacao" /></span>
              <input value={templatePreview} onChange={(event) => setTemplatePreview(event.target.value)} />
            </label>
          </div>
          <button disabled={saving || !templateKey.trim()}>Criar template</button>
        </form>
      </section>

      <section className="panel form-panel full-span">
        <form onSubmit={addNotificationRule}>
          <h2>Nova regra de notificação</h2>
          <div className="form-grid">
            <label>
              Template
              <select value={ruleTemplateKey} onChange={(event) => setRuleTemplateKey(event.target.value)}>
                {notificationTemplates.map((template) => (
                  <option key={template.id} value={template.key}>
                    {template.key}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="label-row">Tipo de licença <InfoTip text="Informe o ID do tipo quando a regra valer para uma licença específica. Vazio aplica a todos." href="#licencas" /></span>
              <input value={ruleLicenseTypeId} onChange={(event) => setRuleLicenseTypeId(event.target.value)} placeholder="vazio = todos" />
            </label>
            <label>
              <span className="label-row">Dias antes <InfoTip text="Quando criar aviso antes do vencimento. Exemplo: 30." href="#notificacoes" /></span>
              <input value={ruleDaysBefore} onChange={(event) => setRuleDaysBefore(event.target.value)} type="number" />
            </label>
            <label>
              <span className="label-row">Repetir após vencida <InfoTip text="Intervalo em dias para novas notificações depois do vencimento." href="#notificacoes" /></span>
              <input value={ruleRepeatAfter} onChange={(event) => setRuleRepeatAfter(event.target.value)} type="number" />
            </label>
            <label className="checkbox-row">
              <input checked={ruleNotifyProfessional} onChange={() => setRuleNotifyProfessional((current) => !current)} type="checkbox" />
              <span className="label-row">Notificar profissional <InfoTip text="Desmarque apenas quando a regra for exclusiva para RT/responsavel." href="#jobs-notificacao" /></span>
            </label>
            <label className="checkbox-row">
              <input checked={ruleNotifyRt} onChange={() => setRuleNotifyRt((current) => !current)} type="checkbox" />
              <span className="label-row">Notificar RT <InfoTip text="Use nos ultimos avisos: cria um job separado para o responsavel tecnico vinculado quando houver telefone." href="#jobs-notificacao" /></span>
            </label>
          </div>
          <button disabled={saving || !ruleTemplateKey || (!ruleNotifyProfessional && !ruleNotifyRt)}>Criar regra</button>
        </form>
      </section>

      <section className="panel table-panel full-span">
        <div className="action-panel">
          <span className="label-row">
            <button className="secondary" disabled={saving} type="button" onClick={() => void scanNotifications()}>
              Criar jobs
            </button>
            <InfoTip text="Gera pendencias de notificacao conforme regras e vencimentos." href="#jobs-notificacao" />
          </span>
          <span className="label-row">
            <button disabled={saving} type="button" onClick={() => void processNotifications()}>
              Processar jobs
            </button>
            <InfoTip text="Tenta enviar as pendencias pelo provider configurado." href="#jobs-notificacao" />
          </span>
        </div>
        <OperationalTable
          items={notificationTemplates}
          getRowKey={(item) => item.id}
          columns={[
            { key: "key", header: "Template", render: (item) => `${item.key} / ${item.metaTemplateName ?? "fake"}` },
            { key: "channel", header: "Canal", render: (item) => item.channel },
            { key: "preview", header: "Preview", render: (item) => item.bodyPreview ?? "Sem preview" },
            {
              key: "status",
              header: "Status",
              render: (item) => <StatusBadge kind="active" value={item.active ? "ACTIVE" : "INACTIVE"} />
            }
          ]}
        />
      </section>

      <section className="panel table-panel full-span">
        {notificationRules.length === 0 ? (
          <OperationalState state="empty" title="Nenhuma regra de notificação" />
        ) : (
          <OperationalTable
            items={notificationRules}
            getRowKey={(item) => item.id}
            columns={[
              { key: "template", header: "Template", render: (item) => item.templateKey },
              { key: "licenseType", header: "Tipo", render: (item) => item.licenseType?.name ?? "Todos" },
              {
                key: "schedule",
                header: "Agenda",
                render: (item) => `${item.daysBeforeExpiration ?? "-"} antes / ${item.repeatAfterExpiredDays ?? "-"} vencida`
              },
              { key: "targets", header: "Destinos", render: (item) => `Profissional${item.notifyRt ? " + RT" : ""}` },
              {
                key: "status",
                header: "Status",
                render: (item) => <StatusBadge kind="active" value={item.active ? "ACTIVE" : "INACTIVE"} />
              }
            ]}
          />
        )}
      </section>

      <section className="panel table-panel full-span">
        {notificationJobs.length === 0 ? (
          <OperationalState state="empty" title="Nenhum job de notificação" />
        ) : (
          <OperationalTable
            items={notificationJobs}
            getRowKey={(item) => item.id}
            columns={[
              { key: "date", header: "Agendado", render: (item) => formatDateTimeBr(item.scheduledFor) },
              { key: "professional", header: "Profissional", render: (item) => item.professional.name },
              { key: "license", header: "Licença", render: (item) => item.license.licenseType.name },
              { key: "template", header: "Template", render: (item) => item.templateKey },
              { key: "attempts", header: "Tentativas", render: (item) => item.attempts },
              { key: "status", header: "Status", render: (item) => <StatusBadge kind="notification" value={item.status as never} /> }
            ]}
          />
        )}
      </section>

      <section className="panel form-panel full-span">
        <form onSubmit={addFaqItem}>
          <h2>Nova pergunta frequente</h2>
          <div className="form-grid">
            <label>
              Categoria
              <input value={faqCategory} onChange={(event) => setFaqCategory(event.target.value)} />
            </label>
            <label>
              Pergunta
              <input value={faqQuestion} onChange={(event) => setFaqQuestion(event.target.value)} />
            </label>
            <label>
              Resposta
              <input value={faqAnswer} onChange={(event) => setFaqAnswer(event.target.value)} />
            </label>
          </div>
          <button disabled={saving || !faqCategory.trim() || !faqQuestion.trim() || !faqAnswer.trim()}>Criar FAQ</button>
        </form>
      </section>

      <section className="panel table-panel full-span">
        {faqItems.length === 0 ? (
          <OperationalState state="empty" title="Nenhum item de FAQ" />
        ) : (
          <OperationalTable
            items={faqItems}
            getRowKey={(item) => item.id}
            columns={[
              { key: "category", header: "Categoria", render: (item) => item.category },
              { key: "question", header: "Pergunta", render: (item) => item.question },
              { key: "answer", header: "Resposta", render: (item) => item.answer },
              {
                key: "status",
                header: "Status",
                render: (item) => <StatusBadge kind="active" value={item.active ? "ACTIVE" : "INACTIVE"} />
              },
              {
                key: "actions",
                header: "Ações",
                render: (item) => (
                  <ConfirmButton
                    disabled={saving}
                    confirmLabel={item.active ? "Confirmar desativação" : "Confirmar reativação"}
                    onConfirm={() =>
                      void run(async () => {
                        await api(`/v1/faq/${item.id}`, {
                          method: "PATCH",
                          body: JSON.stringify({ active: !item.active })
                        });
                      })
                    }
                  >
                    {item.active ? "Desativar" : "Reativar"}
                  </ConfirmButton>
                )
              }
            ]}
          />
        )}
      </section>

      <section className="panel table-panel full-span">
        {organization.units.length === 0 ? (
          <OperationalState state="empty" title="Nenhuma unidade cadastrada" />
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Unidade</th>
                  <th>Status</th>
                  <th>Setores</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {organization.units.map((unit) => {
                  const isEditing = editingUnitId === unit.id;
                  return (
                    <Fragment key={unit.id}>
                      <tr className={isEditing ? "table-row-editing" : undefined}>
                        <td>{unit.name}</td>
                        <td><StatusBadge kind="active" value={unit.active ? "ACTIVE" : "INACTIVE"} /></td>
                        <td>{unit.sectors.length}</td>
                        <td>
                          <div className="row-actions">
                            <button className="secondary" type="button" onClick={() => startUnitEdit(unit)}>
                              {isEditing ? "Editando" : "Editar"}
                            </button>
                            <ConfirmButton
                              disabled={saving}
                              confirmLabel={unit.active ? "Confirmar desativação" : "Confirmar reativação"}
                              onConfirm={() =>
                                void run(async () => {
                                  await api(`/v1/organization/units/${unit.id}`, {
                                    method: "PATCH",
                                    body: JSON.stringify({ active: !unit.active })
                                  });
                                })
                              }
                            >
                              {unit.active ? "Desativar" : "Reativar"}
                            </ConfirmButton>
                          </div>
                        </td>
                      </tr>
                      {isEditing ? (
                        <tr className="inline-editor-row">
                          <td colSpan={4}>
                            <div className="inline-editor-shell">
                              <form className="inline-editor-form" onSubmit={saveUnitEdit}>
                                <div className="inline-editor-header">
                                  <h3>Editar unidade</h3>
                                  <span className="muted">Atualize o nome da unidade na própria linha.</span>
                                </div>
                                <label>
                                  Nome
                                  <input value={editingUnitName} onChange={(event) => setEditingUnitName(event.target.value)} />
                                </label>
                                <div className="form-actions">
                                  <button disabled={saving || !editingUnitName.trim()}>Salvar edição</button>
                                  <button className="secondary" disabled={saving} type="button" onClick={cancelUnitEdit}>
                                    Cancelar
                                  </button>
                                </div>
                              </form>
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="panel table-panel full-span">
        {sectors.length === 0 ? (
          <OperationalState state="empty" title="Nenhum setor cadastrado" />
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Setor</th>
                  <th>Unidade</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {sectors.map((sector) => {
                  const isEditing = editingSectorId === sector.id;
                  return (
                    <Fragment key={sector.id}>
                      <tr className={isEditing ? "table-row-editing" : undefined}>
                        <td>{sector.name}</td>
                        <td>{sector.unitName}</td>
                        <td><StatusBadge kind="active" value={sector.active ? "ACTIVE" : "INACTIVE"} /></td>
                        <td>
                          <div className="row-actions">
                            <button className="secondary" type="button" onClick={() => startSectorEdit(sector)}>
                              {isEditing ? "Editando" : "Editar"}
                            </button>
                            <ConfirmButton
                              disabled={saving}
                              confirmLabel={sector.active ? "Confirmar desativação" : "Confirmar reativação"}
                              onConfirm={() =>
                                void run(async () => {
                                  await api(`/v1/organization/sectors/${sector.id}`, {
                                    method: "PATCH",
                                    body: JSON.stringify({ active: !sector.active })
                                  });
                                })
                              }
                            >
                              {sector.active ? "Desativar" : "Reativar"}
                            </ConfirmButton>
                          </div>
                        </td>
                      </tr>
                      {isEditing ? (
                        <tr className="inline-editor-row">
                          <td colSpan={4}>
                            <div className="inline-editor-shell">
                              <form className="inline-editor-form" onSubmit={saveSectorEdit}>
                                <div className="inline-editor-header">
                                  <h3>Editar setor</h3>
                                  <span className="muted">Ajuste o nome do setor diretamente na tabela.</span>
                                </div>
                                <label>
                                  Nome
                                  <input value={editingSectorName} onChange={(event) => setEditingSectorName(event.target.value)} />
                                </label>
                                <div className="form-actions">
                                  <button disabled={saving || !editingSectorName.trim()}>Salvar edição</button>
                                  <button className="secondary" disabled={saving} type="button" onClick={cancelSectorEdit}>
                                    Cancelar
                                  </button>
                                </div>
                              </form>
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function PublicUploadView({ token }: { token: string }) {
  const [uploadToken, setUploadToken] = useState<PublicUploadToken | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`${apiBaseUrl}/v1/public-upload/${token}`)
      .then(async (response) => {
        const payload = (await response.json()) as ApiResult<{ uploadToken: PublicUploadToken }>;
        if (!payload.ok) throw new Error(payload.error.message);
        setUploadToken(payload.data.uploadToken);
      })
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Link invalido."))
      .finally(() => setLoading(false));
  }, [token]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!file) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`${apiBaseUrl}/v1/public-upload/${token}?fileName=${encodeURIComponent(file.name)}`, {
        method: "POST",
        headers: { "content-type": file.type },
        body: file
      });
      const payload = (await response.json()) as ApiResult<{ document: { id: string } }>;
      if (!payload.ok) throw new Error(payload.error.message);
      setSuccess(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Falha ao enviar documento.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="panel login-panel">
        <div>
          <p className="eyebrow">{appName}</p>
          <h1>Enviar documento</h1>
        </div>
        {loading ? <OperationalState state="loading" title="Carregando link" /> : null}
        {error ? <OperationalState state="error" title="Não foi possivel continuar" detail={error} /> : null}
        {uploadToken && !success ? (
          <form onSubmit={submit}>
            <div className="public-upload-summary">
              <strong>{uploadToken.professional.name}</strong>
              <span>
                {uploadToken.license.licenseType.name}
                {uploadToken.license.number ? ` / ${uploadToken.license.number}` : ""}
              </span>
              <span>Expira em {formatDateTimeBr(uploadToken.expiresAt)}</span>
            </div>
            <label>
              <span className="label-row">Arquivo <InfoTip text="Envie PDF ou imagem legivel da licenca correta." href="#links-de-upload" /></span>
              <input
                accept="application/pdf,image/jpeg,image/png,image/webp"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                type="file"
              />
            </label>
            <button disabled={saving || !file}>{saving ? "Enviando..." : "Enviar"}</button>
          </form>
        ) : null}
        {success ? <OperationalState state="success" title="Documento enviado" detail="O link foi consumido com sucesso." /> : null}
      </section>
    </main>
  );
}

function PublicFaqView() {
  const params = new URLSearchParams(window.location.search);
  const organizationId = params.get("organizationId") ?? null;
  const [items, setItems] = useState<FaqItem[]>([]);
  const [organizationName, setOrganizationName] = useState(appName);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [problemType, setProblemType] = useState("Duvida sobre envio");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(organizationId ? null : "Link de FAQ invalido: organizationId ausente.");
  const [loading, setLoading] = useState(!!organizationId);

  async function load() {
    if (!organizationId) return;
    setLoading(true);
    setError(null);
    const search = new URLSearchParams({ organizationId });
    if (query) search.set("query", query);
    if (category) search.set("category", category);
    try {
      const response = await fetch(`${apiBaseUrl}/v1/public-faq?${search.toString()}`);
      const payload = (await response.json()) as ApiResult<{
        organization: { id: string; name: string };
        items: FaqItem[];
        total: number;
      }>;
      if (!payload.ok) throw new Error(payload.error.message);
      setItems(payload.data.items);
      setOrganizationName(payload.data.organization.name);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Falha ao carregar FAQ.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function requestHelp(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      const response = await fetch(`${apiBaseUrl}/v1/public-help/wa-link`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ organizationId, problemType, message })
      });
      const payload = (await response.json()) as ApiResult<{ url: string; recipient: string }>;
      if (!payload.ok) throw new Error(payload.error.message);
      window.location.href = payload.data.url;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Falha ao gerar link de ajuda.");
    }
  }

  return (
    <main className="auth-page public-faq-page">
      <section className="panel public-faq-panel">
        <div>
          <p className="eyebrow">{organizationName}</p>
          <h1>FAQ</h1>
        </div>
        <OperationalFilters
          fields={[
            { key: "query", label: "Busca", value: query, placeholder: "Documento, link, prazo...", onChange: setQuery },
            { key: "category", label: "Categoria", value: category, placeholder: "Envio", help: "Use categoria para encontrar respostas por assunto.", helpHref: "#problemas-comuns", onChange: setCategory }
          ]}
          onSubmit={load}
        />
        {error ? <OperationalState state="error" title="Falha" detail={error} /> : null}
        {loading ? (
          <OperationalState state="loading" title="Carregando perguntas" />
        ) : items.length === 0 ? (
          <OperationalState state="empty" title="Nenhuma pergunta encontrada" />
        ) : (
          <div className="faq-list">
            {items.map((item) => (
              <article className="faq-item" key={item.id}>
                <span>{item.category}</span>
                <strong>{item.question}</strong>
                <p>{item.answer}</p>
              </article>
            ))}
          </div>
        )}
        <form className="help-form" onSubmit={requestHelp}>
          <h2>Estou tendo problemas</h2>
          <label>
            Tipo de problema
            <input value={problemType} onChange={(event) => setProblemType(event.target.value)} />
          </label>
          <label>
            Mensagem
            <input value={message} onChange={(event) => setMessage(event.target.value)} />
          </label>
          <button disabled={!problemType.trim() || !message.trim()}>Abrir WhatsApp</button>
        </form>
      </section>
    </main>
  );
}

function wikiSlugFromPath(pathname = window.location.pathname) {
  if (pathname === "/wiki") return "";
  if (!pathname.startsWith("/wiki/")) return "";
  const slug = pathname.slice("/wiki/".length).split("/")[0] ?? "";
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}

function wikiPathForSlug(slug: string) {
  return `/wiki/${encodeURIComponent(slug)}`;
}

function WikiView({ user, initialSlug }: { user: CurrentUser; initialSlug?: string }) {
  const [pages, setPages] = useState<WikiPageSummary[]>([]);
  const [requests, setRequests] = useState<WikiEditRequestItem[]>([]);
  const [reviewedRequests, setReviewedRequests] = useState<WikiEditRequestItem[]>([]);
  const [selected, setSelected] = useState<WikiPageDetail | null>(null);
  const [pendingSlug, setPendingSlug] = useState(initialSlug ?? "");
  const [query, setQuery] = useState("");
  const [pageStatus, setPageStatus] = useState("ACTIVE");
  const [selectedTag, setSelectedTag] = useState("");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editContent, setEditContent] = useState("");
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

  async function loadPages(nextSelectedId = selected?.id) {
    setLoading(true);
    setError(null);
    const search = new URLSearchParams();
    if (query) search.set("query", query);
    if (user.role === "ADMIN" && pageStatus !== "ACTIVE") search.set("status", pageStatus);
    try {
      const result = await api<{ items: WikiPageSummary[]; total: number }>(`/v1/wiki/pages?${search.toString()}`);
      setPages(result.items);
      const slugToOpen = pendingSlug;
      const slugMatch = slugToOpen ? result.items.find((item) => item.slug === slugToOpen) : null;
      if (slugToOpen) {
        if (slugMatch) {
          await openPage(slugMatch.id, false);
        } else {
          await openPageBySlug(slugToOpen, false);
        }
      } else {
        const nextId = nextSelectedId && result.items.some((item) => item.id === nextSelectedId) ? nextSelectedId : result.items[0]?.id;
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
        body: JSON.stringify({ title, slug: slug || undefined, content })
      });
      setTitle("");
      setSlug("");
      setContent("");
      await loadPages(result.page.id);
    });
  }

  async function publishEdit(event: FormEvent) {
    event.preventDefault();
    if (!selected) return;
    await run(async () => {
      await api(`/v1/wiki/pages/${selected.id}`, {
        method: "PATCH",
        body: JSON.stringify({ title: editTitle, slug: editSlug || undefined, content: editContent, baseVersion: selected.version })
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
    const tags = new Set<string>();
    for (const page of pages) {
      for (const tag of wikiTagsFor(page)) tags.add(tag);
    }
    return [...tags].sort((a, b) => a.localeCompare(b));
  }, [pages]);
  const visiblePages = selectedTag ? pages.filter((page) => wikiTagsFor(page).includes(selectedTag)) : pages;
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

  return (
    <div className="content-stack">
      <OperationalFilters
        fields={[
          {
            key: "query",
            label: "Busca",
            value: query,
            placeholder: "Titulo, slug ou conteudo",
            help: "Busca paginas por titulo, slug ou conteudo publicado.",
            helpHref: "#wiki",
            onChange: setQuery
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
        onSubmit={() => void loadPages()}
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
            <OperationalState state="empty" title="Nenhuma pagina publicada" />
          ) : (
            <div className="wiki-page-list">
              {visiblePages.map((page) => (
                <button
                  className={selected?.id === page.id ? "wiki-page-button active" : "wiki-page-button"}
                  key={page.id}
                  type="button"
                  onClick={() => void openPage(page.id)}
                >
                  <strong>{page.title}</strong>
                  <span>v{page.version} / {formatDateBr(page.updatedAt)}</span>
                  {wikiTagsFor(page).length ? <span>{wikiTagsFor(page).map((tag) => `#${tag}`).join(" ")}</span> : null}
                  {isRecentlyUpdated(page.updatedAt) ? <small>Atualizada recentemente</small> : null}
                  {!page.active ? <small>Arquivada</small> : null}
                  {page.editRequests.length ? <small>{page.editRequests.length} pendente(s)</small> : null}
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
              {wikiTagsFor(selected).length ? (
                <div className="wiki-tag-row">
                  {wikiTagsFor(selected).map((tag) => (
                    <button key={tag} type="button" onClick={() => setSelectedTag(tag)}>
                      #{tag}
                    </button>
                  ))}
                </div>
              ) : null}
              <WikiMarkdownContent content={selected.content} />
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

function HelpView({ user }: { user: CurrentUser }) {
  const sections = [
    {
      id: "visao-geral",
      title: "Visão geral",
      who: "Todos os perfis",
      text: "Use o AlwaysTrack para transformar DANFEs em vendas revisadas, ranking, campanhas, extratos, Wiki e auditoria.",
      steps: ["Envie ou receba DANFEs.", "Extraia os dados.", "Revise pendências.", "Acompanhe ranking, extratos e trilha de eventos."],
      check: "Confira vendedor, status, período e campanha antes de tirar conclusão operacional.",
      common: "Filtro restrito ou nota ainda pendente pode fazer ranking e extratos parecerem vazios.",
      support: "Procure suporte se uma tela falhar mesmo sem filtros ou se uma nota sumir depois do envio."
    },
    {
      id: "primeiro-acesso",
      title: "Primeiro acesso",
      who: "Admin cria acessos; demais perfis entram com convite ou usuário já criado.",
      text: "A função do usuário define telas, ações e escopo. Admin opera tudo; vendedor enxerga a própria rotina; supervisor acompanha time.",
      steps: ["Acesse com email e senha.", "Confira seu perfil no topo da página.", "Use Sair quando terminar em computador compartilhado."],
      check: "Antes de operar, confirme se o perfil exibido combina com sua função.",
      common: "Senha incorreta ou usuário inativo impedem entrada.",
      support: "Peça ajuda ao Admin se sua função, vendedor vinculado ou grupo comercial estiver incorreto."
    },
    {
      id: "dashboard-comercial",
      title: "Dashboard comercial",
      who: "Todos os perfis",
      text: "Mostra o pulso da operação: vendas, notas pendentes, ranking do dia e sinais de atenção.",
      steps: ["Leia os cards de resumo.", "Abra a tela indicada pelo atalho.", "Resolva primeiro notas pendentes, duplicadas ou rejeitadas."],
      check: "Confira se os números fazem sentido para seu escopo de acesso.",
      common: "Notas ainda não aprovadas não entram como venda consolidada.",
      support: "Acione suporte se houver erro de carregamento ou contagem muito diferente do relatório."
    },
    {
      id: "upload-danfe",
      title: "Upload de DANFE",
      who: "Vendedor envia a propria nota; Admin/Gestor pode enviar por vendedor.",
      text: "DANFE pode chegar como PDF, XML ou imagem legivel. O vendedor escolhido no upload alimenta ranking e extratos.",
      steps: ["Escolha o vendedor quando seu perfil permitir.", "Anexe o arquivo correto.", "Envie e aguarde a extracao.", "Revise o status na lista."],
      check: "Vendedor, arquivo e nota precisam bater antes de enviar.",
      common: "Enviar a nota no vendedor errado contamina ranking e exige correcao operacional.",
      support: "Chame suporte se o upload retornar erro tecnico ou se o arquivo valido nao gerar nota."
    },
    {
      id: "status-das-notas",
      title: "Status das notas",
      who: "Todos que acompanham DANFEs",
      text: "O status mostra a etapa da nota: enviada, extraindo, pendente de revisão, aprovada, rejeitada ou duplicada.",
      steps: ["Filtre por status.", "Abra a nota pendente.", "Confira dados extraidos.", "Aprove, rejeite, revise ou reprocesse quando necessario."],
      check: "Apenas nota aprovada deve contar em ranking e extrato.",
      common: "PENDING_REVIEW quer dizer que a nota ainda precisa de decisão humana.",
      support: "Procure suporte se o status travar em extracao ou se uma duplicidade parecer falsa."
    },
    {
      id: "reprocessamento-ia",
      title: "Reprocessamento por IA",
      who: "Admin, Gestor, SAC e Financeiro",
      text: "Reprocessar IA força nova tentativa de leitura e mostra origem, provider, modelo, itens, alertas e chave mascarada.",
      steps: ["Clique em Reprocessar IA.", "Leia o card de feedback.", "Confira warnings.", "Revise ou corrija antes de aprovar."],
      check: "Nao aprove se a IA nao retornou itens validos ou se a chave/numero nao batem.",
      common: "Reprocessar sem feedback era um problema; agora a tela deve mostrar saida ou erro.",
      support: "Acione suporte se nao aparecer resultado, erro, provider ou warning depois do reprocessamento."
    },
    {
      id: "duplicidade-danfe",
      title: "Duplicidade de DANFE",
      who: "Revisores e Admin",
      text: "Duplicidade deve indicar uma nota já existente na base, não repetição interna de um mesmo pacote extraido.",
      steps: ["Confira NF e chave de acesso.", "Compare vendedor e arquivo.", "Se for duplicidade real, mantenha sinalizada.", "Se parecer falsa, reprocesse e reporte."],
      check: "Base limpa com pacote gerado pelo sistema nao deveria criar duplicata falsa.",
      common: "Mesmo arquivo com varias linhas da mesma nota nao deve virar varias notas duplicadas.",
      support: "Chame suporte com nome do arquivo, NF e horario se uma duplicidade falsa aparecer."
    },
    {
      id: "aprovacao-de-notas",
      title: "Aprovação de notas",
      who: "Admin, Gestor, SAC e Financeiro",
      text: "Aprovacao libera a nota para ranking e extratos. Rejeicao deve explicar o motivo. Revisao permite ajustar dados antes da decisao.",
      steps: ["Filtre pendentes.", "Selecione uma ou varias notas.", "Revise itens e total.", "Aprove ou rejeite com comentario quando fizer sentido."],
      check: "Aprovacao exige ao menos um item comercial valido.",
      common: "Aprovar em lote sem revisar vendedor, NF e itens pode distorcer ranking.",
      support: "Procure suporte se aprovar/rejeitar mover a tela de forma estranha ou nao registrar auditoria."
    },
    {
      id: "ranking",
      title: "Ranking",
      who: "Admin, Gestor, Supervisor e Vendedor",
      text: "Ranking ordena vendedores com base em notas aprovadas e filtros de campanha, grupo, vendedor e periodo.",
      steps: ["Escolha campanha ou periodo.", "Limpe vendedor para comparar todos.", "Confira total, itens e notas.", "Valide com extratos quando houver duvida."],
      check: "Ranking so e confiavel depois de subir e aprovar notas de mais de um vendedor.",
      common: "Sem notas aprovadas, ranking vazio e esperado.",
      support: "Acione suporte se extrato aprovado divergir claramente do ranking."
    },
    {
      id: "campanhas",
      title: "Campanhas",
      who: "Admin, Gestor e Supervisor",
      text: "Campanhas definem periodo, grupo, metrica e status usados para disputar ranking e gerar snapshots.",
      steps: ["Crie ou edite campanha.", "Escolha metrica.", "Defina periodo.", "Ative quando a regra estiver pronta.", "Crie snapshots para comparar depois."],
      check: "Periodo e metrica precisam refletir a regra comercial combinada.",
      common: "Snapshot congelado nao muda quando novas notas entram; ele serve para comparacao historica.",
      support: "Procure suporte se snapshot nao refletir o ranking no momento em que foi criado."
    },
    {
      id: "extratos",
      title: "Extratos",
      who: "Todos conforme permissao",
      text: "Extratos consolidam notas aprovadas por vendedor e grupo, com CSV usando os mesmos filtros da tela.",
      steps: ["Escolha campanha, grupo, vendedor ou periodo.", "Confira cards de resumo.", "Compare consolidado por vendedor e grupo.", "Baixe CSV se precisar analisar fora do sistema."],
      check: "Use o mesmo periodo do ranking quando for reconciliar numeros.",
      common: "Nota pendente ou rejeitada nao aparece no extrato.",
      support: "Acione suporte se CSV e tela divergirem com os mesmos filtros."
    },
    {
      id: "wiki",
      title: "Wiki",
      who: "Todos leem; Admin publica e revisa",
      text: "Wiki guarda procedimentos publicados por slug. Usuarios podem sugerir alteracoes; Admin aprova, rejeita e comenta a decisao.",
      steps: ["Busque por titulo, slug ou conteudo.", "Abra a pagina.", "Use o link /wiki/slug para compartilhar.", "Sugira alteracao ou publique nova versao conforme permissao."],
      check: "Slug deve ser curto, estavel e nao colidir com outra pagina.",
      common: "Pagina arquivada fica fora da lista padrao para usuarios comuns.",
      support: "Procure suporte se uma pagina publicada nao abrir pelo slug."
    },
    {
      id: "faq",
      title: "FAQ",
      who: "Todos perguntam; perfis superiores organizam conhecimento",
      text: "A FAQ planejada vai permitir perguntas em threads com respostas, comentarios, reacoes e promocao para a Wiki.",
      steps: ["Abra uma pergunta.", "Responda na thread.", "Reaja quando uma resposta ajudar.", "Perfil superior pode transformar a pergunta em secao da Wiki."],
      check: "FAQ continua existindo mesmo quando uma resposta vira Wiki; o link deve apontar para a secao criada.",
      common: "Pergunta operacional recorrente nao deve ficar perdida em conversa solta.",
      support: "Procure suporte se o vinculo FAQ -> Wiki nao aparecer depois da promocao."
    },
    {
      id: "usuarios-times",
      title: "Usuarios e times",
      who: "Admin e Gestor",
      text: "Usuarios/Times deve criar acessos comerciais e vincular vendedor, supervisor, SAC e Admin aos escopos corretos.",
      steps: ["Crie usuario.", "Escolha funcao.", "Vincule SellerProfile quando for vendedor.", "Associe supervisor a grupo quando necessario."],
      check: "Email, funcao e vinculo comercial precisam estar corretos antes de liberar acesso.",
      common: "Usuario vendedor sem SellerProfile nao alimenta a propria operacao corretamente.",
      support: "Chame suporte se nao conseguir corrigir funcao ou vinculo comercial."
    },
    {
      id: "perfis-e-permissoes",
      title: "Perfis e permissoes",
      who: "Todos precisam entender seu alcance",
      text: "ADMIN opera tudo; SAC e FINANCEIRO revisam notas conforme regra; VENDEDOR envia e acompanha; SUPERVISOR acompanha time.",
      steps: ["Confira seu perfil no topo.", "Use filtros do seu escopo.", "Peça ajuste se registros esperados nao aparecerem."],
      check: "Antes de concluir que falta dado, confirme se voce tem permissao para ver ou agir.",
      common: "Supervisor sem grupo ou vendedor sem perfil comercial pode ver menos que o esperado.",
      support: "Acione Admin ou suporte para corrigir perfil, usuario vinculado ou escopo."
    },
    {
      id: "auditoria",
      title: "Auditoria",
      who: "Admin acompanha eventos sensiveis",
      text: "Auditoria registra acoes importantes, quem executou, quando ocorreu e qual registro foi afetado.",
      steps: ["Filtre por acao, entidade, registro, usuario ou periodo.", "Abra o evento.", "Compare metadados com a alteracao esperada."],
      check: "ID e identificador interno do registro, nao NF nem email.",
      common: "Acao tecnica como auth.login descreve o evento gravado pelo sistema.",
      support: "Procure suporte se faltar evento de aprovacao, rejeicao, reprocessamento ou publicacao."
    },
    {
      id: "notificacoes-in-app",
      title: "Notificacoes in-app",
      who: "Todos recebem eventos relevantes",
      text: "O centro de notificacoes planejado deve avisar sobre notas aprovadas, rejeitadas, comentadas, revisadas, Wiki e FAQ.",
      steps: ["Abra o sino ou centro de notificacoes.", "Leia itens novos.", "Siga o link para o registro.", "Marque como lido quando resolver."],
      check: "Notificacao deve apontar para a nota, Wiki ou thread correta.",
      common: "Evento sem link de destino vira ruido operacional.",
      support: "Procure suporte se aprovacoes, rejeicoes ou comentarios nao gerarem notificacao."
    },
    {
      id: "glossario",
      title: "Glossário rápido",
      who: "Todos os perfis",
      text: "Alguns termos aparecem em filtros, tabelas e auditoria.",
      steps: ["DANFE e o documento auxiliar da NF-e.", "Chave de acesso identifica a nota.", "Snapshot congela ranking.", "Slug e o caminho amigavel da Wiki.", "Escopo e o conjunto de dados que o usuario pode ver."],
      check: "Nao confunda ID interno com NF, chave de acesso, email ou credencial.",
      common: "Status tecnico ajuda em filtros, mas a decisao operacional deve considerar a nota real.",
      support: "Peça suporte quando um termo técnico bloquear uma decisão operacional."
    },
    {
      id: "problemas-comuns",
      title: "Problemas comuns",
      who: "Todos os perfis",
      text: "A maioria dos bloqueios vem de filtro restrito, nota pendente, vendedor errado, duplicidade falsa ou permissao insuficiente.",
      steps: ["Limpe filtros.", "Recarregue a tela.", "Confira perfil e escopo.", "Leia a mensagem de erro.", "Tente reproduzir com um registro especifico."],
      check: "Nunca cole tokens, secrets, credenciais Google ou dados sensiveis em campos do sistema.",
      common: "Ranking e extrato vazios normalmente indicam falta de nota aprovada no periodo.",
      support: "Procure suporte se o erro persistir, envolver credenciais ou impactar a operacao real."
    }
  ];

  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (!hash) return;
    window.setTimeout(() => document.getElementById(hash)?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  }, []);

  return (
    <div className="content-stack">
      <section className="panel help-hero">
        <p className="eyebrow">Ajuda operacional</p>
        <h2>Como usar o AlwaysTrack sem treinamento técnico</h2>
        <p className="muted">
          Você está como {user.role}. Use o sumário para ir direto ao fluxo, ou clique nos ícones i dos campos para abrir a seção certa.
        </p>
      </section>

      <section className="panel help-card help-summary" aria-label="Sumário do Como usar">
        {sections.map((section) => (
          <a href={`#${section.id}`} key={section.id}>{section.title}</a>
        ))}
      </section>

      <div className="help-section-grid">
        {sections.map((section) => (
          <section className="panel help-card help-section" id={section.id} key={section.id}>
            <p className="eyebrow">{section.who}</p>
            <h2>{section.title}</h2>
            <p>{section.text}</p>
            <div>
              <strong>Passo a passo</strong>
              <ol>
                {section.steps.map((step) => <li key={step}>{step}</li>)}
              </ol>
            </div>
            <p><strong>Antes de salvar/processar:</strong> {section.check}</p>
            <p><strong>Erro comum:</strong> {section.common}</p>
            <p><strong>Quando chamar suporte:</strong> {section.support}</p>
          </section>
        ))}
      </div>
    </div>
  );
}

function NotificationCenter({ onNavigate }: { onNavigate: (href?: string | null) => void }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<InAppNotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);

  async function loadNotifications() {
    setLoading(true);
    try {
      const result = await api<{ items: InAppNotificationItem[]; unread: number }>("/v1/in-app-notifications");
      setItems(result.items);
      setUnread(result.unread);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadNotifications();
  }, []);

  async function markRead(item: InAppNotificationItem) {
    if (!item.readAt) {
      await api(`/v1/in-app-notifications/${item.id}/read`, { method: "POST" });
      await loadNotifications();
    }
  }

  async function markAllRead() {
    await api("/v1/in-app-notifications/read-all", { method: "POST" });
    await loadNotifications();
  }

  async function openNotification(item: InAppNotificationItem) {
    await markRead(item);
    setOpen(false);
    onNavigate(item.href);
  }

  return (
    <div className="notification-center">
      <button className="notification-trigger secondary" type="button" onClick={() => {
        setOpen((current) => !current);
        void loadNotifications();
      }} title="Notificações">
        <Icon name="bell" />
        {unread > 0 ? <span>{unread > 9 ? "9+" : unread}</span> : null}
      </button>
      {open ? (
        <div className="notification-popover">
          <div className="notification-popover-header">
            <strong>Notificações</strong>
            <button className="link-button" disabled={unread === 0} type="button" onClick={() => void markAllRead()}>
              Marcar lidas
            </button>
          </div>
          {loading && items.length === 0 ? <p className="muted">Carregando...</p> : null}
          {!loading && items.length === 0 ? <p className="muted">Nenhuma notificação</p> : null}
          <div className="notification-list">
            {items.map((item) => (
              <button className={item.readAt ? "notification-item" : "notification-item unread"} key={item.id} type="button" onClick={() => void openNotification(item)}>
                <span>
                  <strong>{item.title}</strong>
                  <small>{formatDateTimeBr(item.createdAt)} / {item.type}</small>
                </span>
                {item.body ? <em>{item.body}</em> : null}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function AppShell({ user, onLogout }: { user: CurrentUser; onLogout: () => void }) {
  const visibleNav = useMemo(() => navItems.filter((item) => item.roles.includes(user.role)), [user.role]);
  const initialHelpId = window.location.hash.replace("#", "");
  const initialWikiSlug = wikiSlugFromPath();
  const startsInHelp = helpAnchorIds.has(initialHelpId) && visibleNav.some((item) => item.key === "help");
  const startsInWiki = window.location.pathname === "/wiki" || window.location.pathname.startsWith("/wiki/");
  const [activeView, setActiveView] = useState<ViewKey>(startsInHelp ? "help" : startsInWiki ? "wiki" : visibleNav[0]?.key ?? "dashboard");
  const [pendingHelpHash, setPendingHelpHash] = useState<string | null>(startsInHelp ? `#${initialHelpId}` : null);
  const activeItem = visibleNav.find((item) => item.key === activeView) ?? visibleNav[0];
  const primaryNav = visibleNav.filter((item) => item.key !== "audit" && item.key !== "settings");

  function clearHelpHash() {
    if (helpAnchorIds.has(window.location.hash.replace("#", ""))) {
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
    }
  }

  function openHelpHash(hash = "#visao-geral") {
    const normalizedHash = hash.startsWith("#") ? hash : `#${hash}`;
    const id = normalizedHash.replace("#", "");
    if (!helpAnchorIds.has(id)) return;
    setPendingHelpHash(normalizedHash);
    setActiveView("help");
  }

  function openView(key: ViewKey) {
    if (key === "help") {
      openHelpHash("#visao-geral");
      return;
    }
    setPendingHelpHash(null);
    clearHelpHash();
    if (key === "wiki") {
      window.history.replaceState(null, "", "/wiki");
    } else if (window.location.pathname === "/wiki" || window.location.pathname.startsWith("/wiki/")) {
      window.history.replaceState(null, "", "/");
    }
    setActiveView(key);
  }

  async function logout() {
    await api("/v1/auth/logout", { method: "POST" });
    onLogout();
  }

  function openNotificationHref(href?: string | null) {
    if (!href) return;
    if (href.startsWith("/wiki/")) {
      window.location.assign(href);
      return;
    }
    if (href === "/wiki") {
      openView("wiki");
      return;
    }
    if (href === "/faq") {
      openView("faq");
      return;
    }
    if (href === "/notas") {
      openView("notes");
      return;
    }
    window.location.assign(href);
  }

  useEffect(() => {
    function openHelp(event: Event) {
      const hash = (event as CustomEvent<{ hash?: string }>).detail?.hash ?? "#visao-geral";
      openHelpHash(hash);
    }

    window.addEventListener("alwaystrack:open-help", openHelp);
    return () => window.removeEventListener("alwaystrack:open-help", openHelp);
  }, []);

  useEffect(() => {
    if (activeView !== "help" || !pendingHelpHash) return;
    let cancelled = false;
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        if (cancelled) return;
        window.history.replaceState(null, "", pendingHelpHash);
        const section = document.getElementById(pendingHelpHash.replace("#", ""));
        section?.scrollIntoView({ behavior: "smooth", block: "start" });
        section?.classList.add("help-section-flash");
        window.setTimeout(() => section?.classList.remove("help-section-flash"), 1400);
      });
    });
    return () => {
      cancelled = true;
    };
  }, [activeView, pendingHelpHash]);

  return (
    <main className="app-frame">
      <aside className="sidebar">
        <div className="brand">
          <BrandMark />
          <div>
            <strong>{appName}</strong>
            <small>Notas, ranking e campanhas</small>
          </div>
        </div>
        <nav className="nav-list" aria-label="Navegação principal">
          {visibleNav.map((item) => (
            <button
              className={item.key === activeItem.key ? "nav-item active" : "nav-item"}
              key={item.key}
              onClick={() => openView(item.key)}
            >
              <span><Icon name={item.icon} /> {item.label}</span>
              <small>{item.description}</small>
            </button>
          ))}
        </nav>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div className="topbar-title">
            <nav className="breadcrumbs" aria-label="Breadcrumbs">
              <button type="button" onClick={() => openView("dashboard")}>Início</button>
              <span>/</span>
              <strong>{activeItem.label}</strong>
            </nav>
            <p className="eyebrow">{user.role}</p>
            <h1><Icon name={activeItem.icon} /> {activeItem.label}</h1>
            <p className="muted">{activeItem.description}</p>
          </div>
          <div className="topbar-nav-group">
            <nav className="top-nav" aria-label="Atalhos principais">
              {primaryNav.map((item) => (
                <button
                  className={item.key === activeItem.key ? "top-nav-item active" : "top-nav-item"}
                  key={item.key}
                  type="button"
                  onClick={() => openView(item.key)}
                  title={item.description}
                >
                  <Icon name={item.icon} />
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
          <div className="topbar-account user-actions">
            <NotificationCenter onNavigate={openNotificationHref} />
            <span>{user.name}</span>
            <button className="secondary" onClick={logout}>
              <Icon name="logout" /> Sair
            </button>
          </div>
        </header>
        {activeItem.key === "notes" ? (
          <NotesView user={user} />
        ) : activeItem.key === "ranking" ? (
          <RankingView user={user} />
        ) : activeItem.key === "campaigns" ? (
          <CampaignsView user={user} />
        ) : activeItem.key === "statements" ? (
          <StatementsView />
        ) : activeItem.key === "users" ? (
          <UsersTeamsView />
        ) : activeItem.key === "professionals" ? (
          <ProfessionalsView user={user} />
        ) : activeItem.key === "dashboard" ? (
          <DashboardView onOpen={openView} />
        ) : activeItem.key === "licenses" ? (
          <LicensesView user={user} />
        ) : activeItem.key === "documents" ? (
          <DocumentsView user={user} />
        ) : activeItem.key === "reports" ? (
          <ReportsView />
        ) : activeItem.key === "wiki" ? (
          <WikiView user={user} initialSlug={initialWikiSlug} />
        ) : activeItem.key === "faq" ? (
          <FaqThreadsView user={user} />
        ) : activeItem.key === "audit" ? (
          <AuditView />
        ) : activeItem.key === "settings" ? (
          <SettingsView />
        ) : activeItem.key === "help" ? (
          <HelpView user={user} />
        ) : (
          <PlaceholderView item={activeItem} />
        )}
      </section>
    </main>
  );
}

function App() {
  const uploadMatch = window.location.pathname.match(/^\/upload\/([^/]+)$/);
  const isFaq = window.location.pathname === "/faq";
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (uploadMatch || isFaq) {
      setReady(true);
      return;
    }
    api<{ user: CurrentUser }>("/v1/auth/me")
      .then((result) => setUser(result.user))
      .catch(() => setUser(null))
      .finally(() => setReady(true));
  }, [uploadMatch, isFaq]);

  if (!ready) {
    return <main className="auth-page">Carregando...</main>;
  }

  if (uploadMatch) {
    return <PublicUploadView token={decodeURIComponent(uploadMatch[1])} />;
  }

  if (isFaq) {
    return <PublicFaqView />;
  }

  return user ? <AppShell user={user} onLogout={() => setUser(null)} /> : <LoginForm onLogin={setUser} />;
}

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
