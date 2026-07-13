import type { EvidenceFact } from "@alwaystrack/shared";
import { describe, expect, it, vi } from "vitest";
import multiple from "./fixtures/result-multiple.sanitized.json";
import { LoggiReadOnlyRuntime } from "./runtime.js";

const fact = (key: EvidenceFact["key"], value: unknown): EvidenceFact => ({ id: `f:${key}`, caseId: "case-1", key, value, normalizedValue: value, sourceSystem: "MANUAL", observedAt: "2026-07-12T10:00:00Z", collectedAt: "2026-07-12T10:00:00Z", confidence: 1, freshness: "FRESH", sensitivity: "INTERNAL", acquisition: "MANUAL" });
const setup = (enabled?: boolean) => { const source = { mode: "READ_ONLY" as const, read: vi.fn(async () => multiple) }; return { source, runtime: new LoggiReadOnlyRuntime({ enabled, source, ledger: { append: vi.fn(async () => undefined) }, evidence: { append: vi.fn(async () => undefined) }, now: () => "2026-07-12T10:00:00Z" }) }; };

describe("Loggi read-only runtime", () => {
  it("is default-off, denies writes and applies from independent evidence", async () => {
    const disabled = setup();
    expect((await disabled.runtime.run({ caseId: "case-1", runId: "run-1", capability: "READ", evidence: [fact("logistics.trackingCode", "LG-SYN-001")] })).status).toBe("NOT_APPLICABLE");
    expect(disabled.source.read).not.toHaveBeenCalled();
    const denied = setup(true);
    expect((await denied.runtime.run({ caseId: "case-1", runId: "run-1", capability: "CHANGE_ADDRESS", evidence: [fact("customer.cpf", "000")] })).status).toBe("CANCELLED");
    expect(denied.source.read).not.toHaveBeenCalled();
    const enabled = setup(true);
    const result = await enabled.runtime.run({ caseId: "case-1", runId: "run-1", capability: "READ", evidence: [fact("order.primaryId", "O-SYN-1")] });
    expect(result.status).toBe("COMPLETE");
    expect(result.facts.map((item) => item.key)).toContain("logistics.proof");
  });
});
