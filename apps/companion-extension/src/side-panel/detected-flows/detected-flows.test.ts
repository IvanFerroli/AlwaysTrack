import { describe, expect, it } from "vitest";
import { createFlowOverrideIntent, needsFlowTriage, type DetectedFlow } from "./detected-flows.js";

const flow = (confidence: number): DetectedFlow => ({ id: "delivery", label: "Entrega", confidence, role: "PRIMARY", matchedRules: ["delivery@1"], supportingFacts: [{ id: "f1", label: "Status entregue" }], risk: "MEDIUM" });

describe("detected flow presentation", () => {
  it("requires triage for low confidence or missing primary flow", () => {
    expect(needsFlowTriage([flow(0.69)])).toBe(true);
    expect(needsFlowTriage([flow(0.9)])).toBe(false);
    expect(needsFlowTriage([])).toBe(true);
  });

  it("creates an explicit human override request", () => {
    expect(createFlowOverrideIntent("delay")).toEqual({ type: "CASE_FLOW_OVERRIDE_REQUESTED", payload: { flowId: "delay" } });
  });
});
