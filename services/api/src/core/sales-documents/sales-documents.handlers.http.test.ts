import type { RequestHandler } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { jsonEnvelope, requestHandler } from "../../test-support/http-handler-harness.js";

const service = vi.hoisted(() => {
  const names = ["analyzeSalesDocumentWithAi", "correctSalesDocumentManually", "createSalesCampaign", "getSalesDocumentDiagnostics",
    "getSalesRanking", "getSalesRankingExplanation", "getSalesDocumentTimeline", "getSalesStatements", "getSalesDashboard", "listRankingSnapshots",
    "listSalesCampaigns", "listSalesDocuments", "listSalesSellers", "reviewSalesDocument", "updateSalesCampaign", "uploadSalesDocument"] as const;
  return {
    ...Object.fromEntries(names.map((name) => [name, vi.fn()])),
    parseSalesCampaignInput: vi.fn((value) => value), parseSalesDocumentManualCorrectionInput: vi.fn((value) => value),
    parseSalesDocumentFilters: vi.fn((value) => value), parseSalesDocumentReviewInput: vi.fn((value) => value),
    parseSalesPeriodFilters: vi.fn((value) => value), parseSalesDocumentUploadInput: vi.fn((value) => value),
    salesDashboardCsv: vi.fn(() => "dashboard\n1"), salesRankingCsv: vi.fn(() => "ranking\n1"),
    salesStatementsCsv: vi.fn(() => "statements\n1"), salesExportFileName: vi.fn((name) => `${name}.csv`)
  } as Record<string, ReturnType<typeof vi.fn>>;
});
const jobs = vi.hoisted(() => ({ enqueueRankingSnapshotJob: vi.fn(), getRankingSnapshotJobStatus: vi.fn() }));
const audit = vi.hoisted(() => ({ recordAuditLog: vi.fn() }));

vi.mock("../db/prisma.js", () => ({ prisma: { mocked: true } }));
vi.mock("../audit/audit.service.js", () => audit);
vi.mock("../documents/storage.provider.js", () => ({ getStorageProvider: () => ({ storage: true }) }));
vi.mock("../document-ai/provider.js", () => ({ getDocumentAiProvider: () => ({ ai: true }) }));
vi.mock("../diagnostics/logger.js", () => ({ logEvent: vi.fn() }));
vi.mock("../jobs/ranking-snapshot.jobs.js", () => jobs);
vi.mock("./sales-documents.service.js", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./sales-documents.service.js")>()),
  ...service
}));

import * as handlers from "./sales-documents.handlers.js";
import { SalesDocumentError } from "./sales-documents.service.js";

type Operation = ReturnType<typeof vi.fn>;
const jsonRows: Array<[RequestHandler, Operation, string, string, "get" | "patch" | "post", number]> = [
  [handlers.salesDashboardHandler, service.getSalesDashboard, "/v1/sales/dashboard?from=2026-07-01", "/v1/sales/dashboard", "get", 200],
  [handlers.listSalesDocumentsHandler, service.listSalesDocuments, "/v1/sales/documents?status=approved", "/v1/sales/documents", "get", 200],
  [handlers.salesDocumentTimelineHandler, service.getSalesDocumentTimeline, "/v1/sales/documents/doc-1/timeline", "/v1/sales/documents/:documentId/timeline", "get", 200],
  [handlers.salesDocumentDiagnosticsHandler, service.getSalesDocumentDiagnostics, "/v1/sales/documents/doc-1/diagnostics", "/v1/sales/documents/:documentId/diagnostics", "get", 200],
  [handlers.salesDocumentManualCorrectionHandler, service.correctSalesDocumentManually, "/v1/sales/documents/doc-1/correct", "/v1/sales/documents/:documentId/correct", "patch", 200],
  [handlers.listSalesSellersHandler, service.listSalesSellers, "/v1/sales/sellers", "/v1/sales/sellers", "get", 200],
  [handlers.listSalesCampaignsHandler, service.listSalesCampaigns, "/v1/sales/campaigns", "/v1/sales/campaigns", "get", 200],
  [handlers.createSalesCampaignHandler, service.createSalesCampaign, "/v1/sales/campaigns", "/v1/sales/campaigns", "post", 201],
  [handlers.updateSalesCampaignHandler, service.updateSalesCampaign, "/v1/sales/campaigns/campaign-1", "/v1/sales/campaigns/:campaignId", "patch", 200],
  [handlers.listRankingSnapshotsHandler, service.listRankingSnapshots, "/v1/sales/ranking-snapshots", "/v1/sales/ranking-snapshots", "get", 200],
  [handlers.salesRankingHandler, service.getSalesRanking, "/v1/sales/ranking", "/v1/sales/ranking", "get", 200],
  [handlers.salesRankingExplanationHandler, service.getSalesRankingExplanation, "/v1/sales/ranking/seller-1/explanation", "/v1/sales/ranking/:sellerProfileId/explanation", "get", 200],
  [handlers.salesStatementsHandler, service.getSalesStatements, "/v1/sales/statements", "/v1/sales/statements", "get", 200],
  [handlers.uploadSalesDocumentHandler, service.uploadSalesDocument, "/v1/sales/documents/upload", "/v1/sales/documents/upload", "post", 201],
  [handlers.analyzeSalesDocumentHandler, service.analyzeSalesDocumentWithAi, "/v1/sales/documents/doc-1/analyze?forceAi=true", "/v1/sales/documents/:documentId/analyze", "post", 200],
  [handlers.reviewSalesDocumentHandler, service.reviewSalesDocument, "/v1/sales/documents/doc-1/review", "/v1/sales/documents/:documentId/review", "post", 200]
];

