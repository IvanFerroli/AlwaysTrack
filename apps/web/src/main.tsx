import { StrictMode, useEffect, useMemo, useState, type FormEvent } from "react";
import { createRoot } from "react-dom/client";
import type { ApiResult, CurrentUser } from "@sylembra/shared";
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

function SettingsView() {
  const [organization, setOrganization] = useState<OrganizationItem | null>(null);
  const [orgName, setOrgName] = useState("");
  const [orgDocument, setOrgDocument] = useState("");
  const [unitName, setUnitName] = useState("");
  const [sectorName, setSectorName] = useState("");
  const [sectorUnitId, setSectorUnitId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const result = await api<{ organization: OrganizationItem }>("/v1/organization");
      setOrganization(result.organization);
      setOrgName(result.organization.name);
      setOrgDocument(result.organization.document ?? "");
      setSectorUnitId(result.organization.units[0]?.id ?? "");
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
        {activeItem.key === "audit" ? (
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
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    api<{ user: CurrentUser }>("/v1/auth/me")
      .then((result) => setUser(result.user))
      .catch(() => setUser(null))
      .finally(() => setReady(true));
  }, []);

  if (!ready) {
    return <main className="auth-page">Carregando...</main>;
  }

  return user ? <AppShell user={user} onLogout={() => setUser(null)} /> : <LoginForm onLogin={setUser} />;
}

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
