import type { Prisma, PrismaClient } from "@prisma/client";
import { commercialAllRoles, commercialManagerRoles, type CurrentUser } from "@alwaystrack/shared";
import { recordAuditLog } from "../audit/audit.service.js";
import { emitInAppNotifications } from "../notifications/notifications.service.js";
import {
  optionalArray,
  optionalBoolean,
  optionalInteger,
  optionalString,
  optionalStringArray,
  parseObjectPayload
} from "../validation/input-validation.js";

export class ServiceFlowError extends Error {
  constructor(public readonly code: "NOT_FOUND" | "INVALID_INPUT" | "FORBIDDEN" | "SLUG_TAKEN") {
    super(code);
  }
}

interface FlowStepInput {
  id?: string;
  title?: string;
  body?: string | null;
  kind?: string;
  decision?: Record<string, unknown> | null;
  order?: number;
  required?: boolean;
  collapsed?: boolean;
  scriptIds?: string[];
}

export interface ServiceFlowInput {
  wikiPageId?: string | null;
  title?: string;
  slug?: string | null;
  summary?: string | null;
  content?: string | null;
  tags?: string[];
  status?: string;
  priority?: number;
  steps?: FlowStepInput[];
}

export interface ServiceFlowFilters {
  query?: string;
  tag?: string;
  status?: string;
}

export interface ServiceFlowSessionStepInput {
  status?: string;
  decision?: string | null;
  note?: string | null;
}

export interface ServiceFlowGovernanceInput {
  comment?: string | null;
  reviewDueAt?: Date | null;
}

const statuses = new Set(["DRAFT", "PUBLISHED", "ARCHIVED"]);
const stepKinds = new Set(["MANUAL", "YES_NO", "CHECKLIST", "DECISION"]);
const sessionStepStatuses = new Set(["PENDING", "DONE", "SKIPPED"]);

function isManager(actor: CurrentUser) {
  return (commercialManagerRoles as readonly string[]).includes(actor.role);
}

function ensureManager(actor: CurrentUser) {
  if (!isManager(actor)) throw new ServiceFlowError("FORBIDDEN");
}

function text(value: unknown) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}

function status(value: unknown) {
  return typeof value === "string" && statuses.has(value.toUpperCase()) ? value.toUpperCase() : undefined;
}

function stepKind(value: unknown) {
  return typeof value === "string" && stepKinds.has(value.toUpperCase()) ? value.toUpperCase() : undefined;
}

function sessionStepStatus(value: unknown) {
  return typeof value === "string" && sessionStepStatuses.has(value.toUpperCase()) ? value.toUpperCase() : undefined;
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "fluxo";
}

function tags(values: unknown[] = []) {
  const normalized = new Set<string>();
  for (const value of values) {
    if (typeof value !== "string") continue;
    const tag = value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/^#/, "")
      .replace(/[^a-z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 32);
    if (tag.length >= 2) normalized.add(tag);
  }
  return [...normalized].sort((left, right) => left.localeCompare(right));
}

function tagsFromJson(value: string | null | undefined) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? tags(parsed) : [];
  } catch {
    return [];
  }
}

