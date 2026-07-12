import type { Request, Response } from "express";
import { prisma } from "../db/prisma.js";
import { sendError, sendOk } from "../http/responses.js";
import { CaseFlowResolveError, resolveCase } from "./resolve.service.js";

const param = (value: string | string[] | undefined) => typeof value === "string" ? value : "";
export function createResolveHandler(db = prisma) {
  return async (request: Request, response: Response) => {
    if (!request.user) return sendError(response, 401, "UNAUTHENTICATED", "Login required.");
    try { return sendOk(response, await resolveCase(db, request.user, param(request.params.caseId))); }
    catch (error) {
      if (error instanceof CaseFlowResolveError) return sendError(response, 404, "NOT_FOUND", "Case not found.");
      throw error;
    }
  };
}
export const resolveCaseHandler = createResolveHandler();
