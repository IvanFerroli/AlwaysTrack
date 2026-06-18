import type { Prisma, PrismaClient } from "@prisma/client";
import { commercialManagerRoles, type CurrentUser } from "@alwaystrack/shared";
import { recordAuditLog } from "../audit/audit.service.js";

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

function optionalText(value: unknown) {
  if (value === null) return null;
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function integer(value: unknown) {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number.parseInt(value, 10) : Number.NaN;
  return Number.isInteger(parsed) ? parsed : undefined;
}

function bool(value: unknown) {
  return typeof value === "boolean" ? value : undefined;
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
  const input = (payload ?? {}) as Record<string, unknown>;
  const rawSteps = Array.isArray(input.steps) ? input.steps : [];
  return {
    wikiPageId: optionalText(input.wikiPageId),
    title: text(input.title),
    slug: optionalText(input.slug),
    summary: optionalText(input.summary),
    content: optionalText(input.content),
    tags: Array.isArray(input.tags) ? tags(input.tags) : undefined,
    status: status(input.status),
    priority: integer(input.priority),
    steps: rawSteps.map((item, index) => {
      const step = (item ?? {}) as Record<string, unknown>;
      const rawScriptIds = Array.isArray(step.scriptIds) ? step.scriptIds.filter((value): value is string => typeof value === "string") : [];
      return {
        id: text(step.id),
        title: text(step.title),
        body: optionalText(step.body),
        kind: stepKind(step.kind) ?? "MANUAL",
        decision: step.decision && typeof step.decision === "object" ? (step.decision as Record<string, unknown>) : null,
        order: integer(step.order) ?? index + 1,
        required: bool(step.required) ?? false,
        collapsed: bool(step.collapsed) ?? true,
        scriptIds: [...new Set(rawScriptIds)]
      };
    })
  };
}

export function parseServiceFlowSessionStepInput(payload: unknown): ServiceFlowSessionStepInput {
  const input = (payload ?? {}) as Record<string, unknown>;
  return {
    status: sessionStepStatus(input.status),
    decision: optionalText(input.decision),
    note: optionalText(input.note)
  };
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
  return { items: flows.map(formatFlow), canManage: isManager(actor) };
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
  await recordAuditLog(prisma, { organizationId: actor.organizationId, actorId: actor.id, action: "service_flow.create", entityType: "ServiceFlow", entityId: flow.id, metadata: { slug } });
  return getServiceFlow(prisma, actor, flow.id);
}

export async function updateServiceFlow(prisma: PrismaClient, actor: CurrentUser, flowId: string, input: ServiceFlowInput) {
  ensureManager(actor);
  const current = await prisma.serviceFlow.findFirst({ where: { id: flowId, organizationId: actor.organizationId } });
  if (!current) throw new ServiceFlowError("NOT_FOUND");
  await ensureWiki(prisma, actor, input.wikiPageId);
  const nextStatus = input.status ?? current.status;
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
      updatedById: actor.id,
      publishedAt: nextStatus === "PUBLISHED" && !current.publishedAt ? new Date() : nextStatus !== "PUBLISHED" ? null : current.publishedAt
    }
  });
  if (input.steps) await replaceSteps(prisma, actor, flow.id, input.steps);
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
