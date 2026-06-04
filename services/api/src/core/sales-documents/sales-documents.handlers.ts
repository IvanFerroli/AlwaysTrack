import type { Request, Response } from "express";
import { prisma } from "../db/prisma.js";
import { sendError, sendOk } from "../http/responses.js";
import { getStorageProvider } from "../documents/storage.provider.js";
import { getDocumentAiProvider } from "../document-ai/provider.js";
import { logEvent } from "../diagnostics/logger.js";
import {
  analyzeSalesDocumentWithAi,
  createRankingSnapshot,
  createSalesCampaign,
  getSalesRanking,
  getSalesStatements,
  getSalesDashboard,
  listRankingSnapshots,
  listSalesCampaigns,
  listSalesDocuments,
  parseSalesCampaignInput,
  parseSalesDocumentFilters,
  parseSalesDocumentReviewInput,
  parseSalesPeriodFilters,
  parseSalesDocumentUploadInput,
  reviewSalesDocument,
  salesStatementsCsv,
  SalesDocumentError,
  updateSalesCampaign,
  uploadSalesDocument
} from "./sales-documents.service.js";

function actorFrom(request: Request) {
  if (!request.user) throw new SalesDocumentError("FORBIDDEN");
  return request.user;
}

function logHandlerError(request: Request, event: string, error: unknown) {
  logEvent("error", event, {
    requestId: request.context?.requestId,
    actorId: request.user?.id,
    actorRole: request.user?.role,
    path: request.originalUrl,
    error
  });
}

function sendSalesDocumentError(request: Request, response: Response, error: unknown) {
  if (error instanceof SalesDocumentError) {
    if (error.code === "FORBIDDEN") return sendError(response, 403, "FORBIDDEN", "Access denied.");
    if (error.code === "NOT_FOUND") return sendError(response, 404, "NOT_FOUND", "Sales document not found.");
    if (error.code === "UNSUPPORTED_TYPE") return sendError(response, 415, "UNSUPPORTED_TYPE", "Unsupported sales document type.");
    if (error.code === "FILE_TOO_LARGE") return sendError(response, 413, "FILE_TOO_LARGE", "Sales document is too large.");
    if (error.code === "STORED_FILE_MISSING") {
      return sendError(response, 409, "STORED_FILE_MISSING", "Arquivo da nota nao encontrado no storage local. Envie a DANFE novamente.");
    }
    if (error.code === "PROVIDER_ERROR") return sendError(response, 502, "PROVIDER_ERROR", "Could not extract sales document data.");
    if (error.code === "DUPLICATE") return sendError(response, 409, "DUPLICATE", "Sales document access key already exists.");
    return sendError(response, 400, "INVALID_INPUT", "Invalid sales document payload.");
  }
  throw error;
}

export async function salesDashboardHandler(request: Request, response: Response) {
  try {
    const result = await getSalesDashboard(prisma, actorFrom(request));
    logEvent("info", "sales_dashboard.read", {
      requestId: request.context?.requestId,
      actorId: request.user?.id,
      actorRole: request.user?.role,
      metrics: result.metrics
    });
    return sendOk(response, result);
  } catch (error) {
    logHandlerError(request, "sales_dashboard.failed", error);
    return sendSalesDocumentError(request, response, error);
  }
}

export async function listSalesDocumentsHandler(request: Request, response: Response) {
  try {
    return sendOk(response, await listSalesDocuments(prisma, actorFrom(request), parseSalesDocumentFilters(request.query)));
  } catch (error) {
    logHandlerError(request, "sales_documents.list.failed", error);
    return sendSalesDocumentError(request, response, error);
  }
}

export async function listSalesCampaignsHandler(request: Request, response: Response) {
  try {
    const result = await listSalesCampaigns(prisma, actorFrom(request));
    logEvent("info", "sales_campaigns.read", {
      requestId: request.context?.requestId,
      actorId: request.user?.id,
      actorRole: request.user?.role,
      total: result.total
    });
    return sendOk(response, result);
  } catch (error) {
    logHandlerError(request, "sales_campaigns.failed", error);
    return sendSalesDocumentError(request, response, error);
  }
}

export async function createSalesCampaignHandler(request: Request, response: Response) {
  try {
    const result = await createSalesCampaign(prisma, actorFrom(request), parseSalesCampaignInput(request.body));
    logEvent("info", "sales_campaign.create", {
      requestId: request.context?.requestId,
      actorId: request.user?.id,
      actorRole: request.user?.role,
      campaignId: result.campaign.id
    });
    return sendOk(response, result, 201);
  } catch (error) {
    logHandlerError(request, "sales_campaign.create.failed", error);
    return sendSalesDocumentError(request, response, error);
  }
}

