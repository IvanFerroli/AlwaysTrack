import type { Request, Response } from "express";
import { prisma } from "../db/prisma.js";
import { sendError, sendOk } from "../http/responses.js";
import {
  buildPublicHelpLink,
  addFaqComment,
  createFaqThread,
  createFaqItem,
  FaqError,
  listFaqItems,
  listFaqThreads,
  listPublicFaqItems,
  parseFaqCommentInput,
  parseFaqFilters,
  parseFaqInput,
  parsePublicHelpInput,
  parseFaqReactionInput,
  parseFaqThreadFilters,
  parseFaqThreadInput,
  promoteFaqThreadToWiki,
  setFaqReaction,
  updateFaqThreadStatus,
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

export async function listFaqThreadsHandler(request: Request, response: Response) {
  try {
    return sendOk(response, await listFaqThreads(prisma, actorFrom(request), parseFaqThreadFilters(request.query)));
  } catch (error) {
    return sendFaqError(response, error);
  }
}

export async function createFaqThreadHandler(request: Request, response: Response) {
  try {
    const thread = await createFaqThread(prisma, actorFrom(request), parseFaqThreadInput(request.body));
    return sendOk(response, { thread }, 201);
  } catch (error) {
    return sendFaqError(response, error);
  }
}

export async function addFaqCommentHandler(request: Request, response: Response) {
  try {
    const thread = await addFaqComment(prisma, actorFrom(request), routeParam(request.params.threadId), parseFaqCommentInput(request.body));
    return sendOk(response, { thread });
  } catch (error) {
    return sendFaqError(response, error);
  }
}

export async function updateFaqThreadStatusHandler(request: Request, response: Response) {
  try {
    const thread = await updateFaqThreadStatus(prisma, actorFrom(request), routeParam(request.params.threadId), parseFaqThreadInput(request.body));
    return sendOk(response, { thread });
  } catch (error) {
    return sendFaqError(response, error);
  }
}

export async function setFaqReactionHandler(request: Request, response: Response) {
  try {
    const thread = await setFaqReaction(prisma, actorFrom(request), routeParam(request.params.threadId), parseFaqReactionInput(request.body));
    return sendOk(response, { thread });
  } catch (error) {
    return sendFaqError(response, error);
  }
}

export async function promoteFaqThreadToWikiHandler(request: Request, response: Response) {
  try {
    const thread = await promoteFaqThreadToWiki(prisma, actorFrom(request), routeParam(request.params.threadId));
    return sendOk(response, { thread });
  } catch (error) {
    return sendFaqError(response, error);
  }
}
