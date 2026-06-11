import { useEffect, useMemo, useState, type FormEvent } from "react";
import { canUseCommercialPermission, type CurrentUser } from "@alwaystrack/shared";
import { api } from "../api";
import { InfoTip, OperationalState, OperationalTable } from "../components/operational";
import {
  campaignDraftFromItem,
  campaignPayloadFromDraft,
  compareRankingSnapshots,
  queueJobStatusLabel,
  queueJobStatusTone,
  snapshotLabel,
  snapshotTotal,
  type QueueJobResult,
  type QueueJobStatus,
  type RankingSnapshotItem,
  type SalesCampaignDraft,
  type SalesCampaignItem
} from "../sales";

function formatDateBr(value: string | null | undefined) {
  if (!value) return "-";
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) return `${match[3]}/${match[2]}/${match[1]}`;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString("pt-BR");
}

function formatMoneyFromCents(value: number | null | undefined) {
  return ((value ?? 0) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatSignedNumber(value: number) {
  return value > 0 ? `+${value}` : String(value);
}

function formatPositionDelta(value: number | null) {
  if (value === null) return "-";
  if (value === 0) return "0";
  return value > 0 ? `Subiu ${value}` : `Caiu ${Math.abs(value)}`;
}

function campaignGroups(campaigns: SalesCampaignItem[] | null) {
  const groups = new Map<string, string>();
  for (const campaign of campaigns ?? []) {
    if (campaign.salesGroup) groups.set(campaign.salesGroup.id, campaign.salesGroup.name);
  }
  return [...groups.entries()].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
}

export function CampaignsView({ user }: { user: CurrentUser }) {
  const [items, setItems] = useState<SalesCampaignItem[] | null>(null);
  const [snapshots, setSnapshots] = useState<RankingSnapshotItem[]>([]);
  const [snapshotJobs, setSnapshotJobs] = useState<Record<string, QueueJobStatus>>({});
  const [draft, setDraft] = useState<SalesCampaignDraft>(() => campaignDraftFromItem());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [compareBaseId, setCompareBaseId] = useState("");
  const [compareCurrentId, setCompareCurrentId] = useState("");
  const canManage = canUseCommercialPermission(user.role, "campaign.manage");
  const groups = campaignGroups(items);
  const defaultBaseId = snapshots[1]?.id ?? snapshots[0]?.id ?? "";
  const defaultCurrentId = snapshots[0]?.id ?? "";
  const selectedBaseId = snapshots.some((item) => item.id === compareBaseId) ? compareBaseId : defaultBaseId;
  const selectedCurrentId = snapshots.some((item) => item.id === compareCurrentId) ? compareCurrentId : defaultCurrentId;
  const baseSnapshot = snapshots.find((item) => item.id === selectedBaseId);
  const currentSnapshot = snapshots.find((item) => item.id === selectedCurrentId);
  const comparisonRows = useMemo(
    () => (baseSnapshot && currentSnapshot && baseSnapshot.id !== currentSnapshot.id ? compareRankingSnapshots(baseSnapshot, currentSnapshot) : []),
    [baseSnapshot, currentSnapshot]
  );

  async function load() {
    const [campaignResult, snapshotResult] = await Promise.all([
      api<{ items: SalesCampaignItem[] }>("/v1/sales/campaigns"),
      api<{ items: RankingSnapshotItem[] }>("/v1/sales/campaigns/snapshots")
    ]);
    setItems(campaignResult.items);
    setSnapshots(snapshotResult.items);
  }

  async function loadSnapshotJobStatus(campaignId: string) {
    const result = await api<{ job: QueueJobStatus }>(`/v1/sales/campaigns/${campaignId}/snapshots/job`);
    setSnapshotJobs((current) => ({ ...current, [campaignId]: result.job }));
    return result.job;
  }

  useEffect(() => {
    load().catch(() => setItems(null));
  }, []);

  async function saveCampaign(event: FormEvent) {
    event.preventDefault();
    if (!canManage) return;
    setSaving(true);
    setError(null);
    try {
      const path = draft.id ? `/v1/sales/campaigns/${draft.id}` : "/v1/sales/campaigns";
      await api<{ campaign: SalesCampaignItem }>(path, {
        method: draft.id ? "PATCH" : "POST",
        body: JSON.stringify(campaignPayloadFromDraft(draft))
      });
      setDraft(campaignDraftFromItem());
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Falha ao salvar campanha.");
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(item: SalesCampaignItem, status: string) {
    setSaving(true);
    setError(null);
    try {
      await api<{ campaign: SalesCampaignItem }>(`/v1/sales/campaigns/${item.id}`, {
        method: "PATCH",
        body: JSON.stringify({ ...campaignPayloadFromDraft(campaignDraftFromItem(item)), status })
      });
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Falha ao atualizar campanha.");
    } finally {
      setSaving(false);
    }
  }

  async function snapshotCampaign(item: SalesCampaignItem) {
    setSaving(true);
    setError(null);
    try {
      const result = await api<{ snapshot?: RankingSnapshotItem; job: QueueJobResult }>(`/v1/sales/campaigns/${item.id}/snapshots`, { method: "POST" });
      setSnapshotJobs((current) => ({
        ...current,
        [item.id]: {
          id: result.job.id,
          name: result.job.name,
          driver: result.job.driver,
          dedupeKey: result.job.dedupeKey,
          status: result.job.status === "queued" ? "waiting" : "not_tracked"
        }
      }));
      await load();
      if (result.job.status === "queued") {
        await loadSnapshotJobStatus(item.id);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Falha ao congelar ranking.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="content-stack">
      {canManage ? (
        <section className="panel">
          <form onSubmit={saveCampaign}>
            <div className="table-panel-toolbar">
              <div>
                <p className="eyebrow">{draft.id ? "Editar campanha" : "Nova campanha"}</p>
                <h2>Regras comerciais</h2>
              </div>
              {draft.id ? (
                <button className="secondary" type="button" disabled={saving} onClick={() => setDraft(campaignDraftFromItem())}>
                  Cancelar edição
                </button>
              ) : null}
            </div>
            <div className="form-grid">
              <label>
                Nome
                <input required value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} />
              </label>
              <label>
                Grupo
                <select value={draft.salesGroupId} onChange={(event) => setDraft((current) => ({ ...current, salesGroupId: event.target.value }))}>
                  <option value="">Todos</option>
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="label-row">Métrica <InfoTip text="Define como a campanha ordena vendedores: valor vendido, itens ou notas aprovadas." href="#campanhas" /></span>
                <select value={draft.metric} onChange={(event) => setDraft((current) => ({ ...current, metric: event.target.value }))}>
                  <option value="totalAmountCents">Valor vendido</option>
                  <option value="quantity">Quantidade de itens</option>
                  <option value="documents">Notas aprovadas</option>
                </select>
              </label>
              <label>
                <span className="label-row">Status <InfoTip text="Ativa entra na operacao; rascunho, pausada e encerrada ajudam a controlar o ciclo da campanha." href="#campanhas" /></span>
                <select value={draft.status} onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value }))}>
                  <option value="ACTIVE">Ativa</option>
                  <option value="DRAFT">Rascunho</option>
                  <option value="PAUSED">Pausada</option>
                  <option value="CLOSED">Encerrada</option>
                </select>
              </label>
              <label>
                Início
                <input required type="date" value={draft.startsAt} onChange={(event) => setDraft((current) => ({ ...current, startsAt: event.target.value }))} />
              </label>
              <label>
                Fim
                <input required type="date" value={draft.endsAt} onChange={(event) => setDraft((current) => ({ ...current, endsAt: event.target.value }))} />
              </label>
              <label className="full-span">
                Descrição
                <textarea rows={3} value={draft.description} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} />
              </label>
            </div>
            {error ? <p className="error">{error}</p> : null}
            <div className="form-actions">
              <button disabled={saving} type="submit">
                {draft.id ? "Salvar campanha" : "Criar campanha"}
              </button>
            </div>
          </form>
        </section>
      ) : null}
      <section className="panel table-panel">
        <div className="table-panel-toolbar">
          <div>
            <p className="eyebrow">Campanhas</p>
            <h2>Campanhas comerciais</h2>
          </div>
        </div>
        {!items ? (
          <OperationalState state="loading" title="Carregando campanhas" />
        ) : items.length === 0 ? (
          <OperationalState state="empty" title="Nenhuma campanha cadastrada" detail="Crie uma campanha para congelar snapshots e comparar ranking." />
        ) : (
          <OperationalTable
            items={items}
            getRowKey={(item) => item.id}
            columns={[
              { key: "name", header: "Campanha", render: (item) => item.name },
              { key: "group", header: "Grupo", render: (item) => item.salesGroup?.name ?? "Todos" },
              { key: "metric", header: "Métrica", render: (item) => item.metric },
              { key: "status", header: "Status", render: (item) => <span className={`status-badge document ${item.status.toLowerCase()}`}>{item.status}</span> },
              { key: "period", header: "Período", render: (item) => `${formatDateBr(item.startsAt)} a ${formatDateBr(item.endsAt)}` },
              {
                key: "actions",
                header: "Ações",
                render: (item) =>
                  canManage ? (
                    <div className="row-actions">
                      <button className="secondary small" type="button" disabled={saving} onClick={() => setDraft(campaignDraftFromItem(item))}>
                        Editar
                      </button>
                      <button className="secondary small" type="button" disabled={saving} onClick={() => void snapshotCampaign(item)}>
                        Snapshot
                      </button>
                      <InfoTip text="Congela o ranking da campanha para comparar posicoes depois." href="#campanhas" />
                      {snapshotJobs[item.id] ? (
                        <>
                          <span className={`status-badge document ${queueJobStatusTone(snapshotJobs[item.id])}`}>
                            {queueJobStatusLabel(snapshotJobs[item.id])}
                          </span>
                          <button className="secondary small" type="button" disabled={saving} onClick={() => void loadSnapshotJobStatus(item.id)}>
                            Atualizar job
                          </button>
                        </>
                      ) : null}
                      <button className="secondary small" type="button" disabled={saving} onClick={() => void updateStatus(item, item.status === "ACTIVE" ? "PAUSED" : "ACTIVE")}>
                        {item.status === "ACTIVE" ? "Pausar" : "Ativar"}
                      </button>
                    </div>
                  ) : (
                    "-"
                  )
              }
            ]}
          />
        )}
      </section>
      <section className="panel table-panel">
        <div className="table-panel-toolbar">
          <div>
            <p className="eyebrow">Comparativo</p>
            <h2>Snapshots recentes de ranking</h2>
          </div>
        </div>
        {snapshots.length < 2 ? (
          <OperationalState state="empty" title="Crie ao menos dois snapshots para comparar rankings" detail="Snapshots guardam a posição do ranking em momentos diferentes." />
        ) : (
          <>
            <div className="filter-panel">
              <div className="filter-grid">
                <label>
                  <span className="label-row">Base <InfoTip text="Snapshot antigo usado como ponto de comparacao." href="#campanhas" /></span>
                  <select value={selectedBaseId} onChange={(event) => setCompareBaseId(event.target.value)}>
                    {snapshots.map((snapshot) => (
                      <option key={snapshot.id} value={snapshot.id}>
                        {snapshotLabel(snapshot)}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className="label-row">Atual <InfoTip text="Snapshot mais recente usado para medir movimento de ranking." href="#campanhas" /></span>
                  <select value={selectedCurrentId} onChange={(event) => setCompareCurrentId(event.target.value)}>
                    {snapshots.map((snapshot) => (
                      <option key={snapshot.id} value={snapshot.id}>
                        {snapshotLabel(snapshot)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
            {!baseSnapshot || !currentSnapshot || baseSnapshot.id === currentSnapshot.id ? (
              <OperationalState state="empty" title="Selecione dois snapshots diferentes" />
            ) : comparisonRows.length === 0 ? (
              <OperationalState state="empty" title="Nenhum vendedor encontrado nos snapshots selecionados" />
            ) : (
              <OperationalTable
                items={comparisonRows}
                getRowKey={(item) => item.sellerId}
                columns={[
                  { key: "seller", header: "Vendedor", render: (item) => item.sellerName },
                  { key: "group", header: "Grupo", render: (item) => item.groupName ?? "-" },
                  { key: "position", header: "Posição", render: (item) => `${item.previousPosition ?? "-"} -> ${item.currentPosition ?? "-"}` },
                  { key: "movement", header: "Movimento", render: (item) => formatPositionDelta(item.positionDelta) },
                  { key: "total", header: "Total atual", render: (item) => formatMoneyFromCents(item.currentTotalAmountCents) },
                  { key: "totalDelta", header: "Variação", render: (item) => formatMoneyFromCents(item.totalDeltaCents) },
                  { key: "quantityDelta", header: "Itens", render: (item) => `${item.currentQuantity} (${formatSignedNumber(item.quantityDelta)})` },
                  { key: "documentsDelta", header: "Notas", render: (item) => `${item.currentDocuments} (${formatSignedNumber(item.documentsDelta)})` }
                ]}
              />
            )}
          </>
        )}
      </section>
      <section className="panel table-panel">
        <div className="table-panel-toolbar">
          <div>
            <p className="eyebrow">Snapshots</p>
            <h2>Histórico congelado de ranking</h2>
          </div>
        </div>
        {snapshots.length === 0 ? (
          <OperationalState state="empty" title="Nenhum snapshot criado" detail="Congele o ranking de uma campanha para acompanhar evolução." />
        ) : (
          <OperationalTable
            items={snapshots}
            getRowKey={(item) => item.id}
            columns={[
              { key: "campaign", header: "Campanha", render: (item) => item.campaign?.name ?? "-" },
              { key: "scope", header: "Escopo", render: (item) => item.campaign?.salesGroup?.name ?? item.scopeType },
              { key: "period", header: "Período", render: (item) => `${formatDateBr(item.periodStart)} a ${formatDateBr(item.periodEnd)}` },
              { key: "total", header: "Posições", render: (item) => snapshotTotal(item) },
              { key: "created", header: "Criado", render: (item) => formatDateBr(item.createdAt) }
            ]}
          />
        )}
      </section>
    </div>
  );
}
