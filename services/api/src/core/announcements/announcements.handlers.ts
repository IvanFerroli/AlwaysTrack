import type { Request, Response } from "express";
import { prisma } from "../db/prisma.js";
import { sendError, sendOk } from "../http/responses.js";
import { isInputValidationError, sendInputValidationError } from "../validation/input-validation.js";
import {
  acknowledgeAnnouncement,
  AnnouncementError,
  archiveAnnouncement,
  createAnnouncement,
  getAnnouncementBySlug,
  listAnnouncements,
  parseAnnouncementFilters,
  parseAnnouncementInput,
  publishAnnouncement,
  updateAnnouncement
} from "./announcements.service.js";

function routeParam(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}

function actorFrom(request: Request) {
  if (!request.user) throw new AnnouncementError("FORBIDDEN");
  return request.user;
}

function sendAnnouncementError(response: Response, error: unknown) {
  if (isInputValidationError(error)) return sendInputValidationError(response);
  if (error instanceof AnnouncementError) {
    if (error.code === "FORBIDDEN") return sendError(response, 403, "FORBIDDEN", "Access denied.");
    if (error.code === "NOT_FOUND") return sendError(response, 404, "NOT_FOUND", "Announcement not found.");
    if (error.code === "SLUG_TAKEN") return sendError(response, 409, "SLUG_TAKEN", "Announcement slug already exists.");
    return sendError(response, 400, "INVALID_INPUT", "Invalid announcement payload.");
  }
  throw error;
}

export async function listAnnouncementsHandler(request: Request, response: Response) {
  try {
    return sendOk(response, await listAnnouncements(prisma, actorFrom(request), parseAnnouncementFilters(request.query)));
  } catch (error) {
    return sendAnnouncementError(response, error);
  }
}

export async function getAnnouncementBySlugHandler(request: Request, response: Response) {
  try {
    return sendOk(response, await getAnnouncementBySlug(prisma, actorFrom(request), routeParam(request.params.slug)));
  } catch (error) {
    return sendAnnouncementError(response, error);
  }
}

export async function createAnnouncementHandler(request: Request, response: Response) {
  try {
    return sendOk(response, await createAnnouncement(prisma, actorFrom(request), parseAnnouncementInput(request.body)), 201);
  } catch (error) {
    return sendAnnouncementError(response, error);
  }
}

export async function updateAnnouncementHandler(request: Request, response: Response) {
  try {
    return sendOk(response, await updateAnnouncement(prisma, actorFrom(request), routeParam(request.params.announcementId), parseAnnouncementInput(request.body)));
  } catch (error) {
    return sendAnnouncementError(response, error);
  }
}

export async function publishAnnouncementHandler(request: Request, response: Response) {
  try {
    return sendOk(response, await publishAnnouncement(prisma, actorFrom(request), routeParam(request.params.announcementId)));
  } catch (error) {
    return sendAnnouncementError(response, error);
  }
}

export async function archiveAnnouncementHandler(request: Request, response: Response) {
  try {
    return sendOk(response, await archiveAnnouncement(prisma, actorFrom(request), routeParam(request.params.announcementId)));
  } catch (error) {
    return sendAnnouncementError(response, error);
  }
}

export async function acknowledgeAnnouncementHandler(request: Request, response: Response) {
  try {
    return sendOk(response, await acknowledgeAnnouncement(prisma, actorFrom(request), routeParam(request.params.announcementId)));
  } catch (error) {
    return sendAnnouncementError(response, error);
  }
}
