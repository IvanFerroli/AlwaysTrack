import type { Prisma, PrismaClient } from "@prisma/client";
import { commercialAllRoles, commercialManagerRoles, type CurrentUser, type UserRole } from "@alwaystrack/shared";
import { recordAuditLog } from "../audit/audit.service.js";
import { emitInAppNotifications } from "../notifications/notifications.service.js";
import { optionalArray, optionalBoolean, optionalString, parseObjectPayload } from "../validation/input-validation.js";

export class AnnouncementError extends Error {
  constructor(public readonly code: "NOT_FOUND" | "INVALID_INPUT" | "FORBIDDEN" | "SLUG_TAKEN" | "CONFLICT") {
    super(code);
  }
}

export interface AnnouncementInput {
  title?: string;
  slug?: string | null;
  summary?: string | null;
  content?: string;
  tags?: string[];
  links?: AnnouncementLink[];
  targetRoles?: UserRole[];
  status?: string;
  priority?: string;
  pinned?: boolean;
  requiresAck?: boolean;
  startsAt?: Date | null;
  expiresAt?: Date | null;
}

export interface AnnouncementFilters {
  query?: string;
  status?: string;
  priority?: string;
  tags?: string[];
  recent?: string;
  activeOnly?: boolean;
}

export interface AnnouncementLink {
  type: "WIKI" | "FAQ" | "ANNOUNCEMENT" | "CAMPAIGN" | "NOTE" | "URL";
  label: string;
  href: string;
}

export interface AnnouncementAcknowledgementUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface AnnouncementAcknowledgementCompliance {
  audienceCount: number;
  acknowledgedCount: number;
  openedCount: number;
  pendingCount: number;
  completed: boolean;
  acknowledgedUsers: AnnouncementAcknowledgementUser[];
  openedWithoutAckUsers: AnnouncementAcknowledgementUser[];
  notOpenedUsers: AnnouncementAcknowledgementUser[];
}

export interface AnnouncementAcknowledgementSource {
  id: string;
  targetRolesJson: string | null;
}

const statuses = new Set(["DRAFT", "SCHEDULED", "PUBLISHED", "ARCHIVED", "EXPIRED"]);
const priorities = new Set(["LOW", "NORMAL", "HIGH", "CRITICAL"]);
const contentFormat = "MARKDOWN";

function isManager(actor: CurrentUser) {
  return (commercialManagerRoles as readonly string[]).includes(actor.role);
}

function ensureManager(actor: CurrentUser) {
  if (!isManager(actor)) throw new AnnouncementError("FORBIDDEN");
}

