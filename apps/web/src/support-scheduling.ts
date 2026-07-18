import type { CurrentUser } from "@alwaystrack/shared";
import type { SupportAgent, SupportTeam } from "./support-operations";

export const SUPPORT_SCHEDULE_POLL_INTERVAL_MS = 45_000;
export const SUPPORT_SCHEDULE_TIMEZONE = "America/Sao_Paulo";

export type SupportScheduleScope = "SELF" | "TEAM";
export type SupportScheduleDayStatusValue = "WORKING" | "DOUBLE" | "OFF" | "UNPUBLISHED";
export type SupportShiftKind = "REGULAR" | "EXTRA" | "DOUBLE" | string;
export type SupportExtraClaimStatus = "PENDING" | "APPROVED" | "REJECTED" | string;
export type SupportShiftOfferStatus = "OPEN" | "MANAGER_PENDING" | "APPLIED" | "REJECTED" | "CANCELLED" | string;
export type SupportShiftOfferType = "SWAP" | "OFFER";

export interface SupportScheduleIntent {
  date?: string;
  teamId?: string;
  userId?: string;
  scheduleId?: string;
  offerId?: string;
  swapId?: string;
  tab?: string;
}

export interface SupportSchedulePauseBooking {
  id: string;
  status: string;
  rescheduleRequiredAt?: string | null;
  slot: {
    id: string;
    label: string | null;
    startsAt: string;
    endsAt: string;
  };
}

export interface SupportScheduleDayStatus {
  localDate: string;
  status: SupportScheduleDayStatusValue;
  occurrenceIds: string[];
}

export interface SupportShiftOccurrence {
  id: string;
  organizationId: string;
  teamId: string;
  userId: string;
  assignmentId: string | null;
  patternVersionId: string | null;
  ruleVersionId: string;
  localDate: string;
  startsAt: string;
  endsAt: string;
  kind: SupportShiftKind;
  status: string;
  sourceType: string;
  sourceId: string | null;
  ruleSnapshotJson: string;
  publishedAt: string;
  user: Pick<SupportAgent, "id" | "name">;
  team: SupportTeam;
  pauseBookings: SupportSchedulePauseBooking[];
}

export interface SupportExtraShiftClaim {
  id: string;
  userId: string;
  status: SupportExtraClaimStatus;
  occurrenceId: string | null;
  decisionReason: string | null;
  note?: string | null;
  user?: Pick<SupportAgent, "id" | "name">;
}

export interface SupportExtraShiftSlot {
  id: string;
  organizationId: string;
  teamId: string;
  ruleVersionId: string;
  startsAt: string;
  endsAt: string;
  capacity: number;
  status: string;
  note: string | null;
  policySnapshotJson: string;
  team: SupportTeam;
  claims: SupportExtraShiftClaim[];
}

export interface SupportOfferOccurrence {
  id: string;
  userId: string;
  localDate: string;
  startsAt: string;
  endsAt: string;
  status: string;
}

export interface SupportShiftOffer {
  id: string;
  organizationId: string;
  teamId: string;
  occurrenceId: string;
  targetOccurrenceId: string | null;
  offeredById: string;
  targetUserId: string | null;
  ruleVersionId: string;
  type: SupportShiftOfferType;
  status: SupportShiftOfferStatus;
  note: string | null;
  expiresAt: string | null;
  peerAcceptedAt: string | null;
  decisionReason: string | null;
  createdAt: string;
  updatedAt: string;
  offeredBy: Pick<SupportAgent, "id" | "name">;
  targetUser: Pick<SupportAgent, "id" | "name"> | null;
  occurrence: SupportOfferOccurrence;
  targetOccurrence: SupportOfferOccurrence | null;
}

export interface SupportScheduleCalendarResponse {
  from: string;
  to: string;
  scope: SupportScheduleScope;
  teamId: string | null;
  userId: string | null;
  occurrences: SupportShiftOccurrence[];
  extraSlots: SupportExtraShiftSlot[];
  offers: SupportShiftOffer[];
  /** Present for SELF calendars; TEAM calendars currently omit day-level status. */
  dayStatuses?: SupportScheduleDayStatus[];
}

export interface SupportScheduleRosterResponse {
  teams: SupportTeam[];
  agents: SupportAgent[];
  selectedTeamId: string | null;
}

export interface SupportScheduleRuleVersion {
  id: string;
  teamId: string;
  version: number;
  timezone: string;
  maxDailyMinutes: number;
  maxWeeklyMinutes: number;
  minimumRestMinutes: number;
  minimumNoticeMinutes: number;
  maxMonthlyExchanges: number;
  autoApproveEligibleSwaps: boolean;
  requireManagerExtraApproval: boolean;
  effectiveFrom: string;
  effectiveTo: string | null;
}

export type SupportScheduleRuleDraftStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED" | string;

