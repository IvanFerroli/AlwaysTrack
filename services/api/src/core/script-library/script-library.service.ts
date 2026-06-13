import type { Prisma, PrismaClient } from "@prisma/client";
import { commercialManagerRoles, type CurrentUser } from "@alwaystrack/shared";
import { recordAuditLog } from "../audit/audit.service.js";

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
  title?: string;
  channel?: string;
  body?: string;
  tags?: string[];
  status?: string;
}

export interface ScriptFilters {
  query?: string;
  categoryId?: string;
  channel?: string;
  status?: string;
  tags?: string[];
  includeObsolete?: boolean;
}

export interface ScriptCopyInput {
  renderedText?: string | null;
  placeholders?: Record<string, string>;
}

const statuses = new Set(["DRAFT", "VALIDATED", "OBSOLETE"]);
const channels = new Set(["WHATSAPP", "EMAIL", "PHONE", "INSTAGRAM", "INTERNAL"]);

function isManager(actor: CurrentUser) {
  return (commercialManagerRoles as readonly string[]).includes(actor.role);
}

function ensureManager(actor: CurrentUser) {
  if (!isManager(actor)) throw new ScriptLibraryError("FORBIDDEN");
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

function cleanChannel(value: unknown) {
  return typeof value === "string" && channels.has(value.toUpperCase()) ? value.toUpperCase() : undefined;
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

function withScriptFormat<T extends { tagsJson?: string | null; placeholdersJson?: string | null }>(item: T) {
  return { ...item, tags: tagsFromJson(item.tagsJson), placeholders: placeholdersFromJson(item.placeholdersJson) };
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
    title: cleanText(input.title),
    channel: cleanChannel(input.channel),
    body: cleanText(input.body),
    tags: Array.isArray(input.tags) ? normalizedTags(input.tags) : undefined,
    status: cleanStatus(input.status)
  };
}

export function parseScriptFilters(query: Record<string, unknown>): ScriptFilters {
  return {
    query: cleanText(query.query),
    categoryId: cleanText(query.categoryId),
    channel: cleanChannel(query.channel),
    status: cleanStatus(query.status),
    tags: cleanText(query.tags)?.split(",").map((item) => item.trim()),
    includeObsolete: query.includeObsolete === "1" || query.includeObsolete === "true"
  };
}

export function parseScriptCopyInput(payload: unknown): ScriptCopyInput {
  const input = (payload ?? {}) as Record<string, unknown>;
  const rawPlaceholders = input.placeholders && typeof input.placeholders === "object" ? (input.placeholders as Record<string, unknown>) : {};
  const placeholders = Object.fromEntries(Object.entries(rawPlaceholders).map(([key, value]) => [key, typeof value === "string" ? value.slice(0, 160) : ""]));
  return { renderedText: cleanOptionalText(input.renderedText), placeholders };
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
      filters.includeObsolete ? undefined : { status: { not: "OBSOLETE" } }
    ].filter(Boolean) as Prisma.OperationalScriptWhereInput[]
  };
  const [categories, scripts, total] = await Promise.all([
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
        validatedBy: { select: { id: true, name: true, email: true, role: true } }
      },
      orderBy: [{ status: "asc" }, { usageCount: "desc" }, { updatedAt: "desc" }, { title: "asc" }],
      take: 100
    }),
    prisma.operationalScript.count({ where: scriptWhere })
  ]);
  return { categories, scripts: scripts.map(withScriptFormat), total, canManage: isManager(actor) };
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
  const existing = await prisma.operationalScript.findFirst({ where: { organizationId: actor.organizationId, categoryId: input.categoryId, title: input.title } });
  if (existing) throw new ScriptLibraryError("TITLE_TAKEN");
  const status = input.status ?? "DRAFT";
  const script = await prisma.operationalScript.create({
    data: {
      organizationId: actor.organizationId,
      categoryId: input.categoryId,
      title: input.title,
      channel: input.channel,
      body: input.body,
      tagsJson: tagsJsonFor(input.tags),
      placeholdersJson: placeholdersJsonFor(input.body),
      status,
      createdById: actor.id,
      updatedById: actor.id,
      validatedById: status === "VALIDATED" ? actor.id : null,
      validatedAt: status === "VALIDATED" ? new Date() : null
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
  const body = input.body ?? current.body;
  const script = await prisma.operationalScript.update({
    where: { id: current.id },
    data: {
      categoryId: input.categoryId,
      title: input.title,
      channel: input.channel,
      body: input.body,
      tagsJson: input.tags ? tagsJsonFor(input.tags) : undefined,
      placeholdersJson: input.body ? placeholdersJsonFor(body) : undefined,
      status: input.status,
      updatedById: actor.id,
      validatedById: input.status === "VALIDATED" ? actor.id : input.status === "DRAFT" ? null : undefined,
      validatedAt: input.status === "VALIDATED" ? new Date() : input.status === "DRAFT" ? null : undefined
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

export async function obsoleteOperationalScript(prisma: PrismaClient, actor: CurrentUser, scriptId: string) {
  ensureManager(actor);
  const script = await prisma.operationalScript.findFirst({ where: { id: scriptId, organizationId: actor.organizationId } });
  if (!script) throw new ScriptLibraryError("NOT_FOUND");
  const updated = await prisma.operationalScript.update({ where: { id: script.id }, data: { status: "OBSOLETE", updatedById: actor.id } });
  await createRevision(prisma, actor, updated);
  await recordAuditLog(prisma, { organizationId: actor.organizationId, actorId: actor.id, action: "script.obsolete", entityType: "OperationalScript", entityId: updated.id, metadata: { title: updated.title } });
  return { script: withScriptFormat(updated) };
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
