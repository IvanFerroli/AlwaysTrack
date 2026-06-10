import { useEffect, useState, type ReactNode } from "react";
import { api } from "../api";
import { OperationalState, OperationalTable } from "../components/operational";
import { formatDateBr, formatMoneyFromCents, type SalesDashboardData } from "../sales";

type DashboardTargetView = "notes" | "ranking" | "statements" | "wiki";

function MetricCard({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export function DashboardView({ onOpen }: { onOpen: (view: DashboardTargetView) => void }) {
  const [dashboard, setDashboard] = useState<SalesDashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setDashboard(await api<SalesDashboardData>("/v1/sales/dashboard"));
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
        <MetricCard label="Notas enviadas" value={dashboard.metrics.totalDocuments} />
        <MetricCard label="Pendentes" value={dashboard.metrics.pendingDocuments} />
        <MetricCard label="Aprovadas" value={dashboard.metrics.approvedDocuments} />
        <MetricCard label="Recusadas/Duplicadas" value={dashboard.metrics.rejectedDocuments} />
        <MetricCard label="Vendedores ativos" value={dashboard.metrics.activeSellers} />
      </section>

      <section className="panel action-center-panel">
        <div className="table-panel-toolbar">
          <div>
            <p className="eyebrow">Central de ações</p>
            <h2>Prioridades comerciais</h2>
          </div>
        </div>
        <div className="action-center-grid">
          <button type="button" onClick={() => onOpen("notes")}>
            <strong>{dashboard.metrics.pendingDocuments}</strong>
            <span>nota(s) aguardando revisão</span>
          </button>
          <button type="button" onClick={() => onOpen("ranking")}>
            <strong>{dashboard.queues.topSellers.length}</strong>
            <span>vendedor(es) no ranking</span>
          </button>
          <button type="button" onClick={() => onOpen("statements")}>
            <strong>{formatMoneyFromCents(dashboard.metrics.totalAmountCents)}</strong>
            <span>em vendas aprovadas</span>
          </button>
          <button type="button" onClick={() => onOpen("wiki")}>
            <strong>Wiki</strong>
            <span>procedimentos do SAC, financeiro e vendas</span>
          </button>
        </div>
      </section>

      <section className="dashboard-grid">
        <div className="panel table-panel">
          <h2>Notas pendentes</h2>
          {dashboard.queues.pendingDocuments.length === 0 ? (
            <OperationalState state="empty" title="Nenhuma nota pendente" />
          ) : (
            <OperationalTable
              items={dashboard.queues.pendingDocuments}
              getRowKey={(item) => item.id}
              columns={[
                { key: "seller", header: "Vendedor", render: (item) => item.sellerProfile.displayName },
                { key: "file", header: "Arquivo", render: (item) => item.fileName },
                { key: "status", header: "Status", render: (item) => item.status },
                { key: "created", header: "Enviada", render: (item) => formatDateBr(item.createdAt) },
                { key: "action", header: "Ação", render: () => <button className="secondary" onClick={() => onOpen("notes")}>Revisar</button> }
              ]}
            />
          )}
        </div>

        <div className="panel table-panel">
          <h2>Top vendedores</h2>
          {dashboard.queues.topSellers.length === 0 ? (
            <OperationalState state="empty" title="Ranking sem vendas aprovadas" />
          ) : (
            <OperationalTable
              items={dashboard.queues.topSellers}
              getRowKey={(item) => item.sellerId}
              columns={[
                { key: "seller", header: "Vendedor", render: (item) => item.sellerName },
                { key: "group", header: "Grupo", render: (item) => item.groupName ?? "-" },
                { key: "amount", header: "Total", render: (item) => formatMoneyFromCents(item.totalAmountCents) },
                { key: "quantity", header: "Itens", render: (item) => item.quantity }
              ]}
            />
          )}
        </div>

        <div className="panel table-panel">
          <h2>Grupos</h2>
          {dashboard.queues.groups.length === 0 ? (
            <OperationalState state="empty" title="Nenhum grupo com venda aprovada" />
          ) : (
            <OperationalTable
              items={dashboard.queues.groups}
              getRowKey={(item) => item.groupName}
              columns={[
                { key: "group", header: "Grupo", render: (item) => item.groupName },
                { key: "amount", header: "Total", render: (item) => formatMoneyFromCents(item.totalAmountCents) },
                { key: "quantity", header: "Itens", render: (item) => item.quantity }
              ]}
            />
          )}
        </div>
      </section>
    </div>
  );
}