export interface SupportScheduleRuleFields {
  timezone: string;
  maxDailyMinutes: number;
  maxWeeklyMinutes: number;
  minimumRestMinutes: number;
  minimumNoticeMinutes: number;
  maxMonthlyExchanges: number;
  autoApproveEligibleSwaps: boolean;
  requireManagerExtraApproval: boolean;
  effectiveFrom: string;
  effectiveTo: string | null;
}

export interface SupportScheduleRuleDraft extends SupportScheduleRuleFields {
  id: string;
  teamId: string;
  status: SupportScheduleRuleDraftStatus;
  revision: number;
  baseVersionId: string | null;
  normalizedPayloadJson: string;
  checksum: string;
  publishedVersionId: string | null;
  archivedAt: string | null;
  updatedAt: string;
}

export type SupportScheduleRuleValue = string | number | boolean | null;

export interface SupportScheduleRuleDiffSet {
  versionId: string | null;
  changedKeys: string[];
  changes: Record<string, { before: SupportScheduleRuleValue; after: SupportScheduleRuleValue }>;
}

export interface SupportScheduleRulePreview {
  draftId: string;
  revision: number;
  payload: SupportScheduleRuleFields;
  normalizedPayloadJson: string;
  checksum: string;
  diff: {
    base: SupportScheduleRuleDiffSet;
    latest: SupportScheduleRuleDiffSet;
  };
  window: {
    from: string;
    to: string;
    effectiveFrom: string;
    effectiveTo: string | null;
  };
  materialization: SupportMaterializationResult;
}

export interface SupportScheduleRuleDraftResult {
  draft: SupportScheduleRuleDraft;
  payload: SupportScheduleRuleFields;
  checksum: string;
}

export interface SupportScheduleRulePublishResult extends SupportScheduleRuleDraftResult {
  rule: SupportScheduleRuleVersion;
  snapshot: SupportScheduleRuleFields & { id: string; teamId: string; version: number };
  idempotent?: boolean;
}

export interface SupportPlanningPattern extends SupportCreatedPattern {
  weekdays: number[];
  timezone: string;
  effectiveFrom: string;
  effectiveTo: string | null;
}

export interface SupportShiftAssignment {
  id: string;
  teamId: string;
  userId: string;
  patternVersionId: string;
  validFrom: string;
  validTo: string | null;
  user: SupportAgent;
  patternVersion: Pick<SupportPlanningPattern, "id" | "name" | "version" | "startMinute" | "endMinute" | "timezone"> & {
    weekdaysJson: string;
  };
}

export interface SupportSchedulePlanningResponse {
  teamId: string;
  rules: SupportScheduleRuleVersion[];
  ruleDrafts: SupportScheduleRuleDraft[];
  archivedRuleVersions: SupportScheduleRuleVersion[];
  patterns: SupportPlanningPattern[];
  assignments: SupportShiftAssignment[];
}

export interface SupportCreatedPattern {
  id: string;
  teamId: string;
  name: string;
  version: number;
  startMinute: number;
  endMinute: number;
}

export interface SupportMaterializationResult {
  candidates: number;
  conflicts: Array<{ assignmentId: string; localDate: string; reason: string }>;
  createdCount: number;
  updatedCount: number;
  reusedCount: number;
  preservedCount: number;
  dryRun: boolean;
}

export interface SupportCoverageInterval {
  localDate: string;
  startsAt: string;
  endsAt: string;
  activeCount: number;
  agents: string[];
}

export const supportShiftKindLabels: Record<string, string> = {
  REGULAR: "Turno-base",
  EXTRA: "Extra",
  DOUBLE: "Turno extra"
};

export const supportOfferStatusLabels: Record<string, string> = {
  OPEN: "Aguardando aceite",
  MANAGER_PENDING: "Aguardando gestão",
  APPLIED: "Aplicada",
  REJECTED: "Recusada",
  CANCELLED: "Cancelada"
};

export const supportClaimStatusLabels: Record<string, string> = {
  PENDING: "Aguardando gestão",
  APPROVED: "Confirmado",
  REJECTED: "Não aprovado"
};

export function isSupportScheduleManager(user: Pick<CurrentUser, "role">) {
  return user.role === "ADMIN" || user.role === "GESTOR";
}

