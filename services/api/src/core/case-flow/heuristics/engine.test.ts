import { describe, expect, it } from "vitest";
import { evaluateHeuristics } from "./engine.js";
import type { HeuristicFact, HeuristicRule } from "./rules.js";

const base = (code: string, flowId: string, weight: number, conditions: HeuristicRule["conditions"], extra: Partial<HeuristicRule> = {}): HeuristicRule => ({
  id: code, code, version: 1, active: true, priority: 1, flowId, weight, hardMatch: false, conditions,
  exclusions: [], requiredFacts: [], producedTags: [], riskEffects: [], ...extra
});
const fact = (id: string, key: string, normalizedValue: unknown, sourceSystem = "RASTREIO"): HeuristicFact => ({ id, key, normalizedValue, sourceSystem, observedAt: "2026-07-12T12:00:00Z" });

describe("heuristic scoring engine", () => {
  it("scores flows and explains rules, support, missing facts, and tags", () => {
    const result = evaluateHeuristics([
      base("DELIVERED", "UNRECOGNIZED_DELIVERY", 8, [{ operator: "equals", factKey: "logistics.status", value: "DELIVERED" }], { requiredFacts: ["order.id", "receiver.name"], producedTags: ["DELIVERED"] }),
      base("DENIAL", "UNRECOGNIZED_DELIVERY", 5, [{ operator: "contains", factKey: "text.normalized", value: "nao recebi" }]),
      base("DELAY", "DELIVERY_DELAY", 6, [{ operator: "contains", factKey: "conversation.intentText", value: "atraso" }])
    ], { text: "Nao recebi o pedido", facts: [fact("f1", "logistics.status", "DELIVERED"), fact("f2", "order.id", "123")] });

    expect(result.primary).toMatchObject({ flowId: "UNRECOGNIZED_DELIVERY", score: 13, confidence: 1, matchedRules: ["DELIVERED@1", "DENIAL@1"], supportingFactIds: ["f1"], missingFactKeys: ["receiver.name"], producedTags: ["DELIVERED"] });
    expect(result.primary?.reasons).toEqual(["DELIVERED: +8", "DENIAL: +5"]);
  });

  it("uses authority preference and applies exclusions and open conflicts", () => {
    const result = evaluateHeuristics([
      base("STATUS", "DELIVERY", 10, [{ operator: "equals", factKey: "logistics.status", value: "DELIVERED" }], { exclusions: [{ operator: "equals", factKey: "customer.confirmed", value: true }] }),
      base("CONFLICT", "CHECK_DATA", 4, [{ operator: "conflictExists", factKey: "logistics.status" }])
    ], { text: "", facts: [fact("manual", "logistics.status", "IN_TRANSIT", "MANUAL"), fact("carrier", "logistics.status", "DELIVERED", "CARRIER")], conflicts: [{ key: "logistics.status", status: "OPEN" }] });
    expect(result.primary?.flowId).toBe("DELIVERY");
    expect(result.secondary.map(({ flowId }) => flowId)).toContain("CHECK_DATA");
  });

  it("lets a hard rule override a larger score and emits independent risk gates", () => {
    const result = evaluateHeuristics([
      base("NORMAL", "STANDARD", 50, [{ operator: "exists", factKey: "order.id" }]),
      base("FRAUD", "FRAUD_REVIEW", 1, [{ operator: "regex", factKey: "conversation.intentText", value: "fraude|nao reconheco" }], { hardMatch: true, priority: 100, riskEffects: [{ category: "FRAUD", level: "CRITICAL", gateFlowId: "SECURITY_GATE" }] })
    ], { text: "Nao reconheco, parece fraude", facts: [fact("order", "order.id", "123"), fact("intent", "conversation.intentText", "parece fraude", "ALWAYSCHAT")] });
    expect(result.primary).toMatchObject({ flowId: "FRAUD_REVIEW", confidence: 1 });
    expect(result.riskGates).toEqual([expect.objectContaining({ flowId: "SECURITY_GATE", role: "RISK_GATE", reasons: ["FRAUD:CRITICAL"] })]);
  });

  it("supports numeric, membership, age, source and grouped operators deterministically", () => {
    const result = evaluateHeuristics([base("COMPOSITE", "COMPOSITE_FLOW", 7, [{ operator: "allOf", conditions: [
      { operator: "greaterThan", factKey: "attempts", value: 2 }, { operator: "in", factKey: "payment.status", value: ["PAID", "REFUNDED"] },
      { operator: "ageMinutes", factKey: "order.id", value: 30 }, { operator: "sourceIs", factKey: "payment.status", value: "YAMPI" }
    ] }])], { text: "", now: new Date("2026-07-12T13:00:00Z"), facts: [fact("a", "attempts", 3), fact("p", "payment.status", "PAID", "YAMPI"), fact("o", "order.id", "123")] });
    expect(result.primary?.flowId).toBe("COMPOSITE_FLOW");
    expect(result.primary?.supportingFactIds).toEqual(["a", "p", "o"]);
  });

  it("ignores inactive and negative-only flows and fails before evaluating invalid rules", () => {
    const negative = base("NEGATIVE", "NO", -20, [{ operator: "exists", factKey: "order.id" }]);
    expect(evaluateHeuristics([negative], { text: "", facts: [fact("o", "order.id", "1")] }).primary).toBeNull();
    expect(() => evaluateHeuristics([{ ...negative, weight: 1000 }], { text: "" })).toThrow(/INVALID_HEURISTIC_RULE/);
  });
});
