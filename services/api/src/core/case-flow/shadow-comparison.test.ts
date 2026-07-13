import { describe, expect, it, vi } from "vitest";
import { recordShadowComparison } from "./shadow-comparison.service.js";

describe("shadow comparison", () => {
  it("audits human review differences without representing a real operator", async () => {
    const append = vi.fn();
    const result = await recordShadowComparison({ append }, {
      organizationId: "tenant-a", caseId: "case-a", actorId: "user-a",
      manual: { summary: "Manual", flowKey: "refund", evidenceKeys: ["order", "order"] },
      caseFlow: { summary: "Suggested", flowKey: "tracking", evidenceKeys: ["tracking"] }
    }, { id: () => "comparison-a", now: () => new Date("2026-07-12T12:00:00Z") });
    expect(result).toMatchObject({ actorKind: "HUMAN_REVIEW", differences: ["SUMMARY", "FLOW", "EVIDENCE"] });
    expect(append).toHaveBeenCalledWith(result);
  });
});
