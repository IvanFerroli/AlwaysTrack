import { describe, expect, it, vi } from "vitest";
import {
  caseFlowRetentionCutoffs,
  caseFlowRetentionPolicy,
  deleteServiceCaseData,
  purgeExpiredCaseFlowDiagnostics,
  recordCaseFlowAuditEvent
} from "./audit.js";

describe("CaseFlow audit and retention", () => {
  it("records only minimal redacted event metadata", async () => {
    const create = vi.fn().mockResolvedValue({ id: "audit-1" });
    const prisma = { auditLog: { create } };

    await recordCaseFlowAuditEvent(prisma as never, {
      organizationId: "org-1",
      actorId: "user-1",
      action: "case_flow.connector.completed",
      entityType: "ConnectorRun",
      entityId: "run-1",
      status: "COMPLETE",
      durationMs: 321,
      connectorId: "rastreio",
      errorCode: "123.456.789-00",
      version: "1.2.0",
      reference: "123.456.789-00"
    });

    const metadata = JSON.parse(create.mock.calls[0][0].data.metadataJson);
    expect(metadata).toEqual(expect.objectContaining({
      status: "COMPLETE",
      durationMs: 321,
      connectorId: "rastreio",
      version: "1.2.0",
      referenceMasked: "12***00"
    }));
    expect(metadata.referenceHash).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(metadata).not.toHaveProperty("errorCode");
    expect(JSON.stringify(metadata)).not.toContain("123.456.789-00");
    expect(JSON.stringify(metadata)).not.toContain("secret");
  });

  it("uses conservative defaults and requires explicit screenshot opt-in", () => {
    expect(caseFlowRetentionPolicy({})).toEqual({ conversationDays: 30, diagnosticDays: 7, cacheMinutes: 15, screenshotsEnabled: false });
    expect(caseFlowRetentionPolicy({
      CASE_FLOW_CONVERSATION_RETENTION_DAYS: "14",
      CASE_FLOW_DIAGNOSTIC_RETENTION_DAYS: "invalid",
      CASE_FLOW_CACHE_RETENTION_MINUTES: "0",
      CASE_FLOW_SCREENSHOTS_ENABLED: "TRUE"
    })).toEqual({ conversationDays: 14, diagnosticDays: 7, cacheMinutes: 15, screenshotsEnabled: false });
  });

  it("calculates configurable retention cutoffs", () => {
    const now = new Date("2026-07-12T12:00:00.000Z");
    expect(caseFlowRetentionCutoffs({ conversationDays: 2, diagnosticDays: 1, cacheMinutes: 10, screenshotsEnabled: false }, now)).toEqual({
      conversation: new Date("2026-07-10T12:00:00.000Z"),
      diagnostics: new Date("2026-07-11T12:00:00.000Z"),
      cache: new Date("2026-07-12T11:50:00.000Z")
    });
  });

  it("purges only expired diagnostics in the tenant", async () => {
    const updateRuns = vi.fn().mockResolvedValue({ count: 2 });
    const updateHealth = vi.fn().mockResolvedValue({ count: 1 });
    const prisma = {
      connectorRun: { updateMany: updateRuns },
      connectorHealthEvent: { updateMany: updateHealth },
      $transaction: vi.fn().mockImplementation(async (operations) => Promise.all(operations))
    };
    const now = new Date("2026-07-12T12:00:00.000Z");

    await expect(purgeExpiredCaseFlowDiagnostics(prisma as never, { organizationId: "org-1" }, {
      policy: { conversationDays: 30, diagnosticDays: 7, cacheMinutes: 15, screenshotsEnabled: false }, now
    })).resolves.toEqual({ cutoff: new Date("2026-07-05T12:00:00.000Z"), connectorRuns: 2, healthEvents: 1 });
    expect(updateRuns).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ organizationId: "org-1" }), data: { diagnosticsJson: null } }));
    expect(updateHealth).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ organizationId: "org-1" }), data: { diagnosticsJson: null } }));
  });

  it("deletes a case and its owned data only after tenant scoping", async () => {
    const deletes = {
      conflict: vi.fn(), fact: vi.fn(), run: vi.fn(), source: vi.fn(), serviceCase: vi.fn()
    };
    const transaction = {
      evidenceConflict: { deleteMany: deletes.conflict }, evidenceFact: { deleteMany: deletes.fact },
      connectorRun: { deleteMany: deletes.run }, serviceCaseSource: { deleteMany: deletes.source },
      serviceCase: { deleteMany: deletes.serviceCase }
    };
    const prisma = {
      serviceCase: { findFirst: vi.fn().mockResolvedValue({ id: "case-1" }) },
      $transaction: vi.fn().mockImplementation(async (callback) => callback(transaction))
    };

    await expect(deleteServiceCaseData(prisma as never, { organizationId: "org-1" }, "case-1")).resolves.toBe(true);
    expect(deletes.serviceCase).toHaveBeenCalledWith({ where: { id: "case-1", organizationId: "org-1" } });
    for (const remove of [deletes.conflict, deletes.fact, deletes.run, deletes.source]) {
      expect(remove).toHaveBeenCalledWith({ where: { caseId: "case-1", organizationId: "org-1" } });
    }
  });
});
