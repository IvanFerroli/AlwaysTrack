import { Prisma, type AnnouncementSeriesVersion, type PrismaClient } from "@prisma/client";
import { commercialAllRoles, commercialManagerRoles, type CurrentUser, type UserRole } from "@alwaystrack/shared";
import { recordAuditLog } from "../audit/audit.service.js";
import { emitInAppNotifications } from "../notifications/notifications.service.js";
import {
  optionalArray,
  optionalBoolean,
  optionalInteger,
  optionalString,
  parseObjectPayload
} from "../validation/input-validation.js";
import { AnnouncementError, type AnnouncementLink } from "./announcements.service.js";
import {
  addLocalDays,
  buildRecurrenceCandidates,
  formatLocalDate,
  isValidIanaTimezone,
  isValidLocalDate,
  isValidLocalTime,
  recurrenceDays,
  zonedLocalDateTimeToUtc
} from "./announcement-recurrence.js";

const priorities = new Set(["LOW", "NORMAL", "HIGH", "CRITICAL"]);
const seriesStatuses = new Set(["ACTIVE", "ARCHIVED"]);
const pendingOccurrenceStatuses = ["SCHEDULED", "FAILED", "PROCESSING"];
const maxMaterializationHorizonDays = 366;

type SeriesWithVersions = Prisma.AnnouncementSeriesGetPayload<{ include: { versions: true } }>;
type DueOccurrence = Prisma.AnnouncementOccurrenceGetPayload<{ include: { announcement: true; version: true } }>;

export interface AnnouncementSeriesVersionInput {
  effectiveFromDate?: string;
  validFromDate?: string;
  validToDate?: string | null;
  timezone?: string;
  localTime?: string;
  recurrenceDays?: number[];
  missingDayPolicy?: "SKIP";
  durationMinutes?: number;
  title?: string;
  summary?: string | null;
  content?: string;
  tags?: string[];
  links?: AnnouncementLink[];
  targetRoles?: UserRole[];
  priority?: string;
  pinned?: boolean;
  requiresAck?: boolean;
}

export interface CreateAnnouncementSeriesInput extends AnnouncementSeriesVersionInput {
  slug?: string;
}

export interface AnnouncementSeriesFilters {
  status?: string;
  fromDate?: string;
  toDate?: string;
}

export interface MaterializeAnnouncementOccurrencesInput {
  actor?: CurrentUser;
  organizationId?: string;
  fromDate?: string;
  toDate?: string;
  horizonDays?: number;
  catchUpDays?: number;
  now?: Date;
  publishDue?: boolean;
  dryRun?: boolean;
}

interface NormalizedVersion {
  effectiveFromDate: string;
  validFromDate: string;
  validToDate: string | null;
  recurrenceType: "MONTHLY_DAYS";
  timezone: string;
  localTime: string;
  recurrenceDays: number[];
  missingDayPolicy: "SKIP";
  durationMinutes: number;
  title: string;
  summary: string | null;
  content: string;
  tags: string[];
  links: AnnouncementLink[];
  targetRoles: UserRole[];
  priority: string;
  pinned: boolean;
  requiresAck: boolean;
}

function isManager(actor: CurrentUser) {
  return (commercialManagerRoles as readonly string[]).includes(actor.role);
}

function ensureManager(actor: CurrentUser) {
  if (!isManager(actor)) throw new AnnouncementError("FORBIDDEN");
}

function text(value: unknown) {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  return normalized.length ? normalized : undefined;
}

function slugify(value: string) {
  return (
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "avisos-programados"
  );
}

function normalizeTags(values: unknown[] = []) {
  return [
    ...new Set(
      values
        .filter((value): value is string => typeof value === "string")
        .map((value) =>
          value
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .replace(/^#/, "")
            .replace(/[^a-z0-9_-]+/g, "-")
            .replace(/^-+|-+$/g, "")
            .slice(0, 32)
        )
        .filter((value) => value.length >= 2)
    )
  ].sort((left, right) => left.localeCompare(right));
}

function normalizeRoles(values: unknown[] = []) {
  const allowed = new Set<string>(commercialAllRoles);
  return [...new Set(values.filter((value): value is UserRole => typeof value === "string" && allowed.has(value)))];
}

function normalizeLinks(values: unknown[] = []) {
  const result: AnnouncementLink[] = [];
  for (const value of values) {
    if (!value || typeof value !== "object" || Array.isArray(value)) continue;
    const item = value as Record<string, unknown>;
    const type = text(item.type)?.toUpperCase();
    const label = text(item.label);
    const href = text(item.href);
    if (!type || !label || !href || !["WIKI", "FAQ", "ANNOUNCEMENT", "CAMPAIGN", "NOTE", "URL"].includes(type)) continue;
    result.push({ type: type as AnnouncementLink["type"], label: label.slice(0, 80), href: href.slice(0, 240) });
  }
  return result.slice(0, 12);
}

function normalizeRecurrenceDays(values: unknown[] | undefined) {
  if (values === undefined) return undefined;
  const days = [...new Set(values.map(Number))].sort((left, right) => left - right);
  if (!days.length || days.some((day) => !Number.isInteger(day) || (day !== 14 && day !== 29))) {
    throw new AnnouncementError("INVALID_INPUT");
  }
  return days;
}

function normalizedPriority(value: string | undefined) {
  const normalized = value?.toUpperCase();
  if (normalized === undefined) return undefined;
  if (!priorities.has(normalized)) throw new AnnouncementError("INVALID_INPUT");
  return normalized;
}

function parseJsonArray<T>(value: string | null | undefined, fallback: T[] = []) {
  if (!value) return fallback;
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? (parsed as T[]) : fallback;
  } catch {
    return fallback;
  }
}

