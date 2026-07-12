import { describe, expect, it, vi } from "vitest";
import type { CaseFlowPlan } from "@alwaystrack/shared";
import { appendServiceFlowSessionChoice } from "./sessions.service.js";

const plan = {
  revision: 2,
  transitions: [{ fromNodeKey: "decision", toNodeKey: "reply", label: "confirm", order: 0, requiresUserChoice: true }]
} as CaseFlowPlan;

describe("CaseFlow sessions", () => {
  it("records the human choice and computes the next node without deleting history", async () => {
    const auditLog = { create: vi.fn().mockResolvedValue({ id: "audit-1" }) };
    const serviceFlowSessionStep = {
      findFirst: vi.fn().mockResolvedValue({ id: "step-1", nodeSnapshotJson: JSON.stringify({ caseId: "case-1" }), choiceHistoryJson: JSON.stringify([{ choice: "review" }]) }),
      update: vi.fn().mockImplementation(({ data }) => ({ id: "step-1", ...data }))
    };
    const result = await appendServiceFlowSessionChoice({ serviceFlowSessionStep, auditLog } as never, { id: "user-1", organizationId: "org-1" } as never, "case-1", "session-1", "decision", "confirm", plan);
    expect(result.nextNodeKey).toBe("reply");
    expect(JSON.parse(serviceFlowSessionStep.update.mock.calls[0][0].data.choiceHistoryJson)).toMatchObject([{ choice: "review" }, { choice: "confirm", actorId: "user-1" }]);
    expect(auditLog.create).toHaveBeenCalledWith({ data: expect.objectContaining({ organizationId: "org-1", entityId: "session-1" }) });
  });

  it("rejects a session snapshot bound to another case", async () => {
    const db = { serviceFlowSessionStep: { findFirst: vi.fn().mockResolvedValue({ id: "step-1", nodeSnapshotJson: JSON.stringify({ caseId: "case-2" }) }) } };
    await expect(appendServiceFlowSessionChoice(db as never, { id: "user-1", organizationId: "org-1" } as never, "case-1", "session-1", "decision", "confirm", plan)).rejects.toThrow("NOT_FOUND");
  });
});
