import { describe, expect, it, vi } from "vitest";
import { createEvidenceFact, EvidenceFactError } from "./evidence.service.js";

const input = { id: "fact-1", key: "order.status", value: "paid", normalizedValue: "PAID", sourceSystem: "YAMPI", observedAt: new Date("2026-07-12T10:00:00Z"), confidence: 0.9, freshness: "FRESH" as const, sensitivity: "INTERNAL" as const, acquisition: "SCRAPED" as const, connectorRunId: "run-1" };

function prismaMock(existing: unknown = null, run: unknown = { id: "run-1" }) {
  return { serviceCase: { findFirst: vi.fn().mockResolvedValue({ id: "case-1" }) }, evidenceFact: { findUnique: vi.fn().mockResolvedValue(existing), create: vi.fn().mockResolvedValue({ ...input, caseId: "case-1" }) }, connectorRun: { findFirst: vi.fn().mockResolvedValue(run) } };
}

describe("EvidenceFact service", () => {
  it("persists normalized evidence with tenant and case scope", async () => {
    const prisma = prismaMock();
    await createEvidenceFact(prisma as never, { organizationId: "org-1" }, "case-1", input);
    expect(prisma.connectorRun.findFirst).toHaveBeenCalledWith({ where: { id: "run-1", caseId: "case-1", organizationId: "org-1" }, select: { id: true } });
    expect(prisma.evidenceFact.create).toHaveBeenCalledWith({ data: expect.objectContaining({ organizationId: "org-1", caseId: "case-1", valueJson: '"paid"', normalizedValueJson: '"PAID"' }) });
  });

  it("is idempotent for the same fact and rejects cross-case reuse", async () => {
    const same = { organizationId: "org-1", caseId: "case-1", key: input.key, valueJson: '"paid"', normalizedValueJson: '"PAID"' };
    expect(await createEvidenceFact(prismaMock(same) as never, { organizationId: "org-1" }, "case-1", input)).toBe(same);
    await expect(createEvidenceFact(prismaMock({ ...same, caseId: "case-2" }) as never, { organizationId: "org-1" }, "case-1", input)).rejects.toEqual(new EvidenceFactError("IDEMPOTENCY_CONFLICT"));
  });

  it("rejects a connector run from another case", async () => {
    await expect(createEvidenceFact(prismaMock(null, null) as never, { organizationId: "org-1" }, "case-1", input)).rejects.toEqual(new EvidenceFactError("SCOPE_MISMATCH"));
  });
});
