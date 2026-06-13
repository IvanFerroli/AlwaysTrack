import { describe, expect, it, vi } from "vitest";
import type { CurrentUser } from "@alwaystrack/shared";
import {
  acknowledgeAnnouncement,
  createAnnouncement,
  listAnnouncements,
  parseAnnouncementFilters,
  parseAnnouncementInput,
  publishAnnouncement
} from "./announcements.service.js";

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
  ...admin,
  id: "seller-1",
  role: "VENDEDOR"
};

function prismaMock() {
  return {
    announcement: {
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: "ann-1", ...data, createdAt: new Date(), updatedAt: new Date() })),
      update: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: "ann-1", slug: "aviso", title: "Aviso", summary: null, content: "Texto", tagsJson: "[]", linksJson: "[]", targetRolesJson: "[\"VENDEDOR\"]", status: "PUBLISHED", priority: "HIGH", pinned: false, requiresAck: true, startsAt: null, expiresAt: null, publishedAt: new Date(), archivedAt: null, createdById: "admin-1", updatedById: "admin-1", createdAt: new Date(), updatedAt: new Date(), ...data })),
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0)
    },
    announcementReadReceipt: {
      upsert: vi.fn().mockResolvedValue({ id: "receipt-1" })
    },
    auditLog: {
      create: vi.fn().mockResolvedValue({ id: "audit-1" })
    },
    user: {
      findMany: vi.fn().mockResolvedValue([{ id: "seller-1" }])
    },
    inAppNotification: {
      upsert: vi.fn().mockResolvedValue({ id: "notif-1" })
    }
  };
}

describe("announcements service", () => {
  it("parses input and filters", () => {
    expect(parseAnnouncementInput({ title: " Aviso ", priority: "critical", targetRoles: ["VENDEDOR", "RT"], tags: ["#Notas"] })).toMatchObject({
      title: "Aviso",
      priority: "CRITICAL",
      targetRoles: ["VENDEDOR"],
      tags: ["notas"]
    });
    expect(parseAnnouncementFilters({ status: "published", priority: "high", tags: "notas,faq", activeOnly: "1" })).toMatchObject({
      status: "PUBLISHED",
      priority: "HIGH",
      tags: ["notas", "faq"],
      activeOnly: true
    });
  });

  it("creates announcement with audit", async () => {
    const prisma = prismaMock();
    const result = await createAnnouncement(prisma as never, admin, { title: "Aviso", content: "Texto", targetRoles: ["VENDEDOR"], priority: "HIGH" });

    expect(result.announcement.slug).toBe("aviso");
    expect(prisma.announcement.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: "DRAFT" }) }));
    expect(prisma.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: "announcement.create" }) }));
  });

  it("publishes with deduped in-app notification", async () => {
    const prisma = prismaMock();
    prisma.announcement.findFirst.mockResolvedValueOnce({ id: "ann-1", slug: "aviso", title: "Aviso", summary: null, content: "Texto", tagsJson: "[]", linksJson: "[]", targetRolesJson: "[\"VENDEDOR\"]", status: "DRAFT", priority: "HIGH", pinned: false, requiresAck: true, startsAt: null, expiresAt: null, publishedAt: null });

    await publishAnnouncement(prisma as never, admin, "ann-1");

    expect(prisma.announcement.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: "PUBLISHED" }) }));
    expect(prisma.inAppNotification.upsert).toHaveBeenCalledWith(expect.objectContaining({ create: expect.objectContaining({ href: "/avisos/aviso" }) }));
  });

  it("scopes seller listing and acknowledgement", async () => {
    const prisma = prismaMock();
    await listAnnouncements(prisma as never, seller, { activeOnly: true });
    prisma.announcement.findFirst.mockResolvedValueOnce({ id: "ann-1", slug: "aviso", title: "Aviso", summary: null, content: "Texto", tagsJson: "[]", linksJson: "[]", targetRolesJson: "[\"VENDEDOR\"]", status: "PUBLISHED", priority: "HIGH", pinned: false, requiresAck: true, startsAt: null, expiresAt: null, publishedAt: new Date() });
    await acknowledgeAnnouncement(prisma as never, seller, "ann-1");

    expect(prisma.announcement.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ targetRolesJson: { contains: "\"VENDEDOR\"" } }) }));
    expect(prisma.announcementReadReceipt.upsert).toHaveBeenCalledWith(expect.objectContaining({ create: expect.objectContaining({ userId: "seller-1" }) }));
  });
});
