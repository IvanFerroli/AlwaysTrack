import { describe, expect, it, vi } from "vitest";
import { createEvidenceConflict, EvidenceConflictError, preferredFact, resolveEvidenceConflict, sourceAbsenceMeaning } from "./conflicts.service.js";

describe("Evidence conflicts", () => {
  it("selects configured authority without discarding divergent facts", () => {
    const facts = [{ id: "rastreio", sourceSystem: "RASTREIO" }, { id: "carrier", sourceSystem: "CARRIER" }];
    expect(preferredFact("logistics.status", facts)?.id).toBe("carrier");
    expect(facts).toHaveLength(2);
    expect(sourceAbsenceMeaning).toBe("NOT_FOUND_IN_SOURCE");
  });

  it("creates an open conflict only from facts in the same tenant and case", async () => {
    const prisma = { serviceCase: { findFirst: vi.fn().mockResolvedValue({ id: "case-1" }) }, evidenceFact: { findMany: vi.fn().mockResolvedValue([{ id: "fact-1", key: "order.status" }, { id: "fact-2", key: "order.status" }]) }, evidenceConflict: { findUnique: vi.fn().mockResolvedValue(null), create: vi.fn().mockResolvedValue({ id: "conflict-1", status: "OPEN" }) } };
    await createEvidenceConflict(prisma as never, { organizationId: "org-1" }, "case-1", { id: "conflict-1", key: "order.status", factIds: ["fact-2", "fact-1"] });
    expect(prisma.evidenceFact.findMany).toHaveBeenCalledWith({ where: { id: { in: ["fact-1", "fact-2"] }, caseId: "case-1", organizationId: "org-1" }, select: { id: true, key: true } });
    expect(prisma.evidenceConflict.create).toHaveBeenCalledWith({ data: expect.objectContaining({ factIdsJson: '["fact-1","fact-2"]', status: "OPEN" }) });
  });

  it("rejects mixed-case facts and preserves originals during resolution", async () => {
    const mixed = { serviceCase: { findFirst: vi.fn().mockResolvedValue({ id: "case-1" }) }, evidenceFact: { findMany: vi.fn().mockResolvedValue([{ id: "fact-1", key: "order.status" }]) }, evidenceConflict: { findUnique: vi.fn().mockResolvedValue(null) } };
    await expect(createEvidenceConflict(mixed as never, { organizationId: "org-1" }, "case-1", { id: "conflict-1", key: "order.status", factIds: ["fact-1", "fact-2"] })).rejects.toEqual(new EvidenceConflictError("SCOPE_MISMATCH"));
    const prisma = { evidenceConflict: { findFirst: vi.fn().mockResolvedValue({ id: "conflict-1", status: "OPEN", factIdsJson: '["fact-1","fact-2"]' }), update: vi.fn().mockResolvedValue({ id: "conflict-1", status: "RESOLVED" }) } };
    await resolveEvidenceConflict(prisma as never, { organizationId: "org-1", actorId: "user-1" }, "case-1", "conflict-1", { chosenFactId: "fact-2", reason: "confirmed", resolvedBy: "USER" });
    expect(prisma.evidenceConflict.update).toHaveBeenCalledWith({ where: { id: "conflict-1" }, data: expect.objectContaining({ chosenFactId: "fact-2", resolvedByKind: "USER" }) });
  });
});
