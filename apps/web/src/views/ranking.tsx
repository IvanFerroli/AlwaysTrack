import { useEffect, useState } from "react";
import { canUseCommercialPermission, type CurrentUser } from "@alwaystrack/shared";
import { api, apiBaseUrl } from "../api";
import { InfoTip, OperationalState, OperationalTable } from "../components/operational";
import {
  formatDateBr,
  formatMoneyFromCents,
  mergeUniqueGroups,
  salesFilterQuery,
  withoutSellerFilter,
  type SalesCampaignItem,
  type SalesFilters,
  type SalesRankingData,
  type SalesRankingExplanation,
  type SalesRankingRow
} from "../sales";

function ExplanationMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="metric-card compact">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function RankingExplanationPanel({
  explanation,
  loading,
  error,
  onClose
}: {
  explanation: SalesRankingExplanation | null;
  loading: boolean;
  error: string | null;
  onClose: () => void;
}) {
  if (loading) return <section className="panel ranking-explanation-panel"><OperationalState state="loading" title="Carregando composição do ranking" /></section>;
  if (error) return <section className="panel ranking-explanation-panel"><OperationalState state="error" title="Falha ao explicar ranking" detail={error} /></section>;
  if (!explanation) return null;

  return (
    <section className="panel ranking-explanation-panel">
      <div className="table-panel-toolbar">
        <div>
          <p className="eyebrow">Composição auditável</p>
          <h2>{explanation.ranking.position}º - {explanation.ranking.sellerName}</h2>
          <p className="muted">
            {explanation.filters.from || explanation.filters.to ? `${formatDateBr(explanation.filters.from)} até ${formatDateBr(explanation.filters.to)}` : "Período aberto"}
            {explanation.campaign ? ` · ${explanation.campaign.name}` : ""}
          </p>
        </div>
        <button className="secondary" type="button" onClick={onClose}>Fechar</button>
      </div>
      <div className="metrics-grid ranking-explanation-metrics">
        <ExplanationMetric label="Total aprovado" value={formatMoneyFromCents(explanation.summary.totalAmountCents)} />
        <ExplanationMetric label="Notas aprovadas" value={explanation.summary.documents} />
        <ExplanationMetric label="Itens" value={explanation.summary.quantity} />
        <ExplanationMetric label="Ticket médio" value={formatMoneyFromCents(explanation.summary.averageTicketCents)} />
        <ExplanationMetric label="Pendentes" value={explanation.summary.pendingDocuments} />
        <ExplanationMetric label="Rejeitadas/Duplicadas" value={`${explanation.summary.rejectedDocuments}/${explanation.summary.duplicateDocuments}`} />
      </div>
      {explanation.snapshot ? (
        <div className="ranking-snapshot-note">
          <strong>Snapshot mais recente</strong>
          <span>
            Criado em {formatDateBr(explanation.snapshot.createdAt)} · {explanation.snapshot.scopeType}
            {explanation.snapshot.scopeId ? ` ${explanation.snapshot.scopeId}` : ""}
          </span>
        </div>
      ) : (
        <div className="ranking-snapshot-note">
          <strong>Ranking em tempo real</strong>
          <span>Sem snapshot de campanha aplicado nesta composição.</span>
        </div>
      )}
      <div className="dashboard-grid">
        <div className="table-panel">
          <h3>Notas que entraram no cálculo</h3>
          {explanation.documents.length === 0 ? (
            <OperationalState state="empty" title="Nenhuma nota aprovada" detail="A linha do ranking não encontrou notas aprovadas para detalhar." />
          ) : (
            <OperationalTable
              items={explanation.documents}
              getRowKey={(item) => item.id}
              columns={[
                { key: "invoice", header: "NF", render: (item) => item.invoiceNumber ?? "-" },
                { key: "issued", header: "Emissão", render: (item) => formatDateBr(item.issuedAt) },
                { key: "items", header: "Itens", render: (item) => item.quantity },
                { key: "total", header: "Total", render: (item) => formatMoneyFromCents(item.totalAmountCents) }
              ]}
            />
          )}
        </div>
        <div className="table-panel">
          <h3>Pendências e exceções relacionadas</h3>
          {explanation.relatedDocuments.length === 0 ? (
            <OperationalState state="success" title="Sem pendências relacionadas" detail="Não há notas pendentes, rejeitadas ou duplicadas para esse vendedor no período de envio." />
          ) : (
            <OperationalTable
              items={explanation.relatedDocuments}
              getRowKey={(item) => item.id}
              columns={[
                { key: "status", header: "Status", render: (item) => item.status },
                { key: "invoice", header: "NF", render: (item) => item.invoiceNumber ?? "-" },
                { key: "created", header: "Enviada", render: (item) => formatDateBr(item.createdAt) },
                { key: "reason", header: "Motivo", render: (item) => item.rejectionReason ?? "-" }
              ]}
            />
          )}
        </div>
      </div>
    </section>
  );
}

