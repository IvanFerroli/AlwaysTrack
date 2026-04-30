import type { Prisma, PrismaClient } from "@prisma/client";
import { notificationChannels, notificationStatuses, type CurrentUser, type NotificationChannel } from "@sylembra/shared";
import { loadEnv } from "../../config/env.js";
import { recordAuditLog } from "../audit/audit.service.js";
import type { NotificationProvider } from "./provider.js";
import { NotificationProviderError, verifyMetaSignature } from "./provider.js";

export class NotificationError extends Error {
  constructor(
    public readonly code:
      | "NOT_FOUND"
      | "INVALID_INPUT"
      | "FORBIDDEN"
      | "TEMPLATE_TAKEN"
      | "WEBHOOK_INVALID"
      | "PROVIDER_ERROR"
  ) {
    super(code);
  }
}

export interface NotificationTemplateInput {
  key?: string;
  channel?: NotificationChannel;
  metaTemplateName?: string | null;
  language?: string;
  bodyPreview?: string | null;
  active?: boolean;
}

export interface NotificationRuleInput {
  licenseTypeId?: string | null;
  daysBeforeExpiration?: number | null;
  repeatAfterExpiredDays?: number | null;
  channel?: NotificationChannel;
  templateKey?: string;
  notifyProfessional?: boolean;
  notifyRt?: boolean;
  active?: boolean;
}

export interface NotificationScanInput {
  dryRun?: boolean;
  today?: Date;
}

