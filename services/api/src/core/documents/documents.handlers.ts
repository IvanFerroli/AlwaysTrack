import type { Request, Response } from "express";
import { prisma } from "../db/prisma.js";
import { sendError, sendOk } from "../http/responses.js";
import {
  DocumentError,
  getDocumentDownload,
  listDocuments,
  parseDocumentFilters,
  parseDocumentUploadInput,
  parseValidateDocumentInput,
  uploadDocument,
  validateDocument
} from "./documents.service.js";
import { getStorageProvider } from "./storage.provider.js";

function routeParam(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}

function actorFrom(request: Request) {
  if (!request.user) {
    throw new DocumentError("FORBIDDEN");
  }
  return request.user;
}

function sendDocumentError(response: Response, error: unknown) {
  if (error instanceof DocumentError) {
    if (error.code === "FORBIDDEN") return sendError(response, 403, "FORBIDDEN", "Access denied.");
    if (error.code === "NOT_FOUND") return sendError(response, 404, "NOT_FOUND", "Document not found.");
    if (error.code === "UNSUPPORTED_TYPE") return sendError(response, 415, "UNSUPPORTED_TYPE", "Unsupported document type.");
    if (error.code === "FILE_TOO_LARGE") return sendError(response, 413, "FILE_TOO_LARGE", "Document is too large.");
    if (error.code === "ALREADY_VALIDATED") {
      return sendError(response, 409, "ALREADY_VALIDATED", "Document already validated.");
    }
    return sendError(response, 400, "INVALID_INPUT", "Invalid document payload.");
  }

  throw error;
}

export async function listDocumentsHandler(request: Request, response: Response) {
  try {
    const result = await listDocuments(prisma, actorFrom(request), parseDocumentFilters(request.query));
    return sendOk(response, result);
  } catch (error) {
    return sendDocumentError(response, error);
  }
}

export async function uploadDocumentHandler(request: Request, response: Response) {
  try {
    const document = await uploadDocument(
      prisma,
      getStorageProvider(),
      actorFrom(request),
      parseDocumentUploadInput({ query: request.query, headers: request.headers, body: request.body })
    );
    return sendOk(response, { document }, 201);
  } catch (error) {
    return sendDocumentError(response, error);
  }
}

export async function downloadDocumentHandler(request: Request, response: Response) {
  try {
    const download = await getDocumentDownload(
      prisma,
      getStorageProvider(),
      actorFrom(request),
      routeParam(request.params.documentId)
    );
    response.setHeader("content-type", download.mimeType);
    response.setHeader("content-length", String(download.size));
    response.setHeader("content-disposition", `inline; filename="${download.fileName.replaceAll('"', "")}"`);
    return response.status(200).send(download.body);
  } catch (error) {
    return sendDocumentError(response, error);
  }
}

export async function validateDocumentHandler(request: Request, response: Response) {
  try {
    const document = await validateDocument(
      prisma,
      actorFrom(request),
      routeParam(request.params.documentId),
      parseValidateDocumentInput(request.body)
    );
    return sendOk(response, { document });
  } catch (error) {
    return sendDocumentError(response, error);
  }
}
