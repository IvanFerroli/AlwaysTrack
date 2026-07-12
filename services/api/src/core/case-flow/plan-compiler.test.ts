import { describe, expect, it } from "vitest";
import type { FlowNodeDefinition, ServiceFlowVersionDefinition } from "@alwaystrack/shared";
import { compileCaseFlowPlan } from "./plan-compiler.js";

const node = (key: string, type: FlowNodeDefinition["type"], overrides: Partial<FlowNodeDefinition> = {}): FlowNodeDefinition => ({ key, type, title: key, requiredFacts: [], optionalFacts: [], scripts: [], allowedCapabilities: [], forbiddenCapabilities: [], autoAdvance: false, riskLevel: "LOW", terminal: type === "END", ...overrides });
const flow = (id: string, role: ServiceFlowVersionDefinition["role"], middle: FlowNodeDefinition): ServiceFlowVersionDefinition => ({
  flowId: id, versionId: `${id}@1`, version: 1, role, reason: `${id}-matched`, nodes: [node(`${id}-start`, "START"), middle, node(`${id}-end`, "END")],
  transitions: [{ fromNodeKey: `${id}-start`, toNodeKey: middle.key, label: "next", order: 0, requiresUserChoice: false }, { fromNodeKey: middle.key, toNodeKey: `${id}-end`, label: "done", order: 1, requiresUserChoice: false }]
});

describe("case flow plan compiler", () => {
  it("composes primary and secondary flows and deduplicates identical work", () => {
    const shared = node("check-order", "CHECK", { title: "Check order", requiredFacts: ["order.id"], dependencies: ["YAMPI"] });
    const plan = compileCaseFlowPlan([flow("delivery", "PRIMARY", shared), flow("billing", "SECONDARY", { ...shared, key: "same-check" })]);
    expect(plan.status).toBe("READY"); expect(plan.secondaryFlowIds).toEqual(["billing"]); expect(plan.dependencies).toEqual(["YAMPI"]);
    expect(plan.nodes.find((item) => item.title === "Check order")?.sourceFlowIds).toEqual(["delivery", "billing"]);
  });
  it("fails closed for prohibited actions and conflicting messages", () => {
    const first = flow("one", "PRIMARY", node("message", "MESSAGE", { title: "Reply", message: "A", allowedCapabilities: ["ISSUE_REFUND"] }));
    const second = flow("two", "SECONDARY", node("message-2", "MESSAGE", { title: "Reply", message: "B" }));
    const plan = compileCaseFlowPlan([first, second]);
    expect(plan.status).toBe("BLOCKED"); expect(plan.blockedReasons).toEqual(expect.arrayContaining(["FORBIDDEN_ACTION:ISSUE_REFUND", "CONFLICTING_MESSAGE:Reply"]));
    expect(plan.forbiddenCapabilities).toContain("ISSUE_REFUND");
  });
});
