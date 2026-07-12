import { preferredFact } from "../conflicts.service.js";
import { normalizeText } from "./text.js";
import { validateHeuristicRule, type HeuristicConflict, type HeuristicFact, type HeuristicRule, type RuleCondition, type RuleContext, type RiskCategory } from "./rules.js";

export type FlowCandidate = {
  flowId: string;
  score: number;
  confidence: number;
  role: "PRIMARY" | "SECONDARY" | "RISK_GATE";
  matchedRules: string[];
  supportingFactIds: string[];
  missingFactKeys: string[];
  producedTags: string[];
  reasons: string[];
};

export type HeuristicResult = { primary: FlowCandidate | null; secondary: FlowCandidate[]; riskGates: FlowCandidate[]; candidates: FlowCandidate[] };
export type HeuristicInput = { text: string; facts?: readonly HeuristicFact[]; conflicts?: readonly HeuristicConflict[]; now?: Date };

type ConditionMatch = { matched: boolean; factIds: string[] };

function same(a: unknown, b: unknown) { return JSON.stringify(a) === JSON.stringify(b); }
function contains(actual: unknown, expected: unknown) {
  if (Array.isArray(actual)) return actual.some((item) => same(item, expected));
  return typeof actual === "string" && typeof expected === "string" && actual.toLocaleLowerCase().includes(expected.toLocaleLowerCase());
}

function signalValue(context: RuleContext, condition: RuleCondition): unknown {
  if (condition.signal === "tokens") return context.text.tokens;
  if (condition.signal === "normalized") return context.text.normalized;
  return condition.signal ? context.text.signals[condition.signal] : undefined;
}

function conditionMatch(condition: RuleCondition, context: RuleContext): ConditionMatch {
  if (condition.operator === "anyOf" || condition.operator === "allOf") {
    const matches = (condition.conditions ?? []).map((child) => conditionMatch(child, context));
    return { matched: condition.operator === "anyOf" ? matches.some((match) => match.matched) : matches.every((match) => match.matched), factIds: matches.filter((match) => match.matched).flatMap((match) => match.factIds) };
  }
  if (condition.operator === "conflictExists") return { matched: context.conflicts.some((conflict) => conflict.status === "OPEN" && (!condition.factKey || conflict.key === condition.factKey)), factIds: [] };
  if (condition.operator === "textSignalScore") {
    const signal = signalValue(context, condition);
    const score = Array.isArray(signal) ? signal.length : typeof signal === "string" ? Number(signal.length > 0) : Number(Boolean(signal));
    return { matched: score >= Number(condition.value), factIds: [] };
  }
  const textValue = condition.factKey === "text.normalized" ? context.text.normalized : condition.factKey === "text.tokens" ? context.text.tokens : undefined;
  const facts = context.facts.filter((fact) => fact.key === condition.factKey);
  const fact = textValue !== undefined ? { id: "", key: condition.factKey ?? "", normalizedValue: textValue, sourceSystem: "ALWAYSCHAT", observedAt: context.now ?? new Date() } : preferredFact(condition.factKey ?? "", facts);
  if (condition.operator === "exists" || condition.operator === "missing") return { matched: condition.operator === "exists" ? Boolean(fact) : !fact, factIds: fact ? [fact.id] : [] };
  if (!fact) return { matched: false, factIds: [] };
  const actual = fact.normalizedValue;
  let matched = false;
  switch (condition.operator) {
    case "equals": matched = same(actual, condition.value); break;
    case "notEquals": matched = !same(actual, condition.value); break;
    case "contains": matched = contains(actual, condition.value); break;
    case "notContains": matched = !contains(actual, condition.value); break;
    case "regex": matched = typeof actual === "string" && new RegExp(String(condition.value), "iu").test(actual); break;
    case "in": matched = (condition.value as unknown[]).some((value) => same(actual, value)); break;
    case "notIn": matched = !(condition.value as unknown[]).some((value) => same(actual, value)); break;
    case "greaterThan": matched = typeof actual === "number" && actual > Number(condition.value); break;
    case "lessThan": matched = typeof actual === "number" && actual < Number(condition.value); break;
    case "sourceIs": matched = fact.sourceSystem === condition.value; break;
    case "ageMinutes": matched = (context.now ?? new Date()).getTime() - new Date(fact.observedAt).getTime() >= Number(condition.value) * 60_000; break;
  }
  return { matched, factIds: matched && fact.id ? [fact.id] : [] };
}

