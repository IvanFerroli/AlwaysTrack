import { describe, expect, it } from "vitest";
import type { HeuristicResult } from "./engine.js";
import { applyLowConfidenceTriage, triageAnswersToFacts } from "./triage.js";

const result = (confidence: number): HeuristicResult => {
  const primary = { flowId: "DELIVERY", score: 3, confidence, role: "PRIMARY" as const, matchedRules: ["DELAY@1"], supportingFactIds: [], missingFactKeys: ["logistics.status", "order.id"], producedTags: [], reasons: ["DELAY: +3"] };
  const alternative = { ...primary, flowId: "REFUND", role: "SECONDARY" as const, missingFactKeys: ["payment.status", "order.id"] };
  return { primary, secondary: [alternative], riskGates: [], candidates: [primary, alternative] };
};

describe("low-confidence triage", () => {
  it("keeps a confident decision unchanged", () => {
    const triage = applyLowConfidenceTriage(result(0.8));
    expect(triage).toMatchObject({ lowConfidence: false, primary: { flowId: "DELIVERY" }, questions: [] });
  });

  it("selects generic triage while preserving candidates and discriminating questions", () => {
    const triage = applyLowConfidenceTriage(result(0.4), { prompts: { "order.id": "Qual e o pedido?" } });
    expect(triage.primary).toMatchObject({ flowId: "GENERIC_TRIAGE", role: "PRIMARY", producedTags: ["LOW_CONFIDENCE"] });
    expect(triage.originalPrimary?.flowId).toBe("DELIVERY");
    expect(triage.secondary.map(({ flowId }) => flowId)).toEqual(["DELIVERY", "REFUND"]);
    expect(triage.questions).toEqual([
      expect.objectContaining({ factKey: "logistics.status", candidateFlowIds: ["DELIVERY"] }),
      expect.objectContaining({ factKey: "order.id", prompt: "Qual e o pedido?", candidateFlowIds: ["DELIVERY", "REFUND"] }),
      expect.objectContaining({ factKey: "payment.status", candidateFlowIds: ["REFUND"] })
    ]);
  });

  it("triages an absent result and validates custom thresholds", () => {
    const empty: HeuristicResult = { primary: null, secondary: [], riskGates: [], candidates: [] };
    expect(applyLowConfidenceTriage(empty)).toMatchObject({ lowConfidence: true, questions: [] });
    expect(() => applyLowConfidenceTriage(empty, { threshold: 2 })).toThrow(RangeError);
  });

  it("turns explicit user answers into manual facts for a subsequent evaluation", () => {
    const now = new Date("2026-07-12T12:00:00Z");
    expect(triageAnswersToFacts([{ factKey: "logistics.status", value: "DELIVERED" }], now)).toEqual([{ id: "triage-answer-1", key: "logistics.status", normalizedValue: "DELIVERED", sourceSystem: "MANUAL", observedAt: now }]);
  });
});
