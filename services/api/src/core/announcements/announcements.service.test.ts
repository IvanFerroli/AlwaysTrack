import { describe, expect, it, vi } from "vitest";
import type { CurrentUser } from "@alwaystrack/shared";
import { InputValidationError } from "../validation/input-validation.js";
import {
  acknowledgeAnnouncement,
  createAnnouncement,
  getAnnouncementBySlug,
  getAnnouncementsAcknowledgementCompliance,
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
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockResolvedValue(null),
      upsert: vi.fn().mockResolvedValue({ id: "receipt-1", acknowledgedAt: new Date() })
    },
    auditLog: {
      create: vi.fn().mockResolvedValue({ id: "audit-1" })
    },
    user: {
      findMany: vi.fn().mockResolvedValue([{ id: "seller-1", name: "Seller", email: "seller@example.com", role: "VENDEDOR" }])
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

  it("rejects malformed announcement input before service execution", () => {
    expect(() => parseAnnouncementInput("bad")).toThrow(InputValidationError);
    expect(() => parseAnnouncementInput({ title: 123 })).toThrow(InputValidationError);
    expect(() => parseAnnouncementInput({ content: "x".repeat(20_001) })).toThrow(InputValidationError);
    expect(() => parseAnnouncementInput({ tags: Array.from({ length: 31 }, (_, index) => `tag-${index}`) })).toThrow(InputValidationError);
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

  it("rejects acknowledgement outside the published target audience", async () => {
    const prisma = prismaMock();
    prisma.announcement.findFirst.mockResolvedValueOnce({
      id: "ann-1",
      slug: "aviso",
      title: "Aviso",
      targetRolesJson: '["SAC"]',
      status: "PUBLISHED",
      requiresAck: true,
      startsAt: null,
      expiresAt: null
    });

    await expect(acknowledgeAnnouncement(prisma as never, seller, "ann-1")).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(prisma.announcementReadReceipt.upsert).not.toHaveBeenCalled();
  });

  it("classifies the active target-role audience without crossing tenant or role boundaries", async () => {
    const prisma = prismaMock();
    prisma.user.findMany.mockResolvedValueOnce([
      { id: "seller-1", name: "Ana", email: "ana@example.com", role: "VENDEDOR" },
      { id: "seller-2", name: "Bruno", email: "bruno@example.com", role: "VENDEDOR" },
      { id: "seller-3", name: "Carla", email: "carla@example.com", role: "VENDEDOR" }
    ]);
    prisma.announcementReadReceipt.findMany.mockResolvedValueOnce([
      { announcementId: "ann-1", userId: "seller-1", acknowledgedAt: new Date("2026-07-16T10:00:00.000Z") },
      { announcementId: "ann-1", userId: "seller-2", acknowledgedAt: null },
      { announcementId: "ann-1", userId: "outside-audience", acknowledgedAt: new Date("2026-07-16T10:00:00.000Z") }
    ]);

    const compliance = (
      await getAnnouncementsAcknowledgementCompliance(prisma as never, "org-1", [
        { id: "ann-1", targetRolesJson: '["VENDEDOR"]' }
      ])
    ).get("ann-1");

    expect(prisma.user.findMany).toHaveBeenCalledWith({
      where: { organizationId: "org-1", active: true, role: { in: ["VENDEDOR"] } },
      select: { id: true, name: true, email: true, role: true },
      orderBy: [{ name: "asc" }, { email: "asc" }, { id: "asc" }]
    });
    expect(prisma.announcementReadReceipt.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { organizationId: "org-1", announcementId: { in: ["ann-1"] } }
    }));
    expect(compliance).toEqual({
      audienceCount: 3,
      acknowledgedCount: 1,
      openedCount: 2,
      pendingCount: 2,
      completed: false,
      acknowledgedUsers: [{ id: "seller-1", name: "Ana", email: "ana@example.com", role: "VENDEDOR" }],
      openedWithoutAckUsers: [{ id: "seller-2", name: "Bruno", email: "bruno@example.com", role: "VENDEDOR" }],
      notOpenedUsers: [{ id: "seller-3", name: "Carla", email: "carla@example.com", role: "VENDEDOR" }]
    });
  });

  it("does not complete an empty audience", async () => {
    const prisma = prismaMock();
    prisma.user.findMany.mockResolvedValueOnce([]);

    const compliance = (
      await getAnnouncementsAcknowledgementCompliance(prisma as never, "org-1", [
        { id: "ann-empty", targetRolesJson: '["SAC"]' }
      ])
    ).get("ann-empty");

    expect(compliance).toMatchObject({ audienceCount: 0, acknowledgedCount: 0, openedCount: 0, pendingCount: 0, completed: false });
  });

  it("notifies active managers once when the final audience member acknowledges", async () => {
    const prisma = prismaMock();
    prisma.announcement.findFirst.mockResolvedValueOnce({
      id: "ann-1",
      slug: "aviso",
      title: "Aviso",
      targetRolesJson: '["VENDEDOR"]',
      status: "PUBLISHED",
      requiresAck: true,
      startsAt: null,
      expiresAt: null
    });
    prisma.user.findMany
      .mockResolvedValueOnce([{ id: "seller-1", name: "Seller", email: "seller@example.com", role: "VENDEDOR" }])
      .mockResolvedValueOnce([
        { id: "admin-1" },
        { id: "manager-1" }
      ]);
    prisma.announcementReadReceipt.findMany.mockResolvedValueOnce([
      { announcementId: "ann-1", userId: "seller-1", acknowledgedAt: new Date("2026-07-16T10:00:00.000Z") }
    ]);

    await acknowledgeAnnouncement(prisma as never, seller, "ann-1");

    expect(prisma.user.findMany).toHaveBeenNthCalledWith(2, expect.objectContaining({
      where: expect.objectContaining({
        organizationId: "org-1",
        active: true,
        OR: [{ role: { in: ["ADMIN", "GESTOR"] } }]
      })
    }));
    expect(prisma.inAppNotification.upsert).toHaveBeenCalledTimes(2);
    expect(prisma.inAppNotification.upsert).toHaveBeenCalledWith(expect.objectContaining({
      create: expect.objectContaining({
        type: "announcement.acknowledgement.completed",
        title: "Todos marcaram ciência",
        href: "/avisos/aviso",
        dedupeKey: expect.stringContaining("announcement:ann-1:acknowledgement:completed")
      })
    }));
  });

  it("does not repeat completion notification for an idempotent acknowledgement", async () => {
    const prisma = prismaMock();
    const acknowledgedAt = new Date("2026-07-16T10:00:00.000Z");
    prisma.announcement.findFirst.mockResolvedValueOnce({
      id: "ann-1",
      slug: "aviso",
      title: "Aviso",
      targetRolesJson: '["VENDEDOR"]',
      status: "PUBLISHED",
      requiresAck: true,
      startsAt: null,
      expiresAt: null
    });
    prisma.announcementReadReceipt.findUnique.mockResolvedValueOnce({ acknowledgedAt });

    await acknowledgeAnnouncement(prisma as never, seller, "ann-1");

    expect(prisma.announcementReadReceipt.upsert).toHaveBeenCalledWith(expect.objectContaining({ update: {} }));
    expect(prisma.announcementReadReceipt.findMany).not.toHaveBeenCalled();
    expect(prisma.inAppNotification.upsert).not.toHaveBeenCalled();
  });

  it("does not notify managers while acknowledgement remains pending", async () => {
    const prisma = prismaMock();
    prisma.announcement.findFirst.mockResolvedValueOnce({
      id: "ann-1",
      slug: "aviso",
      title: "Aviso",
      targetRolesJson: '["VENDEDOR"]',
      status: "PUBLISHED",
      requiresAck: true,
      startsAt: null,
      expiresAt: null
    });
    prisma.user.findMany.mockResolvedValueOnce([
      { id: "seller-1", name: "Seller", email: "seller@example.com", role: "VENDEDOR" },
      { id: "seller-2", name: "Other", email: "other@example.com", role: "VENDEDOR" }
    ]);
    prisma.announcementReadReceipt.findMany.mockResolvedValueOnce([
      { announcementId: "ann-1", userId: "seller-1", acknowledgedAt: new Date("2026-07-16T10:00:00.000Z") }
    ]);

    await acknowledgeAnnouncement(prisma as never, seller, "ann-1");

    expect(prisma.inAppNotification.upsert).not.toHaveBeenCalled();
  });

  it("does not notify managers when the targeted audience is empty", async () => {
    const prisma = prismaMock();
    const sacActor: CurrentUser = { ...seller, id: "sac-1", role: "SAC" };
    prisma.announcement.findFirst.mockResolvedValueOnce({
      id: "ann-1",
      slug: "aviso",
      title: "Aviso",
      targetRolesJson: '["SAC"]',
      status: "PUBLISHED",
      requiresAck: true,
      startsAt: null,
      expiresAt: null
    });
    prisma.user.findMany.mockResolvedValueOnce([]);

    await acknowledgeAnnouncement(prisma as never, sacActor, "ann-1");

    expect(prisma.announcementReadReceipt.upsert).toHaveBeenCalled();
    expect(prisma.inAppNotification.upsert).not.toHaveBeenCalled();
  });

  it("limits nominal read receipts to the current non-manager user", async () => {
    const prisma = prismaMock();
    prisma.announcement.findFirst.mockResolvedValueOnce({
      id: "ann-1",
      slug: "aviso",
      title: "Aviso",
      tagsJson: "[]",
      linksJson: "[]",
      targetRolesJson: '["VENDEDOR"]',
      status: "PUBLISHED",
      requiresAck: true,
      startsAt: null,
      expiresAt: null,
      readReceipts: []
    });

    await getAnnouncementBySlug(prisma as never, seller, "aviso");

    expect(prisma.announcement.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      include: expect.objectContaining({ readReceipts: expect.objectContaining({ where: { userId: "seller-1" } }) })
    }));
  });
});