export function RankingView({ user, initialFilters }: { user: CurrentUser; initialFilters?: SalesFilters }) {
  const [ranking, setRanking] = useState<SalesRankingData | null>(null);
  const [sellerRanking, setSellerRanking] = useState<SalesRankingData | null>(null);
  const [campaigns, setCampaigns] = useState<SalesCampaignItem[] | null>(null);
  const [filters, setFilters] = useState<SalesFilters>({});
  const [selectedSeller, setSelectedSeller] = useState<SalesRankingRow | null>(null);
  const [explanation, setExplanation] = useState<SalesRankingExplanation | null>(null);
  const [explanationLoading, setExplanationLoading] = useState(false);
  const [explanationError, setExplanationError] = useState<string | null>(null);
  const canFilterSellers = canUseCommercialPermission(user.role, "ranking.filterSeller");
  const initialFiltersKey = JSON.stringify(initialFilters ?? {});

  useEffect(() => {
    if (!initialFilters || Object.keys(initialFilters).length === 0) return;
    setFilters((current) => ({ ...current, ...initialFilters }));
  }, [initialFiltersKey]);

  useEffect(() => {
    api<{ items: SalesCampaignItem[] }>("/v1/sales/campaigns").then((result) => setCampaigns(result.items)).catch(() => setCampaigns([]));
  }, []);

  useEffect(() => {
    api<SalesRankingData>(`/v1/sales/ranking${salesFilterQuery(filters)}`).then(setRanking).catch(() => setRanking(null));
  }, [filters]);

  useEffect(() => {
    if (!canFilterSellers) {
      setSellerRanking(null);
      return;
    }
    api<SalesRankingData>(`/v1/sales/ranking${salesFilterQuery(withoutSellerFilter(filters))}`)
      .then(setSellerRanking)
      .catch(() => setSellerRanking(null));
  }, [canFilterSellers, filters]);

  const groups = mergeUniqueGroups(campaigns);
  const sellers = (sellerRanking?.items ?? ranking?.items ?? [])
    .map((item) => ({ id: item.sellerId, name: item.sellerName }))
    .sort((a, b) => a.name.localeCompare(b.name));
  const csvHref = `${apiBaseUrl}/v1/sales/ranking.csv${salesFilterQuery(filters)}`;

  async function explainSeller(row: SalesRankingRow) {
    setSelectedSeller(row);
    setExplanationLoading(true);
    setExplanationError(null);
    setExplanation(null);
    try {
      setExplanation(await api<SalesRankingExplanation>(`/v1/sales/ranking/${row.sellerId}/explanation${salesFilterQuery(filters)}`));
    } catch (caught) {
      setExplanationError(caught instanceof Error ? caught.message : "Falha ao carregar composição.");
    } finally {
      setExplanationLoading(false);
    }
  }

  return (
    <div className="content-stack">
      <section className="panel filter-panel">
        <div className="filter-grid">
          <label>
            <span className="label-row">Campanha <InfoTip text="Campanha limita o ranking a uma regra comercial e periodo especifico." href="#ranking" /></span>
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
            Grupo
            <select value={filters.salesGroupId ?? ""} onChange={(event) => setFilters((current) => ({ ...current, salesGroupId: event.target.value || undefined }))}>
              <option value="">Todos</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </label>
          {canFilterSellers ? (
            <label>
              <span className="label-row">Vendedor <InfoTip text="Use para validar um vendedor especifico; limpe para comparar todos." href="#ranking" /></span>
              <select value={filters.sellerProfileId ?? ""} onChange={(event) => setFilters((current) => ({ ...current, sellerProfileId: event.target.value || undefined }))}>
                <option value="">Todos</option>
                {sellers.map((seller) => (
                  <option key={seller.id} value={seller.id}>
                    {seller.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
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
      <section className="panel table-panel">
        <div className="table-panel-toolbar">
          <div>
            <p className="eyebrow">Ranking</p>
            <h2>Vendedores por venda aprovada</h2>
          </div>
          <div className="table-panel-toggle-group">
            {ranking?.campaign ? <span className="status-badge">{ranking.campaign.name}</span> : null}
            <a className="secondary button-link" href={csvHref}>
              Baixar CSV
            </a>
          </div>
        </div>
        {!ranking ? (
          <OperationalState state="loading" title="Carregando ranking" />
        ) : ranking.items.length === 0 ? (
          <OperationalState state="empty" title="Ainda não há ranking" detail="Aprove notas no período ou limpe os filtros para comparar vendedores." />
        ) : (
          <OperationalTable
            items={ranking.items}
            getRowKey={(item) => item.sellerId}
            columns={[
              { key: "position", header: "#", render: (item) => item.position },
              { key: "seller", header: "Vendedor", render: (item) => item.sellerName },
              { key: "group", header: "Grupo", render: (item) => item.groupName ?? "-" },
              { key: "total", header: "Total", render: (item) => formatMoneyFromCents(item.totalAmountCents) },
              { key: "quantity", header: "Itens", render: (item) => item.quantity },
              { key: "documents", header: "Notas", render: (item) => item.documents },
              { key: "explain", header: "Prova", render: (item) => <button className="secondary" type="button" onClick={() => explainSeller(item)}>Explicar</button> }
            ]}
          />
        )}
      </section>
      {selectedSeller ? (
        <RankingExplanationPanel
          explanation={explanation}
          loading={explanationLoading}
          error={explanationError}
          onClose={() => {
            setSelectedSeller(null);
            setExplanation(null);
            setExplanationError(null);
          }}
        />
      ) : null}
    </div>
  );
}
