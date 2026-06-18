import type { Request, Response } from "express";
import { prisma } from "../db/prisma.js";
import { sendError, sendOk } from "../http/responses.js";
import { isInputValidationError, sendInputValidationError } from "../validation/input-validation.js";
import {
  archiveWikiPage,
  approveWikiEditRequest,
  createWikiEditRequest,
  createWikiPage,
  getWikiPage,
  getWikiPageBySlug,
  heartbeatWikiPresence,
  getWikiAttachmentFile,
  listWikiEditRequests,
  listWikiPages,
  markWikiRead,
  parseWikiAttachmentUploadInput,
  parseWikiDecisionInput,
  parseWikiEditRequestInput,
  parseWikiFilters,
  parseWikiPageInput,
  parseWikiPresenceInput,
  rejectWikiEditRequest,
  restoreWikiRevision,
  unarchiveWikiPage,
  updateWikiPage,
  uploadWikiAttachment,
  WikiError
} from "./wiki.service.js";
import { getStorageProvider } from "../documents/storage.provider.js";

function routeParam(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}

function actorFrom(request: Request) {
  if (!request.user) throw new WikiError("FORBIDDEN");
  return request.user;
}

function sendWikiError(response: Response, error: unknown) {
  if (isInputValidationError(error)) return sendInputValidationError(response);
  if (error instanceof WikiError) {
    if (error.code === "FORBIDDEN") return sendError(response, 403, "FORBIDDEN", "Access denied.");
    if (error.code === "NOT_FOUND") return sendError(response, 404, "NOT_FOUND", "Wiki resource not found.");
    if (error.code === "VERSION_CONFLICT") return sendError(response, 409, "VERSION_CONFLICT", "Wiki page changed before this edit.");
    if (error.code === "REQUEST_NOT_PENDING") return sendError(response, 409, "REQUEST_NOT_PENDING", "Wiki request is not pending.");
    if (error.code === "UNSUPPORTED_TYPE") return sendError(response, 415, "UNSUPPORTED_TYPE", "Unsupported wiki attachment type.");
    if (error.code === "FILE_TOO_LARGE") return sendError(response, 413, "FILE_TOO_LARGE", "Wiki attachment is too large.");
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

export async function getWikiPageBySlugHandler(request: Request, response: Response) {
  try {
    return sendOk(response, await getWikiPageBySlug(prisma, actorFrom(request), routeParam(request.params.slug)));
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

export async function archiveWikiPageHandler(request: Request, response: Response) {
  try {
    const page = await archiveWikiPage(prisma, actorFrom(request), routeParam(request.params.pageId));
    return sendOk(response, { page });
  } catch (error) {
    return sendWikiError(response, error);
  }
}

export async function unarchiveWikiPageHandler(request: Request, response: Response) {
  try {
    const page = await unarchiveWikiPage(prisma, actorFrom(request), routeParam(request.params.pageId));
    return sendOk(response, { page });
  } catch (error) {
    return sendWikiError(response, error);
  }
}

export async function restoreWikiRevisionHandler(request: Request, response: Response) {
  try {
    const page = await restoreWikiRevision(prisma, actorFrom(request), routeParam(request.params.pageId), routeParam(request.params.revisionId));
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

export async function uploadWikiAttachmentHandler(request: Request, response: Response) {
  try {
    const attachment = await uploadWikiAttachment(
      prisma,
      getStorageProvider(),
      actorFrom(request),
      parseWikiAttachmentUploadInput({ query: request.query, headers: request.headers, body: request.body })
    );
    return sendOk(response, { attachment }, 201);
  } catch (error) {
    return sendWikiError(response, error);
  }
}

export async function getWikiAttachmentFileHandler(request: Request, response: Response) {
  try {
    const file = await getWikiAttachmentFile(prisma, getStorageProvider(), actorFrom(request), routeParam(request.params.attachmentId));
    response.setHeader("content-type", file.mimeType);
    response.setHeader("content-length", String(file.size));
    response.setHeader("x-content-type-options", "nosniff");
    response.setHeader("cache-control", "private, max-age=0, must-revalidate");
    response.setHeader("content-disposition", `inline; filename="${file.fileName.replaceAll('"', "")}"`);
    return response.status(200).send(file.body);
  } catch (error) {
    return sendWikiError(response, error);
  }
}
