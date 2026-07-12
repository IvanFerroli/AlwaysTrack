import type { Request, Response } from "express";
import { prisma } from "../db/prisma.js";
import { sendError, sendOk } from "../http/responses.js";
import { getHumanOverrideMetrics } from "./metrics.service.js";
import { createFlowClassificationOverride, HumanOverrideError, undoHumanOverride } from "./overrides.service.js";

const param = (value: string | string[] | undefined) => typeof value === "string" ? value : "";
function input(request: Request) { return request.body as Record<string, unknown>; }
function required(value: unknown) { if (typeof value !== "string" || !value.trim()) throw new HumanOverrideError("INVALID_INPUT"); return value.trim(); }
function failure(response: Response, error: unknown) {
  if (!(error instanceof HumanOverrideError)) throw error;
  const status = error.code === "NOT_FOUND" ? 404 : error.code === "ALREADY_UNDONE" ? 409 : 400;
  return sendError(response, status, error.code, "Invalid human override request.");
}
export function createOverrideHandlers(db = prisma) {
  return {
    flow: async (request: Request, response: Response) => {
      if (!request.user) return sendError(response, 401, "UNAUTHENTICATED", "Login required.");
      try { const body = input(request); return sendOk(response, await createFlowClassificationOverride(db, request.user, param(request.params.caseId), {
        suggestedFlowId: required(body.suggestedFlowId), chosenFlowId: required(body.chosenFlowId), reason: required(body.reason),
        cause: body.cause as never, markCandidateIncorrect: body.markCandidateIncorrect === true, recompute: body.recompute === true
      }), 201); } catch (error) { return failure(response, error); }
    },
    undo: async (request: Request, response: Response) => {
      if (!request.user) return sendError(response, 401, "UNAUTHENTICATED", "Login required.");
      try { const body = input(request); return sendOk(response, await undoHumanOverride(db, request.user, param(request.params.caseId), param(request.params.overrideId), { reason: required(body.reason), recompute: body.recompute === true })); }
      catch (error) { return failure(response, error); }
    },
    metrics: async (request: Request, response: Response) => {
      if (!request.user) return sendError(response, 401, "UNAUTHENTICATED", "Login required.");
      return sendOk(response, await getHumanOverrideMetrics(db, request.user));
    }
  };
}
export const overrideHandlers = createOverrideHandlers();
