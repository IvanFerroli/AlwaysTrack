import type { Request, Response } from "express";
import { prisma } from "../db/prisma.js";
import { sendError, sendOk } from "../http/responses.js";
import { CaseFlowPlanError, getCaseFlowPlan } from "./plan.service.js";

const param = (value: string | string[] | undefined) => typeof value === "string" ? value : "";
export function createPlanHandler(db = prisma) {
  return async (request: Request, response: Response) => {
    if (!request.user) return sendError(response, 401, "UNAUTHENTICATED", "Login required.");
    try { return sendOk(response, await getCaseFlowPlan(db, request.user, param(request.params.caseId))); }
    catch (error) {
      if (error instanceof CaseFlowPlanError) return sendError(response, error.code === "NOT_FOUND" ? 404 : 409, error.code, error.code === "NOT_FOUND" ? "Case not found." : "Resolve the case before requesting its plan.");
      throw error;
    }
  };
}
export const getCaseFlowPlanHandler = createPlanHandler();
