import { describe, expect, it, vi } from "vitest";
import {
  PrivacyLifecyclePartialFailureError,
  enqueuePrivacyLifecycleJob,
  privacyLifecycleDedupeKey,
  processPrivacyLifecycleJob,
  type PrivacyLifecycleJobData
} from "./privacy-lifecycle.jobs.js";

const data: PrivacyLifecycleJobData = {
  organizationId: "org-1",
  dryRun: false,
  scheduledFor: "2026-07-15T03:00:00.000Z",
  policy: { conversationDays: 30, diagnosticDays: 7, cacheMinutes: 15, screenshotsEnabled: false }
};

describe("privacy lifecycle jobs", () => {
  it("deduplicates by tenant, UTC day, and execution mode", () => {
    expect(privacyLifecycleDedupeKey(data)).toBe("privacy-lifecycle.purge-expired:org-1:2026-07-15:execute");
    expect(privacyLifecycleDedupeKey({ ...data, organizationId: "org-2" })).not.toBe(privacyLifecycleDedupeKey(data));
    expect(privacyLifecycleDedupeKey({ ...data, dryRun: true })).not.toBe(privacyLifecycleDedupeKey(data));
  });

  it("rejects execute enqueue without tenant-bound confirmation", () => {
    expect(() => enqueuePrivacyLifecycleJob({} as never, data)).toThrow("tenant-bound");
    expect(() => enqueuePrivacyLifecycleJob({} as never, data, { confirmation: "org-2:PURGE_EXPIRED_DIAGNOSTICS" }))
      .toThrow("tenant-bound");
  });

  it("records dry-run counts without mutating persisted diagnostics", async () => {
    const updateRuns = vi.fn();
    const updateHealth = vi.fn();
    const prisma = {
      evidenceFact: { count: vi.fn().mockResolvedValue(3), updateMany: vi.fn() },
      connectorRun: { count: vi.fn().mockResolvedValue(2), updateMany: updateRuns },
      connectorHealthEvent: { count: vi.fn().mockResolvedValue(1), updateMany: updateHealth },
      auditLog: { create: vi.fn().mockResolvedValue({ id: "audit-1" }) }
    };

    await expect(processPrivacyLifecycleJob(prisma as never, { ...data, dryRun: true })).resolves.toEqual(
      expect.objectContaining({ dryRun: true, connectorRuns: 2, healthEvents: 1, failures: [] })
    );
    expect(updateRuns).not.toHaveBeenCalled();
    expect(updateHealth).not.toHaveBeenCalled();
  });

  it("keeps tenant filters and an audit trail when one target fails", async () => {
    const updateRuns = vi.fn().mockResolvedValue({ count: 2 });
    const updateHealth = vi.fn().mockRejectedValue(new Error("raw database detail"));
    const audit = vi.fn().mockResolvedValue({ id: "audit-1" });
    const prisma = {
      evidenceFact: { updateMany: vi.fn().mockResolvedValue({ count: 3 }) },
      connectorRun: { updateMany: updateRuns },
      connectorHealthEvent: { updateMany: updateHealth },
      auditLog: { create: audit }
    };

    await expect(processPrivacyLifecycleJob(prisma as never, data)).rejects.toBeInstanceOf(PrivacyLifecyclePartialFailureError);
    expect(updateRuns).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ organizationId: "org-1" }) }));
    expect(updateHealth).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ organizationId: "org-1" }) }));
    const auditPayload = JSON.stringify(audit.mock.calls);
    expect(auditPayload).toContain("privacy.lifecycle.started");
    expect(auditPayload).toContain("privacy.lifecycle.target_failed");
    expect(auditPayload).toContain("PURGE_TARGET_FAILED");
    expect(auditPayload).not.toContain("raw database detail");
  });

  it("is data-idempotent when a retry finds diagnostics already cleared", async () => {
    const updateRuns = vi.fn().mockResolvedValueOnce({ count: 2 }).mockResolvedValueOnce({ count: 0 });
    const updateHealth = vi.fn().mockResolvedValueOnce({ count: 1 }).mockResolvedValueOnce({ count: 0 });
    const prisma = {
      evidenceFact: { updateMany: vi.fn().mockResolvedValue({ count: 3 }) },
      connectorRun: { updateMany: updateRuns },
      connectorHealthEvent: { updateMany: updateHealth },
      auditLog: { create: vi.fn().mockResolvedValue({ id: "audit-1" }) }
    };

    await expect(processPrivacyLifecycleJob(prisma as never, data)).resolves.toEqual(expect.objectContaining({ connectorRuns: 2, healthEvents: 1 }));
    await expect(processPrivacyLifecycleJob(prisma as never, data)).resolves.toEqual(expect.objectContaining({ connectorRuns: 0, healthEvents: 0 }));
  });
});