export function parseCreateAnnouncementSeriesInput(payload: unknown): CreateAnnouncementSeriesInput {
  return parseObjectPayload(payload ?? {}, (input) => {
    const recurrence = optionalArray(input, "recurrenceDays", { maxItems: 2 });
    const tags = optionalArray(input, "tags", { maxItems: 30 });
    const links = optionalArray(input, "links", { maxItems: 12 });
    const roles = optionalArray(input, "targetRoles", { maxItems: 8 });
    const missingDayPolicy = optionalString(input, "missingDayPolicy", { maxLength: 20 })?.toUpperCase();
    if (missingDayPolicy && missingDayPolicy !== "SKIP") throw new AnnouncementError("INVALID_INPUT");
    return {
      slug: optionalString(input, "slug", { maxLength: 60 }),
      effectiveFromDate: optionalString(input, "effectiveFromDate", { maxLength: 10 }),
      validFromDate: optionalString(input, "validFromDate", { maxLength: 10 }),
      validToDate: optionalString(input, "validToDate", { maxLength: 10, nullable: true }),
      timezone: optionalString(input, "timezone", { maxLength: 80 }),
      localTime: optionalString(input, "localTime", { maxLength: 5 }),
      recurrenceDays: normalizeRecurrenceDays(recurrence),
      missingDayPolicy: missingDayPolicy as "SKIP" | undefined,
      durationMinutes: optionalInteger(input, "durationMinutes", { min: 1, max: 10_080 }),
      title: optionalString(input, "title", { maxLength: 140 }),
      summary: optionalString(input, "summary", { maxLength: 240, nullable: true }),
      content: optionalString(input, "content", { maxLength: 20_000 }),
      tags: tags ? normalizeTags(tags) : undefined,
      links: links ? normalizeLinks(links) : undefined,
      targetRoles: roles ? normalizeRoles(roles) : undefined,
      priority: normalizedPriority(optionalString(input, "priority", { maxLength: 20 })),
      pinned: optionalBoolean(input, "pinned"),
      requiresAck: optionalBoolean(input, "requiresAck")
    };
  });
}

export function parseAnnouncementSeriesVersionInput(payload: unknown): AnnouncementSeriesVersionInput {
  const { slug: _slug, ...input } = parseCreateAnnouncementSeriesInput(payload);
  return input;
}

export function parseAnnouncementSeriesFilters(query: Record<string, unknown>): AnnouncementSeriesFilters {
  const status = text(query.status)?.toUpperCase();
  if (status && !seriesStatuses.has(status)) throw new AnnouncementError("INVALID_INPUT");
  const fromDate = text(query.fromDate);
  const toDate = text(query.toDate);
  if ((fromDate && !isValidLocalDate(fromDate)) || (toDate && !isValidLocalDate(toDate)) || (fromDate && toDate && fromDate > toDate)) {
    throw new AnnouncementError("INVALID_INPUT");
  }
  return { status, fromDate, toDate };
}

export function parseMaterializeAnnouncementOccurrencesInput(payload: unknown) {
  return parseObjectPayload(payload ?? {}, (input) => ({
    fromDate: optionalString(input, "fromDate", { maxLength: 10 }),
    toDate: optionalString(input, "toDate", { maxLength: 10 }),
    horizonDays: optionalInteger(input, "horizonDays", { min: 0, max: maxMaterializationHorizonDays }),
    catchUpDays: optionalInteger(input, "catchUpDays", { min: 0, max: 31 }),
    publishDue: optionalBoolean(input, "publishDue"),
    dryRun: optionalBoolean(input, "dryRun")
  }));
}

export function parseCancelAnnouncementOccurrenceInput(payload: unknown) {
  return parseObjectPayload(payload ?? {}, (input) => ({
    reason: optionalString(input, "reason", { maxLength: 500 })
  }));
}

