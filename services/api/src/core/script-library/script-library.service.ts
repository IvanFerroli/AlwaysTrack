import type { Prisma, PrismaClient } from "@prisma/client";
import { commercialManagerRoles, type CurrentUser } from "@alwaystrack/shared";
import { recordAuditLog } from "../audit/audit.service.js";
import { emitInAppNotifications } from "../notifications/notifications.service.js";

export class ScriptLibraryError extends Error {
  constructor(public readonly code: "NOT_FOUND" | "INVALID_INPUT" | "FORBIDDEN" | "SLUG_TAKEN" | "TITLE_TAKEN") {
    super(code);
  }
}

export interface ScriptCategoryInput {
  name?: string;
  slug?: string | null;
  description?: string | null;
  order?: number;
  active?: boolean;
}

export interface OperationalScriptInput {
  categoryId?: string;
  wikiPageId?: string | null;
  faqThreadId?: string | null;
  title?: string;
  channel?: string;
  body?: string;
  tags?: string[];
  status?: string;
  reviewDueAt?: Date | null;
  comment?: string | null;
}

export interface ScriptFilters {
  query?: string;
  categoryId?: string;
  channel?: string;
  status?: string;
  tags?: string[];
  includeObsolete?: boolean;
  reviewDue?: boolean;
}

export interface ScriptCopyInput {
  renderedText?: string | null;
  placeholders?: Record<string, string>;
}

export interface ScriptSuggestionInput extends OperationalScriptInput {
  scriptId?: string;
  suggestionType?: string;
  decision?: string;
  decisionComment?: string | null;
}

const statuses = new Set(["DRAFT", "VALIDATED", "OBSOLETE"]);
const channels = new Set(["WHATSAPP", "EMAIL", "PHONE", "INSTAGRAM", "INTERNAL"]);
const suggestionStatuses = new Set(["SUGGESTED", "ACCEPTED", "REJECTED", "MERGED"]);
const suggestionTypes = new Set(["NEW", "CHANGE"]);

function isManager(actor: CurrentUser) {
  return (commercialManagerRoles as readonly string[]).includes(actor.role);
}

function ensureManager(actor: CurrentUser) {
  if (!isManager(actor)) throw new ScriptLibraryError("FORBIDDEN");
}

