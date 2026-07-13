import { describe, expect, it, vi } from "vitest";
import { detectManualLancadorConfirmation } from "./manual-detection.js";

describe("Lancador manual confirmation detection", () => {
  it("only derives evidence after observed manual confirmation", async () => { const source = { mode: "OBSERVE_ONLY" as const, observe: vi.fn(async () => ({ manualConfirmationObserved: false, generatedOrderNumber: "L-NEW" })) }; expect(await detectManualLancadorConfirmation({ enabled: true, caseId: "case-1", runId: "run-1", draftActionId: "draft-1", source })).toBeNull(); source.observe.mockResolvedValue({ manualConfirmationObserved: true, generatedOrderNumber: "L-NEW" }); const fact = await detectManualLancadorConfirmation({ enabled: true, caseId: "case-1", runId: "run-1", draftActionId: "draft-1", source, observedAt: "2026-07-12T10:00:00Z" }); expect(fact).toMatchObject({ key: "order.manualId", acquisition: "DERIVED", ruleId: "lancador.manual-confirmation" }); expect(Object.keys(source)).not.toEqual(expect.arrayContaining(["click", "confirm", "submit"])); });
});
