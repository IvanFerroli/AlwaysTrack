import type { Request, Response } from "express";
import { prisma } from "../db/prisma.js";
import { sendError, sendOk } from "../http/responses.js";
import { logEvent } from "../diagnostics/logger.js";
import { getOperationalToday } from "./operations.service.js";

export async function operationalTodayHandler(request: Request, response: Response) {
  if (!request.user) return sendError(response, 401, "UNAUTHENTICATED", "Login required.");
  try {
    const result = await getOperationalToday(prisma, request.user);
    logEvent("info", "operations.today.read", {
      requestId: request.context?.requestId,
      actorId: request.user.id,
      actorRole: request.user.role,
      metrics: result.metrics
    });
    return sendOk(response, result);
  } catch (error) {
    logEvent("error", "operations.today.failed", {
      requestId: request.context?.requestId,
      actorId: request.user?.id,
      actorRole: request.user?.role,
      error
    });
    return sendError(response, 400, "OPERATIONS_TODAY_FAILED", "Falha ao carregar central operacional.");
  }
}
