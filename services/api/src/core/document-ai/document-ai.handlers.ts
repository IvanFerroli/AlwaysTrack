import type { Request, Response } from "express";
import { prisma } from "../db/prisma.js";
import { sendError, sendOk } from "../http/responses.js";
import { getStorageProvider } from "../documents/storage.provider.js";
import { analyzeDocumentWithAi, applyDocumentAnalysis, DocumentAiError, listDocumentAnalyses } from "./document-ai.service.js";
import { getDocumentAiProvider } from "./provider.js";

function routeParam(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}

function actorFrom(request: Request) {
  if (!request.user) throw new DocumentAiError("FORBIDDEN");
  return request.user;
}

function sendDocumentAiError(response: Response, error: unknown) {
  if (error instanceof DocumentAiError) {
    if (error.code === "FORBIDDEN") return sendError(response, 403, "FORBIDDEN", "Access denied.");
    if (error.code === "NOT_FOUND") return sendError(response, 404, "NOT_FOUND", "Document analysis not found.");
    if (error.code === "PROVIDER_ERROR") return sendError(response, 502, "PROVIDER_ERROR", "Document analysis provider failed.");
    return sendError(response, 400, "INVALID_INPUT", "Invalid document analysis payload.");
  }
  throw error;
}

export async function analyzeDocumentHandler(request: Request, response: Response) {
  try {
    return sendOk(
      response,
      await analyzeDocumentWithAi(
        prisma,
        getStorageProvider(),
        getDocumentAiProvider(),
        actorFrom(request),
        routeParam(request.params.documentId)
      ),
      201
    );
  } catch (error) {
    return sendDocumentAiError(response, error);
  }
}

export async function listDocumentAnalysesHandler(request: Request, response: Response) {
  try {
    return sendOk(response, await listDocumentAnalyses(prisma, actorFrom(request), routeParam(request.params.documentId)));
  } catch (error) {
    return sendDocumentAiError(response, error);
  }
}

export async function applyDocumentAnalysisHandler(request: Request, response: Response) {
  try {
    const body = (request.body ?? {}) as Record<string, unknown>;
    const extractionId = typeof body.extractionId === "string" ? body.extractionId : undefined;
    return sendOk(response, await applyDocumentAnalysis(prisma, actorFrom(request), routeParam(request.params.documentId), extractionId));
  } catch (error) {
    return sendDocumentAiError(response, error);
  }
}
