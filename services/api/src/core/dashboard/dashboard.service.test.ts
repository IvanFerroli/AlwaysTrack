import { describe, expect, it, vi } from "vitest";
import type { CurrentUser } from "@alwaystrack/shared";
import { getDashboard } from "./dashboard.service.js";

const admin: CurrentUser = {
  id: "admin-1",
  name: "Admin",
  email: "admin@example.com",
  role: "ADMIN",
  organizationId: "org-1",
  unitScopeIds: [],
  sectorScopeIds: []
};

const supervisor: CurrentUser = {
  id: "sup-1",
  name: "Supervisor",
  email: "sup@example.com",
  role: "SUPERVISOR",
  organizationId: "org-1",
  unitScopeIds: ["unit-1"],
  sectorScopeIds: ["sector-1"]
};

function license(id: string, sectorName = "Setor A") {
  return {
    id,
    expiresAt: new Date("2026-05-01T00:00:00.000Z"),
    licenseType: { name: "Registro" },
    professional: {
      id: "pro-1",
      name: "Ana",
      unit: { name: "Unidade A" },
      sector: { name: sectorName },
      responsibleRt: { id: "rt-1", name: "RT A" }
    }
  };
}

function document(id: string) {
  return {
    id,
    fileName: "doc.pdf",
    createdAt: new Date("2026-04-29T00:00:00.000Z"),
    professional: {
      id: "pro-1",
      name: "Ana",
      unit: { name: "Unidade A" },
      sector: { name: "Setor A" },
      responsibleRt: { id: "rt-1", name: "RT A" }
    },
    license: { id: "lic-1", licenseType: { name: "Registro" } }
  };
}

describe("dashboard service", () => {
  it("aggregates metrics and operational queues for admin scope", async () => {
    const prisma = {
      professional: { count: vi.fn().mockResolvedValue(3) },
      license: {
        count: vi.fn().mockResolvedValueOnce(2).mockResolvedValueOnce(1).mockResolvedValueOnce(1),
        findMany: vi.fn().mockResolvedValueOnce([license("expiring-1")]).mockResolvedValueOnce([license("expired-1")])
      },
      document: {
        count: vi.fn().mockResolvedValue(2),
        findMany: vi.fn().mockResolvedValueOnce([document("doc-1")]).mockResolvedValueOnce([document("doc-2")])
      },
      notificationJob: {
        count: vi.fn().mockResolvedValueOnce(4).mockResolvedValueOnce(5).mockResolvedValueOnce(1),
        findMany: vi.fn().mockResolvedValue([{ id: "job-1", professional: { unit: {}, sector: {} }, license: { licenseType: {} } }])
      },
      wikiEditRequest: {
        count: vi.fn().mockResolvedValue(1),
        findMany: vi.fn().mockResolvedValue([
          {
            id: "wiki-req-1",
            title: "Procedimento atualizado",
            baseVersion: 1,
            createdAt: new Date("2026-04-29T00:00:00.000Z"),
            page: { id: "page-1", slug: "primeiros-passos", title: "Primeiros passos", version: 1 },
            author: { id: "rt-1", name: "RT A", email: "rt@example.com", role: "RT" }
          }
        ])
      }
    };

    const result = await getDashboard(prisma as never, admin, new Date("2026-04-29T00:00:00.000Z"));

    expect(result.metrics.totalProfessionals).toBe(3);
    expect(result.metrics.licenses).toEqual({ regular: 2, expiring: 1, expired: 1 });
    expect(result.metrics.wiki.pendingRequests).toBe(1);
    expect(result.queues.pendingWikiRequests).toHaveLength(1);
    expect(result.queues.expiredBySector).toEqual([{ label: "Setor A", total: 1 }]);
    expect(prisma.professional.count).toHaveBeenCalledWith({ where: { organizationId: "org-1" } });
  });

  it("uses supervisor unit/sector scope in queries", async () => {
    const prisma = {
      professional: { count: vi.fn().mockResolvedValue(0) },
      license: { count: vi.fn().mockResolvedValue(0), findMany: vi.fn().mockResolvedValue([]) },
      document: { count: vi.fn().mockResolvedValue(0), findMany: vi.fn().mockResolvedValue([]) },
      notificationJob: { count: vi.fn().mockResolvedValue(0), findMany: vi.fn().mockResolvedValue([]) },
      wikiEditRequest: { count: vi.fn().mockResolvedValue(0), findMany: vi.fn().mockResolvedValue([]) }
    };

    await getDashboard(prisma as never, supervisor);

    expect(prisma.professional.count).toHaveBeenCalledWith({
      where: {
        organizationId: "org-1",
        OR: [{ unitId: { in: ["unit-1"] } }, { sectorId: { in: ["sector-1"] } }]
      }
    });
  });
});
