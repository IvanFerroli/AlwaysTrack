import type { Request, Response } from "express";
import { prisma } from "../db/prisma.js";
import { sendError, sendOk } from "../http/responses.js";
import { exportReportCsv, parseReportFilters, ReportError, runReport, type ReportKind } from "./reports.service.js";

function requireUser(request: Request, response: Response) {
  if (!request.user) {
    sendError(response, 401, "UNAUTHENTICATED", "Login required.");
    return null;
  }
  return request.user;
}

async function reportHandler(request: Request, response: Response, kind: ReportKind) {
  const user = requireUser(request, response);
  if (!user) return;

  try {
    const result = await runReport(prisma, user, kind, parseReportFilters(request.query));
    return sendOk(response, result);
  } catch (error) {
    if (error instanceof ReportError && error.code === "FORBIDDEN") {
      return sendError(response, 403, "FORBIDDEN", "Report not available for this user.");
    }
    throw error;
  }
}

async function csvReportHandler(request: Request, response: Response, kind: ReportKind, fileName: string) {
  const user = requireUser(request, response);
  if (!user) return;

  try {
    const csv = await exportReportCsv(prisma, user, kind, parseReportFilters(request.query));
    response.setHeader("content-type", "text/csv; charset=utf-8");
    response.setHeader("content-disposition", `attachment; filename="${fileName}.csv"`);
    return response.status(200).send(csv);
  } catch (error) {
    if (error instanceof ReportError && error.code === "FORBIDDEN") {
      return sendError(response, 403, "FORBIDDEN", "Report not available for this user.");
    }
    throw error;
  }
}

export function expiredLicensesReportHandler(request: Request, response: Response) {
  return reportHandler(request, response, "expiredLicenses");
}

export function expiredLicensesCsvReportHandler(request: Request, response: Response) {
  return csvReportHandler(request, response, "expiredLicenses", "licencas-vencidas");
}

export function expiringLicensesReportHandler(request: Request, response: Response) {
  return reportHandler(request, response, "expiringLicenses");
}

export function expiringLicensesCsvReportHandler(request: Request, response: Response) {
  return csvReportHandler(request, response, "expiringLicenses", "licencas-a-vencer");
}

export function rtSummaryReportHandler(request: Request, response: Response) {
  return reportHandler(request, response, "rtSummary");
}

export function rtSummaryCsvReportHandler(request: Request, response: Response) {
  return csvReportHandler(request, response, "rtSummary", "resumo-por-rt");
}

export function areaSummaryReportHandler(request: Request, response: Response) {
  return reportHandler(request, response, "areaSummary");
}

export function areaSummaryCsvReportHandler(request: Request, response: Response) {
  return csvReportHandler(request, response, "areaSummary", "resumo-por-area");
}

export function pendingDocumentsReportHandler(request: Request, response: Response) {
  return reportHandler(request, response, "pendingDocuments");
}

export function pendingDocumentsCsvReportHandler(request: Request, response: Response) {
  return csvReportHandler(request, response, "pendingDocuments", "documentos-pendentes");
}

export function rejectedDocumentsReportHandler(request: Request, response: Response) {
  return reportHandler(request, response, "rejectedDocuments");
}

export function rejectedDocumentsCsvReportHandler(request: Request, response: Response) {
  return csvReportHandler(request, response, "rejectedDocuments", "documentos-recusados");
}

export function notificationsReportHandler(request: Request, response: Response) {
  return reportHandler(request, response, "notifications");
}

export function notificationsCsvReportHandler(request: Request, response: Response) {
  return csvReportHandler(request, response, "notifications", "notificacoes");
}

export function regularizationReportHandler(request: Request, response: Response) {
  return reportHandler(request, response, "regularization");
}

export function regularizationCsvReportHandler(request: Request, response: Response) {
  return csvReportHandler(request, response, "regularization", "regularizacao");
}
