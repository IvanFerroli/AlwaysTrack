import { createHash } from "node:crypto";
import {
  Prisma,
  type PrismaClient,
  type SupportScheduleRuleDraft,
  type SupportScheduleRuleVersion,
  type SupportShiftOccurrence,
} from "@prisma/client";
import {
  commercialManagerRoles,
  supportOperationsRoles,
  type CurrentUser,
} from "@alwaystrack/shared";
import { emitInAppNotifications } from "../notifications/notifications.service.js";

export type SupportSchedulingErrorCode =
  "INVALID_INPUT" | "FORBIDDEN" | "NOT_FOUND" | "CONFLICT" | "RULE_VIOLATION";

export class SupportSchedulingError extends Error {
  constructor(
    public readonly code: SupportSchedulingErrorCode,
    public readonly details: string[] = [],
  ) {
    super(code);
  }
}

interface ConflictAuditContext {
  action: string;
  entityType: string;
  entityId: string;
  metadata: Record<string, unknown>;
}

const conflictAuditContexts = new WeakMap<
  SupportSchedulingError,
  ConflictAuditContext
>();

type DatabaseClient = PrismaClient | Prisma.TransactionClient;

type RuleLimits = Pick<
  SupportScheduleRuleVersion,
  | "id"
  | "organizationId"
  | "teamId"
  | "version"
  | "timezone"
  | "maxDailyMinutes"
  | "maxWeeklyMinutes"
  | "minimumRestMinutes"
  | "minimumNoticeMinutes"
  | "maxMonthlyExchanges"
  | "autoApproveEligibleSwaps"
  | "requireManagerExtraApproval"
  | "effectiveFrom"
  | "effectiveTo"
>;

export interface SupportWorkInterval {
  id?: string;
  userId: string;
  localDate: string;
  startsAt: Date;
  endsAt: Date;
}

export interface PublishedOccurrenceInterval extends SupportWorkInterval {
  id: string;
  status: string;
  teamId?: string;
}

export interface SupportCalendarInput {
  from: string;
  to: string;
  scope?: "SELF" | "TEAM";
  teamId?: string;
  userId?: string;
}

export type SupportScheduleDayStatusValue =
  | "WORKING"
  | "DOUBLE"
  | "OFF"
  | "UNPUBLISHED";

export interface SupportScheduleDayStatus {
  localDate: string;
  status: SupportScheduleDayStatusValue;
  occurrenceIds: string[];
}

interface SupportCalendarAssignment {
  id: string;
  organizationId: string;
  teamId: string;
  userId: string;
  patternVersionId: string;
  validFrom: Date;
  validTo: Date | null;
  active: boolean;
  patternVersion: {
    id: string;
    organizationId: string;
    teamId: string;
    startMinute: number;
    endMinute: number;
    weekdaysJson: string;
    timezone: string;
    active: boolean;
    effectiveFrom: Date;
    effectiveTo: Date | null;
  };
}

export interface MaterializeSupportShiftsInput {
  teamId: string;
  from: string;
  to: string;
  dryRun?: boolean;
}

interface MaterializeSupportShiftsInternalInput
  extends MaterializeSupportShiftsInput {
  ruleOverride?: RuleLimits;
}

export interface SupportSchedulePlanningInput {
  teamId: string;
}

export interface NormalizedSupportScheduleRulePayload {
  autoApproveEligibleSwaps: boolean;
  effectiveFrom: string;
  effectiveTo: string | null;
  maxDailyMinutes: number;
  maxMonthlyExchanges: number;
  maxWeeklyMinutes: number;
  minimumNoticeMinutes: number;
  minimumRestMinutes: number;
  requireManagerExtraApproval: boolean;
  timezone: string;
}

type StructuredRuleSource = Pick<
  SupportScheduleRuleDraft,
  | "timezone"
  | "maxDailyMinutes"
  | "maxWeeklyMinutes"
  | "minimumRestMinutes"
  | "minimumNoticeMinutes"
  | "maxMonthlyExchanges"
  | "autoApproveEligibleSwaps"
  | "requireManagerExtraApproval"
  | "effectiveFrom"
  | "effectiveTo"
>;

type RuleData = Omit<
  NormalizedSupportScheduleRulePayload,
  "effectiveFrom" | "effectiveTo"
> & {
  effectiveFrom: Date;
  effectiveTo: Date | null;
  normalizedPayload: NormalizedSupportScheduleRulePayload;
  normalizedPayloadJson: string;
  checksum: string;
};

const structuredRuleKeys = [
  "timezone",
  "maxDailyMinutes",
  "maxWeeklyMinutes",
  "minimumRestMinutes",
  "minimumNoticeMinutes",
  "maxMonthlyExchanges",
  "autoApproveEligibleSwaps",
  "requireManagerExtraApproval",
  "effectiveFrom",
  "effectiveTo",
] as const;

const activeOfferStatuses = ["OPEN", "MANAGER_PENDING"];
const formatterCache = new Map<string, Intl.DateTimeFormat>();

type SchedulingPermission = "read" | "manage" | "exchange" | "approve";

function ensurePermission(
  actor: CurrentUser,
  permission: SchedulingPermission,
) {
  const roles =
    permission === "read" || permission === "exchange"
      ? supportOperationsRoles
      : commercialManagerRoles;
  if (!(roles as readonly string[]).includes(actor.role))
    throw new SupportSchedulingError("FORBIDDEN");
}

function isManager(actor: CurrentUser) {
  return actor.role === "ADMIN" || actor.role === "GESTOR";
}

function inputObject(input: unknown) {
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw new SupportSchedulingError("INVALID_INPUT");
  return input as Record<string, unknown>;
}

function requiredText(
  input: Record<string, unknown>,
  key: string,
  maxLength = 120,
) {
  const value = input[key];
  if (
    typeof value !== "string" ||
    !value.trim() ||
    value.trim().length > maxLength
  ) {
    throw new SupportSchedulingError("INVALID_INPUT");
  }
  return value.trim();
}

function optionalText(
  input: Record<string, unknown>,
  key: string,
  maxLength = 300,
) {
  const value = input[key];
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string" || value.trim().length > maxLength)
    throw new SupportSchedulingError("INVALID_INPUT");
  return value.trim();
}

function integer(
  input: Record<string, unknown>,
  key: string,
  fallback: number,
  minimum: number,
  maximum: number,
) {
  const value = input[key] ?? fallback;
  if (
    !Number.isInteger(value) ||
    (value as number) < minimum ||
    (value as number) > maximum
  ) {
    throw new SupportSchedulingError("INVALID_INPUT");
  }
  return value as number;
}

function optionalBoolean(
  input: Record<string, unknown>,
  key: string,
  fallback: boolean,
) {
  const value = input[key];
  if (value === undefined) return fallback;
  if (typeof value !== "boolean")
    throw new SupportSchedulingError("INVALID_INPUT");
  return value;
}

function assertOnlyKeys(
  input: Record<string, unknown>,
  allowed: readonly string[],
) {
  if (Object.keys(input).some((key) => !allowed.includes(key)))
    throw new SupportSchedulingError("INVALID_INPUT");
}

function requiredRevision(input: Record<string, unknown>) {
  const value = input.expectedRevision;
  if (!Number.isInteger(value) || (value as number) < 1)
    throw new SupportSchedulingError("INVALID_INPUT");
  return value as number;
}

function requiredChecksum(input: Record<string, unknown>) {
  const value = input.checksum;
  if (typeof value !== "string" || !/^[a-f0-9]{64}$/.test(value))
    throw new SupportSchedulingError("INVALID_INPUT");
  return value;
}

function dateTime(value: unknown) {
  const parsed =
    value instanceof Date
      ? new Date(value)
      : typeof value === "string"
        ? new Date(value)
        : null;
  if (!parsed || Number.isNaN(parsed.getTime()))
    throw new SupportSchedulingError("INVALID_INPUT");
  return parsed;
}

function optionalDateTime(value: unknown) {
  if (value === undefined || value === null || value === "") return null;
  return dateTime(value);
}

function assertValidRange(startsAt: Date, endsAt: Date) {
  if (endsAt <= startsAt) throw new SupportSchedulingError("INVALID_INPUT");
}

function assertTimezone(timezone: string) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone }).format(new Date());
  } catch {
    throw new SupportSchedulingError("INVALID_INPUT");
  }
}

function localDateParts(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  )
    return null;
  return { year, month, day };
}

export function isValidSupportLocalDate(value: string) {
  return localDateParts(value) !== null;
}

function requireLocalDate(value: unknown) {
  if (typeof value !== "string" || !isValidSupportLocalDate(value))
    throw new SupportSchedulingError("INVALID_INPUT");
  return value;
}

export function addSupportLocalDays(value: string, days: number) {
  const parts = localDateParts(value);
  if (!parts || !Number.isInteger(days))
    throw new SupportSchedulingError("INVALID_INPUT");
  const date = new Date(
    Date.UTC(parts.year, parts.month - 1, parts.day + days),
  );
  return date.toISOString().slice(0, 10);
}

function localDates(from: string, to: string) {
  if (from > to) throw new SupportSchedulingError("INVALID_INPUT");
  const result: string[] = [];
  for (let value = from; value <= to; value = addSupportLocalDays(value, 1)) {
    result.push(value);
    if (result.length > 62) throw new SupportSchedulingError("INVALID_INPUT");
  }
  return result;
}

function zonedFormatter(timezone: string) {
  const cached = formatterCache.get(timezone);
  if (cached) return cached;
  assertTimezone(timezone);
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  formatterCache.set(timezone, formatter);
  return formatter;
}

function zonedParts(value: Date, timezone: string) {
  const fields = Object.fromEntries(
    zonedFormatter(timezone)
      .formatToParts(value)
      .map((part) => [part.type, part.value]),
  );
  return {
    year: Number(fields.year),
    month: Number(fields.month),
    day: Number(fields.day),
    hour: Number(fields.hour),
    minute: Number(fields.minute),
    second: Number(fields.second),
  };
}

function matchesLocalMinute(
  value: Date,
  expected: {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
  },
  timezone: string,
) {
  const parts = zonedParts(value, timezone);
  return (
    parts.year === expected.year &&
    parts.month === expected.month &&
    parts.day === expected.day &&
    parts.hour === expected.hour &&
    parts.minute === expected.minute
  );
}

export function supportZonedDateTimeToUtc(
  localDate: string,
  minuteOfDay: number,
  timezone: string,
) {
  const parts = localDateParts(localDate);
  if (
    !parts ||
    !Number.isInteger(minuteOfDay) ||
    minuteOfDay < 0 ||
    minuteOfDay > 1439
  ) {
    throw new SupportSchedulingError("INVALID_INPUT");
  }
  assertTimezone(timezone);
  const expected = {
    ...parts,
    hour: Math.floor(minuteOfDay / 60),
    minute: minuteOfDay % 60,
  };
  const targetAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    expected.hour,
    expected.minute,
  );
  let candidate = new Date(targetAsUtc);
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const actual = zonedParts(candidate, timezone);
    const representedAsUtc = Date.UTC(
      actual.year,
      actual.month - 1,
      actual.day,
      actual.hour,
      actual.minute,
    );
    const correction = targetAsUtc - representedAsUtc;
    if (correction === 0) break;
    candidate = new Date(candidate.getTime() + correction);
  }
  const alternatives = [-120, -60, 0, 60, 120]
    .map((offset) => new Date(candidate.getTime() + offset * 60_000))
    .filter((value) => matchesLocalMinute(value, expected, timezone))
    .sort((left, right) => left.getTime() - right.getTime());
  if (!alternatives.length)
    throw new SupportSchedulingError("INVALID_INPUT", [
      "NON_EXISTENT_LOCAL_TIME",
    ]);
  return alternatives[0];
}

