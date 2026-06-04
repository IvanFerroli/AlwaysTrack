import type { Prisma, PrismaClient } from "@prisma/client";
import type { CurrentUser } from "@alwaystrack/shared";
import { recordAuditLog } from "../audit/audit.service.js";

export class WikiError extends Error {
  constructor(
    public readonly code:
      | "NOT_FOUND"
      | "INVALID_INPUT"
      | "FORBIDDEN"
      | "VERSION_CONFLICT"
      | "REQUEST_NOT_PENDING"
  ) {
    super(code);
  }
}

export interface WikiPageInput {
  title?: string;
  content?: string;
  slug?: string;
  baseVersion?: number;
}

export interface WikiEditRequestInput {
  pageId?: string;
  title?: string;
  content?: string;
  baseVersion?: number;
}

export interface WikiDecisionInput {
  decisionNote?: string | null;
}

export interface WikiPresenceInput {
  mode?: "READING" | "EDITING";
}

export interface WikiFilters {
  query?: string;
  status?: string;
  pageStatus?: "ACTIVE" | "ARCHIVED" | "ALL";
}

const wikiContentFormat = "MARKDOWN";

function withWikiContentFormat<T extends { content: string }>(item: T) {
  return { ...item, contentFormat: wikiContentFormat, tags: extractWikiTags(item.content) };
}

function withWikiRequestContentFormat<T extends { content: string }>(item: T) {
  return { ...item, contentFormat: wikiContentFormat, tags: extractWikiTags(item.content) };
}

