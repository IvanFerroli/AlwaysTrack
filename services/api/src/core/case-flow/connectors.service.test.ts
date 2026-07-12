import { describe, expect, it, vi } from "vitest";
import { ConnectorRunError, finishConnectorRun, retryConnectorRun, startApplicableConnectorRuns, startConnectorRun } from "./connectors.service.js";

const input = { runId: "run-1", connectorDefinitionId: "connector-1", installationId: "installation-1", userId: "user-1", browserProfileId: "browser-1", wave: 1 };
function prismaMock(existing: unknown = null) { return { serviceCase: { findFirst: vi.fn().mockResolvedValue({ id: "case-1" }) }, connectorDefinition: { findFirst: vi.fn().mockResolvedValue({ id: "connector-1" }) }, companionInstallation: { findFirst: vi.fn().mockResolvedValue({ id: "installation-1" }) }, connectorRun: { findUnique: vi.fn().mockResolvedValue(existing), findFirst: vi.fn(), create: vi.fn().mockResolvedValue({ id: "run-1", status: "QUEUED" }), update: vi.fn() } }; }

describe("ConnectorRun ledger", () => {
  it("creates scoped runs and returns the same run idempotently", async () => {
    const prisma = prismaMock();
    await startConnectorRun(prisma as never, { organizationId: "org-1" }, "case-1", input);
    expect(prisma.companionInstallation.findFirst).toHaveBeenCalledWith({ where: expect.objectContaining({ organizationId: "org-1", userId: "user-1", browserProfileId: "browser-1" }), select: { id: true } });
    expect(prisma.connectorRun.create).toHaveBeenCalledWith({ data: expect.objectContaining({ id: "run-1", organizationId: "org-1", caseId: "case-1" }) });
    const existing = { id: "run-1", organizationId: "org-1", caseId: "case-1", connectorDefinitionId: "connector-1" };
    expect(await startConnectorRun(prismaMock(existing) as never, { organizationId: "org-1" }, "case-1", input)).toBe(existing);
  });

  it("starts every applicable connector and rejects silent duplicates", async () => {
    const prisma = prismaMock();
    await startApplicableConnectorRuns(prisma as never, { organizationId: "org-1" }, "case-1", [input, { ...input, runId: "run-2", connectorDefinitionId: "connector-2" }]);
    expect(prisma.connectorRun.create).toHaveBeenCalledTimes(2);
    await expect(startApplicableConnectorRuns(prisma as never, { organizationId: "org-1" }, "case-1", [input, { ...input, runId: "run-2" }])).rejects.toEqual(new ConnectorRunError("INVALID_INPUT"));
  });

  it("records visible terminal diagnostics and supports an individual retry", async () => {
    const prisma = prismaMock();
    prisma.connectorRun.findFirst.mockResolvedValueOnce({ id: "run-1", status: "SEARCHING" });
    prisma.connectorRun.update.mockResolvedValue({ id: "run-1", status: "BLOCKED_CAPTCHA" });
    await finishConnectorRun(prisma as never, { organizationId: "org-1" }, "case-1", "run-1", { status: "BLOCKED_CAPTCHA", warnings: ["captcha"], interventionCode: "CAPTCHA" });
    expect(prisma.connectorRun.update).toHaveBeenCalledWith({ where: { id: "run-1" }, data: expect.objectContaining({ status: "BLOCKED_CAPTCHA", warningsJson: '["captcha"]', interventionCode: "CAPTCHA" }) });
    prisma.connectorRun.findFirst.mockResolvedValueOnce({ ...input, id: "run-1", status: "FAILED_TIMEOUT" });
    await retryConnectorRun(prisma as never, { organizationId: "org-1" }, "case-1", "run-1", "run-2");
    expect(prisma.connectorRun.create).toHaveBeenLastCalledWith({ data: expect.objectContaining({ id: "run-2", connectorDefinitionId: "connector-1", status: "QUEUED" }) });
  });
});
