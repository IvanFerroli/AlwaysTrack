import type { Request, Response } from "express";
import { prisma } from "../db/prisma.js";
import { sendError, sendOk } from "../http/responses.js";
import { parseReportFilters, ReportError, runReport } from "./reports.service.js";

type ReportKind =
  | "expiredLicenses"
  | "expiringLicenses"
  | "rtSummary"
  | "areaSummary"
  | "pendingDocuments"
  | "rejectedDocuments"
  | "notifications"
  | "regularization";

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

export function expiredLicensesReportHandler(request: Request, response: Response) {
  return reportHandler(request, response, "expiredLicenses");
}

export function expiringLicensesReportHandler(request: Request, response: Response) {
  return reportHandler(request, response, "expiringLicenses");
}

export function rtSummaryReportHandler(request: Request, response: Response) {
  return reportHandler(request, response, "rtSummary");
}

export function areaSummaryReportHandler(request: Request, response: Response) {
  return reportHandler(request, response, "areaSummary");
}

export function pendingDocumentsReportHandler(request: Request, response: Response) {
  return reportHandler(request, response, "pendingDocuments");
}

export function rejectedDocumentsReportHandler(request: Request, response: Response) {
  return reportHandler(request, response, "rejectedDocuments");
}

export function notificationsReportHandler(request: Request, response: Response) {
  return reportHandler(request, response, "notifications");
}

export function regularizationReportHandler(request: Request, response: Response) {
  return reportHandler(request, response, "regularization");
}
