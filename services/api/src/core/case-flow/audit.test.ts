import { describe, expect, it, vi } from "vitest";
import type { CurrentUser } from "@alwaystrack/shared";
import {
  caseFlowRetentionCutoffs,
  caseFlowRetentionPolicy,
  deleteServiceCaseData,
  purgeExpiredCaseFlowData,
  PrivacyAuthorizationError,
  recordCaseFlowAuditEvent
} from "./audit.js";

const admin: CurrentUser = {
  id: "admin-1", organizationId: "org-1", name: "Admin", email: "admin@example.com", role: "ADMIN", unitScopeIds: [], sectorScopeIds: []
};
const agent: CurrentUser = { ...admin, id: "agent-1", role: "SAC" };
const authorization = { requestId: "privacy-request-1", approvedById: "admin-2" };

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
    const updateFacts = vi.fn().mockResolvedValue({ count: 3 });
    const updateRuns = vi.fn().mockResolvedValue({ count: 2 });
    const updateHealth = vi.fn().mockResolvedValue({ count: 1 });
    const prisma = {
      evidenceFact: { updateMany: updateFacts },
      connectorRun: { updateMany: updateRuns },
      connectorHealthEvent: { updateMany: updateHealth },
    };
    const now = new Date("2026-07-12T12:00:00.000Z");

    await expect(purgeExpiredCaseFlowData(prisma as never, { organizationId: "org-1" }, {
      policy: { conversationDays: 30, diagnosticDays: 7, cacheMinutes: 15, screenshotsEnabled: false }, now, dryRun: false
    })).resolves.toEqual({
      cutoffs: {
        conversation: new Date("2026-06-12T12:00:00.000Z"), diagnostics: new Date("2026-07-05T12:00:00.000Z")
      },
      dryRun: false, conversationFacts: 3, connectorRuns: 2, healthEvents: 1, failures: []
    });
    expect(updateFacts).toHaveBeenCalledWith({
      where: {
        organizationId: "org-1",
        collectedAt: { lt: new Date("2026-06-12T12:00:00.000Z") },
        key: { startsWith: "conversation." },
        valueJson: { not: '"[retention-purged]"' }
      },
      data: { valueJson: '"[retention-purged]"', normalizedValueJson: '"[retention-purged]"' }
    });
    expect(updateRuns).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ organizationId: "org-1" }), data: { diagnosticsJson: null } }));
    expect(updateHealth).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ organizationId: "org-1" }), data: { diagnosticsJson: null } }));
  });

  it("defaults to dry-run and never updates diagnostics", async () => {
    const countRuns = vi.fn().mockResolvedValue(2);
    const countHealth = vi.fn().mockResolvedValue(1);
    const countFacts = vi.fn().mockResolvedValue(3);
    const updateFacts = vi.fn();
    const updateRuns = vi.fn();
    const updateHealth = vi.fn();
    const prisma = {
      evidenceFact: { count: countFacts, updateMany: updateFacts },
      connectorRun: { count: countRuns, updateMany: updateRuns },
      connectorHealthEvent: { count: countHealth, updateMany: updateHealth }
    };

    await expect(purgeExpiredCaseFlowData(prisma as never, { organizationId: "org-1" })).resolves.toEqual(
      expect.objectContaining({ dryRun: true, conversationFacts: 3, connectorRuns: 2, healthEvents: 1, failures: [] })
    );
    expect(countRuns).toHaveBeenCalledWith({ where: expect.objectContaining({ organizationId: "org-1" }) });
    expect(countHealth).toHaveBeenCalledWith({ where: expect.objectContaining({ organizationId: "org-1" }) });
    expect(updateRuns).not.toHaveBeenCalled();
    expect(updateHealth).not.toHaveBeenCalled();
    expect(updateFacts).not.toHaveBeenCalled();
  });

  it("deletes a case and its owned data only after admin authorization and tenant scoping", async () => {
    const deletes = {
      conflict: vi.fn(), fact: vi.fn(), run: vi.fn(), source: vi.fn(), serviceCase: vi.fn()
    };
    const clearPrimarySource = vi.fn();
    const transaction = {
      evidenceConflict: { deleteMany: deletes.conflict }, evidenceFact: { deleteMany: deletes.fact },
      connectorRun: { deleteMany: deletes.run }, serviceCaseSource: { deleteMany: deletes.source },
      serviceCase: { updateMany: clearPrimarySource, deleteMany: deletes.serviceCase }
    };
    const prisma = {
      user: { findFirst: vi.fn().mockResolvedValue({ id: "admin-2" }) },
      serviceCase: { findFirst: vi.fn().mockResolvedValue({ id: "case-1" }) },
      auditLog: { create: vi.fn().mockResolvedValue({ id: "audit-1" }) },
      $transaction: vi.fn().mockImplementation(async (callback) => callback(transaction))
    };

    await expect(deleteServiceCaseData(prisma as never, admin, "case-1", { dryRun: false, authorization })).resolves.toEqual({
      status: "completed", dryRun: false, deleted: true
    });
    expect(deletes.serviceCase).toHaveBeenCalledWith({ where: { id: "case-1", organizationId: "org-1" } });
    expect(clearPrimarySource).toHaveBeenCalledWith({
      where: { id: "case-1", organizationId: "org-1" }, data: { primarySourceId: null }
    });
    for (const remove of [deletes.conflict, deletes.fact, deletes.run, deletes.source]) {
      expect(remove).toHaveBeenCalledWith({ where: { caseId: "case-1", organizationId: "org-1" } });
    }
    expect(JSON.stringify(prisma.auditLog.create.mock.calls)).not.toContain("case-1");
    expect(JSON.stringify(prisma.auditLog.create.mock.calls)).not.toContain("privacy-request-1");
  });

  it("rejects non-admin deletion before reading or deleting case data", async () => {
    const prisma = {
      serviceCase: { findFirst: vi.fn() },
      auditLog: { create: vi.fn().mockResolvedValue({ id: "audit-1" }) },
      $transaction: vi.fn()
    };

    await expect(deleteServiceCaseData(prisma as never, agent, "case-foreign", { dryRun: false }))
      .rejects.toBeInstanceOf(PrivacyAuthorizationError);
    expect(prisma.serviceCase.findFirst).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(JSON.stringify(prisma.auditLog.create.mock.calls)).not.toContain("case-foreign");
  });

  it("requires a distinct active admin approver before looking up destructive targets", async () => {
    const prisma = {
      user: { findFirst: vi.fn() },
      serviceCase: { findFirst: vi.fn() },
      auditLog: { create: vi.fn().mockResolvedValue({ id: "audit-1" }) },
      $transaction: vi.fn()
    };

    await expect(deleteServiceCaseData(prisma as never, admin, "case-1", {
      dryRun: false,
      authorization: { requestId: "privacy-request-1", approvedById: admin.id }
    })).rejects.toBeInstanceOf(PrivacyAuthorizationError);
    expect(prisma.user.findFirst).not.toHaveBeenCalled();
    expect(prisma.serviceCase.findFirst).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("returns the same not-found result for a foreign case and an idempotent retry", async () => {
    const prisma = {
      user: { findFirst: vi.fn().mockResolvedValue({ id: "admin-2" }) },
      serviceCase: { findFirst: vi.fn().mockResolvedValue(null) },
      auditLog: { create: vi.fn().mockResolvedValue({ id: "audit-1" }) },
      $transaction: vi.fn()
    };

    await expect(deleteServiceCaseData(prisma as never, admin, "case-from-org-2", { dryRun: false, authorization })).resolves.toEqual({
      status: "not_found", dryRun: false, deleted: false
    });
    expect(prisma.serviceCase.findFirst).toHaveBeenCalledWith({
      where: { id: "case-from-org-2", organizationId: "org-1" }, select: { id: true }
    });
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(JSON.stringify(prisma.auditLog.create.mock.calls)).not.toContain("case-from-org-2");
  });

  it("records a redacted failure after a transactional deletion error", async () => {
    const prisma = {
      user: { findFirst: vi.fn().mockResolvedValue({ id: "admin-2" }) },
      serviceCase: { findFirst: vi.fn().mockResolvedValue({ id: "case-secret" }) },
      auditLog: { create: vi.fn().mockResolvedValue({ id: "audit-1" }) },
      $transaction: vi.fn().mockRejectedValue(new Error("database error with case-secret"))
    };

    await expect(deleteServiceCaseData(prisma as never, admin, "case-secret", { dryRun: false, authorization })).rejects.toThrow("database error");
    const auditPayload = JSON.stringify(prisma.auditLog.create.mock.calls);
    expect(auditPayload).toContain("privacy.deletion.failed");
    expect(auditPayload).toContain("DELETE_FAILED");
    expect(auditPayload).not.toContain("case-secret");
    expect(auditPayload).not.toContain("database error");
  });
});
