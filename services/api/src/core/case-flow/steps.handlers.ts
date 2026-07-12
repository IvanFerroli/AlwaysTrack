import type { Request, Response } from "express";
import { prisma } from "../db/prisma.js";
import { sendError, sendOk } from "../http/responses.js";
import { getCaseFlowPlan } from "./plan.service.js";
import { appendServiceFlowSessionChoice, createCaseFlowSession, rewindServiceFlowSession } from "./sessions.service.js";

const param = (value: string | string[] | undefined) => typeof value === "string" ? value : "";
const bodyText = (body: unknown, key: string) => {
  const value = body && typeof body === "object" && !Array.isArray(body) ? (body as Record<string, unknown>)[key] : undefined;
  if (typeof value !== "string" || !value.trim()) throw new Error("INVALID_INPUT");
  return value.trim();
};
function error(response: Response, cause: unknown) {
  const code = cause instanceof Error ? cause.message : "INVALID_INPUT";
  if (code === "NOT_FOUND") return sendError(response, 404, code, "CaseFlow session or step not found.");
  if (code === "PLAN_BLOCKED") return sendError(response, 409, code, "The compiled plan is blocked.");
  return sendError(response, 400, "INVALID_INPUT", "Invalid CaseFlow step request.");
}
export function createStepHandlers(db = prisma) {
  return {
    start: async (request: Request, response: Response) => { if (!request.user) return sendError(response, 401, "UNAUTHENTICATED", "Login required."); try { const { plan } = await getCaseFlowPlan(db, request.user, param(request.params.caseId)); return sendOk(response, await createCaseFlowSession(db, request.user, param(request.params.caseId), plan), 201); } catch (cause) { return error(response, cause); } },
    select: async (request: Request, response: Response) => { if (!request.user) return sendError(response, 401, "UNAUTHENTICATED", "Login required."); try { const caseId = param(request.params.caseId); const { plan } = await getCaseFlowPlan(db, request.user, caseId); return sendOk(response, await appendServiceFlowSessionChoice(db, request.user, caseId, bodyText(request.body, "sessionId"), param(request.params.stepKey), bodyText(request.body, "choice"), plan)); } catch (cause) { return error(response, cause); } },
    rewind: async (request: Request, response: Response) => { if (!request.user) return sendError(response, 401, "UNAUTHENTICATED", "Login required."); try { return sendOk(response, await rewindServiceFlowSession(db, request.user, param(request.params.caseId), bodyText(request.body, "sessionId"), param(request.params.stepKey))); } catch (cause) { return error(response, cause); } }
  };
}
export const caseFlowStepHandlers = createStepHandlers();
