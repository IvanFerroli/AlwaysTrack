export interface SalesCampaignItem {
  id: string;
  name: string;
  description: string | null;
  metric: string;
  status: string;
  startsAt: string;
  endsAt: string;
  salesGroup: { id: string; name: string } | null;
}

export interface RankingSnapshotItem {
  id: string;
  periodStart: string;
  periodEnd: string;
  scopeType: string;
  scopeId: string | null;
  payloadJson: string;
  createdAt: string;
  campaign: SalesCampaignItem | null;
}

export interface QueueJobStatus {
  id: string;
  name: string;
  driver: "inline" | "bullmq";
  dedupeKey: string;
  status:
    | "not_tracked"
    | "waiting"
    | "waiting-children"
    | "active"
    | "completed"
    | "failed"
    | "delayed"
    | "prioritized"
    | "paused"
    | "unknown"
    | "not_found"
    | "unavailable";
  attemptsMade?: number;
  failedReason?: string;
  finishedAt?: string;
  processedAt?: string;
  timestamp?: string;
}

export interface QueueJobResult {
  id: string;
  name: string;
  status: "completed" | "queued";
  driver: "inline" | "bullmq";
  dedupeKey: string;
}

export interface SalesCampaignDraft {
  id?: string;
  name: string;
  description: string;
  metric: string;
  status: string;
  startsAt: string;
  endsAt: string;
  salesGroupId: string;
}

export interface SalesRankingRow {
  position: number;
  sellerId: string;
  sellerName: string;
  groupName: string | null;
  totalAmountCents: number;
  quantity: number;
  documents: number;
}

export interface SalesRankingData {
  campaign: SalesCampaignItem | null;
  items: SalesRankingRow[];
  total: number;
}

export interface RankingSnapshotPayload {
  campaign?: SalesCampaignItem | null;
  items: SalesRankingRow[];
  total?: number;
}

export interface RankingSnapshotComparisonRow {
  sellerId: string;
  sellerName: string;
  groupName: string | null;
  previousPosition: number | null;
  currentPosition: number | null;
  positionDelta: number | null;
  previousTotalAmountCents: number;
  currentTotalAmountCents: number;
  totalDeltaCents: number;
  previousQuantity: number;
  currentQuantity: number;
  quantityDelta: number;
  previousDocuments: number;
  currentDocuments: number;
  documentsDelta: number;
}

function formatDateBr(value: string | null | undefined) {
  if (!value) return "-";
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) return `${match[3]}/${match[2]}/${match[1]}`;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString("pt-BR");
}

function numberFromSnapshotValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export function campaignDraftFromItem(item?: SalesCampaignItem): SalesCampaignDraft {
  return {
    id: item?.id,
    name: item?.name ?? "",
    description: item?.description ?? "",
    metric: item?.metric ?? "totalAmountCents",
    status: item?.status ?? "ACTIVE",
    startsAt: item?.startsAt ? item.startsAt.slice(0, 10) : "",
    endsAt: item?.endsAt ? item.endsAt.slice(0, 10) : "",
    salesGroupId: item?.salesGroup?.id ?? ""
  };
}

export function campaignPayloadFromDraft(draft: SalesCampaignDraft) {
  return {
    name: draft.name,
    description: draft.description || null,
    metric: draft.metric,
    status: draft.status,
    startsAt: draft.startsAt,
    endsAt: draft.endsAt,
    salesGroupId: draft.salesGroupId || null
  };
}

