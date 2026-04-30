import type { Request, Response } from "express";
import { prisma } from "../db/prisma.js";
import { sendError, sendOk } from "../http/responses.js";
import { DashboardError, getDashboard } from "./dashboard.service.js";

function actorFrom(request: Request) {
  if (!request.user) throw new DashboardError("FORBIDDEN");
  return request.user;
}

function sendDashboardError(response: Response, error: unknown) {
  if (error instanceof DashboardError) {
    return sendError(response, 403, "FORBIDDEN", "Access denied.");
  }
  throw error;
}

export async function getDashboardHandler(request: Request, response: Response) {
  try {
    return sendOk(response, await getDashboard(prisma, actorFrom(request)));
  } catch (error) {
    return sendDashboardError(response, error);
  }
}
