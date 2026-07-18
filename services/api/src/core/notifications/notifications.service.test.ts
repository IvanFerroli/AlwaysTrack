import { createHmac } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { CurrentUser } from "@alwaystrack/shared";
import { InputValidationError } from "../validation/input-validation.js";
import {
  createNotificationRule,
  createNotificationTemplate,
  emitInAppNotifications,
  handleMetaWebhook,
  listInAppNotifications,
  markAllInAppNotificationsRead,
  markInAppNotificationRead,
  NotificationError,
  parseListInAppNotificationsInput,
  parseNotificationRuleInput,
  parseNotificationTemplateInput,
  processNotificationJobs,
  scanNotificationJobs,
  verifyWebhookChallenge
} from "./notifications.service.js";
import { FakeNotificationProvider, NotificationProviderError } from "./provider.js";

const admin: CurrentUser = {
  id: "admin-1",
  name: "Admin",
  email: "admin@example.com",
  role: "ADMIN",
  organizationId: "org-1",
  unitScopeIds: [],
  sectorScopeIds: []
};

function notificationJobFixture(overrides: Record<string, unknown> = {}) {
  return {
    id: "job-1",
    organizationId: "org-1",
    templateKey: "venc",
    channel: "WHATSAPP",
    recipientPhone: "+550000",
    recipientEmail: null,
    payloadJson: JSON.stringify({ professionalName: "Ana", expiresAt: "2026-05-29T00:00:00.000Z" }),
    status: "PENDING",
    scheduledFor: new Date("2026-04-29T00:00:00.000Z"),
    processingAt: null,
    nextRetryAt: null,
    updatedAt: new Date("2026-04-29T00:00:00.000Z"),
    attempts: 0,
    maxAttempts: 3,
    ...overrides
  };
}

