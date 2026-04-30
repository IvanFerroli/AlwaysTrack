import { StrictMode, useEffect, useMemo, useState, type FormEvent } from "react";
import { createRoot } from "react-dom/client";
import {
  licenseStatuses,
  userRoles,
  type ApiResult,
  type CurrentUser,
  type LicenseStatus,
  type UserRole
} from "@sylembra/shared";
import {
  ConfirmButton,
  OperationalFilters,
  OperationalState,
  OperationalTable,
  PaginationSummary,
  StatusBadge
} from "./components/operational";
import "./styles.css";

type ViewKey = "dashboard" | "professionals" | "licenses" | "documents" | "reports" | "audit" | "settings";

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

interface NavItem {
  key: ViewKey;
  label: string;
  description: string;
  roles: CurrentUser["role"][];
}

const navItems: NavItem[] = [
  { key: "dashboard", label: "Dashboard", description: "Visao operacional do dia", roles: ["ADMIN", "RT", "SUPERVISOR"] },
  { key: "professionals", label: "Profissionais", description: "Cadastro e acompanhamento", roles: ["ADMIN", "RT", "SUPERVISOR"] },
  { key: "licenses", label: "Licencas", description: "Vencimentos e status", roles: ["ADMIN", "RT", "SUPERVISOR"] },
  { key: "documents", label: "Documentos", description: "Uploads e validacoes", roles: ["ADMIN", "RT", "SUPERVISOR"] },
  { key: "reports", label: "Relatorios", description: "Consultas operacionais", roles: ["ADMIN", "RT", "SUPERVISOR"] },
  { key: "audit", label: "Auditoria", description: "Trilha de eventos", roles: ["ADMIN"] },
  { key: "settings", label: "Configuracoes", description: "Usuarios e organizacao", roles: ["ADMIN"] }
];

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(path, {
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
        <div>
          <p className="eyebrow">Sylembra</p>
          <h1>Entrar</h1>
          <p className="muted">Acesso administrativo para operacao de licencas e documentos.</p>
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
      <p className="muted">Modulo reservado no shell. A implementacao funcional entra nas proximas tasks do roadmap.</p>
    </section>
  );
}

