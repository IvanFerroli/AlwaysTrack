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
          dedupeKey: "faq.thread.created:thread-1:seller-1"
        })
      })
    );
  });

  it("lists and marks in-app notifications as read", async () => {
    const prisma = {
      inAppNotification: {
        findMany: vi.fn().mockResolvedValue([
          { id: "notif-1", recipientId: "admin-1", type: "faq.thread.created", readAt: null },
          { id: "notif-2", recipientId: "admin-1", type: "wiki.review", readAt: new Date("2026-06-09T00:00:00.000Z") }
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
        findMany: vi.fn().mockResolvedValue([
          {
            id: "job-1",
            templateKey: "venc",
            recipientPhone: "+550000",
            payloadJson: JSON.stringify({ professionalName: "Ana", expiresAt: "2026-05-29T00:00:00.000Z" }),
            attempts: 0,
            maxAttempts: 3
          }
        ]),
        update: vi
          .fn()
          .mockResolvedValueOnce({ id: "job-1", attempts: 1, maxAttempts: 3 })
          .mockResolvedValueOnce({ id: "job-1", status: "SENT" })
      },
      notificationTemplate: {
        findFirst: vi
          .fn()
          .mockResolvedValue({ key: "venc", metaTemplateName: "tpl_venc", language: "pt_BR", bodyPreview: "Ola {{professionalName}}, vence em {{expiresAt}}." })
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

    expect(prisma.notificationJob.update).toHaveBeenLastCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "SENT", providerMessageId: expect.stringMatching(/^fake_/) }) })
    );
    expect(prisma.notificationLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "SENT" }) })
    );
  });

  it("keeps failed provider sends retryable and logs sanitized provider response", async () => {
    const prisma = {
      notificationJob: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "job-1",
            templateKey: "venc",
            recipientPhone: "+550000",
            payloadJson: "{}",
            attempts: 0,
            maxAttempts: 3
          }
        ]),
        update: vi
          .fn()
          .mockResolvedValueOnce({ id: "job-1", attempts: 1, maxAttempts: 3 })
          .mockResolvedValueOnce({ id: "job-1", status: "FAILED" })
      },
      notificationTemplate: {
        findFirst: vi.fn().mockResolvedValue({ key: "venc", metaTemplateName: "tpl_venc", language: "pt_BR" })
      },
      notificationLog: { create: vi.fn().mockResolvedValue({ id: "log-1" }) }
    };
    const provider = {
      sendWhatsAppTemplate: vi.fn().mockRejectedValue(new NotificationProviderError("META_WHATSAPP_SEND_FAILED", { error: "rate_limit" }))
    };

    await processNotificationJobs(prisma as never, admin, provider);

    expect(prisma.notificationJob.update).toHaveBeenLastCalledWith(
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

  it("updates jobs from webhook events", async () => {
    const prisma = {
      notificationJob: {
        findFirst: vi.fn().mockResolvedValue({ id: "job-1", provider: "meta-whatsapp" }),
        update: vi.fn().mockResolvedValue({ id: "job-1", status: "DELIVERED" })
      },
      notificationLog: { create: vi.fn().mockResolvedValue({ id: "log-1" }) }
    };

    const result = await handleMetaWebhook(prisma as never, {
      entry: [{ changes: [{ value: { statuses: [{ id: "wamid.1", status: "delivered" }] } }] }]
    }, undefined);

    expect(result.updated).toHaveLength(1);
    expect(prisma.notificationJob.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "DELIVERED", deliveredAt: expect.any(Date) }) })
    );
  });

  it("uses raw webhook body when validating Meta signatures", async () => {
    vi.stubEnv("META_APP_SECRET", "secret");
    const prisma = {
      notificationJob: {
        findFirst: vi.fn().mockResolvedValue({ id: "job-1", provider: "meta-whatsapp" }),
        update: vi.fn().mockResolvedValue({ id: "job-1", status: "READ" })
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
        findFirst: vi.fn(),
        update: vi.fn()
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

    expect(prisma.notificationJob.findFirst).not.toHaveBeenCalled();
    expect(prisma.notificationLog.create).not.toHaveBeenCalled();
  });

  it("rejects invalid webhook challenge", () => {
    expect(() => verifyWebhookChallenge({ "hub.mode": "subscribe", "hub.verify_token": "bad" })).toThrow(
      new NotificationError("WEBHOOK_INVALID")
    );
  });
});