function previousVersionInput(previous: AnnouncementSeriesVersion): NormalizedVersion {
  return {
    effectiveFromDate: previous.effectiveFromDate,
    validFromDate: previous.validFromDate,
    validToDate: previous.validToDate,
    recurrenceType: "MONTHLY_DAYS",
    timezone: previous.timezone,
    localTime: previous.localTime,
    recurrenceDays: recurrenceDays(previous.recurrenceDaysJson),
    missingDayPolicy: "SKIP",
    durationMinutes: previous.durationMinutes,
    title: previous.title,
    summary: previous.summary,
    content: previous.content,
    tags: normalizeTags(parseJsonArray(previous.tagsJson)),
    links: normalizeLinks(parseJsonArray(previous.linksJson)),
    targetRoles: normalizeRoles(parseJsonArray(previous.targetRolesJson)),
    priority: previous.priority,
    pinned: previous.pinned,
    requiresAck: previous.requiresAck
  };
}

function normalizeVersion(input: AnnouncementSeriesVersionInput, previous?: AnnouncementSeriesVersion): NormalizedVersion {
  const base = previous ? previousVersionInput(previous) : undefined;
  const validFromDate = input.validFromDate ?? base?.validFromDate;
  const effectiveFromDate = input.effectiveFromDate ?? base?.effectiveFromDate ?? validFromDate;
  const validToDate = input.validToDate === undefined ? (base?.validToDate ?? null) : input.validToDate;
  const timezone = input.timezone ?? base?.timezone;
  const localTime = input.localTime ?? base?.localTime;
  const title = input.title ?? base?.title;
  const content = input.content ?? base?.content;
  const missingDayPolicy = input.missingDayPolicy ?? base?.missingDayPolicy ?? "SKIP";
  const days = input.recurrenceDays ?? base?.recurrenceDays ?? [14, 29];
  const durationMinutes = input.durationMinutes ?? base?.durationMinutes ?? 1440;

  if (
    !effectiveFromDate ||
    !validFromDate ||
    !timezone ||
    !localTime ||
    !title ||
    !content ||
    !isValidLocalDate(effectiveFromDate) ||
    !isValidLocalDate(validFromDate) ||
    (validToDate !== null && !isValidLocalDate(validToDate)) ||
    !isValidIanaTimezone(timezone) ||
    !isValidLocalTime(localTime) ||
    missingDayPolicy !== "SKIP" ||
    !Number.isInteger(durationMinutes) ||
    durationMinutes < 1 ||
    durationMinutes > 10_080 ||
    !days.length ||
    days.some((day) => day !== 14 && day !== 29) ||
    effectiveFromDate < validFromDate ||
    (validToDate !== null && validToDate < effectiveFromDate)
  ) {
    throw new AnnouncementError("INVALID_INPUT");
  }

  return {
    effectiveFromDate,
    validFromDate,
    validToDate,
    recurrenceType: "MONTHLY_DAYS",
    timezone,
    localTime,
    recurrenceDays: [...new Set(days)].sort((left, right) => left - right),
    missingDayPolicy,
    durationMinutes,
    title,
    summary: input.summary === undefined ? (base?.summary ?? null) : input.summary,
    content,
    tags: input.tags ?? base?.tags ?? [],
    links: input.links ?? base?.links ?? [],
    targetRoles: input.targetRoles?.length ? input.targetRoles : (base?.targetRoles.length ? base.targetRoles : [...commercialAllRoles]),
    priority: input.priority ?? base?.priority ?? "NORMAL",
    pinned: input.pinned ?? base?.pinned ?? false,
    requiresAck: input.requiresAck ?? base?.requiresAck ?? false
  };
}

function versionData(version: NormalizedVersion) {
  return {
    effectiveFromDate: version.effectiveFromDate,
    validFromDate: version.validFromDate,
    validToDate: version.validToDate,
    recurrenceType: version.recurrenceType,
    timezone: version.timezone,
    localTime: version.localTime,
    recurrenceDaysJson: JSON.stringify(version.recurrenceDays),
    missingDayPolicy: version.missingDayPolicy,
    durationMinutes: version.durationMinutes,
    title: version.title,
    summary: version.summary,
    content: version.content,
    tagsJson: JSON.stringify(version.tags),
    linksJson: JSON.stringify(version.links),
    targetRolesJson: JSON.stringify(version.targetRoles),
    priority: version.priority,
    pinned: version.pinned,
    requiresAck: version.requiresAck
  };
}

function changedVersionFields(previous: AnnouncementSeriesVersion, next: NormalizedVersion) {
  const previousData = versionData(previousVersionInput(previous));
  const nextData = versionData(next);
  return (Object.keys(nextData) as Array<keyof typeof nextData>).filter(
    (field) => JSON.stringify(previousData[field]) !== JSON.stringify(nextData[field])
  );
}

