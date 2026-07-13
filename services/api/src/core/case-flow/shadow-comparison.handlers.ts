import { randomUUID } from "node:crypto";
import type { Request, Response } from "express";
import { sendError, sendOk } from "../http/responses.js";
import { recordShadowComparison, ShadowComparisonError, type ShadowComparisonStorage } from "./shadow-comparison.service.js";

export function createShadowComparisonHandler(storage: ShadowComparisonStorage, now: () => Date = () => new Date(), id: () => string = randomUUID) {
  return async (request: Request, response: Response) => {
    if (!request.user) return sendError(response, 401, "UNAUTHENTICATED", "Login required.");
    try {
      const body = request.body as Record<string, unknown>;
      const result = await recordShadowComparison(storage, {
        organizationId: request.user.organizationId, caseId: String(request.params.caseId ?? ""), actorId: request.user.id,
        manual: body.manual as never, caseFlow: body.caseFlow as never
      }, { now, id });
      return sendOk(response, result, 201);
    } catch (error) {
      if (error instanceof ShadowComparisonError || error instanceof TypeError) return sendError(response, 400, "INVALID_SHADOW_COMPARISON", "Invalid shadow comparison.");
      throw error;
    }
  };
}
