import { Fragment, StrictMode, useEffect, useMemo, useState, type FormEvent } from "react";
import { createRoot } from "react-dom/client";
import {
  BadgeCheck,
  BarChart3,
  Bell,
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
} from "@sylembra/shared";
import {
  ConfirmButton,
  HelpTip,
  OperationalFilters,
  OperationalState,
  OperationalTable,
  PaginationSummary,
  StatusBadge
} from "./components/operational";
import "./styles.css";

type ViewKey = "dashboard" | "professionals" | "licenses" | "documents" | "reports" | "audit" | "settings" | "help";
type IconName =
  | "home"
  | "users"
  | "badge"
  | "file"
  | "chart"
  | "audit"
  | "settings"
  | "help"
  | "logout"
  | "download"
  | "check"
  | "bell"
  | "scan";

interface AuditLogItem {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  metadataJson: unknown;
  createdAt: string;
  actor: null | {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

function formatAuditMetadados(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return "Sem metadata";
  }

  const sensitiveKeys = ["password", "token", "secret", "hash", "authorization", "cookie"];

  function redact(input: unknown): unknown {
    if (Array.isArray(input)) {
      return input.map(redact);
    }

    if (input && typeof input === "object") {
      return Object.fromEntries(
        Object.entries(input).map(([key, item]) => [
          key,
          sensitiveKeys.some((sensitive) => key.toLowerCase().includes(sensitive)) ? "[redacted]" : redact(item)
        ])
      );
    }

    return input;
  }

  let parsed = value;
  if (typeof value === "string" && value.trim() !== "") {
    try {
      parsed = JSON.parse(value);
    } catch {
      parsed = value;
    }
  }

  return JSON.stringify(redact(parsed), null, 2);
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
const auditEntityTypeOptions = toFilterOptions([
  { value: "Organization", label: "Organização" },
  { value: "Unit", label: "Unidade" },
  { value: "Sector", label: "Setor" },
  { value: "User", label: "Usuário" },
  { value: "Professional", label: "Profissional" },
  { value: "LicenseType", label: "Tipo de licença" },
  { value: "License", label: "Licença" },
  { value: "Document", label: "Documento" },
  { value: "NotificationRule", label: "Regra de notificação" },
  { value: "NotificationJob", label: "Job de notificação" },
  { value: "Faq", label: "FAQ" }
]);

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
  createdAt: string;
  updatedAt: string;
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

interface FaqItem {
  id: string;
  category: string;
  question: string;
  answer: string;
  order: number;
  active?: boolean;
}

interface DashboardData {
  metrics: {
    totalProfessionals: number;
    licenses: { regular: number; expiring: number; expired: number };
    documents: { pendingValidation: number };
    notifications: { pending: number; sent: number; failed: number };
  };
  queues: {
    expiringLicenses: LicenseItem[];
    expiredLicenses: LicenseItem[];
    pendingDocuments: DocumentItem[];
    recentUploads: DocumentItem[];
    failedNotifications: NotificationJobItem[];
    expiredBySector: Array<{ label: string; total: number }>;
    pendingDocumentsByRt: Array<{ label: string; total: number }>;
    pendingDocumentsByUnit: Array<{ label: string; total: number }>;
  };
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
  { key: "dashboard", label: "Dashboard", description: "Visão operacional do dia", icon: "home", roles: ["ADMIN", "RT", "SUPERVISOR"] },
  { key: "professionals", label: "Profissionais", description: "Cadastro e acompanhamento", icon: "users", roles: ["ADMIN", "RT", "SUPERVISOR"] },
  { key: "licenses", label: "Licenças", description: "Vencimentos e status", icon: "badge", roles: ["ADMIN", "RT", "SUPERVISOR"] },
  { key: "documents", label: "Documentos", description: "Uploads e validações", icon: "file", roles: ["ADMIN", "RT", "SUPERVISOR"] },
  { key: "reports", label: "Relatórios", description: "Consultas operacionais", icon: "chart", roles: ["ADMIN", "RT", "SUPERVISOR"] },
  { key: "audit", label: "Auditoria", description: "Trilha de eventos", icon: "audit", roles: ["ADMIN"] },
  { key: "settings", label: "Configurações", description: "Usuários e organização", icon: "settings", roles: ["ADMIN"] },
  { key: "help", label: "Como usar", description: "Ajuda operacional", icon: "help", roles: ["ADMIN", "RT", "SUPERVISOR"] }
];

const helpAnchorIds = new Set([
  "visao-geral",
  "primeiro-acesso",
  "dashboard",
  "profissionais",
  "licencas",
  "documentos",
  "upload-publico",
  "notificacoes",
  "relatorios",
  "auditoria",
  "configuracoes",
  "perfis-e-permissoes",
  "filtros-e-ids",
  "cadastro-profissional",
  "cadastro-licenca",
  "validacao-documentos",
  "links-de-upload",
  "configuracao-usuarios",
  "configuracao-organizacao",
  "jobs-notificacao",
  "importacao-csv",
  "glossario",
  "problemas-comuns"
]);

const iconComponents: Record<IconName, LucideIcon> = {
  home: LayoutDashboard,
  users: Users,
  badge: BadgeCheck,
  file: FileText,
  chart: BarChart3,
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

function BrandMark({ className = "" }: { className?: string }) {
  return <img className={`brand-mark ${className}`.trim()} src="/favicon/favicon.svg" alt="SyLembra" />;
}

function InfoTip({ text, href }: { text: string; href?: string }) {
  return <HelpTip text={text} href={href} />;
}

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "";

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    credentials: "include",
    headers: {
      "content-type": "application/json",
      ...options?.headers
    },
    ...options
  });
  const payload = (await response.json()) as ApiResult<T>;
  if (!payload.ok) {
    throw new Error(payload.error.message);
  }
  return payload.data;
}

