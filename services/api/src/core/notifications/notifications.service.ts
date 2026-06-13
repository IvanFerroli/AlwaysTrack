import type { Prisma, PrismaClient } from "@prisma/client";
import { notificationChannels, notificationStatuses, type CurrentUser, type NotificationChannel } from "@alwaystrack/shared";
import { loadEnv } from "../../config/env.js";
import { recordAuditLog } from "../audit/audit.service.js";
import type { NotificationProvider } from "./provider.js";
import { NotificationProviderError, verifyMetaSignature } from "./provider.js";

/** Domain error for legacy provider notifications and in-app notifications. */
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

export interface ManualLicenseNotificationInput {
  licenseId?: string;
  processNow?: boolean;
  force?: boolean;
}

/** Payload used to fan out in-app notifications by explicit recipients or roles. */
export interface InAppNotificationInput {
  recipientIds?: string[];
  recipientRoles?: string[];
  actorId?: string;
  type: string;
  title: string;
  body?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  href?: string | null;
  dedupeKey?: string | null;
}

export interface ListInAppNotificationsInput {
  unreadOnly?: boolean;
  type?: string;
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

function isoDate(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

function maskPhone(value: string | null | undefined) {
  if (!value) return null;
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 4) return "****";
  return `${"*".repeat(Math.max(digits.length - 4, 4))}${digits.slice(-4)}`;
}

function formatTemplateParameter(value: unknown) {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "string") {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) return `${match[3]}/${match[2]}/${match[1]}`;
  }
  return String(value);
}

function templateBodyParameters(bodyPreview: string | null | undefined, payload: Record<string, unknown>) {
  if (!bodyPreview) return [];
  const parameters = [];
  const seen = new Set<string>();
  for (const match of bodyPreview.matchAll(/{{\s*([a-zA-Z0-9_.-]+)\s*}}/g)) {
    const key = match[1];
    if (seen.has(key)) continue;
    seen.add(key);
    parameters.push(formatTemplateParameter(payload[key]));
  }
  return parameters;
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

export function parseManualLicenseNotificationInput(payload: unknown): ManualLicenseNotificationInput {
  const input = (payload ?? {}) as Record<string, unknown>;
  return {
    licenseId: cleanText(input.licenseId),
    processNow: cleanBoolean(input.processNow),
    force: cleanBoolean(input.force)
  };
}

function uniqueTexts(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter((value): value is string => typeof value === "string" && value.trim().length > 0)));
}

export async function emitInAppNotifications(prisma: PrismaClient, organizationId: string, input: InAppNotificationInput) {
  const recipientIds = uniqueTexts(input.recipientIds ?? []);
  const recipientRoles = uniqueTexts(input.recipientRoles ?? []);
  if (recipientIds.length === 0 && recipientRoles.length === 0) return [];
  const maybePrisma = prisma as PrismaClient & { user?: PrismaClient["user"]; inAppNotification?: PrismaClient["inAppNotification"] };
  if (!maybePrisma.user || !maybePrisma.inAppNotification) return [];

  const recipients = await maybePrisma.user.findMany({
    where: {
      organizationId,
      active: true,
      OR: [
        recipientIds.length > 0 ? { id: { in: recipientIds } } : undefined,
        recipientRoles.length > 0 ? { role: { in: recipientRoles } } : undefined
      ].filter(Boolean) as Prisma.UserWhereInput[]
    },
    select: { id: true }
  });
  const ids = recipients.map((recipient) => recipient.id).filter((id) => id !== input.actorId);
  const created = [];
  for (const recipientId of uniqueTexts(ids)) {
    const data = {
      organizationId,
      recipientId,
      type: input.type,
      title: input.title,
      body: input.body ?? null,
      entityType: input.entityType ?? null,
      entityId: input.entityId ?? null,
      href: input.href ?? null,
      dedupeKey: input.dedupeKey ? `${input.dedupeKey}:${recipientId}` : null
    };
    if (data.dedupeKey) {
      created.push(
        await maybePrisma.inAppNotification.upsert({
          where: { organizationId_recipientId_dedupeKey: { organizationId, recipientId, dedupeKey: data.dedupeKey } },
          create: data,
          update: {
            title: data.title,
            body: data.body,
            href: data.href,
            readAt: null,
            createdAt: new Date()
          }
        })
      );
    } else {
      created.push(await maybePrisma.inAppNotification.create({ data }));
    }
  }
  return created;
}

function normalizeNotificationType(value: unknown) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed.slice(0, 80) : undefined;
}

