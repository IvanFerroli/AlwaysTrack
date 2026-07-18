import {
  getSupportMetricDefinition,
  supportMetricDefinitions,
  supportMetricKeys as sharedSupportMetricKeys,
  writableSupportMetricKeys as sharedWritableSupportMetricKeys,
  type CurrentUser,
  type SupportMetricAggregation,
  type SupportMetricDefinition,
  type SupportMetricGranularity,
  type SupportMetricKey,
  type SupportMetricUnit,
  type SupportObservationType,
  type WritableSupportMetricKey
} from "@alwaystrack/shared";

export type {
  SupportMetricAggregation,
  SupportMetricDefinition,
  SupportMetricGranularity,
  SupportMetricKey,
  SupportMetricUnit,
  SupportObservationType,
  WritableSupportMetricKey
} from "@alwaystrack/shared";

export const supportMetricKeys = [...sharedSupportMetricKeys];
export const writableSupportMetricKeys = [...sharedWritableSupportMetricKeys];

export const supportScopeTypes = ["ORGANIZATION", "USER", "TEAM"] as const;
export type SupportScopeType = (typeof supportScopeTypes)[number];

export type SupportComparison = "GTE" | "LTE";
export type SupportCampaignStatus = "DRAFT" | "ACTIVE" | "PAUSED" | "CLOSED";
export type SupportKpiStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED" | "SUPERSEDED";

export interface SupportAgent {
  id: string;
  name: string;
  email: string;
}

export interface SupportTeam {
  id: string;
  name: string;
}

export interface SupportPausePolicy {
  id: string | null;
  organizationId: string;
  timezone: string;
  minimumCoverage: number;
  slotMinutes: number;
  pauseDurationMinutes: number;
  boundaryBufferMinutes: number;
  shiftWindows: Array<{ start: string; end: string }>;
  templateStarts: string[];
  active: boolean;
}

export interface SupportPauseBooking {
  id: string;
  organizationId?: string;
  slotId: string;
  userId: string;
  status?: "BOOKED" | "CANCELLED" | "RESCHEDULED";
  shiftOccurrenceId?: string | null;
  rescheduledFromId?: string | null;
  rescheduleRequiredAt?: string | null;
  rescheduleReason?: string | null;
  requiresReschedule?: boolean;
  overrideReason?: string | null;
  coverageBefore?: number | null;
  coverageAfter?: number | null;
  minimumCoverage?: number | null;
  overrideById?: string | null;
  overrideAt?: string | null;
  overrideRevokedById?: string | null;
  overrideRevokedAt?: string | null;
  overrideRevokeReason?: string | null;
  user: SupportAgent;
  createdAt?: string;
  updatedAt?: string;
}

export interface SupportPauseSlot {
  id: string;
  label: string | null;
  startsAt: string;
  endsAt: string;
  capacity: number;
  active: boolean;
  bookings: SupportPauseBooking[];
  bookedCount: number;
  remainingCapacity: number;
  myBooking: SupportPauseBooking | null;
}

export interface SupportPauseTimelineItem {
  startsAt: string;
  endsAt: string;
  activeCount: number;
  pausedCount: number;
  availableCount: number;
  critical: boolean;
}

export interface SupportPauseSwap {
  id: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED" | "CANCELLED" | "EXPIRED";
  note: string | null;
  requestedById: string;
  requestedBy: SupportAgent;
  decidedBy: Pick<SupportAgent, "id" | "name"> | null;
  requesterBooking: SupportPauseBooking & { slot: SupportPauseSlot };
  targetBooking: SupportPauseBooking & { slot: SupportPauseSlot };
  createdAt: string;
  updatedAt: string;
  expiresAt: string | null;
}

export interface SupportPausesResponse {
  date: string;
  canManage: boolean;
  teams: SupportTeam[];
  selectedTeamId: string | null;
  membershipMode: "PUBLISHED_SCHEDULE" | "DATED_MEMBERSHIP" | "ROLE_FALLBACK";
  coverageSource: "PUBLISHED_SCHEDULE" | "LEGACY_MEMBERSHIP";
  policy: SupportPausePolicy;
  agents: SupportAgent[];
  summary: {
    activeAgents: number;
    minimumCoverage: number;
    bookedPauses: number;
    criticalIntervals: number;
  };
  timeline: SupportPauseTimelineItem[];
  slots: SupportPauseSlot[];
  swaps: SupportPauseSwap[];
}