function LoginForm({ onLogin }: { onLogin: (user: CurrentUser) => void }) {
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

  return (
    <main className="auth-page">
      <form className="panel login-panel" onSubmit={submit}>
        <div className="login-brand">
          <BrandMark className="login-brand-mark" />
          <div>
            <p className="eyebrow">SyLembra</p>
            <h1>Entrar</h1>
          </div>
        </div>
        <div>
          <p className="muted">Acesso administrativo para operação de licenças e documentos.</p>
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
        <button disabled={loading}>{loading ? "Entrando..." : "Entrar"}</button>
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

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function DashboardView({ onOpen }: { onOpen: (view: ViewKey) => void }) {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setDashboard(await api<DashboardData>("/v1/dashboard"));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Falha ao carregar dashboard.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  if (loading) return <OperationalState state="loading" title="Carregando dashboard" />;
  if (error) return <OperationalState state="error" title="Falha ao carregar dashboard" detail={error} />;
  if (!dashboard) return <OperationalState state="empty" title="Dashboard indisponível" />;

  return (
    <div className="content-stack">
      <section className="metrics-grid">
        <MetricCard label="Profissionais" value={dashboard.metrics.totalProfessionals} />
        <MetricCard label="Licenças regulares" value={dashboard.metrics.licenses.regular} />
        <MetricCard label="Licenças a vencer" value={dashboard.metrics.licenses.expiring} />
        <MetricCard label="Licenças vencidas" value={dashboard.metrics.licenses.expired} />
        <MetricCard label="Docs em validação" value={dashboard.metrics.documents.pendingValidation} />
        <MetricCard label="Notificações pendentes" value={dashboard.metrics.notifications.pending} />
        <MetricCard label="Notificações enviadas" value={dashboard.metrics.notifications.sent} />
        <MetricCard label="Notificações com falha" value={dashboard.metrics.notifications.failed} />
      </section>

      <section className="dashboard-grid">
        <div className="panel table-panel">
          <h2>Vencendo em 30 dias</h2>
          {dashboard.queues.expiringLicenses.length === 0 ? (
            <OperationalState state="empty" title="Nenhuma licença a vencer" />
          ) : (
            <OperationalTable
              items={dashboard.queues.expiringLicenses}
              getRowKey={(item) => item.id}
              columns={[
                { key: "professional", header: "Profissional", render: (item) => item.professional.name },
                { key: "license", header: "Licença", render: (item) => item.licenseType.name },
                { key: "expires", header: "Vence", render: (item) => formatDateBr(item.expiresAt) },
                { key: "status", header: "Status", render: (item) => <StatusBadge kind="license" value={item.status} /> },
                { key: "action", header: "Ação", render: () => <button className="secondary" onClick={() => onOpen("licenses")}>Ver licenças</button> }
              ]}
            />
          )}
        </div>

        <div className="panel table-panel">
          <h2>Vencidas</h2>
          {dashboard.queues.expiredLicenses.length === 0 ? (
            <OperationalState state="empty" title="Nenhuma licença vencida" />
          ) : (
            <OperationalTable
              items={dashboard.queues.expiredLicenses}
              getRowKey={(item) => item.id}
              columns={[
                { key: "professional", header: "Profissional", render: (item) => item.professional.name },
                { key: "sector", header: "Setor", render: (item) => item.professional.sector.name },
                { key: "license", header: "Licença", render: (item) => item.licenseType.name },
                { key: "action", header: "Ação", render: () => <button className="secondary" onClick={() => onOpen("licenses")}>Regularizar</button> }
              ]}
            />
          )}
        </div>

        <div className="panel table-panel">
          <h2>Documentos pendentes</h2>
          {dashboard.queues.pendingDocuments.length === 0 ? (
            <OperationalState state="empty" title="Nenhum documento pendente" />
          ) : (
            <OperationalTable
              items={dashboard.queues.pendingDocuments}
              getRowKey={(item) => item.id}
              columns={[
                { key: "file", header: "Arquivo", render: (item) => item.fileName },
                { key: "professional", header: "Profissional", render: (item) => item.professional.name },
                { key: "status", header: "Status", render: (item) => <StatusBadge kind="document" value={item.status} /> },
                { key: "action", header: "Ação", render: () => <button className="secondary" onClick={() => onOpen("documents")}>Validar</button> }
              ]}
            />
          )}
        </div>

        <div className="panel table-panel">
          <h2>Uploads recentes</h2>
          {dashboard.queues.recentUploads.length === 0 ? (
            <OperationalState state="empty" title="Nenhum upload recente" />
          ) : (
            <OperationalTable
              items={dashboard.queues.recentUploads}
              getRowKey={(item) => item.id}
              columns={[
                { key: "file", header: "Arquivo", render: (item) => item.fileName },
                { key: "professional", header: "Profissional", render: (item) => item.professional.name },
                { key: "createdAt", header: "Recebido", render: (item) => formatDateBr(item.createdAt) },
                { key: "action", header: "Ação", render: () => <button className="secondary" onClick={() => onOpen("documents")}>Abrir</button> }
              ]}
            />
          )}
        </div>
      </section>

      <section className="dashboard-grid">
        <div className="panel table-panel">
          <h2>Vencidas por setor</h2>
          {dashboard.queues.expiredBySector.length === 0 ? (
            <OperationalState state="empty" title="Sem vencidas por setor" />
          ) : (
            <OperationalTable
              items={dashboard.queues.expiredBySector}
              getRowKey={(item) => item.label}
              columns={[
                { key: "label", header: "Setor", render: (item) => item.label },
                { key: "total", header: "Total", render: (item) => item.total },
                { key: "action", header: "Ação", render: () => <button className="secondary" onClick={() => onOpen("licenses")}>Ver</button> }
              ]}
            />
          )}
        </div>

        <div className="panel table-panel">
          <h2>Pendências por RT</h2>
          {dashboard.queues.pendingDocumentsByRt.length === 0 ? (
            <OperationalState state="empty" title="Sem pendências por RT" />
          ) : (
            <OperationalTable
              items={dashboard.queues.pendingDocumentsByRt}
              getRowKey={(item) => item.label}
              columns={[
                { key: "label", header: "RT", render: (item) => item.label },
                { key: "total", header: "Total", render: (item) => item.total },
                { key: "action", header: "Ação", render: () => <button className="secondary" onClick={() => onOpen("documents")}>Ver</button> }
              ]}
            />
          )}
        </div>

        <div className="panel table-panel">
          <h2>Pendências por unidade</h2>
          {dashboard.queues.pendingDocumentsByUnit.length === 0 ? (
            <OperationalState state="empty" title="Sem pendências por unidade" />
          ) : (
            <OperationalTable
              items={dashboard.queues.pendingDocumentsByUnit}
              getRowKey={(item) => item.label}
              columns={[
                { key: "label", header: "Unidade", render: (item) => item.label },
                { key: "total", header: "Total", render: (item) => item.total },
                { key: "action", header: "Ação", render: () => <button className="secondary" onClick={() => onOpen("documents")}>Ver</button> }
              ]}
            />
          )}
        </div>

        <div className="panel table-panel">
          <h2>Falhas de notificação</h2>
          {dashboard.queues.failedNotifications.length === 0 ? (
            <OperationalState state="empty" title="Nenhuma falha de notificação" />
          ) : (
            <OperationalTable
              items={dashboard.queues.failedNotifications}
              getRowKey={(item) => item.id}
              columns={[
                { key: "professional", header: "Profissional", render: (item) => item.professional.name },
                { key: "template", header: "Template", render: (item) => item.templateKey },
                { key: "attempts", header: "Tentativas", render: (item) => item.attempts },
                { key: "action", header: "Ação", render: () => <button className="secondary" onClick={() => onOpen("settings")}>Ajustar</button> }
              ]}
            />
          )}
        </div>
      </section>
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

function AuditView() {
  const [items, setItems] = useState<AuditLogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [users, setUsers] = useState<ManagedUserItem[]>([]);
  const [action, setAction] = useState("");
  const [entityType, setEntityType] = useState("");
  const [entityId, setEntityId] = useState("");
  const [actorId, setActorId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState("25");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load(nextPage = page) {
    setLoading(true);
    setError(null);
    const search = new URLSearchParams();
    if (action) search.set("action", action);
    if (entityType) search.set("entityType", entityType);
    if (entityId) search.set("entityId", entityId);
    if (actorId) search.set("actorId", actorId);
    if (from) search.set("from", from);
    if (to) search.set("to", to);
    if (pageSize) search.set("pageSize", pageSize);
    search.set("page", String(nextPage));
    try {
      const result = await api<{ items: AuditLogItem[]; total: number }>(`/v1/audit-logs?${search.toString()}`);
      setItems(result.items);
      setTotal(result.total);
      setPage(nextPage);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Falha ao carregar auditoria.");
    } finally {
      setLoading(false);
    }
  }

  async function loadFilterData() {
    try {
      const usersResult = await api<{ users: ManagedUserItem[] }>("/v1/users");
      setUsers(usersResult.users);
    } catch {
      // Keep audit usable even if supporting filter data is unavailable.
    }
  }

  useEffect(() => {
    void loadFilterData();
    void load();
  }, []);

  return (
    <div className="content-stack">
      <OperationalFilters
        fields={[
          { key: "action", label: "Ação", value: action, placeholder: "auth.login", help: "Nome do evento gravado na trilha de auditoria.", helpHref: "#auditoria", onChange: setAction },
          {
            key: "entityType",
            label: "Entidade",
            type: "select",
            value: entityType,
            placeholder: "Todas as entidades",
            options: auditEntityTypeOptions,
            help: "Tipo técnico do registro alterado.",
            helpHref: "#auditoria",
            onChange: setEntityType
          },
          { key: "entityId", label: "Registro", value: entityId, placeholder: "ID do registro", help: "Identificador interno da entidade auditada.", helpHref: "#auditoria", onChange: setEntityId },
          {
            key: "actorId",
            label: "Usuário executor",
            type: "select",
            value: actorId,
            placeholder: "Todos os usuários",
            options: users.map((item) => ({ value: item.id, label: `${item.name} (${item.email})` })),
            help: "Filtra ações feitas por um usuário específico.",
            helpHref: "#auditoria",
            onChange: setActorId
          },
          { key: "from", label: "Início", type: "date", value: from, onChange: setFrom },
          { key: "to", label: "Fim", type: "date", value: to, onChange: setTo },
          { key: "pageSize", label: "Por página", type: "select", value: pageSize, placeholder: "25", options: pageSizeFilterOptions, onChange: setPageSize }
        ]}
        onSubmit={() => void load(1)}
      />

      <section className="panel table-panel">
        {error ? (
          <OperationalState state="error" title="Falha ao carregar auditoria" detail={error} />
        ) : loading ? (
          <OperationalState state="loading" title="Carregando eventos" />
        ) : items.length === 0 ? (
          <OperationalState state="empty" title="Nenhum evento encontrado" detail="Ajuste os filtros ou gere novas ações." />
        ) : (
          <>
            <OperationalTable
              items={items}
              getRowKey={(item) => item.id}
              columns={[
                { key: "date", header: "Data", render: (item) => formatDateTimeBr(item.createdAt) },
                { key: "action", header: "Ação", render: (item) => item.action },
                { key: "entity", header: "Entidade", render: (item) => `${item.entityType} / ${item.entityId}` },
                {
                  key: "actor",
                  header: "Ator",
                  render: (item) => (item.actor ? `${item.actor.name} (${item.actor.email})` : "Contexto publico")
                },
                {
                  key: "metadata",
                  header: "Metadados",
                  render: (item) => <pre className="metadata-preview">{formatAuditMetadados(item.metadataJson)}</pre>
                }
              ]}
            />
            <div className="pagination-actions">
              <PaginationSummary page={page} pageSize={Number(pageSize) || 25} total={total} />
              <div>
                <button className="secondary" type="button" disabled={page <= 1 || loading} onClick={() => void load(page - 1)}>
                  Anterior
                </button>
                <button
                  className="secondary"
                  type="button"
                  disabled={page * (Number(pageSize) || 25) >= total || loading}
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
  const [googleSheetLink, setGoogleSheetLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
      const [professionalsResult, organizationResult, usersResult] = await Promise.all([
        api<{ items: ProfessionalSummary[]; total: number }>(`/v1/professionals?${search.toString()}`),
        user.role === "ADMIN" ? api<{ organization: OrganizationItem }>("/v1/organization") : Promise.resolve(null),
        user.role === "ADMIN" ? api<{ users: ManagedUserItem[] }>("/v1/users") : Promise.resolve(null)
      ]);
      setItems(professionalsResult.items);
      setTotal(professionalsResult.total);
      if (organizationResult) {
        setOrganization(organizationResult.organization);
        setUnitId((current) => current || organizationResult.organization.units[0]?.id || "");
        setSectorId((current) => current || organizationResult.organization.units[0]?.sectors[0]?.id || "");
      }
      if (usersResult) setUsers(usersResult.users);
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

  async function createGoogleSheetTemplate() {
    setImporting(true);
    setImportError(null);
    setGoogleSheetLink(null);
    try {
      const result = await api<{ spreadsheetId: string; spreadsheetUrl: string; sharedWith: string[] }>(
        "/v1/imports/professionals-licenses/template/google-sheet"
      );
      const popup = window.open(result.spreadsheetUrl, "_blank", "noopener,noreferrer");
      if (!popup) {
        setGoogleSheetLink(result.spreadsheetUrl);
        setImportError("A planilha foi criada, mas o navegador bloqueou a nova aba. Use o link abaixo.");
      }
    } catch (caught) {
      setImportError(
        caught instanceof Error
          ? caught.message
          : "Não foi possível gerar a planilha Google. Verifique credenciais e permissões do Google Sheets."
      );
    } finally {
      setImporting(false);
    }
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
            <button className="secondary" disabled={importing} type="button" onClick={() => void createGoogleSheetTemplate()}>
              Gerar Google Sheet
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
      try {
        await navigator.clipboard?.writeText(link);
      } catch {
        // Browser permissions can block clipboard writes; the prompt still exposes the link.
      }
      window.prompt("Link de upload", link);
    });
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
          { key: "status", label: "Status", value: statusFilter, placeholder: "UPLOADED, APPROVED...", help: "UPLOADED indica documentos aguardando validação.", helpHref: "#documentos", onChange: setStatusFilter },
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
          <p className="eyebrow">SyLembra</p>
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
  const organizationId = params.get("organizationId") || "demo-org";
  const [items, setItems] = useState<FaqItem[]>([]);
  const [organizationName, setOrganizationName] = useState("SyLembra");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [problemType, setProblemType] = useState("Duvida sobre envio");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
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

function HelpView({ user }: { user: CurrentUser }) {
  const sections = [
    {
      id: "visao-geral",
      title: "Visão geral",
      who: "Todos os perfis",
      text: "Use a V1 para acompanhar profissionais, licenças, documentos, notificações e evidências de auditoria em uma rotina única.",
      steps: ["Entre no sistema.", "Confira o Dashboard.", "Aja primeiro sobre vencimentos, documentos pendentes e falhas."],
      check: "Confirme unidade, setor, RT responsável e período antes de confiar no resultado filtrado.",
      common: "Se algo não aparecer, limpe filtros por ID e tente uma busca por nome ou CPF.",
      support: "Procure suporte se dados do seed demo sumirem ou se uma tela falhar mesmo sem filtros."
    },
    {
      id: "primeiro-acesso",
      title: "Primeiro acesso",
      who: "Admin libera usuários; RT e Supervisor entram com acesso já criado.",
      text: "A conta determina quais telas e registros você enxerga. Admin vê a operação completa; RT e Supervisor veem apenas o escopo permitido.",
      steps: ["Acesse com email e senha.", "Confira seu perfil no topo da página.", "Use Sair quando terminar em computador compartilhado."],
      check: "Antes de operar, confirme se o perfil exibido combina com sua função.",
      common: "Senha incorreta ou usuário inativo impedem entrada.",
      support: "Peça ajuda ao Admin se sua unidade, setor ou perfil estiver incorreto."
    },
    {
      id: "dashboard",
      title: "Dashboard",
      who: "Todos os perfis",
      text: "Mostra o estado do dia: licenças vencendo, documentos aguardando validação e notificações com problema.",
      steps: ["Leia os cards de resumo.", "Abra a lista indicada pelo atalho.", "Resolva primeiro itens vencidos, pendentes ou com falha."],
      check: "Confira se os números fazem sentido para seu escopo de acesso.",
      common: "Números zerados podem ser normais em usuário sem escopo ou filtro muito restrito.",
      support: "Acione suporte se houver erro de carregamento ou contagem muito diferente do relatório."
    },
    {
      id: "profissionais",
      title: "Profissionais",
      who: "Admin cadastra; RT e Supervisor consultam conforme escopo.",
      text: "Centraliza dados do profissional, vínculo com unidade/setor, usuário de acesso e RT responsável.",
      steps: ["Busque por nome, CPF, email ou cargo.", "Admin pode cadastrar ou editar.", "Revise vínculos antes de criar licenças."],
      check: "CPF, email, unidade, setor, situação ativa e RT responsável devem estar corretos.",
      common: "Usuário vinculado é opcional; use apenas se o profissional também acessar o sistema.",
      support: "Peça suporte se houver duplicidade de CPF/email ou vínculo que você não consegue ajustar."
    },
    {
      id: "licencas",
      title: "Licenças",
      who: "Admin cria; RT e Supervisor acompanham.",
      text: "Controla tipo, número, validade, status e documentos relacionados a cada profissional.",
      steps: ["Filtre por profissional, status ou tipo.", "Confira vencimento e status.", "Use link de upload quando faltar documento."],
      check: "Tipo, número, validade e profissional precisam bater com o documento recebido.",
      common: "Status técnico como REGULAR, EXPIRING ou EXPIRED aparece em filtros avançados.",
      support: "Procure suporte se uma licença não muda de status depois de aprovar documento correto."
    },
    {
      id: "documentos",
      title: "Documentos",
      who: "Admin e RT validam; Supervisor consulta.",
      text: "Lista uploads enviados para comprovar licença. UPLOADED significa aguardando decisão.",
      steps: ["Abra a linha pendente.", "Baixe o arquivo.", "Aprove se estiver correto ou recuse com motivo claro."],
      check: "Confira nome, número da licença, validade, legibilidade e profissional antes de aprovar.",
      common: "Recusa sem motivo atrasa correção; escreva uma orientação simples para o profissional.",
      support: "Chame suporte se o arquivo não baixar, vier corrompido ou aparecer ligado ao profissional errado."
    },
    {
      id: "upload-publico",
      title: "Upload público",
      who: "Admin e RT geram link; profissional usa sem entrar no sistema.",
      text: "O link temporário permite enviar documento de uma licença específica. Envie somente ao profissional correto.",
      steps: ["Gere o link na licença.", "Compartilhe pelo canal combinado.", "Depois acompanhe o documento na tela Documentos."],
      check: "Verifique profissional, licença e prazo do link antes de enviar.",
      common: "Link expirado exige gerar um novo. Link trocado faz upload cair na licença errada.",
      support: "Peça suporte se o profissional não consegue abrir o link ou se o upload não aparece."
    },
    {
      id: "notificacoes",
      title: "Notificações",
      who: "Admin configura; demais perfis acompanham impactos.",
      text: "Regras criam avisos antes e depois do vencimento. Nos ultimos avisos, marque Notificar RT para copiar o responsavel tecnico junto com o profissional.",
      steps: ["Configure avisos iniciais apenas para o profissional.", "Crie o ultimo aviso com Notificar RT marcado.", "Use template Meta aprovado apenas quando o envio real estiver pronto."],
      check: "Confirme dias, repetição, template, telefone do RT e se o ambiente está em teste ou Meta real.",
      common: "Template errado ou credencial ausente gera falha de envio; não coloque tokens em telas, docs ou git.",
      support: "Procure suporte ao trocar de fake para Meta real, validar webhook ou investigar falhas repetidas."
    },
    {
      id: "relatorios",
      title: "Relatórios",
      who: "Todos conforme permissão",
      text: "Ajuda a conferir operação por período, unidade, setor, RT, status e canal.",
      steps: ["Escolha o relatório.", "Informe período e filtros necessários.", "Exporte CSV para análise externa quando preciso."],
      check: "Período, escopo e status precisam estar corretos antes de comparar números.",
      common: "Filtro por ID vazio mostra mais dados; filtro errado pode parecer falta de informação.",
      support: "Acione suporte se o CSV não exporta ou diverge claramente da tela."
    },
    {
      id: "auditoria",
      title: "Auditoria",
      who: "Admin acompanha eventos sensíveis.",
      text: "Registra ações importantes, quem executou, quando ocorreu e qual registro foi afetado.",
      steps: ["Filtre por ação, entidade, registro, usuário ou período.", "Abra o evento.", "Compare metadados com a alteração esperada."],
      check: "Use IDs com cuidado: ID é identificador interno do registro, não CPF nem número de licença.",
      common: "Ação técnica como auth.login descreve o evento gravado pelo sistema.",
      support: "Procure suporte se faltar evento de uma ação crítica ou se metadados parecerem inconsistentes."
    },
    {
      id: "configuracoes",
      title: "Configurações",
      who: "Admin",
      text: "Mantém usuários, organização, tipos de licença, FAQ e regras operacionais alinhados à rotina.",
      steps: ["Altere uma configuração por vez.", "Salve.", "Volte à tela afetada para conferir o efeito."],
      check: "Evite inativar usuário, unidade, setor ou tipo de licença que ainda esteja em uso.",
      common: "Mudanças de regra podem afetar notificações futuras, não necessariamente as já criadas.",
      support: "Peça suporte antes de mudanças grandes em produção ou ativação de Meta real."
    },
    {
      id: "perfis-e-permissoes",
      title: "Perfis e permissões",
      who: "Admin gerencia; todos precisam entender seu alcance.",
      text: "Admin opera tudo; RT acompanha profissionais sob sua responsabilidade; Supervisor consulta o escopo de unidade ou setor.",
      steps: ["Confira seu perfil no topo.", "Use filtros do seu escopo.", "Peça ajuste se registros esperados não aparecerem."],
      check: "Antes de concluir que falta dado, confirme se você tem permissão para vê-lo.",
      common: "RT sem vínculo ou Supervisor sem unidade/setor pode enxergar menos do que espera.",
      support: "Acione Admin ou suporte para corrigir perfil, usuário vinculado ou escopo."
    },
    {
      id: "filtros-e-ids",
      title: "Filtros e IDs",
      who: "Todos que usam filtros avançados",
      text: "ID é identificador interno do sistema. Use quando a busca por texto não for suficiente ou quando suporte pedir um registro exato.",
      steps: ["Prefira busca por nome, CPF, email ou número.", "Use ID apenas quando souber o valor correto.", "Remova o ID para voltar a uma busca ampla."],
      check: "Não confunda ID interno com CPF, número de licença, telefone ou WABA ID.",
      common: "Um caractere errado no ID pode zerar a lista.",
      support: "Peça suporte se você precisa de um ID e não sabe onde encontrá-lo."
    },
    {
      id: "cadastro-profissional",
      title: "Cadastro de profissional",
      who: "Admin",
      text: "Cria a pessoa acompanhada pela operação. Unidade, setor e RT definem onde ela aparece e quem acompanha suas pendências.",
      steps: ["Preencha nome, CPF, email e telefone.", "Escolha unidade e setor corretos.", "Vincule RT e usuário apenas quando fizer sentido."],
      check: "Confira CPF, email, unidade, setor e duplicidade antes de criar.",
      common: "Vincular unidade ou setor errado faz o profissional sumir para quem deveria acompanhá-lo.",
      support: "Peça suporte se existir duplicidade de CPF/email ou se o profissional precisar mudar de escopo."
    },
    {
      id: "cadastro-licenca",
      title: "Cadastro de licença",
      who: "Admin",
      text: "Registra a licença que será acompanhada por vencimento, documento e notificação.",
      steps: ["Escolha profissional e tipo.", "Copie número, emissor, UF e datas do documento.", "Revise status e observações antes de salvar."],
      check: "Profissional, tipo, número, emissor, UF, emissão e vencimento devem bater com o documento.",
      common: "Data de vencimento errada altera dashboard, relatórios e notificações.",
      support: "Procure suporte se o status não recalcular como esperado ou se o tipo de licença estiver faltando."
    },
    {
      id: "validacao-documentos",
      title: "Validação de documentos",
      who: "Admin e RT",
      text: "Aprovação transforma o upload em evidência aceita; recusa devolve correção para o profissional.",
      steps: ["Baixe e abra o arquivo.", "Confira profissional, licença, número, validade e legibilidade.", "Aprove se estiver correto ou recuse com motivo objetivo."],
      check: "Nunca aprove documento ilegível, vencido, de outra pessoa ou de outra licença.",
      common: "Motivo de recusa genérico atrasa a regularização; diga exatamente o que precisa corrigir.",
      support: "Acione suporte se o arquivo não abrir, parecer adulterado ou estiver ligado ao registro errado."
    },
    {
      id: "links-de-upload",
      title: "Links de upload",
      who: "Admin e RT geram; profissional envia",
      text: "Link de upload é temporário e vale para uma licença específica. Ele não deve ser reaproveitado para outra pessoa.",
      steps: ["Gere o link na linha da licença.", "Envie apenas ao profissional correto.", "Acompanhe o novo documento em Documentos."],
      check: "Confirme profissional, licença e prazo antes de compartilhar.",
      common: "Link expirado ou enviado para pessoa errada exige gerar outro link.",
      support: "Peça suporte se o profissional não conseguir anexar PDF/imagem ou se o upload não aparecer."
    },
    {
      id: "configuracao-usuarios",
      title: "Configuração de usuários",
      who: "Admin",
      text: "Usuários controlam acesso. Perfil e escopo definem o que cada pessoa enxerga e pode fazer.",
      steps: ["Crie nome, email e senha inicial.", "Escolha perfil.", "Marque unidades e setores para RT ou Supervisor."],
      check: "Senha inicial deve ter no mínimo 8 caracteres e ser compartilhada por canal seguro.",
      common: "RT ou Supervisor sem escopo vê menos dados do que espera.",
      support: "Acione suporte para corrigir acesso, resetar usuário crítico ou investigar visibilidade indevida."
    },
    {
      id: "configuracao-organizacao",
      title: "Configuração da organização",
      who: "Admin",
      text: "Organização, unidades e setores sustentam filtros, relatórios, escopos e cadastros.",
      steps: ["Mantenha nome e documento institucional.", "Cadastre unidades.", "Cadastre setores dentro da unidade correta."],
      check: "Antes de desativar algo, confira se há usuários, profissionais ou licenças dependentes.",
      common: "Setor criado na unidade errada confunde filtros e permissões.",
      support: "Procure suporte antes de reestruturar unidades ou desativar organização em ambiente real."
    },
    {
      id: "jobs-notificacao",
      title: "Jobs de notificação",
      who: "Admin",
      text: "Criar jobs monta pendências de aviso. Regra com Notificar RT gera um job para o profissional e outro para o RT quando ambos têm telefone.",
      steps: ["Configure template e regra.", "Use Criar jobs para gerar pendências.", "Revise destinos e processe pelo provider configurado."],
      check: "Confirme dias, repetição, RT, template, telefone do RT e ambiente antes de processar.",
      common: "Provider fake não envia mensagem real; falhas de Meta real podem envolver template, credencial ou webhook.",
      support: "Chame suporte para troca de fake para Meta real, falhas repetidas ou dúvidas sobre credenciais."
    },
    {
      id: "importacao-csv",
      title: "Importação CSV",
      who: "Admin",
      text: "Permite carregar profissionais e licenças em massa usando o modelo oficial. Use uma linha por licença.",
      steps: ["Baixe o modelo.", "Preencha no Excel ou Google Sheets e exporte como CSV.", "Valide o arquivo.", "Confirme a importação apenas quando não houver erros."],
      check: "Unidade, setor, RT, tipo de licença, datas e CPF precisam estar corretos antes de confirmar.",
      common: "Erro de cabeçalho ou data geralmente vem de arquivo fora do modelo ou data diferente de YYYY-MM-DD.",
      support: "Procure suporte se a planilha real tiver colunas extras, tipos de licença faltando ou muitos erros de referência."
    },
    {
      id: "glossario",
      title: "Glossário rápido",
      who: "Todos os perfis",
      text: "Alguns termos são internos do sistema e aparecem em filtros, relatórios e auditoria.",
      steps: ["ID é identificador interno.", "RT é responsável técnico.", "Job é uma pendência de processamento.", "Escopo é o conjunto de dados que um usuário pode ver."],
      check: "Não confunda ID interno com CPF, telefone, número de licença ou credencial Meta.",
      common: "Status técnico ajuda em filtros, mas a decisão operacional deve considerar o contexto do registro.",
      support: "Peça suporte quando um termo técnico bloquear uma decisão operacional."
    },
    {
      id: "problemas-comuns",
      title: "Problemas comuns",
      who: "Todos os perfis",
      text: "A maioria dos bloqueios vem de filtro restrito, perfil sem escopo, documento incorreto, link expirado ou notificação em modo de teste.",
      steps: ["Limpe filtros.", "Recarregue a tela.", "Confira perfil e escopo.", "Leia a mensagem de erro antes de tentar novamente."],
      check: "Nunca cole tokens, secrets ou credenciais Meta em chamados, documentos ou campos do sistema.",
      common: "Provider fake não envia mensagem real; ele só simula a operação para validação local.",
      support: "Procure suporte se o erro persistir, se envolver credenciais Meta ou se impactar operação real."
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
        <h2>Como usar a V1 sem treinamento técnico</h2>
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

function AppShell({ user, onLogout }: { user: CurrentUser; onLogout: () => void }) {
  const visibleNav = useMemo(() => navItems.filter((item) => item.roles.includes(user.role)), [user.role]);
  const initialHelpId = window.location.hash.replace("#", "");
  const startsInHelp = helpAnchorIds.has(initialHelpId) && visibleNav.some((item) => item.key === "help");
  const [activeView, setActiveView] = useState<ViewKey>(startsInHelp ? "help" : visibleNav[0]?.key ?? "dashboard");
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
    setActiveView(key);
  }

  async function logout() {
    await api("/v1/auth/logout", { method: "POST" });
    onLogout();
  }

  useEffect(() => {
    function openHelp(event: Event) {
      const hash = (event as CustomEvent<{ hash?: string }>).detail?.hash ?? "#visao-geral";
      openHelpHash(hash);
    }

    window.addEventListener("sylembra:open-help", openHelp);
    return () => window.removeEventListener("sylembra:open-help", openHelp);
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
            <strong>SyLembra</strong>
            <small>Licenças e documentos</small>
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
            <span>{user.name}</span>
            <button className="secondary" onClick={logout}>
              <Icon name="logout" /> Sair
            </button>
          </div>
        </header>
        {activeItem.key === "professionals" ? (
          <ProfessionalsView user={user} />
        ) : activeItem.key === "dashboard" ? (
          <DashboardView onOpen={openView} />
        ) : activeItem.key === "licenses" ? (
          <LicensesView user={user} />
        ) : activeItem.key === "documents" ? (
          <DocumentsView user={user} />
        ) : activeItem.key === "reports" ? (
          <ReportsView />
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