export function parseListInAppNotificationsInput(query: Record<string, unknown>): ListInAppNotificationsInput {
  return {
    unreadOnly: query.unreadOnly === "1" || query.unreadOnly === "true",
    type: normalizeNotificationType(query.type)
  };
}

function notificationGroups(items: Array<{ type: string; readAt: Date | null }>) {
  const groups = new Map<string, { type: string; total: number; unread: number }>();
  for (const item of items) {
    const current = groups.get(item.type) ?? { type: item.type, total: 0, unread: 0 };
    current.total += 1;
    current.unread += item.readAt ? 0 : 1;
    groups.set(item.type, current);
  }
  return [...groups.values()].sort((left, right) => right.unread - left.unread || right.total - left.total || left.type.localeCompare(right.type));
}

export async function listInAppNotifications(prisma: PrismaClient, actor: CurrentUser, input: ListInAppNotificationsInput = {}) {
  const baseWhere: Prisma.InAppNotificationWhereInput = { organizationId: actor.organizationId, recipientId: actor.id };
  const where: Prisma.InAppNotificationWhereInput = {
    ...baseWhere,
    type: input.type,
    readAt: input.unreadOnly ? null : undefined
  };
  const [items, unread] = await Promise.all([
    prisma.inAppNotification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50
    }),
    prisma.inAppNotification.count({ where: { ...baseWhere, readAt: null } })
  ]);
  return { items, unread, groups: notificationGroups(items) };
}

export async function markInAppNotificationRead(prisma: PrismaClient, actor: CurrentUser, notificationId: string) {
  const notification = await prisma.inAppNotification.findFirst({
    where: { id: notificationId, organizationId: actor.organizationId, recipientId: actor.id }
  });
  if (!notification) throw new NotificationError("NOT_FOUND");
  const item = await prisma.inAppNotification.update({ where: { id: notification.id }, data: { readAt: new Date() } });
  return { notification: item };
}

export async function markAllInAppNotificationsRead(prisma: PrismaClient, actor: CurrentUser) {
  const result = await prisma.inAppNotification.updateMany({
    where: { organizationId: actor.organizationId, recipientId: actor.id, readAt: null },
    data: { readAt: new Date() }
  });
  return { updated: result.count };
}

