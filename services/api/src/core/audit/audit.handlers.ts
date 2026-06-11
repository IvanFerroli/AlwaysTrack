import type { Request, Response } from "express";
import { prisma } from "../db/prisma.js";
import { sendError, sendOk } from "../http/responses.js";
import { listAuditLogs } from "./audit.service.js";

function parsePositiveInteger(value: unknown) {
  if (typeof value !== "string") {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function parseDate(value: unknown) {
  if (typeof value !== "string" || value.trim() === "") {
    return undefined;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseDateEndOfDay(value: unknown) {
  const parsed = parseDate(value);
  if (!parsed || typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return parsed;
  parsed.setUTCHours(23, 59, 59, 999);
  return parsed;
}

export async function listAuditLogsHandler(request: Request, response: Response) {
  if (!request.user) {
    return sendError(response, 401, "UNAUTHENTICATED", "Login required.");
  }

  const from = parseDate(request.query.from);
  const to = parseDateEndOfDay(request.query.to);
  if (from === null || to === null) {
    return sendError(response, 400, "INVALID_DATE", "Invalid from/to date.");
  }

  const result = await listAuditLogs(prisma, {
    organizationId: request.user.organizationId,
    actorId: typeof request.query.actorId === "string" ? request.query.actorId : undefined,
    action: typeof request.query.action === "string" ? request.query.action : undefined,
    entityType: typeof request.query.entityType === "string" ? request.query.entityType : undefined,
    entityId: typeof request.query.entityId === "string" ? request.query.entityId : undefined,
    from: from ?? undefined,
    to: to ?? undefined,
    page: parsePositiveInteger(request.query.page),
    pageSize: parsePositiveInteger(request.query.pageSize)
  });

  return sendOk(response, result);
}
