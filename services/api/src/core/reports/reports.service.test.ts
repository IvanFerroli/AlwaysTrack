import { describe, expect, it, vi } from "vitest";
import { exportReportCsv, parseReportFilters, runReport } from "./reports.service.js";

describe("reports service", () => {
  it("parses reusable report filters with capped pagination", () => {
    const filters = parseReportFilters({
      from: "2026-04-01",
      to: "2026-04-30",
      unitId: "unit-1",
      sectorId: "sector-1",
      rtId: "rt-1",
      licenseTypeId: "type-1",
      status: "FAILED",
      channel: "WHATSAPP",
      windowDays: "60",
      page: "2",
      pageSize: "500"
    });

    expect(filters).toMatchObject({
      unitId: "unit-1",
      sectorId: "sector-1",
      rtId: "rt-1",
      licenseTypeId: "type-1",
      status: "FAILED",
      channel: "WHATSAPP",
      windowDays: 60,
      page: 2,
      pageSize: 100
    });
    expect(filters.from?.toISOString()).toBe("2026-04-01T00:00:00.000Z");
    expect(filters.to?.toISOString()).toBe("2026-04-30T00:00:00.000Z");
  });

  it("queries expired licenses with scope, filters and derived days", async () => {
    const expiresAt = new Date("2026-04-01T00:00:00.000Z");
    const findMany = vi.fn().mockResolvedValue([
      {
        id: "license-1",
        number: "123",
        expiresAt,
        status: "EXPIRED",
        licenseType: { name: "COREN" },
        professional: {
          name: "Ana",
          unit: { name: "Unidade A" },
          sector: { name: "UTI" },
          responsibleRt: { name: "RT A" }
        },
        documents: [{ createdAt: new Date("2026-04-10T00:00:00.000Z"), status: "REJECTED" }],
        notificationJobs: [{ scheduledFor: new Date("2026-04-02T00:00:00.000Z"), sentAt: null, status: "SENT" }]
      }
    ]);
    const count = vi.fn().mockResolvedValue(1);
    const prisma = {
      license: { findMany, count },
      $transaction: vi.fn().mockResolvedValue([await findMany(), 1])
    };

    const result = await runReport(
      prisma as never,
      { id: "admin-1", organizationId: "org-1", role: "ADMIN", name: "Admin", email: "admin@test", unitScopeIds: [], sectorScopeIds: [] },
      "expiredLicenses",
      parseReportFilters({ unitId: "unit-1", licenseTypeId: "type-1" })
    );

    expect(count).toHaveBeenCalledWith({
      where: expect.objectContaining({
        licenseTypeId: "type-1",
        status: "EXPIRED",
        professional: expect.objectContaining({ organizationId: "org-1", unitId: "unit-1" })
      })
    });
    const firstItem = result.items[0] as { daysExpired: number; professionalName: string; lastDocumentStatus: string; lastNotificationStatus: string };
    expect(firstItem).toMatchObject({
      professionalName: "Ana",
      lastDocumentStatus: "REJECTED",
      lastNotificationStatus: "SENT"
    });
    expect(firstItem.daysExpired).toBeGreaterThan(0);
  });

  it("aggregates supervisor area reports inside scoped professionals", async () => {
    const prisma = {
      professional: {
        findMany: vi.fn().mockResolvedValue([
          {
            unit: { name: "Unidade A" },
            sector: { name: "UTI" },
            responsibleRt: { name: "RT A" },
            licenses: [{ status: "REGULAR" }, { status: "EXPIRED" }],
            documents: [{ status: "UPLOADED" }],
            notificationJobs: [{ status: "FAILED" }]
          }
        ])
      }
    };

    const result = await runReport(
      prisma as never,
      {
        id: "sup-1",
        organizationId: "org-1",
        role: "SUPERVISOR",
        name: "Sup",
        email: "sup@test",
        unitScopeIds: ["unit-1"],
        sectorScopeIds: []
      },
      "areaSummary",
      parseReportFilters({})
    );

    expect(prisma.professional.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          organizationId: "org-1",
          OR: [{ unitId: { in: ["unit-1"] } }, { id: "__no_sector_scope__" }]
        })
      })
    );
    expect(result.items[0]).toMatchObject({
      label: "Unidade A / UTI",
      regular: 1,
      expired: 1,
      pendingValidation: 1,
      failedNotifications: 1
    });
  });

  it("exports CSV using report query rows with escaped values", async () => {
    const prisma = {
      document: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "doc-1",
            fileName: 'registro,"final".pdf',
            status: "REJECTED",
            validatedAt: new Date("2026-04-20T00:00:00.000Z"),
            rejectionReason: 'Imagem "ilegivel"',
            professional: {
              name: "Ana",
              unit: { name: "Unidade A" },
              sector: { name: "UTI" },
              responsibleRt: { name: "RT A" }
            },
            license: { status: "PENDING_DOCUMENT", licenseType: { name: "COREN" } },
            validatedBy: { name: "Admin" }
          }
        ]),
        count: vi.fn().mockResolvedValue(1)
      },
      $transaction: vi.fn()
    };
    prisma.$transaction.mockResolvedValue([await prisma.document.findMany(), 1]);

    const csv = await exportReportCsv(
      prisma as never,
      { id: "admin-1", organizationId: "org-1", role: "ADMIN", name: "Admin", email: "admin@test", unitScopeIds: [], sectorScopeIds: [] },
      "rejectedDocuments",
      parseReportFilters({ sectorId: "sector-1" })
    );

    expect(prisma.document.count).toHaveBeenCalledWith({
      where: expect.objectContaining({
        professional: expect.objectContaining({ organizationId: "org-1", sectorId: "sector-1" })
      })
    });
    expect(csv.split("\n")[0]).toContain('"Arquivo","Profissional"');
    expect(csv).toContain('"registro,""final"".pdf"');
    expect(csv).toContain('"Imagem ""ilegivel"""');
  });
});
