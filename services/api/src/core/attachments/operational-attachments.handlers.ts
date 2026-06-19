import type { Request, Response } from "express";
import { prisma } from "../db/prisma.js";
import { getStorageProvider } from "../documents/storage.provider.js";
import { sendError, sendOk } from "../http/responses.js";
import { isInputValidationError, sendInputValidationError } from "../validation/input-validation.js";
import {
  archiveOperationalAttachment,
  getOperationalAttachmentFile,
  OperationalAttachmentError,
  parseOperationalAttachmentUploadInput,
  uploadOperationalAttachment
} from "./operational-attachments.service.js";

function routeParam(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}

function actorFrom(request: Request) {
  if (!request.user) throw new OperationalAttachmentError("FORBIDDEN");
  return request.user;
}

function sendOperationalAttachmentError(response: Response, error: unknown) {
  if (isInputValidationError(error)) return sendInputValidationError(response);
  if (error instanceof OperationalAttachmentError) {
    if (error.code === "FORBIDDEN") return sendError(response, 403, "FORBIDDEN", "Access denied.");
    if (error.code === "NOT_FOUND") return sendError(response, 404, "NOT_FOUND", "Attachment not found.");
    if (error.code === "UNSUPPORTED_TYPE") return sendError(response, 415, "UNSUPPORTED_TYPE", "Unsupported attachment type.");
    if (error.code === "FILE_TOO_LARGE") return sendError(response, 413, "FILE_TOO_LARGE", "Attachment is too large.");
    return sendError(response, 400, "INVALID_INPUT", "Invalid attachment payload.");
  }
  throw error;
}

export async function uploadOperationalAttachmentHandler(request: Request, response: Response) {
  try {
    const attachment = await uploadOperationalAttachment(
      prisma,
      getStorageProvider(),
      actorFrom(request),
      parseOperationalAttachmentUploadInput({ query: request.query, headers: request.headers, body: request.body })
    );
    return sendOk(response, { attachment }, 201);
  } catch (error) {
    return sendOperationalAttachmentError(response, error);
  }
}

export async function getOperationalAttachmentFileHandler(request: Request, response: Response) {
  try {
    const file = await getOperationalAttachmentFile(prisma, getStorageProvider(), actorFrom(request), routeParam(request.params.attachmentId));
    response.setHeader("content-type", file.mimeType);
    response.setHeader("content-length", String(file.size));
    response.setHeader("x-content-type-options", "nosniff");
    response.setHeader("cache-control", "private, max-age=0, must-revalidate");
    response.setHeader("content-disposition", `inline; filename="${file.fileName.replaceAll('"', "")}"`);
    return response.status(200).send(file.body);
  } catch (error) {
    return sendOperationalAttachmentError(response, error);
  }
}

export async function archiveOperationalAttachmentHandler(request: Request, response: Response) {
  try {
    const attachment = await archiveOperationalAttachment(prisma, actorFrom(request), routeParam(request.params.attachmentId));
    return sendOk(response, { attachment });
  } catch (error) {
    return sendOperationalAttachmentError(response, error);
  }
}