function cleanText(value: unknown) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function cleanOptionalText(value: unknown) {
  if (value === null) return null;
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function cleanBoolean(value: unknown) {
  return typeof value === "boolean" ? value : undefined;
}

function cleanChannel(value: unknown) {
  return typeof value === "string" && notificationChannels.includes(value as NotificationChannel)
    ? (value as NotificationChannel)
    : undefined;
}

function cleanNumber(value: unknown) {
  if (value === null) return null;
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number.parseInt(value, 10) : Number.NaN;
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : undefined;
}

function dateOnly(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function daysBetween(from: Date, to: Date) {
  return Math.ceil((dateOnly(to).getTime() - dateOnly(from).getTime()) / 86_400_000);
}

function requireAdmin(actor: CurrentUser) {
  if (actor.role !== "ADMIN") throw new NotificationError("FORBIDDEN");
}

export function parseNotificationTemplateInput(payload: unknown): NotificationTemplateInput {
  const input = (payload ?? {}) as Record<string, unknown>;
  return {
    key: cleanText(input.key),
    channel: cleanChannel(input.channel),
    metaTemplateName: cleanOptionalText(input.metaTemplateName),
    language: cleanText(input.language),
    bodyPreview: cleanOptionalText(input.bodyPreview),
    active: cleanBoolean(input.active)
  };
}

export function parseNotificationRuleInput(payload: unknown): NotificationRuleInput {
  const input = (payload ?? {}) as Record<string, unknown>;
  return {
    licenseTypeId: cleanOptionalText(input.licenseTypeId),
    daysBeforeExpiration: cleanNumber(input.daysBeforeExpiration),
    repeatAfterExpiredDays: cleanNumber(input.repeatAfterExpiredDays),
    channel: cleanChannel(input.channel),
    templateKey: cleanText(input.templateKey),
    notifyProfessional: cleanBoolean(input.notifyProfessional),
    notifyRt: cleanBoolean(input.notifyRt),
    active: cleanBoolean(input.active)
  };
}

export function parseNotificationScanInput(payload: unknown): NotificationScanInput {
  const input = (payload ?? {}) as Record<string, unknown>;
  const todayText = cleanText(input.today);
  const today = todayText ? new Date(`${todayText}T00:00:00.000Z`) : undefined;
  return {
    dryRun: cleanBoolean(input.dryRun),
    today: today && !Number.isNaN(today.getTime()) ? today : undefined
  };
}

export async function listNotificationConfig(prisma: PrismaClient, actor: CurrentUser) {
  requireAdmin(actor);
  const [templates, rules, jobs] = await Promise.all([
    prisma.notificationTemplate.findMany({
      where: { organizationId: actor.organizationId },
      orderBy: [{ active: "desc" }, { key: "asc" }]
    }),
    prisma.notificationRule.findMany({
      where: { organizationId: actor.organizationId },
      include: { licenseType: true },
      orderBy: [{ active: "desc" }, { createdAt: "desc" }]
    }),
    prisma.notificationJob.findMany({
      where: { organizationId: actor.organizationId },
      include: { professional: true, license: { include: { licenseType: true } } },
      orderBy: { createdAt: "desc" },
      take: 25
    })
  ]);
  return { templates, rules, jobs };
}

export async function createNotificationTemplate(prisma: PrismaClient, actor: CurrentUser, input: NotificationTemplateInput) {
  requireAdmin(actor);
  if (!input.key || !input.channel || !input.language) throw new NotificationError("INVALID_INPUT");
  const existing = await prisma.notificationTemplate.findFirst({
    where: { organizationId: actor.organizationId, key: input.key }
  });
  if (existing) throw new NotificationError("TEMPLATE_TAKEN");

  const template = await prisma.notificationTemplate.create({
    data: {
      organizationId: actor.organizationId,
      key: input.key,
      channel: input.channel,
      metaTemplateName: input.metaTemplateName,
      language: input.language,
      bodyPreview: input.bodyPreview,
      active: input.active ?? true
    }
  });
  await recordAuditLog(prisma, {
    organizationId: actor.organizationId,
    actorId: actor.id,
    action: "notification_template.create",
    entityType: "NotificationTemplate",
    entityId: template.id,
    metadata: { key: template.key, channel: template.channel }
  });
  return template;
}

export async function updateNotificationTemplate(
  prisma: PrismaClient,
  actor: CurrentUser,
  templateId: string,
  input: NotificationTemplateInput
) {
  requireAdmin(actor);
  const existing = await prisma.notificationTemplate.findFirst({ where: { id: templateId, organizationId: actor.organizationId } });
  if (!existing) throw new NotificationError("NOT_FOUND");
  if (
    !input.key &&
    !input.channel &&
    input.metaTemplateName === undefined &&
    !input.language &&
    input.bodyPreview === undefined &&
    input.active === undefined
  ) {
    throw new NotificationError("INVALID_INPUT");
  }

  if (input.key && input.key !== existing.key) {
    const duplicate = await prisma.notificationTemplate.findFirst({ where: { organizationId: actor.organizationId, key: input.key } });
    if (duplicate) throw new NotificationError("TEMPLATE_TAKEN");
  }

  const template = await prisma.notificationTemplate.update({
    where: { id: templateId },
    data: input
  });
  await recordAuditLog(prisma, {
    organizationId: actor.organizationId,
    actorId: actor.id,
    action: input.active === false ? "notification_template.deactivate" : "notification_template.update",
    entityType: "NotificationTemplate",
    entityId: template.id,
    metadata: input
  });
  return template;
}

async function ensureRuleReferences(prisma: PrismaClient, actor: CurrentUser, input: NotificationRuleInput) {
  if (input.licenseTypeId) {
    const licenseType = await prisma.licenseType.findFirst({ where: { id: input.licenseTypeId, organizationId: actor.organizationId } });
    if (!licenseType) throw new NotificationError("INVALID_INPUT");
  }
  if (input.templateKey) {
    const template = await prisma.notificationTemplate.findFirst({
      where: { organizationId: actor.organizationId, key: input.templateKey, active: true }
    });
    if (!template) throw new NotificationError("INVALID_INPUT");
  }
}

export async function createNotificationRule(prisma: PrismaClient, actor: CurrentUser, input: NotificationRuleInput) {
  requireAdmin(actor);
  if (!input.channel || !input.templateKey || (input.daysBeforeExpiration === undefined && input.repeatAfterExpiredDays === undefined)) {
    throw new NotificationError("INVALID_INPUT");
  }
  await ensureRuleReferences(prisma, actor, input);

  const rule = await prisma.notificationRule.create({
    data: {
      organizationId: actor.organizationId,
      licenseTypeId: input.licenseTypeId,
      daysBeforeExpiration: input.daysBeforeExpiration,
      repeatAfterExpiredDays: input.repeatAfterExpiredDays,
      channel: input.channel,
      templateKey: input.templateKey,
      notifyProfessional: input.notifyProfessional ?? true,
      notifyRt: input.notifyRt ?? false,
      active: input.active ?? true
    },
    include: { licenseType: true }
  });
  await recordAuditLog(prisma, {
    organizationId: actor.organizationId,
    actorId: actor.id,
    action: "notification_rule.create",
    entityType: "NotificationRule",
    entityId: rule.id,
    metadata: { templateKey: rule.templateKey, channel: rule.channel }
  });
  return rule;
}

export async function updateNotificationRule(
  prisma: PrismaClient,
  actor: CurrentUser,
  ruleId: string,
  input: NotificationRuleInput
) {
  requireAdmin(actor);
  const existing = await prisma.notificationRule.findFirst({ where: { id: ruleId, organizationId: actor.organizationId } });
  if (!existing) throw new NotificationError("NOT_FOUND");
  await ensureRuleReferences(prisma, actor, input);

  const rule = await prisma.notificationRule.update({
    where: { id: ruleId },
    data: input,
    include: { licenseType: true }
  });
  await recordAuditLog(prisma, {
    organizationId: actor.organizationId,
    actorId: actor.id,
    action: input.active === false ? "notification_rule.deactivate" : "notification_rule.update",
    entityType: "NotificationRule",
    entityId: rule.id,
    metadata: input
  });
  return rule;
}

function shouldSchedule(rule: { daysBeforeExpiration: number | null; repeatAfterExpiredDays: number | null }, license: { expiresAt: Date | null }, today: Date) {
  if (!license.expiresAt) return null;
  const days = daysBetween(today, license.expiresAt);
  if (rule.daysBeforeExpiration !== null && days === rule.daysBeforeExpiration) {
    return `before:${rule.daysBeforeExpiration}:${dateOnly(today).toISOString().slice(0, 10)}`;
  }
  if (rule.repeatAfterExpiredDays !== null && days < 0 && Math.abs(days) % rule.repeatAfterExpiredDays === 0) {
    return `expired:${rule.repeatAfterExpiredDays}:${dateOnly(today).toISOString().slice(0, 10)}`;
  }
  return null;
}

function recipientsFor(rule: { notifyProfessional: boolean; notifyRt: boolean }, license: Prisma.LicenseGetPayload<{ include: { professional: { include: { responsibleRt: true } }; licenseType: true } }>) {
  const recipients = [];
  if (rule.notifyProfessional && license.professional.phone) {
    recipients.push({ phone: license.professional.phone, email: license.professional.email, kind: "professional" });
  }
  if (rule.notifyRt && license.professional.responsibleRt?.phone) {
    recipients.push({ phone: license.professional.responsibleRt.phone, email: license.professional.responsibleRt.email, kind: "rt" });
  }
  return recipients;
}

export async function scanNotificationJobs(prisma: PrismaClient, actor: CurrentUser, input: NotificationScanInput = {}) {
  requireAdmin(actor);
  const today = input.today ?? new Date();
  const rules = await prisma.notificationRule.findMany({
    where: { organizationId: actor.organizationId, active: true },
    include: { licenseType: true }
  });
  const licenses = await prisma.license.findMany({
    where: {
      status: { in: ["REGULAR", "EXPIRING", "EXPIRED"] },
      professional: { organizationId: actor.organizationId, active: true }
    },
    include: { licenseType: true, professional: { include: { responsibleRt: true } } }
  });

  const created = [];
  const skipped = [];
  for (const rule of rules) {
    for (const license of licenses.filter((item) => !rule.licenseTypeId || item.licenseTypeId === rule.licenseTypeId)) {
      const periodKey = shouldSchedule(rule, license, today);
      if (!periodKey) continue;
      for (const recipient of recipientsFor(rule, license)) {
        const dedupeKey = `${license.id}:${rule.id}:${periodKey}:${recipient.kind}`;
        const payload = {
          professionalName: license.professional.name,
          licenseTypeName: license.licenseType.name,
          licenseNumber: license.number,
          expiresAt: license.expiresAt?.toISOString(),
          recipientKind: recipient.kind
        };
        const existing = await prisma.notificationJob.findUnique({ where: { dedupeKey } });
        if (existing) {
          skipped.push({ dedupeKey, reason: "duplicate" });
          continue;
        }
        const data = {
          organizationId: actor.organizationId,
          professionalId: license.professionalId,
          licenseId: license.id,
          notificationRuleId: rule.id,
          periodKey,
          dedupeKey,
          channel: rule.channel,
          recipientPhone: recipient.phone,
          recipientEmail: recipient.email,
          templateKey: rule.templateKey,
          payloadJson: JSON.stringify(payload),
          status: "PENDING",
          scheduledFor: today
        };
        if (input.dryRun) {
          created.push(data);
        } else {
          created.push(await prisma.notificationJob.create({ data }));
        }
      }
    }
  }
  return { created, skipped, dryRun: input.dryRun ?? false };
}

function nextRetryDate(attempts: number) {
  return addDays(new Date(), Math.min(attempts, 6));
}

export async function processNotificationJobs(prisma: PrismaClient, actor: CurrentUser, provider: NotificationProvider, limit = 25) {
  requireAdmin(actor);
  const jobs = await prisma.notificationJob.findMany({
    where: {
      organizationId: actor.organizationId,
      status: { in: ["PENDING", "FAILED"] },
      scheduledFor: { lte: new Date() },
      OR: [{ nextRetryAt: null }, { nextRetryAt: { lte: new Date() } }],
      attempts: { lt: 3 }
    },
    include: {
      organization: true
    },
    orderBy: { scheduledFor: "asc" },
    take: limit
  });

  const results = [];
  for (const job of jobs) {
    const processing = await prisma.notificationJob.update({
      where: { id: job.id },
      data: { status: "PROCESSING", processingAt: new Date(), attempts: { increment: 1 } }
    });
    const template = await prisma.notificationTemplate.findFirst({
      where: { organizationId: actor.organizationId, key: job.templateKey, active: true }
    });
    if (!template || !job.recipientPhone) {
      const failed = await prisma.notificationJob.update({
        where: { id: job.id },
        data: {
          status: "FAILED",
          failedAt: new Date(),
          errorMessage: "MISSING_TEMPLATE_OR_RECIPIENT",
          nextRetryAt: processing.attempts + 1 >= processing.maxAttempts ? null : nextRetryDate(processing.attempts + 1)
        }
      });
      results.push(failed);
      continue;
    }

    try {
      const sendResult = await provider.sendWhatsAppTemplate({
        to: job.recipientPhone,
        templateName: template.metaTemplateName ?? template.key,
        language: template.language,
        payload: JSON.parse(job.payloadJson)
      });
      const sent = await prisma.notificationJob.update({
        where: { id: job.id },
        data: {
          status: "SENT",
          sentAt: new Date(),
          provider: sendResult.provider,
          providerMessageId: sendResult.providerMessageId,
          errorMessage: null,
          nextRetryAt: null
        }
      });
      await prisma.notificationLog.create({
        data: {
          notificationJobId: job.id,
          provider: sendResult.provider,
          providerMessageId: sendResult.providerMessageId,
          status: "SENT",
          rawPayload: JSON.stringify(sendResult.rawPayload),
          rawResponse: JSON.stringify(sendResult.rawResponse)
        }
      });
      results.push(sent);
    } catch (error) {
      const attempts = processing.attempts + 1;
      const rawResponse = error instanceof NotificationProviderError ? error.rawResponse : undefined;
      const failed = await prisma.notificationJob.update({
        where: { id: job.id },
        data: {
          status: "FAILED",
          failedAt: new Date(),
          errorMessage: error instanceof Error ? error.message : "PROVIDER_ERROR",
          nextRetryAt: attempts >= processing.maxAttempts ? null : nextRetryDate(attempts)
        }
      });
      await prisma.notificationLog.create({
        data: {
          notificationJobId: job.id,
          provider: "unknown",
          status: "FAILED",
          rawResponse: rawResponse === undefined ? null : JSON.stringify(rawResponse)
        }
      });
      results.push(failed);
    }
  }

  return { processed: results };
}

function mapWebhookStatus(status: string) {
  if (notificationStatuses.includes(status.toUpperCase() as never)) return status.toUpperCase();
  if (status === "sent") return "SENT";
  if (status === "delivered") return "DELIVERED";
  if (status === "read") return "READ";
  if (status === "failed") return "FAILED";
  return undefined;
}

export function verifyWebhookChallenge(query: Record<string, unknown>) {
  const env = loadEnv();
  if (
    query["hub.mode"] === "subscribe" &&
    typeof query["hub.challenge"] === "string" &&
    query["hub.verify_token"] === env.metaWebhookVerifyToken
  ) {
    return query["hub.challenge"];
  }
  throw new NotificationError("WEBHOOK_INVALID");
}

export async function handleMetaWebhook(prisma: PrismaClient, body: unknown, signature: string | undefined) {
  const rawBody = JSON.stringify(body);
  const env = loadEnv();
  if (env.metaAppSecret && !verifyMetaSignature(rawBody, signature, env.metaAppSecret)) {
    throw new NotificationError("WEBHOOK_INVALID");
  }
  const entries = (body as { entry?: Array<{ changes?: Array<{ value?: { statuses?: Array<{ id?: string; status?: string }> } }> }> })
    .entry ?? [];
  const results = [];
  for (const entry of entries) {
    for (const change of entry.changes ?? []) {
      for (const statusEvent of change.value?.statuses ?? []) {
        if (!statusEvent.id || !statusEvent.status) continue;
        const status = mapWebhookStatus(statusEvent.status);
        if (!status) continue;
        const job = await prisma.notificationJob.findFirst({ where: { providerMessageId: statusEvent.id } });
        if (!job) continue;
        const data: Prisma.NotificationJobUpdateInput = {
          status,
          deliveredAt: status === "DELIVERED" ? new Date() : undefined,
          readAt: status === "READ" ? new Date() : undefined,
          failedAt: status === "FAILED" ? new Date() : undefined
        };
        const updated = await prisma.notificationJob.update({ where: { id: job.id }, data });
        await prisma.notificationLog.create({
          data: {
            notificationJobId: job.id,
            provider: job.provider ?? "meta-whatsapp",
            providerMessageId: statusEvent.id,
            status,
            rawPayload: rawBody
          }
        });
        results.push(updated);
      }
    }
  }
  return { updated: results };
}
