import { useEffect, useState, type ReactNode } from "react";
import { api, apiBaseUrl } from "../api";
import { InfoTip, OperationalState, OperationalTable, PaginationControls } from "../components/operational";
import {
  formatDateBr,
  formatMoneyFromCents,
  mergeUniqueGroups,
  salesFilterQuery,
  type SalesCampaignItem,
  type SalesDocumentItem,
  type SalesFilters,
  type SalesStatementData
} from "../sales";

function MetricCard({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export function StatementsView() {
  const [statement, setStatement] = useState<SalesStatementData | null>(null);
  const [campaigns, setCampaigns] = useState<SalesCampaignItem[] | null>(null);
  const [referenceDocuments, setReferenceDocuments] = useState<SalesDocumentItem[]>([]);
  const [filters, setFilters] = useState<SalesFilters>({});
  const [page, setPage] = useState(1);

  useEffect(() => {
    api<{ items: SalesCampaignItem[] }>("/v1/sales/campaigns").then((result) => setCampaigns(result.items)).catch(() => setCampaigns([]));
    api<{ items: SalesDocumentItem[] }>("/v1/sales/documents").then((result) => setReferenceDocuments(result.items)).catch(() => setReferenceDocuments([]));
  }, []);

  useEffect(() => {
    api<SalesStatementData>(`/v1/sales/statements${salesFilterQuery(filters)}`)
      .then((result) => {
        setStatement(result);
        setPage(1);
      })
      .catch(() => setStatement(null));
  }, [filters]);

  const groups = mergeUniqueGroups(campaigns, referenceDocuments);
  const sellers = [...new Map(referenceDocuments.map((item) => [item.sellerProfile.id, item.sellerProfile.displayName])).entries()]
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
  const csvHref = `${apiBaseUrl}/v1/sales/statements.csv${salesFilterQuery(filters)}`;
  const pageSize = 12;
  const paginatedStatementItems = statement?.items.slice((page - 1) * pageSize, page * pageSize) ?? [];

  return (
    <div className="content-stack">
      <section className="panel filter-panel">
        <div className="filter-grid">
          <label>
            <span className="label-row">Campanha <InfoTip text="Filtra o extrato pela campanha usada para consolidar notas aprovadas." href="#extratos" /></span>
            <select value={filters.campaignId ?? ""} onChange={(event) => setFilters((current) => ({ ...current, campaignId: event.target.value || undefined }))}>
              <option value="">Todas</option>
              {(campaigns ?? []).map((campaign) => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="label-row">Grupo <InfoTip text="Use para conferir consolidado de um time comercial especifico." href="#extratos" /></span>
            <select value={filters.salesGroupId ?? ""} onChange={(event) => setFilters((current) => ({ ...current, salesGroupId: event.target.value || undefined }))}>
              <option value="">Todos</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="label-row">Vendedor <InfoTip text="Use para auditar vendas aprovadas de uma pessoa antes de comparar ranking." href="#extratos" /></span>
            <select value={filters.sellerProfileId ?? ""} onChange={(event) => setFilters((current) => ({ ...current, sellerProfileId: event.target.value || undefined }))}>
              <option value="">Todos</option>
              {sellers.map((seller) => (
                <option key={seller.id} value={seller.id}>
                  {seller.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            De
            <input type="date" value={filters.from ?? ""} onChange={(event) => setFilters((current) => ({ ...current, from: event.target.value || undefined }))} />
          </label>
          <label>
            Até
            <input type="date" value={filters.to ?? ""} onChange={(event) => setFilters((current) => ({ ...current, to: event.target.value || undefined }))} />
          </label>
        </div>
        <div className="form-actions">
          <button className="secondary" type="button" onClick={() => setFilters({})}>
            Limpar filtros
          </button>
        </div>
      </section>
      <section className="metric-grid">
        <MetricCard label="Notas aprovadas" value={statement ? String(statement.summary.documents) : "..."} />
        <MetricCard label="Total vendido" value={statement ? formatMoneyFromCents(statement.summary.totalAmountCents) : "..."} />
        <MetricCard label="Itens" value={statement ? String(statement.summary.totalItems) : "..."} />
      </section>
      <section className="dashboard-grid">
        <div className="panel table-panel">
          <div className="table-panel-toolbar">
            <div>
              <p className="eyebrow">Consolidado</p>
              <h2>Por vendedor</h2>
            </div>
          </div>
          {!statement ? (
            <OperationalState state="loading" title="Carregando consolidados" />
          ) : statement.consolidations.bySeller.length === 0 ? (
            <OperationalState state="empty" title="Nenhum vendedor no extrato" detail="Apenas notas aprovadas entram neste consolidado." />
          ) : (
            <OperationalTable
              items={statement.consolidations.bySeller}
              getRowKey={(item) => item.sellerId}
              columns={[
                { key: "seller", header: "Vendedor", render: (item) => item.sellerName },
                { key: "group", header: "Grupo", render: (item) => item.groupName ?? "-" },
                { key: "documents", header: "Notas", render: (item) => item.documents },
                { key: "quantity", header: "Itens", render: (item) => item.quantity },
                { key: "total", header: "Total", render: (item) => formatMoneyFromCents(item.totalAmountCents) }
              ]}
            />
          )}
        </div>
        <div className="panel table-panel">
          <div className="table-panel-toolbar">
            <div>
              <p className="eyebrow">Consolidado</p>
              <h2>Por grupo</h2>
            </div>
          </div>
          {!statement ? (
            <OperationalState state="loading" title="Carregando consolidados" />
          ) : statement.consolidations.byGroup.length === 0 ? (
            <OperationalState state="empty" title="Nenhum grupo no extrato" detail="Use grupos comerciais nos vendedores para ver comparação por time." />
          ) : (
            <OperationalTable
              items={statement.consolidations.byGroup}
              getRowKey={(item) => item.groupId ?? item.groupName}
              columns={[
                { key: "group", header: "Grupo", render: (item) => item.groupName },
                { key: "sellers", header: "Vendedores", render: (item) => item.sellers },
                { key: "documents", header: "Notas", render: (item) => item.documents },
                { key: "quantity", header: "Itens", render: (item) => item.quantity },
                { key: "total", header: "Total", render: (item) => formatMoneyFromCents(item.totalAmountCents) }
              ]}
            />
          )}
        </div>
      </section>
      <section className="panel table-panel">
        <div className="table-panel-toolbar">
          <div>
            <p className="eyebrow">Extratos</p>
            <h2>Notas aprovadas</h2>
          </div>
          <a className="secondary button-link" href={csvHref}>
            Baixar CSV
          </a>
          <InfoTip text="Exporta o extrato com os mesmos filtros visiveis na tela." href="#extratos" />
        </div>
        {!statement ? (
          <OperationalState state="loading" title="Carregando extrato" />
        ) : statement.items.length === 0 ? (
          <OperationalState state="empty" title="Nenhuma nota aprovada no extrato" detail="Aprove notas ou ajuste os filtros de período, grupo e vendedor." />
        ) : (
          <OperationalTable
            items={paginatedStatementItems}
            getRowKey={(item) => item.id}
            columns={[
              { key: "seller", header: "Vendedor", render: (item) => item.sellerProfile.displayName },
              { key: "group", header: "Grupo", render: (item) => item.sellerProfile.salesGroup?.name ?? "-" },
              { key: "invoice", header: "NF", render: (item) => item.invoiceNumber ?? "-" },
              { key: "date", header: "Emissão", render: (item) => formatDateBr(item.issuedAt) },
              { key: "total", header: "Total", render: (item) => formatMoneyFromCents(item.totalAmountCents) }
            ]}
          />
        )}
        {statement && statement.items.length > 0 ? (
          <PaginationControls page={page} pageSize={pageSize} total={statement.items.length} onPageChange={setPage} />
        ) : null}
      </section>
    </div>
  );
}
