import { describe, expect, it, vi } from "vitest";
import type { CurrentUser } from "@alwaystrack/shared";
import { createLicense } from "../licenses/licenses.service.js";
import { processNotificationJobs, scanNotificationJobs } from "../notifications/notifications.service.js";
import { FakeNotificationProvider } from "../notifications/provider.js";
import { uploadDocumentWithToken } from "../documents/upload-tokens.service.js";
import { validateDocument } from "../documents/documents.service.js";
import type { StorageProvider } from "../documents/storage.js";

const admin: CurrentUser = {
  id: "admin-1",
  name: "Admin",
  email: "admin@example.com",
  role: "ADMIN",
  organizationId: "org-1",
  unitScopeIds: [],
  sectorScopeIds: []
};

const rt: CurrentUser = {
  id: "rt-1",
  name: "RT",
  email: "rt@example.com",
  role: "RT",
  organizationId: "org-1",
  unitScopeIds: [],
  sectorScopeIds: []
};

const professional = {
  id: "pro-1",
  name: "Ana",
  email: "ana@example.com",
  phone: "+550000",
  cpf: "00000000000",
  organizationId: "org-1",
  unitId: "unit-1",
  sectorId: "sector-1",
  responsibleRtId: "rt-1",
  active: true,
  unit: { id: "unit-1", name: "Unidade" },
  sector: { id: "sector-1", name: "Setor" },
  responsibleRt: { id: "rt-1", name: "RT", email: "rt@example.com", role: "RT", phone: "+551111" }
};

const licenseType = {
  id: "type-1",
  name: "COREN",
  defaultWarningDays: "30",
  notificationRules: []
};

describe("main operational flow", () => {
  it("covers license status, notification job, public upload and RT validation", async () => {
    const expiresAt = new Date("2026-05-30T00:00:00.000Z");
    const prisma = {
      professional: { findFirst: vi.fn().mockResolvedValue(professional) },
      licenseType: { findFirst: vi.fn().mockResolvedValue(licenseType) },
      license: {
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({
          id: "lic-1",
          professionalId: "pro-1",
          licenseTypeId: "type-1",
          number: "COREN-1",
          status: "PENDING_DOCUMENT",
          expiresAt,
          licenseType,
          documents: []
        }),
        update: vi
          .fn()
          .mockResolvedValueOnce({
            id: "lic-1",
            professionalId: "pro-1",
            licenseTypeId: "type-1",
            number: "COREN-1",
            status: "EXPIRING",
            professional,
            licenseType,
            validatedBy: { id: "admin-1", name: "Admin", email: "admin@example.com", role: "ADMIN" },
            _count: { documents: 0, notificationJobs: 0 }
          })
          .mockResolvedValueOnce({ id: "lic-1", status: "PENDING_VALIDATION" })
          .mockResolvedValueOnce({ id: "lic-1", status: "EXPIRING" }),
        findMany: vi
          .fn()
          .mockResolvedValueOnce([
            {
              id: "lic-1",
              professionalId: "pro-1",
              licenseTypeId: "type-1",
              number: "COREN-1",
              status: "EXPIRING",
              expiresAt,
              licenseType,
              professional
            }
          ])
          .mockResolvedValueOnce([
            {
              id: "lic-1",
              status: "PENDING_VALIDATION",
              expiresAt,
              licenseType,
              documents: [{ status: "APPROVED" }]
            }
          ])
      },
      notificationRule: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "rule-1",
            licenseTypeId: "type-1",
            daysBeforeExpiration: 30,
            repeatAfterExpiredDays: null,
            channel: "WHATSAPP",
            templateKey: "vencimento",
            notifyProfessional: true,
            notifyRt: false,
            licenseType
          }
        ])
      },
      notificationJob: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: "job-1", attempts: 0, maxAttempts: 3, ...data })),
        findMany: vi.fn().mockResolvedValue([
          {
            id: "job-1",
            templateKey: "vencimento",
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
        findFirst: vi.fn().mockResolvedValue({ key: "vencimento", language: "pt_BR", metaTemplateName: "vencimento_tpl" })
      },
      notificationLog: { create: vi.fn().mockResolvedValue({ id: "log-1" }) },
      uploadToken: {
        findUnique: vi.fn().mockResolvedValue({
          id: "tok-1",
          professionalId: "pro-1",
          licenseId: "lic-1",
          active: true,
          usedAt: null,
          expiresAt: new Date("2026-06-30T00:00:00.000Z"),
          professional,
          license: {
            id: "lic-1",
            status: "EXPIRING",
            number: "COREN-1",
            expiresAt,
            licenseType,
            professional
          }
        }),
        update: vi.fn().mockResolvedValue({ id: "tok-1", active: false })
      },
      document: {
        create: vi.fn().mockResolvedValue({ id: "doc-1", professionalId: "pro-1", licenseId: "lic-1", size: 4 }),
        findFirst: vi.fn().mockResolvedValue({
          id: "doc-1",
          status: "UPLOADED",
          professionalId: "pro-1",
          licenseId: "lic-1",
          professional,
          license: { id: "lic-1", status: "PENDING_VALIDATION" }
        }),
        update: vi.fn().mockResolvedValue({
          id: "doc-1",
          status: "APPROVED",
          professionalId: "pro-1",
          licenseId: "lic-1",
          professional,
          license: { id: "lic-1", licenseType },
          validatedBy: { id: "rt-1", name: "RT", email: "rt@example.com", role: "RT" }
        })
      },
      auditLog: { create: vi.fn().mockResolvedValue({ id: "audit-1" }) }
    };
    const storage: StorageProvider = { put: vi.fn().mockResolvedValue(undefined), get: vi.fn() };

    const license = await createLicense(prisma as never, admin, {
      professionalId: "pro-1",
      licenseTypeId: "type-1",
      number: "COREN-1",
      expiresAt
    });
    const scan = await scanNotificationJobs(prisma as never, admin, { today: new Date("2026-04-30T00:00:00.000Z") });
    const process = await processNotificationJobs(prisma as never, admin, new FakeNotificationProvider());
    const document = await uploadDocumentWithToken(prisma as never, storage, {
      token: "raw-token",
      fileName: "registro.pdf",
      mimeType: "application/pdf",
      body: Buffer.from("file")
    });
    const validation = await validateDocument(prisma as never, rt, "doc-1", { status: "APPROVED" });

    expect(license.status).toBe("EXPIRING");
    expect(scan.created).toHaveLength(1);
    expect(process.processed[0]).toEqual(expect.objectContaining({ status: "SENT" }));
    expect(document.id).toBe("doc-1");
    expect(validation.status).toBe("APPROVED");
    expect(prisma.license.update).toHaveBeenLastCalledWith({ where: { id: "lic-1" }, data: { status: "EXPIRING" } });
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: "document.approve" }) })
    );
  });
});
