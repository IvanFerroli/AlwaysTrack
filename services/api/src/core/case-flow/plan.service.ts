import { createHash } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import type { CaseFlowPlan, CaseFlowPlanResponse, CurrentUser, FlowNodeDefinition, FlowTransitionDefinition, ServiceFlowVersionDefinition } from "@alwaystrack/shared";
import { recordAuditLog } from "../audit/audit.service.js";
import { compileCaseFlowPlan } from "./plan-compiler.js";

export class CaseFlowPlanError extends Error {
  constructor(public readonly code: "NOT_FOUND" | "NOT_RESOLVED") { super(code); }
}

type PlanDb = Pick<PrismaClient, "serviceCase" | "serviceFlow" | "serviceFlowVersion" | "auditLog">;
type Candidate = { flowId: string; reasons?: string[] };
type Resolution = { primary?: Candidate | null; secondary?: Candidate[]; riskGates?: Candidate[] };

function json<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try { return JSON.parse(value) as T; } catch { return fallback; }
}

function definition(version: any, role: ServiceFlowVersionDefinition["role"], reason?: string): ServiceFlowVersionDefinition {
  const keys = new Map<string, string>(version.nodes.map((node: any) => [node.id, node.key]));
  return {
    flowId: version.flowId, versionId: version.id, version: version.version, role, reason,
    nodes: version.nodes.map((node: any): FlowNodeDefinition => ({
      key: node.key, type: node.type, title: node.title, operatorInstruction: node.operatorInstruction ?? undefined,
      requiredFacts: json(node.requiredFactsJson, []), optionalFacts: json(node.optionalFactsJson, []), scripts: json(node.scriptsJson, []),
      allowedCapabilities: json(node.allowedCapabilitiesJson, []), forbiddenCapabilities: json(node.forbiddenCapabilitiesJson, []),
      autoAdvance: node.autoAdvance, riskLevel: node.riskLevel, terminal: node.terminal, message: node.message ?? undefined,
      dependencies: json(node.dependenciesJson, [])
    })),
    transitions: version.transitions.map((edge: any): FlowTransitionDefinition => ({
      fromNodeKey: keys.get(edge.fromNodeId) ?? "", toNodeKey: keys.get(edge.toNodeId) ?? "", label: edge.label,
      order: edge.order, condition: json(edge.conditionJson, undefined), requiresUserChoice: edge.requiresUserChoice, allowLoop: edge.allowLoop
    }))
  };
}

function fingerprint(plan: CaseFlowPlan) {
  return createHash("sha256").update(JSON.stringify({ ...plan, revision: 0 })).digest("hex");
}

const canonicalFlowId = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "");

export async function getCaseFlowPlan(db: PlanDb, actor: CurrentUser, caseId: string): Promise<CaseFlowPlanResponse> {
  const serviceCase = await db.serviceCase.findFirst({ where: { id: caseId, organizationId: actor.organizationId } });
  if (!serviceCase) throw new CaseFlowPlanError("NOT_FOUND");
  const resolved = await db.auditLog.findFirst({ where: { organizationId: actor.organizationId, entityId: caseId, action: "case_flow.case.resolved" }, orderBy: { createdAt: "desc" } });
  if (!resolved?.metadataJson) throw new CaseFlowPlanError("NOT_RESOLVED");
  const resolution = json<Resolution>(resolved.metadataJson, {});
  const candidates = [
    ...(resolution.primary ? [{ ...resolution.primary, role: "PRIMARY" as const }] : []),
    ...(resolution.secondary ?? []).map((item) => ({ ...item, role: "SECONDARY" as const })),
    ...(resolution.riskGates ?? []).map((item) => ({ ...item, role: "RISK_GATE" as const }))
  ];
  const ids = [...new Set(candidates.map((item) => item.flowId))];
  const publishedFlows = ids.length ? await db.serviceFlow.findMany({ where: { organizationId: actor.organizationId, status: "PUBLISHED" } }) : [];
  const candidateKeys = new Set(ids.map(canonicalFlowId));
  const flows = publishedFlows.filter((flow) => candidateKeys.has(canonicalFlowId(flow.id)) || candidateKeys.has(canonicalFlowId(flow.slug)));
  const versions = await Promise.all(flows.map((flow) => db.serviceFlowVersion.findFirst({
    where: { organizationId: actor.organizationId, flowId: flow.id }, orderBy: { version: "desc" },
    include: { nodes: { orderBy: { order: "asc" } }, transitions: { orderBy: { order: "asc" } } }
  })));
  const definitions = versions.flatMap((version) => {
    if (!version) return [];
    const flow = flows.find((item) => item.id === version.flowId);
    const candidate = candidates.find((item) => {
      const key = canonicalFlowId(item.flowId);
      return key === canonicalFlowId(version.flowId) || key === canonicalFlowId(flow?.slug ?? "");
    });
    return candidate ? [definition(version, candidate.role, candidate.reasons?.join("; "))] : [];
  });
  const compiled = compileCaseFlowPlan(definitions);
  const previous = await db.auditLog.findMany({ where: { organizationId: actor.organizationId, entityId: caseId, action: "case_flow.plan.compiled" }, orderBy: { createdAt: "asc" } });
  const digest = fingerprint(compiled);
  const last = previous.at(-1);
  const lastMetadata = json<{ fingerprint?: string; revision?: number }>(last?.metadataJson, {});
  const changed = lastMetadata.fingerprint !== digest;
  const revision = changed ? (lastMetadata.revision ?? 0) + 1 : (lastMetadata.revision ?? 1);
  const plan = { ...compiled, revision };
  if (changed) await recordAuditLog(db as PrismaClient, {
    organizationId: actor.organizationId, actorId: actor.id, action: "case_flow.plan.compiled", entityType: "CaseFlowPlan", entityId: caseId,
    metadata: { revision, fingerprint: digest, primaryFlowId: plan.primaryFlowId, sourceVersionIds: plan.nodes.flatMap((node) => node.sourceVersionIds), reasons: plan.reasons, warning: last ? "PLAN_RECOMMENDATION_CHANGED" : null }
  });
  const historyRows = changed ? [...previous, { actorId: actor.id, createdAt: new Date(), metadataJson: JSON.stringify({ revision, reasons: plan.reasons, warning: last ? "PLAN_RECOMMENDATION_CHANGED" : null }) }] : previous;
  return {
    plan, warning: changed && last ? "PLAN_RECOMMENDATION_CHANGED" : null,
    history: historyRows.map((row) => { const metadata = json<{ revision?: number; reasons?: string[]; warning?: string | null }>(row.metadataJson, {}); return { revision: metadata.revision ?? 1, changedAt: row.createdAt.toISOString(), changedBy: row.actorId, reasons: metadata.reasons ?? [], warning: metadata.warning ?? null }; }).reverse()
  };
}
