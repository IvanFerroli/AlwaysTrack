import { describe, expect, it } from "vitest";
import type { EvidenceFact } from "@alwaystrack/shared";
import { buildPartialSummary, revisePartialSummary } from "./partial-summary.service.js";

const fact = (id: string, key: EvidenceFact["key"], value: unknown): EvidenceFact => ({ id, caseId: "case-1", key, value, normalizedValue: value, sourceSystem: "DERIVED", observedAt: "2026-01-10T10:00:00Z", collectedAt: "2026-01-10T10:00:00Z", confidence: 1, freshness: "FRESH", sensitivity: "INTERNAL", acquisition: "DERIVED", ruleId: "test" });

describe("deterministic partial summary", () => {
  it("uses fixed order, 3-5 lines and only supplied facts", () => {
    const facts = [fact("3", "logistics.status", "EM_TRANSPORTE"), fact("1", "conversation.intentText", "Consultar pedido"), fact("2", "order.primaryId", "ORDER-1")];
    expect(buildPartialSummary(facts)?.lines).toEqual(["Demanda: Consultar pedido.", "Pedido: ORDER-1.", "Logistica: EM_TRANSPORTE."]);
  });
  it("keeps revision history only when evidence changes output", () => {
    const base = [fact("1", "conversation.intentText", "Consultar pedido"), fact("2", "order.primaryId", "ORDER-1"), fact("3", "payment.status", "APROVADO")];
    const first = revisePartialSummary({ revisions: [] }, base, "t1");
    const same = revisePartialSummary(first, base, "t2");
    const changed = revisePartialSummary(same, [...base, fact("4", "logistics.status", "ENTREGUE")], "t3");
    expect(same.revisions).toHaveLength(1);
    expect(changed.revisions.map((item) => item.revision)).toEqual([1, 2]);
  });
});
