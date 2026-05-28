import type { Request, Response } from "express";
import { prisma } from "../db/prisma.js";
import { sendError, sendOk } from "../http/responses.js";
import { getNotificationProvider } from "./provider.js";
import {
  createNotificationRule,
  createNotificationTemplate,
  handleMetaWebhook,
  listNotificationConfig,
  NotificationError,
  parseManualLicenseNotificationInput,
  parseNotificationRuleInput,
  parseNotificationScanInput,
  parseNotificationTemplateInput,
  processNotificationJobs,
  scanNotificationJobs,
  sendManualLicenseNotification,
  updateNotificationRule,
  updateNotificationTemplate,
  verifyWebhookChallenge
} from "./notifications.service.js";

function routeParam(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}

function actorFrom(request: Request) {
  if (!request.user) throw new NotificationError("FORBIDDEN");
  return request.user;
}

function sendNotificationError(response: Response, error: unknown) {
  if (error instanceof NotificationError) {
    if (error.code === "FORBIDDEN") return sendError(response, 403, "FORBIDDEN", "Access denied.");
    if (error.code === "NOT_FOUND") return sendError(response, 404, "NOT_FOUND", "Notification resource not found.");
    if (error.code === "TEMPLATE_TAKEN") return sendError(response, 409, "TEMPLATE_TAKEN", "Template key already exists.");
    if (error.code === "WEBHOOK_INVALID") return sendError(response, 403, "WEBHOOK_INVALID", "Invalid webhook.");
    if (error.code === "PROVIDER_ERROR") return sendError(response, 502, "PROVIDER_ERROR", "Notification provider failed.");
    return sendError(response, 400, "INVALID_INPUT", "Invalid notification payload.");
  }
  throw error;
}

export async function listNotificationConfigHandler(request: Request, response: Response) {
  try {
    return sendOk(response, await listNotificationConfig(prisma, actorFrom(request)));
  } catch (error) {
    return sendNotificationError(response, error);
  }
}

export async function createNotificationTemplateHandler(request: Request, response: Response) {
  try {
    const template = await createNotificationTemplate(prisma, actorFrom(request), parseNotificationTemplateInput(request.body));
    return sendOk(response, { template }, 201);
  } catch (error) {
    return sendNotificationError(response, error);
  }
}

export async function updateNotificationTemplateHandler(request: Request, response: Response) {
  try {
    const template = await updateNotificationTemplate(
      prisma,
      actorFrom(request),
      routeParam(request.params.templateId),
      parseNotificationTemplateInput(request.body)
    );
    return sendOk(response, { template });
  } catch (error) {
    return sendNotificationError(response, error);
  }
}

export async function createNotificationRuleHandler(request: Request, response: Response) {
  try {
    const rule = await createNotificationRule(prisma, actorFrom(request), parseNotificationRuleInput(request.body));
    return sendOk(response, { rule }, 201);
  } catch (error) {
    return sendNotificationError(response, error);
  }
}

export async function updateNotificationRuleHandler(request: Request, response: Response) {
  try {
    const rule = await updateNotificationRule(
      prisma,
      actorFrom(request),
      routeParam(request.params.ruleId),
      parseNotificationRuleInput(request.body)
    );
    return sendOk(response, { rule });
  } catch (error) {
    return sendNotificationError(response, error);
  }
}

export async function scanNotificationJobsHandler(request: Request, response: Response) {
  try {
    return sendOk(response, await scanNotificationJobs(prisma, actorFrom(request), parseNotificationScanInput(request.body)));
  } catch (error) {
    return sendNotificationError(response, error);
  }
}

export async function processNotificationJobsHandler(request: Request, response: Response) {
  try {
    return sendOk(response, await processNotificationJobs(prisma, actorFrom(request), getNotificationProvider()));
  } catch (error) {
    return sendNotificationError(response, error);
  }
}

export async function manualLicenseNotificationHandler(request: Request, response: Response) {
  try {
    return sendOk(
      response,
      await sendManualLicenseNotification(
        prisma,
        actorFrom(request),
        getNotificationProvider(),
        parseManualLicenseNotificationInput(request.body)
      )
    );
  } catch (error) {
    return sendNotificationError(response, error);
  }
}

export function verifyMetaWebhookHandler(request: Request, response: Response) {
  try {
    return response.status(200).send(verifyWebhookChallenge(request.query));
  } catch (error) {
    return sendNotificationError(response, error);
  }
}

export async function metaWebhookHandler(request: Request, response: Response) {
  try {
    const rawBody = Buffer.isBuffer(request.body) ? request.body.toString("utf8") : JSON.stringify(request.body ?? {});
    let body: unknown = request.body;
    if (Buffer.isBuffer(request.body)) {
      try {
        body = JSON.parse(rawBody);
      } catch {
        throw new NotificationError("WEBHOOK_INVALID");
      }
    }
    return sendOk(response, await handleMetaWebhook(prisma, body, request.header("x-hub-signature-256"), rawBody));
  } catch (error) {
    return sendNotificationError(response, error);
  }
}