export async function updateSalesCampaignHandler(request: Request, response: Response) {
  try {
    const result = await updateSalesCampaign(prisma, actorFrom(request), String(request.params.campaignId), parseSalesCampaignInput(request.body));
    logEvent("info", "sales_campaign.update", {
      requestId: request.context?.requestId,
      actorId: request.user?.id,
      actorRole: request.user?.role,
      campaignId: result.campaign.id,
      status: result.campaign.status
    });
    return sendOk(response, result);
  } catch (error) {
    logHandlerError(request, "sales_campaign.update.failed", error);
    return sendSalesDocumentError(request, response, error);
  }
}

export async function listRankingSnapshotsHandler(request: Request, response: Response) {
  try {
    const result = await listRankingSnapshots(prisma, actorFrom(request));
    logEvent("info", "sales_ranking_snapshots.read", {
      requestId: request.context?.requestId,
      actorId: request.user?.id,
      actorRole: request.user?.role,
      total: result.total
    });
    return sendOk(response, result);
  } catch (error) {
    logHandlerError(request, "sales_ranking_snapshots.failed", error);
    return sendSalesDocumentError(request, response, error);
  }
}

export async function createRankingSnapshotHandler(request: Request, response: Response) {
  try {
    const result = await createRankingSnapshot(prisma, actorFrom(request), String(request.params.campaignId));
    logEvent("info", "sales_ranking_snapshot.create", {
      requestId: request.context?.requestId,
      actorId: request.user?.id,
      actorRole: request.user?.role,
      campaignId: request.params.campaignId,
      snapshotId: result.snapshot.id
    });
    return sendOk(response, result, 201);
  } catch (error) {
    logHandlerError(request, "sales_ranking_snapshot.create.failed", error);
    return sendSalesDocumentError(request, response, error);
  }
}

export async function salesRankingHandler(request: Request, response: Response) {
  try {
    const filters = parseSalesPeriodFilters(request.query);
    const result = await getSalesRanking(prisma, actorFrom(request), filters);
    logEvent("info", "sales_ranking.read", {
      requestId: request.context?.requestId,
      actorId: request.user?.id,
      actorRole: request.user?.role,
      filters,
      total: result.total
    });
    return sendOk(response, result);
  } catch (error) {
    logHandlerError(request, "sales_ranking.failed", error);
    return sendSalesDocumentError(request, response, error);
  }
}

export async function salesStatementsHandler(request: Request, response: Response) {
  try {
    const filters = parseSalesPeriodFilters(request.query);
    const result = await getSalesStatements(prisma, actorFrom(request), filters);
    logEvent("info", "sales_statements.read", {
      requestId: request.context?.requestId,
      actorId: request.user?.id,
      actorRole: request.user?.role,
      filters,
      summary: result.summary
    });
    return sendOk(response, result);
  } catch (error) {
    logHandlerError(request, "sales_statements.failed", error);
    return sendSalesDocumentError(request, response, error);
  }
}

export async function salesStatementsCsvHandler(request: Request, response: Response) {
  try {
    const filters = parseSalesPeriodFilters(request.query);
    const statement = await getSalesStatements(prisma, actorFrom(request), filters);
    const csv = salesStatementsCsv(statement);
    logEvent("info", "sales_statements_csv.read", {
      requestId: request.context?.requestId,
      actorId: request.user?.id,
      actorRole: request.user?.role,
      filters,
      summary: statement.summary
    });
    response.header("content-type", "text/csv; charset=utf-8");
    response.header("content-disposition", 'attachment; filename="extrato-comercial.csv"');
    return response.status(200).send(csv);
  } catch (error) {
    logHandlerError(request, "sales_statements_csv.failed", error);
    return sendSalesDocumentError(request, response, error);
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
    logHandlerError(request, "sales_document.upload.failed", error);
    return sendSalesDocumentError(request, response, error);
  }
}

export async function analyzeSalesDocumentHandler(request: Request, response: Response) {
  try {
    const forceAi = request.query.forceAi === "1" || request.query.forceAi === "true";
    return sendOk(
      response,
      await analyzeSalesDocumentWithAi(prisma, getStorageProvider(), getDocumentAiProvider(), actorFrom(request), String(request.params.documentId), { forceAi })
    );
  } catch (error) {
    logHandlerError(request, "sales_document.extract.handler_failed", error);
    return sendSalesDocumentError(request, response, error);
  }
}

export async function reviewSalesDocumentHandler(request: Request, response: Response) {
  try {
    return sendOk(
      response,
      await reviewSalesDocument(prisma, actorFrom(request), String(request.params.documentId), parseSalesDocumentReviewInput(request.body))
    );
  } catch (error) {
    logHandlerError(request, "sales_document.review.handler_failed", error);
    return sendSalesDocumentError(request, response, error);
  }
}
