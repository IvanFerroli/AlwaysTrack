import type { EvidenceFact } from "@alwaystrack/shared";
import { describe, expect, it, vi } from "vitest";
import empty from "./fixtures/result-empty.sanitized.json";
import multiple from "./fixtures/result-multiple.sanitized.json";
import { YampiReadOnlyRuntime } from "./runtime.js";

const fact = (key: EvidenceFact["key"], value: unknown): EvidenceFact => ({ id: `f:${key}`, caseId: "case-1", key, value, normalizedValue: value, sourceSystem: "MANUAL", observedAt: "2026-07-12T10:00:00Z", collectedAt: "2026-07-12T10:00:00Z", confidence: 1, freshness: "FRESH", sensitivity: "INTERNAL", acquisition: "MANUAL" });
const request = { caseId: "case-1", runId: "run-1", capability: "READ", evidence: [fact("customer.email", "synthetic@example.invalid")] };
const setup = (payload: unknown, enabled?: boolean) => {
  const source = { read: vi.fn(async () => payload) };
  const ledger = { append: vi.fn(async () => undefined) };
  const evidence = { append: vi.fn(async () => undefined) };
  return { source, ledger, evidence, runtime: new YampiReadOnlyRuntime({ enabled, source, ledger, evidence, now: () => "2026-07-12T10:00:00Z" }) };
};

describe("Yampi read-only runtime", () => {
  it("is default-off and fails closed for unknown capabilities", async () => {
    const disabled = setup(multiple);
    expect((await disabled.runtime.run(request)).status).toBe("NOT_APPLICABLE");
    expect(disabled.source.read).not.toHaveBeenCalled();

    const enabled = setup(multiple, true);
    expect((await enabled.runtime.run({ ...request, capability: "OPEN_BOLETO" })).warnings[0]?.code).toBe("CAPABILITY_DENIED");
    expect(enabled.source.read).not.toHaveBeenCalled();
  });

  it("persists normalized facts through ports and keeps source absence non-blocking", async () => {
    const found = setup(multiple, true);
    const result = await found.runtime.run(request);
    expect(result.status).toBe("COMPLETE");
    expect(result.facts.map((item) => item.key)).toContain("payment.status");
    expect(found.evidence.append).toHaveBeenCalledOnce();
    expect(found.ledger.append).toHaveBeenCalledOnce();

    const absent = setup(empty, true);
    expect((await absent.runtime.run(request)).warnings[0]?.code).toBe("NOT_FOUND_IN_SOURCE");
    expect(absent.evidence.append).not.toHaveBeenCalled();
  });
});
