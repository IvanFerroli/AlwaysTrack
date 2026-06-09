import { describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";
import { httpMetricsMiddleware, resetHttpMetrics, snapshotHttpMetrics } from "./http-metrics.js";

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
});
