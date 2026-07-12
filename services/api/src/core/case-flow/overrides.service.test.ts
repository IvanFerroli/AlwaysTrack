import { describe, expect, it, vi } from "vitest";
import { createFlowClassificationOverride, getCaseOverrideState, HumanOverrideError, undoHumanOverride } from "./overrides.service.js";

const actor = { id: "user-1", name: "Agent", email: "agent@example.com", role: "SAC" as const, organizationId: "org-1", unitScopeIds: [], sectorScopeIds: [] };
const createdMetadata = JSON.stringify({ caseId: "case-1", kind: "MANUAL_EVIDENCE", cause: "CONNECTOR_GAP", payload: { factId: "fact-1" } });

describe("human overrides", () => {
  it("records flow correction with original candidate, actor, tenant and reason", async () => {
    const db = {
      serviceCase: { findFirst: vi.fn().mockResolvedValue({ id: "case-1" }) },
      auditLog: { create: vi.fn().mockResolvedValue({ id: "audit-1" }) }
    };
    const result = await createFlowClassificationOverride(db as never, actor, "case-1", {
      suggestedFlowId: "AUTO", chosenFlowId: "HUMAN", reason: "Rule selected the wrong intent", cause: "RULE_ERROR"
    });
    expect(result.recomputed).toBeNull();
    expect(db.auditLog.create).toHaveBeenCalledWith({ data: expect.objectContaining({ organizationId: "org-1", actorId: "user-1", entityType: "CaseFlowHumanOverride" }) });
    const metadata = JSON.parse(db.auditLog.create.mock.calls[0][0].data.metadataJson);
    expect(metadata).toMatchObject({ caseId: "case-1", reason: "Rule selected the wrong intent", cause: "RULE_ERROR", payload: { suggestedFlowId: "AUTO", chosenFlowId: "HUMAN" } });
  });

  it("rejects missing reason before writing an override", async () => {
    const db = { serviceCase: { findFirst: vi.fn() }, auditLog: { create: vi.fn() } };
    await expect(createFlowClassificationOverride(db as never, actor, "case-1", {
      suggestedFlowId: "AUTO", chosenFlowId: "HUMAN", reason: " ", cause: "RULE_ERROR"
    })).rejects.toEqual(new HumanOverrideError("INVALID_INPUT"));
    expect(db.auditLog.create).not.toHaveBeenCalled();
  });

  it("derives undone manual evidence without deleting its original event", async () => {
    const events = [
      { entityId: "override-1", action: "case_flow.override.manual_evidence.created", metadataJson: createdMetadata, createdAt: new Date("2026-07-12T10:00:00Z") },
      { entityId: "undo-1", action: "case_flow.override.undone", metadataJson: JSON.stringify({ caseId: "case-1", targetOverrideId: "override-1" }), createdAt: new Date("2026-07-12T11:00:00Z") }
    ];
    const db = { auditLog: { findMany: vi.fn().mockResolvedValue(events) } };
    const state = await getCaseOverrideState(db as never, actor, "case-1");
    expect(state.undoneManualFactIds).toEqual(new Set(["fact-1"]));
    expect(events).toHaveLength(2);
  });

  it("undoes a conflict through compensation and appends an audit event", async () => {
    const target = { entityId: "override-1", action: "case_flow.override.conflict_resolution.created", metadataJson: JSON.stringify({ caseId: "case-1", kind: "CONFLICT_RESOLUTION", payload: { conflictId: "conflict-1" } }) };
    const db = {
      serviceCase: { findFirst: vi.fn().mockResolvedValue({ id: "case-1" }) },
      auditLog: { findFirst: vi.fn().mockResolvedValue(target), findMany: vi.fn().mockResolvedValue([]), create: vi.fn().mockResolvedValue({}) },
      evidenceConflict: { findFirst: vi.fn().mockResolvedValue({ id: "conflict-1" }), update: vi.fn().mockResolvedValue({}) }
    };
    await undoHumanOverride(db as never, actor, "case-1", "override-1", { reason: "Operator corrected the choice" });
    expect(db.evidenceConflict.update).toHaveBeenCalledWith({ where: { id: "conflict-1" }, data: expect.objectContaining({ status: "OPEN", chosenFactId: null }) });
    expect(db.auditLog.create).toHaveBeenCalledWith({ data: expect.objectContaining({ action: "case_flow.override.undone", actorId: "user-1" }) });
  });
});