function cleanText(value: unknown) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function cleanOptionalText(value: unknown) {
  if (value === null) return null;
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function cleanBoolean(value: unknown) {
  return typeof value === "boolean" ? value : undefined;
}

function cleanStatus(value: unknown) {
  return typeof value === "string" && statuses.has(value.toUpperCase()) ? value.toUpperCase() : undefined;
}

function cleanPriority(value: unknown) {
  return typeof value === "string" && priorities.has(value.toUpperCase()) ? value.toUpperCase() : undefined;
}

function cleanDate(value: unknown) {
  if (value === null) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value !== "string" || !value.trim()) return undefined;
  const parsed = new Date(value.includes("T") ? value : `${value}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function normalizedTags(values: unknown[] = []) {
  const tags = new Set<string>();
  for (const value of values) {
    if (typeof value !== "string") continue;
    const normalized = value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/^#/, "")
      .replace(/[^a-z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 32);
    if (normalized.length >= 2) tags.add(normalized);
  }
  return [...tags].sort((left, right) => left.localeCompare(right));
}

function tagsFromJson(value: string | null | undefined) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? normalizedTags(parsed) : [];
  } catch {
    return [];
  }
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

function tagsJsonFor(values: unknown[] = []) {
  return JSON.stringify(normalizedTags(values));
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "aviso";
}

function cleanRoles(values: unknown[] = []) {
  const allowed = new Set<string>(commercialAllRoles);
  const roles = new Set<UserRole>();
  for (const value of values) {
    if (typeof value === "string" && allowed.has(value)) roles.add(value as UserRole);
  }
  return [...roles];
}

/** Builds tenant-bound acknowledgement compliance for several announcements with one audience query. */
export async function getAnnouncementsAcknowledgementCompliance(
  prisma: PrismaClient,
  organizationId: string,
  announcements: AnnouncementAcknowledgementSource[]
) {
  const sources = [...new Map(announcements.map((announcement) => [announcement.id, announcement])).values()];
  if (sources.length === 0) return new Map<string, AnnouncementAcknowledgementCompliance>();

  const rolesByAnnouncementId = new Map(
    sources.map((announcement) => [announcement.id, cleanRoles(parseJsonArray<unknown>(announcement.targetRolesJson))])
  );
  const targetRoles = [...new Set([...rolesByAnnouncementId.values()].flat())];
  const [users, receipts] = await Promise.all([
    targetRoles.length
      ? prisma.user.findMany({
          where: { organizationId, active: true, role: { in: targetRoles } },
          select: { id: true, name: true, email: true, role: true },
          orderBy: [{ name: "asc" }, { email: "asc" }, { id: "asc" }]
        })
      : Promise.resolve([]),
    prisma.announcementReadReceipt.findMany({
      where: { organizationId, announcementId: { in: sources.map((announcement) => announcement.id) } },
      select: { announcementId: true, userId: true, acknowledgedAt: true }
    })
  ]);
  const receiptsByAnnouncementId = new Map<string, Map<string, { acknowledgedAt: Date | null }>>();
  for (const receipt of receipts) {
    const announcementReceipts = receiptsByAnnouncementId.get(receipt.announcementId) ?? new Map();
    announcementReceipts.set(receipt.userId, { acknowledgedAt: receipt.acknowledgedAt });
    receiptsByAnnouncementId.set(receipt.announcementId, announcementReceipts);
  }

  return new Map(
    sources.map((announcement) => {
      const targetRoleSet = new Set(rolesByAnnouncementId.get(announcement.id) ?? []);
      const audience = users.filter((user) => targetRoleSet.has(user.role as UserRole));
      const announcementReceipts = receiptsByAnnouncementId.get(announcement.id) ?? new Map();
      const acknowledgedUsers: AnnouncementAcknowledgementUser[] = [];
      const openedWithoutAckUsers: AnnouncementAcknowledgementUser[] = [];
      const notOpenedUsers: AnnouncementAcknowledgementUser[] = [];

      for (const user of audience) {
        const receipt = announcementReceipts.get(user.id);
        if (receipt?.acknowledgedAt) acknowledgedUsers.push(user);
        else if (receipt) openedWithoutAckUsers.push(user);
        else notOpenedUsers.push(user);
      }

      const audienceCount = audience.length;
      const acknowledgedCount = acknowledgedUsers.length;
      return [
        announcement.id,
        {
          audienceCount,
          acknowledgedCount,
          openedCount: acknowledgedCount + openedWithoutAckUsers.length,
          pendingCount: audienceCount - acknowledgedCount,
          completed: audienceCount > 0 && acknowledgedCount === audienceCount,
          acknowledgedUsers,
          openedWithoutAckUsers,
          notOpenedUsers
        }
      ];
    })
  );
}

function allowedAnnouncementHref(value: string) {
  if (/[\u0000-\u001f\u007f\\]/.test(value)) return false;
  if (value.startsWith("/")) return !value.startsWith("//");
  if (!/^https:\/\//i.test(value)) return false;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

export function normalizeAnnouncementLinks(values: unknown[] = [], strict = false) {
  const links: AnnouncementLink[] = [];
  for (const value of values) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      if (strict) throw new AnnouncementError("INVALID_INPUT");
      continue;
    }
    const item = value as Record<string, unknown>;
    const type = cleanText(item.type)?.toUpperCase();
    const label = cleanText(item.label);
    const href = cleanText(item.href);
    if (
      !type ||
      !label ||
      !href ||
      !["WIKI", "FAQ", "ANNOUNCEMENT", "CAMPAIGN", "NOTE", "URL"].includes(type) ||
      !allowedAnnouncementHref(href)
    ) {
      if (strict) throw new AnnouncementError("INVALID_INPUT");
      continue;
    }
    links.push({ type: type as AnnouncementLink["type"], label: label.slice(0, 80), href: href.slice(0, 240) });
  }
  return links.slice(0, 12);
}

function recentSince(value: string | undefined) {
  const days = value === "7" ? 7 : value === "30" ? 30 : undefined;
  if (!days) return undefined;
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - days);
  return since;
}

function effectiveStatus(item: { status: string; startsAt: Date | null; expiresAt: Date | null }, now = new Date()) {
  if (item.status !== "PUBLISHED") return item.status;
  if (item.startsAt && item.startsAt > now) return "SCHEDULED";
  if (item.expiresAt && item.expiresAt < now) return "EXPIRED";
  return "PUBLISHED";
}

function visibleAnnouncementWhere(actor: CurrentUser, now = new Date()): Prisma.AnnouncementWhereInput {
  if (isManager(actor)) return { organizationId: actor.organizationId };
  return {
    organizationId: actor.organizationId,
    status: "PUBLISHED",
    OR: [{ startsAt: null }, { startsAt: { lte: now } }],
    AND: [{ OR: [{ expiresAt: null }, { expiresAt: { gte: now } }] }],
    targetRolesJson: { contains: `"${actor.role}"` }
  };
}

function activeWindowWhere(now = new Date()): Prisma.AnnouncementWhereInput[] {
  return [{ OR: [{ startsAt: null }, { startsAt: { lte: now } }] }, { OR: [{ expiresAt: null }, { expiresAt: { gte: now } }] }];
}

function tagWhere(tags: string[] | undefined) {
  const normalized = normalizedTags(tags ?? []);
  return normalized.length ? normalized.map((tag) => ({ tagsJson: { contains: `"${tag}"` } })) : undefined;
}

function withAnnouncementFormat<T extends { tagsJson?: string | null; linksJson?: string | null; targetRolesJson?: string | null; status: string; startsAt: Date | null; expiresAt: Date | null }>(
  item: T
) {
  return {
    ...item,
    contentFormat,
    status: effectiveStatus(item),
    tags: tagsFromJson(item.tagsJson),
    links: normalizeAnnouncementLinks(parseJsonArray<unknown>(item.linksJson)),
    targetRoles: parseJsonArray<UserRole>(item.targetRolesJson)
  };
}

export function parseAnnouncementInput(payload: unknown): AnnouncementInput {
  return parseObjectPayload(payload ?? {}, (input) => {
    const tags = optionalArray(input, "tags", { maxItems: 30 });
    const links = optionalArray(input, "links", { maxItems: 12 });
    const targetRoles = optionalArray(input, "targetRoles", { maxItems: 8 });
    return {
      title: optionalString(input, "title", { maxLength: 140 }),
      slug: optionalString(input, "slug", { maxLength: 90, nullable: true }),
      summary: optionalString(input, "summary", { maxLength: 240, nullable: true }),
      content: optionalString(input, "content", { maxLength: 20_000 }),
      tags: tags ? normalizedTags(tags) : undefined,
      links: links ? normalizeAnnouncementLinks(links, true) : undefined,
      targetRoles: targetRoles ? cleanRoles(targetRoles) : undefined,
      status: cleanStatus(optionalString(input, "status", { maxLength: 20 })),
      priority: cleanPriority(optionalString(input, "priority", { maxLength: 20 })),
      pinned: optionalBoolean(input, "pinned"),
      requiresAck: optionalBoolean(input, "requiresAck"),
      startsAt: cleanDate(input.startsAt),
      expiresAt: cleanDate(input.expiresAt)
    };
  });
}

export function parseAnnouncementFilters(query: Record<string, unknown>): AnnouncementFilters {
  return {
    query: cleanText(query.query),
    status: cleanStatus(query.status),
    priority: cleanPriority(query.priority),
    tags: cleanText(query.tags)?.split(",").map((item) => item.trim()),
    recent: cleanText(query.recent),
    activeOnly: query.activeOnly === "1" || query.activeOnly === "true"
  };
}

export async function listAnnouncements(prisma: PrismaClient, actor: CurrentUser, filters: AnnouncementFilters = {}) {
  const now = new Date();
  const baseWhere = visibleAnnouncementWhere(actor, now);
  const andFilters: Prisma.AnnouncementWhereInput[] = [
    ...(Array.isArray(baseWhere.AND) ? baseWhere.AND : baseWhere.AND ? [baseWhere.AND] : []),
    filters.query
      ? {
          OR: [
            { title: { contains: filters.query } },
            { summary: { contains: filters.query } },
            { content: { contains: filters.query } },
            { tagsJson: { contains: filters.query } }
          ]
        }
      : undefined,
    tagWhere(filters.tags)?.length ? { OR: tagWhere(filters.tags) } : undefined,
    ...(filters.activeOnly ? activeWindowWhere(now) : [])
  ].filter(Boolean) as Prisma.AnnouncementWhereInput[];
  const where: Prisma.AnnouncementWhereInput = {
    ...baseWhere,
    status: isManager(actor) ? filters.status ?? (filters.activeOnly ? "PUBLISHED" : undefined) : "PUBLISHED",
    priority: filters.priority,
    updatedAt: filters.recent ? { gte: recentSince(filters.recent) } : undefined,
    AND: andFilters.length ? andFilters : undefined
  };

  const [items, total] = await Promise.all([
    prisma.announcement.findMany({
      where,
      include: {
        createdBy: { select: { id: true, name: true, email: true, role: true } },
        updatedBy: { select: { id: true, name: true, email: true, role: true } },
        readReceipts: isManager(actor) ? { orderBy: { updatedAt: "desc" } } : { where: { userId: actor.id }, take: 1 }
      },
      orderBy: [{ pinned: "desc" }, { priority: "desc" }, { publishedAt: "desc" }, { updatedAt: "desc" }],
      take: 100
    }),
    prisma.announcement.count({ where })
  ]);
  const formattedItems = items.map(withAnnouncementFormat);
  if (!isManager(actor)) return { items: formattedItems, total };

  const complianceByAnnouncementId = await getAnnouncementsAcknowledgementCompliance(
    prisma,
    actor.organizationId,
    items.filter((item) => item.requiresAck).map((item) => ({ id: item.id, targetRolesJson: item.targetRolesJson }))
  );
  return {
    items: formattedItems.map((item) => ({
      ...item,
      acknowledgement: item.requiresAck ? (complianceByAnnouncementId.get(item.id) ?? null) : null
    })),
    total
  };
}

export async function getAnnouncementBySlug(prisma: PrismaClient, actor: CurrentUser, slug: string) {
  const item = await prisma.announcement.findFirst({
    where: { ...visibleAnnouncementWhere(actor), slug },
    include: {
      createdBy: { select: { id: true, name: true, email: true, role: true } },
      updatedBy: { select: { id: true, name: true, email: true, role: true } },
      readReceipts: {
        where: isManager(actor) ? undefined : { userId: actor.id },
        include: { user: { select: { id: true, name: true, email: true, role: true } } },
        orderBy: { updatedAt: "desc" }
      }
    }
  });
  if (!item) throw new AnnouncementError("NOT_FOUND");
  await prisma.announcementReadReceipt.upsert({
    where: { announcementId_userId: { announcementId: item.id, userId: actor.id } },
    create: { organizationId: actor.organizationId, announcementId: item.id, userId: actor.id, acknowledgedAt: item.requiresAck ? null : new Date() },
    update: item.requiresAck ? {} : { acknowledgedAt: new Date() }
  });
  const formatted = withAnnouncementFormat(item);
  if (!isManager(actor) || !item.requiresAck) return { announcement: formatted };
  const compliance = await getAnnouncementsAcknowledgementCompliance(prisma, actor.organizationId, [
    { id: item.id, targetRolesJson: item.targetRolesJson }
  ]);
  return { announcement: { ...formatted, acknowledgement: compliance.get(item.id) ?? null } };
}

export async function createAnnouncement(prisma: PrismaClient, actor: CurrentUser, input: AnnouncementInput) {
  ensureManager(actor);
  if (!input.title || !input.content) throw new AnnouncementError("INVALID_INPUT");
  const slug = slugify(input.slug ?? input.title);
  const existing = await prisma.announcement.findFirst({ where: { organizationId: actor.organizationId, slug } });
  if (existing) throw new AnnouncementError("SLUG_TAKEN");
  const status = input.status ?? "DRAFT";
  const item = await prisma.announcement.create({
    data: {
      organizationId: actor.organizationId,
      slug,
      title: input.title,
      summary: input.summary ?? null,
      content: input.content,
      tagsJson: tagsJsonFor(input.tags),
      linksJson: JSON.stringify(normalizeAnnouncementLinks(input.links ?? [], true)),
      targetRolesJson: JSON.stringify(input.targetRoles?.length ? input.targetRoles : commercialAllRoles),
      status,
      priority: input.priority ?? "NORMAL",
      pinned: input.pinned ?? false,
      requiresAck: input.requiresAck ?? false,
      startsAt: input.startsAt,
      expiresAt: input.expiresAt,
      publishedAt: status === "PUBLISHED" ? new Date() : null,
      createdById: actor.id,
      updatedById: actor.id
    }
  });
  await recordAuditLog(prisma, {
    organizationId: actor.organizationId,
    actorId: actor.id,
    action: "announcement.create",
    entityType: "Announcement",
    entityId: item.id,
    metadata: { slug: item.slug, status: item.status, priority: item.priority }
  });
  if (item.status === "PUBLISHED") await notifyAnnouncementPublished(prisma, actor, withAnnouncementFormat(item));
  return { announcement: withAnnouncementFormat(item) };
}

export async function updateAnnouncement(prisma: PrismaClient, actor: CurrentUser, announcementId: string, input: AnnouncementInput) {
  ensureManager(actor);
  const current = await prisma.announcement.findFirst({ where: { id: announcementId, organizationId: actor.organizationId } });
  if (!current) throw new AnnouncementError("NOT_FOUND");
  const nextSlug = input.slug === undefined ? current.slug : slugify(input.slug ?? input.title ?? current.title);
  if (nextSlug !== current.slug) {
    const existing = await prisma.announcement.findFirst({ where: { organizationId: actor.organizationId, slug: nextSlug, id: { not: current.id } } });
    if (existing) throw new AnnouncementError("SLUG_TAKEN");
  }
  const nextLinksJson =
    input.links === undefined ? current.linksJson : JSON.stringify(normalizeAnnouncementLinks(input.links, true));
  const nextTargetRolesJson = input.targetRoles === undefined
    ? current.targetRolesJson
    : JSON.stringify(input.targetRoles.length ? input.targetRoles : commercialAllRoles);
  const acknowledgementContentChanged = [
    input.title !== undefined && input.title !== current.title,
    input.summary !== undefined && input.summary !== current.summary,
    input.content !== undefined && input.content !== current.content,
    input.links !== undefined && nextLinksJson !== current.linksJson,
    input.targetRoles !== undefined && nextTargetRolesJson !== current.targetRolesJson,
    input.requiresAck !== undefined && input.requiresAck !== current.requiresAck
  ].some(Boolean);
  const updateOperation = prisma.announcement.update({
    where: { id: current.id },
    data: {
      slug: nextSlug,
      title: input.title,
      summary: input.summary,
      content: input.content,
      tagsJson: input.tags ? tagsJsonFor(input.tags) : undefined,
      linksJson: input.links ? nextLinksJson : undefined,
      targetRolesJson: input.targetRoles ? nextTargetRolesJson : undefined,
      status: input.status,
      priority: input.priority,
      pinned: input.pinned,
      requiresAck: input.requiresAck,
      startsAt: input.startsAt,
      expiresAt: input.expiresAt,
      publishedAt: input.status === "PUBLISHED" && !current.publishedAt ? new Date() : undefined,
      archivedAt: input.status === "ARCHIVED" ? new Date() : undefined,
      updatedById: actor.id
    }
  });
  let item: Awaited<typeof updateOperation>;
  let acknowledgementsReset = 0;
  let completionNotificationsCleared = 0;
  if (acknowledgementContentChanged) {
    const [updated, deleted, clearedNotifications] = await prisma.$transaction([
      updateOperation,
      prisma.announcementReadReceipt.deleteMany({
        where: { organizationId: actor.organizationId, announcementId: current.id }
      }),
      prisma.inAppNotification.deleteMany({
        where: {
          organizationId: actor.organizationId,
          entityType: "Announcement",
          entityId: current.id,
          type: "announcement.acknowledgement.completed"
        }
      })
    ]);
    item = updated;
    acknowledgementsReset = deleted.count;
    completionNotificationsCleared = clearedNotifications.count;
  } else {
    item = await updateOperation;
  }
  await recordAuditLog(prisma, {
    organizationId: actor.organizationId,
    actorId: actor.id,
    action: "announcement.update",
    entityType: "Announcement",
    entityId: item.id,
    metadata: {
      slug: item.slug,
      status: item.status,
      priority: item.priority,
      acknowledgementContentChanged,
      acknowledgementsReset,
      completionNotificationsCleared
    }
  });
  if (acknowledgementContentChanged && item.status === "PUBLISHED" && item.requiresAck) {
    await emitInAppNotifications(prisma, actor.organizationId, {
      recipientRoles: cleanRoles(parseJsonArray<unknown>(item.targetRolesJson)),
      type: "announcement.acknowledgement.reset",
      title: "Aviso atualizado: nova ciência necessária",
      body: `O aviso "${item.title}" foi atualizado. Abra o conteúdo revisado e marque ciência novamente.`,
      entityType: "Announcement",
      entityId: item.id,
      href: `/avisos/${item.slug}`,
      dedupeKey: `announcement:${item.id}:acknowledgement:reset:${item.updatedAt.getTime()}`
    });
  }
  return { announcement: withAnnouncementFormat(item) };
}

export async function publishAnnouncement(prisma: PrismaClient, actor: CurrentUser, announcementId: string) {
  ensureManager(actor);
  const item = await prisma.announcement.findFirst({ where: { id: announcementId, organizationId: actor.organizationId } });
  if (!item) throw new AnnouncementError("NOT_FOUND");
  const published = await prisma.announcement.update({
    where: { id: item.id },
    data: { status: "PUBLISHED", publishedAt: item.publishedAt ?? new Date(), archivedAt: null, updatedById: actor.id }
  });
  await recordAuditLog(prisma, {
    organizationId: actor.organizationId,
    actorId: actor.id,
    action: "announcement.publish",
    entityType: "Announcement",
    entityId: published.id,
    metadata: { slug: published.slug, priority: published.priority }
  });
  await notifyAnnouncementPublished(prisma, actor, withAnnouncementFormat(published));
  return { announcement: withAnnouncementFormat(published) };
}

export async function archiveAnnouncement(prisma: PrismaClient, actor: CurrentUser, announcementId: string) {
  ensureManager(actor);
  const item = await prisma.announcement.findFirst({ where: { id: announcementId, organizationId: actor.organizationId } });
  if (!item) throw new AnnouncementError("NOT_FOUND");
  const archived = await prisma.announcement.update({
    where: { id: item.id },
    data: { status: "ARCHIVED", archivedAt: new Date(), updatedById: actor.id }
  });
  await recordAuditLog(prisma, {
    organizationId: actor.organizationId,
    actorId: actor.id,
    action: "announcement.archive",
    entityType: "Announcement",
    entityId: archived.id,
    metadata: { slug: archived.slug }
  });
  return { announcement: withAnnouncementFormat(archived) };
}

export async function acknowledgeAnnouncement(prisma: PrismaClient, actor: CurrentUser, announcementId: string) {
  const item = await prisma.announcement.findFirst({ where: { ...visibleAnnouncementWhere(actor), id: announcementId } });
  if (!item) throw new AnnouncementError("NOT_FOUND");
  const targetRoles = cleanRoles(parseJsonArray<unknown>(item.targetRolesJson));
  if (!item.requiresAck || effectiveStatus(item) !== "PUBLISHED" || !targetRoles.includes(actor.role)) {
    throw new AnnouncementError("FORBIDDEN");
  }
  const existingReceipt = await prisma.announcementReadReceipt.findUnique({
    where: { announcementId_userId: { announcementId: item.id, userId: actor.id } },
    select: { acknowledgedAt: true }
  });
  const acknowledgedAt = existingReceipt?.acknowledgedAt ?? new Date();
  const receipt = await prisma.announcementReadReceipt.upsert({
    where: { announcementId_userId: { announcementId: item.id, userId: actor.id } },
    create: { organizationId: actor.organizationId, announcementId: item.id, userId: actor.id, acknowledgedAt },
    update: existingReceipt?.acknowledgedAt ? {} : { acknowledgedAt }
  });

  if (item.requiresAck && !existingReceipt?.acknowledgedAt && targetRoles.includes(actor.role)) {
    const compliance = (
      await getAnnouncementsAcknowledgementCompliance(prisma, actor.organizationId, [
        { id: item.id, targetRolesJson: item.targetRolesJson }
      ])
    ).get(item.id);
    if (compliance?.completed) {
      await emitInAppNotifications(prisma, actor.organizationId, {
        recipientRoles: [...commercialManagerRoles],
        type: "announcement.acknowledgement.completed",
        title: "Todos marcaram ciência",
        body: `Todos os ${compliance.audienceCount} destinatários marcaram ciência no aviso \"${item.title}\".`,
        entityType: "Announcement",
        entityId: item.id,
        href: `/avisos/${item.slug}`,
        dedupeKey: `announcement:${item.id}:acknowledgement:completed:${item.updatedAt.getTime()}`
      });
    }
  }
  return { receipt };
}

async function notifyAnnouncementPublished(
  prisma: PrismaClient,
  actor: CurrentUser,
  item: { id: string; slug: string; title: string; summary: string | null; priority: string; targetRoles: UserRole[] }
) {
  await emitInAppNotifications(prisma, actor.organizationId, {
    actorId: actor.id,
    recipientRoles: item.targetRoles.length ? item.targetRoles : [...commercialAllRoles],
    type: "announcement.published",
    title: item.priority === "CRITICAL" ? `Aviso critico: ${item.title}` : `Novo aviso: ${item.title}`,
    body: item.summary,
    entityType: "Announcement",
    entityId: item.id,
    href: `/avisos/${item.slug}`,
    dedupeKey: `announcement:${item.id}:published`
  });
}
