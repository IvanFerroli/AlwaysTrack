import type { Request, Response } from "express";
import { prisma } from "../db/prisma.js";
import { sendError, sendOk } from "../http/responses.js";
import {
  approveWikiEditRequest,
  createWikiEditRequest,
  createWikiPage,
  getWikiPage,
  heartbeatWikiPresence,
  listWikiEditRequests,
  listWikiPages,
  markWikiRead,
  parseWikiDecisionInput,
  parseWikiEditRequestInput,
  parseWikiFilters,
  parseWikiPageInput,
  parseWikiPresenceInput,
  rejectWikiEditRequest,
  updateWikiPage,
  WikiError
} from "./wiki.service.js";

function routeParam(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}

function actorFrom(request: Request) {
  if (!request.user) throw new WikiError("FORBIDDEN");
  return request.user;
}

function sendWikiError(response: Response, error: unknown) {
  if (error instanceof WikiError) {
    if (error.code === "FORBIDDEN") return sendError(response, 403, "FORBIDDEN", "Access denied.");
    if (error.code === "NOT_FOUND") return sendError(response, 404, "NOT_FOUND", "Wiki resource not found.");
    if (error.code === "VERSION_CONFLICT") return sendError(response, 409, "VERSION_CONFLICT", "Wiki page changed before this edit.");
    if (error.code === "REQUEST_NOT_PENDING") return sendError(response, 409, "REQUEST_NOT_PENDING", "Wiki request is not pending.");
    return sendError(response, 400, "INVALID_INPUT", "Invalid wiki payload.");
  }
  throw error;
}

export async function listWikiPagesHandler(request: Request, response: Response) {
  try {
    return sendOk(response, await listWikiPages(prisma, actorFrom(request), parseWikiFilters(request.query)));
  } catch (error) {
    return sendWikiError(response, error);
  }
}

export async function getWikiPageHandler(request: Request, response: Response) {
  try {
    return sendOk(response, await getWikiPage(prisma, actorFrom(request), routeParam(request.params.pageId)));
  } catch (error) {
    return sendWikiError(response, error);
  }
}

export async function createWikiPageHandler(request: Request, response: Response) {
  try {
    const page = await createWikiPage(prisma, actorFrom(request), parseWikiPageInput(request.body));
    return sendOk(response, { page }, 201);
  } catch (error) {
    return sendWikiError(response, error);
  }
}

export async function updateWikiPageHandler(request: Request, response: Response) {
  try {
    const page = await updateWikiPage(prisma, actorFrom(request), routeParam(request.params.pageId), parseWikiPageInput(request.body));
    return sendOk(response, { page });
  } catch (error) {
    return sendWikiError(response, error);
  }
}

export async function listWikiEditRequestsHandler(request: Request, response: Response) {
  try {
    return sendOk(response, await listWikiEditRequests(prisma, actorFrom(request), parseWikiFilters(request.query)));
  } catch (error) {
    return sendWikiError(response, error);
  }
}

export async function createWikiEditRequestHandler(request: Request, response: Response) {
  try {
    const requestItem = await createWikiEditRequest(prisma, actorFrom(request), parseWikiEditRequestInput(request.body));
    return sendOk(response, { request: requestItem }, 201);
  } catch (error) {
    return sendWikiError(response, error);
  }
}

export async function approveWikiEditRequestHandler(request: Request, response: Response) {
  try {
    return sendOk(
      response,
      await approveWikiEditRequest(prisma, actorFrom(request), routeParam(request.params.requestId), parseWikiDecisionInput(request.body))
    );
  } catch (error) {
    return sendWikiError(response, error);
  }
}

export async function rejectWikiEditRequestHandler(request: Request, response: Response) {
  try {
    const requestItem = await rejectWikiEditRequest(
      prisma,
      actorFrom(request),
      routeParam(request.params.requestId),
      parseWikiDecisionInput(request.body)
    );
    return sendOk(response, { request: requestItem });
  } catch (error) {
    return sendWikiError(response, error);
  }
}

export async function markWikiReadHandler(request: Request, response: Response) {
  try {
    const readReceipt = await markWikiRead(prisma, actorFrom(request), routeParam(request.params.pageId));
    return sendOk(response, { readReceipt });
  } catch (error) {
    return sendWikiError(response, error);
  }
}

export async function heartbeatWikiPresenceHandler(request: Request, response: Response) {
  try {
    const presence = await heartbeatWikiPresence(
      prisma,
      actorFrom(request),
      routeParam(request.params.pageId),
      parseWikiPresenceInput(request.body)
    );
    return sendOk(response, { presence });
  } catch (error) {
    return sendWikiError(response, error);
  }
}
