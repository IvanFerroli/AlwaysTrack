import type { Request, Response } from "express";
import { sendError, sendOk } from "../http/responses.js";
import { prisma } from "../db/prisma.js";
import { getOperationalObservability } from "./operational-observability.service.js";

export async function operationalObservabilityHandler(request: Request, response: Response) {
  if (!request.user) return sendError(response, 401, "UNAUTHENTICATED", "Login required.");
  return sendOk(response, await getOperationalObservability(prisma, request.user.organizationId));
}
