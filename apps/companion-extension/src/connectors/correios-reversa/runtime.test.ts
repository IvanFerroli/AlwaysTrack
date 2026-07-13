import type { EvidenceFact } from "@alwaystrack/shared";
import { describe, expect, it, vi } from "vitest";
import twoFactor from "./fixtures/2fa.sanitized.json";
import multiple from "./fixtures/result-multiple.sanitized.json";
import { CorreiosReverseReadOnlyRuntime } from "./runtime.js";

const evidence: EvidenceFact[] = [{ id: "f", caseId: "case-1", key: "treatment.reverseCode", value: "AUT-SYN-1", normalizedValue: "AUT-SYN-1", sourceSystem: "MANUAL", observedAt: "2026-07-12T10:00:00Z", collectedAt: "2026-07-12T10:00:00Z", confidence: 1, freshness: "FRESH", sensitivity: "INTERNAL", acquisition: "MANUAL" }];
const setup = (payload: unknown) => { const source = { mode: "READ_ONLY" as const, read: vi.fn(async () => payload) }; return { source, runtime: new CorreiosReverseReadOnlyRuntime({ enabled: true, source, ledger: { append: vi.fn(async () => undefined) }, evidence: { append: vi.fn(async () => undefined) } }) }; };
describe("Correios/Reversa read-only runtime", () => {
  it("pauses on 2FA and never exposes reverse creation", async () => { expect((await setup(twoFactor).runtime.run({ caseId: "case-1", runId: "run-1", capability: "READ", evidence })).status).toBe("BLOCKED_2FA"); const denied = setup(multiple); expect((await denied.runtime.run({ caseId: "case-1", runId: "run-2", capability: "CREATE_REVERSE", evidence })).status).toBe("CANCELLED"); expect(denied.source.read).not.toHaveBeenCalled(); });
  it("extracts existing reverse data only", async () => { const result = await setup(multiple).runtime.run({ caseId: "case-1", runId: "run-1", capability: "READ", evidence }); expect(result.status).toBe("COMPLETE"); expect(result.facts.map((item) => item.key)).toContain("treatment.reverseValidity"); });
});