function normalizeRecipientPhone(value: string | null | undefined) {
  const digits = value?.replace(/\D/g, "") ?? "";
  return digits.length >= 10 ? digits : null;
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

function hasFutureRtEscalation(
  rule: { id: string; licenseTypeId: string | null; channel: string; daysBeforeExpiration: number | null; notifyRt: boolean },
  rules: Array<{ id: string; licenseTypeId: string | null; channel: string; daysBeforeExpiration: number | null; notifyRt: boolean }>
) {
  const currentDaysBeforeExpiration = rule.daysBeforeExpiration;
  if (currentDaysBeforeExpiration === null) return false;
  return rules.some(
    (candidate) =>
      candidate.id !== rule.id &&
      candidate.notifyRt &&
      candidate.channel === rule.channel &&
      candidate.licenseTypeId === rule.licenseTypeId &&
      candidate.daysBeforeExpiration !== null &&
      candidate.daysBeforeExpiration < currentDaysBeforeExpiration
  );
}

function notificationPayload(
  license: Prisma.LicenseGetPayload<{ include: { professional: { include: { responsibleRt: true } }; licenseType: true } }>,
  today: Date,
  willEscalateToRt: boolean,
  recipientKind: string
) {
  const daysUntilExpiration = license.expiresAt ? daysBetween(today, license.expiresAt) : null;
  const daysExpired = daysUntilExpiration !== null && daysUntilExpiration < 0 ? Math.abs(daysUntilExpiration) : 0;
  return {
    professionalName: license.professional.name,
    licenseTypeName: license.licenseType.name,
    licenseNumber: license.number,
    issuer: license.issuer,
    uf: license.uf,
    issuedAt: isoDate(license.issuedAt),
    expiresAt: isoDate(license.expiresAt),
    daysUntilExpiration,
    daysExpired,
    responsibleRtName: license.professional.responsibleRt?.name ?? null,
    responsibleRtPhoneMasked: maskPhone(license.professional.responsibleRt?.phone),
    willEscalateToRt,
    recipientKind
  };
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
      const willEscalateToRt = rule.notifyRt || hasFutureRtEscalation(rule, rules);
      if (rule.notifyRt && !license.professional.responsibleRt?.phone) {
        skipped.push({
          licenseId: license.id,
          notificationRuleId: rule.id,
          recipientKind: "rt",
          reason: license.professional.responsibleRt ? "missing_rt_phone" : "missing_rt"
        });
      }
      for (const recipient of recipientsFor(rule, license)) {
        const recipientPhoneKey = normalizeRecipientPhone(recipient.phone) ?? "no-phone";
        const dedupeKey = `${license.id}:${rule.id}:${periodKey}:${recipient.kind}:${recipientPhoneKey}`;
        const payload = notificationPayload(license, today, willEscalateToRt, recipient.kind);
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

export async function sendManualLicenseNotification(
  prisma: PrismaClient,
  actor: CurrentUser,
  provider: NotificationProvider,
  input: ManualLicenseNotificationInput
) {
  requireAdmin(actor);
  if (!input.licenseId) throw new NotificationError("INVALID_INPUT");
  const today = new Date();
  const periodKey = `manual:${dateOnly(today).toISOString().slice(0, 10)}`;
  const license = await prisma.license.findFirst({
    where: { id: input.licenseId, professional: { organizationId: actor.organizationId, active: true } },
    include: { licenseType: true, professional: { include: { responsibleRt: true } } }
  });
  if (!license) throw new NotificationError("NOT_FOUND");
  if (!license.expiresAt) throw new NotificationError("INVALID_INPUT");

  const daysUntilExpiration = daysBetween(today, license.expiresAt);
  const rules = await prisma.notificationRule.findMany({
    where: {
      organizationId: actor.organizationId,
      active: true,
      OR: [{ licenseTypeId: null }, { licenseTypeId: license.licenseTypeId }]
    }
  });
  const applicableRules = rules.filter((rule) =>
    daysUntilExpiration >= 0 ? rule.daysBeforeExpiration !== null : rule.repeatAfterExpiredDays !== null
  );

  const created = [];
  const skipped = [];
  for (const rule of applicableRules) {
    if (rule.notifyProfessional && !license.professional.phone) {
      skipped.push({ licenseId: license.id, notificationRuleId: rule.id, recipientKind: "professional", reason: "missing_phone" });
    }
    if (rule.notifyRt && !license.professional.responsibleRt?.phone) {
      skipped.push({
        licenseId: license.id,
        notificationRuleId: rule.id,
        recipientKind: "rt",
        reason: license.professional.responsibleRt ? "missing_rt_phone" : "missing_rt"
      });
    }
    for (const recipient of recipientsFor(rule, license)) {
      const recipientPhoneKey = normalizeRecipientPhone(recipient.phone) ?? "no-phone";
      const dedupeKeyBase = `${license.id}:${rule.id}:${periodKey}:${recipient.kind}:${recipientPhoneKey}`;
      const dedupeKey = input.force ? `${dedupeKeyBase}:force:${Date.now()}` : dedupeKeyBase;
      const existing = input.force ? null : await prisma.notificationJob.findUnique({ where: { dedupeKey } });
      if (existing && !input.force) {
        skipped.push({ dedupeKey, reason: "duplicate" });
        continue;
      }
      const payload = notificationPayload(license, today, rule.notifyRt, recipient.kind);
      created.push(
        await prisma.notificationJob.create({
          data: {
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
          }
        })
      );
    }
  }

  await recordAuditLog(prisma, {
    organizationId: actor.organizationId,
    actorId: actor.id,
    action: "notification.manual_license",
    entityType: "License",
    entityId: license.id,
    metadata: { created: created.length, skipped: skipped.length, processNow: input.processNow ?? true }
  });

  const processed =
    input.processNow === false || created.length === 0
      ? []
      : (await processNotificationJobs(prisma, actor, provider, created.length, created.map((job) => job.id))).processed;

  return { created, skipped, processed };
}

function nextRetryDate(attempts: number) {
  return addDays(new Date(), Math.min(attempts, 6));
}

export async function processNotificationJobs(
  prisma: PrismaClient,
  actor: CurrentUser,
  provider: NotificationProvider,
  limit = 25,
  jobIds?: string[]
) {
  requireAdmin(actor);
  const jobs = await prisma.notificationJob.findMany({
    where: {
      organizationId: actor.organizationId,
      id: jobIds?.length ? { in: jobIds } : undefined,
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
      const payload = JSON.parse(job.payloadJson) as Record<string, unknown>;
      const sendResult = await provider.sendWhatsAppTemplate({
        to: job.recipientPhone,
        templateName: template.metaTemplateName ?? template.key,
        language: template.language,
        payload,
        bodyParameters: templateBodyParameters(template.bodyPreview, payload)
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

export async function handleMetaWebhook(prisma: PrismaClient, body: unknown, signature: string | undefined, rawBody = JSON.stringify(body)) {
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
