import type { Request, Response } from "express";
import { prisma } from "../db/prisma.js";
import { sendError, sendOk } from "../http/responses.js";
import { caseFlowSloTargetsMs, getCaseFlowSuccessMetrics, getConnectorHealthMetrics, recordCaseFlowMetric } from "./metrics.service.js";

function user(request: Request, response: Response) { if (!request.user) { sendError(response, 401, "UNAUTHENTICATED", "Login required."); return null; } return request.user; }
export function createCaseFlowMetricsHandlers(db = prisma, now: () => Date = () => new Date()) {
  return {
    record: async (request: Request, response: Response) => {
      const actor = user(request, response); if (!actor) return;
      try { const body = request.body as Record<string, unknown>; await recordCaseFlowMetric(db, actor, { ...body, caseId: String(request.params.caseId ?? "") } as never, now()); return sendOk(response, { recorded: true }, 201); }
      catch (error) { return sendError(response, error instanceof Error && error.message === "NOT_FOUND" ? 404 : 400, "INVALID_METRIC", "Invalid CaseFlow metric."); }
    },
    health: async (request: Request, response: Response) => { const actor = user(request, response); const clock = now(); if (actor) return sendOk(response, { generatedAt: clock.toISOString(), targetsMs: caseFlowSloTargetsMs, connectors: await getConnectorHealthMetrics(db, actor, clock) }); },
    success: async (request: Request, response: Response) => { const actor = user(request, response); if (actor) return sendOk(response, await getCaseFlowSuccessMetrics(db, actor, now())); }
  };
}
export const caseFlowMetricsHandlers = createCaseFlowMetricsHandlers();
