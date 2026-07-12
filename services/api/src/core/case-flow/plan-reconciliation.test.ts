import { describe, expect, it } from "vitest";
import type { CaseFlowPlan } from "@alwaystrack/shared";
import { reconcileCaseFlowPlan } from "./plan-reconciliation.js";

const plan = (primaryFlowId: string, ids: string[]): CaseFlowPlan => ({ revision: 1, status: "READY", primaryFlowId, secondaryFlowIds: [], riskGateFlowIds: [], reasons: [],
  nodes: ids.map((id) => ({ id, key: id, type: "CHECK", title: id, requiredFacts: [], optionalFacts: [], scripts: [], allowedCapabilities: [], forbiddenCapabilities: [], autoAdvance: false, riskLevel: "LOW", terminal: false, sourceFlowIds: [primaryFlowId], sourceVersionIds: [`${primaryFlowId}@1`] })),
  transitions: [], currentNodeId: ids[0] ?? null, possibilities: [], dependencies: [], forbiddenCapabilities: [], blockedReasons: [] });

describe("incremental plan reconciliation", () => {
  it("preserves the current node, choices and copied messages while still valid", () => {
    const result = reconcileCaseFlowPlan(plan("a", ["one", "two"]), plan("a", ["one", "two", "three"]), { currentNodeId: "two", confirmedChoices: { two: "yes" }, copiedMessageNodeIds: ["one"] });
    expect(result.plan.currentNodeId).toBe("two"); expect(result.state.confirmedChoices).toEqual({ two: "yes" }); expect(result.revision.recommendationChanged).toBe(false);
  });
  it("moves only when the current branch disappears and warns about recommendation changes", () => {
    const result = reconcileCaseFlowPlan(plan("a", ["one", "two"]), plan("b", ["three"]), { currentNodeId: "two", confirmedChoices: { two: "yes" }, copiedMessageNodeIds: ["two"] });
    expect(result.plan.currentNodeId).toBe("three"); expect(result.state.confirmedChoices).toEqual({}); expect(result.revision.warning).toBe("PLAN_RECOMMENDATION_CHANGED");
  });
});