function formatVersion<T extends AnnouncementSeriesVersion>(version: T) {
  return {
    ...version,
    recurrenceDays: recurrenceDays(version.recurrenceDaysJson),
    tags: normalizeTags(parseJsonArray(version.tagsJson)),
    links: normalizeLinks(parseJsonArray(version.linksJson)),
    targetRoles: normalizeRoles(parseJsonArray(version.targetRolesJson))
  };
}

function isUniqueConflict(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export async function listAnnouncementSeries(
  prisma: PrismaClient,
  actor: CurrentUser,
  filters: AnnouncementSeriesFilters = {}
) {
  ensureManager(actor);
  const occurrenceWhere: Prisma.AnnouncementOccurrenceWhereInput = {
    localDate: filters.fromDate || filters.toDate ? { gte: filters.fromDate, lte: filters.toDate } : undefined
  };
  const items = await prisma.announcementSeries.findMany({
    where: { organizationId: actor.organizationId, status: filters.status },
    include: {
      versions: { orderBy: { version: "desc" } },
      occurrences: {
        where: occurrenceWhere,
        include: { announcement: { select: { id: true, slug: true, status: true, publishedAt: true } } },
        orderBy: { scheduledFor: "desc" },
        take: 200
      }
    },
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }]
  });
  return { items: items.map((item) => ({ ...item, versions: item.versions.map(formatVersion) })), total: items.length };
}

export async function getAnnouncementSeries(prisma: PrismaClient, actor: CurrentUser, seriesId: string) {
  ensureManager(actor);
  const item = await prisma.announcementSeries.findFirst({
    where: { id: seriesId, organizationId: actor.organizationId },
    include: {
      versions: { orderBy: { version: "desc" } },
      occurrences: { include: { announcement: true }, orderBy: { scheduledFor: "desc" }, take: 200 }
    }
  });
  if (!item) throw new AnnouncementError("NOT_FOUND");
  return { series: { ...item, versions: item.versions.map(formatVersion) } };
}

export async function createAnnouncementSeries(prisma: PrismaClient, actor: CurrentUser, input: CreateAnnouncementSeriesInput) {
  ensureManager(actor);
  const normalized = normalizeVersion(input);
  if (normalized.effectiveFromDate !== normalized.validFromDate) throw new AnnouncementError("INVALID_INPUT");
  const slug = slugify(input.slug ?? normalized.title);
  try {
    const result = await prisma.$transaction(async (transaction) => {
      const series = await transaction.announcementSeries.create({
        data: { organizationId: actor.organizationId, slug, createdById: actor.id, updatedById: actor.id }
      });
      const version = await transaction.announcementSeriesVersion.create({
        data: {
          organizationId: actor.organizationId,
          seriesId: series.id,
          version: 1,
          createdById: actor.id,
          ...versionData(normalized)
        }
      });
      await recordAuditLog(transaction as PrismaClient, {
        organizationId: actor.organizationId,
        actorId: actor.id,
        action: "announcement-series.create",
        entityType: "AnnouncementSeries",
        entityId: series.id,
        metadata: { slug, version: 1, effectiveFromDate: version.effectiveFromDate }
      });
      return { series, version };
    });
    return { series: result.series, version: formatVersion(result.version) };
  } catch (error) {
    if (isUniqueConflict(error)) throw new AnnouncementError("SLUG_TAKEN");
    throw error;
  }
}

async function auditOccurrenceCancellations(
  transaction: Prisma.TransactionClient,
  occurrences: Array<{ id: string; localDate: string; versionId: string }>,
  organizationId: string,
  actorId: string,
  reason: string
) {
  for (const occurrence of occurrences) {
    await recordAuditLog(transaction as PrismaClient, {
      organizationId,
      actorId,
      action: "announcement-occurrence.cancel",
      entityType: "AnnouncementOccurrence",
      entityId: occurrence.id,
      metadata: { localDate: occurrence.localDate, versionId: occurrence.versionId, reason }
    });
  }
}