export interface SupportKpiEntry {
  id: string;
  metric: SupportMetricKey;
  definitionVersion: number;
  unit: SupportMetricUnit;
  channel: string | null;
  granularity: SupportMetricGranularity;
  observationType: SupportObservationType;
  rawValue: string | null;
  dataState: "AVAILABLE";
  value: number;
  numerator: number | null;
  denominator: number | null;
  scopeType: SupportScopeType;
  userId: string | null;
  user: SupportAgent | null;
  teamLabel: string | null;
  teamId: string | null;
  team: SupportTeam | null;
  periodStart: string;
  periodEnd: string;
  source: string | null;
  note: string | null;
  status: SupportKpiStatus;
  revision: number;
  supersedesId: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  reviewedById: string | null;
  reviewNote: string | null;
  createdBy?: Pick<SupportAgent, "id" | "name">;
  createdAt: string;
  updatedAt: string;
}

export interface SupportCampaign {
  id: string;
  name: string;
  description: string | null;
  metric: SupportMetricKey;
  definitionVersion: number;
  unit: SupportMetricUnit;
  channel: string | null;
  granularity: SupportMetricGranularity;
  observationType: SupportObservationType;
  targetValue: number;
  comparison: SupportComparison;
  scopeType: SupportScopeType;
  userId: string | null;
  user: SupportAgent | null;
  teamLabel: string | null;
  teamId: string | null;
  team: SupportTeam | null;
  status: SupportCampaignStatus;
  startsAt: string;
  endsAt: string;
  lifecycleVersion: number;
  audienceRule: "FIXED_AT_ACTIVATION";
  audienceSnapshotAt: string | null;
  resultSnapshotAt: string | null;
  publishedAt: string | null;
  pausedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
  audience: {
    rule: "FIXED_AT_ACTIVATION";
    members: Array<{ id: string; name: string }>;
  };
  result: {
    current: number | null;
    average: number | null;
    samples: number;
    aggregation: SupportMetricAggregation;
    achieved: boolean;
    progressPercent: number;
    frozenAt: string | null;
    trend: Array<{
      entryId: string | null;
      revision: number;
      periodStart: string;
      periodEnd: string;
      value: number;
      samples: number;
      channel: string | null;
      granularity: SupportMetricGranularity;
      observationType: SupportObservationType;
    }>;
    provenance: Array<{
      entryId: string | null;
      revision: number;
      source: string | null;
      periodStart: string;
      periodEnd: string;
    }>;
  };
}

export interface SupportPerformanceResponse {
  canManage: boolean;
  dictionaryVersion: number;
  definitions: SupportMetricDefinition[];
  period: { from: string; to: string };
  agents: SupportAgent[];
  teams: SupportTeam[];
  summary: Array<{
    metric: SupportMetricKey;
    definitionVersion: number;
    unit: SupportMetricUnit;
    channel: string | null;
    granularity: SupportMetricGranularity;
    observationType: SupportObservationType;
    scopeType: SupportScopeType;
    userId: string | null;
    teamId: string | null;
    teamLabel: string | null;
    latest: number | null;
    average: number | null;
    samples: number;
    aggregation: SupportMetricAggregation;
  }>;
  entries: SupportKpiEntry[];
  pendingReviewCount: number;
  campaigns: SupportCampaign[];
}

export interface SupportCampaignsResponse {
  canManage: boolean;
  dictionaryVersion: number;
  definitions: SupportMetricDefinition[];
  items: SupportCampaign[];
  teams: SupportTeam[];
}

export interface SupportKpiDraft {
  id: string;
  metric: WritableSupportMetricKey;
  value: string;
  sampleSize: string;
  channel: string;
  granularity: SupportMetricGranularity;
  observationType: SupportObservationType;
  scopeType: SupportScopeType;
  userId: string;
  teamLabel: string;
  teamId: string;
  periodStart: string;
  periodEnd: string;
  source: string;
  note: string;
}

export interface SupportCampaignDraft {
  id: string;
  name: string;
  description: string;
  metric: WritableSupportMetricKey;
  targetValue: string;
  comparison: SupportComparison;
  channel: string;
  granularity: SupportMetricGranularity;
  observationType: SupportObservationType;
  scopeType: SupportScopeType;
  userId: string;
  teamLabel: string;
  teamId: string;
  status: SupportCampaignStatus;
  startsAt: string;
  endsAt: string;
}

export const supportMetricLabels = Object.fromEntries(
  supportMetricDefinitions.map((definition) => [definition.key, definition.label])
) as Record<SupportMetricKey, string>;

export const supportGranularityLabels: Record<SupportMetricGranularity, string> = {
  REPORTED_INTERVAL: "Intervalo informado",
  REPORTED_MONTH: "Fechamento mensal"
};