export function parseRankingSnapshot(snapshot: RankingSnapshotItem): RankingSnapshotPayload {
  try {
    const payload = JSON.parse(snapshot.payloadJson) as { campaign?: SalesCampaignItem | null; total?: number; items?: unknown[] };
    const items = Array.isArray(payload.items)
      ? payload.items
          .map((item, index) => {
            if (!item || typeof item !== "object") return null;
            const row = item as Record<string, unknown>;
            const sellerId = typeof row.sellerId === "string" ? row.sellerId : "";
            if (!sellerId) return null;
            return {
              position: numberFromSnapshotValue(row.position) || index + 1,
              sellerId,
              sellerName: typeof row.sellerName === "string" ? row.sellerName : "Vendedor",
              groupName: typeof row.groupName === "string" ? row.groupName : null,
              totalAmountCents: numberFromSnapshotValue(row.totalAmountCents),
              quantity: numberFromSnapshotValue(row.quantity),
              documents: numberFromSnapshotValue(row.documents)
            };
          })
          .filter((item): item is SalesRankingRow => item !== null)
      : [];
    return { campaign: payload.campaign, items, total: typeof payload.total === "number" ? payload.total : items.length };
  } catch {
    return { campaign: null, items: [], total: 0 };
  }
}

export function snapshotTotal(snapshot: RankingSnapshotItem) {
  const payload = parseRankingSnapshot(snapshot);
  return typeof payload.total === "number" ? payload.total : payload.items.length;
}

export function snapshotLabel(snapshot: RankingSnapshotItem) {
  return `${snapshot.campaign?.name ?? "Ranking"} - ${formatDateBr(snapshot.createdAt)}`;
}

export function queueJobStatusLabel(status: QueueJobStatus) {
  if (status.driver === "inline" && status.status === "not_tracked") return "Executado inline";
  const labels: Record<QueueJobStatus["status"], string> = {
    active: "Processando",
    completed: "Concluido",
    delayed: "Agendado",
    failed: "Falhou",
    not_found: "Nao encontrado",
    not_tracked: "Sem rastreio",
    paused: "Pausado",
    prioritized: "Priorizado",
    unavailable: "Fila indisponivel",
    unknown: "Desconhecido",
    waiting: "Na fila",
    "waiting-children": "Aguardando dependencias"
  };
  return labels[status.status];
}

export function queueJobStatusTone(status: QueueJobStatus) {
  if (status.status === "failed" || status.status === "unavailable") return "rejected";
  if (status.status === "completed" || status.status === "not_tracked") return "approved";
  if (status.status === "active") return "pending_review";
  return "uploaded";
}

export function compareRankingSnapshots(previous: RankingSnapshotItem, current: RankingSnapshotItem): RankingSnapshotComparisonRow[] {
  const previousRows = new Map(parseRankingSnapshot(previous).items.map((item) => [item.sellerId, item]));
  const currentRows = new Map(parseRankingSnapshot(current).items.map((item) => [item.sellerId, item]));
  const sellerIds = new Set([...previousRows.keys(), ...currentRows.keys()]);

  return [...sellerIds]
    .map((sellerId) => {
      const previousRow = previousRows.get(sellerId);
      const currentRow = currentRows.get(sellerId);
      const previousPosition = previousRow?.position ?? null;
      const currentPosition = currentRow?.position ?? null;
      return {
        sellerId,
        sellerName: currentRow?.sellerName ?? previousRow?.sellerName ?? "Vendedor",
        groupName: currentRow?.groupName ?? previousRow?.groupName ?? null,
        previousPosition,
        currentPosition,
        positionDelta: previousPosition !== null && currentPosition !== null ? previousPosition - currentPosition : null,
        previousTotalAmountCents: previousRow?.totalAmountCents ?? 0,
        currentTotalAmountCents: currentRow?.totalAmountCents ?? 0,
        totalDeltaCents: (currentRow?.totalAmountCents ?? 0) - (previousRow?.totalAmountCents ?? 0),
        previousQuantity: previousRow?.quantity ?? 0,
        currentQuantity: currentRow?.quantity ?? 0,
        quantityDelta: (currentRow?.quantity ?? 0) - (previousRow?.quantity ?? 0),
        previousDocuments: previousRow?.documents ?? 0,
        currentDocuments: currentRow?.documents ?? 0,
        documentsDelta: (currentRow?.documents ?? 0) - (previousRow?.documents ?? 0)
      };
    })
    .sort((a, b) => (a.currentPosition ?? Number.MAX_SAFE_INTEGER) - (b.currentPosition ?? Number.MAX_SAFE_INTEGER));
}