export async function createFutureAnnouncementSeriesVersion(
  prisma: PrismaClient,
  actor: CurrentUser,
  seriesId: string,
  input: AnnouncementSeriesVersionInput,
  now = new Date()
) {
  ensureManager(actor);
  const series = await prisma.announcementSeries.findFirst({
    where: { id: seriesId, organizationId: actor.organizationId, status: "ACTIVE" },
    include: { versions: { orderBy: { version: "desc" }, take: 1 } }
  });
  const previous = series?.versions[0];
  if (!series || !previous) throw new AnnouncementError("NOT_FOUND");
  if (
    !input.effectiveFromDate ||
    input.effectiveFromDate <= formatLocalDate(now, previous.timezone) ||
    input.effectiveFromDate < previous.effectiveFromDate
  ) {
    throw new AnnouncementError("INVALID_INPUT");
  }
  const normalized = normalizeVersion(input, previous);
  const nextVersion = previous.version + 1;
  const reason = `SUPERSEDED_BY_VERSION:${nextVersion}`;
  const changedFields = changedVersionFields(previous, normalized);

  try {
    const result = await prisma.$transaction(async (transaction) => {
      const version = await transaction.announcementSeriesVersion.create({
        data: {
          organizationId: actor.organizationId,
          seriesId: series.id,
          version: nextVersion,
          createdById: actor.id,
          ...versionData(normalized)
        }
      });
      const superseded = await transaction.announcementOccurrence.findMany({
        where: {
          organizationId: actor.organizationId,
          seriesId: series.id,
          localDate: { gte: normalized.effectiveFromDate },
          status: { in: pendingOccurrenceStatuses }
        },
        select: { id: true, localDate: true, versionId: true, announcementId: true }
      });
      if (superseded.length) {
        await transaction.announcementOccurrence.updateMany({
          where: { id: { in: superseded.map((item) => item.id) } },
          data: {
            status: "CANCELLED",
            cancelledAt: now,
            cancelledById: actor.id,
            cancellationReason: reason,
            failureMessage: null
          }
        });
        const announcementIds = superseded.flatMap((item) => (item.announcementId ? [item.announcementId] : []));
        if (announcementIds.length) {
          await transaction.announcement.updateMany({
            where: { id: { in: announcementIds }, organizationId: actor.organizationId },
            data: { status: "ARCHIVED", archivedAt: now, updatedById: actor.id }
          });
        }
        await auditOccurrenceCancellations(transaction, superseded, actor.organizationId, actor.id, reason);
      }
      await transaction.announcementSeries.update({ where: { id: series.id }, data: { updatedById: actor.id } });
      await recordAuditLog(transaction as PrismaClient, {
        organizationId: actor.organizationId,
        actorId: actor.id,
        action: "announcement-series.version.create",
        entityType: "AnnouncementSeriesVersion",
        entityId: version.id,
        metadata: {
          seriesId: series.id,
          version: nextVersion,
          effectiveFromDate: normalized.effectiveFromDate,
          changedFields,
          supersededOccurrences: superseded.length
        }
      });
      return { version, changedFields, supersededOccurrences: superseded.length };
    });
    return { version: formatVersion(result.version), changedFields: result.changedFields, supersededOccurrences: result.supersededOccurrences };
  } catch (error) {
    if (isUniqueConflict(error)) throw new AnnouncementError("CONFLICT");
    throw error;
  }
}

export async function archiveAnnouncementSeries(
  prisma: PrismaClient,
  actor: CurrentUser,
  seriesId: string,
  reason = "SERIES_ARCHIVED",
  now = new Date()
) {
  ensureManager(actor);
  const series = await prisma.announcementSeries.findFirst({ where: { id: seriesId, organizationId: actor.organizationId } });
  if (!series) throw new AnnouncementError("NOT_FOUND");
  if (series.status === "ARCHIVED") return { series, cancelledOccurrences: 0 };

  return prisma.$transaction(async (transaction) => {
    const pending = await transaction.announcementOccurrence.findMany({
      where: { organizationId: actor.organizationId, seriesId, status: { in: pendingOccurrenceStatuses } },
      select: { id: true, localDate: true, versionId: true, announcementId: true }
    });
    const archived = await transaction.announcementSeries.update({
      where: { id: seriesId },
      data: { status: "ARCHIVED", archivedAt: now, updatedById: actor.id }
    });
    if (pending.length) {
      await transaction.announcementOccurrence.updateMany({
        where: { id: { in: pending.map((item) => item.id) } },
        data: { status: "CANCELLED", cancelledAt: now, cancelledById: actor.id, cancellationReason: reason, failureMessage: null }
      });
      const announcementIds = pending.flatMap((item) => (item.announcementId ? [item.announcementId] : []));
      if (announcementIds.length) {
        await transaction.announcement.updateMany({
          where: { id: { in: announcementIds }, organizationId: actor.organizationId },
          data: { status: "ARCHIVED", archivedAt: now, updatedById: actor.id }
        });
      }
      await auditOccurrenceCancellations(transaction, pending, actor.organizationId, actor.id, reason);
    }
    await recordAuditLog(transaction as PrismaClient, {
      organizationId: actor.organizationId,
      actorId: actor.id,
      action: "announcement-series.archive",
      entityType: "AnnouncementSeries",
      entityId: seriesId,
      metadata: { reason, cancelledOccurrences: pending.length }
    });
    return { series: archived, cancelledOccurrences: pending.length };
  });
}

