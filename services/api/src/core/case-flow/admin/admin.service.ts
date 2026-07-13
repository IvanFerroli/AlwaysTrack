import { createHash, randomUUID } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import type { CurrentUser } from "@alwaystrack/shared";
import { parseCaseFlowJson, stringifyCaseFlowJson, type ControlledJsonValue } from "../persistence.js";
import { validateHeuristicRule, type HeuristicRule } from "../heuristics/rules.js";

export class CaseFlowAdminError extends Error {
  constructor(public readonly code: "FORBIDDEN" | "INVALID_INPUT" | "NOT_FOUND" | "CONFLICT") { super(code); }
}

type Db = PrismaClient;
const sensitiveKey = /password|passwd|secret|token|cookie|authorization|session|credential/i;
const allowedHealthStates = ["HEALTHY", "DEGRADED", "UNAVAILABLE"] as const;

function admin(actor: CurrentUser) { if (actor.role !== "ADMIN") throw new CaseFlowAdminError("FORBIDDEN"); }
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new CaseFlowAdminError("INVALID_INPUT");
  return value as Record<string, unknown>;
}
function assertNoSecrets(value: unknown, path = "$"): void {
  if (Array.isArray(value)) return value.forEach((item, index) => assertNoSecrets(item, `${path}[${index}]`));
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    if (sensitiveKey.test(key)) throw new CaseFlowAdminError("INVALID_INPUT");
    assertNoSecrets(child, `${path}.${key}`);
  }
}
function parseMetadata(value: string | null) { try { return value ? object(JSON.parse(value)) : {}; } catch { return {}; } }
function auditData(actor: CurrentUser, action: string, entityType: string, entityId: string, metadata: unknown) {
  return { organizationId: actor.organizationId, actorId: actor.id, action, entityType, entityId, metadataJson: JSON.stringify(metadata) };
}

