import { useEffect, useMemo, useState, type ReactNode } from "react";
import { api, apiBaseUrl } from "../api";
import { InfoTip, OperationalState, OperationalTable } from "../components/operational";
import { formatDateBr, formatMoneyFromCents, salesFilterQuery, type SalesDashboardData, type SalesFilters, type SalesSellerItem } from "../sales";

type DashboardTargetView = "notes" | "ranking" | "statements" | "wiki";

function MetricCard({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function daysAgoIso(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

function chartLabel(from: string, to: string, bucket: string) {
  if (bucket === "month") return from.slice(5, 7) + "/" + from.slice(0, 4);
  if (bucket === "week") return `${formatDateBr(from)}-${formatDateBr(to).slice(0, 5)}`;
  return formatDateBr(from).slice(0, 5);
}

function SalesTrendChart({ dashboard }: { dashboard: SalesDashboardData }) {
  const series = dashboard.chart.series;
  const max = Math.max(...series.map((item) => item.totalAmountCents), 1);
  const width = 720;
  const height = 220;
  const padding = { top: 18, right: 18, bottom: 42, left: 54 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const barGap = 8;
  const barWidth = Math.max(8, plotWidth / Math.max(series.length, 1) - barGap);
  const total = series.reduce((sum, item) => sum + item.totalAmountCents, 0);
  const quantity = series.reduce((sum, item) => sum + item.quantity, 0);
  const documents = series.reduce((sum, item) => sum + item.documents, 0);

  return (
    <section className="panel sales-chart-panel">
      <div className="table-panel-toolbar">
        <div>
          <p className="eyebrow">Evolução comercial</p>
          <h2>Vendas aprovadas</h2>
          <p className="muted">{formatDateBr(dashboard.chart.from)} até {formatDateBr(dashboard.chart.to)}</p>
        </div>
        <div className="chart-summary">
          <span>{formatMoneyFromCents(total)}</span>
          <small>{documents} nota(s) / {quantity} item(ns)</small>
        </div>
      </div>
      {series.length === 0 || total === 0 ? (
        <OperationalState state="empty" title="Sem vendas aprovadas no período" detail="Aprove notas ou ajuste o range para alimentar o gráfico." />
      ) : (
        <div className="sales-chart-scroll">
          <svg className="sales-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Grafico de vendas aprovadas por periodo">
            <line x1={padding.left} y1={padding.top} x2={padding.left} y2={height - padding.bottom} />
            <line x1={padding.left} y1={height - padding.bottom} x2={width - padding.right} y2={height - padding.bottom} />
            {[0, 0.5, 1].map((tick) => {
              const y = padding.top + plotHeight - plotHeight * tick;
              return (
                <g key={tick}>
                  <line className="chart-grid-line" x1={padding.left} y1={y} x2={width - padding.right} y2={y} />
                  <text x={padding.left - 10} y={y + 4} textAnchor="end">{formatMoneyFromCents(max * tick).replace(",00", "")}</text>
                </g>
              );
            })}
            {series.map((item, index) => {
              const x = padding.left + index * (barWidth + barGap) + barGap / 2;
              const barHeight = Math.max(2, (item.totalAmountCents / max) * plotHeight);
              const y = padding.top + plotHeight - barHeight;
              return (
                <g key={item.key}>
                  <rect x={x} y={y} width={barWidth} height={barHeight} rx="4">
                    <title>{`${chartLabel(item.from, item.to, dashboard.chart.bucket)}: ${formatMoneyFromCents(item.totalAmountCents)} / ${item.documents} nota(s)`}</title>
                  </rect>
                  <text x={x + barWidth / 2} y={height - 18} textAnchor="middle">{chartLabel(item.from, item.to, dashboard.chart.bucket)}</text>
                </g>
              );
            })}
          </svg>
        </div>
      )}
    </section>
  );
}

export function DashboardView({ onOpen }: { onOpen: (view: DashboardTargetView) => void }) {
  const [dashboard, setDashboard] = useState<SalesDashboardData | null>(null);
  const [sellers, setSellers] = useState<SalesSellerItem[]>([]);
  const [filters, setFilters] = useState<SalesFilters>({ from: daysAgoIso(29), to: todayIso() });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setDashboard(await api<SalesDashboardData>(`/v1/sales/dashboard${salesFilterQuery(filters)}`));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Falha ao carregar dashboard.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [filters]);

  useEffect(() => {
    api<{ items: SalesSellerItem[] }>("/v1/sales/sellers").then((result) => setSellers(result.items)).catch(() => setSellers([]));
  }, []);

  const groups = useMemo(() => {
    const values = new Map<string, string>();
    for (const seller of sellers) {
      if (seller.salesGroup) values.set(seller.salesGroup.id, seller.salesGroup.name);
    }
    return [...values.entries()].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [sellers]);
  const csvHref = `${apiBaseUrl}/v1/sales/dashboard.csv${salesFilterQuery(filters)}`;

  if (loading) return <OperationalState state="loading" title="Carregando dashboard" />;
  if (error) return <OperationalState state="error" title="Falha ao carregar dashboard" detail={error} />;
  if (!dashboard) return <OperationalState state="empty" title="Dashboard indisponível" />;

  return (
    <div className="content-stack">
      <section className="panel filter-panel">
        <div className="filter-grid">
          <label>
            <span className="label-row">De <InfoTip text="O gráfico usa a data de emissao das notas aprovadas." href="#dashboard" /></span>
            <input type="date" value={filters.from ?? ""} onChange={(event) => setFilters((current) => ({ ...current, from: event.target.value || undefined }))} />
          </label>
          <label>
            Ate
            <input type="date" value={filters.to ?? ""} onChange={(event) => setFilters((current) => ({ ...current, to: event.target.value || undefined }))} />
          </label>
          <label>
            Grupo
            <select value={filters.salesGroupId ?? ""} onChange={(event) => setFilters((current) => ({ ...current, salesGroupId: event.target.value || undefined }))}>
              <option value="">Todos</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>{group.name}</option>
              ))}
            </select>
          </label>
          <label>
            Vendedor
            <select value={filters.sellerProfileId ?? ""} onChange={(event) => setFilters((current) => ({ ...current, sellerProfileId: event.target.value || undefined }))}>
              <option value="">Todos</option>
              {sellers.map((seller) => (
                <option key={seller.id} value={seller.id}>{seller.displayName}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="form-actions">
          <a className="secondary button-link" href={csvHref}>
            Exportar dashboard CSV
          </a>
        </div>
      </section>

      <section className="metrics-grid">
        <MetricCard label="Notas enviadas" value={dashboard.metrics.totalDocuments} />
        <MetricCard label="Pendentes" value={dashboard.metrics.pendingDocuments} />
        <MetricCard label="Aprovadas" value={dashboard.metrics.approvedDocuments} />
        <MetricCard label="Recusadas/Duplicadas" value={dashboard.metrics.rejectedDocuments} />
        <MetricCard label="Vendedores ativos" value={dashboard.metrics.activeSellers} />
      </section>

      <SalesTrendChart dashboard={dashboard} />

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
          <h2>Série do período</h2>
          <OperationalTable
            items={dashboard.chart.series.filter((item) => item.totalAmountCents > 0).slice(-10)}
            getRowKey={(item) => item.key}
            columns={[
              { key: "period", header: "Periodo", render: (item) => chartLabel(item.from, item.to, dashboard.chart.bucket) },
              { key: "amount", header: "Total", render: (item) => formatMoneyFromCents(item.totalAmountCents) },
              { key: "documents", header: "Notas", render: (item) => item.documents },
              { key: "ticket", header: "Ticket", render: (item) => formatMoneyFromCents(item.averageTicketCents) }
            ]}
          />
        </div>

        <div className="panel table-panel">
          <h2>Notas pendentes</h2>
          {dashboard.queues.pendingDocuments.length === 0 ? (
            <OperationalState state="empty" title="Nenhuma nota pendente" detail="Quando vendedores subirem DANFEs, elas aparecem aqui para revisão." />
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
            <OperationalState state="empty" title="Ranking sem vendas aprovadas" detail="A primeira nota aprovada libera comparação entre vendedores." />
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
            <OperationalState state="empty" title="Nenhum grupo com venda aprovada" detail="Vincule vendedores a grupos e aprove notas para ver o consolidado." />
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