export const supportObservationTypeLabels: Record<SupportObservationType, string> = {
  ACTUAL: "Realizado",
  EXPECTATION: "Expectativa"
};

export const supportScopeLabels: Record<SupportScopeType, string> = {
  ORGANIZATION: "Toda a operação",
  USER: "Pessoa",
  TEAM: "Equipe"
};

export const supportCampaignStatusLabels: Record<SupportCampaignStatus, string> = {
  DRAFT: "Rascunho",
  ACTIVE: "Ativa",
  PAUSED: "Pausada",
  CLOSED: "Encerrada"
};

export function isSupportManager(user: Pick<CurrentUser, "role">) {
  return user.role === "ADMIN" || user.role === "GESTOR";
}

export function supportDateInputValue(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

export function shiftSupportDate(value: string, days: number) {
  const date = new Date(`${value}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function supportDayBoundaryIso(value: string, boundary: "start" | "end") {
  const time = boundary === "start" ? "00:00:00.000" : "23:59:59.999";
  return new Date(`${value}T${time}-03:00`).toISOString();
}

export function supportSlotDateTimeIso(date: string, time: string) {
  return new Date(`${date}T${time}:00-03:00`).toISOString();
}

export function supportDateFromIso(value: string) {
  return supportDateInputValue(new Date(value));
}

export function formatSupportDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(new Date(value));
}

export function formatSupportTime(value: string, timezone = "America/Sao_Paulo") {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(new Date(value));
}

export function supportMetricDefinition(metric: string, unit?: SupportMetricUnit): SupportMetricDefinition {
  const definition = getSupportMetricDefinition(metric);
  if (definition && (!unit || definition.unit === unit)) return definition;
  if (unit) {
    return {
      key: metric,
      definitionVersion: definition?.definitionVersion ?? 0,
      label: definition?.label ?? metric,
      unit,
      direction: definition?.direction ?? "HIGHER_IS_BETTER",
      aggregation: definition?.aggregation ?? "MEAN",
      status: definition?.status ?? "LEGACY_READ_ONLY"
    };
  }
  return definition ?? {
    key: metric,
    definitionVersion: 0,
    label: metric,
    unit: "COUNT",
    direction: "HIGHER_IS_BETTER",
    aggregation: "MEAN",
    status: "LEGACY_READ_ONLY"
  };
}

export function formatSupportDuration(totalSeconds: number) {
  const seconds = Math.max(0, Math.round(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  if (hours) return `${hours}h${minutes ? `${minutes}min` : ""}${remainingSeconds ? `${remainingSeconds}s` : ""}`;
  if (minutes) return `${minutes}min${remainingSeconds ? `${remainingSeconds}s` : ""}`;
  return `${remainingSeconds}s`;
}

export function parseSupportDuration(value: string) {
  const normalized = value.trim().toLowerCase();
  const match = normalized.match(/^(?:(\d+)\s*h)?\s*(?:(\d+)\s*min)?\s*(?:(\d+)\s*s)?$/);
  if (!match || !match.slice(1).some((part) => part !== undefined)) {
    throw new Error("Informe a duração como 53s, 12min58s ou 1h9min.");
  }
  const hours = Number(match[1] ?? 0);
  const minutes = Number(match[2] ?? 0);
  const seconds = Number(match[3] ?? 0);
  return hours * 3600 + minutes * 60 + seconds;
}

export function parseSupportMetricValue(metric: string, value: string, unit?: SupportMetricUnit) {
  const definition = supportMetricDefinition(metric, unit);
  if (definition.unit === "DURATION_SECONDS") return parseSupportDuration(value);
  const parsed = Number(value.trim().replace(",", "."));
  if (!Number.isFinite(parsed)) throw new Error("Informe um valor válido para a métrica.");
  return parsed;
}

export function formatSupportMetricValue(metric: string, value: number | null, unit?: SupportMetricUnit) {
  if (value === null) return "-";
  const definition = supportMetricDefinition(metric, unit);
  if (definition.unit === "DURATION_SECONDS") return formatSupportDuration(value);
  const formatted = value.toLocaleString("pt-BR", {
    maximumFractionDigits: definition.unit === "COUNT" ? 0 : 2
  });
  if (definition.unit === "SCORE_1_5") return `${formatted} / 5`;
  if (definition.unit === "PERCENT") return `${formatted}%`;
  return formatted;
}

export function formatSupportMetricInput(metric: string, value: number, unit?: SupportMetricUnit) {
  return supportMetricDefinition(metric, unit).unit === "DURATION_SECONDS"
    ? formatSupportDuration(value)
    : String(value);
}

export function supportMetricInputHint(metric: string) {
  const definition = supportMetricDefinition(metric);
  if (definition.unit === "DURATION_SECONDS") return "Ex.: 53s, 12min58s ou 1h9min";
  if (definition.unit === "SCORE_1_5") return "Nota de 1 a 5";
  if (definition.unit === "PERCENT") return "Percentual de 0 a 100";
  return "Número inteiro";
}

export function supportMetricDenominatorLabel(metric: string) {
  const definition = supportMetricDefinition(metric);
  if (definition.aggregation === "SUM" || definition.aggregation === "LATEST") return null;
  if (definition.unit === "SCORE_1_5" || definition.unit === "PERCENT") return "Respostas consideradas";
  return "Atendimentos considerados";
}

export function supportDefaultComparison(metric: string): SupportComparison {
  return supportMetricDefinition(metric).direction === "LOWER_IS_BETTER" ? "LTE" : "GTE";
}

export function supportChannelLabel(channel: string | null) {
  if (!channel) return "Todos os canais";
  const knownLabels: Record<string, string> = { TIKTOK: "TikTok", WHATSAPP: "WhatsApp", EMAIL: "E-mail" };
  if (knownLabels[channel]) return knownLabels[channel];
  return channel.toLowerCase().replace(/(^|[_-])\p{L}/gu, (match) => match.replace(/[_-]/, " ").toUpperCase());
}

export function supportSeriesContext(item: {
  channel: string | null;
  granularity: SupportMetricGranularity;
  observationType: SupportObservationType;
}) {
  return `${supportChannelLabel(item.channel)} · ${supportGranularityLabels[item.granularity] ?? "Período não informado"} · ${supportObservationTypeLabels[item.observationType] ?? "Tipo não informado"}`;
}

export function supportSeriesKey(item: {
  metric: string;
  definitionVersion: number;
  unit: SupportMetricUnit;
  channel: string | null;
  granularity: SupportMetricGranularity;
  observationType: SupportObservationType;
  scopeType?: SupportScopeType;
  userId?: string | null;
  teamId?: string | null;
  teamLabel?: string | null;
}) {
  return [
    item.metric,
    item.definitionVersion,
    item.unit,
    item.channel ?? "",
    item.granularity,
    item.observationType,
    item.scopeType ?? "",
    item.userId ?? "",
    item.teamId ?? item.teamLabel ?? ""
  ].join("|");
}

export function isSameSupportSeries(
  entry: Pick<SupportKpiEntry, "metric" | "definitionVersion" | "unit" | "channel" | "granularity" | "observationType" | "scopeType" | "userId" | "teamId" | "teamLabel">,
  series: SupportPerformanceResponse["summary"][number]
) {
  return supportSeriesKey(entry) === supportSeriesKey(series);
}

export function supportAggregationDetail(
  item: Pick<SupportPerformanceResponse["summary"][number], "aggregation" | "samples" | "unit">
) {
  const count = item.samples.toLocaleString("pt-BR", { maximumFractionDigits: 0 });
  if (item.aggregation === "LATEST") return "Último lançamento aprovado";
  if (item.aggregation === "SUM") return `${count} lançamento(s) somado(s)`;
  if (item.aggregation === "RATIO") return item.samples ? `${count} respostas na taxa consolidada` : "Média simples dos lançamentos";
  if (item.aggregation === "WEIGHTED_MEAN") {
    return `${count} ${item.unit === "SCORE_1_5" ? "respostas" : "atendimentos"} na média ponderada`;
  }
  return `${count} lançamento(s) na média simples`;
}

export function supportScopeLabel(item: Pick<SupportCampaign | SupportKpiEntry, "scopeType" | "user" | "team" | "teamLabel">) {
  if (item.scopeType === "USER") return item.user?.name || "Pessoa não identificada";
  if (item.scopeType === "TEAM") return item.team?.name || item.teamLabel || "Equipe não identificada";
  return supportScopeLabels.ORGANIZATION;
}

export function emptySupportKpiDraft(today = supportDateInputValue()): SupportKpiDraft {
  return {
    id: "",
    metric: "CSAT_SCORE",
    value: "",
    sampleSize: "",
    channel: "",
    granularity: "REPORTED_INTERVAL",
    observationType: "ACTUAL",
    scopeType: "ORGANIZATION",
    userId: "",
    teamLabel: "",
    teamId: "",
    periodStart: today,
    periodEnd: today,
    source: "",
    note: ""
  };
}

export function supportKpiDraftFromEntry(entry: SupportKpiEntry): SupportKpiDraft {
  const definition = supportMetricDefinition(entry.metric, entry.unit);
  if (definition.status !== "CURRENT") throw new Error("Métricas legadas estão disponíveis somente para consulta.");
  return {
    id: entry.id,
    metric: entry.metric as WritableSupportMetricKey,
    value: formatSupportMetricInput(entry.metric, entry.value, entry.unit),
    sampleSize: entry.denominator == null ? "" : String(entry.denominator),
    channel: entry.channel ?? "",
    granularity: entry.granularity,
    observationType: entry.observationType,
    scopeType: entry.scopeType,
    userId: entry.userId ?? "",
    teamLabel: entry.teamLabel ?? "",
    teamId: entry.teamId ?? "",
    periodStart: supportDateFromIso(entry.periodStart),
    periodEnd: supportDateFromIso(entry.periodEnd),
    source: entry.source ?? "",
    note: entry.note ?? ""
  };
}

export function supportKpiPayloadFromDraft(draft: SupportKpiDraft) {
  const value = parseSupportMetricValue(draft.metric, draft.value);
  if (draft.id) {
    return {
      value,
      sampleSize: draft.sampleSize ? Number(draft.sampleSize) : undefined,
      channel: draft.channel.trim().toUpperCase() || null,
      granularity: draft.granularity,
      observationType: draft.observationType,
      rawValue: draft.value.trim(),
      source: draft.source || null,
      note: draft.note || null
    };
  }
  return {
    metric: draft.metric,
    value,
    sampleSize: draft.sampleSize ? Number(draft.sampleSize) : undefined,
    channel: draft.channel.trim().toUpperCase() || null,
    granularity: draft.granularity,
    observationType: draft.observationType,
    rawValue: draft.value.trim(),
    scopeType: draft.scopeType,
    userId: draft.scopeType === "USER" ? draft.userId : undefined,
    teamLabel: draft.scopeType === "TEAM" ? draft.teamLabel : undefined,
    teamId: draft.scopeType === "TEAM" ? draft.teamId : undefined,
    periodStart: supportDayBoundaryIso(draft.periodStart, "start"),
    periodEnd: supportDayBoundaryIso(draft.periodEnd, "end"),
    source: draft.source || null,
    note: draft.note || null
  };
}

export function emptySupportCampaignDraft(today = supportDateInputValue()): SupportCampaignDraft {
  return {
    id: "",
    name: "",
    description: "",
    metric: "CSAT_SCORE",
    targetValue: "",
    comparison: "GTE",
    channel: "",
    granularity: "REPORTED_INTERVAL",
    observationType: "ACTUAL",
    scopeType: "ORGANIZATION",
    userId: "",
    teamLabel: "",
    teamId: "",
    status: "DRAFT",
    startsAt: today,
    endsAt: shiftSupportDate(today, 30)
  };
}

export function supportCampaignDraftFromItem(item: SupportCampaign): SupportCampaignDraft {
  const definition = supportMetricDefinition(item.metric, item.unit);
  if (definition.status !== "CURRENT") throw new Error("Campanhas legadas estão disponíveis somente para consulta.");
  return {
    id: item.id,
    name: item.name,
    description: item.description ?? "",
    metric: item.metric as WritableSupportMetricKey,
    targetValue: formatSupportMetricInput(item.metric, item.targetValue, item.unit),
    comparison: item.comparison,
    channel: item.channel ?? "",
    granularity: item.granularity,
    observationType: item.observationType,
    scopeType: item.scopeType,
    userId: item.userId ?? "",
    teamLabel: item.teamLabel ?? "",
    teamId: item.teamId ?? "",
    status: item.status,
    startsAt: supportDateFromIso(item.startsAt),
    endsAt: supportDateFromIso(item.endsAt)
  };
}

export function supportCampaignPayloadFromDraft(draft: SupportCampaignDraft) {
  return {
    name: draft.name.trim(),
    description: draft.description.trim() || null,
    metric: draft.metric,
    targetValue: parseSupportMetricValue(draft.metric, draft.targetValue),
    comparison: draft.comparison,
    channel: draft.channel.trim().toUpperCase() || null,
    granularity: draft.granularity,
    observationType: draft.observationType,
    scopeType: draft.scopeType,
    userId: draft.scopeType === "USER" ? draft.userId : undefined,
    teamLabel: draft.scopeType === "TEAM" ? draft.teamLabel.trim() : undefined,
    teamId: draft.scopeType === "TEAM" ? draft.teamId : undefined,
    status: draft.status,
    startsAt: supportDayBoundaryIso(draft.startsAt, "start"),
    endsAt: supportDayBoundaryIso(draft.endsAt, "end")
  };
}
