import { describe, expect, it, vi } from "vitest";
import type { CurrentUser } from "@sylembra/shared";
import {
  createNotificationRule,
  createNotificationTemplate,
  handleMetaWebhook,
  NotificationError,
  parseNotificationRuleInput,
  parseNotificationTemplateInput,
  processNotificationJobs,
  scanNotificationJobs,
  verifyWebhookChallenge
} from "./notifications.service.js";
import { FakeNotificationProvider } from "./provider.js";

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

  it("scans active rules and dedupes jobs", async () => {
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
            expiresAt: new Date("2026-05-29T00:00:00.000Z"),
            licenseType: { name: "Registro" },
            professional: { name: "Ana", phone: "+550000", email: null, responsibleRt: null }
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
  });

  it("processes pending jobs with provider and logs success", async () => {
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
          .mockResolvedValueOnce({ id: "job-1", status: "SENT" })
      },
      notificationTemplate: {
        findFirst: vi.fn().mockResolvedValue({ key: "venc", metaTemplateName: "tpl_venc", language: "pt_BR" })
      },
      notificationLog: { create: vi.fn().mockResolvedValue({ id: "log-1" }) }
    };

    await processNotificationJobs(prisma as never, admin, new FakeNotificationProvider());

    expect(prisma.notificationJob.update).toHaveBeenLastCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "SENT", providerMessageId: expect.stringMatching(/^fake_/) }) })
    );
    expect(prisma.notificationLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "SENT" }) })
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

  it("rejects invalid webhook challenge", () => {
    expect(() => verifyWebhookChallenge({ "hub.mode": "subscribe", "hub.verify_token": "bad" })).toThrow(
      new NotificationError("WEBHOOK_INVALID")
    );
  });
});