function decisionFromJson(value: string | null | undefined) {
  if (!value) return null;
  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function dateValue(value: unknown) {
  if (value === null) return null;
  if (typeof value !== "string") return undefined;
  const parsed = new Date(value.includes("T") ? value : `${value}T12:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function formatScript<T extends { tagsJson?: string | null; placeholdersJson?: string | null }>(script: T) {
  return { ...script, tags: tagsFromJson(script.tagsJson), placeholders: tagsFromJson(script.placeholdersJson) };
}

function formatFlow<T extends { tagsJson?: string | null; steps?: Array<{ decisionJson?: string | null; scripts?: Array<{ script: { tagsJson?: string | null; placeholdersJson?: string | null } }> }> }>(flow: T) {
  return {
    ...flow,
    tags: tagsFromJson(flow.tagsJson),
    steps: flow.steps?.map((step) => ({
      ...step,
      decision: decisionFromJson(step.decisionJson),
      scripts: step.scripts?.map((link) => ({ ...link, script: formatScript(link.script) })) ?? []
    })) ?? []
  };
}

export function parseServiceFlowFilters(query: Record<string, unknown>): ServiceFlowFilters {
  return {
    query: text(query.query),
    tag: text(query.tag)?.replace(/^#/, "").toLowerCase(),
    status: status(query.status)
  };
}

export function parseServiceFlowInput(payload: unknown): ServiceFlowInput {
  return parseObjectPayload(payload ?? {}, (input) => {
    const rawSteps = optionalArray(input, "steps", { maxItems: 40 }) ?? [];
    const rawTags = optionalArray(input, "tags", { maxItems: 30 });
    return {
      wikiPageId: optionalString(input, "wikiPageId", { maxLength: 80, nullable: true }),
      title: optionalString(input, "title", { maxLength: 140 }),
      slug: optionalString(input, "slug", { maxLength: 90, nullable: true }),
      summary: optionalString(input, "summary", { maxLength: 240, nullable: true }),
      content: optionalString(input, "content", { maxLength: 20_000, nullable: true }),
      tags: rawTags ? tags(rawTags) : undefined,
      status: status(optionalString(input, "status", { maxLength: 20 })),
      priority: optionalInteger(input, "priority", { min: 0, max: 1_000 }),
      steps: rawSteps.map((item, index) =>
        parseObjectPayload(item, (step) => {
          const rawScriptIds = optionalStringArray(step, "scriptIds", { maxItems: 12, itemMaxLength: 80 }) ?? [];
          return {
            id: optionalString(step, "id", { maxLength: 80 }),
            title: optionalString(step, "title", { maxLength: 140 }),
            body: optionalString(step, "body", { maxLength: 8_000, nullable: true }),
            kind: stepKind(optionalString(step, "kind", { maxLength: 20 })) ?? "MANUAL",
            decision: step.decision && typeof step.decision === "object" ? (step.decision as Record<string, unknown>) : null,
            order: optionalInteger(step, "order", { min: 1, max: 1_000 }) ?? index + 1,
            required: optionalBoolean(step, "required") ?? false,
            collapsed: optionalBoolean(step, "collapsed") ?? true,
            scriptIds: [...new Set(rawScriptIds)]
          };
        })
      )
    };
  });
}

export function parseServiceFlowSessionStepInput(payload: unknown): ServiceFlowSessionStepInput {
  return parseObjectPayload(payload ?? {}, (input) => ({
    status: sessionStepStatus(optionalString(input, "status", { maxLength: 20 })),
    decision: optionalString(input, "decision", { maxLength: 80, nullable: true }),
    note: optionalString(input, "note", { maxLength: 2_000, nullable: true })
  }));
}

export function parseServiceFlowGovernanceInput(payload: unknown): ServiceFlowGovernanceInput {
  return parseObjectPayload(payload ?? {}, (input) => ({
    comment: optionalString(input, "comment", { maxLength: 2_000, nullable: true }),
    reviewDueAt: dateValue(input.reviewDueAt)
  }));
}

function visibleStatus(actor: CurrentUser, requested?: string) {
  if (isManager(actor)) return requested;
  return "PUBLISHED";
}

export async function listServiceFlows(prisma: PrismaClient, actor: CurrentUser, filters: ServiceFlowFilters = {}) {
  const where: Prisma.ServiceFlowWhereInput = {
    organizationId: actor.organizationId,
    status: visibleStatus(actor, filters.status),
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
      filters.tag ? { tagsJson: { contains: `"${filters.tag}"` } } : undefined
    ].filter(Boolean) as Prisma.ServiceFlowWhereInput[]
  };
  const flows = await prisma.serviceFlow.findMany({
    where,
    include: {
      wikiPage: { select: { id: true, slug: true, title: true } },
      steps: {
        orderBy: { order: "asc" },
        include: {
          scripts: {
            orderBy: { order: "asc" },
            include: { script: { select: { id: true, title: true, channel: true, body: true, tagsJson: true, placeholdersJson: true, status: true, usageCount: true } } }
          }
        }
      }
    },
    orderBy: [{ priority: "asc" }, { updatedAt: "desc" }, { title: "asc" }]
  });
  if ((filters.query || filters.tag) && flows.length === 0) {
    await prisma.serviceFlowSearchEvent.create({
      data: {
        organizationId: actor.organizationId,
        userId: actor.id,
        query: filters.query ?? null,
        filtersJson: JSON.stringify({ tag: filters.tag ?? null, status: filters.status ?? null }),
        resultCount: 0
      }
    }).catch(() => null);
  }
  return { items: flows.map(formatFlow), canManage: isManager(actor) };
}

function snapshotForFlow(flow: Awaited<ReturnType<typeof getRawFlowForRevision>>) {
  return JSON.stringify({
    id: flow.id,
    slug: flow.slug,
    title: flow.title,
    summary: flow.summary,
    content: flow.content,
    tags: tagsFromJson(flow.tagsJson),
    status: flow.status,
    version: flow.version,
    steps: flow.steps.map((step) => ({
      title: step.title,
      body: step.body,
      kind: step.kind,
      decision: decisionFromJson(step.decisionJson),
      order: step.order,
      required: step.required,
      scripts: step.scripts.map((link) => ({ id: link.script.id, title: link.script.title, order: link.order }))
    }))
  });
}

async function getRawFlowForRevision(prisma: PrismaClient, actor: CurrentUser, flowId: string) {
  const flow = await prisma.serviceFlow.findFirst({
    where: { id: flowId, organizationId: actor.organizationId },
    include: {
      steps: { orderBy: { order: "asc" }, include: { scripts: { orderBy: { order: "asc" }, include: { script: { select: { id: true, title: true } } } } } }
    }
  });
  if (!flow) throw new ServiceFlowError("NOT_FOUND");
  return flow;
}

async function createFlowRevision(prisma: PrismaClient, actor: CurrentUser, flowId: string, comment?: string | null) {
  const flow = await getRawFlowForRevision(prisma, actor, flowId);
  await prisma.serviceFlowRevision.upsert({
    where: { flowId_version: { flowId: flow.id, version: flow.version } },
    update: { snapshotJson: snapshotForFlow(flow), comment: comment ?? undefined },
    create: {
      organizationId: actor.organizationId,
      flowId: flow.id,
      version: flow.version,
      title: flow.title,
      status: flow.status,
      snapshotJson: snapshotForFlow(flow),
      comment: comment ?? null,
      authorId: actor.id
    }
  });
}

async function ensureWiki(prisma: PrismaClient, actor: CurrentUser, wikiPageId?: string | null) {
  if (!wikiPageId) return;
  const page = await prisma.wikiPage.findFirst({ where: { id: wikiPageId, organizationId: actor.organizationId, active: true } });
  if (!page) throw new ServiceFlowError("NOT_FOUND");
}

async function ensureScripts(prisma: PrismaClient, actor: CurrentUser, scriptIds: string[]) {
  if (!scriptIds.length) return;
  const count = await prisma.operationalScript.count({ where: { organizationId: actor.organizationId, id: { in: scriptIds }, status: { not: "OBSOLETE" } } });
  if (count !== scriptIds.length) throw new ServiceFlowError("NOT_FOUND");
}

async function replaceSteps(prisma: PrismaClient, actor: CurrentUser, flowId: string, steps: FlowStepInput[] = []) {
  await prisma.serviceFlowStep.deleteMany({ where: { flowId, organizationId: actor.organizationId } });
  for (const [index, step] of steps.entries()) {
    if (!step.title) throw new ServiceFlowError("INVALID_INPUT");
    const scriptIds = step.scriptIds ?? [];
    await ensureScripts(prisma, actor, scriptIds);
    const created = await prisma.serviceFlowStep.create({
      data: {
        organizationId: actor.organizationId,
        flowId,
        title: step.title,
        body: step.body ?? null,
        kind: step.kind ?? "MANUAL",
        decisionJson: step.decision ? JSON.stringify(step.decision) : null,
        order: step.order ?? index + 1,
        required: step.required ?? false,
        collapsed: step.collapsed ?? true
      }
    });
    for (const [scriptIndex, scriptId] of scriptIds.entries()) {
      await prisma.serviceFlowStepScript.create({
        data: {
          organizationId: actor.organizationId,
          stepId: created.id,
          scriptId,
          order: scriptIndex + 1
        }
      });
    }
  }
}

export async function createServiceFlow(prisma: PrismaClient, actor: CurrentUser, input: ServiceFlowInput) {
  ensureManager(actor);
  if (!input.title) throw new ServiceFlowError("INVALID_INPUT");
  await ensureWiki(prisma, actor, input.wikiPageId);
  const slug = slugify(input.slug ?? input.title);
  const existing = await prisma.serviceFlow.findFirst({ where: { organizationId: actor.organizationId, slug } });
  if (existing) throw new ServiceFlowError("SLUG_TAKEN");
  const statusValue = input.status ?? "DRAFT";
  const flow = await prisma.serviceFlow.create({
    data: {
      organizationId: actor.organizationId,
      wikiPageId: input.wikiPageId ?? null,
      title: input.title,
      slug,
      summary: input.summary ?? null,
      content: input.content ?? null,
      tagsJson: JSON.stringify(input.tags ?? []),
      status: statusValue,
      priority: input.priority ?? 0,
      createdById: actor.id,
      updatedById: actor.id,
      publishedAt: statusValue === "PUBLISHED" ? new Date() : null
    }
  });
  await replaceSteps(prisma, actor, flow.id, input.steps ?? []);
  await createFlowRevision(prisma, actor, flow.id, input.status === "PUBLISHED" ? "Publicacao inicial" : "Rascunho inicial");
  await recordAuditLog(prisma, { organizationId: actor.organizationId, actorId: actor.id, action: "service_flow.create", entityType: "ServiceFlow", entityId: flow.id, metadata: { slug } });
  return getServiceFlow(prisma, actor, flow.id);
}

export async function updateServiceFlow(prisma: PrismaClient, actor: CurrentUser, flowId: string, input: ServiceFlowInput) {
  ensureManager(actor);
  const current = await prisma.serviceFlow.findFirst({ where: { id: flowId, organizationId: actor.organizationId } });
  if (!current) throw new ServiceFlowError("NOT_FOUND");
  await ensureWiki(prisma, actor, input.wikiPageId);
  const nextStatus = input.status ?? current.status;
  const nextVersion = current.version + 1;
  const flow = await prisma.serviceFlow.update({
    where: { id: current.id },
    data: {
      wikiPageId: input.wikiPageId,
      title: input.title,
      summary: input.summary,
      content: input.content,
      tagsJson: input.tags ? JSON.stringify(input.tags) : undefined,
      status: input.status,
      priority: input.priority,
      version: nextVersion,
      updatedById: actor.id,
      publishedAt: nextStatus === "PUBLISHED" && !current.publishedAt ? new Date() : nextStatus !== "PUBLISHED" ? null : current.publishedAt
    }
  });
  if (input.steps) await replaceSteps(prisma, actor, flow.id, input.steps);
  await createFlowRevision(prisma, actor, flow.id, "Atualizacao de fluxo");
  await recordAuditLog(prisma, { organizationId: actor.organizationId, actorId: actor.id, action: "service_flow.update", entityType: "ServiceFlow", entityId: flow.id, metadata: { status: flow.status } });
  return getServiceFlow(prisma, actor, flow.id);
}

export async function getServiceFlow(prisma: PrismaClient, actor: CurrentUser, flowIdOrSlug: string) {
  const flow = await prisma.serviceFlow.findFirst({
    where: {
      organizationId: actor.organizationId,
      OR: [{ id: flowIdOrSlug }, { slug: flowIdOrSlug }],
      status: visibleStatus(actor)
    },
    include: {
      wikiPage: { select: { id: true, slug: true, title: true } },
      createdBy: { select: { id: true, name: true, role: true } },
      updatedBy: { select: { id: true, name: true, role: true } },
      reviewedBy: { select: { id: true, name: true, role: true } },
      revisions: {
        orderBy: { version: "desc" },
        take: 6,
        select: { id: true, version: true, title: true, status: true, comment: true, createdAt: true, author: { select: { id: true, name: true, role: true } } }
      },
      steps: {
        orderBy: { order: "asc" },
        include: {
          scripts: {
            orderBy: { order: "asc" },
            include: { script: { select: { id: true, title: true, channel: true, body: true, tagsJson: true, placeholdersJson: true, status: true, usageCount: true } } }
          }
        }
      }
    }
  });
  if (!flow) throw new ServiceFlowError("NOT_FOUND");
  return { flow: formatFlow(flow), canManage: isManager(actor) };
}

export async function publishServiceFlow(prisma: PrismaClient, actor: CurrentUser, flowId: string, input: ServiceFlowGovernanceInput = {}) {
  ensureManager(actor);
  if (!input.comment) throw new ServiceFlowError("INVALID_INPUT");
  const current = await prisma.serviceFlow.findFirst({ where: { id: flowId, organizationId: actor.organizationId } });
  if (!current) throw new ServiceFlowError("NOT_FOUND");
  const flow = await prisma.serviceFlow.update({
    where: { id: current.id },
    data: {
      status: "PUBLISHED",
      version: current.version + 1,
      reviewComment: input.comment,
      reviewDueAt: input.reviewDueAt ?? current.reviewDueAt,
      reviewedById: actor.id,
      reviewedAt: new Date(),
      updatedById: actor.id,
      publishedAt: new Date()
    }
  });
  await createFlowRevision(prisma, actor, flow.id, input.comment);
  await recordAuditLog(prisma, { organizationId: actor.organizationId, actorId: actor.id, action: "service_flow.publish", entityType: "ServiceFlow", entityId: flow.id, metadata: { version: flow.version, comment: input.comment } });
  await emitInAppNotifications(prisma, actor.organizationId, {
    recipientRoles: [...commercialAllRoles],
    actorId: actor.id,
    type: "service_flow.published",
    title: "Fluxo de atendimento atualizado",
    body: `${flow.title} foi publicado na versao ${flow.version}.`,
    entityType: "ServiceFlow",
    entityId: flow.id,
    href: "/fluxos",
    dedupeKey: `service-flow:${flow.id}:published:${flow.version}`
  });
  return getServiceFlow(prisma, actor, flow.id);
}

export async function archiveServiceFlow(prisma: PrismaClient, actor: CurrentUser, flowId: string, input: ServiceFlowGovernanceInput = {}) {
  ensureManager(actor);
  if (!input.comment) throw new ServiceFlowError("INVALID_INPUT");
  const current = await prisma.serviceFlow.findFirst({ where: { id: flowId, organizationId: actor.organizationId } });
  if (!current) throw new ServiceFlowError("NOT_FOUND");
  const flow = await prisma.serviceFlow.update({
    where: { id: current.id },
    data: {
      status: "ARCHIVED",
      version: current.version + 1,
      reviewComment: input.comment,
      reviewedById: actor.id,
      reviewedAt: new Date(),
      updatedById: actor.id,
      publishedAt: null
    }
  });
  await createFlowRevision(prisma, actor, flow.id, input.comment);
  await recordAuditLog(prisma, { organizationId: actor.organizationId, actorId: actor.id, action: "service_flow.archive", entityType: "ServiceFlow", entityId: flow.id, metadata: { version: flow.version, comment: input.comment } });
  return getServiceFlow(prisma, actor, flow.id);
}

export async function serviceFlowMetrics(prisma: PrismaClient, actor: CurrentUser) {
  ensureManager(actor);
  const [flows, sessionGroups, stepGroups, zeroSearches, openSessions, copyEvents] = await Promise.all([
    prisma.serviceFlow.findMany({ where: { organizationId: actor.organizationId }, select: { id: true, title: true, status: true, reviewDueAt: true, version: true } }),
    prisma.serviceFlowSession.groupBy({ by: ["flowId"], where: { organizationId: actor.organizationId }, _count: { _all: true }, orderBy: { _count: { flowId: "desc" } }, take: 5 }),
    prisma.serviceFlowSessionStep.groupBy({ by: ["stepId", "status"], where: { organizationId: actor.organizationId }, _count: { _all: true } }),
    prisma.serviceFlowSearchEvent.findMany({ where: { organizationId: actor.organizationId, resultCount: 0 }, orderBy: { createdAt: "desc" }, take: 6 }),
    prisma.serviceFlowSession.count({ where: { organizationId: actor.organizationId, status: "OPEN" } }),
    prisma.operationalScriptEvent.findMany({
      where: { organizationId: actor.organizationId, action: "copy", metadataJson: { contains: "serviceFlowId" } },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { script: { select: { id: true, title: true } } }
    })
  ]);
  const flowById = new Map(flows.map((flow) => [flow.id, flow]));
  const stepIds = [...new Set(stepGroups.map((item) => item.stepId))];
  const steps = stepIds.length
    ? await prisma.serviceFlowStep.findMany({ where: { id: { in: stepIds }, organizationId: actor.organizationId }, select: { id: true, title: true, flowId: true } })
    : [];
  const stepById = new Map(steps.map((step) => [step.id, step]));
  const scriptCopies = new Map<string, { id: string; title: string; count: number }>();
  for (const event of copyEvents) {
    if (!event.metadataJson) continue;
    try {
      const metadata = JSON.parse(event.metadataJson) as { serviceFlowId?: string | null };
      if (!metadata.serviceFlowId) continue;
      const current = scriptCopies.get(event.scriptId) ?? { id: event.scriptId, title: event.script.title, count: 0 };
      current.count += 1;
      scriptCopies.set(event.scriptId, current);
    } catch {
      continue;
    }
  }
  const today = new Date();
  return {
    summary: {
      totalFlows: flows.length,
      publishedFlows: flows.filter((flow) => flow.status === "PUBLISHED").length,
      reviewDue: flows.filter((flow) => flow.reviewDueAt && flow.reviewDueAt <= today).length,
      openSessions
    },
    mostUsedFlows: sessionGroups.map((item) => ({ flowId: item.flowId, title: flowById.get(item.flowId)?.title ?? "Fluxo removido", sessions: item._count._all })),
    stepBottlenecks: stepGroups
      .filter((item) => item.status !== "DONE")
      .map((item) => ({ stepId: item.stepId, stepTitle: stepById.get(item.stepId)?.title ?? "Etapa removida", flowTitle: flowById.get(stepById.get(item.stepId)?.flowId ?? "")?.title ?? "Fluxo", status: item.status, count: item._count._all }))
      .sort((left, right) => right.count - left.count)
      .slice(0, 6),
    topScriptsByFlow: [...scriptCopies.values()].sort((left, right) => right.count - left.count).slice(0, 6),
    zeroSearches: zeroSearches.map((item) => ({ id: item.id, query: item.query, filtersJson: item.filtersJson, createdAt: item.createdAt }))
  };
}

export async function createServiceFlowSession(prisma: PrismaClient, actor: CurrentUser, flowIdOrSlug: string) {
  const { flow } = await getServiceFlow(prisma, actor, flowIdOrSlug);
  const session = await prisma.serviceFlowSession.create({
    data: {
      organizationId: actor.organizationId,
      flowId: flow.id,
      userId: actor.id,
      status: "OPEN",
      steps: {
        create: flow.steps.map((step) => ({
          organizationId: actor.organizationId,
          stepId: step.id,
          status: "PENDING"
        }))
      }
    },
    include: sessionInclude()
  });
  await recordAuditLog(prisma, {
    organizationId: actor.organizationId,
    actorId: actor.id,
    action: "service_flow_session.start",
    entityType: "ServiceFlowSession",
    entityId: session.id,
    metadata: { flowId: flow.id, slug: flow.slug }
  });
  return { session: formatSession(session) };
}

export async function updateServiceFlowSessionStep(
  prisma: PrismaClient,
  actor: CurrentUser,
  sessionId: string,
  stepId: string,
  input: ServiceFlowSessionStepInput
) {
  const session = await prisma.serviceFlowSession.findFirst({ where: { id: sessionId, organizationId: actor.organizationId, userId: actor.id } });
  if (!session) throw new ServiceFlowError("NOT_FOUND");
  const step = await prisma.serviceFlowSessionStep.findFirst({
    where: { sessionId, stepId, organizationId: actor.organizationId },
    include: { step: { select: { title: true } } }
  });
  if (!step) throw new ServiceFlowError("NOT_FOUND");
  const nextStatus = input.status ?? step.status;
  const updated = await prisma.serviceFlowSessionStep.update({
    where: { id: step.id },
    data: {
      status: nextStatus,
      decision: input.decision,
      note: input.note,
      completedAt: nextStatus === "DONE" || nextStatus === "SKIPPED" ? new Date() : null
    }
  });
  await recordAuditLog(prisma, {
    organizationId: actor.organizationId,
    actorId: actor.id,
    action: "service_flow_session.step",
    entityType: "ServiceFlowSession",
    entityId: session.id,
    metadata: { stepId, stepTitle: step.step.title, status: updated.status, decision: updated.decision, note: updated.note }
  });
  return getServiceFlowSession(prisma, actor, session.id);
}

export async function completeServiceFlowSession(prisma: PrismaClient, actor: CurrentUser, sessionId: string) {
  const session = await prisma.serviceFlowSession.findFirst({ where: { id: sessionId, organizationId: actor.organizationId, userId: actor.id } });
  if (!session) throw new ServiceFlowError("NOT_FOUND");
  await prisma.serviceFlowSession.update({ where: { id: session.id }, data: { status: "COMPLETED", completedAt: new Date() } });
  await recordAuditLog(prisma, {
    organizationId: actor.organizationId,
    actorId: actor.id,
    action: "service_flow_session.complete",
    entityType: "ServiceFlowSession",
    entityId: session.id,
    metadata: { flowId: session.flowId }
  });
  return getServiceFlowSession(prisma, actor, session.id);
}

export async function getServiceFlowSession(prisma: PrismaClient, actor: CurrentUser, sessionId: string) {
  const session = await prisma.serviceFlowSession.findFirst({
    where: { id: sessionId, organizationId: actor.organizationId, userId: actor.id },
    include: sessionInclude()
  });
  if (!session) throw new ServiceFlowError("NOT_FOUND");
  return { session: formatSession(session) };
}

function sessionInclude() {
  return {
    flow: { select: { id: true, slug: true, title: true } },
    steps: {
      include: { step: { select: { id: true, title: true, order: true, required: true } } }
    }
  } satisfies Prisma.ServiceFlowSessionInclude;
}

function formatSession<T extends { steps?: Array<{ step?: { order: number } | null }> }>(session: T) {
  return {
    ...session,
    steps: [...(session.steps ?? [])].sort((left, right) => (left.step?.order ?? 0) - (right.step?.order ?? 0))
  };
}
