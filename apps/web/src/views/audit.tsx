import { useEffect, useState } from "react";
import { api } from "../api";
import { OperationalFilters, OperationalState, OperationalTable, PaginationSummary } from "../components/operational";

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

interface ManagedUserOption {
  id: string;
  name: string;
  email: string;
}

function toFilterOptions(items: Array<{ value: string; label: string }>) {
  return items;
}

const pageSizeFilterOptions = toFilterOptions(["10", "25", "50", "100"].map((value) => ({ value, label: value })));
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
  { value: "InAppNotification", label: "Notificação in-app" },
  { value: "SalesDocument", label: "Nota comercial" },
  { value: "SalesCampaign", label: "Campanha comercial" },
  { value: "SalesRanking", label: "Ranking comercial" },
  { value: "SalesDashboard", label: "Dashboard comercial" },
  { value: "SalesStatements", label: "Extrato comercial" },
  { value: "RankingSnapshot", label: "Snapshot de ranking" },
  { value: "Faq", label: "FAQ" },
  { value: "FaqThread", label: "Thread FAQ" },
  { value: "WikiPage", label: "Wiki" }
]);
const auditActionOptions = toFilterOptions([
  { value: "auth.login", label: "Login" },
  { value: "sales_document", label: "Notas comerciais" },
  { value: "sales_ranking", label: "Ranking" },
  { value: "sales_dashboard", label: "Dashboard" },
  { value: "sales_statements", label: "Extratos" },
  { value: "sales_campaign", label: "Campanhas" },
  { value: "wiki", label: "Wiki" },
  { value: "faq", label: "FAQ" },
  { value: "user", label: "Usuários" },
  { value: "organization", label: "Organização" },
  { value: "seed.local", label: "Seed/demo" }
]);

function formatDateTimeBr(value: string | null | undefined) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString("pt-BR");
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

export function AuditView() {
  const [items, setItems] = useState<AuditLogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [users, setUsers] = useState<ManagedUserOption[]>([]);
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
      const usersResult = await api<{ users: ManagedUserOption[] }>("/v1/users");
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
          {
            key: "action",
            label: "Ação",
            type: "select",
            value: action,
            placeholder: "Todas as ações",
            options: auditActionOptions,
            help: "Filtra por trecho do evento gravado na trilha de auditoria.",
            helpHref: "#auditoria",
            onChange: setAction
          },
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
