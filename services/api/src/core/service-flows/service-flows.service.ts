import type { Prisma, PrismaClient } from "@prisma/client";
import { commercialAllRoles, commercialManagerRoles, flowNodeTypes, type CurrentUser, type FlowNodeDefinition, type FlowTransitionDefinition } from "@alwaystrack/shared";
import { validateFlowGraph } from "./flow-validation.js";
import { recordAuditLog } from "../audit/audit.service.js";
import { emitInAppNotifications } from "../notifications/notifications.service.js";
import {
  InputValidationError,
  optionalArray,
  optionalBoolean,
  optionalEnum,
  optionalInteger,
  optionalString,
  optionalStringArray,
  parseObjectPayload
} from "../validation/input-validation.js";

export class ServiceFlowError extends Error {
  constructor(
    public readonly code: "NOT_FOUND" | "INVALID_INPUT" | "FORBIDDEN" | "SLUG_TAKEN" | "MISSING_REQUIRED_FACTS",
    public readonly missingFieldKeys: string[] = []
  ) {
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

export interface ServiceFlowGraphInput {
  nodes: FlowNodeDefinition[];
  transitions: FlowTransitionDefinition[];
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
  graph?: ServiceFlowGraphInput;
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

/** PATCH semantics: merge only the supplied keys into the session's existing case data. */
export interface ServiceFlowSessionCaseDataInput {
  values: Record<string, string>;
}

export interface ServiceFlowSessionRewindInput {
  strategy: "DISCARD_FOLLOWING" | "RECONFIRM_FOLLOWING";
}

export interface ServiceFlowGovernanceInput {
  comment?: string | null;
  reviewDueAt?: Date | null;
}

const statuses = new Set(["DRAFT", "PUBLISHED", "ARCHIVED"]);
const stepKinds = new Set(["MANUAL", "YES_NO", "CHECKLIST", "DECISION"]);
const sessionStepStatuses = new Set(["PENDING", "DONE", "SKIPPED"]);
const rewindStrategies = ["DISCARD_FOLLOWING", "RECONFIRM_FOLLOWING"] as const;
const safeCaseDataKey = /^[A-Za-z0-9][A-Za-z0-9_.-]{0,79}$/;
const unsafeCaseDataKeys = new Set(["__proto__", "prototype", "constructor"]);

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

function choiceHistoryFromJson(value: string | null | undefined) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function caseDataFromJson(value: string | null | undefined): Record<string, string> {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return Object.fromEntries(Object.entries(parsed).filter((entry): entry is [string, string] => typeof entry[1] === "string"));
  } catch {
    return {};
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

function formatFlow<T extends { tagsJson?: string | null; steps?: Array<{ decisionJson?: string | null; scripts?: Array<{ script: { tagsJson?: string | null; placeholdersJson?: string | null; status?: string } }> }> }>(flow: T, includeUnpublishedScripts = true) {
  return {
    ...flow,
    tags: tagsFromJson(flow.tagsJson),
    steps: flow.steps?.map((step) => ({
      ...step,
      decision: decisionFromJson(step.decisionJson),
      scripts: step.scripts
        ?.filter((link) => includeUnpublishedScripts || link.script.status === "VALIDATED")
        .map((link) => ({ ...link, script: formatScript(link.script) })) ?? []
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
    const rawSteps = optionalArray(input, "steps", { maxItems: 100 }) ?? [];
    const rawTags = optionalArray(input, "tags", { maxItems: 30 });
    const graph = input.graph === undefined ? undefined : parseGraphInput(input.graph);
    return {
      wikiPageId: optionalString(input, "wikiPageId", { maxLength: 80, nullable: true }),
      title: optionalString(input, "title", { maxLength: 140 }),
      slug: optionalString(input, "slug", { maxLength: 90, nullable: true }),
      summary: optionalString(input, "summary", { maxLength: 240, nullable: true }),
      content: optionalString(input, "content", { maxLength: 20_000, nullable: true }),
      tags: rawTags ? tags(rawTags) : undefined,
      status: status(optionalString(input, "status", { maxLength: 20 })),
      priority: optionalInteger(input, "priority", { min: 0, max: 1_000 }),
      graph,
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

function parseGraphInput(value: unknown): ServiceFlowGraphInput {
  return parseObjectPayload(value, (graph) => {
    const nodes = optionalArray(graph, "nodes", { maxItems: 100 }) ?? [];
    const transitions = optionalArray(graph, "transitions", { maxItems: 300 }) ?? [];
    return {
      nodes: nodes.map((value) => parseObjectPayload(value, (node) => {
        const type = optionalString(node, "type", { maxLength: 30 });
        if (!type || !(flowNodeTypes as readonly string[]).includes(type)) throw new ServiceFlowError("INVALID_INPUT");
        return {
          key: optionalString(node, "key", { maxLength: 80 }) ?? "",
          type: type as FlowNodeDefinition["type"], title: optionalString(node, "title", { maxLength: 140 }) ?? "",
          operatorInstruction: optionalString(node, "operatorInstruction", { maxLength: 8_000 }),
          requiredFacts: optionalStringArray(node, "requiredFacts", { maxItems: 50, itemMaxLength: 100 }) ?? [],
          optionalFacts: optionalStringArray(node, "optionalFacts", { maxItems: 50, itemMaxLength: 100 }) ?? [],
          scripts: Array.isArray(node.scripts) ? node.scripts as FlowNodeDefinition["scripts"] : [],
          allowedCapabilities: (optionalStringArray(node, "allowedCapabilities", { maxItems: 30, itemMaxLength: 50 }) ?? []) as FlowNodeDefinition["allowedCapabilities"],
          forbiddenCapabilities: (optionalStringArray(node, "forbiddenCapabilities", { maxItems: 30, itemMaxLength: 50 }) ?? []) as FlowNodeDefinition["forbiddenCapabilities"],
          autoAdvance: optionalBoolean(node, "autoAdvance") ?? false,
          riskLevel: (optionalString(node, "riskLevel", { maxLength: 20 }) ?? "LOW") as FlowNodeDefinition["riskLevel"],
          terminal: optionalBoolean(node, "terminal") ?? false,
          message: optionalString(node, "message", { maxLength: 8_000 }),
          dependencies: optionalStringArray(node, "dependencies", { maxItems: 50, itemMaxLength: 100 })
        };
      })),
      transitions: transitions.map((value, index) => parseObjectPayload(value, (edge) => ({
        fromNodeKey: optionalString(edge, "fromNodeKey", { maxLength: 80 }) ?? "",
        toNodeKey: optionalString(edge, "toNodeKey", { maxLength: 80 }) ?? "",
        label: optionalString(edge, "label", { maxLength: 140 }) ?? "",
        order: optionalInteger(edge, "order", { min: 0, max: 10_000 }) ?? index,
        condition: edge.condition && typeof edge.condition === "object" ? edge.condition as FlowTransitionDefinition["condition"] : undefined,
        requiresUserChoice: optionalBoolean(edge, "requiresUserChoice") ?? false,
        allowLoop: optionalBoolean(edge, "allowLoop") ?? false
      })))
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

export function parseServiceFlowSessionCaseDataInput(payload: unknown): ServiceFlowSessionCaseDataInput {
  return parseObjectPayload(payload ?? {}, (input) => {
    const values = parseObjectPayload(input.values, (rawValues) => {
      const entries = Object.entries(rawValues);
      if (entries.length > 50) throw new InputValidationError([{ field: "values", code: "TOO_MANY_ITEMS" }]);
      return Object.fromEntries(entries.map(([key, value]) => {
        if (!safeCaseDataKey.test(key) || unsafeCaseDataKeys.has(key)) {
          throw new InputValidationError([{ field: `values.${key}`, code: "INVALID_VALUE" }]);
        }
        if (typeof value !== "string") throw new InputValidationError([{ field: `values.${key}`, code: "INVALID_TYPE" }]);
        if (value.length > 2_000) throw new InputValidationError([{ field: `values.${key}`, code: "TOO_LONG" }]);
        return [key, value];
      }));
    });
    return { values };
  });
}

export function parseServiceFlowSessionRewindInput(payload: unknown): ServiceFlowSessionRewindInput {
  return parseObjectPayload(payload ?? {}, (input) => {
    const strategy = optionalEnum(input, "strategy", rewindStrategies);
    if (!strategy) throw new InputValidationError([{ field: "strategy", code: "INVALID_VALUE" }]);
    return { strategy };
  });
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
            where: isManager(actor) ? undefined : { script: { status: "VALIDATED" } },
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
  return { items: flows.map((flow) => formatFlow(flow, isManager(actor))), canManage: isManager(actor) };
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
    graph: flow.draftGraphJson ? JSON.parse(flow.draftGraphJson) : null,
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

function linearGraph(flow: Awaited<ReturnType<typeof getRawFlowForRevision>>): ServiceFlowGraphInput {
  const nodes: FlowNodeDefinition[] = [
    { key: "start", type: "START", title: "Inicio", requiredFacts: [], optionalFacts: [], scripts: [], allowedCapabilities: [], forbiddenCapabilities: [], autoAdvance: true, riskLevel: "LOW", terminal: false },
    ...flow.steps.map((step) => ({
      key: `step:${step.id}`, type: step.kind === "DECISION" || step.kind === "YES_NO" ? "DECISION" as const : "CHECK" as const,
      title: step.title, operatorInstruction: step.body ?? undefined, requiredFacts: [], optionalFacts: [],
      scripts: step.scripts.map((link) => ({ scriptId: link.script.id, label: link.script.title })), allowedCapabilities: [], forbiddenCapabilities: [],
      autoAdvance: false, riskLevel: "LOW" as const, terminal: false
    })),
    { key: "end", type: "END", title: "Fim", requiredFacts: [], optionalFacts: [], scripts: [], allowedCapabilities: [], forbiddenCapabilities: [], autoAdvance: false, riskLevel: "LOW", terminal: true }
  ];
  return { nodes, transitions: nodes.slice(0, -1).map((node, index) => ({ fromNodeKey: node.key, toNodeKey: nodes[index + 1].key, label: "Continuar", order: index, requiresUserChoice: node.type === "DECISION" })) };
}

async function createPublishedVersion(prisma: PrismaClient, actor: CurrentUser, flowId: string, options: { graph?: ServiceFlowGraphInput; restoredFromId?: string } = {}) {
  const flow = await getRawFlowForRevision(prisma, actor, flowId);
  const graph = options.graph ?? (flow.draftGraphJson ? JSON.parse(flow.draftGraphJson) as ServiceFlowGraphInput : linearGraph(flow));
  const validation = validateFlowGraph(graph.nodes, graph.transitions);
  if (!validation.valid) throw new ServiceFlowError("INVALID_INPUT");
  const existing = await prisma.serviceFlowVersion.findUnique({ where: { flowId_version: { flowId, version: flow.version } } });
  if (existing) return existing;
  return prisma.$transaction(async (tx) => {
    const version = await tx.serviceFlowVersion.create({ data: {
      organizationId: actor.organizationId, flowId, version: flow.version, title: flow.title, summary: flow.summary,
      content: flow.content, tagsJson: flow.tagsJson, graphJson: JSON.stringify(graph), publishedById: actor.id, publishedAt: flow.publishedAt ?? new Date(),
      restoredFromId: options.restoredFromId
    } });
    const nodeIds = new Map<string, string>();
    for (const [order, node] of graph.nodes.entries()) {
      const created = await tx.serviceFlowNode.create({ data: {
        organizationId: actor.organizationId, versionId: version.id, key: node.key, type: node.type, title: node.title,
        operatorInstruction: node.operatorInstruction, requiredFactsJson: JSON.stringify(node.requiredFacts), optionalFactsJson: JSON.stringify(node.optionalFacts),
        scriptsJson: JSON.stringify(node.scripts), allowedCapabilitiesJson: JSON.stringify(node.allowedCapabilities), forbiddenCapabilitiesJson: JSON.stringify(node.forbiddenCapabilities),
        autoAdvance: node.autoAdvance, riskLevel: node.riskLevel, terminal: node.terminal, message: node.message,
        dependenciesJson: node.dependencies ? JSON.stringify(node.dependencies) : null, order
      } });
      nodeIds.set(node.key, created.id);
    }
    for (const edge of graph.transitions) await tx.serviceFlowTransition.create({ data: {
      organizationId: actor.organizationId, versionId: version.id, fromNodeId: nodeIds.get(edge.fromNodeKey)!, toNodeId: nodeIds.get(edge.toNodeKey)!,
      label: edge.label, order: edge.order, conditionJson: edge.condition ? JSON.stringify(edge.condition) : null,
      requiresUserChoice: edge.requiresUserChoice, allowLoop: edge.allowLoop ?? false
    } });
    return version;
  });
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
      draftGraphJson: input.graph ? JSON.stringify(input.graph) : null,
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
  if (statusValue === "PUBLISHED") await createPublishedVersion(prisma, actor, flow.id);
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
      draftGraphJson: input.graph ? JSON.stringify(input.graph) : undefined,
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
  if (nextStatus === "PUBLISHED") await createPublishedVersion(prisma, actor, flow.id);
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
            where: isManager(actor) ? undefined : { script: { status: "VALIDATED" } },
            orderBy: { order: "asc" },
            include: { script: { select: { id: true, title: true, channel: true, body: true, tagsJson: true, placeholdersJson: true, status: true, usageCount: true } } }
          }
        }
      }
    }
  });
  if (!flow) throw new ServiceFlowError("NOT_FOUND");
  return { flow: formatFlow(flow, isManager(actor)), canManage: isManager(actor) };
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
  await createPublishedVersion(prisma, actor, flow.id);
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

export async function restoreServiceFlowVersion(prisma: PrismaClient, actor: CurrentUser, flowId: string, versionId: string, comment: string) {
  ensureManager(actor);
  if (!comment.trim()) throw new ServiceFlowError("INVALID_INPUT");
  const [current, source] = await Promise.all([
    prisma.serviceFlow.findFirst({ where: { id: flowId, organizationId: actor.organizationId } }),
    prisma.serviceFlowVersion.findFirst({ where: { id: versionId, flowId, organizationId: actor.organizationId }, include: {
      nodes: { orderBy: { order: "asc" } }, transitions: { orderBy: { order: "asc" }, include: { fromNode: { select: { key: true } }, toNode: { select: { key: true } } } }
    } })
  ]);
  if (!current || !source) throw new ServiceFlowError("NOT_FOUND");
  const graph: ServiceFlowGraphInput = {
    nodes: source.nodes.map((node) => ({ key: node.key, type: node.type as FlowNodeDefinition["type"], title: node.title,
      operatorInstruction: node.operatorInstruction ?? undefined, requiredFacts: JSON.parse(node.requiredFactsJson), optionalFacts: JSON.parse(node.optionalFactsJson),
      scripts: JSON.parse(node.scriptsJson), allowedCapabilities: JSON.parse(node.allowedCapabilitiesJson), forbiddenCapabilities: JSON.parse(node.forbiddenCapabilitiesJson),
      autoAdvance: node.autoAdvance, riskLevel: node.riskLevel as FlowNodeDefinition["riskLevel"], terminal: node.terminal,
      message: node.message ?? undefined, dependencies: node.dependenciesJson ? JSON.parse(node.dependenciesJson) : undefined })),
    transitions: source.transitions.map((edge) => ({ fromNodeKey: edge.fromNode.key, toNodeKey: edge.toNode.key, label: edge.label, order: edge.order,
      condition: edge.conditionJson ? JSON.parse(edge.conditionJson) : undefined, requiresUserChoice: edge.requiresUserChoice, allowLoop: edge.allowLoop }))
  };
  const restored = await prisma.serviceFlow.update({ where: { id: current.id }, data: { title: source.title, summary: source.summary, content: source.content,
    tagsJson: source.tagsJson, draftGraphJson: JSON.stringify(graph), status: "PUBLISHED", version: current.version + 1, updatedById: actor.id, publishedAt: new Date() } });
  await createFlowRevision(prisma, actor, flowId, comment);
  const published = await createPublishedVersion(prisma, actor, flowId, { graph, restoredFromId: source.id });
  await recordAuditLog(prisma, { organizationId: actor.organizationId, actorId: actor.id, action: "service_flow.restore", entityType: "ServiceFlow", entityId: flowId,
    metadata: { restoredFromVersionId: source.id, restoredFromVersion: source.version, versionId: published.id, version: restored.version, comment } });
  return getServiceFlow(prisma, actor, flowId);
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
  const stepIds = [...new Set(stepGroups.map((item) => item.stepId).filter((id): id is string => id !== null))];
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
      .map((item) => ({ stepId: item.stepId, stepTitle: item.stepId ? stepById.get(item.stepId)?.title ?? "Etapa versionada" : "Etapa versionada", flowTitle: flowById.get(item.stepId ? stepById.get(item.stepId)?.flowId ?? "" : "")?.title ?? "Fluxo", status: item.status, count: item._count._all }))
      .sort((left, right) => right.count - left.count)
      .slice(0, 6),
    topScriptsByFlow: [...scriptCopies.values()].sort((left, right) => right.count - left.count).slice(0, 6),
    zeroSearches: zeroSearches.map((item) => ({ id: item.id, query: item.query, filtersJson: item.filtersJson, createdAt: item.createdAt }))
  };
}

export async function createServiceFlowSession(prisma: PrismaClient, actor: CurrentUser, flowIdOrSlug: string) {
  const { flow } = await getServiceFlow(prisma, actor, flowIdOrSlug);
  const version = await prisma.serviceFlowVersion.findFirst({
    where: { flowId: flow.id, organizationId: actor.organizationId }, orderBy: { version: "desc" },
    include: {
      nodes: { orderBy: { order: "asc" } },
      transitions: {
        orderBy: { order: "asc" },
        include: { fromNode: { select: { key: true } }, toNode: true }
      }
    }
  });
  const startNode = version?.nodes.find((node) => node.type === "START");
  const versionTransitions = version?.transitions ?? [];
  const startTransition = startNode
    ? versionTransitions.find((transition) => transition.fromNode.key === startNode.key)
    : undefined;
  const versionNodes = version
    ? versionTransitions.length && startNode
      ? [startNode, ...(startTransition ? [startTransition.toNode] : [])]
      : version.nodes
    : [];
  const session = await prisma.serviceFlowSession.create({
    data: {
      organizationId: actor.organizationId,
      flowId: flow.id,
      versionId: version?.id,
      userId: actor.id,
      status: "OPEN",
      steps: {
        create: version ? versionNodes.map((node, index) => ({
          organizationId: actor.organizationId, nodeKey: node.key, nodeSnapshotJson: JSON.stringify(node), visitOrder: index,
          status: node.type === "START" ? "DONE" : "PENDING"
        })) : flow.steps.map((step, index) => ({
          organizationId: actor.organizationId,
          stepId: step.id,
          nodeKey: `legacy:${step.id}`,
          nodeSnapshotJson: JSON.stringify({ key: `legacy:${step.id}`, title: step.title, order: step.order, required: step.required }),
          visitOrder: index,
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
    metadata: { flowId: flow.id, versionId: version?.id ?? null, version: version?.version ?? flow.version, slug: flow.slug }
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
  if (session.status !== "OPEN") throw new ServiceFlowError("INVALID_INPUT");
  const step = await prisma.serviceFlowSessionStep.findFirst({
    where: { sessionId, organizationId: actor.organizationId, OR: [{ stepId }, { nodeKey: stepId }] },
    include: { step: { select: { title: true } } }
  });
  if (!step) throw new ServiceFlowError("NOT_FOUND");
  const nextStatus = input.status ?? step.status;
  const snapshot = nodeSnapshotFromJson(step.nodeSnapshotJson);
  if (session.versionId && nextStatus === "SKIPPED") {
    throw new ServiceFlowError("INVALID_INPUT");
  }
  if (session.versionId && nextStatus === "DONE") {
    const caseData = caseDataFromJson(session.caseDataJson);
    const missingFieldKeys = snapshot.requiredFacts.filter((key) => !caseData[key]?.trim());
    if (missingFieldKeys.length) throw new ServiceFlowError("MISSING_REQUIRED_FACTS", missingFieldKeys);
  }
  const outgoing = session.versionId && step.nodeKey && (nextStatus === "DONE" || nextStatus === "SKIPPED")
    ? await prisma.serviceFlowTransition.findMany({
      where: { versionId: session.versionId, fromNode: { key: step.nodeKey } },
      orderBy: { order: "asc" },
      include: { toNode: true }
    })
    : [];
  const normalizedDecision = input.decision?.trim().toLocaleLowerCase();
  const requiresChoice = outgoing.length > 1 || outgoing.some((transition) => transition.requiresUserChoice);
  const selectedTransition = requiresChoice
    ? outgoing.find((transition) => transition.label.toLocaleLowerCase() === normalizedDecision)
    : outgoing[0];
  if (requiresChoice && !selectedTransition) throw new ServiceFlowError("INVALID_INPUT");
  let followingStep: { id: string; nodeKey: string | null } | null = null;
  let loopTarget: { id: string; nodeKey: string | null } | null = null;
  if (selectedTransition) {
    if (selectedTransition.allowLoop) {
      loopTarget = await prisma.serviceFlowSessionStep.findFirst({
        where: { sessionId: session.id, organizationId: actor.organizationId, nodeKey: selectedTransition.toNode.key },
        select: { id: true, nodeKey: true }
      });
    } else {
      followingStep = await prisma.serviceFlowSessionStep.findFirst({
        where: { sessionId: session.id, organizationId: actor.organizationId, visitOrder: { gt: step.visitOrder } },
        orderBy: { visitOrder: "asc" },
        select: { id: true, nodeKey: true }
      });
      if (followingStep && followingStep.nodeKey !== selectedTransition.toNode.key) throw new ServiceFlowError("INVALID_INPUT");
      if (!followingStep) {
        const previouslyMaterialized = await prisma.serviceFlowSessionStep.findFirst({
          where: { sessionId: session.id, organizationId: actor.organizationId, nodeKey: selectedTransition.toNode.key },
          select: { id: true, nodeKey: true }
        });
        if (previouslyMaterialized) throw new ServiceFlowError("INVALID_INPUT");
      }
    }
  }
  const completedAt = nextStatus === "DONE" || nextStatus === "SKIPPED" ? new Date() : null;
  const history = choiceHistoryFromJson(step.choiceHistoryJson);
  const updateData = {
    status: nextStatus,
    decision: input.decision,
    note: input.note,
    completedAt,
    choiceHistoryJson: selectedTransition ? JSON.stringify([...history, {
      label: selectedTransition.label,
      fromNodeKey: step.nodeKey,
      toNodeKey: selectedTransition.toNode.key,
      chosenAt: completedAt?.toISOString()
    }]) : step.choiceHistoryJson
  };
  const updated = selectedTransition
    ? await prisma.$transaction(async (tx) => {
      const current = await tx.serviceFlowSessionStep.update({ where: { id: step.id }, data: updateData });
      if (selectedTransition.allowLoop && loopTarget) {
        const visitOrder = await tx.serviceFlowSessionStep.count({ where: { sessionId: session.id } });
        await tx.serviceFlowSessionStep.update({
          where: { id: loopTarget.id },
          data: { status: "PENDING", decision: null, completedAt: null, visitOrder }
        });
      } else if (!followingStep) {
        const visitOrder = await tx.serviceFlowSessionStep.count({ where: { sessionId: session.id } });
        await tx.serviceFlowSessionStep.create({
          data: {
          organizationId: actor.organizationId,
          sessionId: session.id,
          nodeKey: selectedTransition.toNode.key,
          nodeSnapshotJson: JSON.stringify(selectedTransition.toNode),
          visitOrder,
          status: "PENDING"
          }
        });
      }
      return current;
    })
    : await prisma.serviceFlowSessionStep.update({ where: { id: step.id }, data: updateData });
  await recordAuditLog(prisma, {
    organizationId: actor.organizationId,
    actorId: actor.id,
    action: "service_flow_session.step",
    entityType: "ServiceFlowSession",
    entityId: session.id,
    metadata: {
      stepId,
      stepTitle: step.step?.title ?? step.nodeKey ?? "Etapa versionada",
      status: updated.status,
      decision: updated.decision,
      note: updated.note,
      transition: selectedTransition ? { label: selectedTransition.label, toNodeKey: selectedTransition.toNode.key } : null
    }
  });
  return getServiceFlowSession(prisma, actor, session.id);
}

export async function updateServiceFlowSessionCaseData(
  prisma: PrismaClient,
  actor: CurrentUser,
  sessionId: string,
  input: ServiceFlowSessionCaseDataInput
) {
  const session = await prisma.serviceFlowSession.findFirst({
    where: { id: sessionId, organizationId: actor.organizationId, userId: actor.id, status: "OPEN" }
  });
  if (!session) throw new ServiceFlowError("NOT_FOUND");
  const fieldNames = Object.keys(input.values).sort();
  const mergedCaseData = { ...caseDataFromJson(session.caseDataJson), ...input.values };
  if (Object.keys(mergedCaseData).length > 50) throw new ServiceFlowError("INVALID_INPUT");
  await prisma.serviceFlowSession.update({
    where: { id: session.id },
    data: { caseDataJson: JSON.stringify(mergedCaseData) }
  });
  await recordAuditLog(prisma, {
    organizationId: actor.organizationId,
    actorId: actor.id,
    action: "service_flow_session.case_data",
    entityType: "ServiceFlowSession",
    entityId: session.id,
    metadata: { operation: "MERGE", fieldNames }
  });
  return getServiceFlowSession(prisma, actor, session.id);
}

export async function rewindServiceFlowSessionStep(
  prisma: PrismaClient,
  actor: CurrentUser,
  sessionId: string,
  stepId: string,
  input: ServiceFlowSessionRewindInput
) {
  const session = await prisma.serviceFlowSession.findFirst({
    where: { id: sessionId, organizationId: actor.organizationId, userId: actor.id, status: "OPEN" }
  });
  if (!session) throw new ServiceFlowError("NOT_FOUND");
  const target = await prisma.serviceFlowSessionStep.findFirst({
    where: { sessionId: session.id, organizationId: actor.organizationId, OR: [{ stepId }, { nodeKey: stepId }] },
    include: { step: { select: { title: true } } }
  });
  if (!target) throw new ServiceFlowError("NOT_FOUND");

  const affectedCount = await prisma.$transaction(async (tx) => {
    await tx.serviceFlowSessionStep.update({ where: { id: target.id }, data: { status: "PENDING", completedAt: null } });
    if (input.strategy === "DISCARD_FOLLOWING") {
      return (await tx.serviceFlowSessionStep.deleteMany({
        where: { sessionId: session.id, organizationId: actor.organizationId, visitOrder: { gt: target.visitOrder } }
      })).count;
    }
    return (await tx.serviceFlowSessionStep.updateMany({
      where: { sessionId: session.id, organizationId: actor.organizationId, visitOrder: { gt: target.visitOrder } },
      data: { status: "RECONFIRMATION_REQUIRED", completedAt: null }
    })).count;
  });

  await recordAuditLog(prisma, {
    organizationId: actor.organizationId,
    actorId: actor.id,
    action: "service_flow_session.rewind",
    entityType: "ServiceFlowSession",
    entityId: session.id,
    metadata: { strategy: input.strategy, targetStepId: stepId, affectedCount }
  });
  return getServiceFlowSession(prisma, actor, session.id);
}

export async function completeServiceFlowSession(prisma: PrismaClient, actor: CurrentUser, sessionId: string) {
  const session = await prisma.serviceFlowSession.findFirst({ where: { id: sessionId, organizationId: actor.organizationId, userId: actor.id } });
  if (!session) throw new ServiceFlowError("NOT_FOUND");
  if (session.status !== "OPEN") throw new ServiceFlowError("INVALID_INPUT");
  const materializedSteps = await prisma.serviceFlowSessionStep.findMany({
    where: { sessionId: session.id, organizationId: actor.organizationId },
    select: { status: true, nodeKey: true, step: { select: { required: true } } }
  });
  const hasBlockingStep = materializedSteps.some((step) =>
    step.status === "RECONFIRMATION_REQUIRED"
    || (step.status === "PENDING" && (Boolean(session.versionId) || step.step?.required === true))
  );
  if (hasBlockingStep) {
    throw new ServiceFlowError("INVALID_INPUT");
  }
  if (session.versionId) {
    const completedNodes = materializedSteps.filter((step) => step.status === "DONE" && step.nodeKey);
    const terminal = completedNodes.length ? await prisma.serviceFlowNode.findFirst({
      where: { versionId: session.versionId, terminal: true, key: { in: completedNodes.flatMap((step) => step.nodeKey ?? []) } },
      select: { id: true }
    }) : null;
    if (!terminal) throw new ServiceFlowError("INVALID_INPUT");
  }
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
    version: { select: { id: true, version: true, title: true, publishedAt: true } },
    steps: {
      include: { step: { select: { id: true, title: true, order: true, required: true } } }
    }
  } satisfies Prisma.ServiceFlowSessionInclude;
}

function nodeSnapshotFromJson(value: string | null | undefined): {
  title?: string;
  type?: string;
  required: boolean;
  requiredFacts: string[];
} {
  if (!value) return { required: false, requiredFacts: [] };
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    let requiredFacts: string[] = [];
    if (Array.isArray(parsed.requiredFacts)) {
      requiredFacts = parsed.requiredFacts.filter((key): key is string => typeof key === "string");
    } else if (typeof parsed.requiredFactsJson === "string") {
      try {
        const parsedFacts = JSON.parse(parsed.requiredFactsJson) as unknown;
        if (Array.isArray(parsedFacts)) requiredFacts = parsedFacts.filter((key): key is string => typeof key === "string");
      } catch {
        requiredFacts = [];
      }
    }
    return {
      title: typeof parsed.title === "string" ? parsed.title : undefined,
      type: typeof parsed.type === "string" ? parsed.type : undefined,
      required: parsed.required === true,
      requiredFacts
    };
  } catch {
    return { required: false, requiredFacts: [] };
  }
}

function formatSession<T extends {
  caseDataJson?: string | null;
  flow?: { title?: string };
  steps?: Array<{
    visitOrder?: number;
    status?: string;
    decision?: string | null;
    note?: string | null;
    nodeKey?: string | null;
    nodeSnapshotJson?: string | null;
    step?: { order: number; title?: string } | null;
  }>;
}>(session: T) {
  const { caseDataJson, ...publicSession } = session;
  const steps = [...(session.steps ?? [])].sort((left, right) => (left.visitOrder ?? left.step?.order ?? 0) - (right.visitOrder ?? right.step?.order ?? 0));
  const lines = steps.flatMap((step) => {
    if (step.status !== "DONE" && step.status !== "SKIPPED") return [];
    const decision = step.decision?.trim();
    const note = step.note?.trim();
    if (!decision && !note) return [];
    const title = step.step?.title ?? nodeSnapshotFromJson(step.nodeSnapshotJson).title ?? step.nodeKey ?? "Etapa";
    const details = [decision ? `Decisao: ${decision}` : null, note ? `Nota: ${note}` : null].filter(Boolean);
    return [`- ${title} — ${details.join(" · ")}`];
  });
  const reportTitle = session.flow?.title ? `Atendimento - ${session.flow.title}` : "Atendimento";
  return {
    ...publicSession,
    caseData: caseDataFromJson(caseDataJson),
    steps,
    report: [reportTitle, ...lines].join("\n")
  };
}
