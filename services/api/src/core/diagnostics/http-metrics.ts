import type { NextFunction, Request, Response } from "express";
import { loadEnv } from "../../config/env.js";
import { sendOk } from "../http/responses.js";
import { logEvent } from "./logger.js";

interface RouteMetrics {
  method: string;
  route: string;
  count: number;
  errorCount: number;
  totalDurationMs: number;
  maxDurationMs: number;
  totalResponseBytes: number;
  maxResponseBytes: number;
  lastStatus: number;
  lastSeenAt: string;
}

const routeMetrics = new Map<string, RouteMetrics>();

const hotRoutes = new Set([
  "GET /v1/sales/documents",
  "GET /v1/sales/ranking",
  "GET /v1/sales/statements",
  "GET /v1/wiki/pages",
  "GET /v1/faq/threads",
  "GET /v1/in-app-notifications"
]);

function normalizeFallbackRoute(path: string) {
  return path
    .replace(/[0-9a-f]{24,}/gi, ":id")
    .replace(/cm[a-z0-9]{20,}/gi, ":id")
    .replace(/\/[0-9]+(?=\/|$)/g, "/:id");
}

function routeLabel(request: Request) {
  const routePath = request.route?.path;
  if (typeof routePath === "string") return `${request.baseUrl ?? ""}${routePath}`;
  return normalizeFallbackRoute(request.path);
}

function responseBytes(response: Response) {
  const header = response.getHeader("content-length");
  if (typeof header === "number") return header;
  if (typeof header === "string") {
    const parsed = Number.parseInt(header, 10);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

export function httpMetricsMiddleware(request: Request, response: Response, next: NextFunction) {
  const startedAt = process.hrtime.bigint();

  response.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    const route = routeLabel(request);
    const key = `${request.method} ${route}`;
    const bytes = responseBytes(response);
    const current =
      routeMetrics.get(key) ??
      {
        method: request.method,
        route,
        count: 0,
        errorCount: 0,
        totalDurationMs: 0,
        maxDurationMs: 0,
        totalResponseBytes: 0,
        maxResponseBytes: 0,
        lastStatus: response.statusCode,
        lastSeenAt: new Date().toISOString()
      };

    current.count += 1;
    current.errorCount += response.statusCode >= 400 ? 1 : 0;
    current.totalDurationMs += durationMs;
    current.maxDurationMs = Math.max(current.maxDurationMs, durationMs);
    current.totalResponseBytes += bytes;
    current.maxResponseBytes = Math.max(current.maxResponseBytes, bytes);
    current.lastStatus = response.statusCode;
    current.lastSeenAt = new Date().toISOString();
    routeMetrics.set(key, current);

    const env = loadEnv();
    const slowRequestMs = env.httpMetricsSlowMs ?? 500;
    if (durationMs >= slowRequestMs || hotRoutes.has(key)) {
      logEvent(durationMs >= slowRequestMs ? "warn" : "info", "http.request.metrics", {
        method: request.method,
        route,
        statusCode: response.statusCode,
        durationMs: Math.round(durationMs),
        responseBytes: bytes,
        requestId: response.getHeader("x-request-id"),
        userId: request.user?.id,
        role: request.user?.role
      });
    }
  });

  next();
}

export function snapshotHttpMetrics() {
  return [...routeMetrics.values()]
    .map((item) => ({
      ...item,
      avgDurationMs: Math.round(item.totalDurationMs / item.count),
      avgResponseBytes: Math.round(item.totalResponseBytes / item.count)
    }))
    .sort((a, b) => b.maxDurationMs - a.maxDurationMs);
}

export function resetHttpMetrics() {
  routeMetrics.clear();
}

export function httpMetricsHandler(_request: Request, response: Response) {
  return sendOk(response, { routes: snapshotHttpMetrics(), generatedAt: new Date().toISOString() });
}
