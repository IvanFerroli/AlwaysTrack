import type { EvidenceFact } from "@alwaystrack/shared";
import { describe, expect, it, vi } from "vitest";
import captcha from "./fixtures/captcha.sanitized.json";
import login from "./fixtures/login.sanitized.json";
import multiple from "./fixtures/result-multiple.sanitized.json";
import { JtVipReadOnlyRuntime } from "./runtime.js";

const tracking: EvidenceFact = { id: "f", caseId: "case-1", key: "logistics.trackingCode", value: "888SYN001", normalizedValue: "888SYN001", sourceSystem: "MANUAL", observedAt: "2026-07-12T10:00:00Z", collectedAt: "2026-07-12T10:00:00Z", confidence: 1, freshness: "FRESH", sensitivity: "INTERNAL", acquisition: "MANUAL" };
const run = async (payload: unknown) => new JtVipReadOnlyRuntime({ enabled: true, source: { mode: "READ_ONLY", read: vi.fn(async () => payload) }, ledger: { append: vi.fn(async () => undefined) }, evidence: { append: vi.fn(async () => undefined) } }).run({ caseId: "case-1", runId: "run-1", capability: "READ", evidence: [tracking] });
describe("J&T VIP read-only runtime", () => {
  it("pauses for captcha and logout without bypass", async () => { expect((await run(captcha)).status).toBe("BLOCKED_CAPTCHA"); expect((await run(login)).status).toBe("BLOCKED_AUTH"); });
  it("extracts partial-safe facts after a resumed read", async () => { const result = await run(multiple); expect(result.status).toBe("COMPLETE"); expect(result.facts.map((item) => item.key)).toContain("treatment.openTickets"); });
});