export async function cancelAnnouncementOccurrence(
  prisma: PrismaClient,
  actor: CurrentUser,
  occurrenceId: string,
  reason: string | undefined,
  now = new Date()
) {
  ensureManager(actor);
  const normalizedReason = text(reason);
  if (!normalizedReason || normalizedReason.length < 3) throw new AnnouncementError("INVALID_INPUT");
  const occurrence = await prisma.announcementOccurrence.findFirst({
    where: { id: occurrenceId, organizationId: actor.organizationId },
    include: { announcement: true }
  });
  if (!occurrence) throw new AnnouncementError("NOT_FOUND");
  if (occurrence.status === "CANCELLED") return { occurrence };
  if (occurrence.scheduledFor <= now || !pendingOccurrenceStatuses.includes(occurrence.status)) {
    throw new AnnouncementError("CONFLICT");
  }

  return prisma.$transaction(async (transaction) => {
    const cancelled = await transaction.announcementOccurrence.update({
      where: { id: occurrence.id },
      data: {
        status: "CANCELLED",
        cancelledAt: now,
        cancelledById: actor.id,
        cancellationReason: normalizedReason,
        failureMessage: null
      }
    });
    if (occurrence.announcementId) {
      await transaction.announcement.update({
        where: { id: occurrence.announcementId },
        data: { status: "ARCHIVED", archivedAt: now, updatedById: actor.id }
      });
    }
    await recordAuditLog(transaction as PrismaClient, {
      organizationId: actor.organizationId,
      actorId: actor.id,
      action: "announcement-occurrence.cancel",
      entityType: "AnnouncementOccurrence",
      entityId: occurrence.id,
      metadata: { seriesId: occurrence.seriesId, versionId: occurrence.versionId, localDate: occurrence.localDate, reason: normalizedReason }
    });
    return { occurrence: cancelled };
  });
}

async function createOccurrence(
  prisma: PrismaClient,
  series: SeriesWithVersions,
  version: AnnouncementSeriesVersion,
  localDate: string,
  actorId: string | null
) {
  const idempotencyKey = `${series.id}:${version.id}:${localDate}`;
  const existing = await prisma.announcementOccurrence.findUnique({ where: { idempotencyKey } });
  if (existing) return { occurrence: existing, created: false, stale: false };
  const scheduledFor = zonedLocalDateTimeToUtc(localDate, version.localTime, version.timezone);
  const expiresAt = new Date(scheduledFor.getTime() + version.durationMinutes * 60_000);
  const slug = `${series.slug}-${localDate.replaceAll("-", "")}-v${version.version}`;

  try {
    const result = await prisma.$transaction(async (transaction) => {
      const selectedVersion = await transaction.announcementSeriesVersion.findFirst({
        where: {
          seriesId: series.id,
          effectiveFromDate: { lte: localDate },
          validFromDate: { lte: localDate },
          OR: [{ validToDate: null }, { validToDate: { gte: localDate } }]
        },
        orderBy: [{ effectiveFromDate: "desc" }, { version: "desc" }]
      });
      if (!selectedVersion || selectedVersion.id !== version.id) return { occurrence: null, created: false, stale: true };
      const duplicate = await transaction.announcementOccurrence.findUnique({ where: { idempotencyKey } });
      if (duplicate) return { occurrence: duplicate, created: false, stale: false };
      const announcement = await transaction.announcement.create({
        data: {
          organizationId: series.organizationId,
          slug,
          title: version.title,
          summary: version.summary,
          content: version.content,
          tagsJson: version.tagsJson,
          linksJson: version.linksJson,
          targetRolesJson: version.targetRolesJson,
          status: "SCHEDULED",
          priority: version.priority,
          pinned: version.pinned,
          requiresAck: version.requiresAck,
          startsAt: scheduledFor,
          expiresAt,
          createdById: version.createdById,
          updatedById: version.createdById
        }
      });
      const created = await transaction.announcementOccurrence.create({
        data: {
          organizationId: series.organizationId,
          seriesId: series.id,
          versionId: version.id,
          announcementId: announcement.id,
          idempotencyKey,
          localDate,
          scheduledFor,
          expiresAt
        }
      });
      await recordAuditLog(transaction as PrismaClient, {
        organizationId: series.organizationId,
        actorId,
        action: "announcement-occurrence.materialize",
        entityType: "AnnouncementOccurrence",
        entityId: created.id,
        metadata: { seriesId: series.id, versionId: version.id, localDate, scheduledFor: scheduledFor.toISOString(), idempotencyKey }
      });
      return { occurrence: created, created: true, stale: false };
    });
    return result;
  } catch (error) {
    if (!isUniqueConflict(error)) throw error;
    const duplicate = await prisma.announcementOccurrence.findUnique({ where: { idempotencyKey } });
    if (!duplicate) throw error;
    return { occurrence: duplicate, created: false, stale: false };
  }
}

