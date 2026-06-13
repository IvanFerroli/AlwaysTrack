import { describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";
import { httpMetricsMiddleware, resetHttpMetrics, snapshotHttpMetrics } from "./http-metrics.js";
import { getOperationalObservability } from "./operational-observability.service.js";

function mockResponse(statusCode = 200, contentLength = "42") {
  const listeners = new Map<string, () => void>();
  const response = {
    statusCode,
    on: vi.fn((event: string, listener: () => void) => {
      listeners.set(event, listener);
      return response;
    }),
    getHeader: vi.fn((name: string) => (name === "content-length" ? contentLength : undefined))
  } as unknown as Response;
  return { response, finish: () => listeners.get("finish")?.() };
}

describe("http metrics diagnostics", () => {
  it("aggregates request counts, status and response size by route", () => {
    resetHttpMetrics();
    const request = {
      method: "GET",
      path: "/v1/sales/ranking",
      route: { path: "/v1/sales/ranking" }
    } as unknown as Request;
    const { response, finish } = mockResponse(200, "128");
    const next = vi.fn();

    httpMetricsMiddleware(request, response, next);
    finish();

    expect(next).toHaveBeenCalledOnce();
    expect(snapshotHttpMetrics()).toEqual([
      expect.objectContaining({
        method: "GET",
        route: "/v1/sales/ranking",
        count: 1,
        errorCount: 0,
        maxResponseBytes: 128
      })
    ]);
  });

  it("builds an admin operational observability snapshot from existing signals", async () => {
    resetHttpMetrics();
    const request = {
      method: "GET",
      path: "/v1/sales/documents",
      route: { path: "/v1/sales/documents" }
    } as unknown as Request;
    const { response, finish } = mockResponse(200, "256");
    httpMetricsMiddleware(request, response, vi.fn());
    finish();

    const prisma = {
      salesDocument: { count: vi.fn().mockResolvedValueOnce(4).mockResolvedValueOnce(2).mockResolvedValueOnce(1) },
      faqThread: { count: vi.fn().mockResolvedValue(3) },
      wikiEditRequest: { count: vi.fn().mockResolvedValue(1) },
      inAppNotification: { count: vi.fn().mockResolvedValue(5) },
      auditLog: {
        count: vi.fn().mockResolvedValue(1),
        findMany: vi
          .fn()
          .mockResolvedValueOnce([
            {
              id: "audit-failure-1",
              action: "sales_document.extract_failed",
              entityType: "SalesDocument",
              entityId: "doc-1",
              metadataJson: "{}",
              createdAt: new Date("2026-06-12T10:00:00.000Z"),
              actor: null
            }
          ])
          .mockResolvedValueOnce([
            {
              id: "audit-1",
              action: "sales_document.approve",
              entityType: "SalesDocument",
              entityId: "doc-2",
              metadataJson: null,
              createdAt: new Date("2026-06-12T11:00:00.000Z"),
              actor: { id: "admin-1", name: "Admin", email: "admin@example.com", role: "ADMIN" }
            }
          ])
      }
    };

    const snapshot = await getOperationalObservability(prisma as never, "org-1");

    expect(snapshot.metrics).toMatchObject({
      documents24h: 4,
      approvals24h: 2,
      rejections24h: 1,
      extractionFailures24h: 1,
      openFaqThreads: 3,
      pendingWikiReviews: 1,
      unreadNotifications: 5,
      observedRoutes: 1
    });
    expect(snapshot.http.slowestRoutes[0]).toMatchObject({ route: "/v1/sales/documents", count: 1 });
    expect(snapshot.recentFailures[0]).toMatchObject({ action: "sales_document.extract_failed", entityId: "doc-1" });
    expect(prisma.salesDocument.count).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ organizationId: "org-1" }) }));
  });
});