function withWikiPageDetailFormat<T extends { content: string; revisions?: Array<{ content: string }>; editRequests?: Array<{ content: string }> }>(page: T) {
  return {
    ...withWikiContentFormat(page),
    revisions: page.revisions?.map(withWikiContentFormat),
    editRequests: page.editRequests?.map(withWikiRequestContentFormat)
  };
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

function cleanNumber(value: unknown) {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number.parseInt(value, 10) : Number.NaN;
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function cleanStatus(value: unknown) {
  return value === "PENDING" || value === "APPROVED" || value === "REJECTED" ? value : undefined;
}

function cleanPageStatus(value: unknown) {
  return value === "ARCHIVED" || value === "ALL" ? value : value === "ACTIVE" ? "ACTIVE" : undefined;
}

function cleanMode(value: unknown) {
  return value === "EDITING" ? "EDITING" : value === "READING" ? "READING" : undefined;
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "pagina";
}

function extractWikiTags(content: string | null | undefined) {
  const tags = new Set<string>();
  if (!content) return [];
  for (const match of content.matchAll(/(^|\s)#([a-z0-9][a-z0-9_-]{1,32})/gi)) {
    tags.add(match[2].toLowerCase());
  }
  return [...tags].sort((a, b) => a.localeCompare(b));
}

function ensureAdmin(actor: CurrentUser) {
  if (actor.role !== "ADMIN") throw new WikiError("FORBIDDEN");
}

function wikiPageSelect() {
  return {
    id: true,
    slug: true,
    title: true,
    content: true,
    version: true,
    active: true,
    publishedAt: true,
    createdAt: true,
    updatedAt: true,
    updatedBy: { select: { id: true, name: true, email: true, role: true } },
    editRequests: {
      where: { status: "PENDING" },
      select: { id: true, authorId: true, createdAt: true }
    }
  } satisfies Prisma.WikiPageSelect;
}

function wikiRequestInclude() {
  return {
    page: { select: { id: true, slug: true, title: true, version: true } },
    author: { select: { id: true, name: true, email: true, role: true } },
    reviewer: { select: { id: true, name: true, email: true, role: true } }
  } satisfies Prisma.WikiEditRequestInclude;
}

export function parseWikiPageInput(payload: unknown): WikiPageInput {
  const input = (payload ?? {}) as Record<string, unknown>;
  return {
    title: cleanText(input.title),
    content: cleanText(input.content),
    slug: cleanText(input.slug),
    baseVersion: cleanNumber(input.baseVersion)
  };
}

export function parseWikiEditRequestInput(payload: unknown): WikiEditRequestInput {
  const input = (payload ?? {}) as Record<string, unknown>;
  return {
    pageId: cleanText(input.pageId),
    title: cleanText(input.title),
    content: cleanText(input.content),
    baseVersion: cleanNumber(input.baseVersion)
  };
}

export function parseWikiDecisionInput(payload: unknown): WikiDecisionInput {
  const input = (payload ?? {}) as Record<string, unknown>;
  return { decisionNote: cleanOptionalText(input.decisionNote) };
}

export function parseWikiPresenceInput(payload: unknown): WikiPresenceInput {
  const input = (payload ?? {}) as Record<string, unknown>;
  return { mode: cleanMode(input.mode) };
}

export function parseWikiFilters(query: Record<string, unknown>): WikiFilters {
  return {
    query: cleanText(query.query),
    status: cleanStatus(query.status),
    pageStatus: cleanPageStatus(query.status)
  };
}

export async function listWikiPages(prisma: PrismaClient, actor: CurrentUser, filters: WikiFilters = {}) {
  const active =
    actor.role !== "ADMIN"
      ? true
      : filters.pageStatus === "ARCHIVED"
        ? false
        : filters.pageStatus === "ALL"
          ? undefined
          : true;
  const where: Prisma.WikiPageWhereInput = {
    organizationId: actor.organizationId,
    active,
    OR: filters.query
      ? [{ title: { contains: filters.query } }, { content: { contains: filters.query } }, { slug: { contains: filters.query } }]
      : undefined
  };
  const [items, total] = await Promise.all([
    prisma.wikiPage.findMany({
      where,
      select: wikiPageSelect(),
      orderBy: [{ updatedAt: "desc" }, { title: "asc" }]
    }),
    prisma.wikiPage.count({ where })
  ]);
  return { items: items.map(withWikiContentFormat), total };
}

export async function getWikiPage(prisma: PrismaClient, actor: CurrentUser, pageId: string) {
  const since = new Date(Date.now() - 2 * 60 * 1000);
  const page = await prisma.wikiPage.findFirst({
    where: { id: pageId, organizationId: actor.organizationId, active: actor.role === "ADMIN" ? undefined : true },
    include: {
      updatedBy: { select: { id: true, name: true, email: true, role: true } },
      readReceipts: {
        orderBy: { lastReadAt: "desc" },
        take: 12,
        include: { user: { select: { id: true, name: true, email: true, role: true } } }
      },
      presences: {
        where: { lastSeenAt: { gte: since } },
        orderBy: { lastSeenAt: "desc" },
        include: { user: { select: { id: true, name: true, email: true, role: true } } }
      },
      editRequests: {
        where: actor.role === "ADMIN" ? { status: "PENDING" } : { authorId: actor.id },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: wikiRequestInclude()
      },
      revisions: {
        orderBy: { version: "desc" },
        take: 5,
        include: { author: { select: { id: true, name: true, email: true, role: true } } }
      }
    }
  });
  if (!page) throw new WikiError("NOT_FOUND");
  return { page: withWikiPageDetailFormat(page) };
}

export async function createWikiPage(prisma: PrismaClient, actor: CurrentUser, input: WikiPageInput) {
  ensureAdmin(actor);
  if (!input.title || !input.content) throw new WikiError("INVALID_INPUT");
  const slug = slugify(input.slug ?? input.title);
  const existing = await prisma.wikiPage.findFirst({ where: { organizationId: actor.organizationId, slug } });
  if (existing) throw new WikiError("INVALID_INPUT");

  const page = await prisma.wikiPage.create({
    data: {
      organizationId: actor.organizationId,
      slug,
      title: input.title,
      content: input.content,
      version: 1,
      createdById: actor.id,
      updatedById: actor.id
    }
  });
  await prisma.wikiRevision.create({
    data: {
      organizationId: actor.organizationId,
      pageId: page.id,
      authorId: actor.id,
      version: page.version,
      title: page.title,
      content: page.content
    }
  });
  await recordAuditLog(prisma, {
    organizationId: actor.organizationId,
    actorId: actor.id,
    action: "wiki.page.create",
    entityType: "WikiPage",
    entityId: page.id,
    metadata: { slug: page.slug, version: page.version }
  });
  return withWikiContentFormat(page);
}

export async function updateWikiPage(prisma: PrismaClient, actor: CurrentUser, pageId: string, input: WikiPageInput) {
  ensureAdmin(actor);
  if (!input.title || !input.content || !input.baseVersion) throw new WikiError("INVALID_INPUT");
  const existing = await prisma.wikiPage.findFirst({ where: { id: pageId, organizationId: actor.organizationId, active: true } });
  if (!existing) throw new WikiError("NOT_FOUND");
  if (existing.version !== input.baseVersion) throw new WikiError("VERSION_CONFLICT");
  const slug = input.slug ? slugify(input.slug) : undefined;
  if (slug && slug !== existing.slug) {
    const duplicate = await prisma.wikiPage.findFirst({ where: { organizationId: actor.organizationId, slug, id: { not: pageId } } });
    if (duplicate) throw new WikiError("INVALID_INPUT");
  }

  const page = await prisma.wikiPage.update({
    where: { id: pageId },
    data: {
      slug,
      title: input.title,
      content: input.content,
      version: existing.version + 1,
      updatedById: actor.id,
      publishedAt: new Date()
    }
  });
  await prisma.wikiRevision.create({
    data: {
      organizationId: actor.organizationId,
      pageId: page.id,
      authorId: actor.id,
      version: page.version,
      title: page.title,
      content: page.content
    }
  });
  await recordAuditLog(prisma, {
    organizationId: actor.organizationId,
    actorId: actor.id,
    action: "wiki.page.update",
    entityType: "WikiPage",
    entityId: page.id,
    metadata: { previousSlug: existing.slug, slug: page.slug, previousVersion: existing.version, version: page.version }
  });
  return withWikiContentFormat(page);
}

export async function archiveWikiPage(prisma: PrismaClient, actor: CurrentUser, pageId: string) {
  ensureAdmin(actor);
  const existing = await prisma.wikiPage.findFirst({ where: { id: pageId, organizationId: actor.organizationId } });
  if (!existing) throw new WikiError("NOT_FOUND");
  if (!existing.active) return withWikiContentFormat(existing);

  const page = await prisma.wikiPage.update({
    where: { id: pageId },
    data: { active: false, updatedById: actor.id }
  });
  await recordAuditLog(prisma, {
    organizationId: actor.organizationId,
    actorId: actor.id,
    action: "wiki.page.archive",
    entityType: "WikiPage",
    entityId: page.id,
    metadata: { slug: page.slug, version: page.version }
  });
  return withWikiContentFormat(page);
}

export async function unarchiveWikiPage(prisma: PrismaClient, actor: CurrentUser, pageId: string) {
  ensureAdmin(actor);
  const existing = await prisma.wikiPage.findFirst({ where: { id: pageId, organizationId: actor.organizationId } });
  if (!existing) throw new WikiError("NOT_FOUND");
  if (existing.active) return withWikiContentFormat(existing);

  const page = await prisma.wikiPage.update({
    where: { id: pageId },
    data: { active: true, updatedById: actor.id }
  });
  await recordAuditLog(prisma, {
    organizationId: actor.organizationId,
    actorId: actor.id,
    action: "wiki.page.unarchive",
    entityType: "WikiPage",
    entityId: page.id,
    metadata: { slug: page.slug, version: page.version }
  });
  return withWikiContentFormat(page);
}

export async function restoreWikiRevision(prisma: PrismaClient, actor: CurrentUser, pageId: string, revisionId: string) {
  ensureAdmin(actor);
  const page = await prisma.wikiPage.findFirst({ where: { id: pageId, organizationId: actor.organizationId } });
  if (!page) throw new WikiError("NOT_FOUND");
  const revision = await prisma.wikiRevision.findFirst({ where: { id: revisionId, pageId, organizationId: actor.organizationId } });
  if (!revision) throw new WikiError("NOT_FOUND");

  const restored = await prisma.wikiPage.update({
    where: { id: pageId },
    data: {
      title: revision.title,
      content: revision.content,
      version: page.version + 1,
      active: true,
      updatedById: actor.id,
      publishedAt: new Date()
    }
  });
  await prisma.wikiRevision.create({
    data: {
      organizationId: actor.organizationId,
      pageId: restored.id,
      authorId: actor.id,
      version: restored.version,
      title: restored.title,
      content: restored.content
    }
  });
  await recordAuditLog(prisma, {
    organizationId: actor.organizationId,
    actorId: actor.id,
    action: "wiki.revision.restore",
    entityType: "WikiPage",
    entityId: restored.id,
    metadata: { restoredFromVersion: revision.version, restoredFromRevisionId: revision.id, version: restored.version }
  });
  return withWikiContentFormat(restored);
}

export async function createWikiEditRequest(prisma: PrismaClient, actor: CurrentUser, input: WikiEditRequestInput) {
  if (!input.pageId || !input.title || !input.content || !input.baseVersion) throw new WikiError("INVALID_INPUT");
  if (actor.role === "ADMIN") throw new WikiError("INVALID_INPUT");
  const page = await prisma.wikiPage.findFirst({ where: { id: input.pageId, organizationId: actor.organizationId, active: true } });
  if (!page) throw new WikiError("NOT_FOUND");
  if (page.version !== input.baseVersion) throw new WikiError("VERSION_CONFLICT");

  const request = await prisma.wikiEditRequest.create({
    data: {
      organizationId: actor.organizationId,
      pageId: page.id,
      authorId: actor.id,
      baseVersion: input.baseVersion,
      title: input.title,
      content: input.content,
      status: "PENDING"
    },
    include: wikiRequestInclude()
  });
  await recordAuditLog(prisma, {
    organizationId: actor.organizationId,
    actorId: actor.id,
    action: "wiki.request.create",
    entityType: "WikiEditRequest",
    entityId: request.id,
    metadata: { pageId: page.id, baseVersion: input.baseVersion }
  });
  return withWikiRequestContentFormat(request);
}

export async function listWikiEditRequests(prisma: PrismaClient, actor: CurrentUser, filters: WikiFilters = {}) {
  const where: Prisma.WikiEditRequestWhereInput = {
    organizationId: actor.organizationId,
    status: filters.status,
    authorId: actor.role === "ADMIN" ? undefined : actor.id,
    OR: filters.query
      ? [
          { title: { contains: filters.query } },
          { content: { contains: filters.query } },
          { page: { title: { contains: filters.query } } },
          { page: { slug: { contains: filters.query } } },
          { author: { name: { contains: filters.query } } }
        ]
      : undefined
  };
  const [items, total] = await Promise.all([
    prisma.wikiEditRequest.findMany({
      where,
      include: wikiRequestInclude(),
      orderBy: { createdAt: "desc" }
    }),
    prisma.wikiEditRequest.count({ where })
  ]);
  return { items: items.map(withWikiRequestContentFormat), total };
}

async function findPendingRequest(prisma: PrismaClient, actor: CurrentUser, requestId: string) {
  ensureAdmin(actor);
  const request = await prisma.wikiEditRequest.findFirst({
    where: { id: requestId, organizationId: actor.organizationId },
    include: { page: true }
  });
  if (!request) throw new WikiError("NOT_FOUND");
  if (request.status !== "PENDING") throw new WikiError("REQUEST_NOT_PENDING");
  if (request.page.version !== request.baseVersion) throw new WikiError("VERSION_CONFLICT");
  return request;
}

export async function approveWikiEditRequest(prisma: PrismaClient, actor: CurrentUser, requestId: string, input: WikiDecisionInput = {}) {
  const request = await findPendingRequest(prisma, actor, requestId);
  const page = await prisma.wikiPage.update({
    where: { id: request.pageId },
    data: {
      title: request.title,
      content: request.content,
      version: request.page.version + 1,
      updatedById: actor.id,
      publishedAt: new Date()
    }
  });
  const approved = await prisma.wikiEditRequest.update({
    where: { id: request.id },
    data: {
      status: "APPROVED",
      reviewerId: actor.id,
      decisionNote: input.decisionNote ?? null,
      reviewedAt: new Date()
    },
    include: wikiRequestInclude()
  });
  await prisma.wikiRevision.create({
    data: {
      organizationId: actor.organizationId,
      pageId: page.id,
      authorId: request.authorId,
      requestId: request.id,
      version: page.version,
      title: page.title,
      content: page.content
    }
  });
  await recordAuditLog(prisma, {
    organizationId: actor.organizationId,
    actorId: actor.id,
    action: "wiki.request.approve",
    entityType: "WikiEditRequest",
    entityId: request.id,
    metadata: { pageId: page.id, version: page.version, decisionNote: input.decisionNote ?? null }
  });
  return { request: withWikiRequestContentFormat(approved), page: withWikiContentFormat(page) };
}

export async function rejectWikiEditRequest(prisma: PrismaClient, actor: CurrentUser, requestId: string, input: WikiDecisionInput = {}) {
  const request = await findPendingRequest(prisma, actor, requestId);
  const rejected = await prisma.wikiEditRequest.update({
    where: { id: request.id },
    data: {
      status: "REJECTED",
      reviewerId: actor.id,
      decisionNote: input.decisionNote ?? null,
      reviewedAt: new Date()
    },
    include: wikiRequestInclude()
  });
  await recordAuditLog(prisma, {
    organizationId: actor.organizationId,
    actorId: actor.id,
    action: "wiki.request.reject",
    entityType: "WikiEditRequest",
    entityId: request.id,
    metadata: { pageId: request.pageId, decisionNote: input.decisionNote ?? null }
  });
  return withWikiRequestContentFormat(rejected);
}

export async function markWikiRead(prisma: PrismaClient, actor: CurrentUser, pageId: string) {
  const page = await prisma.wikiPage.findFirst({ where: { id: pageId, organizationId: actor.organizationId, active: true } });
  if (!page) throw new WikiError("NOT_FOUND");
  const now = new Date();
  const readReceipt = await prisma.wikiReadReceipt.upsert({
    where: { pageId_userId: { pageId, userId: actor.id } },
    update: { lastReadAt: now },
    create: { organizationId: actor.organizationId, pageId, userId: actor.id, lastReadAt: now }
  });
  await recordAuditLog(prisma, {
    organizationId: actor.organizationId,
    actorId: actor.id,
    action: "wiki.page.read",
    entityType: "WikiPage",
    entityId: page.id,
    metadata: { version: page.version }
  });
  return readReceipt;
}

export async function heartbeatWikiPresence(prisma: PrismaClient, actor: CurrentUser, pageId: string, input: WikiPresenceInput = {}) {
  const page = await prisma.wikiPage.findFirst({ where: { id: pageId, organizationId: actor.organizationId, active: true } });
  if (!page) throw new WikiError("NOT_FOUND");
  const now = new Date();
  return prisma.wikiPresence.upsert({
    where: { pageId_userId: { pageId, userId: actor.id } },
    update: { lastSeenAt: now, mode: input.mode ?? "READING" },
    create: { organizationId: actor.organizationId, pageId, userId: actor.id, mode: input.mode ?? "READING", lastSeenAt: now }
  });
}
