import type { Request, Response } from "express";
import { prisma } from "../db/prisma.js";
import { sendError, sendOk } from "../http/responses.js";
import { getStorageProvider } from "./storage.provider.js";
import {
  createUploadToken,
  getPublicUploadToken,
  invalidateUploadToken,
  parseCreateUploadTokenInput,
  parsePublicUploadInput,
  toDocumentError,
  uploadDocumentWithToken,
  UploadTokenError
} from "./upload-tokens.service.js";

function routeParam(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}

function actorFrom(request: Request) {
  if (!request.user) {
    throw new UploadTokenError("FORBIDDEN");
  }
  return request.user;
}

function sendUploadTokenError(response: Response, error: unknown) {
  const documentError = toDocumentError(error);
  if (documentError) {
    if (documentError.code === "UNSUPPORTED_TYPE") return sendError(response, 415, "UNSUPPORTED_TYPE", "Unsupported document type.");
    if (documentError.code === "FILE_TOO_LARGE") return sendError(response, 413, "FILE_TOO_LARGE", "Document is too large.");
    return sendError(response, 400, "INVALID_INPUT", "Invalid document payload.");
  }

  if (error instanceof UploadTokenError) {
    if (error.code === "FORBIDDEN") return sendError(response, 403, "FORBIDDEN", "Access denied.");
    if (error.code === "NOT_FOUND") return sendError(response, 404, "NOT_FOUND", "Upload link not found.");
    if (error.code === "EXPIRED") return sendError(response, 410, "EXPIRED", "Upload link expired.");
    if (error.code === "USED") return sendError(response, 410, "USED", "Upload link already used.");
    if (error.code === "INACTIVE") return sendError(response, 410, "INACTIVE", "Upload link inactive.");
    return sendError(response, 400, "INVALID_INPUT", "Invalid upload link payload.");
  }

  throw error;
}

export async function createUploadTokenHandler(request: Request, response: Response) {
  try {
    const result = await createUploadToken(prisma, actorFrom(request), parseCreateUploadTokenInput(request.body));
    return sendOk(response, result, 201);
  } catch (error) {
    return sendUploadTokenError(response, error);
  }
}

export async function invalidateUploadTokenHandler(request: Request, response: Response) {
  try {
    const uploadToken = await invalidateUploadToken(prisma, actorFrom(request), routeParam(request.params.uploadTokenId));
    return sendOk(response, { uploadToken });
  } catch (error) {
    return sendUploadTokenError(response, error);
  }
}

export async function getPublicUploadTokenHandler(request: Request, response: Response) {
  try {
    const uploadToken = await getPublicUploadToken(prisma, routeParam(request.params.token));
    return sendOk(response, { uploadToken });
  } catch (error) {
    return sendUploadTokenError(response, error);
  }
}

export async function publicUploadDocumentHandler(request: Request, response: Response) {
  try {
    const document = await uploadDocumentWithToken(
      prisma,
      getStorageProvider(),
      parsePublicUploadInput({
        token: request.params.token,
        query: request.query,
        headers: request.headers,
        body: request.body
      })
    );
    return sendOk(response, { document }, 201);
  } catch (error) {
    return sendUploadTokenError(response, error);
  }
}
