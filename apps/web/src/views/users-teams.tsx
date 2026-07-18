import { useEffect, useMemo, useState, type FormEvent } from "react";
import { userRoles, type UserRole } from "@alwaystrack/shared";
import { api } from "../api";
import { ConfirmButton, InfoTip, OperationalFilters, OperationalState, OperationalTable, StatusBadge } from "../components/operational";

interface SupportTeamOption {
  id: string;
  name: string;
  active: boolean;
}

interface SupportTeamMembershipItem {
  id: string;
  teamId: string;
  validFrom: string;
  validTo: string | null;
  team: SupportTeamOption;
}

interface ManagedUserItem {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone: string | null;
  active: boolean;
  supportTeamMemberships?: SupportTeamMembershipItem[];
  createdAt: string;
  updatedAt: string;
}

const operationalCreateRoles = ["SAC", "GESTOR", "ADMIN"] as const;

function roleLabel(role: string) {
  if (["VENDEDOR", "SUPERVISOR", "FINANCEIRO"].includes(role)) return `${role} (legado)`;
  return role;
}

function currentMembership(user: ManagedUserItem, now = Date.now()) {
  return user.supportTeamMemberships?.find((membership) => {
    const starts = new Date(membership.validFrom).getTime();
    const ends = membership.validTo ? new Date(membership.validTo).getTime() : Number.POSITIVE_INFINITY;
    return starts <= now && ends > now;
  }) ?? null;
}

function formatMembershipDate(value: string | null) {
  if (!value) return "atual";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeZone: "America/Sao_Paulo" }).format(new Date(value));
}

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
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