export function supportLocalDateForInstant(value: Date, timezone: string) {
  const parts = zonedParts(value, timezone);
  return `${String(parts.year).padStart(4, "0")}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

function shiftInterval(
  localDate: string,
  startMinute: number,
  endMinute: number,
  timezone: string,
) {
  const startsAt = supportZonedDateTimeToUtc(localDate, startMinute, timezone);
  const endDate =
    endMinute <= startMinute ? addSupportLocalDays(localDate, 1) : localDate;
  const endsAt = supportZonedDateTimeToUtc(endDate, endMinute, timezone);
  assertValidRange(startsAt, endsAt);
  return { startsAt, endsAt };
}

function durationMinutes(startsAt: Date, endsAt: Date) {
  return Math.round((endsAt.getTime() - startsAt.getTime()) / 60_000);
}

function weekdayForLocalDate(value: string) {
  const parts = localDateParts(value);
  if (!parts) throw new SupportSchedulingError("INVALID_INPUT");
  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day)).getUTCDay();
}

function mondayForLocalDate(value: string) {
  const weekday = weekdayForLocalDate(value);
  return addSupportLocalDays(value, -(weekday === 0 ? 6 : weekday - 1));
}

function broadUtcRange(from: string, to: string) {
  const startParts = localDateParts(from);
  const endParts = localDateParts(addSupportLocalDays(to, 1));
  if (!startParts || !endParts)
    throw new SupportSchedulingError("INVALID_INPUT");
  return {
    start: new Date(
      Date.UTC(startParts.year, startParts.month - 1, startParts.day) -
        24 * 60 * 60_000,
    ),
    end: new Date(
      Date.UTC(endParts.year, endParts.month - 1, endParts.day) +
        24 * 60 * 60_000,
    ),
  };
}

function stableJsonValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableJsonValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, item]) => item !== undefined)
        .sort(([left], [right]) =>
          left < right ? -1 : left > right ? 1 : 0,
        )
        .map(([key, item]) => [key, stableJsonValue(item)]),
    );
  }
  return value;
}

export function stableSupportScheduleRuleJson(value: unknown) {
  const serialized = JSON.stringify(stableJsonValue(value));
  if (serialized === undefined)
    throw new SupportSchedulingError("INVALID_INPUT");
  return serialized;
}

export function normalizeSupportScheduleRulePayload(
  source: StructuredRuleSource,
): NormalizedSupportScheduleRulePayload {
  return {
    autoApproveEligibleSwaps: source.autoApproveEligibleSwaps,
    effectiveFrom: source.effectiveFrom.toISOString(),
    effectiveTo: source.effectiveTo?.toISOString() ?? null,
    maxDailyMinutes: source.maxDailyMinutes,
    maxMonthlyExchanges: source.maxMonthlyExchanges,
    maxWeeklyMinutes: source.maxWeeklyMinutes,
    minimumNoticeMinutes: source.minimumNoticeMinutes,
    minimumRestMinutes: source.minimumRestMinutes,
    requireManagerExtraApproval: source.requireManagerExtraApproval,
    timezone: source.timezone,
  };
}

export function checksumSupportScheduleRulePayload(
  payload: NormalizedSupportScheduleRulePayload,
) {
  return createHash("sha256")
    .update(stableSupportScheduleRuleJson(payload), "utf8")
    .digest("hex");
}

function buildRuleData(
  body: Record<string, unknown>,
  fallback?: StructuredRuleSource,
  options: { requireExplicitEffectiveFrom?: boolean; now?: Date } = {},
): RuleData {
  const timezone =
    optionalText(body, "timezone", 80) ??
    fallback?.timezone ??
    "America/Sao_Paulo";
  assertTimezone(timezone);
  if (options.requireExplicitEffectiveFrom && body.effectiveFrom === undefined)
    throw new SupportSchedulingError("INVALID_INPUT");
  const effectiveFrom =
    body.effectiveFrom === undefined
      ? fallback?.effectiveFrom
      : dateTime(body.effectiveFrom);
  if (!effectiveFrom) throw new SupportSchedulingError("INVALID_INPUT");
  const effectiveTo =
    body.effectiveTo === undefined
      ? (fallback?.effectiveTo ?? null)
      : optionalDateTime(body.effectiveTo);
  if (effectiveTo && effectiveTo <= effectiveFrom)
    throw new SupportSchedulingError("INVALID_INPUT");
  if (effectiveFrom <= (options.now ?? new Date()))
    throw new SupportSchedulingError("RULE_VIOLATION", [
      "RETROACTIVE_RULE_VERSION",
    ]);

  const structured = {
    timezone,
    maxDailyMinutes: integer(
      body,
      "maxDailyMinutes",
      fallback?.maxDailyMinutes ?? 840,
      60,
      1440,
    ),
    maxWeeklyMinutes: integer(
      body,
      "maxWeeklyMinutes",
      fallback?.maxWeeklyMinutes ?? 3600,
      60,
      10080,
    ),
    minimumRestMinutes: integer(
      body,
      "minimumRestMinutes",
      fallback?.minimumRestMinutes ?? 600,
      0,
      1440,
    ),
    minimumNoticeMinutes: integer(
      body,
      "minimumNoticeMinutes",
      fallback?.minimumNoticeMinutes ?? 60,
      0,
      43_200,
    ),
    maxMonthlyExchanges: integer(
      body,
      "maxMonthlyExchanges",
      fallback?.maxMonthlyExchanges ?? 8,
      0,
      100,
    ),
    autoApproveEligibleSwaps: optionalBoolean(
      body,
      "autoApproveEligibleSwaps",
      fallback?.autoApproveEligibleSwaps ?? true,
    ),
    requireManagerExtraApproval: optionalBoolean(
      body,
      "requireManagerExtraApproval",
      fallback?.requireManagerExtraApproval ?? true,
    ),
    effectiveFrom,
    effectiveTo,
  };
  if (structured.maxWeeklyMinutes < structured.maxDailyMinutes)
    throw new SupportSchedulingError("INVALID_INPUT");

  const normalizedPayload = normalizeSupportScheduleRulePayload(structured);
  const normalizedPayloadJson =
    stableSupportScheduleRuleJson(normalizedPayload);
  return {
    ...structured,
    normalizedPayload,
    normalizedPayloadJson,
    checksum: checksumSupportScheduleRulePayload(normalizedPayload),
  };
}

function normalizedRuleDiff(
  reference: StructuredRuleSource | null,
  current: StructuredRuleSource,
) {
  const before = reference
    ? normalizeSupportScheduleRulePayload(reference)
    : null;
  const after = normalizeSupportScheduleRulePayload(current);
  const changedKeys = Object.keys(after)
    .filter(
      (key) =>
        !before ||
        before[key as keyof NormalizedSupportScheduleRulePayload] !==
          after[key as keyof NormalizedSupportScheduleRulePayload],
    )
    .sort();
  return {
    changedKeys,
    changes: Object.fromEntries(
      changedKeys.map((key) => [
        key,
        {
          before:
            before?.[key as keyof NormalizedSupportScheduleRulePayload] ??
            null,
          after: after[key as keyof NormalizedSupportScheduleRulePayload],
        },
      ]),
    ),
  };
}

function ruleSnapshot(rule: RuleLimits) {
  return {
    id: rule.id,
    version: rule.version,
    organizationId: rule.organizationId,
    teamId: rule.teamId,
    timezone: rule.timezone,
    maxDailyMinutes: rule.maxDailyMinutes,
    maxWeeklyMinutes: rule.maxWeeklyMinutes,
    minimumRestMinutes: rule.minimumRestMinutes,
    minimumNoticeMinutes: rule.minimumNoticeMinutes,
    maxMonthlyExchanges: rule.maxMonthlyExchanges,
    autoApproveEligibleSwaps: rule.autoApproveEligibleSwaps,
    requireManagerExtraApproval: rule.requireManagerExtraApproval,
    effectiveFrom: rule.effectiveFrom.toISOString(),
    effectiveTo: rule.effectiveTo?.toISOString() ?? null,
  };
}

function snapshotJson(rule: RuleLimits) {
  return JSON.stringify(ruleSnapshot(rule));
}

function scheduleHref(input: {
  date: string;
  teamId: string;
  offerId?: string;
  claimId?: string;
  startsAt?: Date;
}) {
  const query = new URLSearchParams({ date: input.date, teamId: input.teamId });
  if (input.offerId) query.set("offerId", input.offerId);
  if (input.claimId) query.set("claimId", input.claimId);
  if (input.startsAt) query.set("at", input.startsAt.toISOString());
  query.set(
    "tab",
    input.offerId ? "trocas" : input.claimId ? "extras" : "calendario",
  );
  return `/escalas?${query.toString()}`;
}

function retryableTransactionError(error: unknown, retryUnique: boolean) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error.code === "P2034" || (retryUnique && error.code === "P2002"))
  );
}

async function serializable<T>(
  prisma: PrismaClient,
  work: (tx: Prisma.TransactionClient) => Promise<T>,
  retryUnique = false,
) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await prisma.$transaction(work, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      });
    } catch (error) {
      if (retryableTransactionError(error, retryUnique) && attempt < 2)
        continue;
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "P2002"
      ) {
        throw new SupportSchedulingError("CONFLICT");
      }
      throw error;
    }
  }
  throw new SupportSchedulingError("CONFLICT");
}

async function ensureTeam(
  db: DatabaseClient,
  organizationId: string,
  teamId: string,
) {
  const team = await db.supportTeam.findFirst({
    where: { id: teamId, organizationId, active: true },
    select: { id: true, name: true },
  });
  if (!team) throw new SupportSchedulingError("NOT_FOUND");
  return team;
}

async function scopedRuleDraft(
  db: DatabaseClient,
  actor: CurrentUser,
  draftId: string,
) {
  const draft = await db.supportScheduleRuleDraft.findFirst({
    where: { id: draftId, organizationId: actor.organizationId },
  });
  if (!draft) throw new SupportSchedulingError("NOT_FOUND");
  return draft;
}

async function scopedBaseRuleVersion(
  db: DatabaseClient,
  actor: CurrentUser,
  teamId: string,
  baseVersionId: string | null,
) {
  if (!baseVersionId) return null;
  const version = await db.supportScheduleRuleVersion.findFirst({
    where: {
      id: baseVersionId,
      organizationId: actor.organizationId,
      teamId,
    },
  });
  if (!version) throw new SupportSchedulingError("NOT_FOUND");
  return version;
}

function draftConflict(
  draft: SupportScheduleRuleDraft,
  reason: string,
  metadata: Record<string, unknown> = {},
) {
  const error = new SupportSchedulingError("CONFLICT", [reason]);
  conflictAuditContexts.set(error, {
    action: "support_schedule.rule_draft.conflict",
    entityType: "SupportScheduleRuleDraft",
    entityId: draft.id,
    metadata: {
      teamId: draft.teamId,
      revision: draft.revision,
      checksum: draft.checksum,
      diffKeys: [],
      reason,
      ...metadata,
    },
  });
  return error;
}

function ruleVersionConflict(
  version: SupportScheduleRuleVersion,
  reason: string,
) {
  const error = new SupportSchedulingError("CONFLICT", [reason]);
  conflictAuditContexts.set(error, {
    action: "support_schedule.rule_version.conflict",
    entityType: "SupportScheduleRuleVersion",
    entityId: version.id,
    metadata: {
      teamId: version.teamId,
      revision: null,
      checksum: version.checksum,
      diffKeys: [],
      ruleVersionId: version.id,
      version: version.version,
      reason,
    },
  });
  return error;
}

function assertDraftCas(
  draft: SupportScheduleRuleDraft,
  expectedRevision: number,
  expectedChecksum?: string,
) {
  if (draft.revision !== expectedRevision)
    throw draftConflict(draft, "STALE_REVISION", { expectedRevision });
  if (expectedChecksum !== undefined && draft.checksum !== expectedChecksum)
    throw draftConflict(draft, "STALE_CHECKSUM", { expectedRevision });
}

function assertEditableDraft(draft: SupportScheduleRuleDraft) {
  if (draft.status !== "DRAFT")
    throw draftConflict(draft, `DRAFT_STATUS_${draft.status}`);
}

async function ensureSupportUser(
  db: DatabaseClient,
  organizationId: string,
  userId: string,
) {
  const user = await db.user.findFirst({
    where: { id: userId, organizationId, role: "SAC", active: true },
    select: { id: true, name: true },
  });
  if (!user) throw new SupportSchedulingError("NOT_FOUND");
  return user;
}

async function membershipCovering(
  db: DatabaseClient,
  organizationId: string,
  teamId: string,
  userId: string,
  startsAt: Date,
  endsAt: Date,
) {
  return db.supportTeamMembership.findFirst({
    where: {
      organizationId,
      teamId,
      userId,
      validFrom: { lte: startsAt },
      OR: [{ validTo: null }, { validTo: { gte: endsAt } }],
    },
    select: { id: true, validFrom: true, validTo: true },
  });
}

async function ensureMembershipCovering(
  db: DatabaseClient,
  organizationId: string,
  teamId: string,
  userId: string,
  startsAt: Date,
  endsAt: Date,
) {
  const membership = await membershipCovering(
    db,
    organizationId,
    teamId,
    userId,
    startsAt,
    endsAt,
  );
  if (!membership) throw new SupportSchedulingError("FORBIDDEN");
  return membership;
}

async function effectiveRule(
  db: DatabaseClient,
  organizationId: string,
  teamId: string,
  at: Date,
) {
  const rule = await db.supportScheduleRuleVersion.findFirst({
    where: {
      organizationId,
      teamId,
      active: true,
      effectiveFrom: { lte: at },
      OR: [{ effectiveTo: null }, { effectiveTo: { gt: at } }],
    },
    orderBy: [{ effectiveFrom: "desc" }, { version: "desc" }],
  });
  if (!rule)
    throw new SupportSchedulingError("RULE_VIOLATION", ["NO_EFFECTIVE_RULE"]);
  return rule;
}

async function audit(
  tx: DatabaseClient,
  actor: CurrentUser,
  action: string,
  entityType: string,
  entityId: string,
  metadata: unknown,
) {
  await tx.auditLog.create({
    data: {
      organizationId: actor.organizationId,
      actorId: actor.id,
      action,
      entityType,
      entityId,
      metadataJson: JSON.stringify(metadata),
    },
  });
}

async function withConflictAudit<T>(
  prisma: PrismaClient,
  actor: CurrentUser,
  work: () => Promise<T>,
) {
  try {
    return await work();
  } catch (error) {
    if (error instanceof SupportSchedulingError) {
      const context = conflictAuditContexts.get(error);
      if (context) {
        try {
          await audit(
            prisma,
            actor,
            context.action,
            context.entityType,
            context.entityId,
            context.metadata,
          );
        } catch {
          // The governed conflict remains the primary operation result.
        }
      }
    }
    throw error;
  }
}

export function calculatePublishedOccurrenceCoverage(
  occurrences: PublishedOccurrenceInterval[],
  startsAt: Date,
  endsAt: Date,
  options: { excludeUserIds?: string[] } = {},
) {
  assertValidRange(startsAt, endsAt);
  const excluded = new Set(options.excludeUserIds ?? []);
  const covering = occurrences.filter(
    (occurrence) =>
      occurrence.status === "PUBLISHED" &&
      occurrence.startsAt <= startsAt &&
      occurrence.endsAt >= endsAt &&
      !excluded.has(occurrence.userId),
  );
  const userIds = [
    ...new Set(covering.map((occurrence) => occurrence.userId)),
  ].sort();
  return {
    count: userIds.length,
    userIds,
    occurrenceIds: covering.map((occurrence) => occurrence.id),
  };
}

export async function findPublishedOccurrenceCoveringInterval(
  db: DatabaseClient,
  input: {
    organizationId: string;
    userId: string;
    startsAt: Date;
    endsAt: Date;
    teamId?: string;
  },
) {
  assertValidRange(input.startsAt, input.endsAt);
  return db.supportShiftOccurrence.findFirst({
    where: {
      organizationId: input.organizationId,
      userId: input.userId,
      teamId: input.teamId,
      status: "PUBLISHED",
      startsAt: { lte: input.startsAt },
      endsAt: { gte: input.endsAt },
    },
    orderBy: [{ startsAt: "desc" }, { publishedAt: "desc" }],
  });
}

export async function getPublishedOccurrenceCoverage(
  db: DatabaseClient,
  input: {
    organizationId: string;
    teamId: string;
    startsAt: Date;
    endsAt: Date;
    excludeUserIds?: string[];
  },
) {
  assertValidRange(input.startsAt, input.endsAt);
  const occurrences = await db.supportShiftOccurrence.findMany({
    where: {
      organizationId: input.organizationId,
      teamId: input.teamId,
      status: "PUBLISHED",
      startsAt: { lte: input.startsAt },
      endsAt: { gte: input.endsAt },
      userId: input.excludeUserIds?.length
        ? { notIn: input.excludeUserIds }
        : undefined,
    },
    select: {
      id: true,
      userId: true,
      teamId: true,
      localDate: true,
      startsAt: true,
      endsAt: true,
      status: true,
    },
  });
  return calculatePublishedOccurrenceCoverage(
    occurrences,
    input.startsAt,
    input.endsAt,
  );
}

export function supportWorkloadViolations(
  existing: SupportWorkInterval[],
  proposed: SupportWorkInterval[],
  rule: Pick<
    RuleLimits,
    | "maxDailyMinutes"
    | "maxWeeklyMinutes"
    | "minimumRestMinutes"
    | "minimumNoticeMinutes"
  >,
  options: { now?: Date; enforceNotice?: boolean } = {},
) {
  const now = options.now ?? new Date();
  const violations = new Set<string>();
  const userIds = [
    ...new Set([...existing, ...proposed].map((item) => item.userId)),
  ];

  for (const userId of userIds) {
    const userProposed = proposed.filter((item) => item.userId === userId);
    const proposedIds = new Set(
      userProposed.map((item) => item.id).filter(Boolean),
    );
    const intervals = [
      ...existing.filter(
        (item) =>
          item.userId === userId && (!item.id || !proposedIds.has(item.id)),
      ),
      ...userProposed,
    ].sort((left, right) => left.startsAt.getTime() - right.startsAt.getTime());

    for (const item of userProposed) {
      if (item.endsAt <= item.startsAt) violations.add("INVALID_INTERVAL");
      if (
        options.enforceNotice !== false &&
        item.startsAt.getTime() - now.getTime() <
          rule.minimumNoticeMinutes * 60_000
      ) {
        violations.add("MINIMUM_NOTICE");
      }
    }
    for (let index = 1; index < intervals.length; index += 1) {
      const previous = intervals[index - 1];
      const current = intervals[index];
      if (previous.endsAt > current.startsAt)
        violations.add("OVERLAPPING_SHIFT");
      else if (
        durationMinutes(previous.endsAt, current.startsAt) <
        rule.minimumRestMinutes
      )
        violations.add("MINIMUM_REST");
    }

    const daily = new Map<string, number>();
    const weekly = new Map<string, number>();
    for (const item of intervals) {
      const minutes = durationMinutes(item.startsAt, item.endsAt);
      daily.set(item.localDate, (daily.get(item.localDate) ?? 0) + minutes);
      const week = mondayForLocalDate(item.localDate);
      weekly.set(week, (weekly.get(week) ?? 0) + minutes);
    }
    if ([...daily.values()].some((minutes) => minutes > rule.maxDailyMinutes))
      violations.add("MAX_DAILY_MINUTES");
    if ([...weekly.values()].some((minutes) => minutes > rule.maxWeeklyMinutes))
      violations.add("MAX_WEEKLY_MINUTES");
  }
  return [...violations].sort();
}

async function validateUserWorkload(
  tx: Prisma.TransactionClient,
  organizationId: string,
  userId: string,
  proposed: SupportWorkInterval[],
  rule: RuleLimits,
  options: {
    excludeOccurrenceIds?: string[];
    now?: Date;
    enforceNotice?: boolean;
  } = {},
) {
  const fromWeek = proposed
    .map((item) => mondayForLocalDate(item.localDate))
    .sort()[0];
  const toWeek = proposed
    .map((item) => addSupportLocalDays(mondayForLocalDate(item.localDate), 6))
    .sort()
    .at(-1);
  if (!fromWeek || !toWeek) throw new SupportSchedulingError("INVALID_INPUT");
  const existing = await tx.supportShiftOccurrence.findMany({
    where: {
      organizationId,
      userId,
      status: "PUBLISHED",
      localDate: {
        gte: addSupportLocalDays(fromWeek, -1),
        lte: addSupportLocalDays(toWeek, 1),
      },
      id: options.excludeOccurrenceIds?.length
        ? { notIn: options.excludeOccurrenceIds }
        : undefined,
    },
    select: {
      id: true,
      userId: true,
      localDate: true,
      startsAt: true,
      endsAt: true,
    },
  });
  const violations = supportWorkloadViolations(existing, proposed, rule, {
    now: options.now,
    enforceNotice: options.enforceNotice,
  });
  if (violations.length)
    throw new SupportSchedulingError("RULE_VIOLATION", violations);
}

function effectiveAssignmentWeekdays(
  assignment: SupportCalendarAssignment,
  localDate: string,
  organizationId: string,
  userId: string,
  visibleTeamIds: Set<string>,
) {
  const pattern = assignment.patternVersion;
  if (
    !assignment.active ||
    assignment.organizationId !== organizationId ||
    assignment.userId !== userId ||
    !visibleTeamIds.has(assignment.teamId) ||
    assignment.patternVersionId !== pattern.id ||
    !pattern.active ||
    pattern.organizationId !== organizationId ||
    pattern.teamId !== assignment.teamId
  ) {
    return null;
  }
  const weekdays = parseWeekdays(pattern.weekdaysJson);
  if (!weekdays.length) return null;
  try {
    const interval = shiftInterval(
      localDate,
      pattern.startMinute,
      pattern.endMinute,
      pattern.timezone,
    );
    if (
      assignment.validFrom > interval.startsAt ||
      (assignment.validTo && assignment.validTo < interval.endsAt) ||
      pattern.effectiveFrom > interval.startsAt ||
      (pattern.effectiveTo && pattern.effectiveTo <= interval.startsAt)
    ) {
      return null;
    }
  } catch {
    return null;
  }
  return weekdays;
}

function deriveSupportScheduleDayStatuses(
  dates: string[],
  organizationId: string,
  userId: string,
  visibleTeamIds: Set<string>,
  occurrences: Array<{
    id: string;
    localDate: string;
    kind: string;
  }>,
  assignments: SupportCalendarAssignment[],
): SupportScheduleDayStatus[] {
  return dates.map((localDate) => {
    const published = occurrences.filter(
      (occurrence) => occurrence.localDate === localDate,
    );
    if (published.length) {
      return {
        localDate,
        status:
          published.length > 1 ||
          published.some((occurrence) => occurrence.kind === "DOUBLE")
            ? "DOUBLE"
            : "WORKING",
        occurrenceIds: published.map((occurrence) => occurrence.id),
      };
    }

    const effectiveWeekdays = assignments
      .map((assignment) =>
        effectiveAssignmentWeekdays(
          assignment,
          localDate,
          organizationId,
          userId,
          visibleTeamIds,
        ),
      )
      .filter((weekdays): weekdays is number[] => weekdays !== null);
    const weekday = weekdayForLocalDate(localDate);
    return {
      localDate,
      status:
        effectiveWeekdays.length &&
        effectiveWeekdays.every((weekdays) => !weekdays.includes(weekday))
          ? "OFF"
          : "UNPUBLISHED",
      occurrenceIds: [],
    };
  });
}

export async function listSupportScheduleCalendar(
  prisma: PrismaClient,
  actor: CurrentUser,
  input: SupportCalendarInput,
) {
  ensurePermission(actor, "read");
  const from = requireLocalDate(input.from);
  const to = requireLocalDate(input.to);
  const dates = localDates(from, to);
  const scope =
    input.scope ?? (isManager(actor) && input.teamId ? "TEAM" : "SELF");
  if (scope !== "SELF" && scope !== "TEAM")
    throw new SupportSchedulingError("INVALID_INPUT");
  if (scope === "TEAM" && !isManager(actor))
    throw new SupportSchedulingError("FORBIDDEN");
  if (scope === "TEAM" && !input.teamId)
    throw new SupportSchedulingError("INVALID_INPUT");
  if (scope === "SELF" && input.userId && input.userId !== actor.id)
    throw new SupportSchedulingError("FORBIDDEN");
  if (scope === "TEAM")
    await ensureTeam(prisma, actor.organizationId, input.teamId as string);

  const userId = scope === "SELF" ? actor.id : input.userId;
  const teamId = input.teamId;
  const utcRange = broadUtcRange(from, to);
  if (!isManager(actor) && teamId) {
    const range = utcRange;
    const membership = await prisma.supportTeamMembership.findFirst({
      where: {
        organizationId: actor.organizationId,
        teamId,
        userId: actor.id,
        validFrom: { lt: range.end },
        OR: [{ validTo: null }, { validTo: { gt: range.start } }],
      },
      select: { id: true },
    });
    if (!membership) throw new SupportSchedulingError("FORBIDDEN");
  }

  const ownMemberships =
    scope === "SELF" && !teamId
      ? await prisma.supportTeamMembership.findMany({
          where: {
            organizationId: actor.organizationId,
            userId: actor.id,
            validFrom: { lt: utcRange.end },
            OR: [{ validTo: null }, { validTo: { gt: utcRange.start } }],
          },
          select: { teamId: true },
        })
      : [];
  const visibleTeamIds = [
    ...new Set(ownMemberships.map((item) => item.teamId)),
  ];
  const teamFilter =
    teamId ?? (scope === "SELF" ? { in: visibleTeamIds } : undefined);
  const [occurrences, extraSlots, offers, assignments] = await Promise.all([
    prisma.supportShiftOccurrence.findMany({
      where: {
        organizationId: actor.organizationId,
        teamId: teamFilter,
        userId,
        status: "PUBLISHED",
        localDate: { gte: from, lte: to },
      },
      include: {
        user: { select: { id: true, name: true } },
        team: { select: { id: true, name: true } },
        pauseBookings: {
          where: { status: "BOOKED" },
          include: {
            slot: {
              select: { id: true, label: true, startsAt: true, endsAt: true },
            },
          },
        },
      },
      orderBy: [{ startsAt: "asc" }, { userId: "asc" }],
    }),
    prisma.supportExtraShiftSlot.findMany({
      where: {
        organizationId: actor.organizationId,
        teamId: teamFilter,
        startsAt: { lt: utcRange.end },
        endsAt: { gt: utcRange.start },
      },
      include: {
        team: { select: { id: true, name: true } },
        claims:
          scope === "SELF"
            ? {
                where: { userId: actor.id },
                select: {
                  id: true,
                  userId: true,
                  status: true,
                  occurrenceId: true,
                  decisionReason: true,
                },
              }
            : {
                select: {
                  id: true,
                  userId: true,
                  status: true,
                  occurrenceId: true,
                  decisionReason: true,
                  user: { select: { id: true, name: true } },
                },
              },
      },
      orderBy: { startsAt: "asc" },
    }),
    prisma.supportShiftOffer.findMany({
      where: {
        organizationId: actor.organizationId,
        teamId,
        AND: [
          scope === "SELF"
            ? { OR: [{ offeredById: actor.id }, { targetUserId: actor.id }] }
            : {},
          {
            OR: [
              { occurrence: { localDate: { gte: from, lte: to } } },
              { targetOccurrence: { localDate: { gte: from, lte: to } } },
            ],
          },
        ],
      },
      include: {
        offeredBy: { select: { id: true, name: true } },
        targetUser: { select: { id: true, name: true } },
        occurrence: {
          select: {
            id: true,
            userId: true,
            localDate: true,
            startsAt: true,
            endsAt: true,
            status: true,
          },
        },
        targetOccurrence: {
          select: {
            id: true,
            userId: true,
            localDate: true,
            startsAt: true,
            endsAt: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    scope === "SELF"
      ? prisma.supportShiftAssignment.findMany({
          where: {
            organizationId: actor.organizationId,
            teamId: teamFilter,
            userId: actor.id,
            active: true,
            validFrom: { lt: utcRange.end },
            OR: [{ validTo: null }, { validTo: { gt: utcRange.start } }],
          },
          select: {
            id: true,
            organizationId: true,
            teamId: true,
            userId: true,
            patternVersionId: true,
            validFrom: true,
            validTo: true,
            active: true,
            patternVersion: {
              select: {
                id: true,
                organizationId: true,
                teamId: true,
                startMinute: true,
                endMinute: true,
                weekdaysJson: true,
                timezone: true,
                active: true,
                effectiveFrom: true,
                effectiveTo: true,
              },
            },
          },
          orderBy: [{ validFrom: "asc" }, { id: "asc" }],
        })
      : Promise.resolve([]),
  ]);

  const filteredSlots = extraSlots.filter((slot) => {
    let timezone = "America/Sao_Paulo";
    try {
      const snapshot = JSON.parse(slot.policySnapshotJson) as {
        timezone?: string;
      };
      if (snapshot.timezone) timezone = snapshot.timezone;
    } catch {
      return false;
    }
    const date = supportLocalDateForInstant(slot.startsAt, timezone);
    return date >= from && date <= to;
  });

  const selfTeamIds = new Set(teamId ? [teamId] : visibleTeamIds);
  const visibleOccurrences =
    scope === "SELF"
      ? occurrences.filter(
          (occurrence) =>
            occurrence.organizationId === actor.organizationId &&
            occurrence.userId === actor.id &&
            occurrence.status === "PUBLISHED" &&
            selfTeamIds.has(occurrence.teamId),
        )
      : occurrences;
  const dayStatuses =
    scope === "SELF"
      ? deriveSupportScheduleDayStatuses(
          dates,
          actor.organizationId,
          actor.id,
          selfTeamIds,
          visibleOccurrences,
          assignments,
        )
      : null;

  return {
    from,
    to,
    scope,
    teamId: teamId ?? null,
    userId: userId ?? null,
    occurrences: visibleOccurrences,
    extraSlots: filteredSlots,
    offers,
    ...(dayStatuses ? { dayStatuses } : {}),
  };
}

export async function listSupportSchedulePlanning(
  prisma: PrismaClient,
  actor: CurrentUser,
  input: SupportSchedulePlanningInput,
) {
  ensurePermission(actor, "manage");
  const teamId = input.teamId?.trim();
  if (!teamId || teamId.length > 80)
    throw new SupportSchedulingError("INVALID_INPUT");

  await ensureTeam(prisma, actor.organizationId, teamId);
  const [rules, ruleDrafts, archivedRuleVersions, patterns, assignments] =
    await Promise.all([
      prisma.supportScheduleRuleVersion.findMany({
        where: {
          organizationId: actor.organizationId,
          teamId,
          active: true,
        },
        orderBy: [{ effectiveFrom: "desc" }, { version: "desc" }],
        take: 50,
      }),
      prisma.supportScheduleRuleDraft.findMany({
        where: { organizationId: actor.organizationId, teamId },
        orderBy: { updatedAt: "desc" },
        take: 50,
      }),
      prisma.supportScheduleRuleVersion.findMany({
        where: {
          organizationId: actor.organizationId,
          teamId,
          active: false,
          archivedAt: { not: null },
        },
        orderBy: [{ effectiveFrom: "desc" }, { version: "desc" }],
        take: 50,
      }),
      prisma.supportShiftPatternVersion.findMany({
        where: {
          organizationId: actor.organizationId,
          teamId,
          active: true,
        },
        orderBy: [{ name: "asc" }, { version: "desc" }],
        take: 200,
      }),
      prisma.supportShiftAssignment.findMany({
        where: {
          organizationId: actor.organizationId,
          teamId,
          active: true,
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
          patternVersion: {
            select: {
              id: true,
              name: true,
              version: true,
              startMinute: true,
              endMinute: true,
              weekdaysJson: true,
              timezone: true,
            },
          },
        },
        orderBy: [{ user: { name: "asc" } }, { validFrom: "desc" }],
        take: 500,
      }),
    ]);

  return {
    teamId,
    rules: rules.map((rule) => ({ ...rule, snapshot: ruleSnapshot(rule) })),
    ruleDrafts: ruleDrafts.map((draft) => ({
      ...draft,
      payload: normalizeSupportScheduleRulePayload(draft),
    })),
    archivedRuleVersions: archivedRuleVersions.map((rule) => ({
      ...rule,
      snapshot: ruleSnapshot(rule),
    })),
    patterns: patterns.map((pattern) => ({
      ...pattern,
      weekdays: parseWeekdays(pattern.weekdaysJson),
    })),
    assignments,
  };
}

function draftResult(draft: SupportScheduleRuleDraft) {
  return {
    draft,
    payload: normalizeSupportScheduleRulePayload(draft),
    checksum: draft.checksum,
  };
}

async function createRuleDraftInTransaction(
  tx: Prisma.TransactionClient,
  actor: CurrentUser,
  body: Record<string, unknown>,
) {
  const teamId = requiredText(body, "teamId", 80);
  const baseVersionId = optionalText(body, "baseVersionId", 80);
  await ensureTeam(tx, actor.organizationId, teamId);
  const baseVersion = await scopedBaseRuleVersion(
    tx,
    actor,
    teamId,
    baseVersionId,
  );
  const data = buildRuleData(
    body,
    baseVersion ? { ...baseVersion, effectiveTo: null } : undefined,
    { requireExplicitEffectiveFrom: true },
  );
  const { normalizedPayload, ...persistedData } = data;
  const draft = await tx.supportScheduleRuleDraft.create({
    data: {
      organizationId: actor.organizationId,
      teamId,
      baseVersionId,
      status: "DRAFT",
      revision: 1,
      createdById: actor.id,
      updatedById: actor.id,
      ...persistedData,
    },
  });
  await audit(
    tx,
    actor,
    "support_schedule.rule_draft.created",
    "SupportScheduleRuleDraft",
    draft.id,
    {
      teamId,
      revision: draft.revision,
      checksum: draft.checksum,
      baseVersionId,
      diffKeys: Object.keys(normalizedPayload).sort(),
    },
  );
  return draft;
}

export async function createSupportScheduleRuleDraft(
  prisma: PrismaClient,
  actor: CurrentUser,
  input: unknown,
) {
  ensurePermission(actor, "manage");
  const body = inputObject(input);
  assertOnlyKeys(body, ["teamId", "baseVersionId", ...structuredRuleKeys]);
  return serializable(prisma, async (tx) =>
    draftResult(await createRuleDraftInTransaction(tx, actor, body)),
  );
}

export async function updateSupportScheduleRuleDraft(
  prisma: PrismaClient,
  actor: CurrentUser,
  draftId: string,
  input: unknown,
) {
  ensurePermission(actor, "manage");
  const body = inputObject(input);
  assertOnlyKeys(body, ["expectedRevision", ...structuredRuleKeys]);
  const expectedRevision = requiredRevision(body);
  if (
    !structuredRuleKeys.some((key) =>
      Object.prototype.hasOwnProperty.call(body, key),
    )
  ) {
    throw new SupportSchedulingError("INVALID_INPUT");
  }

  return withConflictAudit(prisma, actor, () =>
    serializable(prisma, async (tx) => {
      const draft = await scopedRuleDraft(tx, actor, draftId);
      assertEditableDraft(draft);
      assertDraftCas(draft, expectedRevision);
      const data = buildRuleData(body, draft);
      const diff = normalizedRuleDiff(draft, data);
      const { normalizedPayload: _normalizedPayload, ...persistedData } = data;
      const updated = await tx.supportScheduleRuleDraft.update({
        where: {
          id: draft.id,
          revision: expectedRevision,
          status: "DRAFT",
        },
        data: {
          ...persistedData,
          revision: { increment: 1 },
          updatedById: actor.id,
        },
      });
      await audit(
        tx,
        actor,
        "support_schedule.rule_draft.updated",
        "SupportScheduleRuleDraft",
        draft.id,
        {
          teamId: draft.teamId,
          revision: updated.revision,
          previousRevision: draft.revision,
          checksum: updated.checksum,
          diffKeys: diff.changedKeys,
        },
      );
      return draftResult(updated);
    }),
  );
}

async function publishRuleDraftInTransaction(
  tx: Prisma.TransactionClient,
  actor: CurrentUser,
  draftId: string,
  expectedRevision: number,
  expectedChecksum: string,
) {
  const draft = await scopedRuleDraft(tx, actor, draftId);
  assertDraftCas(draft, expectedRevision, expectedChecksum);

  if (draft.status === "PUBLISHED" && draft.publishedVersionId) {
    const published = await tx.supportScheduleRuleVersion.findFirst({
      where: {
        id: draft.publishedVersionId,
        organizationId: actor.organizationId,
        teamId: draft.teamId,
        sourceDraftId: draft.id,
        checksum: expectedChecksum,
      },
    });
    if (!published)
      throw draftConflict(draft, "PUBLISHED_RELATION_MISMATCH", {
        publishedVersionId: draft.publishedVersionId,
      });
    return {
      ...draftResult(draft),
      rule: published,
      version: published,
      snapshot: ruleSnapshot(published),
      idempotent: true,
    };
  }

  assertEditableDraft(draft);
  const validated = buildRuleData({}, draft);
  if (
    validated.normalizedPayloadJson !== draft.normalizedPayloadJson ||
    validated.checksum !== draft.checksum
  ) {
    throw draftConflict(draft, "DRAFT_PAYLOAD_INTEGRITY");
  }
  const baseVersion = await scopedBaseRuleVersion(
    tx,
    actor,
    draft.teamId,
    draft.baseVersionId,
  );
  const [latestVersion, activeVersions] = await Promise.all([
    tx.supportScheduleRuleVersion.findFirst({
      where: {
        organizationId: actor.organizationId,
        teamId: draft.teamId,
      },
      orderBy: { version: "desc" },
    }),
    tx.supportScheduleRuleVersion.findMany({
      where: {
        organizationId: actor.organizationId,
        teamId: draft.teamId,
        active: true,
      },
      orderBy: [{ effectiveFrom: "asc" }, { version: "asc" }],
    }),
  ]);
  const previousVersion = [...activeVersions]
    .reverse()
    .find((version) => version.effectiveFrom < draft.effectiveFrom);
  const overlapping = activeVersions.filter(
    (version) =>
      version.effectiveFrom < (draft.effectiveTo ?? new Date(8.64e15)) &&
      (!version.effectiveTo || version.effectiveTo > draft.effectiveFrom),
  );
  if (
    overlapping.some(
      (version) =>
        version.effectiveFrom >= draft.effectiveFrom ||
        version.id !== previousVersion?.id,
    )
  ) {
    throw draftConflict(draft, "OVERLAPPING_RULE_VERSION", {
      conflictingVersionIds: overlapping.map((version) => version.id),
    });
  }

  if (
    previousVersion &&
    (!previousVersion.effectiveTo ||
      previousVersion.effectiveTo > draft.effectiveFrom)
  ) {
    await tx.supportScheduleRuleVersion.update({
      where: { id: previousVersion.id },
      data: { effectiveTo: draft.effectiveFrom },
    });
  }
  const rule = await tx.supportScheduleRuleVersion.create({
    data: {
      organizationId: actor.organizationId,
      teamId: draft.teamId,
      sourceDraftId: draft.id,
      version: (latestVersion?.version ?? 0) + 1,
      timezone: validated.timezone,
      maxDailyMinutes: validated.maxDailyMinutes,
      maxWeeklyMinutes: validated.maxWeeklyMinutes,
      minimumRestMinutes: validated.minimumRestMinutes,
      minimumNoticeMinutes: validated.minimumNoticeMinutes,
      maxMonthlyExchanges: validated.maxMonthlyExchanges,
      autoApproveEligibleSwaps: validated.autoApproveEligibleSwaps,
      requireManagerExtraApproval: validated.requireManagerExtraApproval,
      effectiveFrom: validated.effectiveFrom,
      effectiveTo: validated.effectiveTo,
      normalizedPayloadJson: validated.normalizedPayloadJson,
      checksum: validated.checksum,
      active: true,
      createdById: actor.id,
    },
  });
  const publishedDraft = await tx.supportScheduleRuleDraft.update({
    where: {
      id: draft.id,
      revision: expectedRevision,
      checksum: expectedChecksum,
      status: "DRAFT",
    },
    data: {
      status: "PUBLISHED",
      publishedVersionId: rule.id,
      updatedById: actor.id,
    },
  });
  const diff = normalizedRuleDiff(
    baseVersion ?? latestVersion,
    publishedDraft,
  );
  await audit(
    tx,
    actor,
    "support_schedule.rule_draft.published",
    "SupportScheduleRuleDraft",
    draft.id,
    {
      teamId: draft.teamId,
      revision: draft.revision,
      checksum: draft.checksum,
      baseVersionId: baseVersion?.id ?? null,
      previousVersionId: previousVersion?.id ?? null,
      publishedVersionId: rule.id,
      publishedVersion: rule.version,
      diffKeys: diff.changedKeys,
    },
  );
  return {
    ...draftResult(publishedDraft),
    rule,
    version: rule,
    snapshot: ruleSnapshot(rule),
    idempotent: false,
  };
}

export async function publishSupportScheduleRuleDraft(
  prisma: PrismaClient,
  actor: CurrentUser,
  draftId: string,
  input: unknown,
) {
  ensurePermission(actor, "manage");
  const body = inputObject(input);
  assertOnlyKeys(body, ["expectedRevision", "checksum"]);
  const expectedRevision = requiredRevision(body);
  const expectedChecksum = requiredChecksum(body);
  return withConflictAudit(prisma, actor, () =>
    serializable(
      prisma,
      (tx) =>
        publishRuleDraftInTransaction(
          tx,
          actor,
          draftId,
          expectedRevision,
          expectedChecksum,
        ),
      true,
    ),
  );
}

export async function previewSupportScheduleRuleDraft(
  prisma: PrismaClient,
  actor: CurrentUser,
  draftId: string,
  input: unknown,
) {
  ensurePermission(actor, "manage");
  const body = inputObject(input);
  assertOnlyKeys(body, ["expectedRevision", "checksum", "from", "to"]);
  const expectedRevision = requiredRevision(body);
  const expectedChecksum = requiredChecksum(body);
  const from = requireLocalDate(body.from);
  const to = requireLocalDate(body.to);
  localDates(from, to);
  const draft = await scopedRuleDraft(prisma, actor, draftId);
  assertEditableDraft(draft);
  assertDraftCas(draft, expectedRevision, expectedChecksum);
  const validated = buildRuleData({}, draft);
  if (
    validated.normalizedPayloadJson !== draft.normalizedPayloadJson ||
    validated.checksum !== draft.checksum
  ) {
    throw draftConflict(draft, "DRAFT_PAYLOAD_INTEGRITY");
  }
  const relevantFrom = supportLocalDateForInstant(
    draft.effectiveFrom,
    draft.timezone,
  );
  const relevantTo = draft.effectiveTo
    ? supportLocalDateForInstant(
        new Date(draft.effectiveTo.getTime() - 1),
        draft.timezone,
      )
    : null;
  if (from < relevantFrom || (relevantTo && to > relevantTo))
    throw new SupportSchedulingError("INVALID_INPUT");

  const [baseVersion, latestVersion] = await Promise.all([
    scopedBaseRuleVersion(
      prisma,
      actor,
      draft.teamId,
      draft.baseVersionId,
    ),
    prisma.supportScheduleRuleVersion.findFirst({
      where: {
        organizationId: actor.organizationId,
        teamId: draft.teamId,
      },
      orderBy: { version: "desc" },
    }),
  ]);
  const materialization = await materializeSupportShiftOccurrences(
    prisma,
    actor,
    {
      teamId: draft.teamId,
      from,
      to,
      dryRun: true,
      ruleOverride: {
        id: draft.id,
        organizationId: draft.organizationId,
        teamId: draft.teamId,
        version: 0,
        timezone: draft.timezone,
        maxDailyMinutes: draft.maxDailyMinutes,
        maxWeeklyMinutes: draft.maxWeeklyMinutes,
        minimumRestMinutes: draft.minimumRestMinutes,
        minimumNoticeMinutes: draft.minimumNoticeMinutes,
        maxMonthlyExchanges: draft.maxMonthlyExchanges,
        autoApproveEligibleSwaps: draft.autoApproveEligibleSwaps,
        requireManagerExtraApproval: draft.requireManagerExtraApproval,
        effectiveFrom: draft.effectiveFrom,
        effectiveTo: draft.effectiveTo,
      },
    },
  );
  return {
    draftId: draft.id,
    revision: draft.revision,
    payload: validated.normalizedPayload,
    normalizedPayloadJson: validated.normalizedPayloadJson,
    checksum: validated.checksum,
    diff: {
      base: {
        versionId: baseVersion?.id ?? null,
        ...normalizedRuleDiff(baseVersion, draft),
      },
      latest: {
        versionId: latestVersion?.id ?? null,
        ...normalizedRuleDiff(latestVersion, draft),
      },
    },
    window: {
      from,
      to,
      effectiveFrom: relevantFrom,
      effectiveTo: relevantTo,
    },
    materialization,
  };
}

export async function archiveSupportScheduleRuleDraft(
  prisma: PrismaClient,
  actor: CurrentUser,
  draftId: string,
  input: unknown,
) {
  ensurePermission(actor, "manage");
  const body = inputObject(input);
  assertOnlyKeys(body, ["expectedRevision"]);
  const expectedRevision = requiredRevision(body);
  return withConflictAudit(prisma, actor, () =>
    serializable(prisma, async (tx) => {
      const draft = await scopedRuleDraft(tx, actor, draftId);
      assertEditableDraft(draft);
      assertDraftCas(draft, expectedRevision);
      const archived = await tx.supportScheduleRuleDraft.update({
        where: {
          id: draft.id,
          revision: expectedRevision,
          status: "DRAFT",
        },
        data: {
          status: "ARCHIVED",
          revision: { increment: 1 },
          archivedAt: new Date(),
          archivedById: actor.id,
          updatedById: actor.id,
        },
      });
      await audit(
        tx,
        actor,
        "support_schedule.rule_draft.archived",
        "SupportScheduleRuleDraft",
        draft.id,
        {
          teamId: draft.teamId,
          revision: archived.revision,
          previousRevision: draft.revision,
          checksum: draft.checksum,
          diffKeys: [],
        },
      );
      return draftResult(archived);
    }),
  );
}

export async function archiveSupportScheduleRuleVersion(
  prisma: PrismaClient,
  actor: CurrentUser,
  ruleId: string,
) {
  ensurePermission(actor, "manage");
  return withConflictAudit(prisma, actor, () =>
    serializable(prisma, async (tx) => {
      const version = await tx.supportScheduleRuleVersion.findFirst({
        where: { id: ruleId, organizationId: actor.organizationId },
      });
      if (!version) throw new SupportSchedulingError("NOT_FOUND");
      if (!version.active || version.archivedAt)
        throw ruleVersionConflict(version, "RULE_VERSION_NOT_ACTIVE");
      if (version.effectiveFrom <= new Date())
        throw ruleVersionConflict(version, "RULE_VERSION_ALREADY_EFFECTIVE");

      const [occurrenceCount, offerCount, extraSlotCount, previous, next] =
        await Promise.all([
          tx.supportShiftOccurrence.count({
            where: { ruleVersionId: version.id },
          }),
          tx.supportShiftOffer.count({ where: { ruleVersionId: version.id } }),
          tx.supportExtraShiftSlot.count({
            where: { ruleVersionId: version.id },
          }),
          tx.supportScheduleRuleVersion.findFirst({
            where: {
              organizationId: actor.organizationId,
              teamId: version.teamId,
              active: true,
              effectiveFrom: { lt: version.effectiveFrom },
            },
            orderBy: [{ effectiveFrom: "desc" }, { version: "desc" }],
          }),
          tx.supportScheduleRuleVersion.findFirst({
            where: {
              organizationId: actor.organizationId,
              teamId: version.teamId,
              active: true,
              effectiveFrom: { gt: version.effectiveFrom },
            },
            orderBy: [{ effectiveFrom: "asc" }, { version: "asc" }],
          }),
        ]);
      if (occurrenceCount || offerCount || extraSlotCount)
        throw ruleVersionConflict(version, "RULE_VERSION_REFERENCED");

      const archivedAt = new Date();
      const archived = await tx.supportScheduleRuleVersion.update({
        where: { id: version.id, active: true },
        data: { active: false, archivedAt },
      });
      if (previous) {
        await tx.supportScheduleRuleVersion.update({
          where: { id: previous.id },
          data: { effectiveTo: next?.effectiveFrom ?? null },
        });
      }
      await audit(
        tx,
        actor,
        "support_schedule.rule_version.archived",
        "SupportScheduleRuleVersion",
        version.id,
        {
          teamId: version.teamId,
          version: version.version,
          checksum: version.checksum,
          previousVersionId: previous?.id ?? null,
          nextVersionId: next?.id ?? null,
          reconciledEffectiveTo: next?.effectiveFrom.toISOString() ?? null,
          diffKeys: [],
        },
      );
      return { rule: archived, snapshot: ruleSnapshot(archived) };
    }),
  );
}

export async function createSupportScheduleRuleVersion(
  prisma: PrismaClient,
  actor: CurrentUser,
  input: unknown,
) {
  ensurePermission(actor, "manage");
  const body = inputObject(input);
  assertOnlyKeys(body, ["teamId", "baseVersionId", ...structuredRuleKeys]);
  return withConflictAudit(prisma, actor, () =>
    serializable(
      prisma,
      async (tx) => {
        const draft = await createRuleDraftInTransaction(tx, actor, body);
        const published = await publishRuleDraftInTransaction(
          tx,
          actor,
          draft.id,
          draft.revision,
          draft.checksum,
        );
        return { rule: published.rule, snapshot: published.snapshot };
      },
      true,
    ),
  );
}

export async function createSupportShiftPatternVersion(
  prisma: PrismaClient,
  actor: CurrentUser,
  input: unknown,
) {
  ensurePermission(actor, "manage");
  const body = inputObject(input);
  const teamId = requiredText(body, "teamId", 80);
  const name = requiredText(body, "name", 80);
  const startMinute = integer(body, "startMinute", -1, 0, 1439);
  const endMinute = integer(body, "endMinute", -1, 0, 1439);
  const timezone = optionalText(body, "timezone", 80) ?? "America/Sao_Paulo";
  assertTimezone(timezone);
  const effectiveFrom = dateTime(body.effectiveFrom);
  const effectiveTo = optionalDateTime(body.effectiveTo);
  if (effectiveTo && effectiveTo <= effectiveFrom)
    throw new SupportSchedulingError("INVALID_INPUT");
  if (effectiveFrom < new Date())
    throw new SupportSchedulingError("RULE_VIOLATION", [
      "RETROACTIVE_PATTERN_VERSION",
    ]);
  if (!Array.isArray(body.weekdays) || !body.weekdays.length)
    throw new SupportSchedulingError("INVALID_INPUT");
  const weekdays = [
    ...new Set(
      body.weekdays.map((value) => {
        if (
          !Number.isInteger(value) ||
          (value as number) < 0 ||
          (value as number) > 6
        )
          throw new SupportSchedulingError("INVALID_INPUT");
        return value as number;
      }),
    ),
  ].sort((left, right) => left - right);

  return serializable(prisma, async (tx) => {
    await ensureTeam(tx, actor.organizationId, teamId);
    const rule = await effectiveRule(
      tx,
      actor.organizationId,
      teamId,
      effectiveFrom,
    );
    if (rule.timezone !== timezone)
      throw new SupportSchedulingError("RULE_VIOLATION", ["TIMEZONE_MISMATCH"]);
    const preview = shiftInterval(
      "2028-02-28",
      startMinute,
      endMinute,
      timezone,
    );
    if (
      durationMinutes(preview.startsAt, preview.endsAt) > rule.maxDailyMinutes
    ) {
      throw new SupportSchedulingError("RULE_VIOLATION", ["MAX_DAILY_MINUTES"]);
    }
    const latest = await tx.supportShiftPatternVersion.findFirst({
      where: { organizationId: actor.organizationId, teamId, name },
      orderBy: { version: "desc" },
    });
    if (latest && effectiveFrom <= latest.effectiveFrom)
      throw new SupportSchedulingError("CONFLICT");
    const overlapping = await tx.supportShiftPatternVersion.findFirst({
      where: {
        organizationId: actor.organizationId,
        teamId,
        name,
        active: true,
        effectiveFrom: effectiveTo ? { lt: effectiveTo } : undefined,
        OR: [{ effectiveTo: null }, { effectiveTo: { gt: effectiveFrom } }],
      },
      orderBy: { version: "desc" },
    });
    if (overlapping && overlapping.id !== latest?.id)
      throw new SupportSchedulingError("CONFLICT");
    if (
      latest?.active &&
      (!latest.effectiveTo || latest.effectiveTo > effectiveFrom)
    ) {
      await tx.supportShiftPatternVersion.update({
        where: { id: latest.id },
        data: { effectiveTo: effectiveFrom },
      });
    }
    const pattern = await tx.supportShiftPatternVersion.create({
      data: {
        organizationId: actor.organizationId,
        teamId,
        name,
        version: (latest?.version ?? 0) + 1,
        startMinute,
        endMinute,
        weekdaysJson: JSON.stringify(weekdays),
        timezone,
        active: true,
        effectiveFrom,
        effectiveTo,
        createdById: actor.id,
      },
    });
    await audit(
      tx,
      actor,
      "support_schedule.pattern.version_created",
      "SupportShiftPatternVersion",
      pattern.id,
      {
        teamId,
        name,
        version: pattern.version,
        previousVersionId: latest?.id ?? null,
        startMinute,
        endMinute,
        weekdays,
        timezone,
        ruleVersionId: rule.id,
      },
    );
    return { pattern, weekdays };
  });
}

export async function assignSupportShiftPattern(
  prisma: PrismaClient,
  actor: CurrentUser,
  input: unknown,
) {
  ensurePermission(actor, "manage");
  const body = inputObject(input);
  const teamId = requiredText(body, "teamId", 80);
  const userId = requiredText(body, "userId", 80);
  const patternVersionId = requiredText(body, "patternVersionId", 80);
  const validFrom = dateTime(body.validFrom);
  const validTo = optionalDateTime(body.validTo);
  if (validTo && validTo <= validFrom)
    throw new SupportSchedulingError("INVALID_INPUT");

  return serializable(prisma, async (tx) => {
    await Promise.all([
      ensureTeam(tx, actor.organizationId, teamId),
      ensureSupportUser(tx, actor.organizationId, userId),
    ]);
    const pattern = await tx.supportShiftPatternVersion.findFirst({
      where: {
        id: patternVersionId,
        organizationId: actor.organizationId,
        teamId,
        active: true,
      },
    });
    if (!pattern) throw new SupportSchedulingError("NOT_FOUND");
    if (
      validFrom < pattern.effectiveFrom ||
      (!validTo && pattern.effectiveTo) ||
      (validTo && pattern.effectiveTo && validTo > pattern.effectiveTo)
    ) {
      throw new SupportSchedulingError("RULE_VIOLATION", [
        "ASSIGNMENT_OUTSIDE_PATTERN_VERSION",
      ]);
    }
    await ensureMembershipCovering(
      tx,
      actor.organizationId,
      teamId,
      userId,
      validFrom,
      validTo ?? new Date("9999-12-31T23:59:59.999Z"),
    );
    const overlap = await tx.supportShiftAssignment.findFirst({
      where: {
        organizationId: actor.organizationId,
        userId,
        active: true,
        validFrom: validTo ? { lt: validTo } : undefined,
        OR: [{ validTo: null }, { validTo: { gt: validFrom } }],
      },
      select: { id: true },
    });
    if (overlap) throw new SupportSchedulingError("CONFLICT");
    const assignment = await tx.supportShiftAssignment.create({
      data: {
        organizationId: actor.organizationId,
        teamId,
        userId,
        patternVersionId,
        validFrom,
        validTo,
        active: true,
        createdById: actor.id,
        updatedById: actor.id,
      },
    });
    await audit(
      tx,
      actor,
      "support_schedule.assignment.created",
      "SupportShiftAssignment",
      assignment.id,
      {
        teamId,
        userId,
        patternVersionId,
        validFrom,
        validTo,
      },
    );
    return { assignment };
  });
}

function parseWeekdays(value: string) {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (
      !Array.isArray(parsed) ||
      parsed.some((day) => !Number.isInteger(day) || day < 0 || day > 6)
    )
      return [];
    return parsed as number[];
  } catch {
    return [];
  }
}

function occurrenceMatches(
  existing: SupportShiftOccurrence,
  candidate: {
    userId: string;
    patternVersionId: string;
    ruleVersionId: string;
    startsAt: Date;
    endsAt: Date;
    ruleSnapshotJson: string;
  },
) {
  return (
    existing.status === "PUBLISHED" &&
    existing.userId === candidate.userId &&
    existing.patternVersionId === candidate.patternVersionId &&
    existing.ruleVersionId === candidate.ruleVersionId &&
    existing.startsAt.getTime() === candidate.startsAt.getTime() &&
    existing.endsAt.getTime() === candidate.endsAt.getTime() &&
    existing.ruleSnapshotJson === candidate.ruleSnapshotJson
  );
}

export async function materializeSupportShiftOccurrences(
  prisma: PrismaClient,
  actor: CurrentUser,
  input: MaterializeSupportShiftsInternalInput,
) {
  ensurePermission(actor, "manage");
  const teamId =
    typeof input.teamId === "string" && input.teamId.trim()
      ? input.teamId.trim()
      : "";
  if (!teamId) throw new SupportSchedulingError("INVALID_INPUT");
  const ruleOverride = input.ruleOverride;
  if (
    ruleOverride &&
    (ruleOverride.organizationId !== actor.organizationId ||
      ruleOverride.teamId !== teamId)
  ) {
    throw new SupportSchedulingError("FORBIDDEN");
  }
  const dryRun = input.dryRun === true || Boolean(ruleOverride);
  const from = requireLocalDate(input.from);
  const to = requireLocalDate(input.to);
  const dates = localDates(from, to);
  const roughRange = broadUtcRange(from, to);

  return serializable(
    prisma,
    async (tx) => {
      await ensureTeam(tx, actor.organizationId, teamId);
      const assignments = await tx.supportShiftAssignment.findMany({
        where: {
          organizationId: actor.organizationId,
          teamId,
          active: true,
          validFrom: { lt: roughRange.end },
          OR: [{ validTo: null }, { validTo: { gt: roughRange.start } }],
        },
        include: {
          patternVersion: true,
          user: { select: { id: true, active: true, role: true } },
        },
        orderBy: [{ validFrom: "asc" }, { id: "asc" }],
      });
      const userIds = [
        ...new Set(assignments.map((assignment) => assignment.userId)),
      ];
      const [rules, memberships, existingOccurrences] = await Promise.all([
        tx.supportScheduleRuleVersion.findMany({
          where: {
            organizationId: actor.organizationId,
            teamId,
            active: true,
            effectiveFrom: { lt: roughRange.end },
            OR: [
              { effectiveTo: null },
              { effectiveTo: { gt: roughRange.start } },
            ],
          },
          orderBy: [{ effectiveFrom: "asc" }, { version: "asc" }],
        }),
        userIds.length
          ? tx.supportTeamMembership.findMany({
              where: {
                organizationId: actor.organizationId,
                teamId,
                userId: { in: userIds },
                validFrom: { lt: roughRange.end },
                OR: [{ validTo: null }, { validTo: { gt: roughRange.start } }],
              },
              select: {
                id: true,
                userId: true,
                validFrom: true,
                validTo: true,
              },
            })
          : Promise.resolve([]),
        tx.supportShiftOccurrence.findMany({
          where: {
            organizationId: actor.organizationId,
            teamId,
            assignmentId: {
              in: assignments.map((assignment) => assignment.id),
            },
            localDate: { gte: from, lte: to },
          },
        }),
      ]);
      const existingByKey = new Map(
        existingOccurrences.map((item) => [
          `${item.assignmentId}:${item.localDate}`,
          item,
        ]),
      );
      const availableRules: RuleLimits[] = ruleOverride
        ? [...rules, ruleOverride]
        : rules;
      const candidates: Array<{
        key: string;
        assignmentId: string;
        patternVersionId: string;
        ruleVersionId: string;
        userId: string;
        localDate: string;
        startsAt: Date;
        endsAt: Date;
        ruleSnapshotJson: string;
      }> = [];
      const conflicts: Array<{
        assignmentId: string;
        localDate: string;
        reason: string;
      }> = [];

      for (const assignment of assignments) {
        const pattern = assignment.patternVersion;
        const weekdays = parseWeekdays(pattern.weekdaysJson);
        for (const localDate of dates) {
          if (!weekdays.includes(weekdayForLocalDate(localDate))) continue;
          if (!pattern.active) {
            conflicts.push({
              assignmentId: assignment.id,
              localDate,
              reason: "INACTIVE_PATTERN_VERSION",
            });
            continue;
          }
          let interval: { startsAt: Date; endsAt: Date };
          try {
            interval = shiftInterval(
              localDate,
              pattern.startMinute,
              pattern.endMinute,
              pattern.timezone,
            );
          } catch {
            conflicts.push({
              assignmentId: assignment.id,
              localDate,
              reason: "INVALID_LOCAL_TIME",
            });
            continue;
          }
          if (!assignment.user.active || assignment.user.role !== "SAC") {
            conflicts.push({
              assignmentId: assignment.id,
              localDate,
              reason: "INACTIVE_SUPPORT_USER",
            });
            continue;
          }
          if (
            assignment.validFrom > interval.startsAt ||
            (assignment.validTo && assignment.validTo < interval.endsAt)
          )
            continue;
          if (
            pattern.effectiveFrom > interval.startsAt ||
            (pattern.effectiveTo && pattern.effectiveTo <= interval.startsAt)
          )
            continue;
          const membership = memberships.find(
            (item) =>
              item.userId === assignment.userId &&
              item.validFrom <= interval.startsAt &&
              (!item.validTo || item.validTo >= interval.endsAt),
          );
          if (!membership) {
            conflicts.push({
              assignmentId: assignment.id,
              localDate,
              reason: "MEMBERSHIP_NOT_EFFECTIVE",
            });
            continue;
          }
          const rule =
            ruleOverride &&
            ruleOverride.effectiveFrom <= interval.startsAt &&
            (!ruleOverride.effectiveTo ||
              ruleOverride.effectiveTo > interval.startsAt)
              ? ruleOverride
              : [...rules]
                  .reverse()
                  .find(
                    (item) =>
                      item.effectiveFrom <= interval.startsAt &&
                      (!item.effectiveTo ||
                        item.effectiveTo > interval.startsAt),
                  );
          if (!rule) {
            conflicts.push({
              assignmentId: assignment.id,
              localDate,
              reason: "NO_EFFECTIVE_RULE",
            });
            continue;
          }
          if (
            rule.timezone !== pattern.timezone ||
            durationMinutes(interval.startsAt, interval.endsAt) >
              rule.maxDailyMinutes
          ) {
            conflicts.push({
              assignmentId: assignment.id,
              localDate,
              reason: "PATTERN_RULE_MISMATCH",
            });
            continue;
          }
          candidates.push({
            key: `${assignment.id}:${localDate}`,
            assignmentId: assignment.id,
            patternVersionId: pattern.id,
            ruleVersionId: rule.id,
            userId: assignment.userId,
            localDate,
            ...interval,
            ruleSnapshotJson: snapshotJson(rule),
          });
        }
      }

      const invalidCandidateKeys = new Set<string>();
      const workloadFrom = addSupportLocalDays(mondayForLocalDate(from), -1);
      const workloadTo = addSupportLocalDays(mondayForLocalDate(to), 7);
      for (const userId of [
        ...new Set(candidates.map((candidate) => candidate.userId)),
      ]) {
        const userCandidates = candidates.filter(
          (candidate) => candidate.userId === userId,
        );
        const candidateRules = userCandidates
          .map((candidate) =>
            availableRules.find(
              (item) => item.id === candidate.ruleVersionId,
            ),
          )
          .filter((item): item is RuleLimits => Boolean(item));
        if (!candidateRules.length) continue;
        const replacingIds = new Set(
          userCandidates
            .map((candidate) => existingByKey.get(candidate.key)?.id)
            .filter((id): id is string => Boolean(id)),
        );
        const existingWorkload = await tx.supportShiftOccurrence.findMany({
          where: {
            organizationId: actor.organizationId,
            userId,
            status: "PUBLISHED",
            localDate: { gte: workloadFrom, lte: workloadTo },
          },
          select: {
            id: true,
            userId: true,
            localDate: true,
            startsAt: true,
            endsAt: true,
          },
        });
        const violations = supportWorkloadViolations(
          existingWorkload.filter((item) => !replacingIds.has(item.id)),
          userCandidates,
          {
            maxDailyMinutes: Math.min(
              ...candidateRules.map((item) => item.maxDailyMinutes),
            ),
            maxWeeklyMinutes: Math.min(
              ...candidateRules.map((item) => item.maxWeeklyMinutes),
            ),
            minimumRestMinutes: Math.max(
              ...candidateRules.map((item) => item.minimumRestMinutes),
            ),
            minimumNoticeMinutes: 0,
          },
          { enforceNotice: false },
        );
        if (!violations.length) continue;
        for (const candidate of userCandidates) {
          invalidCandidateKeys.add(candidate.key);
          for (const violation of violations) {
            conflicts.push({
              assignmentId: candidate.assignmentId,
              localDate: candidate.localDate,
              reason: `WORKLOAD_${violation}`,
            });
          }
        }
      }
      const materializableCandidates = candidates.filter(
        (candidate) => !invalidCandidateKeys.has(candidate.key),
      );
      const preview = {
        candidates: materializableCandidates.length,
        conflicts,
        createdCount: 0,
        updatedCount: 0,
        reusedCount: 0,
        preservedCount: 0,
      };
      if (dryRun) return { ...preview, dryRun: true };
      const now = new Date();
      for (const candidate of materializableCandidates) {
        const existing = existingByKey.get(candidate.key);
        if (existing && occurrenceMatches(existing, candidate)) {
          preview.reusedCount += 1;
          continue;
        }
        if (existing?.status === "CANCELLED") {
          preview.preservedCount += 1;
          continue;
        }
        if (existing) {
          if (existing.startsAt <= now) {
            conflicts.push({
              assignmentId: candidate.assignmentId,
              localDate: candidate.localDate,
              reason: "STARTED_OCCURRENCE_IMMUTABLE",
            });
            preview.preservedCount += 1;
            continue;
          }
          await tx.supportShiftOccurrence.update({
            where: { id: existing.id },
            data: {
              userId: candidate.userId,
              patternVersionId: candidate.patternVersionId,
              ruleVersionId: candidate.ruleVersionId,
              startsAt: candidate.startsAt,
              endsAt: candidate.endsAt,
              ruleSnapshotJson: candidate.ruleSnapshotJson,
              updatedById: actor.id,
            },
          });
          preview.updatedCount += 1;
          continue;
        }
        await tx.supportShiftOccurrence.create({
          data: {
            organizationId: actor.organizationId,
            teamId,
            userId: candidate.userId,
            assignmentId: candidate.assignmentId,
            patternVersionId: candidate.patternVersionId,
            ruleVersionId: candidate.ruleVersionId,
            localDate: candidate.localDate,
            startsAt: candidate.startsAt,
            endsAt: candidate.endsAt,
            kind: "REGULAR",
            status: "PUBLISHED",
            sourceType: "MATERIALIZED",
            sourceId: candidate.assignmentId,
            ruleSnapshotJson: candidate.ruleSnapshotJson,
            publishedAt: now,
            createdById: actor.id,
            updatedById: actor.id,
          },
        });
        preview.createdCount += 1;
      }
      await audit(
        tx,
        actor,
        "support_schedule.occurrences.materialized",
        "SupportTeam",
        teamId,
        {
          from,
          to,
          assignments: assignments.length,
          ...preview,
          conflicts: conflicts.map((item) => ({
            assignmentId: item.assignmentId,
            localDate: item.localDate,
            reason: item.reason,
          })),
        },
      );
      return { ...preview, conflicts, dryRun: false };
    },
    true,
  );
}

async function teamMemberIds(
  prisma: PrismaClient,
  organizationId: string,
  teamId: string,
  startsAt: Date,
  endsAt: Date,
) {
  const memberships = await prisma.supportTeamMembership.findMany({
    where: {
      organizationId,
      teamId,
      validFrom: { lte: startsAt },
      OR: [{ validTo: null }, { validTo: { gte: endsAt } }],
      user: { active: true, role: "SAC" },
    },
    select: { userId: true },
  });
  return [...new Set(memberships.map((item) => item.userId))];
}

function assertMinimumNotice(
  startsAt: Date,
  rule: Pick<RuleLimits, "minimumNoticeMinutes">,
  now = new Date(),
) {
  if (startsAt.getTime() - now.getTime() < rule.minimumNoticeMinutes * 60_000) {
    throw new SupportSchedulingError("RULE_VIOLATION", ["MINIMUM_NOTICE"]);
  }
}

function extraSlotDate(rule: Pick<RuleLimits, "timezone">, startsAt: Date) {
  return supportLocalDateForInstant(startsAt, rule.timezone);
}

export async function createSupportExtraShiftSlot(
  prisma: PrismaClient,
  actor: CurrentUser,
  input: unknown,
) {
  ensurePermission(actor, "manage");
  const body = inputObject(input);
  const teamId = requiredText(body, "teamId", 80);
  const startsAt = dateTime(body.startsAt);
  const endsAt = dateTime(body.endsAt);
  const capacity = integer(body, "capacity", 1, 1, 500);
  const note = optionalText(body, "note", 300);
  assertValidRange(startsAt, endsAt);

  const result = await serializable(prisma, async (tx) => {
    await ensureTeam(tx, actor.organizationId, teamId);
    const rule = await effectiveRule(
      tx,
      actor.organizationId,
      teamId,
      startsAt,
    );
    assertMinimumNotice(startsAt, rule);
    if (durationMinutes(startsAt, endsAt) > rule.maxDailyMinutes) {
      throw new SupportSchedulingError("RULE_VIOLATION", ["MAX_DAILY_MINUTES"]);
    }
    const slot = await tx.supportExtraShiftSlot.create({
      data: {
        organizationId: actor.organizationId,
        teamId,
        ruleVersionId: rule.id,
        startsAt,
        endsAt,
        capacity,
        status: "OPEN",
        note,
        policySnapshotJson: snapshotJson(rule),
        createdById: actor.id,
      },
    });
    await audit(
      tx,
      actor,
      "support_schedule.extra_slot.created",
      "SupportExtraShiftSlot",
      slot.id,
      {
        teamId,
        ruleVersionId: rule.id,
        startsAt,
        endsAt,
        capacity,
        notePresent: Boolean(note),
      },
    );
    return { slot, rule };
  });

  const recipientIds = await teamMemberIds(
    prisma,
    actor.organizationId,
    teamId,
    startsAt,
    endsAt,
  );
  const localDate = extraSlotDate(result.rule, startsAt);
  await emitInAppNotifications(prisma, actor.organizationId, {
    actorId: actor.id,
    recipientIds,
    type: "support_schedule.extra_slot.opened",
    title: "Novo slot extra disponível",
    body: `Há um slot extra em ${localDate}.`,
    entityType: "SupportExtraShiftSlot",
    entityId: result.slot.id,
    href: scheduleHref({ date: localDate, teamId, startsAt }),
    dedupeKey: `support-extra-slot:${result.slot.id}:opened`,
  });
  return { slot: result.slot };
}

interface ExtraClaimForApproval {
  id: string;
  organizationId: string;
  teamId: string;
  slotId: string;
  userId: string;
  slot: {
    id: string;
    startsAt: Date;
    endsAt: Date;
    capacity: number;
    status: string;
    ruleVersionId: string;
    ruleVersion: SupportScheduleRuleVersion;
  };
}

async function approveExtraClaim(
  tx: Prisma.TransactionClient,
  actor: CurrentUser,
  claim: ExtraClaimForApproval,
  decisionReason: string | null,
  now: Date,
) {
  const { slot } = claim;
  if (slot.status !== "OPEN" || slot.startsAt <= now)
    throw new SupportSchedulingError("CONFLICT");
  assertMinimumNotice(slot.startsAt, slot.ruleVersion, now);
  await Promise.all([
    ensureSupportUser(tx, actor.organizationId, claim.userId),
    ensureMembershipCovering(
      tx,
      actor.organizationId,
      claim.teamId,
      claim.userId,
      slot.startsAt,
      slot.endsAt,
    ),
  ]);
  const approvedCount = await tx.supportExtraShiftClaim.count({
    where: {
      organizationId: actor.organizationId,
      slotId: slot.id,
      status: "APPROVED",
      id: { not: claim.id },
    },
  });
  if (approvedCount >= slot.capacity)
    throw new SupportSchedulingError("CONFLICT");
  const localDate = extraSlotDate(slot.ruleVersion, slot.startsAt);
  await validateUserWorkload(
    tx,
    actor.organizationId,
    claim.userId,
    [
      {
        userId: claim.userId,
        localDate,
        startsAt: slot.startsAt,
        endsAt: slot.endsAt,
      },
    ],
    slot.ruleVersion,
    { now },
  );
  const sameDayCount = await tx.supportShiftOccurrence.count({
    where: {
      organizationId: actor.organizationId,
      userId: claim.userId,
      localDate,
      status: "PUBLISHED",
    },
  });
  const occurrence = await tx.supportShiftOccurrence.create({
    data: {
      organizationId: actor.organizationId,
      teamId: claim.teamId,
      userId: claim.userId,
      assignmentId: null,
      patternVersionId: null,
      ruleVersionId: slot.ruleVersionId,
      localDate,
      startsAt: slot.startsAt,
      endsAt: slot.endsAt,
      kind: sameDayCount > 0 ? "DOUBLE" : "EXTRA",
      status: "PUBLISHED",
      sourceType: "EXTRA_SLOT",
      sourceId: claim.id,
      ruleSnapshotJson: slot.ruleVersion
        ? snapshotJson(slot.ruleVersion)
        : "{}",
      publishedAt: now,
      createdById: actor.id,
      updatedById: actor.id,
    },
  });
  const updatedClaim = await tx.supportExtraShiftClaim.update({
    where: { id: claim.id },
    data: {
      status: "APPROVED",
      occurrenceId: occurrence.id,
      decidedById: actor.id,
      decidedAt: now,
      decisionReason,
    },
  });
  if (approvedCount + 1 >= slot.capacity) {
    await tx.supportExtraShiftSlot.update({
      where: { id: slot.id },
      data: { status: "FILLED" },
    });
  }
  return { claim: updatedClaim, occurrence };
}

export async function claimSupportExtraShiftSlot(
  prisma: PrismaClient,
  actor: CurrentUser,
  slotId: string,
  input: unknown = {},
) {
  ensurePermission(actor, "exchange");
  const body = inputObject(input);
  const requestedUserId =
    typeof body.userId === "string" && body.userId.trim()
      ? body.userId.trim()
      : actor.id;
  if (requestedUserId !== actor.id && !isManager(actor))
    throw new SupportSchedulingError("FORBIDDEN");
  const note = optionalText(body, "note", 300);
  const now = new Date();
  const result = await serializable(
    prisma,
    async (tx) => {
      const slot = await tx.supportExtraShiftSlot.findFirst({
        where: { id: slotId, organizationId: actor.organizationId },
        include: { ruleVersion: true },
      });
      if (!slot) throw new SupportSchedulingError("NOT_FOUND");
      if (slot.status !== "OPEN" || slot.startsAt <= now)
        throw new SupportSchedulingError("CONFLICT");
      assertMinimumNotice(slot.startsAt, slot.ruleVersion, now);
      await Promise.all([
        ensureSupportUser(tx, actor.organizationId, requestedUserId),
        ensureMembershipCovering(
          tx,
          actor.organizationId,
          slot.teamId,
          requestedUserId,
          slot.startsAt,
          slot.endsAt,
        ),
      ]);
      const current = await tx.supportExtraShiftClaim.findUnique({
        where: { slotId_userId: { slotId, userId: requestedUserId } },
      });
      if (current?.status === "PENDING" || current?.status === "APPROVED") {
        return {
          claim: current,
          occurrence: null,
          idempotent: true,
          slot,
          pending: current.status === "PENDING",
        };
      }
      const claim = current
        ? await tx.supportExtraShiftClaim.update({
            where: { id: current.id },
            data: {
              status: "PENDING",
              note,
              decidedById: null,
              decidedAt: null,
              decisionReason: null,
              occurrenceId: null,
            },
          })
        : await tx.supportExtraShiftClaim.create({
            data: {
              organizationId: actor.organizationId,
              teamId: slot.teamId,
              slotId,
              userId: requestedUserId,
              status: "PENDING",
              note,
            },
          });
      let approved: Awaited<ReturnType<typeof approveExtraClaim>> | null = null;
      if (!slot.ruleVersion.requireManagerExtraApproval) {
        approved = await approveExtraClaim(
          tx,
          actor,
          { ...claim, slot },
          "AUTO_APPROVED_BY_RULE",
          now,
        );
      }
      await audit(
        tx,
        actor,
        approved
          ? "support_schedule.extra_claim.auto_approved"
          : "support_schedule.extra_claim.created",
        "SupportExtraShiftClaim",
        claim.id,
        {
          slotId,
          teamId: slot.teamId,
          userId: requestedUserId,
          ruleVersionId: slot.ruleVersionId,
          notePresent: Boolean(note),
          status: approved ? "APPROVED" : "PENDING",
        },
      );
      return {
        claim: approved?.claim ?? claim,
        occurrence: approved?.occurrence ?? null,
        idempotent: false,
        slot,
        pending: !approved,
      };
    },
    true,
  );

  const localDate = extraSlotDate(
    result.slot.ruleVersion,
    result.slot.startsAt,
  );
  if (!result.idempotent) {
    await emitInAppNotifications(
      prisma,
      actor.organizationId,
      result.pending
        ? {
            actorId: actor.id,
            recipientRoles: ["ADMIN", "GESTOR"],
            type: "support_schedule.extra_claim.pending",
            title: "Slot extra aguardando decisão",
            body: `Há uma solicitação de slot extra para ${localDate}.`,
            entityType: "SupportExtraShiftClaim",
            entityId: result.claim.id,
            href: scheduleHref({
              date: localDate,
              teamId: result.slot.teamId,
              claimId: result.claim.id,
              startsAt: result.slot.startsAt,
            }),
            dedupeKey: `support-extra-claim:${result.claim.id}:pending`,
          }
        : {
            actorId: actor.id,
            recipientIds: [result.claim.userId],
            type: "support_schedule.extra_claim.approved",
            title: "Slot extra confirmado",
            body: `Seu slot extra de ${localDate} foi confirmado.`,
            entityType: "SupportExtraShiftClaim",
            entityId: result.claim.id,
            href: scheduleHref({
              date: localDate,
              teamId: result.slot.teamId,
              claimId: result.claim.id,
              startsAt: result.slot.startsAt,
            }),
            dedupeKey: `support-extra-claim:${result.claim.id}:approved`,
          },
    );
  }
  return {
    claim: result.claim,
    occurrence: result.occurrence,
    idempotent: result.idempotent,
  };
}

export async function decideSupportExtraShiftClaim(
  prisma: PrismaClient,
  actor: CurrentUser,
  claimId: string,
  input: unknown,
) {
  ensurePermission(actor, "approve");
  const body = inputObject(input);
  const decision = requiredText(body, "decision", 20).toUpperCase();
  if (decision !== "APPROVED" && decision !== "REJECTED")
    throw new SupportSchedulingError("INVALID_INPUT");
  const reason = optionalText(body, "reason", 300);
  if (decision === "REJECTED" && !reason)
    throw new SupportSchedulingError("INVALID_INPUT");
  const now = new Date();
  const result = await serializable(
    prisma,
    async (tx) => {
      const claim = await tx.supportExtraShiftClaim.findFirst({
        where: {
          id: claimId,
          organizationId: actor.organizationId,
          status: "PENDING",
        },
        include: { slot: { include: { ruleVersion: true } } },
      });
      if (!claim) throw new SupportSchedulingError("NOT_FOUND");
      if (claim.userId === actor.id)
        throw new SupportSchedulingError("FORBIDDEN");
      if (decision === "REJECTED") {
        const rejected = await tx.supportExtraShiftClaim.update({
          where: { id: claim.id },
          data: {
            status: "REJECTED",
            decidedById: actor.id,
            decidedAt: now,
            decisionReason: reason,
          },
        });
        await audit(
          tx,
          actor,
          "support_schedule.extra_claim.rejected",
          "SupportExtraShiftClaim",
          claim.id,
          {
            slotId: claim.slotId,
            teamId: claim.teamId,
            userId: claim.userId,
            reasonPresent: true,
          },
        );
        return { claim: rejected, occurrence: null, slot: claim.slot };
      }
      const approved = await approveExtraClaim(tx, actor, claim, reason, now);
      await audit(
        tx,
        actor,
        "support_schedule.extra_claim.approved",
        "SupportExtraShiftClaim",
        claim.id,
        {
          slotId: claim.slotId,
          teamId: claim.teamId,
          userId: claim.userId,
          occurrenceId: approved.occurrence.id,
          ruleVersionId: claim.slot.ruleVersionId,
          reasonPresent: Boolean(reason),
        },
      );
      return { ...approved, slot: claim.slot };
    },
    true,
  );

  const localDate = extraSlotDate(
    result.slot.ruleVersion,
    result.slot.startsAt,
  );
  await emitInAppNotifications(prisma, actor.organizationId, {
    actorId: actor.id,
    recipientIds: [result.claim.userId],
    type: `support_schedule.extra_claim.${result.claim.status.toLowerCase()}`,
    title:
      result.claim.status === "APPROVED"
        ? "Slot extra aprovado"
        : "Slot extra não aprovado",
    body:
      result.claim.status === "APPROVED"
        ? `O slot extra de ${localDate} foi aprovado.`
        : `O slot extra de ${localDate} foi recusado.`,
    entityType: "SupportExtraShiftClaim",
    entityId: result.claim.id,
    href: scheduleHref({
      date: localDate,
      teamId: result.slot.teamId,
      claimId: result.claim.id,
      startsAt: result.slot.startsAt,
    }),
    dedupeKey: `support-extra-claim:${result.claim.id}:${result.claim.status.toLowerCase()}`,
  });
  return { claim: result.claim, occurrence: result.occurrence };
}

interface OfferOccurrence {
  id: string;
  organizationId: string;
  teamId: string;
  userId: string;
  assignmentId: string | null;
  patternVersionId: string | null;
  ruleVersionId: string;
  localDate: string;
  startsAt: Date;
  endsAt: Date;
  kind: string;
  status: string;
  ruleSnapshotJson: string;
  ruleVersion?: SupportScheduleRuleVersion;
}

interface OfferForApplication {
  id: string;
  organizationId: string;
  teamId: string;
  occurrenceId: string;
  targetOccurrenceId: string | null;
  offeredById: string;
  targetUserId: string | null;
  type: string;
  status: string;
  ruleVersionId: string;
  occurrence: OfferOccurrence;
  targetOccurrence: OfferOccurrence | null;
  ruleVersion: SupportScheduleRuleVersion;
}

function offerPolicySnapshot(
  rule: SupportScheduleRuleVersion,
  source: OfferOccurrence,
  target: OfferOccurrence | null,
) {
  return {
    rule: ruleSnapshot(rule),
    source: {
      id: source.id,
      userId: source.userId,
      localDate: source.localDate,
      startsAt: source.startsAt,
      endsAt: source.endsAt,
    },
    target: target
      ? {
          id: target.id,
          userId: target.userId,
          localDate: target.localDate,
          startsAt: target.startsAt,
          endsAt: target.endsAt,
        }
      : null,
  };
}

async function ensureExchangeLimit(
  tx: Prisma.TransactionClient,
  organizationId: string,
  userIds: string[],
  rule: Pick<RuleLimits, "maxMonthlyExchanges" | "timezone">,
  now: Date,
) {
  if (rule.maxMonthlyExchanges === 0)
    throw new SupportSchedulingError("RULE_VIOLATION", [
      "MAX_MONTHLY_EXCHANGES",
    ]);
  const localNow = localDateParts(
    supportLocalDateForInstant(now, rule.timezone),
  );
  if (!localNow) throw new SupportSchedulingError("INVALID_INPUT");
  const monthStartDate = `${String(localNow.year).padStart(4, "0")}-${String(localNow.month).padStart(2, "0")}-01`;
  const nextMonthStartDate = new Date(
    Date.UTC(localNow.year, localNow.month, 1),
  )
    .toISOString()
    .slice(0, 10);
  const monthStart = supportZonedDateTimeToUtc(
    monthStartDate,
    0,
    rule.timezone,
  );
  const nextMonthStart = supportZonedDateTimeToUtc(
    nextMonthStartDate,
    0,
    rule.timezone,
  );
  for (const userId of [...new Set(userIds)]) {
    const count = await tx.supportShiftOffer.count({
      where: {
        organizationId,
        status: "APPLIED",
        appliedAt: { gte: monthStart, lt: nextMonthStart },
        OR: [{ offeredById: userId }, { targetUserId: userId }],
      },
    });
    if (count >= rule.maxMonthlyExchanges)
      throw new SupportSchedulingError("RULE_VIOLATION", [
        "MAX_MONTHLY_EXCHANGES",
      ]);
  }
}

async function validateOfferApplication(
  tx: Prisma.TransactionClient,
  actor: CurrentUser,
  offer: OfferForApplication,
  now: Date,
) {
  const source = offer.occurrence;
  const targetUserId = offer.targetUserId;
  if (!targetUserId || source.status !== "PUBLISHED" || source.startsAt <= now)
    throw new SupportSchedulingError("CONFLICT");
  if (
    source.organizationId !== actor.organizationId ||
    source.teamId !== offer.teamId
  )
    throw new SupportSchedulingError("FORBIDDEN");
  assertMinimumNotice(source.startsAt, offer.ruleVersion, now);
  await Promise.all([
    ensureSupportUser(tx, actor.organizationId, targetUserId),
    ensureMembershipCovering(
      tx,
      actor.organizationId,
      offer.teamId,
      targetUserId,
      source.startsAt,
      source.endsAt,
    ),
  ]);
  await validateUserWorkload(
    tx,
    actor.organizationId,
    targetUserId,
    [
      {
        userId: targetUserId,
        localDate: source.localDate,
        startsAt: source.startsAt,
        endsAt: source.endsAt,
      },
    ],
    offer.ruleVersion,
    {
      excludeOccurrenceIds: offer.targetOccurrence
        ? [offer.targetOccurrence.id]
        : [],
      now,
    },
  );

  const involved = [offer.offeredById, targetUserId];
  if (offer.type === "SWAP") {
    const target = offer.targetOccurrence;
    if (
      !target ||
      target.status !== "PUBLISHED" ||
      target.teamId !== offer.teamId ||
      target.userId !== targetUserId ||
      target.startsAt <= now
    ) {
      throw new SupportSchedulingError("CONFLICT");
    }
    const targetRule =
      target.ruleVersion ??
      (await effectiveRule(
        tx,
        actor.organizationId,
        offer.teamId,
        target.startsAt,
      ));
    assertMinimumNotice(target.startsAt, targetRule, now);
    await ensureMembershipCovering(
      tx,
      actor.organizationId,
      offer.teamId,
      offer.offeredById,
      target.startsAt,
      target.endsAt,
    );
    await validateUserWorkload(
      tx,
      actor.organizationId,
      offer.offeredById,
      [
        {
          userId: offer.offeredById,
          localDate: target.localDate,
          startsAt: target.startsAt,
          endsAt: target.endsAt,
        },
      ],
      targetRule,
      { excludeOccurrenceIds: [source.id], now },
    );
  }
  await ensureExchangeLimit(
    tx,
    actor.organizationId,
    involved,
    offer.ruleVersion,
    now,
  );
}

async function replacementOccurrence(
  tx: Prisma.TransactionClient,
  actor: CurrentUser,
  offerId: string,
  source: OfferOccurrence,
  userId: string,
  now: Date,
) {
  return tx.supportShiftOccurrence.create({
    data: {
      organizationId: actor.organizationId,
      teamId: source.teamId,
      userId,
      assignmentId: null,
      patternVersionId: source.patternVersionId,
      ruleVersionId: source.ruleVersionId,
      localDate: source.localDate,
      startsAt: source.startsAt,
      endsAt: source.endsAt,
      kind: source.kind,
      status: "PUBLISHED",
      sourceType: "SHIFT_OFFER",
      sourceId: offerId,
      ruleSnapshotJson: source.ruleSnapshotJson,
      publishedAt: now,
      createdById: actor.id,
      updatedById: actor.id,
    },
  });
}

async function applyShiftOffer(
  tx: Prisma.TransactionClient,
  actor: CurrentUser,
  offer: OfferForApplication,
  now: Date,
) {
  await validateOfferApplication(tx, actor, offer, now);
  const targetUserId = offer.targetUserId as string;
  const sourceReplacement = await replacementOccurrence(
    tx,
    actor,
    offer.id,
    offer.occurrence,
    targetUserId,
    now,
  );
  const targetReplacement =
    offer.type === "SWAP" && offer.targetOccurrence
      ? await replacementOccurrence(
          tx,
          actor,
          offer.id,
          offer.targetOccurrence,
          offer.offeredById,
          now,
        )
      : null;
  const cancelledIds = [
    offer.occurrence.id,
    ...(offer.targetOccurrence ? [offer.targetOccurrence.id] : []),
  ];
  const cancelled = await tx.supportShiftOccurrence.updateMany({
    where: {
      organizationId: actor.organizationId,
      id: { in: cancelledIds },
      status: "PUBLISHED",
    },
    data: {
      status: "CANCELLED",
      cancelledAt: now,
      cancellationReason: `SHIFT_OFFER:${offer.id}`,
      updatedById: actor.id,
    },
  });
  if (cancelled.count !== cancelledIds.length)
    throw new SupportSchedulingError("CONFLICT");
  await tx.supportPauseBooking.updateMany({
    where: {
      organizationId: actor.organizationId,
      shiftOccurrenceId: { in: cancelledIds },
      status: "BOOKED",
    },
    data: {
      rescheduleRequiredAt: now,
      rescheduleReason: `SHIFT_OFFER:${offer.id}`,
    },
  });
  const applied = await tx.supportShiftOffer.update({
    where: { id: offer.id },
    data: {
      status: "APPLIED",
      decidedById: actor.id,
      decidedAt: now,
      decisionReason:
        offer.status === "MANAGER_PENDING"
          ? "MANAGER_APPROVED"
          : "AUTO_APPROVED_BY_RULE",
      appliedAt: now,
    },
  });
  await audit(
    tx,
    actor,
    "support_schedule.offer.applied",
    "SupportShiftOffer",
    offer.id,
    {
      type: offer.type,
      teamId: offer.teamId,
      ruleVersionId: offer.ruleVersionId,
      beforeOccurrenceIds: cancelledIds,
      afterOccurrenceIds: [
        sourceReplacement.id,
        ...(targetReplacement ? [targetReplacement.id] : []),
      ],
      offeredById: offer.offeredById,
      targetUserId,
    },
  );
  return {
    offer: applied,
    occurrences: [
      sourceReplacement,
      ...(targetReplacement ? [targetReplacement] : []),
    ],
  };
}

export async function createSupportShiftOffer(
  prisma: PrismaClient,
  actor: CurrentUser,
  input: unknown,
) {
  ensurePermission(actor, "exchange");
  const body = inputObject(input);
  const occurrenceId = requiredText(body, "occurrenceId", 80);
  const type = (optionalText(body, "type", 20) ?? "SWAP").toUpperCase();
  if (type !== "SWAP" && type !== "OFFER")
    throw new SupportSchedulingError("INVALID_INPUT");
  const targetOccurrenceId = optionalText(body, "targetOccurrenceId", 80);
  const targetUserIdInput = optionalText(body, "targetUserId", 80);
  const note = optionalText(body, "note", 300);
  const requestedExpiry = optionalDateTime(body.expiresAt);
  const now = new Date();

  const result = await serializable(
    prisma,
    async (tx) => {
      const occurrence = await tx.supportShiftOccurrence.findFirst({
        where: {
          id: occurrenceId,
          organizationId: actor.organizationId,
          userId: actor.id,
          status: "PUBLISHED",
        },
        include: { ruleVersion: true },
      });
      if (!occurrence) throw new SupportSchedulingError("NOT_FOUND");
      if (occurrence.startsAt <= now)
        throw new SupportSchedulingError("CONFLICT");
      assertMinimumNotice(occurrence.startsAt, occurrence.ruleVersion, now);
      const targetOccurrence = targetOccurrenceId
        ? await tx.supportShiftOccurrence.findFirst({
            where: {
              id: targetOccurrenceId,
              organizationId: actor.organizationId,
              teamId: occurrence.teamId,
              status: "PUBLISHED",
            },
            include: { ruleVersion: true },
          })
        : null;
      if (targetOccurrenceId && !targetOccurrence)
        throw new SupportSchedulingError("NOT_FOUND");
      if (type === "OFFER" && targetOccurrence)
        throw new SupportSchedulingError("INVALID_INPUT");
      if (
        targetOccurrence?.userId === actor.id ||
        targetOccurrence?.id === occurrence.id
      )
        throw new SupportSchedulingError("CONFLICT");
      const targetUserId = targetOccurrence?.userId ?? targetUserIdInput;
      if (targetUserId) {
        if (targetUserId === actor.id)
          throw new SupportSchedulingError("CONFLICT");
        await Promise.all([
          ensureSupportUser(tx, actor.organizationId, targetUserId),
          ensureMembershipCovering(
            tx,
            actor.organizationId,
            occurrence.teamId,
            targetUserId,
            occurrence.startsAt,
            occurrence.endsAt,
          ),
        ]);
      }
      if (
        targetOccurrence &&
        targetUserIdInput &&
        targetUserIdInput !== targetOccurrence.userId
      ) {
        throw new SupportSchedulingError("INVALID_INPUT");
      }
      if (targetOccurrence) {
        if (targetOccurrence.startsAt <= now)
          throw new SupportSchedulingError("CONFLICT");
        assertMinimumNotice(
          targetOccurrence.startsAt,
          targetOccurrence.ruleVersion,
          now,
        );
        await ensureMembershipCovering(
          tx,
          actor.organizationId,
          occurrence.teamId,
          actor.id,
          targetOccurrence.startsAt,
          targetOccurrence.endsAt,
        );
      }
      const active = await tx.supportShiftOffer.findFirst({
        where: {
          organizationId: actor.organizationId,
          status: { in: activeOfferStatuses },
          OR: [
            { occurrenceId: occurrence.id },
            { targetOccurrenceId: occurrence.id },
            ...(targetOccurrence
              ? [
                  { occurrenceId: targetOccurrence.id },
                  { targetOccurrenceId: targetOccurrence.id },
                ]
              : []),
          ],
        },
        select: { id: true },
      });
      if (active) throw new SupportSchedulingError("CONFLICT");
      await ensureExchangeLimit(
        tx,
        actor.organizationId,
        [actor.id],
        occurrence.ruleVersion,
        now,
      );
      const latestExpiry = new Date(
        occurrence.startsAt.getTime() -
          occurrence.ruleVersion.minimumNoticeMinutes * 60_000,
      );
      const defaultExpiry = new Date(
        Math.min(now.getTime() + 72 * 60 * 60_000, latestExpiry.getTime()),
      );
      const expiresAt = requestedExpiry ?? defaultExpiry;
      if (expiresAt <= now || expiresAt > latestExpiry)
        throw new SupportSchedulingError("RULE_VIOLATION", ["MINIMUM_NOTICE"]);
      const policySnapshot = offerPolicySnapshot(
        occurrence.ruleVersion,
        occurrence,
        targetOccurrence,
      );
      const offer = await tx.supportShiftOffer.create({
        data: {
          organizationId: actor.organizationId,
          teamId: occurrence.teamId,
          occurrenceId: occurrence.id,
          targetOccurrenceId: targetOccurrence?.id ?? null,
          offeredById: actor.id,
          targetUserId: targetUserId ?? null,
          ruleVersionId: occurrence.ruleVersionId,
          type,
          status: "OPEN",
          note,
          policySnapshotJson: JSON.stringify(policySnapshot),
          expiresAt,
        },
      });
      await audit(
        tx,
        actor,
        "support_schedule.offer.created",
        "SupportShiftOffer",
        offer.id,
        {
          type,
          teamId: occurrence.teamId,
          occurrenceId: occurrence.id,
          targetOccurrenceId: targetOccurrence?.id ?? null,
          targetUserId: targetUserId ?? null,
          ruleVersionId: occurrence.ruleVersionId,
          expiresAt,
          notePresent: Boolean(note),
        },
      );
      return { offer, occurrence, targetOccurrence };
    },
    true,
  );

  if (result.offer.targetUserId) {
    await emitInAppNotifications(prisma, actor.organizationId, {
      actorId: actor.id,
      recipientIds: [result.offer.targetUserId],
      type: "support_schedule.offer.received",
      title:
        result.offer.type === "SWAP"
          ? "Nova proposta de troca"
          : "Novo turno oferecido",
      body: `Há uma negociação para ${result.occurrence.localDate}.`,
      entityType: "SupportShiftOffer",
      entityId: result.offer.id,
      href: scheduleHref({
        date: result.occurrence.localDate,
        teamId: result.offer.teamId,
        offerId: result.offer.id,
        startsAt: result.occurrence.startsAt,
      }),
      dedupeKey: `support-shift-offer:${result.offer.id}:received`,
    });
  }
  return { offer: result.offer };
}

export async function acceptSupportShiftOffer(
  prisma: PrismaClient,
  actor: CurrentUser,
  offerId: string,
  input: unknown = {},
) {
  ensurePermission(actor, "exchange");
  const body = inputObject(input);
  const selectedTargetOccurrenceId = optionalText(
    body,
    "targetOccurrenceId",
    80,
  );
  const now = new Date();
  const result = await serializable(
    prisma,
    async (tx) => {
      const offer = await tx.supportShiftOffer.findFirst({
        where: {
          id: offerId,
          organizationId: actor.organizationId,
          status: "OPEN",
        },
        include: {
          occurrence: { include: { ruleVersion: true } },
          targetOccurrence: { include: { ruleVersion: true } },
          ruleVersion: true,
        },
      });
      if (!offer) throw new SupportSchedulingError("NOT_FOUND");
      if (offer.expiresAt && offer.expiresAt <= now)
        throw new SupportSchedulingError("CONFLICT");
      if (
        offer.offeredById === actor.id ||
        (offer.targetUserId && offer.targetUserId !== actor.id)
      ) {
        throw new SupportSchedulingError("FORBIDDEN");
      }
      let targetOccurrence = offer.targetOccurrence;
      if (offer.type === "SWAP") {
        const targetId = selectedTargetOccurrenceId ?? offer.targetOccurrenceId;
        if (!targetId) throw new SupportSchedulingError("INVALID_INPUT");
        targetOccurrence = await tx.supportShiftOccurrence.findFirst({
          where: {
            id: targetId,
            organizationId: actor.organizationId,
            teamId: offer.teamId,
            userId: actor.id,
            status: "PUBLISHED",
          },
          include: { ruleVersion: true },
        });
        if (!targetOccurrence) throw new SupportSchedulingError("NOT_FOUND");
        if (targetOccurrence.id === offer.occurrenceId)
          throw new SupportSchedulingError("CONFLICT");
        const competing = await tx.supportShiftOffer.findFirst({
          where: {
            organizationId: actor.organizationId,
            id: { not: offer.id },
            status: { in: activeOfferStatuses },
            OR: [
              { occurrenceId: targetOccurrence.id },
              { targetOccurrenceId: targetOccurrence.id },
            ],
          },
          select: { id: true },
        });
        if (competing) throw new SupportSchedulingError("CONFLICT");
      } else if (selectedTargetOccurrenceId || offer.targetOccurrenceId) {
        throw new SupportSchedulingError("INVALID_INPUT");
      }

      const accepted = await tx.supportShiftOffer.update({
        where: { id: offer.id },
        data: {
          targetUserId: actor.id,
          targetOccurrenceId: targetOccurrence?.id ?? null,
          policySnapshotJson: JSON.stringify(
            offerPolicySnapshot(
              offer.ruleVersion,
              offer.occurrence,
              targetOccurrence,
            ),
          ),
          peerAcceptedAt: now,
          status: offer.ruleVersion.autoApproveEligibleSwaps
            ? "OPEN"
            : "MANAGER_PENDING",
        },
      });
      const applicationOffer: OfferForApplication = {
        ...offer,
        ...accepted,
        targetUserId: actor.id,
        targetOccurrence,
        occurrence: offer.occurrence,
        ruleVersion: offer.ruleVersion,
      };
      if (offer.ruleVersion.autoApproveEligibleSwaps) {
        return {
          ...(await applyShiftOffer(tx, actor, applicationOffer, now)),
          pending: false,
          source: offer.occurrence,
        };
      }
      await validateOfferApplication(tx, actor, applicationOffer, now);
      await audit(
        tx,
        actor,
        "support_schedule.offer.peer_accepted",
        "SupportShiftOffer",
        offer.id,
        {
          type: offer.type,
          teamId: offer.teamId,
          offeredById: offer.offeredById,
          targetUserId: actor.id,
          occurrenceId: offer.occurrenceId,
          targetOccurrenceId: targetOccurrence?.id ?? null,
          ruleVersionId: offer.ruleVersionId,
          nextStatus: "MANAGER_PENDING",
        },
      );
      return {
        offer: accepted,
        occurrences: [],
        pending: true,
        source: offer.occurrence,
      };
    },
    true,
  );

  await emitInAppNotifications(
    prisma,
    actor.organizationId,
    result.pending
      ? {
          actorId: actor.id,
          recipientRoles: ["ADMIN", "GESTOR"],
          type: "support_schedule.offer.manager_pending",
          title: "Troca de escala aguardando aprovação",
          body: `Uma negociação de ${result.source.localDate} aguarda decisão.`,
          entityType: "SupportShiftOffer",
          entityId: result.offer.id,
          href: scheduleHref({
            date: result.source.localDate,
            teamId: result.offer.teamId,
            offerId: result.offer.id,
            startsAt: result.source.startsAt,
          }),
          dedupeKey: `support-shift-offer:${result.offer.id}:manager-pending`,
        }
      : {
          actorId: actor.id,
          recipientIds: [
            result.offer.offeredById,
            result.offer.targetUserId as string,
          ],
          type: "support_schedule.offer.applied",
          title: "Negociação de escala aplicada",
          body: `A negociação de ${result.source.localDate} foi aplicada.`,
          entityType: "SupportShiftOffer",
          entityId: result.offer.id,
          href: scheduleHref({
            date: result.source.localDate,
            teamId: result.offer.teamId,
            offerId: result.offer.id,
            startsAt: result.source.startsAt,
          }),
          dedupeKey: `support-shift-offer:${result.offer.id}:applied`,
        },
  );
  return {
    offer: result.offer,
    occurrences: result.occurrences,
    pending: result.pending,
  };
}

export async function decideSupportShiftOffer(
  prisma: PrismaClient,
  actor: CurrentUser,
  offerId: string,
  input: unknown,
) {
  ensurePermission(actor, "approve");
  const body = inputObject(input);
  const decision = requiredText(body, "decision", 20).toUpperCase();
  if (decision !== "APPROVED" && decision !== "REJECTED")
    throw new SupportSchedulingError("INVALID_INPUT");
  const reason = optionalText(body, "reason", 300);
  if (decision === "REJECTED" && !reason)
    throw new SupportSchedulingError("INVALID_INPUT");
  const now = new Date();
  const result = await serializable(
    prisma,
    async (tx) => {
      const offer = await tx.supportShiftOffer.findFirst({
        where: {
          id: offerId,
          organizationId: actor.organizationId,
          status: "MANAGER_PENDING",
        },
        include: {
          occurrence: { include: { ruleVersion: true } },
          targetOccurrence: { include: { ruleVersion: true } },
          ruleVersion: true,
        },
      });
      if (!offer) throw new SupportSchedulingError("NOT_FOUND");
      if (offer.offeredById === actor.id || offer.targetUserId === actor.id)
        throw new SupportSchedulingError("FORBIDDEN");
      if (offer.expiresAt && offer.expiresAt <= now)
        throw new SupportSchedulingError("CONFLICT");
      if (decision === "REJECTED") {
        const rejected = await tx.supportShiftOffer.update({
          where: { id: offer.id },
          data: {
            status: "REJECTED",
            decidedById: actor.id,
            decidedAt: now,
            decisionReason: reason,
          },
        });
        await audit(
          tx,
          actor,
          "support_schedule.offer.rejected",
          "SupportShiftOffer",
          offer.id,
          {
            type: offer.type,
            teamId: offer.teamId,
            offeredById: offer.offeredById,
            targetUserId: offer.targetUserId,
            reasonPresent: true,
          },
        );
        return { offer: rejected, occurrences: [], source: offer.occurrence };
      }
      const applied = await applyShiftOffer(tx, actor, offer, now);
      return { ...applied, source: offer.occurrence };
    },
    true,
  );

  await emitInAppNotifications(prisma, actor.organizationId, {
    actorId: actor.id,
    recipientIds: [
      result.offer.offeredById,
      ...(result.offer.targetUserId ? [result.offer.targetUserId] : []),
    ],
    type: `support_schedule.offer.${result.offer.status.toLowerCase()}`,
    title:
      result.offer.status === "APPLIED"
        ? "Troca de escala aprovada"
        : "Troca de escala recusada",
    body: `A negociação de ${result.source.localDate} foi ${result.offer.status === "APPLIED" ? "aplicada" : "recusada"}.`,
    entityType: "SupportShiftOffer",
    entityId: result.offer.id,
    href: scheduleHref({
      date: result.source.localDate,
      teamId: result.offer.teamId,
      offerId: result.offer.id,
      startsAt: result.source.startsAt,
    }),
    dedupeKey: `support-shift-offer:${result.offer.id}:${result.offer.status.toLowerCase()}`,
  });
  return { offer: result.offer, occurrences: result.occurrences };
}

export async function cancelSupportShiftOffer(
  prisma: PrismaClient,
  actor: CurrentUser,
  offerId: string,
  input: unknown = {},
) {
  ensurePermission(actor, "exchange");
  const body = inputObject(input);
  const reason = optionalText(body, "reason", 300);
  const now = new Date();
  const result = await serializable(prisma, async (tx) => {
    const offer = await tx.supportShiftOffer.findFirst({
      where: {
        id: offerId,
        organizationId: actor.organizationId,
        status: { in: activeOfferStatuses },
      },
      include: { occurrence: { select: { localDate: true, startsAt: true } } },
    });
    if (!offer) throw new SupportSchedulingError("NOT_FOUND");
    if (
      offer.offeredById !== actor.id &&
      offer.targetUserId !== actor.id &&
      !isManager(actor)
    ) {
      throw new SupportSchedulingError("FORBIDDEN");
    }
    const cancelled = await tx.supportShiftOffer.update({
      where: { id: offer.id },
      data: {
        status: "CANCELLED",
        decidedById: actor.id,
        decidedAt: now,
        decisionReason: reason,
      },
    });
    await audit(
      tx,
      actor,
      "support_schedule.offer.cancelled",
      "SupportShiftOffer",
      offer.id,
      {
        type: offer.type,
        teamId: offer.teamId,
        offeredById: offer.offeredById,
        targetUserId: offer.targetUserId,
        previousStatus: offer.status,
        reasonPresent: Boolean(reason),
      },
    );
    return { offer: cancelled, source: offer.occurrence };
  });

  const recipientIds = [
    result.offer.offeredById,
    ...(result.offer.targetUserId ? [result.offer.targetUserId] : []),
  ];
  await emitInAppNotifications(prisma, actor.organizationId, {
    actorId: actor.id,
    recipientIds,
    type: "support_schedule.offer.cancelled",
    title: "Negociação de escala cancelada",
    body: `A negociação de ${result.source.localDate} foi cancelada.`,
    entityType: "SupportShiftOffer",
    entityId: result.offer.id,
    href: scheduleHref({
      date: result.source.localDate,
      teamId: result.offer.teamId,
      offerId: result.offer.id,
      startsAt: result.source.startsAt,
    }),
    dedupeKey: `support-shift-offer:${result.offer.id}:cancelled`,
  });
  return { offer: result.offer };
}
