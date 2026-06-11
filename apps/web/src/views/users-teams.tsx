import { useEffect, useState, type FormEvent } from "react";
import { commercialUserRoles, type UserRole } from "@alwaystrack/shared";
import { api } from "../api";
import { ConfirmButton, InfoTip, OperationalFilters, OperationalState, OperationalTable, StatusBadge } from "../components/operational";
import type { SalesSellerItem } from "../sales";

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

const commercialCreateRoles = ["ADMIN", "SAC", "VENDEDOR", "SUPERVISOR"] as const;

function commercialRoleLabel(role: string) {
  if (role === "VENDEDOR") return "VENDAS";
  return role;
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
  const [salesGroups, setSalesGroups] = useState<SalesGroupOption[]>([]);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [groupFilter, setGroupFilter] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("VENDEDOR");
  const [sellerCode, setSellerCode] = useState("");
  const [sellerDisplayName, setSellerDisplayName] = useState("");
  const [salesGroupId, setSalesGroupId] = useState("");
  const [editingUserId, setEditingUserId] = useState("");
  const [editingName, setEditingName] = useState("");
  const [editingEmail, setEditingEmail] = useState("");
  const [editingPhone, setEditingPhone] = useState("");
  const [editingRole, setEditingRole] = useState<UserRole>("VENDEDOR");
  const [editingSellerCode, setEditingSellerCode] = useState("");
  const [editingSellerDisplayName, setEditingSellerDisplayName] = useState("");
  const [editingSalesGroupId, setEditingSalesGroupId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [usersResult, optionsResult] = await Promise.all([
        api<{ users: ManagedUserItem[] }>("/v1/users"),
        api<{ salesGroups: SalesGroupOption[]; sellers: SalesSellerItem[] }>("/v1/users/commercial-options")
      ]);
      setUsers(usersResult.users);
      setSalesGroups(optionsResult.salesGroups);
      setSalesGroupId((current) => current || optionsResult.salesGroups[0]?.id || "");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Falha ao carregar usuarios.");
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
      setError(caught instanceof Error ? caught.message : "Falha ao salvar usuario.");
    } finally {
      setSaving(false);
    }
  }

  function commercialPayload(currentRole: UserRole, input: { sellerCode?: string; sellerDisplayName?: string; salesGroupId?: string }) {
    return {
      sellerCode: currentRole === "VENDEDOR" ? input.sellerCode || undefined : undefined,
      sellerDisplayName: currentRole === "VENDEDOR" ? input.sellerDisplayName || undefined : undefined,
      salesGroupId: currentRole === "VENDEDOR" || currentRole === "SUPERVISOR" ? input.salesGroupId || null : null
    };
  }

  async function createUser(event: FormEvent) {
    event.preventDefault();
    await run(async () => {
      await api("/v1/users", {
        method: "POST",
        body: JSON.stringify({
          name,
          email,
          phone: phone || null,
          password,
          role,
          ...commercialPayload(role, { sellerCode, sellerDisplayName, salesGroupId })
        })
      });
      setName("");
      setEmail("");
      setPhone("");
      setPassword("");
      setRole("VENDEDOR");
      setSellerCode("");
      setSellerDisplayName("");
    });
  }

  function startEdit(user: ManagedUserItem) {
    setEditingUserId(user.id);
    setEditingName(user.name);
    setEditingEmail(user.email);
    setEditingPhone(formatPhoneInput(user.phone ?? ""));
    setEditingRole(user.role);
    setEditingSellerCode(user.sellerProfile?.code ?? "");
    setEditingSellerDisplayName(user.sellerProfile?.displayName ?? user.name);
    setEditingSalesGroupId(user.sellerProfile?.salesGroupId ?? user.supervisedSalesGroups?.[0]?.id ?? "");
  }

  function cancelEdit() {
    setEditingUserId("");
    setEditingName("");
    setEditingEmail("");
    setEditingPhone("");
    setEditingRole("VENDEDOR");
    setEditingSellerCode("");
    setEditingSellerDisplayName("");
    setEditingSalesGroupId("");
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
          ...commercialPayload(editingRole, {
            sellerCode: editingSellerCode,
            sellerDisplayName: editingSellerDisplayName,
            salesGroupId: editingSalesGroupId
          })
        })
      });
      cancelEdit();
    });
  }

  async function resetPassword(user: ManagedUserItem) {
    const nextPassword = window.prompt(`Nova senha para ${user.email}`);
    if (!nextPassword) return;
    await run(async () => {
      await api(`/v1/users/${user.id}/reset-password`, {
        method: "POST",
        body: JSON.stringify({ password: nextPassword })
      });
    });
  }

  const filteredUsers = users.filter((user) => {
    const haystack = `${user.name} ${user.email} ${user.sellerProfile?.displayName ?? ""}`.toLowerCase();
    const matchesQuery = !query.trim() || haystack.includes(query.trim().toLowerCase());
    const matchesRole = !roleFilter || user.role === roleFilter;
    const matchesStatus = !statusFilter || (statusFilter === "ACTIVE" ? user.active : !user.active);
    const userGroupIds = new Set([user.sellerProfile?.salesGroupId, ...(user.supervisedSalesGroups ?? []).map((group) => group.id)].filter(Boolean));
    const matchesGroup = !groupFilter || userGroupIds.has(groupFilter);
    return matchesQuery && matchesRole && matchesStatus && matchesGroup;
  });

  if (loading) return <OperationalState state="loading" title="Carregando usuarios e times" />;

  return (
    <div className="content-stack">
      {error ? <OperationalState state="error" title="Falha em usuarios" detail={error} /> : null}
      <OperationalFilters
        fields={[
          { key: "query", label: "Busca", value: query, placeholder: "Nome, email ou vendedor", help: "Busca usuarios e vinculos comerciais.", helpHref: "#usuarios-times", onChange: setQuery },
          {
            key: "role",
            label: "Funcao",
            value: roleFilter,
            type: "select",
            placeholder: "Todas",
            options: commercialUserRoles.map((item) => ({ value: item, label: commercialRoleLabel(item) })),
            help: "Roles comerciais controlam as telas e acoes disponiveis.",
            helpHref: "#perfis-e-permissoes",
            onChange: setRoleFilter
          },
          {
            key: "status",
            label: "Status",
            value: statusFilter,
            type: "select",
            placeholder: "Todos",
            options: [
              { value: "ACTIVE", label: "Ativos" },
              { value: "INACTIVE", label: "Inativos" }
            ],
            onChange: setStatusFilter
          },
          {
            key: "group",
            label: "Grupo",
            value: groupFilter,
            type: "select",
            placeholder: "Todos",
            options: salesGroups.map((group) => ({ value: group.id, label: group.name })),
            help: "Filtra vendedores vinculados ao grupo ou supervisores responsaveis por ele.",
            helpHref: "#usuarios-times",
            onChange: setGroupFilter
          }
        ]}
        onSubmit={() => undefined}
      />

      <section className="panel form-panel">
        <form onSubmit={createUser}>
          <div className="table-panel-toolbar">
            <div>
              <p className="eyebrow">Admin</p>
              <h2>Criar usuario comercial</h2>
            </div>
          </div>
          <div className="form-grid">
            <label>
              Nome
              <input value={name} onChange={(event) => setName(event.target.value)} />
            </label>
            <label>
              Email
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
            </label>
            <label>
              Telefone
              <input inputMode="tel" value={phone} onChange={(event) => setPhone(formatPhoneInput(event.target.value))} />
            </label>
            <label>
              Senha inicial
              <input minLength={8} type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
            </label>
            <label>
              <span className="label-row">Funcao <InfoTip text="Criacao nova aceita ADMIN, SAC, VENDAS e SUPERVISOR." href="#usuarios-times" /></span>
              <select value={role} onChange={(event) => setRole(event.target.value as UserRole)}>
                {commercialCreateRoles.map((item) => (
                  <option key={item} value={item}>
                    {commercialRoleLabel(item)}
                  </option>
                ))}
              </select>
            </label>
            {role === "VENDEDOR" ? (
              <>
                <label>
                  Codigo vendedor
                  <input value={sellerCode} onChange={(event) => setSellerCode(event.target.value)} placeholder="VD-004" />
                </label>
                <label>
                  Nome comercial
                  <input value={sellerDisplayName} onChange={(event) => setSellerDisplayName(event.target.value)} placeholder={name || "Nome no ranking"} />
                </label>
              </>
            ) : null}
            {role === "VENDEDOR" || role === "SUPERVISOR" ? (
              <label>
                Grupo comercial
                <select value={salesGroupId} onChange={(event) => setSalesGroupId(event.target.value)}>
                  <option value="">Sem grupo</option>
                  {salesGroups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
          </div>
          <div className="form-actions">
            <button disabled={saving || !name.trim() || !email.trim() || password.length < 8}>Criar usuario</button>
          </div>
        </form>
      </section>

      <section className="panel table-panel">
        <div className="table-panel-toolbar">
          <div>
            <p className="eyebrow">Usuarios/Times</p>
            <h2>Usuarios comerciais</h2>
          </div>
          <span className="status-badge">{filteredUsers.length} usuario(s)</span>
        </div>
        {filteredUsers.length === 0 ? (
          <OperationalState state="empty" title="Nenhum usuario encontrado" detail="Crie usuários e vincule vendedores para alimentar notas, ranking e extratos." />
        ) : (
          <OperationalTable
            items={filteredUsers}
            getRowKey={(item) => item.id}
            columns={[
              { key: "user", header: "Usuario", render: (item) => `${item.name} (${item.email})` },
              { key: "role", header: "Funcao", render: (item) => commercialRoleLabel(item.role) },
              {
                key: "link",
                header: "Vinculo comercial",
                render: (item) =>
                  item.sellerProfile
                    ? `${item.sellerProfile.displayName} / ${item.sellerProfile.salesGroup?.name ?? "Sem grupo"}`
                    : item.supervisedSalesGroups?.length
                      ? `Supervisor: ${item.supervisedSalesGroups.map((group) => group.name).join(", ")}`
                      : "-"
              },
              { key: "phone", header: "Telefone", render: (item) => item.phone ?? "-" },
              { key: "status", header: "Status", render: (item) => <StatusBadge kind="active" value={item.active ? "ACTIVE" : "INACTIVE"} /> },
              {
                key: "actions",
                header: "Acoes",
                render: (item) => (
                  <div className="row-actions">
                    <button className="secondary small" type="button" onClick={() => startEdit(item)}>
                      Editar
                    </button>
                    <button className="secondary small" type="button" onClick={() => void resetPassword(item)}>
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

      {editingUserId ? (
        <section className="panel form-panel">
          <form onSubmit={saveEdit}>
            <div className="table-panel-toolbar">
              <div>
                <p className="eyebrow">Edicao</p>
                <h2>Editar usuario</h2>
              </div>
              <button className="secondary" disabled={saving} type="button" onClick={cancelEdit}>
                Cancelar
              </button>
            </div>
            <div className="form-grid">
              <label>
                Nome
                <input value={editingName} onChange={(event) => setEditingName(event.target.value)} />
              </label>
              <label>
                Email
                <input type="email" value={editingEmail} onChange={(event) => setEditingEmail(event.target.value)} />
              </label>
              <label>
                Telefone
                <input inputMode="tel" value={editingPhone} onChange={(event) => setEditingPhone(formatPhoneInput(event.target.value))} />
              </label>
              <label>
                Funcao
                <select value={editingRole} onChange={(event) => setEditingRole(event.target.value as UserRole)}>
                  {commercialUserRoles.map((item) => (
                    <option key={item} value={item}>
                      {commercialRoleLabel(item)}
                    </option>
                  ))}
                  {!commercialUserRoles.includes(editingRole as never) ? <option value={editingRole}>{editingRole}</option> : null}
                </select>
              </label>
              {editingRole === "VENDEDOR" ? (
                <>
                  <label>
                    Codigo vendedor
                    <input value={editingSellerCode} onChange={(event) => setEditingSellerCode(event.target.value)} />
                  </label>
                  <label>
                    Nome comercial
                    <input value={editingSellerDisplayName} onChange={(event) => setEditingSellerDisplayName(event.target.value)} />
                  </label>
                </>
              ) : null}
              {editingRole === "VENDEDOR" || editingRole === "SUPERVISOR" ? (
                <label>
                  Grupo comercial
                  <select value={editingSalesGroupId} onChange={(event) => setEditingSalesGroupId(event.target.value)}>
                    <option value="">Sem grupo</option>
                    {salesGroups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
            </div>
            <div className="form-actions">
              <button disabled={saving || !editingName.trim() || !editingEmail.trim()}>Salvar usuario</button>
            </div>
          </form>
        </section>
      ) : null}
    </div>
  );
}
