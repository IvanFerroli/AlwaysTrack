import type { Request, Response } from "express";
import { prisma } from "../db/prisma.js";
import { sendError, sendOk } from "../http/responses.js";
import { EvidenceConflictError, resolveEvidenceConflictManually } from "./conflicts.service.js";

const param = (value: string | string[] | undefined) => typeof value === "string" ? value : "";
export function createManualConflictHandler(db = prisma) {
  return async (request: Request, response: Response) => {
    if (!request.user) return sendError(response, 401, "UNAUTHENTICATED", "Login required.");
    try {
      const input = request.body as Record<string, unknown>;
      if (!input || typeof input.reason !== "string") throw new EvidenceConflictError("INVALID_INPUT");
      return sendOk(response, await resolveEvidenceConflictManually(db, request.user, param(request.params.caseId), param(request.params.conflictId), {
        chosenFactId: typeof input.chosenFactId === "string" ? input.chosenFactId : undefined,
        reason: input.reason, cause: input.cause as never, recompute: input.recompute === true
      }));
    } catch (error) {
      if (error instanceof EvidenceConflictError) return sendError(response, error.code === "NOT_FOUND" ? 404 : 400, error.code, "Invalid conflict resolution.");
      throw error;
    }
  };
}
export const manualConflictHandler = createManualConflictHandler();
