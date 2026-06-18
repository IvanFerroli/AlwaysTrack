import type { Prisma, PrismaClient } from "@prisma/client";
import type { CurrentUser } from "@alwaystrack/shared";
import { loadEnv } from "../../config/env.js";
import { recordAuditLog } from "../audit/audit.service.js";
import { emitInAppNotifications } from "../notifications/notifications.service.js";
import {
  optionalBoolean,
  optionalEnum,
  optionalInteger,
  optionalString,
  optionalStringArray,
  parseObjectPayload
} from "../validation/input-validation.js";

/** Domain error for FAQ articles, discussion threads, comments and reactions. */
export class FaqError extends Error {
  constructor(public readonly code: "NOT_FOUND" | "INVALID_INPUT" | "FORBIDDEN") {
    super(code);
  }
}

export interface FaqInput {
  category?: string;
  question?: string;
  answer?: string;
  order?: number;
  active?: boolean;
}

export interface FaqFilters {
  organizationId?: string;
  category?: string;
  query?: string;
  activeOnly?: boolean;
  page?: number;
  pageSize?: number;
}

export interface PublicHelpInput {
  organizationId?: string;
  professionalId?: string;
  licenseId?: string;
  problemType?: string;
  message?: string;
}

/** User-created question thread that can later be promoted into the Wiki. */
export interface FaqThreadInput {
  title?: string;
  body?: string | null;
  status?: string;
  tags?: string[];
}

export interface FaqThreadFilters {
  query?: string;
  status?: string;
  tags?: string[];
  recent?: string;
  page?: number;
  pageSize?: number;
}

export interface FaqCommentInput {
  body?: string;
}

