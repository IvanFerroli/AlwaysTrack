import type { Request, Response } from "express";
import { prisma } from "../db/prisma.js";
import { sendError, sendOk } from "../http/responses.js";
import {
  buildPublicHelpLink,
  createFaqItem,
  FaqError,
  listFaqItems,
  listPublicFaqItems,
  parseFaqFilters,
  parseFaqInput,
  parsePublicHelpInput,
  updateFaqItem
} from "./faq.service.js";

function routeParam(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}

function actorFrom(request: Request) {
  if (!request.user) throw new FaqError("FORBIDDEN");
  return request.user;
}

function sendFaqError(response: Response, error: unknown) {
  if (error instanceof FaqError) {
    if (error.code === "FORBIDDEN") return sendError(response, 403, "FORBIDDEN", "Access denied.");
    if (error.code === "NOT_FOUND") return sendError(response, 404, "NOT_FOUND", "FAQ resource not found.");
    return sendError(response, 400, "INVALID_INPUT", "Invalid FAQ payload.");
  }
  throw error;
}

export async function listFaqItemsHandler(request: Request, response: Response) {
  try {
    return sendOk(response, await listFaqItems(prisma, actorFrom(request), parseFaqFilters(request.query)));
  } catch (error) {
    return sendFaqError(response, error);
  }
}

export async function listPublicFaqItemsHandler(request: Request, response: Response) {
  try {
    return sendOk(response, await listPublicFaqItems(prisma, parseFaqFilters(request.query)));
  } catch (error) {
    return sendFaqError(response, error);
  }
}

export async function createFaqItemHandler(request: Request, response: Response) {
  try {
    const faqItem = await createFaqItem(prisma, actorFrom(request), parseFaqInput(request.body));
    return sendOk(response, { faqItem }, 201);
  } catch (error) {
    return sendFaqError(response, error);
  }
}

export async function buildPublicHelpLinkHandler(request: Request, response: Response) {
  try {
    return sendOk(response, await buildPublicHelpLink(prisma, parsePublicHelpInput(request.body)));
  } catch (error) {
    return sendFaqError(response, error);
  }
}

export async function updateFaqItemHandler(request: Request, response: Response) {
  try {
    const faqItem = await updateFaqItem(
      prisma,
      actorFrom(request),
      routeParam(request.params.faqItemId),
      parseFaqInput(request.body)
    );
    return sendOk(response, { faqItem });
  } catch (error) {
    return sendFaqError(response, error);
  }
}