async function markPublicationFailure(
  prisma: PrismaClient,
  occurrence: DueOccurrence,
  error: unknown,
  now: Date,
  actorId: string | null
) {
  const failureMessage = (error instanceof Error ? error.message : String(error))
    .replace(/Bearer\s+[0-9A-Za-z._-]+/gi, "Bearer [redacted]")
    .replace(/(token|secret|password|api[_-]?key)=([^\s&]+)/gi, "$1=[redacted]")
    .slice(0, 500);
  await prisma.announcementOccurrence.update({
    where: { id: occurrence.id },
    data: { status: "FAILED", failureMessage, lastAttemptAt: now }
  });
  await recordAuditLog(prisma, {
    organizationId: occurrence.organizationId,
    actorId,
    action: "announcement-occurrence.publish.failed",
    entityType: "AnnouncementOccurrence",
    entityId: occurrence.id,
    metadata: { scheduledFor: occurrence.scheduledFor.toISOString(), failureMessage }
  });
  return failureMessage;
}

export async function publishDueAnnouncementOccurrences(
  prisma: PrismaClient,
  options: { organizationId?: string; actorId?: string | null; now?: Date } = {}
) {
  const now = options.now ?? new Date();
  const staleBefore = new Date(now.getTime() - 5 * 60_000);
  const recoveredClaims = await prisma.announcementOccurrence.updateMany({
    where: {
      organizationId: options.organizationId,
      status: "PROCESSING",
      cancelledAt: null,
      scheduledFor: { lte: now },
      expiresAt: { gt: now },
      lastAttemptAt: { lt: staleBefore }
    },
    data: { status: "FAILED", failureMessage: "STALE_PROCESSING_CLAIM" }
  });
  const due = await prisma.announcementOccurrence.findMany({
    where: {
      organizationId: options.organizationId,
      status: { in: ["SCHEDULED", "FAILED"] },
      cancelledAt: null,
      scheduledFor: { lte: now },
      expiresAt: { gt: now }
    },
    include: { announcement: true, version: true },
    orderBy: { scheduledFor: "asc" }
  });
  const published: string[] = [];
  const failed: Array<{ id: string; error: string }> = [];

  for (const occurrence of due) {
    const claim = await prisma.announcementOccurrence.updateMany({
      where: {
        id: occurrence.id,
        status: { in: ["SCHEDULED", "FAILED"] },
        cancelledAt: null,
        scheduledFor: { lte: now },
        expiresAt: { gt: now }
      },
      data: { status: "PROCESSING", lastAttemptAt: now, failureMessage: null }
    });
    if (claim.count !== 1) continue;
    try {
      if (!occurrence.announcement) throw new Error("Occurrence has no linked announcement.");
      const announcement = await prisma.announcement.update({
        where: { id: occurrence.announcement.id },
        data: {
          status: "PUBLISHED",
          publishedAt: occurrence.announcement.publishedAt ?? now,
          archivedAt: null,
          updatedById: occurrence.version.createdById
        }
      });
      const targetRoles = normalizeRoles(parseJsonArray(occurrence.version.targetRolesJson));
      await emitInAppNotifications(prisma, occurrence.organizationId, {
        actorId: options.actorId ?? undefined,
        recipientRoles: targetRoles.length ? targetRoles : [...commercialAllRoles],
        type: "announcement.published",
        title: announcement.priority === "CRITICAL" ? `Aviso critico: ${announcement.title}` : `Novo aviso: ${announcement.title}`,
        body: announcement.summary,
        entityType: "Announcement",
        entityId: announcement.id,
        href: `/avisos/${announcement.slug}`,
        dedupeKey: `announcement-occurrence:${occurrence.id}:published`
      });
      await prisma.$transaction(async (transaction) => {
        await transaction.announcementOccurrence.update({
          where: { id: occurrence.id },
          data: { status: "PUBLISHED", publishedAt: occurrence.publishedAt ?? now, failureMessage: null }
        });
        await recordAuditLog(transaction as PrismaClient, {
          organizationId: occurrence.organizationId,
          actorId: options.actorId ?? null,
          action: "announcement-occurrence.publish",
          entityType: "AnnouncementOccurrence",
          entityId: occurrence.id,
          metadata: { announcementId: announcement.id, scheduledFor: occurrence.scheduledFor.toISOString() }
        });
      });
      published.push(occurrence.id);
    } catch (error) {
      failed.push({
        id: occurrence.id,
        error: await markPublicationFailure(prisma, occurrence, error, now, options.actorId ?? null)
      });
    }
  }
  const maxLagMs = due.reduce((maximum, occurrence) => Math.max(maximum, now.getTime() - occurrence.scheduledFor.getTime()), 0);
  return { recoveredClaims: recoveredClaims.count, due: due.length, maxLagMs, published, failed };
}

