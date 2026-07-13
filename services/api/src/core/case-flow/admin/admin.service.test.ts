import { describe, expect, it, vi } from "vitest";
import { CaseFlowAdminError, createHeuristicRuleVersion, exportCaseFlowConfig, listAdminCases, restoreCaseFlowConfig, updateConnectorAdmin } from "./admin.service.js";

const admin = { id: "admin-1", name: "Admin", email: "admin@example.com", role: "ADMIN" as const, organizationId: "org-1", unitScopeIds: [], sectorScopeIds: [] };
const sac = { ...admin, role: "SAC" as const };

describe("CaseFlow admin", () => {
  it("denies non-admin access before querying data", async () => {
    const db = { serviceCase: { findMany: vi.fn() } };
    await expect(listAdminCases(db as never, sac)).rejects.toEqual(new CaseFlowAdminError("FORBIDDEN"));
    expect(db.serviceCase.findMany).not.toHaveBeenCalled();
  });

  it("scopes history to the authenticated organization", async () => {
    const db = { serviceCase: { findMany: vi.fn(), count: vi.fn() }, $transaction: vi.fn().mockResolvedValue([[], 0]) };
    await listAdminCases(db as never, admin);
    expect(db.serviceCase.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { organizationId: "org-1", status: undefined } }));
  });

  it("rejects credential-shaped connector configuration", async () => {
    await expect(updateConnectorAdmin({} as never, admin, "connector-1", { cookie: "secret" })).rejects.toEqual(new CaseFlowAdminError("INVALID_INPUT"));
  });

  it("creates heuristic versions transactionally and rejects version reuse", async () => {
    const tx = { auditLog: { findMany: vi.fn().mockResolvedValue([{ metadataJson: JSON.stringify({ rule: { code: "TRACK", version: 2 } }) }]), create: vi.fn() } };
    const db = { $transaction: vi.fn((callback) => callback(tx)) };
    const rule = { id: "rule-track", code: "TRACK", version: 2, active: true, priority: 1, flowId: "tracking", weight: 1, hardMatch: false, conditions: [{ operator: "exists", factKey: "tracking.code" }], exclusions: [], requiredFacts: [], producedTags: [], riskEffects: [] };
    await expect(createHeuristicRuleVersion(db as never, admin, rule)).rejects.toEqual(new CaseFlowAdminError("CONFLICT"));
    expect(tx.auditLog.create).not.toHaveBeenCalled();
  });

  it("exports no installation credentials and validates restore checksum before a transaction", async () => {
    const db = { serviceFlow: { findMany: vi.fn().mockResolvedValue([]) }, connectorDefinition: { findMany: vi.fn().mockResolvedValue([]) }, auditLog: { findMany: vi.fn().mockResolvedValue([]) }, $transaction: vi.fn() };
    const exported = await exportCaseFlowConfig(db as never, admin);
    expect(JSON.stringify(exported)).not.toMatch(/credentialHash|cookie|password|token/i);
    await expect(restoreCaseFlowConfig(db as never, admin, { payload: exported.payload, checksum: "wrong" })).rejects.toEqual(new CaseFlowAdminError("INVALID_INPUT"));
    expect(db.$transaction).not.toHaveBeenCalled();
  });
});
