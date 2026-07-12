import type { NormalizedText, TextSignals } from "./text.js";

export const ruleOperators = [
  "equals", "notEquals", "contains", "notContains", "regex", "in", "notIn", "greaterThan", "lessThan",
  "exists", "missing", "anyOf", "allOf", "sourceIs", "conflictExists", "ageMinutes", "textSignalScore"
] as const;
export type RuleOperator = (typeof ruleOperators)[number];

export const riskCategories = ["ADVERSE_REACTION", "ALLERGY", "LEGAL_THREAT", "FRAUD", "MONEY", "REFUND", "WRONGFUL_CHARGE", "BANK_DATA"] as const;
export type RiskCategory = (typeof riskCategories)[number];

export type RuleCondition = {
  operator: RuleOperator;
  factKey?: string;
  value?: unknown;
  conditions?: RuleCondition[];
  signal?: keyof TextSignals | "tokens" | "normalized";
};

export type RiskEffect = {
  category: RiskCategory;
  level: "MEDIUM" | "HIGH" | "CRITICAL";
  gateFlowId: string;
};

export type HeuristicRule = {
  id: string;
  code: string;
  version: number;
  active: boolean;
  priority: number;
  flowId: string;
  weight: number;
  hardMatch: boolean;
  conditions: RuleCondition[];
  exclusions: RuleCondition[];
  requiredFacts: string[];
  producedTags: string[];
  riskEffects: RiskEffect[];
};

export type HeuristicFact = {
  id: string;
  key: string;
  normalizedValue: unknown;
  sourceSystem: string;
  observedAt: Date | string;
};

export type HeuristicConflict = { key: string; status: "OPEN" | "RESOLVED" };
export type RuleContext = {
  text: NormalizedText;
  facts: readonly HeuristicFact[];
  conflicts: readonly HeuristicConflict[];
  now?: Date;
};

export class HeuristicRuleValidationError extends Error {
  constructor(public readonly issues: readonly string[]) {
    super(`INVALID_HEURISTIC_RULE: ${issues.join(", ")}`);
  }
}

const VALUE_OPERATORS = new Set<RuleOperator>(["equals", "notEquals", "contains", "notContains", "regex", "in", "notIn", "greaterThan", "lessThan", "sourceIs", "ageMinutes", "textSignalScore"]);
const FACT_OPERATORS = new Set<RuleOperator>(["equals", "notEquals", "contains", "notContains", "regex", "in", "notIn", "greaterThan", "lessThan", "exists", "missing", "sourceIs", "ageMinutes"]);
const TEXT_FACT_KEYS = new Set(["text.normalized", "text.tokens"]);
const MAX_CONDITIONS = 50;

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= 160;
}

function validateRegex(value: unknown): boolean {
  if (typeof value !== "string" || value.length === 0 || value.length > 120) return false;
  if (/\\[1-9]|\(\?[:=!<]|\([^)]*[+*][^)]*\)[+*{]/.test(value)) return false;
  try { new RegExp(value, "iu"); return true; } catch { return false; }
}

function validateCondition(condition: RuleCondition, path: string, depth: number, issues: string[], count: { value: number }) {
  count.value += 1;
  if (count.value > MAX_CONDITIONS) issues.push("conditions exceed 50 nodes");
  if (depth > 3) issues.push(`${path} exceeds nesting depth 3`);
  if (!ruleOperators.includes(condition.operator)) { issues.push(`${path}.operator is invalid`); return; }
  if (condition.operator === "anyOf" || condition.operator === "allOf") {
    if (!condition.conditions?.length || condition.conditions.length > 10) issues.push(`${path}.conditions must contain 1..10 items`);
    condition.conditions?.forEach((child, index) => validateCondition(child, `${path}.conditions[${index}]`, depth + 1, issues, count));
    return;
  }
  if (FACT_OPERATORS.has(condition.operator) && !nonEmpty(condition.factKey)) issues.push(`${path}.factKey is required`);
  if (condition.factKey?.startsWith("text.") && !TEXT_FACT_KEYS.has(condition.factKey)) issues.push(`${path}.factKey is not a supported text field`);
  if (condition.operator === "sourceIs" && condition.factKey?.startsWith("text.")) issues.push(`${path}.sourceIs cannot target text`);
  if (condition.operator === "conflictExists" && condition.factKey !== undefined && !nonEmpty(condition.factKey)) issues.push(`${path}.factKey is invalid`);
  if (condition.operator === "textSignalScore" && !condition.signal) issues.push(`${path}.signal is required`);
  if (VALUE_OPERATORS.has(condition.operator) && condition.value === undefined) issues.push(`${path}.value is required`);
  if (["in", "notIn"].includes(condition.operator) && (!Array.isArray(condition.value) || condition.value.length === 0 || condition.value.length > 25)) issues.push(`${path}.value must contain 1..25 items`);
  if (["greaterThan", "lessThan", "ageMinutes", "textSignalScore"].includes(condition.operator) && (typeof condition.value !== "number" || !Number.isFinite(condition.value))) issues.push(`${path}.value must be a finite number`);
  if (condition.operator === "regex" && !validateRegex(condition.value)) issues.push(`${path}.value is not a safe regex`);
}

export function validateHeuristicRule(rule: HeuristicRule): HeuristicRule {
  const issues: string[] = [];
  for (const key of ["id", "code", "flowId"] as const) if (!nonEmpty(rule[key])) issues.push(`${key} is required`);
  if (!Number.isSafeInteger(rule.version) || rule.version < 1) issues.push("version must be a positive integer");
  if (!Number.isSafeInteger(rule.priority) || rule.priority < 0 || rule.priority > 10_000) issues.push("priority must be an integer between 0 and 10000");
  if (!Number.isFinite(rule.weight) || rule.weight < -100 || rule.weight > 100) issues.push("weight must be between -100 and 100");
  if (typeof rule.active !== "boolean" || typeof rule.hardMatch !== "boolean") issues.push("active and hardMatch must be boolean");
  if (!Array.isArray(rule.conditions) || rule.conditions.length === 0) issues.push("conditions must not be empty");
  const count = { value: 0 };
  rule.conditions?.forEach((condition, index) => validateCondition(condition, `conditions[${index}]`, 1, issues, count));
  rule.exclusions?.forEach((condition, index) => validateCondition(condition, `exclusions[${index}]`, 1, issues, count));
  for (const [key, values] of [["requiredFacts", rule.requiredFacts], ["producedTags", rule.producedTags]] as const) {
    if (!Array.isArray(values) || values.some((value) => !nonEmpty(value)) || new Set(values).size !== values.length) issues.push(`${key} must contain unique non-empty strings`);
  }
  if (!Array.isArray(rule.riskEffects) || rule.riskEffects.some((effect) => !riskCategories.includes(effect.category) || !["MEDIUM", "HIGH", "CRITICAL"].includes(effect.level) || !nonEmpty(effect.gateFlowId))) issues.push("riskEffects is invalid");
  if (issues.length) throw new HeuristicRuleValidationError([...new Set(issues)]);
  return rule;
}
