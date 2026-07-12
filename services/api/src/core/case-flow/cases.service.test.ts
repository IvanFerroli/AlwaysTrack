import { describe, expect, it, vi } from "vitest";
import { CaseFlowLifecycleError, connectorRunFailureDoesNotFailCase, transitionServiceCase } from "./cases.service.js";

describe("CaseFlow lifecycle", () => {
  it("scopes transitions by tenant and audits completion", async () => {
    const prisma = {
      serviceCase: { findFirst: vi.fn().mockResolvedValue({ id: "case-1", status: "READY_FOR_RESPONSE" }), update: vi.fn().mockResolvedValue({ id: "case-1", status: "COMPLETED" }) },
      auditLog: { create: vi.fn() }
    };
    const now = new Date("2026-07-12T12:00:00Z");
    await transitionServiceCase(prisma as never, { organizationId: "org-1", actorId: "user-1" }, "case-1", "COMPLETED", { now });
    expect(prisma.serviceCase.findFirst).toHaveBeenCalledWith({ where: { id: "case-1", organizationId: "org-1" } });
    expect(prisma.serviceCase.update).toHaveBeenCalledWith({ where: { id: "case-1" }, data: expect.objectContaining({ status: "COMPLETED", completedAt: now }) });
    expect(prisma.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: "case_flow.case.completed" }) }));
  });

  it("rejects invalid and terminal transitions", async () => {
    const prisma = { serviceCase: { findFirst: vi.fn().mockResolvedValue({ id: "case-1", status: "COMPLETED" }) } };
    await expect(transitionServiceCase(prisma as never, { organizationId: "org-1", actorId: "user-1" }, "case-1", "RESOLVED")).rejects.toEqual(new CaseFlowLifecycleError("INVALID_TRANSITION"));
  });

  it("keeps isolated connector failures outside central case failure", () => {
    expect(connectorRunFailureDoesNotFailCase()).toBe(true);
  });
});