function AuditView() {
  const [items, setItems] = useState<AuditLogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [action, setAction] = useState("");
  const [entityType, setEntityType] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError(null);
    const search = new URLSearchParams();
    if (action) search.set("action", action);
    if (entityType) search.set("entityType", entityType);
    try {
      const result = await api<{ items: AuditLogItem[]; total: number }>(`/v1/audit-logs?${search.toString()}`);
      setItems(result.items);
      setTotal(result.total);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Falha ao carregar auditoria.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="content-stack">
      <OperationalFilters
        fields={[
          { key: "action", label: "Acao", value: action, placeholder: "auth.login", onChange: setAction },
          { key: "entityType", label: "Entidade", value: entityType, placeholder: "User", onChange: setEntityType }
        ]}
        onSubmit={load}
      />

      <section className="panel table-panel">
        {error ? (
          <OperationalState state="error" title="Falha ao carregar auditoria" detail={error} />
        ) : loading ? (
          <OperationalState state="loading" title="Carregando eventos" />
        ) : items.length === 0 ? (
          <OperationalState state="empty" title="Nenhum evento encontrado" detail="Ajuste os filtros ou gere novas acoes." />
        ) : (
          <>
            <OperationalTable
              items={items}
              getRowKey={(item) => item.id}
              columns={[
                { key: "date", header: "Data", render: (item) => new Date(item.createdAt).toLocaleString("pt-BR") },
                { key: "action", header: "Acao", render: (item) => item.action },
                { key: "entity", header: "Entidade", render: (item) => `${item.entityType} / ${item.entityId}` },
                {
                  key: "actor",
                  header: "Ator",
                  render: (item) => (item.actor ? `${item.actor.name} (${item.actor.email})` : "Contexto publico")
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

function ProfessionalsView({ user }: { user: CurrentUser }) {
  const [items, setItems] = useState<ProfessionalSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [organization, setOrganization] = useState<OrganizationItem | null>(null);
  const [users, setUsers] = useState<ManagedUserItem[]>([]);
  const [selected, setSelected] = useState<ProfessionalDetail | null>(null);
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
  const [error, setError] = useState<string | null>(null);
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

  async function editProfessional(professional: ProfessionalSummary) {
    const nextName = window.prompt("Nome do profissional", professional.name);
    if (!nextName) return;
    const nextPosition = window.prompt("Cargo/função", professional.position ?? "") ?? professional.position;
    const nextEmail = window.prompt("Email", professional.email ?? "") ?? professional.email;
    const nextPhone = window.prompt("Telefone", professional.phone ?? "") ?? professional.phone;
    await run(async () => {
      await api(`/v1/professionals/${professional.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: nextName,
          position: nextPosition || null,
          email: nextEmail || null,
          phone: nextPhone || null
        })
      });
    });
  }

  const sectors = organization?.units.flatMap((unit) => unit.sectors.map((sector) => ({ ...sector, unitName: unit.name }))) ?? [];
  const selectedUnitSectors = organization?.units.find((unit) => unit.id === unitId)?.sectors ?? [];
  const rtUsers = users.filter((item) => item.role === "RT" && item.active);
  const linkableUsers = users.filter((item) => !items.some((professional) => professional.userId === item.id));

  return (
    <div className="content-stack">
      <OperationalFilters
        fields={[
          { key: "query", label: "Busca", value: query, placeholder: "Nome, CPF, email ou cargo", onChange: setQuery },
          { key: "active", label: "Ativo", value: activeFilter, placeholder: "true ou false", onChange: setActiveFilter },
          { key: "unit", label: "Unidade", value: unitFilter, placeholder: "ID da unidade", onChange: setUnitFilter },
          { key: "sector", label: "Setor", value: sectorFilter, placeholder: "ID do setor", onChange: setSectorFilter },
          { key: "rt", label: "RT", value: rtFilter, placeholder: "ID do RT", onChange: setRtFilter }
        ]}
        onSubmit={load}
      />

      {error ? <OperationalState state="error" title="Falha operacional" detail={error} /> : null}

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
                CPF
                <input value={cpf} onChange={(event) => setCpf(event.target.value)} />
              </label>
              <label>
                Email
                <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" />
              </label>
              <label>
                Telefone
                <input value={phone} onChange={(event) => setPhone(event.target.value)} />
              </label>
              <label>
                Cargo
                <input value={position} onChange={(event) => setPosition(event.target.value)} />
              </label>
              <label>
                Unidade
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
                Setor
                <select value={sectorId} onChange={(event) => setSectorId(event.target.value)}>
                  {selectedUnitSectors.map((sector) => (
                    <option key={sector.id} value={sector.id}>
                      {sector.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                RT responsavel
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
                Usuario vinculado
                <select value={linkedUserId} onChange={(event) => setLinkedUserId(event.target.value)}>
                  <option value="">Sem usuario</option>
                  {linkableUsers.map((linkedUser) => (
                    <option key={linkedUser.id} value={linkedUser.id}>
                      {linkedUser.name} ({linkedUser.role})
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Observacoes
                <input value={notes} onChange={(event) => setNotes(event.target.value)} />
              </label>
            </div>
            <button disabled={saving || !name.trim() || !unitId || !sectorId}>Criar profissional</button>
          </form>
        </section>
      ) : null}

      <section className="panel table-panel">
        {loading ? (
          <OperationalState state="loading" title="Carregando profissionais" />
        ) : items.length === 0 ? (
          <OperationalState state="empty" title="Nenhum profissional encontrado" />
        ) : (
          <>
            <OperationalTable
              items={items}
              getRowKey={(item) => item.id}
              columns={[
                { key: "name", header: "Profissional", render: (item) => `${item.name}${item.cpf ? ` / ${item.cpf}` : ""}` },
                { key: "unit", header: "Unidade", render: (item) => item.unit.name },
                { key: "sector", header: "Setor", render: (item) => item.sector.name },
                { key: "rt", header: "RT", render: (item) => item.responsibleRt?.name ?? "Sem RT" },
                {
                  key: "counts",
                  header: "Historico",
                  render: (item) =>
                    `${item._count.licenses} licencas / ${item._count.documents} docs / ${item._count.notificationJobs} avisos`
                },
                {
                  key: "status",
                  header: "Status",
                  render: (item) => <StatusBadge kind="active" value={item.active ? "ACTIVE" : "INACTIVE"} />
                },
                {
                  key: "actions",
                  header: "Acoes",
                  render: (item) => (
                    <div className="row-actions">
                      <button className="secondary" type="button" onClick={() => void showDetail(item)}>
                        Detalhe
                      </button>
                      {user.role === "ADMIN" ? (
                        <>
                          <button className="secondary" type="button" onClick={() => void editProfessional(item)}>
                            Editar
                          </button>
                          <ConfirmButton
                            disabled={saving}
                            confirmLabel={item.active ? "Confirmar desativacao" : "Confirmar reativacao"}
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
                  )
                }
              ]}
            />
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
              <strong>Licencas</strong>
              {selected.licenses.length === 0 ? (
                <p className="muted">Sem licencas.</p>
              ) : (
                selected.licenses.map((license) => (
                  <p key={license.id}>
                    {license.licenseType.name} / {license.number ?? "sem numero"} / {license.status}
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
              <strong>Notificacoes</strong>
              {selected.notificationJobs.length === 0 ? (
                <p className="muted">Sem notificacoes.</p>
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
      setError(caught instanceof Error ? caught.message : "Falha ao carregar licencas.");
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
      setError(caught instanceof Error ? caught.message : "Falha ao salvar licenca.");
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

  async function editType(licenseType: LicenseTypeItem) {
    const name = window.prompt("Nome do tipo de licenca", licenseType.name);
    if (!name) return;
    const description = window.prompt("Descricao", licenseType.description ?? "") ?? licenseType.description;
    const defaultWarningDays =
      window.prompt("Dias de aviso padrao, separados por virgula", licenseType.defaultWarningDays ?? "") ??
      licenseType.defaultWarningDays;
    await run(async () => {
      await api(`/v1/license-types/${licenseType.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name,
          description: description || null,
          defaultWarningDays: defaultWarningDays || null
        })
      });
    });
  }

  async function editLicense(license: LicenseItem) {
    const nextNumber = window.prompt("Numero da licenca", license.number ?? "") ?? license.number;
    const nextIssuer = window.prompt("Emissor", license.issuer ?? "") ?? license.issuer;
    const nextUf = window.prompt("UF", license.uf ?? "") ?? license.uf;
    const nextExpiresAt = window.prompt("Vencimento (AAAA-MM-DD)", toDateInput(license.expiresAt));
    if (nextExpiresAt === null) return;
    const nextStatus = window.prompt(`Status: ${licenseStatuses.join(", ")}`, license.status);
    if (!nextStatus || !licenseStatuses.includes(nextStatus as LicenseStatus)) {
      setError("Status invalido.");
      return;
    }
    await run(async () => {
      await api(`/v1/licenses/${license.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          number: nextNumber || null,
          issuer: nextIssuer || null,
          uf: nextUf || null,
          expiresAt: nextExpiresAt || null,
          status: nextStatus
        })
      });
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

  const activeLicenseTypes = licenseTypes.filter((item) => item.active);
  const activeProfessionals = professionals.filter((item) => item.active);

  return (
    <div className="content-stack">
      <OperationalFilters
        fields={[
          { key: "query", label: "Busca", value: query, placeholder: "Profissional, CPF, tipo ou numero", onChange: setQuery },
          { key: "status", label: "Status", value: statusFilter, placeholder: "REGULAR, EXPIRED...", onChange: setStatusFilter },
          {
            key: "professional",
            label: "Profissional",
            value: professionalFilter,
            placeholder: "ID do profissional",
            onChange: setProfessionalFilter
          },
          { key: "type", label: "Tipo", value: licenseTypeFilter, placeholder: "ID do tipo", onChange: setLicenseTypeFilter }
        ]}
        onSubmit={load}
      />

      {error ? <OperationalState state="error" title="Falha operacional" detail={error} /> : null}

      {user.role === "ADMIN" ? (
        <section className="panel action-panel">
          <button className="secondary" disabled={saving} type="button" onClick={() => void recalculateStatuses()}>
            Recalcular status
          </button>
        </section>
      ) : null}

      {user.role === "ADMIN" ? (
        <div className="settings-grid">
          <section className="panel form-panel">
            <form onSubmit={createType}>
              <h2>Novo tipo de licenca</h2>
              <label>
                Nome
                <input value={typeName} onChange={(event) => setTypeName(event.target.value)} />
              </label>
              <label>
                Descricao
                <input value={typeDescription} onChange={(event) => setTypeDescription(event.target.value)} />
              </label>
              <label>
                Avisos padrao
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
              <h2>Nova licenca</h2>
              <div className="form-grid">
                <label>
                  Profissional
                  <select value={professionalId} onChange={(event) => setProfessionalId(event.target.value)}>
                    {activeProfessionals.map((professional) => (
                      <option key={professional.id} value={professional.id}>
                        {professional.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Tipo
                  <select value={licenseTypeId} onChange={(event) => setLicenseTypeId(event.target.value)}>
                    {activeLicenseTypes.map((licenseType) => (
                      <option key={licenseType.id} value={licenseType.id}>
                        {licenseType.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Numero
                  <input value={number} onChange={(event) => setNumber(event.target.value)} />
                </label>
                <label>
                  Emissor
                  <input value={issuer} onChange={(event) => setIssuer(event.target.value)} />
                </label>
                <label>
                  UF
                  <input value={uf} onChange={(event) => setUf(event.target.value)} maxLength={2} />
                </label>
                <label>
                  Emissao
                  <input value={issuedAt} onChange={(event) => setIssuedAt(event.target.value)} type="date" />
                </label>
                <label>
                  Vencimento
                  <input value={expiresAt} onChange={(event) => setExpiresAt(event.target.value)} type="date" />
                </label>
                <label>
                  Status
                  <select value={status} onChange={(event) => setStatus(event.target.value as LicenseStatus)}>
                    {licenseStatuses.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Observacoes
                  <input value={notes} onChange={(event) => setNotes(event.target.value)} />
                </label>
              </div>
              <button disabled={saving || !professionalId || !licenseTypeId}>Criar licenca</button>
            </form>
          </section>
        </div>
      ) : null}

      <section className="panel table-panel">
        {loading ? (
          <OperationalState state="loading" title="Carregando licencas" />
        ) : licenses.length === 0 ? (
          <OperationalState state="empty" title="Nenhuma licenca encontrada" />
        ) : (
          <>
            <OperationalTable
              items={licenses}
              getRowKey={(item) => item.id}
              columns={[
                { key: "professional", header: "Profissional", render: (item) => item.professional.name },
                { key: "type", header: "Tipo", render: (item) => item.licenseType.name },
                { key: "number", header: "Numero", render: (item) => item.number ?? "Sem numero" },
                { key: "issuer", header: "Emissor/UF", render: (item) => `${item.issuer ?? "Sem emissor"} / ${item.uf ?? "--"}` },
                {
                  key: "expires",
                  header: "Vencimento",
                  render: (item) => (item.expiresAt ? new Date(item.expiresAt).toLocaleDateString("pt-BR") : "Sem data")
                },
                { key: "status", header: "Status", render: (item) => <StatusBadge kind="license" value={item.status} /> },
                {
                  key: "history",
                  header: "Historico",
                  render: (item) => `${item._count.documents} docs / ${item._count.notificationJobs} avisos`
                },
                {
                  key: "actions",
                  header: "Acoes",
                  render: (item) =>
                    user.role === "ADMIN" ? (
                      <div className="row-actions">
                        <button className="secondary" type="button" onClick={() => void editLicense(item)}>
                          Editar
                        </button>
                        <button className="secondary" type="button" onClick={() => void generateUploadLink(item)}>
                          Gerar link
                        </button>
                        <ConfirmButton
                          disabled={saving}
                          confirmLabel="Confirmar inativacao"
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
                    )
                }
              ]}
            />
            <PaginationSummary page={1} pageSize={25} total={total} />
          </>
        )}
      </section>

      <section className="panel table-panel">
        {licenseTypes.length === 0 ? (
          <OperationalState state="empty" title="Nenhum tipo de licenca cadastrado" />
        ) : (
          <OperationalTable
            items={licenseTypes}
            getRowKey={(item) => item.id}
            columns={[
              { key: "name", header: "Tipo", render: (item) => item.name },
              { key: "warning", header: "Avisos", render: (item) => item.defaultWarningDays ?? "Sem padrao" },
              {
                key: "status",
                header: "Status",
                render: (item) => <StatusBadge kind="active" value={item.active ? "ACTIVE" : "INACTIVE"} />
              },
              {
                key: "actions",
                header: "Acoes",
                render: (item) =>
                  user.role === "ADMIN" ? (
                    <div className="row-actions">
                      <button className="secondary" type="button" onClick={() => void editType(item)}>
                        Editar
                      </button>
                      <ConfirmButton
                        disabled={saving}
                        confirmLabel={item.active ? "Confirmar desativacao" : "Confirmar reativacao"}
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

  return (
    <div className="content-stack">
      <OperationalFilters
        fields={[
          { key: "status", label: "Status", value: statusFilter, placeholder: "UPLOADED, APPROVED...", onChange: setStatusFilter },
          {
            key: "professional",
            label: "Profissional",
            value: professionalFilter,
            placeholder: "ID do profissional",
            onChange: setProfessionalFilter
          },
          { key: "license", label: "Licenca", value: licenseFilter, placeholder: "ID da licenca", onChange: setLicenseFilter }
        ]}
        onSubmit={load}
      />

      {error ? <OperationalState state="error" title="Falha operacional" detail={error} /> : null}

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
                  header: "Licenca",
                  render: (item) => `${item.license.licenseType.name}${item.license.number ? ` / ${item.license.number}` : ""}`
                },
                { key: "unit", header: "Unidade/Setor", render: (item) => `${item.professional.unit.name} / ${item.professional.sector.name}` },
                { key: "status", header: "Status", render: (item) => <StatusBadge kind="document" value={item.status} /> },
                {
                  key: "validated",
                  header: "Validacao",
                  render: (item) =>
                    item.validatedBy
                      ? `${item.validatedBy.name} / ${item.validatedAt ? new Date(item.validatedAt).toLocaleString("pt-BR") : ""}`
                      : item.rejectionReason ?? "Pendente"
                },
                {
                  key: "actions",
                  header: "Acoes",
                  render: (item) => (
                    <div className="row-actions">
                      <button className="secondary" type="button" onClick={() => download(item)}>
                        Baixar
                      </button>
                      {(user.role === "ADMIN" || user.role === "RT") && item.status === "UPLOADED" ? (
                        <>
                          <button disabled={saving} type="button" onClick={() => void approve(item)}>
                            Aprovar
                          </button>
                          <button className="danger" disabled={saving} type="button" onClick={() => void reject(item)}>
                            Recusar
                          </button>
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
  const [userPassword, setUserPassword] = useState("");
  const [userRole, setUserRole] = useState<UserRole>("SUPERVISOR");
  const [userUnitScopeIds, setUserUnitScopeIds] = useState<string[]>([]);
  const [userSectorScopeIds, setUserSectorScopeIds] = useState<string[]>([]);
  const [templateKey, setTemplateKey] = useState("");
  const [templateMetaName, setTemplateMetaName] = useState("");
  const [templatePreview, setTemplatePreview] = useState("");
  const [ruleTemplateKey, setRuleTemplateKey] = useState("");
  const [ruleLicenseTypeId, setRuleLicenseTypeId] = useState("");
  const [ruleDaysBefore, setRuleDaysBefore] = useState("30");
  const [ruleRepeatAfter, setRuleRepeatAfter] = useState("");
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
      setError(caught instanceof Error ? caught.message : "Falha ao carregar configuracoes.");
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
      setError(caught instanceof Error ? caught.message : "Falha ao salvar configuracao.");
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
          password: userPassword,
          role: userRole,
          unitScopeIds: userRole === "ADMIN" ? [] : userUnitScopeIds,
          sectorScopeIds: userRole === "ADMIN" ? [] : userSectorScopeIds
        })
      });
      setUserName("");
      setUserEmail("");
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
          notifyProfessional: true,
          notifyRt: ruleNotifyRt
        })
      });
      setRuleDaysBefore("30");
      setRuleRepeatAfter("");
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

  async function renameUnit(unit: UnitItem) {
    const name = window.prompt("Nome da unidade", unit.name);
    if (!name) return;
    await run(async () => {
      await api(`/v1/organization/units/${unit.id}`, {
        method: "PATCH",
        body: JSON.stringify({ name })
      });
    });
  }

  async function renameSector(sector: SectorItem) {
    const name = window.prompt("Nome do setor", sector.name);
    if (!name) return;
    await run(async () => {
      await api(`/v1/organization/sectors/${sector.id}`, {
        method: "PATCH",
        body: JSON.stringify({ name })
      });
    });
  }

  async function editUser(user: ManagedUserItem) {
    const name = window.prompt("Nome do usuario", user.name);
    if (!name) return;
    const email = window.prompt("Email do usuario", user.email);
    if (!email) return;
    const roleInput = window.prompt("Role do usuario: ADMIN, RT ou SUPERVISOR", user.role);
    if (!roleInput) return;
    const role = roleInput.toUpperCase() as UserRole;
    if (!userRoles.includes(role)) {
      setError("Role invalida.");
      return;
    }
    const unitScopeIds =
      role === "ADMIN"
        ? []
        : (window.prompt("IDs de unidades separados por virgula", user.unitScopeIds.join(",")) ?? "")
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);
    const sectorScopeIds =
      role === "ADMIN"
        ? []
        : (window.prompt("IDs de setores separados por virgula", user.sectorScopeIds.join(",")) ?? "")
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);
    await run(async () => {
      await api(`/v1/users/${user.id}`, {
        method: "PATCH",
        body: JSON.stringify({ name, email, role, unitScopeIds, sectorScopeIds })
      });
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

  if (loading) {
    return <OperationalState state="loading" title="Carregando configuracoes" />;
  }

  if (error && !organization) {
    return <OperationalState state="error" title="Falha ao carregar configuracoes" detail={error} />;
  }

  if (!organization) {
    return <OperationalState state="empty" title="Organizacao nao encontrada" />;
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
          <h2>Organizacao</h2>
          <label>
            Nome
            <input value={orgName} onChange={(event) => setOrgName(event.target.value)} />
          </label>
          <label>
            Documento
            <input value={orgDocument} onChange={(event) => setOrgDocument(event.target.value)} />
          </label>
          <div className="form-actions">
            <StatusBadge kind="active" value={organization.active ? "ACTIVE" : "INACTIVE"} />
            <button disabled={saving || !orgName.trim()}>Salvar</button>
            <ConfirmButton
              disabled={saving}
              confirmLabel={organization.active ? "Confirmar desativacao" : "Confirmar reativacao"}
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
            Nome
            <input value={unitName} onChange={(event) => setUnitName(event.target.value)} />
          </label>
          <button disabled={saving || !unitName.trim()}>Criar unidade</button>
        </form>
      </section>

      <section className="panel form-panel">
        <form onSubmit={addSector}>
          <h2>Novo setor</h2>
          <label>
            Unidade
            <select value={sectorUnitId} onChange={(event) => setSectorUnitId(event.target.value)}>
              {organization.units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Nome
            <input value={sectorName} onChange={(event) => setSectorName(event.target.value)} />
          </label>
          <button disabled={saving || !sectorName.trim() || !sectorUnitId}>Criar setor</button>
        </form>
      </section>

      <section className="panel form-panel full-span">
        <form onSubmit={addUser}>
          <h2>Novo usuario administrativo</h2>
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
              Senha inicial
              <input
                value={userPassword}
                onChange={(event) => setUserPassword(event.target.value)}
                type="password"
                minLength={8}
              />
            </label>
            <label>
              Role
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
                <legend>Unidades</legend>
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
                <legend>Setores</legend>
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
            {saving ? "Salvando..." : "Criar usuario"}
          </button>
        </form>
      </section>

      <section className="panel table-panel full-span">
        {users.length === 0 ? (
          <OperationalState state="empty" title="Nenhum usuario cadastrado" />
        ) : (
          <OperationalTable
            items={users}
            getRowKey={(item) => item.id}
            columns={[
              { key: "name", header: "Usuario", render: (item) => `${item.name} (${item.email})` },
              { key: "role", header: "Role", render: (item) => item.role },
              {
                key: "scope",
                header: "Escopo",
                render: (item) =>
                  item.role === "ADMIN"
                    ? "Todas as unidades"
                    : `${item.unitScopeIds.length} unidades / ${item.sectorScopeIds.length} setores`
              },
              {
                key: "status",
                header: "Status",
                render: (item) => <StatusBadge kind="active" value={item.active ? "ACTIVE" : "INACTIVE"} />
              },
              {
                key: "actions",
                header: "Acoes",
                render: (item) => (
                  <div className="row-actions">
                    <button className="secondary" type="button" onClick={() => void editUser(item)}>
                      Editar
                    </button>
                    <button className="secondary" type="button" onClick={() => void resetPassword(item)}>
                      Resetar senha
                    </button>
                    <ConfirmButton
                      disabled={saving}
                      confirmLabel={item.active ? "Confirmar desativacao" : "Confirmar reativacao"}
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
                )
              }
            ]}
          />
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
              Template Meta
              <input value={templateMetaName} onChange={(event) => setTemplateMetaName(event.target.value)} />
            </label>
            <label>
              Preview
              <input value={templatePreview} onChange={(event) => setTemplatePreview(event.target.value)} />
            </label>
          </div>
          <button disabled={saving || !templateKey.trim()}>Criar template</button>
        </form>
      </section>

      <section className="panel form-panel full-span">
        <form onSubmit={addNotificationRule}>
          <h2>Nova regra de notificacao</h2>
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
              Tipo de licenca
              <input value={ruleLicenseTypeId} onChange={(event) => setRuleLicenseTypeId(event.target.value)} placeholder="vazio = todos" />
            </label>
            <label>
              Dias antes
              <input value={ruleDaysBefore} onChange={(event) => setRuleDaysBefore(event.target.value)} type="number" />
            </label>
            <label>
              Repetir apos vencida
              <input value={ruleRepeatAfter} onChange={(event) => setRuleRepeatAfter(event.target.value)} type="number" />
            </label>
            <label className="checkbox-row">
              <input checked={ruleNotifyRt} onChange={() => setRuleNotifyRt((current) => !current)} type="checkbox" />
              Notificar RT
            </label>
          </div>
          <button disabled={saving || !ruleTemplateKey}>Criar regra</button>
        </form>
      </section>

      <section className="panel table-panel full-span">
        <div className="action-panel">
          <button className="secondary" disabled={saving} type="button" onClick={() => void scanNotifications()}>
            Criar jobs
          </button>
          <button disabled={saving} type="button" onClick={() => void processNotifications()}>
            Processar jobs
          </button>
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
          <OperationalState state="empty" title="Nenhuma regra de notificacao" />
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
          <OperationalState state="empty" title="Nenhum job de notificacao" />
        ) : (
          <OperationalTable
            items={notificationJobs}
            getRowKey={(item) => item.id}
            columns={[
              { key: "date", header: "Agendado", render: (item) => new Date(item.scheduledFor).toLocaleString("pt-BR") },
              { key: "professional", header: "Profissional", render: (item) => item.professional.name },
              { key: "license", header: "Licenca", render: (item) => item.license.licenseType.name },
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
                header: "Acoes",
                render: (item) => (
                  <ConfirmButton
                    disabled={saving}
                    confirmLabel={item.active ? "Confirmar desativacao" : "Confirmar reativacao"}
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
          <OperationalTable
            items={organization.units}
            getRowKey={(unit) => unit.id}
            columns={[
              { key: "name", header: "Unidade", render: (unit) => unit.name },
              {
                key: "status",
                header: "Status",
                render: (unit) => <StatusBadge kind="active" value={unit.active ? "ACTIVE" : "INACTIVE"} />
              },
              { key: "sectors", header: "Setores", render: (unit) => unit.sectors.length },
              {
                key: "actions",
                header: "Acoes",
                render: (unit) => (
                  <div className="row-actions">
                    <button className="secondary" type="button" onClick={() => void renameUnit(unit)}>
                      Editar
                    </button>
                    <ConfirmButton
                      disabled={saving}
                      confirmLabel={unit.active ? "Confirmar desativacao" : "Confirmar reativacao"}
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
                )
              }
            ]}
          />
        )}
      </section>

      <section className="panel table-panel full-span">
        {sectors.length === 0 ? (
          <OperationalState state="empty" title="Nenhum setor cadastrado" />
        ) : (
          <OperationalTable
            items={sectors}
            getRowKey={(sector) => sector.id}
            columns={[
              { key: "name", header: "Setor", render: (sector) => sector.name },
              { key: "unit", header: "Unidade", render: (sector) => sector.unitName },
              {
                key: "status",
                header: "Status",
                render: (sector) => <StatusBadge kind="active" value={sector.active ? "ACTIVE" : "INACTIVE"} />
              },
              {
                key: "actions",
                header: "Acoes",
                render: (sector) => (
                  <div className="row-actions">
                    <button className="secondary" type="button" onClick={() => void renameSector(sector)}>
                      Editar
                    </button>
                    <ConfirmButton
                      disabled={saving}
                      confirmLabel={sector.active ? "Confirmar desativacao" : "Confirmar reativacao"}
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
                )
              }
            ]}
          />
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
    fetch(`/v1/public-upload/${token}`)
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
      const response = await fetch(`/v1/public-upload/${token}?fileName=${encodeURIComponent(file.name)}`, {
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
          <p className="eyebrow">Sylembra</p>
          <h1>Enviar documento</h1>
        </div>
        {loading ? <OperationalState state="loading" title="Carregando link" /> : null}
        {error ? <OperationalState state="error" title="Nao foi possivel continuar" detail={error} /> : null}
        {uploadToken && !success ? (
          <form onSubmit={submit}>
            <div className="public-upload-summary">
              <strong>{uploadToken.professional.name}</strong>
              <span>
                {uploadToken.license.licenseType.name}
                {uploadToken.license.number ? ` / ${uploadToken.license.number}` : ""}
              </span>
              <span>Expira em {new Date(uploadToken.expiresAt).toLocaleString("pt-BR")}</span>
            </div>
            <label>
              Arquivo
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
  const [organizationName, setOrganizationName] = useState("Sylembra");
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
      const response = await fetch(`/v1/public-faq?${search.toString()}`);
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
      const response = await fetch("/v1/public-help/wa-link", {
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
            { key: "category", label: "Categoria", value: category, placeholder: "Envio", onChange: setCategory }
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

function AppShell({ user, onLogout }: { user: CurrentUser; onLogout: () => void }) {
  const visibleNav = useMemo(() => navItems.filter((item) => item.roles.includes(user.role)), [user.role]);
  const [activeView, setActiveView] = useState<ViewKey>(visibleNav[0]?.key ?? "dashboard");
  const activeItem = visibleNav.find((item) => item.key === activeView) ?? visibleNav[0];

  async function logout() {
    await api("/v1/auth/logout", { method: "POST" });
    onLogout();
  }

  return (
    <main className="app-frame">
      <aside className="sidebar">
        <div className="brand">
          <p className="eyebrow">Sylembra</p>
          <strong>Operacao</strong>
        </div>
        <nav className="nav-list" aria-label="Navegacao principal">
          {visibleNav.map((item) => (
            <button
              className={item.key === activeItem.key ? "nav-item active" : "nav-item"}
              key={item.key}
              onClick={() => setActiveView(item.key)}
            >
              <span>{item.label}</span>
              <small>{item.description}</small>
            </button>
          ))}
        </nav>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">{user.role}</p>
            <h1>{activeItem.label}</h1>
          </div>
          <div className="user-actions">
            <span>{user.name}</span>
            <button className="secondary" onClick={logout}>
              Sair
            </button>
          </div>
        </header>
        {activeItem.key === "professionals" ? (
          <ProfessionalsView user={user} />
        ) : activeItem.key === "licenses" ? (
          <LicensesView user={user} />
        ) : activeItem.key === "documents" ? (
          <DocumentsView user={user} />
        ) : activeItem.key === "audit" ? (
          <AuditView />
        ) : activeItem.key === "settings" ? (
          <SettingsView />
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