describe("sales document HTTP handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    service.getSalesDashboard.mockResolvedValue({ metrics: { revenue: 100 } });
    service.listSalesDocuments.mockResolvedValue({ items: [], total: 0 });
    service.getSalesDocumentTimeline.mockResolvedValue({ items: [], total: 0 });
    service.getSalesDocumentDiagnostics.mockResolvedValue({ document: { status: "APPROVED" }, operationalStatus: "ready" });
    service.correctSalesDocumentManually.mockResolvedValue({ document: { id: "doc-1", status: "PENDING_REVIEW" } });
    service.listSalesSellers.mockResolvedValue({ items: [], total: 0 });
    service.listSalesCampaigns.mockResolvedValue({ items: [], total: 0 });
    service.createSalesCampaign.mockResolvedValue({ campaign: { id: "campaign-1", status: "ACTIVE" } });
    service.updateSalesCampaign.mockResolvedValue({ campaign: { id: "campaign-1", status: "CLOSED" } });
    service.listRankingSnapshots.mockResolvedValue({ items: [], total: 0 });
    service.getSalesRanking.mockResolvedValue({ items: [], total: 0 });
    service.getSalesRankingExplanation.mockResolvedValue({ summary: { totalAmountCents: 100 } });
    service.getSalesStatements.mockResolvedValue({ items: [], summary: { total: 0 } });
    service.uploadSalesDocument.mockResolvedValue({ id: "doc-1" });
    service.analyzeSalesDocumentWithAi.mockResolvedValue({ document: { id: "doc-1" } });
    service.reviewSalesDocument.mockResolvedValue({ document: { id: "doc-1", status: "APPROVED" } });
    audit.recordAuditLog.mockResolvedValue({ id: "audit-1" });
    jobs.enqueueRankingSnapshotJob.mockResolvedValue({ job: { id: "job-1", status: "completed" }, result: { snapshot: { id: "snapshot-1" } } });
    jobs.getRankingSnapshotJobStatus.mockResolvedValue({ id: "job-1", status: "completed" });
  });

  it.each(jsonRows)("executes a tenant-scoped sales operation for %s", async (handler, operation, path, route, method, status) => {
    const response = await requestHandler({ handler, path, route, method, body: method === "get" ? undefined : { status: "APPROVED" } });
    expect(response.status).toBe(status);
    expect((await jsonEnvelope(response)).ok).toBe(true);
    expect(operation.mock.calls[0].some((value: unknown) => typeof value === "object" && value !== null && "organizationId" in value)).toBe(true);
  });

  it.each([
    [handlers.salesDashboardCsvHandler, service.getSalesDashboard, "dashboard\n1", "dashboard-comercial"],
    [handlers.salesRankingCsvHandler, service.getSalesRanking, "ranking\n1", "ranking-comercial"],
    [handlers.salesStatementsCsvHandler, service.getSalesStatements, "statements\n1", "extrato-comercial"]
  ])("returns an audited CSV export", async (handler, _operation, body, fileName) => {
    const response = await requestHandler({ handler });
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/csv");
    expect(response.headers.get("content-disposition")).toContain(`${fileName}.csv`);
    expect(await response.text()).toBe(body);
    expect(audit.recordAuditLog).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ organizationId: "org-1", actorId: "admin-1" }));
  });

  it("returns completed and queued ranking jobs with the correct HTTP semantics", async () => {
    const completed = await requestHandler({ handler: handlers.createRankingSnapshotHandler, method: "post", path: "/v1/sales/campaigns/campaign-1/snapshot", route: "/v1/sales/campaigns/:campaignId/snapshot" });
    expect(completed.status).toBe(201);
    expect(await jsonEnvelope(completed)).toMatchObject({ data: { snapshot: { id: "snapshot-1" }, job: { status: "completed" } } });

    jobs.enqueueRankingSnapshotJob.mockResolvedValueOnce({ job: { id: "job-2", status: "queued" } });
    const queued = await requestHandler({ handler: handlers.createRankingSnapshotHandler, method: "post", path: "/v1/sales/campaigns/campaign-1/snapshot", route: "/v1/sales/campaigns/:campaignId/snapshot" });
    expect(queued.status).toBe(202);
  });

  it("exposes ranking job status without crossing actor scope", async () => {
    const response = await requestHandler({ handler: handlers.getRankingSnapshotJobStatusHandler, path: "/v1/sales/campaigns/campaign-1/snapshot/status", route: "/v1/sales/campaigns/:campaignId/snapshot/status" });
    expect(response.status).toBe(200);
    expect(jobs.getRankingSnapshotJobStatus).toHaveBeenCalledWith(expect.objectContaining({ actor: expect.objectContaining({ organizationId: "org-1" }), campaignId: "campaign-1" }));
  });

  it.each([
    [new SalesDocumentError("STORED_FILE_MISSING"), 409, "STORED_FILE_MISSING"],
    [new SalesDocumentError("PROVIDER_ERROR"), 502, "PROVIDER_ERROR"],
    [new SalesDocumentError("UNSUPPORTED_TYPE"), 415, "UNSUPPORTED_TYPE"],
    [new SalesDocumentError("FILE_TOO_LARGE"), 413, "FILE_TOO_LARGE"],
    [new SalesDocumentError("DUPLICATE"), 409, "DUPLICATE"]
  ])("maps sales processing failures", async (error, status, code) => {
    service.analyzeSalesDocumentWithAi.mockRejectedValueOnce(error);
    const response = await requestHandler({ handler: handlers.analyzeSalesDocumentHandler, method: "post" });
    expect(response.status).toBe(status);
    expect(await jsonEnvelope(response)).toMatchObject({ ok: false, error: { code } });
  });
});
