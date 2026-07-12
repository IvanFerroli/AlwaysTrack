import { describe, expect, it } from "vitest";
import { HeuristicRuleValidationError, validateHeuristicRule, type HeuristicRule } from "./rules.js";

const rule = (overrides: Partial<HeuristicRule> = {}): HeuristicRule => ({
  id: "rule-1", code: "DELIVERED", version: 1, active: true, priority: 10, flowId: "DELIVERY", weight: 8, hardMatch: false,
  conditions: [{ operator: "equals", factKey: "logistics.status", value: "DELIVERED" }], exclusions: [],
  requiredFacts: ["order.id"], producedTags: ["DELIVERED"], riskEffects: [], ...overrides
});

describe("heuristic rule DSL", () => {
  it("accepts the closed declarative operator set and versioned risk effects", () => {
    expect(validateHeuristicRule(rule({
      conditions: [{ operator: "allOf", conditions: [
        { operator: "exists", factKey: "order.id" },
        { operator: "anyOf", conditions: [{ operator: "sourceIs", factKey: "logistics.status", value: "RASTREIO" }, { operator: "conflictExists", factKey: "logistics.status" }] },
        { operator: "textSignalScore", signal: "negations", value: 1 }
      ] }],
      riskEffects: [{ category: "MONEY", level: "HIGH", gateFlowId: "FINANCIAL_REVIEW" }]
    }))).toMatchObject({ version: 1, flowId: "DELIVERY" });
  });

  it.each([
    ["unknown operator", { conditions: [{ operator: "eval", value: "process.exit()" }] }],
    ["missing fact key", { conditions: [{ operator: "equals", value: "DELIVERED" }] }],
    ["invalid version", { version: 0 }],
    ["invalid weight", { weight: 101 }],
    ["unsafe regex", { conditions: [{ operator: "regex", factKey: "conversation.intentText", value: "(a+)+$" }] }],
    ["duplicate required facts", { requiredFacts: ["order.id", "order.id"] }]
  ])("rejects %s observably", (_label, overrides) => {
    expect(() => validateHeuristicRule(rule(overrides as Partial<HeuristicRule>))).toThrow(HeuristicRuleValidationError);
  });

  it("limits nested expressions", () => {
    const leaf = { operator: "exists" as const, factKey: "order.id" };
    expect(() => validateHeuristicRule(rule({ conditions: [{ operator: "allOf", conditions: [{ operator: "allOf", conditions: [{ operator: "allOf", conditions: [leaf] }] }] }] }))).toThrow(/nesting depth/);
  });
});
