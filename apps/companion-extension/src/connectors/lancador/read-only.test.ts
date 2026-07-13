import type { EvidenceFact } from "@alwaystrack/shared";
import { describe, expect, it, vi } from "vitest";
import multiple from "./fixtures/result-multiple.sanitized.json";
import { LancadorReadOnlyRuntime } from "./read-only.js";

const evidence: EvidenceFact[] = [{ id: "f", caseId: "case-1", key: "customer.cpf", value: "000", normalizedValue: "000", sourceSystem: "MANUAL", observedAt: "2026-07-12T10:00:00Z", collectedAt: "2026-07-12T10:00:00Z", confidence: 1, freshness: "FRESH", sensitivity: "PII", acquisition: "MANUAL" }];
describe("Lancador read-only runtime", () => {
  it("consults without filling and denies FILL_FORM", async () => { const source = { mode: "READ_ONLY" as const, read: vi.fn(async () => multiple) }; const runtime = new LancadorReadOnlyRuntime({ enabled: true, source, ledger: { append: vi.fn(async () => undefined) }, evidence: { append: vi.fn(async () => undefined) } }); expect((await runtime.run({ caseId: "case-1", runId: "run-1", capability: "FILL_FORM", evidence })).status).toBe("CANCELLED"); expect(source.read).not.toHaveBeenCalled(); const result = await runtime.run({ caseId: "case-1", runId: "run-2", capability: "READ", evidence }); expect(result.status).toBe("COMPLETE"); expect(result.facts.map((item) => item.key)).toContain("order.products"); });
});