/** Reaction toggle for FAQ threads and comments. */
export interface FaqReactionInput {
  targetType?: "THREAD" | "COMMENT";
  targetId?: string;
  type?: string;
  active?: boolean;
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

function cleanPositiveNumber(value: unknown) {
  const parsed = cleanNumber(value);
  return parsed && parsed > 0 ? parsed : undefined;
}

function paginationFor(input: { page?: number; pageSize?: number }) {
  if (!input.page && !input.pageSize) return {};
  const page = input.page ?? 1;
  const pageSize = Math.min(Math.max(input.pageSize ?? 25, 1), 100);
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
}

function cleanThreadStatus(value: unknown) {
  return value === "OPEN" || value === "ANSWERED" || value === "RESOLVED" || value === "ARCHIVED" ? value : undefined;
}

function cleanReactionType(value: unknown) {
  return value === "HELPFUL" || value === "SAME_DOUBT" || value === "THANKS" ? value : undefined;
}

function cleanTargetType(value: unknown) {
  return value === "COMMENT" ? "COMMENT" : value === "THREAD" ? "THREAD" : undefined;
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
  return [...tags].sort((a, b) => a.localeCompare(b));
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

function extractInlineTags(...values: Array<string | null | undefined>) {
  const tags: string[] = [];
  for (const value of values) {
    if (!value) continue;
    for (const match of value.matchAll(/(^|\s)#([a-z0-9][a-z0-9_-]{1,32})/gi)) tags.push(match[2]);
  }
  return normalizedTags(tags);
}

function tagWhere(tags: string[] | undefined) {
  const normalized = normalizedTags(tags ?? []);
  return normalized.length ? normalized.map((tag) => ({ tagsJson: { contains: `"${tag}"` } })) : undefined;
}

function recentSince(value: string | undefined) {
  const days = value === "7" ? 7 : value === "30" ? 30 : undefined;
  if (!days) return undefined;
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - days);
  return since;
}

function withThreadTags<T extends { title: string; body: string | null; tagsJson?: string | null }>(thread: T) {
  return { ...thread, tags: normalizedTags([...tagsFromJson(thread.tagsJson), ...extractInlineTags(thread.title, thread.body)]) };
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "faq";
}

function ensureThreadModerator(actor: CurrentUser) {
  if (!["ADMIN", "GESTOR", "SUPERVISOR"].includes(actor.role)) throw new FaqError("FORBIDDEN");
}

function presentIds(values: Array<string | null | undefined>) {
  return values.filter((value): value is string => typeof value === "string" && value.length > 0);
}

function ensureAdmin(actor: CurrentUser) {
  if (actor.role !== "ADMIN") throw new FaqError("FORBIDDEN");
}

export function parseFaqInput(payload: unknown): FaqInput {
  return parseObjectPayload(payload, (input) => ({
    category: optionalString(input, "category", { maxLength: 80 }),
    question: optionalString(input, "question", { maxLength: 240 }),
    answer: optionalString(input, "answer", { maxLength: 4000 }),
    order: optionalInteger(input, "order", { min: 0, max: 10000 }),
    active: optionalBoolean(input, "active")
  }));
}

export function parseFaqFilters(query: Record<string, unknown>): FaqFilters {
  return {
    organizationId: optionalString(query, "organizationId", { maxLength: 80 }),
    category: optionalString(query, "category", { maxLength: 80 }),
    query: optionalString(query, "query", { maxLength: 120 }),
    activeOnly: query.activeOnly === "false" ? false : true,
    page: optionalInteger(query, "page", { min: 1 }),
    pageSize: optionalInteger(query, "pageSize", { min: 1, max: 100 })
  };
}

export function parsePublicHelpInput(payload: unknown): PublicHelpInput {
  return parseObjectPayload(payload, (input) => ({
    organizationId: optionalString(input, "organizationId", { maxLength: 80 }),
    professionalId: optionalString(input, "professionalId", { maxLength: 80 }),
    licenseId: optionalString(input, "licenseId", { maxLength: 80 }),
    problemType: optionalString(input, "problemType", { maxLength: 80 }),
    message: optionalString(input, "message", { maxLength: 1000 })
  }));
}

export function parseFaqThreadInput(payload: unknown): FaqThreadInput {
  return parseObjectPayload(payload, (input) => {
    const tags = optionalStringArray(input, "tags", { maxItems: 20, itemMaxLength: 40 });
    return {
      title: optionalString(input, "title", { maxLength: 180 }),
      body: optionalString(input, "body", { maxLength: 4000, nullable: true }),
      status: optionalEnum(input, "status", ["OPEN", "ANSWERED", "RESOLVED", "ARCHIVED"]),
      tags: tags ? normalizedTags(tags) : undefined
    };
  });
}

export function parseFaqThreadFilters(query: Record<string, unknown>): FaqThreadFilters {
  const tags = optionalString(query, "tags", { maxLength: 500 });
  return {
    query: optionalString(query, "query", { maxLength: 120 }),
    status: optionalEnum(query, "status", ["OPEN", "ANSWERED", "RESOLVED", "ARCHIVED"]),
    tags: normalizedTags(String(tags ?? "").split(",")),
    recent: optionalEnum(query, "recent", ["7", "30"]),
    page: optionalInteger(query, "page", { min: 1 }),
    pageSize: optionalInteger(query, "pageSize", { min: 1, max: 100 })
  };
}

export function parseFaqCommentInput(payload: unknown): FaqCommentInput {
  return parseObjectPayload(payload, (input) => ({ body: optionalString(input, "body", { maxLength: 4000 }) }));
}

export function parseFaqReactionInput(payload: unknown): FaqReactionInput {
  return parseObjectPayload(payload, (input) => ({
    targetType: optionalEnum(input, "targetType", ["THREAD", "COMMENT"]),
    targetId: optionalString(input, "targetId", { maxLength: 80 }),
    type: optionalEnum(input, "type", ["HELPFUL", "SAME_DOUBT", "THANKS"]),
    active: optionalBoolean(input, "active")
  }));
}

function faqWhere(organizationId: string, filters: FaqFilters): Prisma.FaqItemWhereInput {
  return {
    organizationId,
    active: filters.activeOnly ? true : undefined,
    category: filters.category,
    OR: filters.query ? [{ question: { contains: filters.query } }, { answer: { contains: filters.query } }] : undefined
  };
}

export async function listFaqItems(prisma: PrismaClient, actor: CurrentUser, filters: FaqFilters = {}) {
  const organizationId = actor.organizationId;
  const where = faqWhere(organizationId, { ...filters, activeOnly: filters.activeOnly ?? false });
  const pagination = paginationFor(filters);
  const [items, total] = await Promise.all([
    prisma.faqItem.findMany({
      where,
      orderBy: [{ active: "desc" }, { category: "asc" }, { order: "asc" }, { question: "asc" }],
      skip: pagination.skip,
      take: pagination.take
    }),
    prisma.faqItem.count({ where })
  ]);
  return { items, total, page: pagination.page ?? 1, pageSize: pagination.pageSize ?? items.length };
}

export async function listPublicFaqItems(prisma: PrismaClient, filters: FaqFilters) {
  if (!filters.organizationId) throw new FaqError("INVALID_INPUT");
  const organization = await prisma.organization.findFirst({ where: { id: filters.organizationId, active: true } });
  if (!organization) throw new FaqError("NOT_FOUND");
  const where = faqWhere(filters.organizationId, { ...filters, activeOnly: true });
  const pagination = paginationFor(filters);
  const [items, total] = await Promise.all([
    prisma.faqItem.findMany({
      where,
      select: { id: true, category: true, question: true, answer: true, order: true },
      orderBy: [{ category: "asc" }, { order: "asc" }, { question: "asc" }],
      skip: pagination.skip,
      take: pagination.take
    }),
    prisma.faqItem.count({ where })
  ]);
  return { organization: { id: organization.id, name: organization.name }, items, total, page: pagination.page ?? 1, pageSize: pagination.pageSize ?? items.length };
}

export async function createFaqItem(prisma: PrismaClient, actor: CurrentUser, input: FaqInput) {
  ensureAdmin(actor);
  if (!input.category || !input.question || !input.answer) throw new FaqError("INVALID_INPUT");

  const item = await prisma.faqItem.create({
    data: {
      organizationId: actor.organizationId,
      category: input.category,
      question: input.question,
      answer: input.answer,
      order: input.order ?? 0,
      active: input.active ?? true
    }
  });
  await recordAuditLog(prisma, {
    organizationId: actor.organizationId,
    actorId: actor.id,
    action: "faq.create",
    entityType: "FaqItem",
    entityId: item.id,
    metadata: { category: item.category, question: item.question, active: item.active }
  });
  return item;
}

export async function updateFaqItem(prisma: PrismaClient, actor: CurrentUser, faqItemId: string, input: FaqInput) {
  ensureAdmin(actor);
  const existing = await prisma.faqItem.findFirst({ where: { id: faqItemId, organizationId: actor.organizationId } });
  if (!existing) throw new FaqError("NOT_FOUND");
  if (
    !input.category &&
    !input.question &&
    !input.answer &&
    input.order === undefined &&
    input.active === undefined
  ) {
    throw new FaqError("INVALID_INPUT");
  }

  const item = await prisma.faqItem.update({
    where: { id: faqItemId },
    data: input
  });
  await recordAuditLog(prisma, {
    organizationId: actor.organizationId,
    actorId: actor.id,
    action: input.active === false ? "faq.deactivate" : "faq.update",
    entityType: "FaqItem",
    entityId: item.id,
    metadata: input
  });
  return item;
}

const faqThreadInclude = {
  author: { select: { id: true, name: true, email: true, role: true } },
  wikiPage: { select: { id: true, slug: true, title: true } },
  promotedBy: { select: { id: true, name: true, email: true, role: true } },
  comments: {
    include: {
      author: { select: { id: true, name: true, email: true, role: true } },
      reactions: { include: { user: { select: { id: true, name: true } } } }
    },
    orderBy: { createdAt: "asc" as const }
  },
  reactions: { include: { user: { select: { id: true, name: true } } } }
};

function faqThreadWhere(actor: CurrentUser, filters: FaqThreadFilters = {}): Prisma.FaqThreadWhereInput {
  return {
    organizationId: actor.organizationId,
    status: filters.status,
    updatedAt: recentSince(filters.recent) ? { gte: recentSince(filters.recent) } : undefined,
    AND: tagWhere(filters.tags),
    OR: filters.query
      ? [
          { title: { contains: filters.query } },
          { body: { contains: filters.query } },
          { tagsJson: { contains: filters.query.toLowerCase() } },
          { comments: { some: { body: { contains: filters.query } } } }
        ]
      : undefined
  };
}

export async function listFaqThreads(prisma: PrismaClient, actor: CurrentUser, filters: FaqThreadFilters = {}) {
  const where = faqThreadWhere(actor, filters);
  const pagination = paginationFor(filters);
  const [items, total] = await Promise.all([
    prisma.faqThread.findMany({
      where,
      include: faqThreadInclude,
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
      skip: pagination.skip,
      take: pagination.take
    }),
    prisma.faqThread.count({ where })
  ]);
  return { items: items.map(withThreadTags), total, page: pagination.page ?? 1, pageSize: pagination.pageSize ?? items.length };
}

export async function createFaqThread(prisma: PrismaClient, actor: CurrentUser, input: FaqThreadInput) {
  if (!input.title) throw new FaqError("INVALID_INPUT");
  const thread = await prisma.faqThread.create({
    data: {
      organizationId: actor.organizationId,
      authorId: actor.id,
      title: input.title,
      body: input.body ?? null,
      tagsJson: tagsJsonFor([...(input.tags ?? []), ...extractInlineTags(input.title, input.body)]),
      status: "OPEN"
    },
    include: faqThreadInclude
  });
  await recordAuditLog(prisma, {
    organizationId: actor.organizationId,
    actorId: actor.id,
    action: "faq.thread.create",
    entityType: "FaqThread",
    entityId: thread.id,
    metadata: { title: thread.title, status: thread.status }
  });
  await emitInAppNotifications(prisma, actor.organizationId, {
    actorId: actor.id,
    recipientRoles: ["ADMIN", "GESTOR", "SUPERVISOR"],
    type: "faq.thread.created",
    title: "Nova pergunta na FAQ",
    body: thread.title,
    entityType: "FaqThread",
    entityId: thread.id,
    href: "/faq",
    dedupeKey: `faq.thread.created:${thread.id}`
  });
  return withThreadTags(thread);
}

async function getFaqThreadOrThrow(prisma: PrismaClient, actor: CurrentUser, threadId: string) {
  const thread = await prisma.faqThread.findFirst({
    where: { id: threadId, organizationId: actor.organizationId },
    include: faqThreadInclude
  });
  if (!thread) throw new FaqError("NOT_FOUND");
  return withThreadTags(thread);
}

export async function addFaqComment(prisma: PrismaClient, actor: CurrentUser, threadId: string, input: FaqCommentInput) {
  if (!input.body) throw new FaqError("INVALID_INPUT");
  await getFaqThreadOrThrow(prisma, actor, threadId);
  const comment = await prisma.faqComment.create({
    data: {
      organizationId: actor.organizationId,
      threadId,
      authorId: actor.id,
      body: input.body
    }
  });
  await prisma.faqThread.update({ where: { id: threadId }, data: { status: "ANSWERED" } });
  await recordAuditLog(prisma, {
    organizationId: actor.organizationId,
    actorId: actor.id,
    action: "faq.comment.create",
    entityType: "FaqComment",
    entityId: comment.id,
    metadata: { threadId }
  });
  const thread = await getFaqThreadOrThrow(prisma, actor, threadId);
  await emitInAppNotifications(prisma, actor.organizationId, {
    actorId: actor.id,
    recipientIds: [thread.authorId],
    recipientRoles: ["ADMIN", "GESTOR", "SUPERVISOR"],
    type: "faq.thread.commented",
    title: "Nova resposta na FAQ",
    body: thread.title,
    entityType: "FaqThread",
    entityId: thread.id,
    href: "/faq",
    dedupeKey: `faq.thread.commented:${comment.id}`
  });
  return withThreadTags(thread);
}

export async function updateFaqThreadStatus(prisma: PrismaClient, actor: CurrentUser, threadId: string, input: FaqThreadInput) {
  ensureThreadModerator(actor);
  if (!input.status) throw new FaqError("INVALID_INPUT");
  await getFaqThreadOrThrow(prisma, actor, threadId);
  const thread = await prisma.faqThread.update({
    where: { id: threadId },
    data: { status: input.status },
    include: faqThreadInclude
  });
  await recordAuditLog(prisma, {
    organizationId: actor.organizationId,
    actorId: actor.id,
    action: "faq.thread.status",
    entityType: "FaqThread",
    entityId: thread.id,
    metadata: { status: thread.status }
  });
  await emitInAppNotifications(prisma, actor.organizationId, {
    actorId: actor.id,
    recipientIds: [thread.authorId],
    type: "faq.thread.state_changed",
    title: "Status da FAQ atualizado",
    body: `${thread.title}: ${thread.status}`,
    entityType: "FaqThread",
    entityId: thread.id,
    href: "/faq",
    dedupeKey: `faq.thread.status:${thread.id}:${thread.status}`
  });
  return withThreadTags(thread);
}

async function assertFaqReactionTarget(prisma: PrismaClient, actor: CurrentUser, threadId: string, input: FaqReactionInput) {
  if (!input.targetType || !input.targetId || !input.type) throw new FaqError("INVALID_INPUT");
  await getFaqThreadOrThrow(prisma, actor, threadId);
  if (input.targetType === "THREAD") {
    if (input.targetId !== threadId) throw new FaqError("INVALID_INPUT");
    return { commentId: null };
  }
  const comment = await prisma.faqComment.findFirst({
    where: { id: input.targetId, threadId, organizationId: actor.organizationId }
  });
  if (!comment) throw new FaqError("NOT_FOUND");
  return { commentId: comment.id };
}

export async function setFaqReaction(prisma: PrismaClient, actor: CurrentUser, threadId: string, input: FaqReactionInput) {
  const target = await assertFaqReactionTarget(prisma, actor, threadId, input);
  const where = {
    organizationId_targetType_targetId_userId_type: {
      organizationId: actor.organizationId,
      targetType: input.targetType!,
      targetId: input.targetId!,
      userId: actor.id,
      type: input.type!
    }
  };
  if (input.active === false) {
    await prisma.faqReaction.deleteMany({
      where: {
        organizationId: actor.organizationId,
        targetType: input.targetType,
        targetId: input.targetId,
        userId: actor.id,
        type: input.type
      }
    });
  } else {
    await prisma.faqReaction.upsert({
      where,
      create: {
        organizationId: actor.organizationId,
        threadId,
        commentId: target.commentId,
        userId: actor.id,
        targetType: input.targetType!,
        targetId: input.targetId!,
        type: input.type!
      },
      update: {}
    });
  }
  await recordAuditLog(prisma, {
    organizationId: actor.organizationId,
    actorId: actor.id,
    action: input.active === false ? "faq.reaction.remove" : "faq.reaction.set",
    entityType: "FaqThread",
    entityId: threadId,
    metadata: { targetType: input.targetType, targetId: input.targetId, type: input.type }
  });
  const thread = await getFaqThreadOrThrow(prisma, actor, threadId);
  if (input.active !== false) {
    const recipientIds = presentIds(
      input.targetType === "COMMENT"
        ? [thread.comments.find((comment) => comment.id === input.targetId)?.authorId]
        : [thread.authorId]
    );
    await emitInAppNotifications(prisma, actor.organizationId, {
      actorId: actor.id,
      recipientIds,
      type: "faq.thread.reacted",
      title: "Nova reacao na FAQ",
      body: thread.title,
      entityType: "FaqThread",
      entityId: thread.id,
      href: "/faq",
      dedupeKey: `faq.thread.reacted:${input.targetType}:${input.targetId}:${input.type}:${actor.id}`
    });
  }
  return withThreadTags(thread);
}

function wikiMarkdownFromThread(thread: Awaited<ReturnType<typeof getFaqThreadOrThrow>>) {
  const comments = thread.comments
    .map((comment) => `### Resposta de ${comment.author.name}\n\n${comment.body}`)
    .join("\n\n");
  return [
    `# ${thread.title}`,
    thread.body ? `## Pergunta\n\n${thread.body}` : null,
    comments ? `## Discussao da FAQ\n\n${comments}` : null,
    `\n\n_Fonte: FAQ interna, thread ${thread.id}._`
  ]
    .filter(Boolean)
    .join("\n\n");
}

export async function promoteFaqThreadToWiki(prisma: PrismaClient, actor: CurrentUser, threadId: string) {
  ensureThreadModerator(actor);
  const thread = await getFaqThreadOrThrow(prisma, actor, threadId);
  if (thread.wikiPage) return withThreadTags(thread);

  const baseSlug = slugify(thread.title);
  const existing = await prisma.wikiPage.findFirst({ where: { organizationId: actor.organizationId, slug: baseSlug } });
  const slug = existing ? `${baseSlug}-${thread.id.slice(-6)}` : baseSlug;
  const page = await prisma.wikiPage.create({
    data: {
      organizationId: actor.organizationId,
      slug,
      title: thread.title,
      content: wikiMarkdownFromThread(thread),
      tagsJson: tagsJsonFor([...tagsFromJson(thread.tagsJson), ...extractInlineTags(thread.title, thread.body)]),
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
    metadata: { slug: page.slug, version: page.version, source: "faq.thread" }
  });
  const updated = await prisma.faqThread.update({
    where: { id: threadId },
    data: {
      wikiPageId: page.id,
      promotedAt: new Date(),
      promotedById: actor.id,
      status: thread.status === "ARCHIVED" ? "ARCHIVED" : "RESOLVED"
    },
    include: faqThreadInclude
  });
  await recordAuditLog(prisma, {
    organizationId: actor.organizationId,
    actorId: actor.id,
    action: "faq.thread.promote_to_wiki",
    entityType: "FaqThread",
    entityId: threadId,
    metadata: { wikiPageId: page.id, slug: page.slug }
  });
  await emitInAppNotifications(prisma, actor.organizationId, {
    actorId: actor.id,
    recipientIds: [thread.authorId],
    recipientRoles: ["ADMIN", "GESTOR", "SUPERVISOR"],
    type: "faq.thread.promoted_to_wiki",
    title: "FAQ promovida para Wiki",
    body: updated.title,
    entityType: "FaqThread",
    entityId: updated.id,
    href: `/wiki/${page.slug}`,
    dedupeKey: `faq.thread.promoted_to_wiki:${updated.id}`
  });
  return withThreadTags(updated);
}

function digitsOnly(value: string | null | undefined) {
  return value?.replace(/\D/g, "") || undefined;
}

function buildWaUrl(phone: string, message: string) {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export async function buildPublicHelpLink(prisma: PrismaClient, input: PublicHelpInput) {
  if (!input.organizationId || !input.problemType || !input.message) throw new FaqError("INVALID_INPUT");

  const organization = await prisma.organization.findFirst({ where: { id: input.organizationId, active: true } });
  if (!organization) throw new FaqError("NOT_FOUND");

  const professional = input.professionalId
    ? await prisma.professional.findFirst({
        where: { id: input.professionalId, organizationId: input.organizationId },
        include: {
          responsibleRt: true,
          unit: true,
          sector: true,
          licenses: {
            where: input.licenseId ? { id: input.licenseId } : undefined,
            include: { licenseType: true },
            take: 1
          }
        }
      })
    : null;

  if (input.professionalId && !professional) throw new FaqError("NOT_FOUND");

  const rtPhone = digitsOnly(professional?.responsibleRt?.phone);
  const supervisor = professional
    ? await prisma.user.findFirst({
        where: {
          organizationId: input.organizationId,
          role: "SUPERVISOR",
          active: true,
          OR: [
            { unitScopeJson: { contains: professional.unitId } },
            { sectorScopeJson: { contains: professional.sectorId } }
          ]
        },
        orderBy: { name: "asc" }
      })
    : null;
  const supervisorPhone = digitsOnly(supervisor?.phone);
  const admin = await prisma.user.findFirst({
    where: { organizationId: input.organizationId, role: "ADMIN", active: true, phone: { not: null } },
    orderBy: { name: "asc" }
  });
  const adminPhone = digitsOnly(admin?.phone);
  const env = loadEnv();
  const fallbackPhone = digitsOnly(env.supportPhone);
  const phone = rtPhone ?? supervisorPhone ?? adminPhone ?? fallbackPhone;
  if (!phone) throw new FaqError("NOT_FOUND");

  const license = professional?.licenses[0];
  const message = [
    `Ajuda ${env.appName} - ${input.problemType}`,
    professional ? `Profissional: ${professional.name}` : `Organizacao: ${organization.name}`,
    license ? `Licenca: ${license.licenseType.name}${license.number ? ` / ${license.number}` : ""}` : null,
    `Mensagem: ${input.message}`
  ]
    .filter(Boolean)
    .join("\n");

  return {
    url: buildWaUrl(phone, message),
    recipient: rtPhone ? "RT" : supervisorPhone ? "SUPERVISOR" : adminPhone ? "ADMIN" : "SUPPORT"
  };
}
