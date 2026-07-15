import { beforeEach, describe, expect, it, vi } from "vitest";
import { jsonEnvelope, requestHandler } from "../../test-support/http-handler-harness.js";

const service = vi.hoisted(() => ({
  exportReportCsv: vi.fn(),
  parseReportFilters: vi.fn((query) => query),
  runReport: vi.fn()
}));

vi.mock("../db/prisma.js", () => ({ prisma: { mocked: true } }));
vi.mock("./reports.service.js", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./reports.service.js")>()),
  ...service
}));

import * as handlers from "./reports.handlers.js";
import { ReportError } from "./reports.service.js";

const jsonHandlers = [
  { handler: handlers.expiredLicensesReportHandler, path: "/v1/reports/licenses/expired" },
  { handler: handlers.expiringLicensesReportHandler, path: "/v1/reports/licenses/expiring" },
  { handler: handlers.rtSummaryReportHandler, path: "/v1/reports/groups/rt" },
  { handler: handlers.areaSummaryReportHandler, path: "/v1/reports/groups/areas" },
  { handler: handlers.pendingDocumentsReportHandler, path: "/v1/reports/documents/pending" },
  { handler: handlers.rejectedDocumentsReportHandler, path: "/v1/reports/documents/rejected" },
  { handler: handlers.notificationsReportHandler, path: "/v1/reports/notifications" },
  { handler: handlers.regularizationReportHandler, path: "/v1/reports/regularization" }
];
const csvHandlers = [
  { handler: handlers.expiredLicensesCsvReportHandler, path: "/v1/reports/licenses/expired/csv" },
  { handler: handlers.expiringLicensesCsvReportHandler, path: "/v1/reports/licenses/expiring/csv" },
  { handler: handlers.rtSummaryCsvReportHandler, path: "/v1/reports/groups/rt/csv" },
  { handler: handlers.areaSummaryCsvReportHandler, path: "/v1/reports/groups/areas/csv" },
  { handler: handlers.pendingDocumentsCsvReportHandler, path: "/v1/reports/documents/pending/csv" },
  { handler: handlers.rejectedDocumentsCsvReportHandler, path: "/v1/reports/documents/rejected/csv" },
  { handler: handlers.notificationsCsvReportHandler, path: "/v1/reports/notifications/csv" },
  { handler: handlers.regularizationCsvReportHandler, path: "/v1/reports/regularization/csv" }
];

describe("report HTTP handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    service.runReport.mockResolvedValue({ rows: [{ id: "row-1" }] });
    service.exportReportCsv.mockResolvedValue("header\nvalue");
  });

  it.each(jsonHandlers)("returns a tenant-scoped JSON report envelope for $path", async ({ handler, path }) => {
    const response = await requestHandler({ handler, path: `${path}?unitId=unit-1`, route: path });
    expect(response.status).toBe(200);
    expect(await jsonEnvelope(response)).toMatchObject({ ok: true, data: { rows: [{ id: "row-1" }] } });
    expect(service.runReport.mock.calls.at(-1)?.[1]).toMatchObject({ id: "admin-1", organizationId: "org-1" });
  });

  it.each(csvHandlers)("returns a CSV attachment for $path", async ({ handler, path }) => {
    const response = await requestHandler({ handler, path, route: path });
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/csv");
    expect(response.headers.get("content-disposition")).toContain("attachment; filename=");
    expect(await response.text()).toBe("header\nvalue");
  });

  it("returns the unauthenticated envelope before report execution", async () => {
    const response = await requestHandler({ handler: handlers.expiredLicensesReportHandler, user: null });
    expect(response.status).toBe(401);
    expect(await jsonEnvelope(response)).toMatchObject({ ok: false, error: { code: "UNAUTHENTICATED" } });
    expect(service.runReport).not.toHaveBeenCalled();
  });

  it.each([
    [handlers.expiredLicensesReportHandler, service.runReport],
    [handlers.expiredLicensesCsvReportHandler, service.exportReportCsv]
  ])("maps forbidden service errors for JSON and CSV", async (handler, mock) => {
    mock.mockRejectedValueOnce(new ReportError("FORBIDDEN"));
    const response = await requestHandler({ handler });
    expect(response.status).toBe(403);
    expect(await jsonEnvelope(response)).toMatchObject({ ok: false, error: { code: "FORBIDDEN" } });
  });

  it("maps unexpected report failures to the common HTTP envelope", async () => {
    service.runReport.mockRejectedValueOnce(new Error("query failed"));
    const response = await requestHandler({ handler: handlers.expiredLicensesReportHandler });
    expect(response.status).toBe(500);
    expect(await jsonEnvelope(response)).toMatchObject({ ok: false, error: { code: "INTERNAL_ERROR" } });
  });
});