export function UsersTeamsView() {
  const [users, setUsers] = useState<ManagedUserItem[]>([]);
  const [supportTeams, setSupportTeams] = useState<SupportTeamOption[]>([]);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [teamFilter, setTeamFilter] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("SAC");
  const [supportTeamId, setSupportTeamId] = useState("");
  const [editingUserId, setEditingUserId] = useState("");
  const [editingName, setEditingName] = useState("");
  const [editingEmail, setEditingEmail] = useState("");
  const [editingPhone, setEditingPhone] = useState("");
  const [editingRole, setEditingRole] = useState<UserRole>("SAC");
  const [editingSupportTeamId, setEditingSupportTeamId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeTeams = useMemo(() => supportTeams.filter((team) => team.active), [supportTeams]);
  const editingUser = users.find((user) => user.id === editingUserId) ?? null;

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [usersResult, optionsResult] = await Promise.all([
        api<{ users: ManagedUserItem[] }>("/v1/users"),
        api<{ supportTeams: SupportTeamOption[] }>("/v1/users/operational-options")
      ]);
      setUsers(usersResult.users);
      setSupportTeams(optionsResult.supportTeams);
      setSupportTeamId((current) => current || optionsResult.supportTeams.find((team) => team.active)?.id || "");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Falha ao carregar usuários.");
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
      setError(caught instanceof Error ? caught.message : "Falha ao salvar usuário.");
    } finally {
      setSaving(false);
    }
  }

  async function createUser(event: FormEvent) {
    event.preventDefault();
    await run(async () => {
      await api("/v1/users", {
        method: "POST",
        body: JSON.stringify({ name, email, phone: phone || null, password, role, supportTeamId: role === "SAC" ? supportTeamId : null })
      });
      setName("");
      setEmail("");
      setPhone("");
      setPassword("");
      setRole("SAC");
    });
  }

  function startEdit(user: ManagedUserItem) {
    setEditingUserId(user.id);
    setEditingName(user.name);
    setEditingEmail(user.email);
    setEditingPhone(formatPhoneInput(user.phone ?? ""));
    setEditingRole(user.role);
    setEditingSupportTeamId(currentMembership(user)?.teamId ?? activeTeams[0]?.id ?? "");
  }

  function cancelEdit() {
    setEditingUserId("");
    setEditingName("");
    setEditingEmail("");
    setEditingPhone("");
    setEditingRole("SAC");
    setEditingSupportTeamId("");
  }

  async function saveEdit(event: FormEvent) {
    event.preventDefault();
    await run(async () => {
      await api(`/v1/users/${editingUserId}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: editingName,
          email: editingEmail,
          phone: editingPhone || null,
          role: editingRole,
          supportTeamId: editingRole === "SAC" ? editingSupportTeamId : null
        })
      });
      cancelEdit();
    });
  }

  async function resetPassword(user: ManagedUserItem) {
    const nextPassword = window.prompt(`Nova senha para ${user.email}`);
    if (!nextPassword) return;
    await run(async () => {
      await api(`/v1/users/${user.id}/reset-password`, { method: "POST", body: JSON.stringify({ password: nextPassword }) });
    });
  }

  const filteredUsers = users.filter((user) => {
    const membership = currentMembership(user);
    const haystack = `${user.name} ${user.email} ${membership?.team.name ?? ""}`.toLowerCase();
    return (!query.trim() || haystack.includes(query.trim().toLowerCase()))
      && (!roleFilter || user.role === roleFilter)
      && (!statusFilter || (statusFilter === "ACTIVE" ? user.active : !user.active))
      && (!teamFilter || membership?.teamId === teamFilter);
  });

  if (loading) return <OperationalState state="loading" title="Carregando usuários e times" />;

  const editRoleOptions = operationalCreateRoles.includes(editingRole as (typeof operationalCreateRoles)[number])
    ? [...operationalCreateRoles]
    : [editingRole, ...operationalCreateRoles];

  return (
    <div className="content-stack">
      {error ? <OperationalState state="error" title="Falha em usuários" detail={error} /> : null}
      <OperationalFilters
        fields={[
          { key: "query", label: "Busca", value: query, placeholder: "Nome, email ou time", help: "Busca usuários e vínculos SAC.", helpHref: "#usuarios-times", onChange: setQuery },
          {
            key: "role", label: "Função", value: roleFilter, type: "select", placeholder: "Todas",
            options: userRoles.map((item) => ({ value: item, label: roleLabel(item) })),
            help: "A função controla as telas e ações disponíveis.", helpHref: "#perfis-e-permissoes", onChange: setRoleFilter
          },
          {
            key: "status", label: "Status", value: statusFilter, type: "select", placeholder: "Todos",
            options: [{ value: "ACTIVE", label: "Ativos" }, { value: "INACTIVE", label: "Inativos" }], onChange: setStatusFilter
          },
          {
            key: "team", label: "Time SAC", value: teamFilter, type: "select", placeholder: "Todos",
            options: supportTeams.map((team) => ({ value: team.id, label: `${team.name}${team.active ? "" : " (inativo)"}` })),
            help: "Filtra pela lotação vigente, preservando o histórico anterior.", helpHref: "#usuarios-times", onChange: setTeamFilter
          }
        ]}
        onSubmit={() => undefined}
      />

      <section className="panel form-panel">
        <form onSubmit={createUser}>
          <div className="table-panel-toolbar">
            <div><p className="eyebrow">Admin</p><h2>Criar usuário operacional</h2></div>
          </div>
          <div className="form-grid">
            <label>Nome<input value={name} onChange={(event) => setName(event.target.value)} required /></label>
            <label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
            <label>Telefone<input inputMode="tel" value={phone} onChange={(event) => setPhone(formatPhoneInput(event.target.value))} /></label>
            <label>Senha inicial<input minLength={8} type="password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
            <label>
              <span className="label-row">Função <InfoTip text="Novos acessos são criados para SAC, Gestor ou Admin. Perfis comerciais permanecem apenas como histórico." href="#usuarios-times" /></span>
              <select value={role} onChange={(event) => setRole(event.target.value as UserRole)}>
                {operationalCreateRoles.map((item) => <option key={item} value={item}>{roleLabel(item)}</option>)}
              </select>
            </label>
            {role === "SAC" ? (
              <label>Time SAC<select required value={supportTeamId} onChange={(event) => setSupportTeamId(event.target.value)}>
                <option value="">Selecione</option>
                {activeTeams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
              </select></label>
            ) : null}
          </div>
          <div className="form-actions">
            <button disabled={saving || !name.trim() || !email.trim() || password.length < 8 || (role === "SAC" && !supportTeamId)}>Criar usuário</button>
          </div>
        </form>
      </section>

      <section className="panel table-panel">
        <div className="table-panel-toolbar">
          <div><p className="eyebrow">Usuários/Times</p><h2>Operação e acessos legados</h2></div>
          <span className="status-badge">{filteredUsers.length} usuário(s)</span>
        </div>
        {filteredUsers.length === 0 ? (
          <OperationalState state="empty" title="Nenhum usuário encontrado" detail="Crie um acesso operacional ou ajuste os filtros." />
        ) : (
          <OperationalTable
            items={filteredUsers}
            getRowKey={(item) => item.id}
            columns={[
              { key: "user", header: "Usuário", render: (item) => `${item.name} (${item.email})` },
              { key: "role", header: "Função", render: (item) => roleLabel(item.role) },
              { key: "team", header: "Time SAC atual", render: (item) => currentMembership(item)?.team.name ?? "-" },
              { key: "phone", header: "Telefone", render: (item) => item.phone ?? "-" },
              { key: "status", header: "Status", render: (item) => <StatusBadge kind="active" value={item.active ? "ACTIVE" : "INACTIVE"} /> },
              {
                key: "actions", header: "Ações", render: (item) => (
                  <div className="row-actions">
                    <button className="secondary small" type="button" onClick={() => startEdit(item)}>Editar</button>
                    <button className="secondary small" type="button" onClick={() => void resetPassword(item)}>Resetar senha</button>
                    <ConfirmButton
                      disabled={saving}
                      confirmLabel={item.active ? "Confirmar desativação" : "Confirmar reativação"}
                      onConfirm={() => void run(async () => {
                        await api(`/v1/users/${item.id}`, { method: "PATCH", body: JSON.stringify({ active: !item.active }) });
                      })}
                    >{item.active ? "Desativar" : "Reativar"}</ConfirmButton>
                  </div>
                )
              }
            ]}
          />
        )}
      </section>

      {editingUserId ? (
        <section className="panel form-panel">
          <form onSubmit={saveEdit}>
            <div className="table-panel-toolbar">
              <div><p className="eyebrow">Edição</p><h2>Editar usuário</h2></div>
              <button className="secondary" disabled={saving} type="button" onClick={cancelEdit}>Cancelar</button>
            </div>
            <div className="form-grid">
              <label>Nome<input value={editingName} onChange={(event) => setEditingName(event.target.value)} required /></label>
              <label>Email<input type="email" value={editingEmail} onChange={(event) => setEditingEmail(event.target.value)} required /></label>
              <label>Telefone<input inputMode="tel" value={editingPhone} onChange={(event) => setEditingPhone(formatPhoneInput(event.target.value))} /></label>
              <label>Função<select value={editingRole} onChange={(event) => setEditingRole(event.target.value as UserRole)}>
                {editRoleOptions.map((item) => <option key={item} value={item}>{roleLabel(item)}</option>)}
              </select></label>
              {editingRole === "SAC" ? (
                <label>Time SAC<select required value={editingSupportTeamId} onChange={(event) => setEditingSupportTeamId(event.target.value)}>
                  <option value="">Selecione</option>
                  {activeTeams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
                </select></label>
              ) : null}
            </div>
            {editingUser?.supportTeamMemberships?.length ? (
              <div className="support-membership-history">
                <strong>Histórico de times</strong>
                <ul>{editingUser.supportTeamMemberships.map((membership) => (
                  <li key={membership.id}>{membership.team.name}: {formatMembershipDate(membership.validFrom)} até {formatMembershipDate(membership.validTo)}</li>
                ))}</ul>
              </div>
            ) : null}
            <div className="form-actions">
              <button disabled={saving || !editingName.trim() || !editingEmail.trim() || (editingRole === "SAC" && !editingSupportTeamId)}>Salvar usuário</button>
            </div>
          </form>
        </section>
      ) : null}
    </div>
  );
}