describe("notifications service", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("parses templates and rules without unsupported fields", () => {
    expect(parseNotificationTemplateInput({ key: " venc ", channel: "WHATSAPP", language: "pt_BR", active: false })).toEqual({
      key: "venc",
      channel: "WHATSAPP",
      metaTemplateName: undefined,
      language: "pt_BR",
      bodyPreview: undefined,
      active: false
    });
    expect(parseNotificationRuleInput({ daysBeforeExpiration: "30", repeatAfterExpiredDays: null, channel: "EMAIL" })).toEqual(
      expect.objectContaining({ daysBeforeExpiration: 30, repeatAfterExpiredDays: null, channel: "EMAIL" })
    );
  });

  it("rejects malformed notification inputs before service execution", () => {
    expect(() => parseNotificationTemplateInput("bad")).toThrow(InputValidationError);
    expect(() => parseNotificationTemplateInput({ key: "x".repeat(81) })).toThrow(InputValidationError);
    expect(() => parseNotificationRuleInput({ notifyRt: "yes" })).toThrow(InputValidationError);
  });

  it("parses in-app notification filters", () => {
    expect(parseListInAppNotificationsInput({ unreadOnly: "1", type: " faq.thread.created " })).toEqual({
      unreadOnly: true,
      type: "faq.thread.created"
    });
    expect(parseListInAppNotificationsInput({ unreadOnly: "0", type: "" })).toEqual({
      unreadOnly: false,
      type: undefined
    });
  });

  it("creates templates with audit", async () => {
    const prisma = {
      notificationTemplate: {
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({ id: "tpl-1", key: "venc", channel: "WHATSAPP" })
      },
      auditLog: { create: vi.fn().mockResolvedValue({ id: "audit-1" }) }
    };

    await createNotificationTemplate(prisma as never, admin, { key: "venc", channel: "WHATSAPP", language: "pt_BR" });

    expect(prisma.notificationTemplate.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ organizationId: "org-1", key: "venc" }) })
    );
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: "notification_template.create" }) })
    );
  });

  it("creates rules with referenced active template", async () => {
    const prisma = {
      notificationTemplate: { findFirst: vi.fn().mockResolvedValue({ id: "tpl-1" }) },
      notificationRule: {
        create: vi.fn().mockResolvedValue({ id: "rule-1", templateKey: "venc", channel: "WHATSAPP" })
      },
      auditLog: { create: vi.fn().mockResolvedValue({ id: "audit-1" }) }
    };

    await createNotificationRule(prisma as never, admin, {
      templateKey: "venc",
      channel: "WHATSAPP",
      daysBeforeExpiration: 30
    });

    expect(prisma.notificationRule.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ organizationId: "org-1", templateKey: "venc" }) })
    );
  });

  it("emits in-app notifications with tenant recipients and dedupe", async () => {
    const prisma = {
      user: {
        findMany: vi.fn().mockResolvedValue([{ id: "admin-1" }, { id: "seller-1" }, { id: "supervisor-1" }])
      },
      inAppNotification: {
        upsert: vi.fn().mockImplementation(({ create }) => Promise.resolve({ id: `notif-${create.recipientId}`, ...create }))
      }
    };

    const result = await emitInAppNotifications(prisma as never, "org-1", {
      actorId: "admin-1",
      recipientIds: ["seller-1"],
      recipientRoles: ["SUPERVISOR"],
      type: "faq.thread.created",
      title: "Nova pergunta",
      entityType: "FaqThread",
      entityId: "thread-1",
      href: "/faq",
      dedupeKey: "faq.thread.created:thread-1"
    });

    expect(result).toHaveLength(2);
    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ organizationId: "org-1", active: true }) })
    );
    expect(prisma.inAppNotification.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          organizationId: "org-1",
          recipientId: "seller-1",
          type: "faq.thread.created",
          targetType: "FAQ_THREAD",
          targetParamsJson: JSON.stringify({ threadId: "thread-1" }),
          targetStatus: "AVAILABLE",
          dedupeKey: "faq.thread.created:thread-1:seller-1"
        }),
        update: expect.objectContaining({
          entityType: "FaqThread",
          entityId: "thread-1",
          targetType: "FAQ_THREAD",
          targetParamsJson: JSON.stringify({ threadId: "thread-1" }),
          targetStatus: "AVAILABLE"
        })
      })
    );
  });

  it("lists and marks in-app notifications as read", async () => {
    const prisma = {
      inAppNotification: {
        findMany: vi.fn().mockResolvedValue([
          { id: "notif-1", organizationId: "org-1", recipientId: "admin-1", dedupeKey: "private-1", targetParamsJson: "{}", type: "faq.thread.created", readAt: null },
          { id: "notif-2", organizationId: "org-1", recipientId: "admin-1", dedupeKey: "private-2", targetParamsJson: "{}", type: "wiki.review", readAt: new Date("2026-06-09T00:00:00.000Z") }
        ]),
        count: vi.fn().mockResolvedValue(1),
        findFirst: vi.fn().mockResolvedValue({ id: "notif-1", recipientId: "admin-1", readAt: null }),
        update: vi.fn().mockResolvedValue({ id: "notif-1", readAt: new Date("2026-06-09T00:00:00.000Z") }),
        updateMany: vi.fn().mockResolvedValue({ count: 3 })
      }
    };

    const listed = await listInAppNotifications(prisma as never, admin, { unreadOnly: true, type: "faq.thread.created" });
    expect(listed).toMatchObject({
      unread: 1,
      groups: [
        { type: "faq.thread.created", total: 1, unread: 1 },
        { type: "wiki.review", total: 1, unread: 0 }
      ]
    });
    expect(listed.items).toHaveLength(2);
    expect(listed.items[0]).not.toHaveProperty("organizationId");
    expect(listed.items[0]).not.toHaveProperty("recipientId");
    expect(listed.items[0]).not.toHaveProperty("dedupeKey");
    expect(listed.items[0]).not.toHaveProperty("targetParamsJson");
    await markInAppNotificationRead(prisma as never, admin, "notif-1");
    await expect(markAllInAppNotificationsRead(prisma as never, admin)).resolves.toEqual({ updated: 3 });

    expect(prisma.inAppNotification.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ organizationId: "org-1", recipientId: "admin-1" }) })
    );
    expect(prisma.inAppNotification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ type: "faq.thread.created", readAt: null }) })
    );
    expect(prisma.inAppNotification.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ readAt: null }) })
    );
  });

  it("scans active rules with detailed professional payload and future RT escalation hint", async () => {
    const prisma = {
      notificationRule: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "rule-1",
            licenseTypeId: "type-1",
            daysBeforeExpiration: 30,
            repeatAfterExpiredDays: null,
            channel: "WHATSAPP",
            templateKey: "venc",
            notifyProfessional: true,
            notifyRt: false
          },
          {
            id: "rule-2",
            licenseTypeId: "type-1",
            daysBeforeExpiration: 15,
            repeatAfterExpiredDays: null,
            channel: "WHATSAPP",
            templateKey: "venc-final",
            notifyProfessional: true,
            notifyRt: true
          }
        ])
      },
      license: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "lic-1",
            professionalId: "pro-1",
            licenseTypeId: "type-1",
            number: "123",
            issuer: "COREN",
            uf: "SP",
            issuedAt: new Date("2025-05-29T00:00:00.000Z"),
            expiresAt: new Date("2026-05-29T00:00:00.000Z"),
            licenseType: { name: "Registro" },
            professional: { name: "Ana", phone: "+550000", email: null, responsibleRt: { name: "RT Maria", phone: "+5511999991234" } }
          }
        ])
      },
      notificationJob: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: "job-1", ...data }))
      }
    };

    const result = await scanNotificationJobs(prisma as never, admin, { today: new Date("2026-04-29T00:00:00.000Z") });

    expect(result.created).toHaveLength(1);
    expect(prisma.notificationJob.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ dedupeKey: expect.stringContaining("lic-1:rule-1:before:30") })
      })
    );
    const payload = JSON.parse(prisma.notificationJob.create.mock.calls[0][0].data.payloadJson);
    expect(payload).toEqual(
      expect.objectContaining({
        issuer: "COREN",
        uf: "SP",
        issuedAt: "2025-05-29T00:00:00.000Z",
        expiresAt: "2026-05-29T00:00:00.000Z",
        daysUntilExpiration: 30,
        daysExpired: 0,
        responsibleRtName: "RT Maria",
        responsibleRtPhoneMasked: "*********1234",
        willEscalateToRt: true,
        recipientKind: "professional"
      })
    );
  });

  it("creates separate professional and RT jobs for RT escalation rules", async () => {
    const prisma = {
      notificationRule: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "rule-1",
            licenseTypeId: "type-1",
            daysBeforeExpiration: 30,
            repeatAfterExpiredDays: null,
            channel: "WHATSAPP",
            templateKey: "venc-final",
            notifyProfessional: true,
            notifyRt: true
          }
        ])
      },
      license: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "lic-1",
            professionalId: "pro-1",
            licenseTypeId: "type-1",
            number: "123",
            issuer: "COREN",
            uf: "SP",
            issuedAt: null,
            expiresAt: new Date("2026-05-29T00:00:00.000Z"),
            licenseType: { name: "Registro" },
            professional: {
              name: "Ana",
              phone: "+55 (83) 98674-8048",
              email: null,
              responsibleRt: { name: "RT Maria", phone: "+5511999991234", email: "rt@example.com" }
            }
          }
        ])
      },
      notificationJob: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: `job-${data.recipientPhone}`, ...data }))
      }
    };

    const result = await scanNotificationJobs(prisma as never, admin, { today: new Date("2026-04-29T00:00:00.000Z") });

    expect(result.created).toHaveLength(2);
    expect(result.created.map((job) => JSON.parse(job.payloadJson).recipientKind)).toEqual(["professional", "rt"]);
    expect(result.created.map((job) => job.dedupeKey)).toEqual([
      "lic-1:rule-1:before:30:2026-04-29:professional:5583986748048",
      "lic-1:rule-1:before:30:2026-04-29:rt:5511999991234"
    ]);
  });

  it("keeps professional job and reports skipped RT when RT has no phone", async () => {
    const prisma = {
      notificationRule: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "rule-1",
            licenseTypeId: "type-1",
            daysBeforeExpiration: 30,
            repeatAfterExpiredDays: null,
            channel: "WHATSAPP",
            templateKey: "venc-final",
            notifyProfessional: true,
            notifyRt: true
          }
        ])
      },
      license: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "lic-1",
            professionalId: "pro-1",
            licenseTypeId: "type-1",
            number: "123",
            issuer: null,
            uf: null,
            issuedAt: null,
            expiresAt: new Date("2026-05-29T00:00:00.000Z"),
            licenseType: { name: "Registro" },
            professional: { name: "Ana", phone: "+550000", email: null, responsibleRt: { name: "RT Maria", phone: null } }
          }
        ])
      },
      notificationJob: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: "job-1", ...data }))
      }
    };

    const result = await scanNotificationJobs(prisma as never, admin, { today: new Date("2026-04-29T00:00:00.000Z") });

    expect(result.created).toHaveLength(1);
    expect(JSON.parse(result.created[0].payloadJson).recipientKind).toBe("professional");
    expect(result.skipped).toContainEqual({
      licenseId: "lic-1",
      notificationRuleId: "rule-1",
      recipientKind: "rt",
      reason: "missing_rt_phone"
    });
  });

  it("processes pending jobs with provider and logs success", async () => {
    const prisma = {
      notificationJob: {
        findMany: vi.fn().mockResolvedValue([notificationJobFixture()]),
        updateMany: vi
          .fn()
          .mockResolvedValueOnce({ count: 1 })
          .mockResolvedValueOnce({ count: 1 })
      },
      notificationTemplate: {
        findFirst: vi
          .fn()
          .mockResolvedValue({
            key: "venc",
            channel: "WHATSAPP",
            metaTemplateName: "tpl_venc",
            language: "pt_BR",
            bodyPreview: "Ola {{professionalName}}, vence em {{expiresAt}}."
          })
      },
      notificationLog: { create: vi.fn().mockResolvedValue({ id: "log-1" }) }
    };
    const provider = { sendWhatsAppTemplate: vi.fn(new FakeNotificationProvider().sendWhatsAppTemplate) };

    await processNotificationJobs(prisma as never, admin, provider);

    expect(provider.sendWhatsAppTemplate).toHaveBeenCalledWith(
      expect.objectContaining({
        bodyParameters: ["Ana", "29/05/2026"]
      })
    );

    expect(prisma.notificationJob.updateMany).toHaveBeenLastCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "SENT", providerMessageId: expect.stringMatching(/^fake_/) }) })
    );
    expect(prisma.notificationLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "SENT" }) })
    );
  });

  it("keeps failed provider sends retryable and logs sanitized provider response", async () => {
    const prisma = {
      notificationJob: {
        findMany: vi.fn().mockResolvedValue([notificationJobFixture({ payloadJson: "{}" })]),
        updateMany: vi
          .fn()
          .mockResolvedValueOnce({ count: 1 })
          .mockResolvedValueOnce({ count: 1 })
      },
      notificationTemplate: {
        findFirst: vi.fn().mockResolvedValue({ key: "venc", channel: "WHATSAPP", metaTemplateName: "tpl_venc", language: "pt_BR" })
      },
      notificationLog: { create: vi.fn().mockResolvedValue({ id: "log-1" }) }
    };
    const provider = {
      sendWhatsAppTemplate: vi.fn().mockRejectedValue(new NotificationProviderError("META_WHATSAPP_SEND_FAILED", { error: "rate_limit" }))
    };

    await processNotificationJobs(prisma as never, admin, provider);

    expect(prisma.notificationJob.updateMany).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "FAILED",
          errorMessage: "META_WHATSAPP_SEND_FAILED",
          nextRetryAt: expect.any(Date)
        })
      })
    );
    expect(prisma.notificationLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "FAILED",
          rawResponse: JSON.stringify({ error: "rate_limit" })
        })
      })
    );
  });

  it("claims a job once when two processors race on the same candidate", async () => {
    let claimed = false;
    const prisma = {
      notificationJob: {
        findMany: vi.fn().mockResolvedValue([notificationJobFixture()]),
        updateMany: vi.fn().mockImplementation(({ data }) => {
          if (data.status === "PROCESSING") {
            if (claimed) return Promise.resolve({ count: 0 });
            claimed = true;
          }
          return Promise.resolve({ count: 1 });
        })
      },
      notificationTemplate: {
        findFirst: vi.fn().mockResolvedValue({ key: "venc", channel: "WHATSAPP", metaTemplateName: "tpl_venc", language: "pt_BR" })
      },
      notificationLog: { create: vi.fn().mockResolvedValue({ id: "log-1" }) }
    };
    const provider = { sendWhatsAppTemplate: vi.fn(new FakeNotificationProvider().sendWhatsAppTemplate) };

    const results = await Promise.all([
      processNotificationJobs(prisma as never, admin, provider),
      processNotificationJobs(prisma as never, admin, provider)
    ]);

    expect(provider.sendWhatsAppTemplate).toHaveBeenCalledTimes(1);
    expect(results.flatMap((result) => result.processed)).toHaveLength(1);
    expect(prisma.notificationLog.create).toHaveBeenCalledTimes(1);
  });

  it("reclaims an abandoned PROCESSING job only through its expired lease snapshot", async () => {
    const abandonedAt = new Date("2026-04-29T10:00:00.000Z");
    const prisma = {
      notificationJob: {
        findMany: vi.fn().mockResolvedValue([
          notificationJobFixture({ status: "PROCESSING", processingAt: abandonedAt, attempts: 1 })
        ]),
        updateMany: vi.fn().mockResolvedValueOnce({ count: 1 }).mockResolvedValueOnce({ count: 1 })
      },
      notificationTemplate: {
        findFirst: vi.fn().mockResolvedValue({ key: "venc", channel: "WHATSAPP", metaTemplateName: "tpl_venc", language: "pt_BR" })
      },
      notificationLog: { create: vi.fn().mockResolvedValue({ id: "log-1" }) }
    };
    const provider = { sendWhatsAppTemplate: vi.fn(new FakeNotificationProvider().sendWhatsAppTemplate) };

    await processNotificationJobs(prisma as never, admin, provider);

    expect(prisma.notificationJob.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([expect.objectContaining({ status: "PROCESSING" })])
        })
      })
    );
    expect(prisma.notificationJob.updateMany).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: expect.objectContaining({ status: "PROCESSING", processingAt: abandonedAt, attempts: 1 }),
        data: expect.objectContaining({ status: "PROCESSING", attempts: { increment: 1 } })
      })
    );
    expect(provider.sendWhatsAppTemplate).toHaveBeenCalledTimes(1);
  });

  it("pages past exhausted jobs and honors a custom maxAttempts value", async () => {
    const exhausted = Array.from({ length: 25 }, (_, index) =>
      notificationJobFixture({ id: `exhausted-${String(index).padStart(2, "0")}`, status: "FAILED", attempts: 3, maxAttempts: 3 })
    );
    const customRetryJob = notificationJobFixture({ id: "custom-retry", status: "FAILED", attempts: 3, maxAttempts: 5 });
    const prisma = {
      notificationJob: {
        findMany: vi.fn().mockResolvedValueOnce(exhausted).mockResolvedValueOnce([customRetryJob]),
        updateMany: vi.fn().mockResolvedValueOnce({ count: 1 }).mockResolvedValueOnce({ count: 1 })
      },
      notificationTemplate: {
        findFirst: vi.fn().mockResolvedValue({ key: "venc", channel: "WHATSAPP", metaTemplateName: "tpl_venc", language: "pt_BR" })
      },
      notificationLog: { create: vi.fn().mockResolvedValue({ id: "log-1" }) }
    };
    const provider = { sendWhatsAppTemplate: vi.fn(new FakeNotificationProvider().sendWhatsAppTemplate) };

    await processNotificationJobs(prisma as never, admin, provider, 1);

    expect(prisma.notificationJob.findMany).toHaveBeenCalledTimes(2);
    expect(prisma.notificationJob.findMany.mock.calls[0][0].where).not.toHaveProperty("attempts");
    expect(prisma.notificationJob.findMany.mock.calls[1][0]).toEqual(
      expect.objectContaining({ cursor: { id: "exhausted-24" }, skip: 1 })
    );
    expect(prisma.notificationJob.updateMany).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ where: expect.objectContaining({ id: "custom-retry", attempts: 3 }) })
    );
    expect(provider.sendWhatsAppTemplate).toHaveBeenCalledTimes(1);
  });

  it.each(["EMAIL", "DASHBOARD"])("never dispatches %s jobs through WhatsApp", async (channel) => {
    const prisma = {
      notificationJob: {
        findMany: vi.fn().mockResolvedValue([notificationJobFixture({ channel })]),
        updateMany: vi.fn().mockResolvedValueOnce({ count: 1 }).mockResolvedValueOnce({ count: 1 })
      },
      notificationTemplate: {
        findFirst: vi.fn().mockResolvedValue({ key: "venc", channel, language: "pt_BR" })
      },
      notificationLog: { create: vi.fn() }
    };
    const provider = { sendWhatsAppTemplate: vi.fn() };

    await processNotificationJobs(prisma as never, admin, provider);

    expect(provider.sendWhatsAppTemplate).not.toHaveBeenCalled();
    expect(prisma.notificationJob.updateMany).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "FAILED",
          attempts: 3,
          errorMessage: "UNSUPPORTED_NOTIFICATION_CHANNEL",
          nextRetryAt: null
        })
      })
    );
  });

  it("rejects a template whose channel differs from the claimed job", async () => {
    const prisma = {
      notificationJob: {
        findMany: vi.fn().mockResolvedValue([notificationJobFixture()]),
        updateMany: vi.fn().mockResolvedValueOnce({ count: 1 }).mockResolvedValueOnce({ count: 1 })
      },
      notificationTemplate: {
        findFirst: vi.fn().mockResolvedValue({ key: "venc", channel: "EMAIL", language: "pt_BR" })
      },
      notificationLog: { create: vi.fn() }
    };
    const provider = { sendWhatsAppTemplate: vi.fn() };

    await processNotificationJobs(prisma as never, admin, provider);

    expect(provider.sendWhatsAppTemplate).not.toHaveBeenCalled();
    expect(prisma.notificationJob.updateMany).toHaveBeenLastCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ errorMessage: "TEMPLATE_CHANNEL_MISMATCH" }) })
    );
  });

  it("updates jobs from webhook events", async () => {
    const prisma = {
      notificationJob: {
        findUnique: vi.fn().mockResolvedValue({ id: "job-1", provider: "meta-whatsapp", status: "SENT" }),
        updateMany: vi.fn().mockResolvedValue({ count: 1 })
      },
      notificationLog: { create: vi.fn().mockResolvedValue({ id: "log-1" }) }
    };

    const result = await handleMetaWebhook(prisma as never, {
      entry: [{ changes: [{ value: { statuses: [{ id: "wamid.1", status: "delivered" }] } }] }]
    }, undefined);

    expect(result.updated).toHaveLength(1);
    expect(prisma.notificationJob.findUnique).toHaveBeenCalledWith({
      where: { provider_providerMessageId: { provider: "meta-whatsapp", providerMessageId: "wamid.1" } }
    });
    expect(prisma.notificationJob.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: { in: ["PENDING", "PROCESSING", "SENT"] } }),
        data: expect.objectContaining({ status: "DELIVERED", deliveredAt: expect.any(Date) })
      })
    );
  });

  it("advances webhook state monotonically and ignores duplicate or out-of-order events", async () => {
    let currentStatus = "SENT";
    const prisma = {
      notificationJob: {
        findUnique: vi.fn().mockImplementation(() =>
          Promise.resolve({ id: "job-1", provider: "meta-whatsapp", providerMessageId: "wamid.1", status: currentStatus })
        ),
        updateMany: vi.fn().mockImplementation(({ where, data }) => {
          if (!where.status.in.includes(currentStatus)) return Promise.resolve({ count: 0 });
          currentStatus = data.status;
          return Promise.resolve({ count: 1 });
        })
      },
      notificationLog: { create: vi.fn().mockResolvedValue({ id: "log-1" }) }
    };

    const result = await handleMetaWebhook(prisma as never, {
      entry: [
        {
          changes: [
            {
              value: {
                statuses: [
                  { id: "wamid.1", status: "delivered" },
                  { id: "wamid.1", status: "sent" },
                  { id: "wamid.1", status: "delivered" },
                  { id: "wamid.1", status: "read" },
                  { id: "wamid.1", status: "failed" },
                  { id: "wamid.1", status: "read" }
                ]
              }
            }
          ]
        }
      ]
    }, undefined);

    expect(currentStatus).toBe("READ");
    expect(result.updated.map((job) => job.status)).toEqual(["DELIVERED", "READ"]);
    expect(prisma.notificationLog.create).toHaveBeenCalledTimes(2);
  });

  it("uses raw webhook body when validating Meta signatures", async () => {
    vi.stubEnv("META_APP_SECRET", "secret");
    const prisma = {
      notificationJob: {
        findUnique: vi.fn().mockResolvedValue({ id: "job-1", provider: "meta-whatsapp", status: "DELIVERED" }),
        updateMany: vi.fn().mockResolvedValue({ count: 1 })
      },
      notificationLog: { create: vi.fn().mockResolvedValue({ id: "log-1" }) }
    };
    const body = { entry: [{ changes: [{ value: { statuses: [{ id: "wamid.1", status: "read" }] } }] }] };
    const rawBody = JSON.stringify(body, null, 2);
    const signature = `sha256=${createHmac("sha256", "secret").update(rawBody).digest("hex")}`;

    const result = await handleMetaWebhook(prisma as never, body, signature, rawBody);

    expect(result.updated).toHaveLength(1);
    expect(prisma.notificationLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ rawPayload: rawBody, status: "READ" }) })
    );
  });

  it("rejects webhook events with invalid Meta signatures before job lookup", async () => {
    vi.stubEnv("META_APP_SECRET", "secret");
    const prisma = {
      notificationJob: {
        findUnique: vi.fn(),
        updateMany: vi.fn()
      },
      notificationLog: { create: vi.fn() }
    };

    await expect(
      handleMetaWebhook(
        prisma as never,
        { entry: [{ changes: [{ value: { statuses: [{ id: "wamid.1", status: "read" }] } }] }] },
        "sha256=bad",
        JSON.stringify({ entry: [] })
      )
    ).rejects.toThrow(new NotificationError("WEBHOOK_INVALID"));

    expect(prisma.notificationJob.findUnique).not.toHaveBeenCalled();
    expect(prisma.notificationLog.create).not.toHaveBeenCalled();
  });

  it("rejects invalid webhook challenge", () => {
    expect(() => verifyWebhookChallenge({ "hub.mode": "subscribe", "hub.verify_token": "bad" })).toThrow(
      new NotificationError("WEBHOOK_INVALID")
    );
  });
});
