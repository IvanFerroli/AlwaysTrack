import type { Request, Response } from "express";
import { prisma } from "../db/prisma.js";
import { sendError, sendOk } from "../http/responses.js";
import { getStorageProvider } from "../documents/storage.provider.js";
import { getDocumentAiProvider } from "../document-ai/provider.js";
import {
  analyzeSalesDocumentWithAi,
  getSalesRanking,
  getSalesStatements,
  getSalesDashboard,
  listSalesCampaigns,
  listSalesDocuments,
  parseSalesDocumentFilters,
  parseSalesDocumentReviewInput,
  parseSalesPeriodFilters,
  parseSalesDocumentUploadInput,
  reviewSalesDocument,
  salesStatementsCsv,
  SalesDocumentError,
  uploadSalesDocument
} from "./sales-documents.service.js";

function actorFrom(request: Request) {
  if (!request.user) throw new SalesDocumentError("FORBIDDEN");
  return request.user;
}

function sendSalesDocumentError(response: Response, error: unknown) {
  if (error instanceof SalesDocumentError) {
    if (error.code === "FORBIDDEN") return sendError(response, 403, "FORBIDDEN", "Access denied.");
    if (error.code === "NOT_FOUND") return sendError(response, 404, "NOT_FOUND", "Sales document not found.");
    if (error.code === "UNSUPPORTED_TYPE") return sendError(response, 415, "UNSUPPORTED_TYPE", "Unsupported sales document type.");
    if (error.code === "FILE_TOO_LARGE") return sendError(response, 413, "FILE_TOO_LARGE", "Sales document is too large.");
    if (error.code === "PROVIDER_ERROR") return sendError(response, 502, "PROVIDER_ERROR", "Could not extract sales document data.");
    if (error.code === "DUPLICATE") return sendError(response, 409, "DUPLICATE", "Sales document access key already exists.");
    return sendError(response, 400, "INVALID_INPUT", "Invalid sales document payload.");
  }
  throw error;
}

export async function salesDashboardHandler(request: Request, response: Response) {
  try {
    return sendOk(response, await getSalesDashboard(prisma, actorFrom(request)));
  } catch (error) {
    return sendSalesDocumentError(response, error);
  }
}

export async function listSalesDocumentsHandler(request: Request, response: Response) {
  try {
    return sendOk(response, await listSalesDocuments(prisma, actorFrom(request), parseSalesDocumentFilters(request.query)));
  } catch (error) {
    return sendSalesDocumentError(response, error);
  }
}

export async function listSalesCampaignsHandler(request: Request, response: Response) {
  try {
    return sendOk(response, await listSalesCampaigns(prisma, actorFrom(request)));
  } catch (error) {
    return sendSalesDocumentError(response, error);
  }
}

export async function salesRankingHandler(request: Request, response: Response) {
  try {
    return sendOk(response, await getSalesRanking(prisma, actorFrom(request), parseSalesPeriodFilters(request.query)));
  } catch (error) {
    return sendSalesDocumentError(response, error);
  }
}

export async function salesStatementsHandler(request: Request, response: Response) {
  try {
    return sendOk(response, await getSalesStatements(prisma, actorFrom(request), parseSalesPeriodFilters(request.query)));
  } catch (error) {
    return sendSalesDocumentError(response, error);
  }
}

export async function salesStatementsCsvHandler(request: Request, response: Response) {
  try {
    const csv = salesStatementsCsv(await getSalesStatements(prisma, actorFrom(request), parseSalesPeriodFilters(request.query)));
    response.header("content-type", "text/csv; charset=utf-8");
    response.header("content-disposition", 'attachment; filename="extrato-comercial.csv"');
    return response.status(200).send(csv);
  } catch (error) {
    return sendSalesDocumentError(response, error);
  }
}

export async function uploadSalesDocumentHandler(request: Request, response: Response) {
  try {
    const document = await uploadSalesDocument(
      prisma,
      getStorageProvider(),
      actorFrom(request),
      parseSalesDocumentUploadInput({ query: request.query, headers: request.headers, body: request.body })
    );
    return sendOk(response, { document }, 201);
  } catch (error) {
    return sendSalesDocumentError(response, error);
  }
}

export async function analyzeSalesDocumentHandler(request: Request, response: Response) {
  try {
    return sendOk(
      response,
      await analyzeSalesDocumentWithAi(prisma, getStorageProvider(), getDocumentAiProvider(), actorFrom(request), String(request.params.documentId))
    );
  } catch (error) {
    return sendSalesDocumentError(response, error);
  }
}

export async function reviewSalesDocumentHandler(request: Request, response: Response) {
  try {
    return sendOk(
      response,
      await reviewSalesDocument(prisma, actorFrom(request), String(request.params.documentId), parseSalesDocumentReviewInput(request.body))
    );
  } catch (error) {
    return sendSalesDocumentError(response, error);
  }
}