function ensureAdmin(actor: CurrentUser) {
  if (actor.role !== "ADMIN") throw new ScriptLibraryError("FORBIDDEN");
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

function cleanNumber(value: unknown) {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number.parseInt(value, 10) : Number.NaN;
  return Number.isInteger(parsed) ? parsed : undefined;
}

function cleanStatus(value: unknown) {
  return typeof value === "string" && statuses.has(value.toUpperCase()) ? value.toUpperCase() : undefined;
}

function cleanDate(value: unknown) {
  if (value === null) return null;
  if (typeof value !== "string" || !value.trim()) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function cleanChannel(value: unknown) {
  return typeof value === "string" && channels.has(value.toUpperCase()) ? value.toUpperCase() : undefined;
}

function cleanSuggestionStatus(value: unknown) {
  return typeof value === "string" && suggestionStatuses.has(value.toUpperCase()) ? value.toUpperCase() : undefined;
}

function cleanSuggestionType(value: unknown) {
  return typeof value === "string" && suggestionTypes.has(value.toUpperCase()) ? value.toUpperCase() : undefined;
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

function tagsJsonFor(values: unknown[] = []) {
  return JSON.stringify(normalizedTags(values));
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

function placeholdersFor(body: string) {
  return [...new Set([...body.matchAll(/\{([a-zA-Z0-9_.-]+)\}/g)].map((match) => match[1]))].sort((left, right) => left.localeCompare(right));
}

function placeholdersJsonFor(body: string) {
  return JSON.stringify(placeholdersFor(body));
}

function placeholdersFromJson(value: string | null | undefined) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "categoria";
}

function tagWhere(tags: string[] | undefined) {
  const normalized = normalizedTags(tags ?? []);
  return normalized.length ? normalized.map((tag) => ({ tagsJson: { contains: `"${tag}"` } })) : undefined;
}

function scriptVisibilityWhere(actor: CurrentUser): Prisma.OperationalScriptWhereInput {
  if (isManager(actor)) return { organizationId: actor.organizationId };
  return { organizationId: actor.organizationId, status: "VALIDATED", category: { active: true } };
}

function reviewStateFor(item: { status: string; reviewDueAt?: Date | string | null }) {
  if (item.status === "OBSOLETE") return "OBSOLETE";
  if (item.status !== "VALIDATED") return "DRAFT";
  if (item.reviewDueAt && new Date(item.reviewDueAt).getTime() <= Date.now()) return "REVIEW_DUE";
  return "VALIDATED";
}

function withScriptFormat<T extends { tagsJson?: string | null; placeholdersJson?: string | null; status: string; reviewDueAt?: Date | string | null }>(item: T) {
  return { ...item, tags: tagsFromJson(item.tagsJson), placeholders: placeholdersFromJson(item.placeholdersJson), reviewState: reviewStateFor(item) };
}

export function parseScriptCategoryInput(payload: unknown): ScriptCategoryInput {
  const input = (payload ?? {}) as Record<string, unknown>;
  return {
    name: cleanText(input.name),
    slug: cleanOptionalText(input.slug),
    description: cleanOptionalText(input.description),
    order: cleanNumber(input.order),
    active: cleanBoolean(input.active)
  };
}

export function parseOperationalScriptInput(payload: unknown): OperationalScriptInput {
  const input = (payload ?? {}) as Record<string, unknown>;
  return {
    categoryId: cleanText(input.categoryId),
    wikiPageId: cleanOptionalText(input.wikiPageId),
    faqThreadId: cleanOptionalText(input.faqThreadId),
    title: cleanText(input.title),
    channel: cleanChannel(input.channel),
    body: cleanText(input.body),
    tags: Array.isArray(input.tags) ? normalizedTags(input.tags) : undefined,
    status: cleanStatus(input.status),
    reviewDueAt: cleanDate(input.reviewDueAt),
    comment: cleanOptionalText(input.comment)
  };
}

export function parseScriptFilters(query: Record<string, unknown>): ScriptFilters {
  return {
    query: cleanText(query.query),
    categoryId: cleanText(query.categoryId),
    channel: cleanChannel(query.channel),
    status: cleanStatus(query.status),
    tags: cleanText(query.tags)?.split(",").map((item) => item.trim()),
    includeObsolete: query.includeObsolete === "1" || query.includeObsolete === "true",
    reviewDue: query.reviewDue === "1" || query.reviewDue === "true"
  };
}

export function parseScriptCopyInput(payload: unknown): ScriptCopyInput {
  const input = (payload ?? {}) as Record<string, unknown>;
  const rawPlaceholders = input.placeholders && typeof input.placeholders === "object" ? (input.placeholders as Record<string, unknown>) : {};
  const placeholders = Object.fromEntries(Object.entries(rawPlaceholders).map(([key, value]) => [key, typeof value === "string" ? value.slice(0, 160) : ""]));
  return { renderedText: cleanOptionalText(input.renderedText), placeholders };
}

export function parseScriptSuggestionInput(payload: unknown): ScriptSuggestionInput {
  const input = (payload ?? {}) as Record<string, unknown>;
  return {
    ...parseOperationalScriptInput(payload),
    scriptId: cleanText(input.scriptId),
    suggestionType: cleanSuggestionType(input.suggestionType),
    decision: cleanSuggestionStatus(input.decision),
    decisionComment: cleanOptionalText(input.decisionComment)
  };
}

async function recordSearchEvent(prisma: PrismaClient, actor: CurrentUser, filters: ScriptFilters, resultCount: number) {
  if (!filters.query && !filters.channel && !filters.categoryId && !filters.status && !filters.tags?.length && !filters.reviewDue) return;
  await prisma.operationalScriptSearchEvent.create({
    data: {
      organizationId: actor.organizationId,
      userId: actor.id,
      query: filters.query ?? null,
      filtersJson: JSON.stringify({
        categoryId: filters.categoryId ?? null,
        channel: filters.channel ?? null,
        status: filters.status ?? null,
        tags: filters.tags ?? [],
        reviewDue: Boolean(filters.reviewDue)
      }),
      resultCount
    }
  });
}

async function scriptLibraryMetrics(prisma: PrismaClient, actor: CurrentUser) {
  if (!isManager(actor)) return null;
  const [mostCopied, neverUsed, reviewDue, pendingSuggestions, zeroSearches] = await Promise.all([
    prisma.operationalScript.findMany({
      where: { organizationId: actor.organizationId, status: "VALIDATED" },
      orderBy: [{ usageCount: "desc" }, { updatedAt: "desc" }],
      take: 5,
      select: { id: true, title: true, usageCount: true }
    }),
    prisma.operationalScript.count({ where: { organizationId: actor.organizationId, status: "VALIDATED", usageCount: 0 } }),
    prisma.operationalScript.count({ where: { organizationId: actor.organizationId, status: "VALIDATED", reviewDueAt: { lte: new Date() } } }),
    prisma.operationalScriptSuggestion.count({ where: { organizationId: actor.organizationId, status: "SUGGESTED" } }),
    prisma.operationalScriptSearchEvent.findMany({
      where: { organizationId: actor.organizationId, resultCount: 0 },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, query: true, filtersJson: true, createdAt: true }
    })
  ]);
  return { mostCopied, neverUsed, reviewDue, pendingSuggestions, zeroSearches };
}

export async function listScriptLibrary(prisma: PrismaClient, actor: CurrentUser, filters: ScriptFilters = {}) {
  const scriptWhere: Prisma.OperationalScriptWhereInput = {
    ...scriptVisibilityWhere(actor),
    categoryId: filters.categoryId,
    channel: filters.channel,
    status: filters.status ?? (filters.includeObsolete || isManager(actor) ? undefined : "VALIDATED"),
    AND: [
      filters.query
        ? {
            OR: [
              { title: { contains: filters.query } },
              { body: { contains: filters.query } },
              { tagsJson: { contains: filters.query } },
              { category: { name: { contains: filters.query } } }
            ]
          }
        : undefined,
      tagWhere(filters.tags)?.length ? { OR: tagWhere(filters.tags) } : undefined,
      filters.reviewDue ? { reviewDueAt: { lte: new Date() } } : undefined,
      filters.includeObsolete ? undefined : { status: { not: "OBSOLETE" } }
    ].filter(Boolean) as Prisma.OperationalScriptWhereInput[]
  };
  const [categories, scripts, total, suggestions, metrics] = await Promise.all([
    prisma.scriptCategory.findMany({
      where: { organizationId: actor.organizationId, active: isManager(actor) ? undefined : true },
      orderBy: [{ order: "asc" }, { name: "asc" }],
      include: { _count: { select: { scripts: true } } }
    }),
    prisma.operationalScript.findMany({
      where: scriptWhere,
      include: {
        category: true,
        createdBy: { select: { id: true, name: true, email: true, role: true } },
        updatedBy: { select: { id: true, name: true, email: true, role: true } },
        validatedBy: { select: { id: true, name: true, email: true, role: true } },
        recertifiedBy: { select: { id: true, name: true, email: true, role: true } },
        wikiPage: { select: { id: true, slug: true, title: true, active: true } },
        faqThread: { select: { id: true, title: true, status: true, wikiPage: { select: { id: true, slug: true, title: true } } } },
        revisions: {
          orderBy: { version: "desc" },
          take: 8,
          include: { author: { select: { id: true, name: true, role: true } } }
        },
        events: {
          orderBy: { createdAt: "desc" },
          take: 10,
          include: { user: { select: { id: true, name: true, role: true } } }
        }
      },
      orderBy: [{ status: "asc" }, { reviewDueAt: "asc" }, { usageCount: "desc" }, { updatedAt: "desc" }, { title: "asc" }],
      take: 100
    }),
    prisma.operationalScript.count({ where: scriptWhere }),
    isManager(actor)
      ? prisma.operationalScriptSuggestion.findMany({
          where: { organizationId: actor.organizationId },
          orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
          take: 30,
          include: {
            category: { select: { id: true, name: true } },
            script: { select: { id: true, title: true } },
            author: { select: { id: true, name: true, role: true } },
            decidedBy: { select: { id: true, name: true, role: true } }
          }
        })
      : prisma.operationalScriptSuggestion.findMany({
          where: { organizationId: actor.organizationId, authorId: actor.id },
          orderBy: { updatedAt: "desc" },
          take: 10,
          include: {
            category: { select: { id: true, name: true } },
            script: { select: { id: true, title: true } },
            author: { select: { id: true, name: true, role: true } },
            decidedBy: { select: { id: true, name: true, role: true } }
          }
        }),
    scriptLibraryMetrics(prisma, actor)
  ]);
  await recordSearchEvent(prisma, actor, filters, total);
  return { categories, scripts: scripts.map(withScriptFormat), suggestions: suggestions.map((item) => ({ ...item, tags: tagsFromJson(item.tagsJson) })), metrics, total, canManage: isManager(actor) };
}

export async function createScriptCategory(prisma: PrismaClient, actor: CurrentUser, input: ScriptCategoryInput) {
  ensureManager(actor);
  if (!input.name) throw new ScriptLibraryError("INVALID_INPUT");
  const slug = slugify(input.slug ?? input.name);
  const existing = await prisma.scriptCategory.findFirst({ where: { organizationId: actor.organizationId, OR: [{ slug }, { name: input.name }] } });
  if (existing?.slug === slug) throw new ScriptLibraryError("SLUG_TAKEN");
  if (existing?.name === input.name) throw new ScriptLibraryError("TITLE_TAKEN");
  const category = await prisma.scriptCategory.create({
    data: {
      organizationId: actor.organizationId,
      createdById: actor.id,
      slug,
      name: input.name,
      description: input.description ?? null,
      order: input.order ?? 0,
      active: input.active ?? true
    }
  });
  await recordAuditLog(prisma, { organizationId: actor.organizationId, actorId: actor.id, action: "script_category.create", entityType: "ScriptCategory", entityId: category.id, metadata: { slug } });
  return { category };
}

async function ensureCategory(prisma: PrismaClient, actor: CurrentUser, categoryId: string) {
  const category = await prisma.scriptCategory.findFirst({ where: { id: categoryId, organizationId: actor.organizationId } });
  if (!category) throw new ScriptLibraryError("NOT_FOUND");
  return category;
}

async function ensureWikiPage(prisma: PrismaClient, actor: CurrentUser, pageId: string | null | undefined) {
  if (!pageId) return;
  const page = await prisma.wikiPage.findFirst({ where: { id: pageId, organizationId: actor.organizationId, active: true } });
  if (!page) throw new ScriptLibraryError("NOT_FOUND");
}

async function ensureFaqThread(prisma: PrismaClient, actor: CurrentUser, threadId: string | null | undefined) {
  if (!threadId) return;
  const thread = await prisma.faqThread.findFirst({ where: { id: threadId, organizationId: actor.organizationId } });
  if (!thread) throw new ScriptLibraryError("NOT_FOUND");
}

async function createRevision(prisma: PrismaClient, actor: CurrentUser, script: { id: string; organizationId: string; title: string; channel: string; body: string; tagsJson: string | null; placeholdersJson: string | null; status: string }) {
  const last = await prisma.operationalScriptRevision.findFirst({ where: { scriptId: script.id }, orderBy: { version: "desc" } });
  return prisma.operationalScriptRevision.create({
    data: {
      organizationId: script.organizationId,
      scriptId: script.id,
      authorId: actor.id,
      version: (last?.version ?? 0) + 1,
      title: script.title,
      channel: script.channel,
      body: script.body,
      tagsJson: script.tagsJson,
      placeholdersJson: script.placeholdersJson,
      status: script.status
    }
  });
}

export async function createOperationalScript(prisma: PrismaClient, actor: CurrentUser, input: OperationalScriptInput) {
  ensureManager(actor);
  if (!input.categoryId || !input.title || !input.channel || !input.body) throw new ScriptLibraryError("INVALID_INPUT");
  await ensureCategory(prisma, actor, input.categoryId);
  await ensureWikiPage(prisma, actor, input.wikiPageId);
  await ensureFaqThread(prisma, actor, input.faqThreadId);
  const existing = await prisma.operationalScript.findFirst({ where: { organizationId: actor.organizationId, categoryId: input.categoryId, title: input.title } });
  if (existing) throw new ScriptLibraryError("TITLE_TAKEN");
  const status = input.status ?? "DRAFT";
  const script = await prisma.operationalScript.create({
    data: {
      organizationId: actor.organizationId,
      categoryId: input.categoryId,
      wikiPageId: input.wikiPageId ?? null,
      faqThreadId: input.faqThreadId ?? null,
      title: input.title,
      channel: input.channel,
      body: input.body,
      tagsJson: tagsJsonFor(input.tags),
      placeholdersJson: placeholdersJsonFor(input.body),
      status,
      createdById: actor.id,
      updatedById: actor.id,
      validatedById: status === "VALIDATED" ? actor.id : null,
      validatedAt: status === "VALIDATED" ? new Date() : null,
      reviewDueAt: input.reviewDueAt ?? null
    }
  });
  await createRevision(prisma, actor, script);
  await recordAuditLog(prisma, { organizationId: actor.organizationId, actorId: actor.id, action: "script.create", entityType: "OperationalScript", entityId: script.id, metadata: { title: script.title, status: script.status } });
  return { script: withScriptFormat(script) };
}

export async function updateOperationalScript(prisma: PrismaClient, actor: CurrentUser, scriptId: string, input: OperationalScriptInput) {
  ensureManager(actor);
  const current = await prisma.operationalScript.findFirst({ where: { id: scriptId, organizationId: actor.organizationId } });
  if (!current) throw new ScriptLibraryError("NOT_FOUND");
  if (input.categoryId) await ensureCategory(prisma, actor, input.categoryId);
  await ensureWikiPage(prisma, actor, input.wikiPageId);
  await ensureFaqThread(prisma, actor, input.faqThreadId);
  const body = input.body ?? current.body;
  const script = await prisma.operationalScript.update({
    where: { id: current.id },
    data: {
      categoryId: input.categoryId,
      wikiPageId: input.wikiPageId,
      faqThreadId: input.faqThreadId,
      title: input.title,
      channel: input.channel,
      body: input.body,
      tagsJson: input.tags ? tagsJsonFor(input.tags) : undefined,
      placeholdersJson: input.body ? placeholdersJsonFor(body) : undefined,
      status: input.status,
      updatedById: actor.id,
      validatedById: input.status === "VALIDATED" ? actor.id : input.status === "DRAFT" ? null : undefined,
      validatedAt: input.status === "VALIDATED" ? new Date() : input.status === "DRAFT" ? null : undefined,
      reviewDueAt: input.reviewDueAt
    }
  });
  await createRevision(prisma, actor, script);
  await recordAuditLog(prisma, { organizationId: actor.organizationId, actorId: actor.id, action: "script.update", entityType: "OperationalScript", entityId: script.id, metadata: { title: script.title, status: script.status } });
  return { script: withScriptFormat(script) };
}

export async function validateOperationalScript(prisma: PrismaClient, actor: CurrentUser, scriptId: string) {
  ensureManager(actor);
  const script = await prisma.operationalScript.findFirst({ where: { id: scriptId, organizationId: actor.organizationId } });
  if (!script) throw new ScriptLibraryError("NOT_FOUND");
  const updated = await prisma.operationalScript.update({
    where: { id: script.id },
    data: { status: "VALIDATED", validatedById: actor.id, validatedAt: new Date(), updatedById: actor.id }
  });
  await createRevision(prisma, actor, updated);
  await recordAuditLog(prisma, { organizationId: actor.organizationId, actorId: actor.id, action: "script.validate", entityType: "OperationalScript", entityId: updated.id, metadata: { title: updated.title } });
  return { script: withScriptFormat(updated) };
}

export async function recertifyOperationalScript(prisma: PrismaClient, actor: CurrentUser, scriptId: string, input: OperationalScriptInput = {}) {
  ensureManager(actor);
  const script = await prisma.operationalScript.findFirst({ where: { id: scriptId, organizationId: actor.organizationId } });
  if (!script) throw new ScriptLibraryError("NOT_FOUND");
  const updated = await prisma.operationalScript.update({
    where: { id: script.id },
    data: {
      status: "VALIDATED",
      validatedById: actor.id,
      validatedAt: new Date(),
      recertifiedById: actor.id,
      recertifiedAt: new Date(),
      reviewDueAt: input.reviewDueAt === undefined ? script.reviewDueAt : input.reviewDueAt,
      updatedById: actor.id
    }
  });
  await createRevision(prisma, actor, updated);
  await prisma.operationalScriptEvent.create({
    data: {
      organizationId: actor.organizationId,
      scriptId: updated.id,
      userId: actor.id,
      action: "recertify",
      metadataJson: JSON.stringify({ comment: input.comment ?? null, reviewDueAt: updated.reviewDueAt })
    }
  });
  await recordAuditLog(prisma, { organizationId: actor.organizationId, actorId: actor.id, action: "script.recertify", entityType: "OperationalScript", entityId: updated.id, metadata: { title: updated.title, comment: input.comment ?? null } });
  return { script: withScriptFormat(updated) };
}

export async function obsoleteOperationalScript(prisma: PrismaClient, actor: CurrentUser, scriptId: string) {
  ensureManager(actor);
  const script = await prisma.operationalScript.findFirst({ where: { id: scriptId, organizationId: actor.organizationId } });
  if (!script) throw new ScriptLibraryError("NOT_FOUND");
  const updated = await prisma.operationalScript.update({ where: { id: script.id }, data: { status: "OBSOLETE", updatedById: actor.id } });
  await createRevision(prisma, actor, updated);
  await recordAuditLog(prisma, { organizationId: actor.organizationId, actorId: actor.id, action: "script.obsolete", entityType: "OperationalScript", entityId: updated.id, metadata: { title: updated.title } });
  return { script: withScriptFormat(updated) };
}

export async function restoreOperationalScriptRevision(prisma: PrismaClient, actor: CurrentUser, scriptId: string, revisionId: string) {
  ensureAdmin(actor);
  const current = await prisma.operationalScript.findFirst({ where: { id: scriptId, organizationId: actor.organizationId } });
  if (!current) throw new ScriptLibraryError("NOT_FOUND");
  const revision = await prisma.operationalScriptRevision.findFirst({ where: { id: revisionId, scriptId, organizationId: actor.organizationId } });
  if (!revision) throw new ScriptLibraryError("NOT_FOUND");
  const restored = await prisma.operationalScript.update({
    where: { id: current.id },
    data: {
      title: revision.title,
      channel: revision.channel,
      body: revision.body,
      tagsJson: revision.tagsJson,
      placeholdersJson: revision.placeholdersJson,
      status: revision.status,
      updatedById: actor.id,
      validatedById: revision.status === "VALIDATED" ? actor.id : revision.status === "DRAFT" ? null : undefined,
      validatedAt: revision.status === "VALIDATED" ? new Date() : revision.status === "DRAFT" ? null : undefined
    }
  });
  await createRevision(prisma, actor, restored);
  await prisma.operationalScriptEvent.create({
    data: {
      organizationId: actor.organizationId,
      scriptId: restored.id,
      userId: actor.id,
      action: "restore",
      metadataJson: JSON.stringify({ revisionId, version: revision.version })
    }
  });
  await recordAuditLog(prisma, { organizationId: actor.organizationId, actorId: actor.id, action: "script.restore_revision", entityType: "OperationalScript", entityId: restored.id, metadata: { revisionId, version: revision.version } });
  return { script: withScriptFormat(restored) };
}

export async function createOperationalScriptSuggestion(prisma: PrismaClient, actor: CurrentUser, input: ScriptSuggestionInput) {
  const suggestionType = input.suggestionType ?? (input.scriptId ? "CHANGE" : "NEW");
  if (!input.title || !input.channel || !input.body) throw new ScriptLibraryError("INVALID_INPUT");
  if (input.categoryId) await ensureCategory(prisma, actor, input.categoryId);
  if (input.scriptId) {
    const script = await prisma.operationalScript.findFirst({ where: { id: input.scriptId, organizationId: actor.organizationId } });
    if (!script) throw new ScriptLibraryError("NOT_FOUND");
  }
  const suggestion = await prisma.operationalScriptSuggestion.create({
    data: {
      organizationId: actor.organizationId,
      categoryId: input.categoryId ?? null,
      scriptId: input.scriptId ?? null,
      authorId: actor.id,
      title: input.title,
      channel: input.channel,
      body: input.body,
      tagsJson: tagsJsonFor(input.tags),
      suggestionType
    },
    include: { author: { select: { id: true, name: true, role: true } }, category: { select: { id: true, name: true } }, script: { select: { id: true, title: true } } }
  });
  await emitInAppNotifications(prisma, actor.organizationId, {
    actorId: actor.id,
    recipientRoles: ["ADMIN", "SUPERVISOR"],
    type: "script_library.suggestion.created",
    title: "Nova sugestão de script",
    body: `${actor.name} sugeriu: ${suggestion.title}`,
    entityType: "OperationalScriptSuggestion",
    entityId: suggestion.id,
    href: "/scriptoteca",
    dedupeKey: `script.suggestion.created:${suggestion.id}`
  });
  await recordAuditLog(prisma, { organizationId: actor.organizationId, actorId: actor.id, action: "script_suggestion.create", entityType: "OperationalScriptSuggestion", entityId: suggestion.id, metadata: { title: suggestion.title, suggestionType } });
  return { suggestion: { ...suggestion, tags: tagsFromJson(suggestion.tagsJson) } };
}

export async function decideOperationalScriptSuggestion(prisma: PrismaClient, actor: CurrentUser, suggestionId: string, input: ScriptSuggestionInput) {
  ensureManager(actor);
  const decision = input.decision;
  if (!decision || !["ACCEPTED", "REJECTED", "MERGED"].includes(decision)) throw new ScriptLibraryError("INVALID_INPUT");
  const suggestion = await prisma.operationalScriptSuggestion.findFirst({ where: { id: suggestionId, organizationId: actor.organizationId }, include: { author: true } });
  if (!suggestion) throw new ScriptLibraryError("NOT_FOUND");
  if (suggestion.status !== "SUGGESTED") throw new ScriptLibraryError("INVALID_INPUT");
  let createdScriptId: string | null = null;
  if (decision === "ACCEPTED") {
    const categoryId = input.categoryId ?? suggestion.categoryId;
    if (!categoryId) throw new ScriptLibraryError("INVALID_INPUT");
    await ensureCategory(prisma, actor, categoryId);
    const created = await createOperationalScript(prisma, actor, {
      categoryId,
      title: input.title ?? suggestion.title,
      channel: input.channel ?? suggestion.channel,
      body: input.body ?? suggestion.body,
      tags: input.tags ?? tagsFromJson(suggestion.tagsJson),
      status: "DRAFT"
    });
    createdScriptId = created.script.id;
  }
  if (decision === "MERGED") {
    if (!suggestion.scriptId) throw new ScriptLibraryError("INVALID_INPUT");
    const updated = await updateOperationalScript(prisma, actor, suggestion.scriptId, {
      title: input.title ?? suggestion.title,
      channel: input.channel ?? suggestion.channel,
      body: input.body ?? suggestion.body,
      tags: input.tags ?? tagsFromJson(suggestion.tagsJson),
      status: "DRAFT"
    });
    createdScriptId = updated.script.id;
  }
  const updatedSuggestion = await prisma.operationalScriptSuggestion.update({
    where: { id: suggestion.id },
    data: {
      status: decision,
      decisionComment: input.decisionComment ?? null,
      decidedById: actor.id,
      decidedAt: new Date(),
      createdScriptId
    },
    include: {
      category: { select: { id: true, name: true } },
      script: { select: { id: true, title: true } },
      author: { select: { id: true, name: true, role: true } },
      decidedBy: { select: { id: true, name: true, role: true } }
    }
  });
  await emitInAppNotifications(prisma, actor.organizationId, {
    actorId: actor.id,
    recipientIds: [suggestion.authorId],
    type: "script_library.suggestion.decided",
    title: decision === "REJECTED" ? "Sugestão de script rejeitada" : "Sugestão de script aceita",
    body: input.decisionComment ?? `Decisão: ${decision}`,
    entityType: "OperationalScriptSuggestion",
    entityId: suggestion.id,
    href: "/scriptoteca",
    dedupeKey: `script.suggestion.decided:${suggestion.id}:${decision}`
  });
  await recordAuditLog(prisma, { organizationId: actor.organizationId, actorId: actor.id, action: "script_suggestion.decide", entityType: "OperationalScriptSuggestion", entityId: suggestion.id, metadata: { decision, createdScriptId, comment: input.decisionComment ?? null } });
  return { suggestion: { ...updatedSuggestion, tags: tagsFromJson(updatedSuggestion.tagsJson) } };
}

export async function recordScriptCopy(prisma: PrismaClient, actor: CurrentUser, scriptId: string, input: ScriptCopyInput = {}) {
  const script = await prisma.operationalScript.findFirst({ where: { ...scriptVisibilityWhere(actor), id: scriptId } });
  if (!script) throw new ScriptLibraryError("NOT_FOUND");
  const [updated, event] = await Promise.all([
    prisma.operationalScript.update({ where: { id: script.id }, data: { usageCount: { increment: 1 }, copiedAt: new Date() } }),
    prisma.operationalScriptEvent.create({
      data: {
        organizationId: actor.organizationId,
        scriptId: script.id,
        userId: actor.id,
        action: "copy",
        metadataJson: JSON.stringify({ placeholders: input.placeholders ?? {}, rendered: Boolean(input.renderedText) })
      }
    })
  ]);
  return { script: withScriptFormat(updated), event };
}
