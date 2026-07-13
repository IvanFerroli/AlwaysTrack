import { describe, expect, it, vi } from "vitest";
import { rehydrateCase } from "./recovery.service.js";

it("rehydrates a tenant case with pinned version and cancels orphan runs", async () => {
  const cancelRun = vi.fn();
  const storage = { load: vi.fn().mockResolvedValue({ organizationId: "t", caseId: "c", sessionId: "s", flowVersion: "v2", lastStepKey: "confirm", updatedAt: "now" }), listActiveRuns: vi.fn().mockResolvedValue([{ runId: "keep", sessionId: "s", flowVersion: "v2" }, { runId: "orphan", sessionId: "old", flowVersion: "v1" }]), cancelRun };
  const result = await rehydrateCase(storage, { organizationId: "t", caseId: "c", sessionId: "s", flowVersion: "v2" });
  expect(result.orphanedRunIds).toEqual(["orphan"]);
  expect(cancelRun).toHaveBeenCalledWith("orphan", "ORPHANED_AFTER_RECOVERY");
});
