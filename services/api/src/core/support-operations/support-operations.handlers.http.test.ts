import { beforeEach, describe, expect, it, vi } from "vitest";
import { jsonEnvelope, requestHandler } from "../../test-support/http-handler-harness.js";

const service = vi.hoisted(() => ({
  bookSupportPauseSlot: vi.fn(),
  cancelSupportPauseBooking: vi.fn(),
  cancelSupportPauseSwap: vi.fn(),
  createSupportCampaign: vi.fn(),
  createSupportKpiEntry: vi.fn(),
  createSupportPauseSlot: vi.fn(),
  decideSupportPauseSwap: vi.fn(),
  getSupportDashboard: vi.fn(),
  listSupportCampaigns: vi.fn(),
  listSupportPauses: vi.fn(),
  listSupportPerformance: vi.fn(),
  requestSupportPauseSwap: vi.fn(),
  reviewSupportKpiEntry: vi.fn(),
  submitSupportKpiEntry: vi.fn(),
  updateSupportCampaign: vi.fn(),
  updateSupportKpiEntry: vi.fn(),
  updateSupportPausePolicy: vi.fn()
}));

vi.mock("../db/prisma.js", () => ({ prisma: { mocked: true } }));
vi.mock("./support-operations.service.js", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./support-operations.service.js")>()),
  ...service
}));

import {
  createSupportKpiEntryHandler,
  listSupportPerformanceHandler,
  reviewSupportKpiEntryHandler,
  submitSupportKpiEntryHandler,
  updateSupportKpiEntryHandler
} from "./support-operations.handlers.js";
import { SupportOperationsError } from "./support-operations.service.js";

describe("support operations HTTP handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.values(service).forEach((mock) => mock.mockResolvedValue({ id: "result-1" }));
  });

  it.each([
    ["list", listSupportPerformanceHandler, service.listSupportPerformance, "get", "/v1/support/performance", "/v1/support/performance", undefined, 200],
    ["create", createSupportKpiEntryHandler, service.createSupportKpiEntry, "post", "/v1/support/performance/entries", "/v1/support/performance/entries", { metric: "CSAT" }, 200],
    ["update", updateSupportKpiEntryHandler, service.updateSupportKpiEntry, "patch", "/v1/support/performance/entries/kpi-1", "/v1/support/performance/entries/:entryId", { value: 95 }, 200],
    ["submit", submitSupportKpiEntryHandler, service.submitSupportKpiEntry, "post", "/v1/support/performance/entries/kpi-1/submit", "/v1/support/performance/entries/:entryId/submit", undefined, 200],
    ["review", reviewSupportKpiEntryHandler, service.reviewSupportKpiEntry, "post", "/v1/support/performance/entries/kpi-1/review", "/v1/support/performance/entries/:entryId/review", { decision: "APPROVED" }, 200]
  ] as const)("returns the standard envelope for KPI %s", async (_name, handler, mock, method, path, route, body, status) => {
    const response = await requestHandler({ handler, method, path, route, body });
    expect(response.status).toBe(status);
    expect(await jsonEnvelope(response)).toMatchObject({ ok: true });
    expect(mock.mock.calls[0]?.[1]).toMatchObject({ organizationId: "org-1" });
  });

  it.each([
    [new SupportOperationsError("FORBIDDEN"), 403, "FORBIDDEN"],
    [new SupportOperationsError("CONFLICT"), 409, "CONFLICT"],
    [new SupportOperationsError("INVALID_INPUT"), 400, "INVALID_INPUT"],
    [new SupportOperationsError("NOT_FOUND"), 404, "NOT_FOUND"]
  ])("maps governed KPI failures", async (error, status, code) => {
    service.createSupportKpiEntry.mockRejectedValueOnce(error);
    const response = await requestHandler({ handler: createSupportKpiEntryHandler, method: "post", body: {} });
    expect(response.status).toBe(status);
    expect(await jsonEnvelope(response)).toMatchObject({ ok: false, error: { code } });
  });
});