export function evaluateHeuristics(rules: readonly HeuristicRule[], input: HeuristicInput): HeuristicResult {
  const active = rules.map(validateHeuristicRule).filter((rule) => rule.active).sort((a, b) => b.priority - a.priority || a.code.localeCompare(b.code));
  const context: RuleContext = { text: normalizeText(input.text), facts: input.facts ?? [], conflicts: input.conflicts ?? [], now: input.now };
  const matched = active.flatMap((rule) => {
    const conditions = rule.conditions.map((condition) => conditionMatch(condition, context));
    const excluded = rule.exclusions.some((condition) => conditionMatch(condition, context).matched);
    return conditions.every((condition) => condition.matched) && !excluded ? [{ rule, factIds: conditions.flatMap((condition) => condition.factIds) }] : [];
  });
  const byFlow = new Map<string, typeof matched>();
  for (const match of matched) byFlow.set(match.rule.flowId, [...(byFlow.get(match.rule.flowId) ?? []), match]);
  const candidates = [...byFlow.entries()].map(([flowId, matches]) => {
    const score = matches.reduce((total, match) => total + match.rule.weight, 0);
    const possible = active.filter((rule) => rule.flowId === flowId && rule.weight > 0).reduce((total, rule) => total + rule.weight, 0);
    const hard = matches.some((match) => match.rule.hardMatch);
    const required = [...new Set(matches.flatMap((match) => match.rule.requiredFacts))];
    return { flowId, score, confidence: hard ? 1 : Math.max(0, Math.min(1, possible ? Math.max(0, score) / possible : 0)), role: "SECONDARY" as const, matchedRules: matches.map((match) => `${match.rule.code}@${match.rule.version}`), supportingFactIds: [...new Set(matches.flatMap((match) => match.factIds))], missingFactKeys: required.filter((key) => !context.facts.some((fact) => fact.key === key)), producedTags: [...new Set(matches.flatMap((match) => match.rule.producedTags))], reasons: matches.map((match) => `${match.rule.code}: ${match.rule.weight >= 0 ? "+" : ""}${match.rule.weight}`), hard, priority: Math.max(...matches.map((match) => match.rule.priority)) };
  }).sort((a, b) => Number(b.hard) - Number(a.hard) || b.score - a.score || b.priority - a.priority || a.flowId.localeCompare(b.flowId));
  const primaryBase = candidates.find((candidate) => candidate.score > 0 || candidate.hard) ?? null;
  const publicCandidates: FlowCandidate[] = candidates.map(({ hard: _hard, priority: _priority, ...candidate }) => ({ ...candidate, role: candidate.flowId === primaryBase?.flowId ? "PRIMARY" : "SECONDARY" }));
  const riskMap = new Map<string, { effects: { category: RiskCategory; level: string }[]; rules: string[]; factIds: string[] }>();
  for (const match of matched) for (const effect of match.rule.riskEffects) {
    const gate = riskMap.get(effect.gateFlowId) ?? { effects: [], rules: [], factIds: [] };
    gate.effects.push(effect); gate.rules.push(`${match.rule.code}@${match.rule.version}`); gate.factIds.push(...match.factIds); riskMap.set(effect.gateFlowId, gate);
  }
  const riskGates: FlowCandidate[] = [...riskMap.entries()].map(([flowId, gate]) => ({ flowId, score: 0, confidence: 1, role: "RISK_GATE", matchedRules: [...new Set(gate.rules)], supportingFactIds: [...new Set(gate.factIds)], missingFactKeys: [], producedTags: [], reasons: [...new Set(gate.effects.map((effect) => `${effect.category}:${effect.level}`))] }));
  return { primary: publicCandidates.find((candidate) => candidate.role === "PRIMARY") ?? null, secondary: publicCandidates.filter((candidate) => candidate.role === "SECONDARY"), riskGates, candidates: publicCandidates };
}
