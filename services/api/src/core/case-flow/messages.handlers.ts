import type { Request, Response } from "express";
import { prisma } from "../db/prisma.js";
import { sendError, sendOk } from "../http/responses.js";
import { getCaseFlowPlan, CaseFlowPlanError } from "./plan.service.js";
import { CaseFlowMessageError, compileCaseMessages, loadPlanMessageTemplates, recordMessageCopy } from "./messages.service.js";

const param = (value: string | string[] | undefined) => typeof value === "string" ? value : "";
function failure(response: Response, error: unknown) {
  if (error instanceof CaseFlowPlanError || error instanceof CaseFlowMessageError) {
    const status = error.code === "NOT_FOUND" ? 404 : error.code === "COPY_BLOCKED" ? 409 : 400;
    return sendError(response, status, error.code, error.code === "COPY_BLOCKED" ? "Message has essential pending placeholders." : "CaseFlow message request failed.");
  }
  throw error;
}

async function messages(db: typeof prisma, request: Request) {
  const result = await getCaseFlowPlan(db, request.user!, param(request.params.caseId));
  const templates = await loadPlanMessageTemplates(db, request.user!, result.plan);
  return compileCaseMessages(db, request.user!, param(request.params.caseId), result.plan.revision, templates);
}

export function createMessagesHandlers(db = prisma) {
  return {
    list: async (request: Request, response: Response) => {
      if (!request.user) return sendError(response, 401, "UNAUTHENTICATED", "Login required.");
      try { return sendOk(response, await messages(db, request)); } catch (error) { return failure(response, error); }
    },
    copy: async (request: Request, response: Response) => {
      if (!request.user) return sendError(response, 401, "UNAUTHENTICATED", "Login required.");
      try {
        const message = (await messages(db, request)).find((item) => item.id === param(request.params.messageId));
        if (!message) throw new CaseFlowMessageError("NOT_FOUND");
        return sendOk(response, await recordMessageCopy(db, request.user, message), 201);
      } catch (error) { return failure(response, error); }
    }
  };
}
export const caseFlowMessagesHandlers = createMessagesHandlers();