export async function expireElapsedAnnouncementOccurrences(
  prisma: PrismaClient,
  options: { organizationId?: string; actorId?: string | null; now?: Date } = {}
) {
  const now = options.now ?? new Date();
  const elapsed = await prisma.announcementOccurrence.findMany({
    where: {
      organizationId: options.organizationId,
      status: { in: ["SCHEDULED", "FAILED", "PROCESSING", "PUBLISHED"] },
      cancelledAt: null,
      expiresAt: { lte: now }
    },
    select: { id: true, organizationId: true, announcementId: true, status: true, scheduledFor: true, expiresAt: true }
  });
  const expired: string[] = [];
  for (const occurrence of elapsed) {
    const claim = await prisma.announcementOccurrence.updateMany({
      where: {
        id: occurrence.id,
        status: { in: ["SCHEDULED", "FAILED", "PROCESSING", "PUBLISHED"] },
        cancelledAt: null,
        expiresAt: { lte: now }
      },
      data: { status: "EXPIRED", failureMessage: null }
    });
    if (claim.count !== 1) continue;
    if (occurrence.announcementId) {
      await prisma.announcement.update({
        where: { id: occurrence.announcementId },
        data: { status: "EXPIRED" }
      });
    }
    await recordAuditLog(prisma, {
      organizationId: occurrence.organizationId,
      actorId: options.actorId ?? null,
      action: "announcement-occurrence.expire",
      entityType: "AnnouncementOccurrence",
      entityId: occurrence.id,
      metadata: {
        previousStatus: occurrence.status,
        scheduledFor: occurrence.scheduledFor.toISOString(),
        expiresAt: occurrence.expiresAt.toISOString()
      }
    });
    expired.push(occurrence.id);
  }
  return { elapsed: elapsed.length, expired };
}

export async function materializeAnnouncementOccurrences(prisma: PrismaClient, input: MaterializeAnnouncementOccurrencesInput = {}) {
  if (input.actor) {
    ensureManager(input.actor);
    if (input.organizationId && input.organizationId !== input.actor.organizationId) throw new AnnouncementError("FORBIDDEN");
  }
  if ((input.fromDate && !isValidLocalDate(input.fromDate)) || (input.toDate && !isValidLocalDate(input.toDate))) {
    throw new AnnouncementError("INVALID_INPUT");
  }
  const horizonDays = input.horizonDays ?? 62;
  const catchUpDays = input.catchUpDays ?? 7;
  if (!Number.isInteger(horizonDays) || horizonDays < 0 || horizonDays > maxMaterializationHorizonDays) {
    throw new AnnouncementError("INVALID_INPUT");
  }
  if (!Number.isInteger(catchUpDays) || catchUpDays < 0 || catchUpDays > 31) throw new AnnouncementError("INVALID_INPUT");
  const organizationId = input.actor?.organizationId ?? input.organizationId;
  const now = input.now ?? new Date();
  const seriesItems = await prisma.announcementSeries.findMany({
    where: { organizationId, status: "ACTIVE" },
    include: { versions: { orderBy: { version: "asc" } } },
    orderBy: { createdAt: "asc" }
  });
  const created: string[] = [];
  const skipped: string[] = [];
  const staleCandidates: Array<{ seriesId: string; versionId: string; localDate: string }> = [];
  const candidates: Array<{ seriesId: string; versionId: string; localDate: string; scheduledFor: string }> = [];

  for (const series of seriesItems) {
    if (!series.versions.length) continue;
    const localTodayDates = series.versions.map((version) => formatLocalDate(now, version.timezone));
    const fromDate = input.fromDate ?? localTodayDates.map((localDate) => addLocalDays(localDate, -catchUpDays)).sort()[0];
    const toDate = input.toDate ?? series.versions.map((version) => addLocalDays(formatLocalDate(now, version.timezone), horizonDays)).sort().at(-1)!;
    if (fromDate > toDate) throw new AnnouncementError("INVALID_INPUT");
    for (const candidate of buildRecurrenceCandidates(series.versions, fromDate, toDate)) {
      const scheduledFor = zonedLocalDateTimeToUtc(candidate.localDate, candidate.version.localTime, candidate.version.timezone);
      candidates.push({ seriesId: series.id, versionId: candidate.version.id, localDate: candidate.localDate, scheduledFor: scheduledFor.toISOString() });
      if (input.dryRun) continue;
      const result = await createOccurrence(prisma, series, candidate.version, candidate.localDate, input.actor?.id ?? null);
      if (result.stale || !result.occurrence) {
        staleCandidates.push({ seriesId: series.id, versionId: candidate.version.id, localDate: candidate.localDate });
      } else {
        (result.created ? created : skipped).push(result.occurrence.id);
      }
    }
  }

  const expiration = !input.dryRun
    ? await expireElapsedAnnouncementOccurrences(prisma, {
        organizationId,
        actorId: input.actor?.id ?? null,
        now
      })
    : { elapsed: 0, expired: [] };
  const publication =
    !input.dryRun && input.publishDue !== false
      ? await publishDueAnnouncementOccurrences(prisma, {
          organizationId,
          actorId: input.actor?.id ?? null,
          now
        })
      : { recoveredClaims: 0, due: 0, maxLagMs: 0, published: [], failed: [] };
  return { series: seriesItems.length, candidates, created, skipped, staleCandidates, expiration, publication, dryRun: input.dryRun ?? false };
}
