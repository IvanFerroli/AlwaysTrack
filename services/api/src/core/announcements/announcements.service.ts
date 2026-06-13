import type { Prisma, PrismaClient } from "@prisma/client";
import { commercialAllRoles, commercialManagerRoles, type CurrentUser, type UserRole } from "@alwaystrack/shared";
import { recordAuditLog } from "../audit/audit.service.js";
import { emitInAppNotifications } from "../notifications/notifications.service.js";

export class AnnouncementError extends Error {
  constructor(public readonly code: "NOT_FOUND" | "INVALID_INPUT" | "FORBIDDEN" | "SLUG_TAKEN") {
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

function cleanLinks(values: unknown[] = []) {
  const links: AnnouncementLink[] = [];
  for (const value of values) {
    if (!value || typeof value !== "object") continue;
    const item = value as Record<string, unknown>;
    const type = cleanText(item.type)?.toUpperCase();
    const label = cleanText(item.label);
    const href = cleanText(item.href);
    if (!type || !label || !href) continue;
    if (!["WIKI", "FAQ", "ANNOUNCEMENT", "CAMPAIGN", "NOTE", "URL"].includes(type)) continue;
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
    links: parseJsonArray<AnnouncementLink>(item.linksJson),
    targetRoles: parseJsonArray<UserRole>(item.targetRolesJson)
  };
}

export function parseAnnouncementInput(payload: unknown): AnnouncementInput {
  const input = (payload ?? {}) as Record<string, unknown>;
  return {
    title: cleanText(input.title),
    slug: cleanOptionalText(input.slug),
    summary: cleanOptionalText(input.summary),
    content: cleanText(input.content),
    tags: Array.isArray(input.tags) ? normalizedTags(input.tags) : undefined,
    links: Array.isArray(input.links) ? cleanLinks(input.links) : undefined,
    targetRoles: Array.isArray(input.targetRoles) ? cleanRoles(input.targetRoles) : undefined,
    status: cleanStatus(input.status),
    priority: cleanPriority(input.priority),
    pinned: cleanBoolean(input.pinned),
    requiresAck: cleanBoolean(input.requiresAck),
    startsAt: cleanDate(input.startsAt),
    expiresAt: cleanDate(input.expiresAt)
  };
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
  const where: Prisma.AnnouncementWhereInput = {
    ...visibleAnnouncementWhere(actor, now),
    status: filters.status ?? (filters.activeOnly ? "PUBLISHED" : undefined),
    priority: filters.priority,
    updatedAt: filters.recent ? { gte: recentSince(filters.recent) } : undefined,
    AND: [
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
      filters.activeOnly ? { OR: [{ startsAt: null }, { startsAt: { lte: now } }] } : undefined,
      filters.activeOnly ? { OR: [{ expiresAt: null }, { expiresAt: { gte: now } }] } : undefined
    ].filter(Boolean) as Prisma.AnnouncementWhereInput[]
  };

  const [items, total] = await Promise.all([
    prisma.announcement.findMany({
      where,
      include: {
        createdBy: { select: { id: true, name: true, email: true, role: true } },
        updatedBy: { select: { id: true, name: true, email: true, role: true } },
        readReceipts: { where: { userId: actor.id }, take: 1 }
      },
      orderBy: [{ pinned: "desc" }, { priority: "desc" }, { publishedAt: "desc" }, { updatedAt: "desc" }],
      take: 100
    }),
    prisma.announcement.count({ where })
  ]);
  return { items: items.map(withAnnouncementFormat), total };
}

export async function getAnnouncementBySlug(prisma: PrismaClient, actor: CurrentUser, slug: string) {
  const item = await prisma.announcement.findFirst({
    where: { ...visibleAnnouncementWhere(actor), slug },
    include: {
      createdBy: { select: { id: true, name: true, email: true, role: true } },
      updatedBy: { select: { id: true, name: true, email: true, role: true } },
      readReceipts: { include: { user: { select: { id: true, name: true, email: true, role: true } } }, orderBy: { updatedAt: "desc" } }
    }
  });
  if (!item) throw new AnnouncementError("NOT_FOUND");
  await prisma.announcementReadReceipt.upsert({
    where: { announcementId_userId: { announcementId: item.id, userId: actor.id } },
    create: { organizationId: actor.organizationId, announcementId: item.id, userId: actor.id, acknowledgedAt: item.requiresAck ? null : new Date() },
    update: item.requiresAck ? {} : { acknowledgedAt: new Date() }
  });
  return { announcement: withAnnouncementFormat(item) };
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
      linksJson: JSON.stringify(input.links ?? []),
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
  const item = await prisma.announcement.update({
    where: { id: current.id },
    data: {
      slug: nextSlug,
      title: input.title,
      summary: input.summary,
      content: input.content,
      tagsJson: input.tags ? tagsJsonFor(input.tags) : undefined,
      linksJson: input.links ? JSON.stringify(input.links) : undefined,
      targetRolesJson: input.targetRoles ? JSON.stringify(input.targetRoles.length ? input.targetRoles : commercialAllRoles) : undefined,
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
  await recordAuditLog(prisma, {
    organizationId: actor.organizationId,
    actorId: actor.id,
    action: "announcement.update",
    entityType: "Announcement",
    entityId: item.id,
    metadata: { slug: item.slug, status: item.status, priority: item.priority }
  });
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
  const receipt = await prisma.announcementReadReceipt.upsert({
    where: { announcementId_userId: { announcementId: item.id, userId: actor.id } },
    create: { organizationId: actor.organizationId, announcementId: item.id, userId: actor.id, acknowledgedAt: new Date() },
    update: { acknowledgedAt: new Date() }
  });
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
