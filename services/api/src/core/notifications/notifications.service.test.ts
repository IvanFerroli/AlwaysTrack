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
              phone: "+550000",
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
      "lic-1:rule-1:before:30:2026-04-29:professional",
      "lic-1:rule-1:before:30:2026-04-29:rt"
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

  it("rejects invalid webhook challenge", () => {
    expect(() => verifyWebhookChallenge({ "hub.mode": "subscribe", "hub.verify_token": "bad" })).toThrow(
      new NotificationError("WEBHOOK_INVALID")
    );
  });
});