export async function listAdminCases(db: Db, actor: CurrentUser, input: { status?: string; page?: number; pageSize?: number } = {}) {
  admin(actor);
  const page = Math.max(input.page ?? 1, 1), pageSize = Math.min(Math.max(input.pageSize ?? 25, 1), 100);
  const where = { organizationId: actor.organizationId, status: input.status || undefined };
  const [items, total] = await db.$transaction([
    db.serviceCase.findMany({ where, include: { createdBy: { select: { id: true, name: true } }, sources: { select: { kind: true, observedAt: true } }, conflicts: { select: { id: true, status: true } }, connectorRuns: { select: { id: true, status: true, startedAt: true, finishedAt: true } } }, orderBy: { updatedAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize }),
    db.serviceCase.count({ where })
  ]);
  return { items: items.map((item) => ({ ...item, summary: item.summary?.slice(0, 240) ?? null })), total, page, pageSize };
}

export async function getAdminCase(db: Db, actor: CurrentUser, caseId: string) {
  admin(actor);
  const item = await db.serviceCase.findFirst({ where: { id: caseId, organizationId: actor.organizationId }, include: { sources: true, conflicts: true, connectorRuns: { include: { connectorDefinition: { select: { connectorId: true, displayName: true, version: true } } } }, evidenceFacts: true } });
  if (!item) throw new CaseFlowAdminError("NOT_FOUND");
  const audit = await db.auditLog.findMany({ where: { organizationId: actor.organizationId, metadataJson: { contains: caseId } }, orderBy: { createdAt: "desc" }, take: 100 });
  return { ...item, evidenceFacts: item.evidenceFacts.map((fact) => ({ ...fact, valueJson: fact.sensitivity === "PUBLIC" || fact.sensitivity === "INTERNAL" ? fact.valueJson : '"[redacted]"', normalizedValueJson: fact.sensitivity === "PUBLIC" || fact.sensitivity === "INTERNAL" ? fact.normalizedValueJson : '"[redacted]"' })), audit };
}

export async function listHeuristicRules(db: Db, actor: CurrentUser) {
  admin(actor);
  const events = await db.auditLog.findMany({ where: { organizationId: actor.organizationId, entityType: "CaseFlowHeuristicRule", action: { in: ["case_flow.heuristic_rule.version_created", "case_flow.heuristic_rule.restore_version_created"] } }, orderBy: { createdAt: "asc" } });
  const versions: Array<Record<string, unknown> & { auditId: string; createdAt: Date; actorId: string | null }> = events.map((event) => ({ ...object(parseMetadata(event.metadataJson).rule), auditId: event.id, createdAt: event.createdAt, actorId: event.actorId }));
  const latest = [...versions].reverse().filter((rule, index, all) => all.findIndex((candidate) => candidate.code === rule.code) === index);
  const feedback = await db.auditLog.findMany({ where: { organizationId: actor.organizationId, entityType: "CaseFlowHumanOverride", action: "case_flow.override.flow_classification.created" }, orderBy: { createdAt: "desc" }, take: 100 });
  return { latest, versions: versions.reverse(), feedback: feedback.map((event) => ({ id: event.id, createdAt: event.createdAt, ...parseMetadata(event.metadataJson) })) };
}

export async function createHeuristicRuleVersion(db: Db, actor: CurrentUser, value: unknown) {
  admin(actor); assertNoSecrets(value);
  const rule = validateHeuristicRule(object(value) as HeuristicRule);
  return db.$transaction(async (tx) => {
    const previous = await tx.auditLog.findMany({ where: { organizationId: actor.organizationId, entityType: "CaseFlowHeuristicRule", action: "case_flow.heuristic_rule.version_created" }, orderBy: { createdAt: "desc" } });
    const sameCode = previous.map((event) => parseMetadata(event.metadataJson).rule).filter((item) => item && object(item).code === rule.code).map((item) => Number(object(item).version));
    if (sameCode.some((version) => version >= rule.version)) throw new CaseFlowAdminError("CONFLICT");
    const id = randomUUID();
    await tx.auditLog.create({ data: auditData(actor, "case_flow.heuristic_rule.version_created", "CaseFlowHeuristicRule", id, { rule }) });
    return { id, rule };
  });
}

export async function listConnectorAdmin(db: Db, actor: CurrentUser) {
  admin(actor);
  const items = await db.connectorDefinition.findMany({ where: { organizationId: actor.organizationId }, include: { healthEvents: { orderBy: { checkedAt: "desc" }, take: 1 } }, orderBy: { displayName: "asc" } });
  return items.map((item) => ({ ...item, domains: parseCaseFlowJson(item.domainsJson), capabilities: parseCaseFlowJson(item.capabilitiesJson), forbiddenActions: parseCaseFlowJson(item.forbiddenActionsJson), searchKeys: parseCaseFlowJson(item.searchKeysJson), extractedFields: parseCaseFlowJson(item.extractedFieldsJson), health: item.healthEvents[0] ?? null }));
}

export async function updateConnectorAdmin(db: Db, actor: CurrentUser, connectorId: string, value: unknown) {
  admin(actor); assertNoSecrets(value); const input = object(value);
  const state = input.healthState === undefined ? undefined : String(input.healthState);
  if (state && !allowedHealthStates.includes(state as never)) throw new CaseFlowAdminError("INVALID_INPUT");
  const current = await db.connectorDefinition.findFirst({ where: { id: connectorId, organizationId: actor.organizationId } });
  if (!current) throw new CaseFlowAdminError("NOT_FOUND");
  const array = (key: string, kind: Parameters<typeof stringifyCaseFlowJson>[0]) => input[key] === undefined ? undefined : stringifyCaseFlowJson(kind, input[key] as ControlledJsonValue);
  return db.$transaction(async (tx) => {
    const updated = await tx.connectorDefinition.update({ where: { id: current.id }, data: { enabled: typeof input.enabled === "boolean" ? input.enabled : undefined, riskLevel: typeof input.riskLevel === "string" ? input.riskLevel : undefined, domainsJson: array("domains", "CONNECTOR_DOMAINS"), capabilitiesJson: array("capabilities", "CONNECTOR_CAPABILITIES"), forbiddenActionsJson: array("forbiddenActions", "CONNECTOR_FORBIDDEN_ACTIONS"), searchKeysJson: array("searchKeys", "CONNECTOR_SEARCH_KEYS"), extractedFieldsJson: array("extractedFields", "CONNECTOR_EXTRACTED_FIELDS"), lastValidatedAt: input.validated === true ? new Date() : undefined } });
    if (state) await tx.connectorHealthEvent.create({ data: { organizationId: actor.organizationId, connectorDefinitionId: current.id, state, connectorVersion: current.version, selectorVersion: current.selectorVersion, eventCode: "ADMIN_DECLARATIVE_STATUS", checkedAt: new Date() } });
    await tx.auditLog.create({ data: auditData(actor, "case_flow.connector.config_updated", "ConnectorDefinition", current.id, { changedKeys: Object.keys(input), healthState: state }) });
    return updated;
  });
}

export async function exportCaseFlowConfig(db: Db, actor: CurrentUser) {
  admin(actor);
  const [flows, connectors, ruleData] = await Promise.all([
    db.serviceFlow.findMany({ where: { organizationId: actor.organizationId }, include: { versions: { orderBy: { version: "asc" } } }, orderBy: { slug: "asc" } }),
    db.connectorDefinition.findMany({ where: { organizationId: actor.organizationId }, orderBy: { connectorId: "asc" } }),
    listHeuristicRules(db, actor)
  ]);
  const payload = { format: "alwaystrack-caseflow-config", formatVersion: 1, exportedAt: new Date().toISOString(), organizationRef: createHash("sha256").update(actor.organizationId).digest("hex").slice(0, 16), flows: flows.map(({ versions, ...flow }) => ({ slug: flow.slug, title: flow.title, summary: flow.summary, priority: flow.priority, versions: versions.map(({ id: _id, organizationId: _organizationId, flowId: _flowId, publishedById: _publishedById, ...version }) => version) })), connectors: connectors.map(({ id: _id, organizationId: _organizationId, ...connector }) => connector), heuristicRules: ruleData.versions.map(({ auditId: _auditId, createdAt: _createdAt, actorId: _actorId, ...rule }) => rule) };
  assertNoSecrets(payload);
  return { payload, checksum: createHash("sha256").update(JSON.stringify(payload)).digest("hex") };
}

export async function restoreCaseFlowConfig(db: Db, actor: CurrentUser, value: unknown) {
  admin(actor); assertNoSecrets(value); const envelope = object(value), payload = object(envelope.payload);
  if (payload.format !== "alwaystrack-caseflow-config" || payload.formatVersion !== 1 || !Array.isArray(payload.flows) || !Array.isArray(payload.connectors) || !Array.isArray(payload.heuristicRules)) throw new CaseFlowAdminError("INVALID_INPUT");
  const checksum = createHash("sha256").update(JSON.stringify(payload)).digest("hex");
  if (envelope.checksum !== checksum) throw new CaseFlowAdminError("INVALID_INPUT");
  const flows = payload.flows as unknown[], connectors = payload.connectors as unknown[], heuristicRules = payload.heuristicRules as unknown[];
  return db.$transaction(async (tx) => {
    const restoreId = randomUUID(); let flowVersions = 0, connectorVersions = 0, ruleVersions = 0;
    for (const raw of flows) {
      const source = object(raw); const slug = String(source.slug ?? "");
      const flow = await tx.serviceFlow.findFirst({ where: { organizationId: actor.organizationId, slug } });
      if (!flow || !Array.isArray(source.versions)) continue;
      let next = (await tx.serviceFlowVersion.findFirst({ where: { flowId: flow.id }, orderBy: { version: "desc" }, select: { version: true } }))?.version ?? 0;
      for (const rawVersion of source.versions) { const version = object(rawVersion); await tx.serviceFlowVersion.create({ data: { organizationId: actor.organizationId, flowId: flow.id, version: ++next, title: String(version.title ?? flow.title), summary: typeof version.summary === "string" ? version.summary : null, content: typeof version.content === "string" ? version.content : null, tagsJson: typeof version.tagsJson === "string" ? version.tagsJson : null, graphJson: String(version.graphJson ?? "{}"), publishedById: actor.id } }); flowVersions++; }
    }
    for (const raw of connectors) { const source = object(raw), connectorId = String(source.connectorId ?? ""); const current = await tx.connectorDefinition.findFirst({ where: { organizationId: actor.organizationId, connectorId } }); if (!current) continue; await tx.auditLog.create({ data: auditData(actor, "case_flow.connector.restore_version_created", "ConnectorDefinition", current.id, { restoreId, source }) }); connectorVersions++; }
    for (const raw of heuristicRules) { const rule = validateHeuristicRule(raw as HeuristicRule); await tx.auditLog.create({ data: auditData(actor, "case_flow.heuristic_rule.restore_version_created", "CaseFlowHeuristicRule", randomUUID(), { restoreId, rule }) }); ruleVersions++; }
    await tx.auditLog.create({ data: auditData(actor, "case_flow.config.restore_completed", "CaseFlowConfigRestore", restoreId, { checksum, flowVersions, connectorVersions, ruleVersions }) });
    return { restoreId, checksum, flowVersions, connectorVersions, ruleVersions, mode: "ADDITIVE" as const };
  });
}