export function supportScheduleDate(date = new Date(), timezone = SUPPORT_SCHEDULE_TIMEZONE) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function shiftSupportScheduleDate(value: string, days: number) {
  const date = new Date(`${value}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function supportScheduleWeekStart(value: string) {
  const date = new Date(`${value}T12:00:00.000Z`);
  const daysSinceMonday = (date.getUTCDay() + 6) % 7;
  return shiftSupportScheduleDate(value, -daysSinceMonday);
}

export function supportScheduleWeekDates(value: string) {
  const start = supportScheduleWeekStart(value);
  return Array.from({ length: 7 }, (_, index) => shiftSupportScheduleDate(start, index));
}

export function supportScheduleQuery(input: {
  date: string;
  scope: SupportScheduleScope;
  teamId?: string;
  userId?: string;
}) {
  const from = supportScheduleWeekStart(input.date);
  const query = new URLSearchParams({
    from,
    to: shiftSupportScheduleDate(from, 6),
    scope: input.scope
  });
  if (input.teamId) query.set("teamId", input.teamId);
  if (input.userId) query.set("userId", input.userId);
  return `/v1/support/schedules?${query.toString()}`;
}

export function supportScheduleHref(intent: SupportScheduleIntent) {
  const query = new URLSearchParams();
  for (const key of ["date", "teamId", "userId", "offerId", "tab"] as const) {
    const value = intent[key];
    if (value) query.set(key, value);
  }
  return query.size ? `/escalas?${query.toString()}` : "/escalas";
}

function timezoneOffsetMs(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23"
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour),
    Number(values.minute),
    Number(values.second)
  ) - date.getTime();
}

export function supportScheduleLocalDateTimeIso(value: string, timezone = SUPPORT_SCHEDULE_TIMEZONE) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!match) throw new Error("Data e horário inválidos.");
  const localAsUtc = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), Number(match[4]), Number(match[5]));
  let instant = localAsUtc;
  for (let iteration = 0; iteration < 3; iteration += 1) {
    instant = localAsUtc - timezoneOffsetMs(new Date(instant), timezone);
  }
  return new Date(instant).toISOString();
}

export function supportScheduleLocalDateTimeValue(value: string, timezone = SUPPORT_SCHEDULE_TIMEZONE) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).formatToParts(new Date(value));
  const fields = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${fields.year}-${fields.month}-${fields.day}T${fields.hour}:${fields.minute}`;
}

export function supportMinutesFromTime(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

export function supportTimeFromMinutes(value: number) {
  const normalized = ((value % 1440) + 1440) % 1440;
  return `${String(Math.floor(normalized / 60)).padStart(2, "0")}:${String(normalized % 60).padStart(2, "0")}`;
}

export function formatSupportScheduleTime(value: string, timezone = SUPPORT_SCHEDULE_TIMEZONE) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(new Date(value));
}

export function formatSupportScheduleDay(value: string, options: { compact?: boolean } = {}) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
    weekday: options.compact ? "short" : "long",
    day: "2-digit",
    month: "2-digit"
  }).format(new Date(`${value}T12:00:00.000Z`));
}

export function supportCalendarTimezone(calendar: SupportScheduleCalendarResponse | null) {
  const snapshots = [
    ...(calendar?.occurrences.map((item) => item.ruleSnapshotJson) ?? []),
    ...(calendar?.extraSlots.map((item) => item.policySnapshotJson) ?? [])
  ];
  for (const snapshot of snapshots) {
    try {
      const parsed = JSON.parse(snapshot) as { timezone?: unknown };
      if (typeof parsed.timezone === "string" && parsed.timezone) return parsed.timezone;
    } catch {
      continue;
    }
  }
  return SUPPORT_SCHEDULE_TIMEZONE;
}

export function buildSupportCoverageIntervals(occurrences: SupportShiftOccurrence[]) {
  const byDate = new Map<string, SupportShiftOccurrence[]>();
  for (const occurrence of occurrences) {
    byDate.set(occurrence.localDate, [...(byDate.get(occurrence.localDate) ?? []), occurrence]);
  }
  const intervals: SupportCoverageInterval[] = [];
  for (const [localDate, dayOccurrences] of byDate) {
    const boundaries = [...new Set(dayOccurrences.flatMap((item) => [item.startsAt, item.endsAt]))]
      .sort((left, right) => new Date(left).getTime() - new Date(right).getTime());
    for (let index = 0; index < boundaries.length - 1; index += 1) {
      const startsAt = boundaries[index];
      const endsAt = boundaries[index + 1];
      const active = dayOccurrences.filter((item) => item.startsAt < endsAt && item.endsAt > startsAt);
      if (!active.length) continue;
      intervals.push({
        localDate,
        startsAt,
        endsAt,
        activeCount: active.length,
        agents: active.map((item) => item.user.name).sort((left, right) => left.localeCompare(right, "pt-BR"))
      });
    }
  }
  return intervals.sort((left, right) => left.localDate.localeCompare(right.localDate) || left.startsAt.localeCompare(right.startsAt));
}

export function supportCoveragePosition(interval: SupportCoverageInterval, timezone = SUPPORT_SCHEDULE_TIMEZONE) {
  const startParts = formatSupportScheduleTime(interval.startsAt, timezone).split(":").map(Number);
  const endParts = formatSupportScheduleTime(interval.endsAt, timezone).split(":").map(Number);
  const start = startParts[0] * 60 + startParts[1];
  let end = endParts[0] * 60 + endParts[1];
  if (end <= start) end += 1440;
  return {
    left: `${Math.max(0, Math.min(100, (start / 1440) * 100))}%`,
    width: `${Math.max(0.6, Math.min(100 - (start / 1440) * 100, ((end - start) / 1440) * 100))}%`
  };
}
