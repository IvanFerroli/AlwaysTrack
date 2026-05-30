import type { Request, Response, NextFunction } from "express";
import { randomUUID } from "node:crypto";
import { logEvent } from "../diagnostics/logger.js";

export interface RequestContext {
  requestId: string;
}

declare global {
  namespace Express {
    interface Request {
      context: RequestContext;
    }
  }
}

export function attachRequestContext(request: Request, response: Response, next: NextFunction) {
  const requestId = request.header("x-request-id") ?? randomUUID();
  request.context = { requestId };
  response.setHeader("x-request-id", requestId);
  const startedAt = Date.now();
  response.on("finish", () => {
    logEvent(response.statusCode >= 500 ? "error" : response.statusCode >= 400 ? "warn" : "info", "http.request", {
      requestId,
      method: request.method,
      path: request.originalUrl,
      statusCode: response.statusCode,
      durationMs: Date.now() - startedAt,
      userId: request.user?.id,
      role: request.user?.role
    });
  });
  next();
}
