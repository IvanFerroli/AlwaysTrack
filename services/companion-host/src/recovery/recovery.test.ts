import { describe, expect, it, vi } from "vitest";
import { recoverHostCase } from "./index.js";

describe("host recovery", () => {
  it("resumes pinned state and cancels orphan host runs", async () => {
    const cancel = vi.fn(); const resume = vi.fn();
    const state = { organizationId: "t", caseId: "c", sessionId: "s", flowVersion: "v1", lastStepKey: "login", runs: [{ runId: "waiting", sessionId: "s", flowVersion: "v1", status: "WAITING_INTERVENTION" as const }, { runId: "old", sessionId: "old", flowVersion: "v0", status: "ACTIVE" as const }] };
    const result = await recoverHostCase({ read: vi.fn().mockResolvedValue(state), cancel }, { resume }, { organizationId: "t", caseId: "c", sessionId: "s", flowVersion: "v1" });
    expect(result.runs.map((run) => run.runId)).toEqual(["waiting"]);
    expect(cancel).toHaveBeenCalledWith("old", "ORPHANED_AFTER_RECOVERY");
    expect(resume).toHaveBeenCalledOnce();
  });

  it("rejects missing, mismatched-session and mismatched-flow recovery", async () => {
    const transport = { resume: vi.fn() };
    const key = { organizationId: "t", caseId: "c", sessionId: "s", flowVersion: "v1" };
    const store = (state: unknown) => ({ read: vi.fn().mockResolvedValue(state), cancel: vi.fn() });

    await expect(recoverHostCase(store(undefined), transport, key)).rejects.toThrow("RECOVERY_NOT_FOUND");
    await expect(recoverHostCase(store({ ...key, sessionId: "other", lastStepKey: "start", runs: [] }), transport, key)).rejects.toThrow("RECOVERY_NOT_FOUND");
    await expect(recoverHostCase(store({ ...key, flowVersion: "v2", lastStepKey: "start", runs: [] }), transport, key)).rejects.toThrow("FLOW_VERSION_MISMATCH");
    expect(transport.resume).not.toHaveBeenCalled();
  });
});
