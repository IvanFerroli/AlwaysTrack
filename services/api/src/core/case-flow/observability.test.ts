import { describe, expect, it, vi } from "vitest";
import { caseFlowSloTargetsMs, getCaseFlowSuccessMetrics, getConnectorHealthMetrics, recordCaseFlowMetric, sanitizeCaseFlowMetric } from "./metrics.service.js";

const actor = { id: "user-a", organizationId: "tenant-a" } as never;
const now = new Date("2026-07-12T12:00:00.000Z");

describe("CaseFlow observability", () => {
  it("uses the specified SLOs and persists only metric allowlist fields", async () => {
    expect(caseFlowSloTargetsMs).toEqual({ sidePanelInteractive: 500, intakeVisible: 2000, firstPartialSummary: 3000, firstActionableFlow: 5000, slowConnector: 10000, connectorTimeout: 30000 });
    expect(sanitizeCaseFlowMetric({ caseId: "case-a", milestone: "firstPartialSummary", durationMs: 2999 })).toMatchObject({ durationMs: 2999, sloMet: true });
    const db = { serviceCase: { findFirst: vi.fn().mockResolvedValue({ id: "case-a" }) }, auditLog: { create: vi.fn().mockResolvedValue({ id: "metric-a" }) } };
    await recordCaseFlowMetric(db as never, actor, { caseId: "case-a", counter: "clicks", value: 2 } as never, now);
    const data = db.auditLog.create.mock.calls[0][0].data;
    expect(data).toMatchObject({ organizationId: "tenant-a", entityId: "case-a", createdAt: now });
    expect(data.metadataJson).toBe('{"counter":"clicks","value":2}');
    expect(data.metadataJson).not.toContain("case-a");
  });

  it("aggregates connector health for one tenant with deterministic percentiles", async () => {
    const db = {
      connectorDefinition: { findMany: vi.fn().mockResolvedValue([{ id: "def-a", connectorId: "FAKE_A", displayName: "Fake A", version: "1.0.0" }]) },
      connectorRun: { findMany: vi.fn().mockResolvedValue([
        { connectorDefinitionId: "def-a", status: "COMPLETE", startedAt: new Date("2026-07-12T11:00:00Z"), finishedAt: new Date("2026-07-12T11:00:01Z") },
        { connectorDefinitionId: "def-a", status: "FAILED_TIMEOUT", startedAt: new Date("2026-07-12T10:00:00Z"), finishedAt: new Date("2026-07-12T10:00:03Z") }
      ]) },
      connectorHealthEvent: { findMany: vi.fn().mockResolvedValue([{ connectorDefinitionId: "def-a", state: "DEGRADED", eventCode: "CAPTCHA", checkedAt: new Date("2026-07-12T11:30:00Z") }]) }
    };
    const result = await getConnectorHealthMetrics(db as never, actor, now);
    expect(db.connectorRun.findMany).toHaveBeenCalledWith({ where: { organizationId: "tenant-a", startedAt: { gte: new Date("2026-07-11T12:00:00Z") } }, orderBy: { startedAt: "desc" } });
    expect(result[0]).toMatchObject({ state: "DEGRADED", successRate24h: 0.5, medianMs: 1000, p95Ms: 3000, lastCaptchaAt: "2026-07-12T11:30:00.000Z" });
  });

  it("reports daily ergonomic success without message content", async () => {
    const events = [
      { entityId: "case-a", metadataJson: '{"counter":"clicks","value":3}', createdAt: now },
      { entityId: "case-a", metadataJson: '{"counter":"copiedMessages","value":1,"resolvedWithoutChatGpt":true}', createdAt: now },
      { entityId: "case-b", metadataJson: '{"milestone":"firstActionableFlow","durationMs":4200,"connectorId":"FAKE_A","connectorOutcome":"SUCCESS"}', createdAt: now }
    ];
    const db = { auditLog: { findMany: vi.fn().mockResolvedValue(events) } };
    await expect(getCaseFlowSuccessMetrics(db as never, actor, now)).resolves.toMatchObject({ dailyCases: 2, medianReadyMs: 4200, clicks: 3, copiedMessages: 1, resolvedWithoutChatGpt: 1, connectors: [{ connectorId: "FAKE_A", total: 1, successRate: 1 }] });
  });
});
