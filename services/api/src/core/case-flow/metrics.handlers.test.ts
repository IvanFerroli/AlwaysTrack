import { describe, expect, it, vi } from "vitest";
import { createCaseFlowMetricsHandlers } from "./metrics.handlers.js";

function response() {
  const result = { status: vi.fn(), json: vi.fn() };
  result.status.mockReturnValue(result);
  return result;
}
const actor = { id: "user-a", organizationId: "tenant-a" };
const fixed = new Date("2026-07-12T12:00:00.000Z");

describe("CaseFlow metric handlers", () => {
  it("records a tenant-scoped redacted metric with the injected clock", async () => {
    const db = { serviceCase: { findFirst: vi.fn().mockResolvedValue({ id: "case-a" }) }, auditLog: { create: vi.fn().mockResolvedValue({}) } };
    const res = response();
    await createCaseFlowMetricsHandlers(db as never, () => fixed).record({ user: actor, params: { caseId: "case-a" }, body: { counter: "clicks", value: 1, rawText: "private" } } as never, res as never);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(db.auditLog.create.mock.calls[0][0].data).toMatchObject({ organizationId: "tenant-a", createdAt: fixed, metadataJson: '{"counter":"clicks","value":1}' });
  });

  it("requires authentication before health data is queried", async () => {
    const db = { connectorDefinition: { findMany: vi.fn() } };
    const res = response();
    await createCaseFlowMetricsHandlers(db as never, () => fixed).health({} as never, res as never);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(db.connectorDefinition.findMany).not.toHaveBeenCalled();
  });
});
