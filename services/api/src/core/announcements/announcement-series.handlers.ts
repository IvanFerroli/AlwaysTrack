import type { Request, Response } from "express";
import { prisma } from "../db/prisma.js";
import { sendError, sendOk } from "../http/responses.js";
import { isInputValidationError, sendInputValidationError } from "../validation/input-validation.js";
import {
  archiveAnnouncementSeries,
  cancelAnnouncementOccurrence,
  createAnnouncementSeries,
  createFutureAnnouncementSeriesVersion,
  getAnnouncementSeries,
  listAnnouncementSeries,
  materializeAnnouncementOccurrences,
  parseAnnouncementSeriesFilters,
  parseAnnouncementSeriesVersionInput,
  parseCancelAnnouncementOccurrenceInput,
  parseCreateAnnouncementSeriesInput,
  parseMaterializeAnnouncementOccurrencesInput
} from "./announcement-series.service.js";
import { AnnouncementError } from "./announcements.service.js";

function routeParam(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}

function actorFrom(request: Request) {
  if (!request.user) throw new AnnouncementError("FORBIDDEN");
  return request.user;
}

function sendAnnouncementSeriesError(response: Response, error: unknown) {
  if (isInputValidationError(error)) return sendInputValidationError(response);
  if (error instanceof AnnouncementError) {
    if (error.code === "FORBIDDEN") return sendError(response, 403, "FORBIDDEN", "Access denied.");
    if (error.code === "NOT_FOUND") return sendError(response, 404, "NOT_FOUND", "Announcement schedule not found.");
    if (error.code === "SLUG_TAKEN") return sendError(response, 409, "SLUG_TAKEN", "Announcement series slug already exists.");
    if (error.code === "CONFLICT") return sendError(response, 409, "CONFLICT", "Announcement schedule state conflicts with this operation.");
    return sendError(response, 400, "INVALID_INPUT", "Invalid announcement schedule payload.");
  }
  throw error;
}

export async function listAnnouncementSeriesHandler(request: Request, response: Response) {
  try {
    return sendOk(response, await listAnnouncementSeries(prisma, actorFrom(request), parseAnnouncementSeriesFilters(request.query)));
  } catch (error) {
    return sendAnnouncementSeriesError(response, error);
  }
}

export async function getAnnouncementSeriesHandler(request: Request, response: Response) {
  try {
    return sendOk(response, await getAnnouncementSeries(prisma, actorFrom(request), routeParam(request.params.seriesId)));
  } catch (error) {
    return sendAnnouncementSeriesError(response, error);
  }
}

export async function createAnnouncementSeriesHandler(request: Request, response: Response) {
  try {
    return sendOk(response, await createAnnouncementSeries(prisma, actorFrom(request), parseCreateAnnouncementSeriesInput(request.body)), 201);
  } catch (error) {
    return sendAnnouncementSeriesError(response, error);
  }
}

export async function createAnnouncementSeriesVersionHandler(request: Request, response: Response) {
  try {
    return sendOk(
      response,
      await createFutureAnnouncementSeriesVersion(
        prisma,
        actorFrom(request),
        routeParam(request.params.seriesId),
        parseAnnouncementSeriesVersionInput(request.body)
      ),
      201
    );
  } catch (error) {
    return sendAnnouncementSeriesError(response, error);
  }
}

export async function archiveAnnouncementSeriesHandler(request: Request, response: Response) {
  try {
    const { reason } = parseCancelAnnouncementOccurrenceInput(request.body);
    return sendOk(
      response,
      await archiveAnnouncementSeries(prisma, actorFrom(request), routeParam(request.params.seriesId), reason ?? "SERIES_ARCHIVED")
    );
  } catch (error) {
    return sendAnnouncementSeriesError(response, error);
  }
}

export async function materializeAnnouncementOccurrencesHandler(request: Request, response: Response) {
  try {
    return sendOk(
      response,
      await materializeAnnouncementOccurrences(prisma, {
        actor: actorFrom(request),
        ...parseMaterializeAnnouncementOccurrencesInput(request.body)
      })
    );
  } catch (error) {
    return sendAnnouncementSeriesError(response, error);
  }
}

export async function cancelAnnouncementOccurrenceHandler(request: Request, response: Response) {
  try {
    const { reason } = parseCancelAnnouncementOccurrenceInput(request.body);
    return sendOk(
      response,
      await cancelAnnouncementOccurrence(prisma, actorFrom(request), routeParam(request.params.occurrenceId), reason)
    );
  } catch (error) {
    return sendAnnouncementSeriesError(response, error);
  }
}
