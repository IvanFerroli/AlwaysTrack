import { describe, expect, it } from "vitest";
import type { FlowNodeDefinition, FlowTransitionDefinition } from "@alwaystrack/shared";
import { validateFlowGraph } from "./flow-validation.js";

const node = (key: string, type: FlowNodeDefinition["type"], riskLevel: FlowNodeDefinition["riskLevel"] = "LOW"): FlowNodeDefinition => ({
  key, type, title: key, requiredFacts: [], optionalFacts: [], scripts: [], allowedCapabilities: [], forbiddenCapabilities: [],
  autoAdvance: false, riskLevel, terminal: type === "END"
});
const edge = (fromNodeKey: string, toNodeKey: string, label = "next"): FlowTransitionDefinition => ({ fromNodeKey, toNodeKey, label, order: 0, requiresUserChoice: false });

describe("service flow graph validation", () => {
  it("accepts a complete directed flow", () => expect(validateFlowGraph([node("s", "START"), node("c", "CHECK"), node("e", "END")], [edge("s", "c"), edge("c", "e")])).toEqual({ valid: true, issues: [] }));
  it("rejects missing boundaries, unknown and duplicate transitions", () => {
    const result = validateFlowGraph([node("a", "CHECK")], [edge("a", "missing"), edge("a", "missing")]);
    expect(result.valid).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toEqual(expect.arrayContaining(["MISSING_START", "MISSING_END", "UNKNOWN_TRANSITION_NODE", "DUPLICATE_TRANSITION"]));
  });
  it("rejects unreachable branches and implicit loops but permits declared loops", () => {
    const nodes = [node("s", "START"), node("a", "CHECK"), node("orphan", "CHECK"), node("e", "END")];
    expect(validateFlowGraph(nodes, [edge("s", "a"), edge("a", "s"), edge("a", "e")]).issues.map((item) => item.code)).toEqual(expect.arrayContaining(["ORPHAN_NODE", "DISALLOWED_LOOP"]));
    const loop = { ...edge("a", "s"), allowLoop: true };
    expect(validateFlowGraph(nodes.filter((item) => item.key !== "orphan"), [edge("s", "a"), loop, edge("a", "e")]).issues).toEqual([]);
  });
  it("requires an immediate risk gate before high-risk work", () => expect(validateFlowGraph([node("s", "START"), node("h", "DRAFT_ACTION", "HIGH"), node("e", "END")], [edge("s", "h"), edge("h", "e")]).issues).toContainEqual({ code: "MISSING_RISK_GATE", nodeKey: "h" }));
});
