import type { Request, Response } from "express";
import { prisma } from "../db/prisma.js";
import { sendError, sendOk } from "../http/responses.js";
import { isInputValidationError, sendInputValidationError } from "../validation/input-validation.js";
import {
  archiveServiceFlow,
  completeServiceFlowSession,
  createServiceFlowSession,
  createServiceFlow,
  getServiceFlowSession,
  getServiceFlow,
  listServiceFlows,
  parseServiceFlowGovernanceInput,
  parseServiceFlowFilters,
  parseServiceFlowInput,
  parseServiceFlowSessionStepInput,
  publishServiceFlow,
  serviceFlowMetrics,
  ServiceFlowError,
  updateServiceFlowSessionStep,
  updateServiceFlow
} from "./service-flows.service.js";

function actorFrom(request: Request) {
  if (!request.user) throw new ServiceFlowError("FORBIDDEN");
  return request.user;
}

function param(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}

function sendFlowError(response: Response, error: unknown) {
  if (isInputValidationError(error)) return sendInputValidationError(response);
  if (error instanceof ServiceFlowError) {
    if (error.code === "FORBIDDEN") return sendError(response, 403, "FORBIDDEN", "Access denied.");
    if (error.code === "NOT_FOUND") return sendError(response, 404, "NOT_FOUND", "Service flow not found.");
    if (error.code === "SLUG_TAKEN") return sendError(response, 409, "SLUG_TAKEN", "Service flow slug already exists.");
    return sendError(response, 400, "INVALID_INPUT", "Invalid service flow payload.");
  }
  throw error;
}

export async function listServiceFlowsHandler(request: Request, response: Response) {
  try {
    return sendOk(response, await listServiceFlows(prisma, actorFrom(request), parseServiceFlowFilters(request.query)));
  } catch (error) {
    return sendFlowError(response, error);
  }
}

export async function getServiceFlowHandler(request: Request, response: Response) {
  try {
    return sendOk(response, await getServiceFlow(prisma, actorFrom(request), param(request.params.flowIdOrSlug)));
  } catch (error) {
    return sendFlowError(response, error);
  }
}

export async function createServiceFlowHandler(request: Request, response: Response) {
  try {
    return sendOk(response, await createServiceFlow(prisma, actorFrom(request), parseServiceFlowInput(request.body)), 201);
  } catch (error) {
    return sendFlowError(response, error);
  }
}

export async function updateServiceFlowHandler(request: Request, response: Response) {
  try {
    return sendOk(response, await updateServiceFlow(prisma, actorFrom(request), param(request.params.flowId), parseServiceFlowInput(request.body)));
  } catch (error) {
    return sendFlowError(response, error);
  }
}

export async function publishServiceFlowHandler(request: Request, response: Response) {
  try {
    return sendOk(response, await publishServiceFlow(prisma, actorFrom(request), param(request.params.flowId), parseServiceFlowGovernanceInput(request.body)));
  } catch (error) {
    return sendFlowError(response, error);
  }
}

export async function archiveServiceFlowHandler(request: Request, response: Response) {
  try {
    return sendOk(response, await archiveServiceFlow(prisma, actorFrom(request), param(request.params.flowId), parseServiceFlowGovernanceInput(request.body)));
  } catch (error) {
    return sendFlowError(response, error);
  }
}

export async function serviceFlowMetricsHandler(request: Request, response: Response) {
  try {
    return sendOk(response, await serviceFlowMetrics(prisma, actorFrom(request)));
  } catch (error) {
    return sendFlowError(response, error);
  }
}

export async function createServiceFlowSessionHandler(request: Request, response: Response) {
  try {
    return sendOk(response, await createServiceFlowSession(prisma, actorFrom(request), param(request.params.flowIdOrSlug)), 201);
  } catch (error) {
    return sendFlowError(response, error);
  }
}

export async function getServiceFlowSessionHandler(request: Request, response: Response) {
  try {
    return sendOk(response, await getServiceFlowSession(prisma, actorFrom(request), param(request.params.sessionId)));
  } catch (error) {
    return sendFlowError(response, error);
  }
}

export async function updateServiceFlowSessionStepHandler(request: Request, response: Response) {
  try {
    return sendOk(
      response,
      await updateServiceFlowSessionStep(
        prisma,
        actorFrom(request),
        param(request.params.sessionId),
        param(request.params.stepId),
        parseServiceFlowSessionStepInput(request.body)
      )
    );
  } catch (error) {
    return sendFlowError(response, error);
  }
}

export async function completeServiceFlowSessionHandler(request: Request, response: Response) {
  try {
    return sendOk(response, await completeServiceFlowSession(prisma, actorFrom(request), param(request.params.sessionId)));
  } catch (error) {
    return sendFlowError(response, error);
  }
}
