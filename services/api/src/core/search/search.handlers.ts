import type { Request, Response } from "express";
import { prisma } from "../db/prisma.js";
import { sendError, sendOk } from "../http/responses.js";
import { globalSearch, parseGlobalSearchInput } from "./search.service.js";

export async function globalSearchHandler(request: Request, response: Response) {
  if (!request.user) return sendError(response, 401, "UNAUTHENTICATED", "Login required.");
  return sendOk(response, await globalSearch(prisma, request.user, parseGlobalSearchInput(request.query)));
}
