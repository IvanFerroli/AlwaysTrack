import { useEffect, useState } from "react";
import type { CurrentUser } from "@alwaystrack/shared";
import { api } from "../api";
import { InfoTip, OperationalState, OperationalTable } from "../components/operational";
import {
  formatMoneyFromCents,
  mergeUniqueGroups,
  salesFilterQuery,
  withoutSellerFilter,
  type SalesCampaignItem,
  type SalesFilters,
  type SalesRankingData
} from "../sales";

export function RankingView({ user }: { user: CurrentUser }) {
  const [ranking, setRanking] = useState<SalesRankingData | null>(null);
  const [sellerRanking, setSellerRanking] = useState<SalesRankingData | null>(null);
  const [campaigns, setCampaigns] = useState<SalesCampaignItem[] | null>(null);
  const [filters, setFilters] = useState<SalesFilters>({});
  const canFilterSellers = ["ADMIN", "GESTOR", "SUPERVISOR"].includes(user.role);

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
          {ranking?.campaign ? <span className="status-badge">{ranking.campaign.name}</span> : null}
        </div>
        {!ranking ? (
          <OperationalState state="loading" title="Carregando ranking" />
        ) : ranking.items.length === 0 ? (
          <OperationalState state="empty" title="Ainda não há ranking" />
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
              { key: "documents", header: "Notas", render: (item) => item.documents }
            ]}
          />
        )}
      </section>
    </div>
  );
}
