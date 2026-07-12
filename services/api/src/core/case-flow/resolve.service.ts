import type { PrismaClient } from "@prisma/client";
import type { CurrentUser } from "@alwaystrack/shared";
import { recordAuditLog } from "../audit/audit.service.js";
import { parseCaseFlowJson } from "./persistence.js";
import { evaluateHeuristics } from "./heuristics/engine.js";
import type { HeuristicRule } from "./heuristics/rules.js";
import { applyLowConfidenceTriage } from "./heuristics/triage.js";

export class CaseFlowResolveError extends Error {
  constructor(public readonly code: "NOT_FOUND") { super(code); }
}

const rule = (code: string, flowId: string, weight: number, conditions: HeuristicRule["conditions"], extra: Partial<HeuristicRule> = {}): HeuristicRule => ({
  id: code, code, version: 1, active: true, priority: 10, flowId, weight, hardMatch: false,
  conditions, exclusions: [], requiredFacts: [], producedTags: [], riskEffects: [], ...extra
});

export const defaultCaseFlowRules: readonly HeuristicRule[] = [
  rule("ORDER_POSITION_TEXT", "ORDER_POSITION", 6, [{ operator: "regex", factKey: "text.normalized", value: "(onde|status|rastreio|acompanhar).{0,30}(pedido|entrega)|pedido.{0,30}(onde|status)" }], { requiredFacts: ["order.primaryId", "logistics.status"] }),
  rule("ORDER_POSITION_STATUS", "ORDER_POSITION", 8, [{ operator: "exists", factKey: "logistics.status" }]),
  rule("DELIVERY_DENIED", "UNRECOGNIZED_DELIVERY", 6, [{ operator: "regex", factKey: "text.normalized", value: "nao (recebi|reconheco)|nunca recebi" }], { requiredFacts: ["logistics.status", "logistics.receiver"] }),
  rule("DELIVERED_STATUS", "UNRECOGNIZED_DELIVERY", 8, [{ operator: "equals", factKey: "logistics.status", value: "DELIVERED" }], { requiredFacts: ["logistics.receiver"] }),
  rule("EVIDENCE_CONFLICT", "EVIDENCE_REVIEW", 5, [{ operator: "conflictExists" }], { producedTags: ["OPEN_CONFLICT"] }),
  rule("MONEY_TEXT", "FINANCIAL_TREATMENT", 5, [{ operator: "regex", factKey: "text.normalized", value: "estorno|reembolso|cobranca|dinheiro" }], { requiredFacts: ["payment.status"] }),
  rule("MONEY_STATUS", "FINANCIAL_TREATMENT", 8, [{ operator: "exists", factKey: "payment.status" }]),
  rule("MONEY_GATE", "FINANCIAL_TREATMENT", 1, [{ operator: "regex", factKey: "text.normalized", value: "estorno|cobranca indevida|dinheiro" }], { hardMatch: true, priority: 100, riskEffects: [{ category: "MONEY", level: "HIGH", gateFlowId: "FINANCIAL_REVIEW_GATE" }] }),
  rule("HEALTH_GATE", "HEALTH_ESCALATION", 1, [{ operator: "regex", factKey: "text.normalized", value: "alergia|reacao adversa|passando mal" }], { hardMatch: true, priority: 200, riskEffects: [{ category: "ADVERSE_REACTION", level: "CRITICAL", gateFlowId: "HEALTH_SAFETY_GATE" }] }),
  rule("FRAUD_GATE", "FRAUD_REVIEW", 1, [{ operator: "regex", factKey: "text.normalized", value: "fraude|nao reconheco (a compra|essa compra|o pedido)" }], { hardMatch: true, priority: 200, riskEffects: [{ category: "FRAUD", level: "CRITICAL", gateFlowId: "SECURITY_GATE" }] })
];

export async function resolveCase(prisma: PrismaClient, actor: CurrentUser, caseId: string, options: { rules?: readonly HeuristicRule[]; now?: Date } = {}) {
  const serviceCase = await prisma.serviceCase.findFirst({ where: { id: caseId, organizationId: actor.organizationId } });
  if (!serviceCase) throw new CaseFlowResolveError("NOT_FOUND");
  const [facts, conflicts] = await Promise.all([
    prisma.evidenceFact.findMany({ where: { caseId, organizationId: actor.organizationId }, orderBy: [{ key: "asc" }, { observedAt: "desc" }] }),
    prisma.evidenceConflict.findMany({ where: { caseId, organizationId: actor.organizationId }, orderBy: { createdAt: "asc" } })
  ]);
  const intent = facts.find((fact) => fact.key === "conversation.intentText");
  const text = intent ? String(parseCaseFlowJson(intent.normalizedValueJson)) : serviceCase.summary ?? "";
  const result = applyLowConfidenceTriage(evaluateHeuristics(options.rules ?? defaultCaseFlowRules, {
    text,
    now: options.now,
    facts: facts.map((fact) => ({ id: fact.id, key: fact.key, normalizedValue: parseCaseFlowJson(fact.normalizedValueJson), sourceSystem: fact.sourceSystem, observedAt: fact.observedAt })),
    conflicts: conflicts.map((conflict) => ({ key: conflict.key, status: conflict.status === "OPEN" ? "OPEN" as const : "RESOLVED" as const }))
  }));
  await recordAuditLog(prisma, {
    organizationId: actor.organizationId, actorId: actor.id, action: "case_flow.case.resolved", entityType: "CaseFlowCandidate", entityId: caseId,
    metadata: { ruleVersions: [...new Set((options.rules ?? defaultCaseFlowRules).map((item) => `${item.code}@${item.version}`))], primary: result.primary, secondary: result.secondary, riskGates: result.riskGates, lowConfidence: result.lowConfidence }
  });
  return result;
}
