import { expect, it, vi } from "vitest";
import { recoverHostCase } from "./index.js";

it("resumes pinned state and cancels orphan host runs", async () => {
  const cancel = vi.fn(); const resume = vi.fn();
  const state = { organizationId: "t", caseId: "c", sessionId: "s", flowVersion: "v1", lastStepKey: "login", runs: [{ runId: "waiting", sessionId: "s", flowVersion: "v1", status: "WAITING_INTERVENTION" as const }, { runId: "old", sessionId: "old", flowVersion: "v0", status: "ACTIVE" as const }] };
  const result = await recoverHostCase({ read: vi.fn().mockResolvedValue(state), cancel }, { resume }, { organizationId: "t", caseId: "c", sessionId: "s", flowVersion: "v1" });
  expect(result.runs.map((run) => run.runId)).toEqual(["waiting"]);
  expect(cancel).toHaveBeenCalledWith("old", "ORPHANED_AFTER_RECOVERY");
  expect(resume).toHaveBeenCalledOnce();
});
