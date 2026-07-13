import type { Request, Response } from "express";
import { sendError, sendOk } from "../http/responses.js";
import { rehydrateCase, RecoveryError, type RecoveryStorage } from "./recovery.service.js";

export function createRecoveryHandler(storage: RecoveryStorage) {
  return async (request: Request, response: Response) => {
    if (!request.user) return sendError(response, 401, "UNAUTHENTICATED", "Login required.");
    try {
      const body = request.body as Record<string, unknown>;
      return sendOk(response, await rehydrateCase(storage, { organizationId: request.user.organizationId, caseId: String(request.params.caseId ?? ""), sessionId: String(body.sessionId ?? ""), flowVersion: String(body.flowVersion ?? "") }));
    } catch (error) {
      if (error instanceof RecoveryError) return sendError(response, error.message === "RECOVERY_NOT_FOUND" ? 404 : 409, error.message, "Case recovery rejected.");
      throw error;
    }
  };
}
