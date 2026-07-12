import { describe, expect, it, vi } from "vitest";
import { getHumanOverrideMetrics } from "./metrics.service.js";

const actor = { id: "user-1", name: "Agent", email: "agent@example.com", role: "SAC" as const, organizationId: "org-1", unitScopeIds: [], sectorScopeIds: [] };
const event = (entityId: string, kind: string, cause: string) => ({ entityId, action: `case_flow.override.${kind.toLowerCase()}.created`, metadataJson: JSON.stringify({ kind, cause }), createdAt: new Date() });

describe("human override metrics", () => {
  it("returns typed counts by intervention and correction cause", async () => {
    const db = { auditLog: { findMany: vi.fn().mockResolvedValue([
      event("one", "MANUAL_EVIDENCE", "CONNECTOR_GAP"), event("two", "FLOW_CLASSIFICATION", "RULE_ERROR"),
      { entityId: "undo", action: "case_flow.override.undone", metadataJson: JSON.stringify({ targetOverrideId: "one" }), createdAt: new Date() }
    ]) } };
    await expect(getHumanOverrideMetrics(db as never, actor)).resolves.toEqual({
      total: 2, active: 1, undone: 1,
      byKind: { MANUAL_EVIDENCE: 1, CONFLICT_RESOLUTION: 0, FLOW_CLASSIFICATION: 1 },
      byCause: { CONNECTOR_GAP: 1, RULE_ERROR: 1, HUMAN_DECISION: 0 }
    });
    expect(db.auditLog.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ organizationId: "org-1" }) }));
  });
});
