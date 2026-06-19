import { describe, expect, it, vi } from "vitest";
import type { CurrentUser } from "@alwaystrack/shared";
import { getOperationalToday } from "./operations.service.js";

const admin: CurrentUser = {
  id: "admin-1",
  name: "Admin",
  email: "admin@example.com",
  role: "ADMIN",
  organizationId: "org-1",
  unitScopeIds: [],
  sectorScopeIds: []
};

const seller: CurrentUser = {
  id: "seller-user-1",
  name: "Vendedor",
  email: "seller@example.com",
  role: "VENDEDOR",
  organizationId: "org-1",
  unitScopeIds: [],
  sectorScopeIds: []
};

const sac: CurrentUser = {
  ...admin,
  id: "sac-1",
  role: "SAC"
};

function prismaMock() {
  return {
    salesDocument: {
      count: vi.fn().mockResolvedValueOnce(4).mockResolvedValueOnce(2).mockResolvedValueOnce(1).mockResolvedValueOnce(1),
      findMany: vi.fn().mockResolvedValue([
        {
          id: "doc-1",
          status: "PENDING_REVIEW",
          createdAt: new Date("2026-06-12T08:00:00.000Z"),
          sellerProfile: { id: "seller-1", displayName: "Ana", code: "ANA", salesGroup: { id: "group-1", name: "Vendas" } }
        }
      ])
    },
    auditLog: { count: vi.fn().mockResolvedValue(1) },
    salesCampaign: {
      findMany: vi.fn().mockResolvedValue([{ id: "campaign-1", name: "Junho", status: "ACTIVE", salesGroup: null }]),
      count: vi.fn().mockResolvedValue(1)
    },
    wikiEditRequest: {
      count: vi.fn().mockResolvedValue(1),
      findMany: vi.fn().mockResolvedValue([
        {
          id: "wiki-req-1",
          title: "Atualizar processo",
          createdAt: new Date("2026-06-12T08:00:00.000Z"),
          page: { id: "page-1", slug: "processo", title: "Processo" },
          author: { id: "user-1", name: "SAC", role: "SAC" }
        }
      ])
    },
    faqThread: {
      count: vi.fn().mockResolvedValue(1),
      findMany: vi.fn().mockResolvedValue([{ id: "faq-1", title: "Como conferir?", body: null, createdAt: new Date(), author: { id: "user-1", name: "SAC", role: "SAC" } }])
    },
    inAppNotification: {
      count: vi.fn().mockResolvedValue(2),
      findMany: vi.fn().mockResolvedValue([{ id: "notif-1", type: "sales.approved", title: "Nota aprovada", body: null, href: "/notas", createdAt: new Date() }])
    },
    announcement: {
      count: vi.fn().mockResolvedValueOnce(2).mockResolvedValueOnce(1),
      findMany: vi.fn().mockResolvedValue([
        {
          id: "ann-1",
          slug: "aviso-do-dia",
          title: "Aviso do dia",
          summary: "Prioridade comercial",
          priority: "HIGH",
          pinned: true,
          requiresAck: true,
          publishedAt: new Date("2026-06-12T08:00:00.000Z"),
          expiresAt: null
        }
      ])
    },
    salesItem: {
      findMany: vi.fn().mockResolvedValue([
        {
          sellerProfileId: "seller-1",
          salesDocumentId: "doc-approved-1",
          totalAmountCents: 10000,
          quantity: 2,
          sellerProfile: { displayName: "Ana", salesGroup: { name: "Vendas" } }
        }
      ])
    }
  };
}

describe("operations service", () => {
  it("aggregates today's operational center for admin", async () => {
    const prisma = prismaMock();
    const result = await getOperationalToday(prisma as never, admin, new Date("2026-06-12T10:00:00.000Z"));

    expect(result.period.today).toBe("2026-06-12");
    expect(result.metrics.pendingDocuments).toBe(4);
    expect(result.metrics.approvedToday).toBe(2);
    expect(result.metrics.rejectedToday).toBe(1);
    expect(result.metrics.duplicates).toBe(1);
    expect(result.metrics.wikiPendingReviews).toBe(1);
    expect(result.metrics.faqUnanswered).toBe(1);
    expect(result.metrics.activeAnnouncements).toBe(2);
    expect(result.queues.activeAnnouncements[0]).toMatchObject({ slug: "aviso-do-dia", priority: "HIGH" });
    expect(result.queues.ranking[0]).toMatchObject({ sellerName: "Ana", totalAmountCents: 10000, documents: 1 });
    expect(result.queues.alerts.some((alert) => alert?.title === "Falhas de extracao hoje")).toBe(true);
  });

  it("scopes seller documents and ranking to the logged seller", async () => {
    const prisma = prismaMock();
    await getOperationalToday(prisma as never, seller, new Date("2026-06-12T10:00:00.000Z"));

    expect(prisma.salesDocument.count).toHaveBeenCalledWith({
      where: {
        organizationId: "org-1",
        sellerProfile: { organizationId: "org-1", userId: "seller-user-1" },
        status: { in: ["UPLOADED", "EXTRACTING", "PENDING_REVIEW"] }
      }
    });
    expect(prisma.wikiEditRequest.count).not.toHaveBeenCalled();
  });

  it("keeps SAC operational center away from commercial queries", async () => {
    const prisma = prismaMock();
    const result = await getOperationalToday(prisma as never, sac, new Date("2026-06-12T10:00:00.000Z"));

    expect(result.metrics.pendingDocuments).toBe(0);
    expect(result.metrics.activeCampaigns).toBe(0);
    expect(result.queues.ranking).toEqual([]);
    expect(prisma.salesDocument.count).not.toHaveBeenCalled();
    expect(prisma.salesDocument.findMany).not.toHaveBeenCalled();
    expect(prisma.salesCampaign.findMany).not.toHaveBeenCalled();
    expect(prisma.salesItem.findMany).not.toHaveBeenCalled();
  });
});
