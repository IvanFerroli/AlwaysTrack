import type { CurrentUser } from "@alwaystrack/shared";

export const supportMetricKeys = ["CSAT", "PRODUCTIVITY", "SLA", "RECLAME_AQUI_OPEN"] as const;
export type SupportMetricKey = (typeof supportMetricKeys)[number];

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
    aggregation: "WEIGHTED" | "SIMPLE";
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
  period: { from: string; to: string };
  agents: SupportAgent[];
  teams: SupportTeam[];
  summary: Array<{
    metric: SupportMetricKey;
    latest: number | null;
    average: number | null;
    samples: number;
    aggregation: "WEIGHTED" | "SIMPLE";
  }>;
  entries: SupportKpiEntry[];
  pendingReviewCount: number;
  campaigns: SupportCampaign[];
}

export interface SupportCampaignsResponse {
  canManage: boolean;
  items: SupportCampaign[];
  teams: SupportTeam[];
}

export interface SupportKpiDraft {
  id: string;
  metric: SupportMetricKey;
  value: string;
  sampleSize: string;
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
  metric: SupportMetricKey;
  targetValue: string;
  comparison: SupportComparison;
  scopeType: SupportScopeType;
  userId: string;
  teamLabel: string;
  teamId: string;
  status: SupportCampaignStatus;
  startsAt: string;
  endsAt: string;
}

export const supportMetricLabels: Record<SupportMetricKey, string> = {
  CSAT: "CSAT",
  PRODUCTIVITY: "Produtividade",
  SLA: "SLA",
  RECLAME_AQUI_OPEN: "Reclame Aqui em aberto"
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

export function formatSupportMetricValue(metric: SupportMetricKey, value: number | null) {
  if (value === null) return "-";
  if (metric === "CSAT" || metric === "SLA") {
    return `${value.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
  }
  return value.toLocaleString("pt-BR", { maximumFractionDigits: 1 });
}

export function supportScopeLabel(item: Pick<SupportCampaign | SupportKpiEntry, "scopeType" | "user" | "team" | "teamLabel">) {
  if (item.scopeType === "USER") return item.user?.name || "Pessoa não identificada";
  if (item.scopeType === "TEAM") return item.team?.name || item.teamLabel || "Equipe não identificada";
  return supportScopeLabels.ORGANIZATION;
}

export function emptySupportKpiDraft(today = supportDateInputValue()): SupportKpiDraft {
  return {
    id: "",
    metric: "CSAT",
    value: "",
    sampleSize: "",
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
  return {
    id: entry.id,
    metric: entry.metric,
    value: String(entry.value),
    sampleSize: entry.denominator == null ? "" : String(entry.denominator),
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
  if (draft.id) {
    return {
      value: Number(draft.value),
      sampleSize: draft.sampleSize ? Number(draft.sampleSize) : undefined,
      source: draft.source || null,
      note: draft.note || null
    };
  }
  return {
    metric: draft.metric,
    value: Number(draft.value),
    sampleSize: draft.sampleSize ? Number(draft.sampleSize) : undefined,
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
    metric: "CSAT",
    targetValue: "",
    comparison: "GTE",
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
  return {
    id: item.id,
    name: item.name,
    description: item.description ?? "",
    metric: item.metric,
    targetValue: String(item.targetValue),
    comparison: item.comparison,
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
    targetValue: Number(draft.targetValue),
    comparison: draft.comparison,
    scopeType: draft.scopeType,
    userId: draft.scopeType === "USER" ? draft.userId : undefined,
    teamLabel: draft.scopeType === "TEAM" ? draft.teamLabel.trim() : undefined,
    teamId: draft.scopeType === "TEAM" ? draft.teamId : undefined,
    status: draft.status,
    startsAt: supportDayBoundaryIso(draft.startsAt, "start"),
    endsAt: supportDayBoundaryIso(draft.endsAt, "end")
  };
}
