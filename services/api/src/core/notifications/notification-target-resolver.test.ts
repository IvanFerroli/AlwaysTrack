import { describe, expect, it, vi } from "vitest";
import type { CurrentUser } from "@alwaystrack/shared";
import { resolveInAppNotificationTarget } from "./notification-target-resolver.js";

const admin: CurrentUser = {
  id: "admin-1",
  name: "Admin",
  email: "admin@example.com",
  role: "ADMIN",
  organizationId: "org-1",
  unitScopeIds: [],
  sectorScopeIds: []
};

function storedNotification(overrides: Record<string, unknown> = {}) {
  return {
    type: "announcement.published",
    entityType: "Announcement",
    entityId: "announcement-1",
    href: "/avisos/slug-antigo?private=1",
    targetType: "ANNOUNCEMENT",
    targetParamsJson: JSON.stringify({ announcementId: "announcement-1", slug: "slug-antigo", private: "do-not-return" }),
    ...overrides
  };
}

describe("notification target resolver", () => {
  it("validates notification tenant and recipient before resolving any target", async () => {
    const prisma = {
      inAppNotification: { findFirst: vi.fn().mockResolvedValue(null) },
      announcement: { findFirst: vi.fn() }
    };

    const result = await resolveInAppNotificationTarget(prisma as never, admin, "notification-other-tenant");

    expect(prisma.inAppNotification.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "notification-other-tenant", organizationId: "org-1", recipientId: "admin-1" }
    }));
    expect(prisma.announcement.findFirst).not.toHaveBeenCalled();
    expect(result).toEqual({
      target: { type: null, status: "FORBIDDEN_OR_MISSING", params: {}, href: null, fallbackHref: null }
    });
  });

  it("returns the same sanitized status for a cross-tenant or missing entity", async () => {
    const prisma = {
      inAppNotification: { findFirst: vi.fn().mockResolvedValue(storedNotification()) },
      announcement: { findFirst: vi.fn().mockResolvedValue(null) }
    };

    const result = await resolveInAppNotificationTarget(prisma as never, admin, "notification-1");

    expect(prisma.announcement.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "announcement-1", organizationId: "org-1" }
    }));
    expect(result).toEqual({
      target: { type: "ANNOUNCEMENT", status: "FORBIDDEN_OR_MISSING", params: {}, href: null, fallbackHref: null }
    });
    expect(JSON.stringify(result)).not.toContain("announcement-1");
    expect(JSON.stringify(result)).not.toContain("slug-antigo");
  });

  it("rebuilds an available canonical href from the current entity slug", async () => {
    const prisma = {
      inAppNotification: { findFirst: vi.fn().mockResolvedValue(storedNotification()) },
      announcement: {
        findFirst: vi.fn().mockResolvedValue({
          id: "announcement-1",
          slug: "slug-atual",
          status: "PUBLISHED",
          archivedAt: null,
          startsAt: null,
          expiresAt: null,
          targetRolesJson: JSON.stringify(["ADMIN"])
        })
      }
    };

    await expect(resolveInAppNotificationTarget(prisma as never, admin, "notification-1")).resolves.toEqual({
      target: {
        type: "ANNOUNCEMENT",
        status: "AVAILABLE",
        params: { announcementId: "announcement-1", slug: "slug-atual" },
        href: "/avisos/slug-atual",
        fallbackHref: "/avisos"
      }
    });
  });

  it("only reports ARCHIVED after finding a known archived entity", async () => {
    const prisma = {
      inAppNotification: { findFirst: vi.fn().mockResolvedValue(storedNotification()) },
      announcement: {
        findFirst: vi.fn().mockResolvedValue({
          id: "announcement-1",
          slug: "slug-atual",
          status: "ARCHIVED",
          archivedAt: new Date("2026-07-18T00:00:00.000Z"),
          startsAt: null,
          expiresAt: null,
          targetRolesJson: JSON.stringify(["ADMIN"])
        })
      }
    };

    const result = await resolveInAppNotificationTarget(prisma as never, admin, "notification-1");

    expect(result).toEqual({
      target: {
        type: "ANNOUNCEMENT",
        status: "ARCHIVED",
        params: { announcementId: "announcement-1", slug: "slug-atual" },
        href: null,
        fallbackHref: "/avisos"
      }
    });
  });

  it.each([
    ["DRAFT", null],
    ["SCHEDULED", new Date("2099-07-18T12:00:00.000Z")],
    ["PUBLISHED", new Date("2099-07-18T12:00:00.000Z")]
  ] as const)("fails closed for a non-manager announcement in %s state", async (status, startsAt) => {
    const seller = { ...admin, id: "seller-1", role: "VENDEDOR" as const };
    const prisma = {
      inAppNotification: { findFirst: vi.fn().mockResolvedValue(storedNotification()) },
      announcement: {
        findFirst: vi.fn().mockResolvedValue({
          id: "announcement-1",
          slug: "nao-publico",
          status,
          archivedAt: null,
          startsAt,
          expiresAt: null,
          targetRolesJson: JSON.stringify(["VENDEDOR"])
        })
      }
    };

    const result = await resolveInAppNotificationTarget(prisma as never, seller, "notification-1");

    expect(result.target).toEqual({ type: "ANNOUNCEMENT", status: "FORBIDDEN_OR_MISSING", params: {}, href: null, fallbackHref: null });
    expect(JSON.stringify(result)).not.toContain("announcement-1");
    expect(JSON.stringify(result)).not.toContain("nao-publico");
  });

  it("returns an expired published announcement as known ARCHIVED for its audience", async () => {
    const seller = { ...admin, id: "seller-1", role: "VENDEDOR" as const };
    const prisma = {
      inAppNotification: { findFirst: vi.fn().mockResolvedValue(storedNotification()) },
      announcement: {
        findFirst: vi.fn().mockResolvedValue({
          id: "announcement-1",
          slug: "aviso-expirado",
          status: "PUBLISHED",
          archivedAt: null,
          startsAt: new Date("2020-07-17T12:00:00.000Z"),
          expiresAt: new Date("2020-07-18T12:00:00.000Z"),
          targetRolesJson: JSON.stringify(["VENDEDOR"])
        })
      }
    };

    await expect(resolveInAppNotificationTarget(prisma as never, seller, "notification-1")).resolves.toMatchObject({
      target: { type: "ANNOUNCEMENT", status: "ARCHIVED", href: null, fallbackHref: "/avisos" }
    });
  });

  it("uses the related pause slot id instead of the booking id", async () => {
    const prisma = {
      inAppNotification: {
        findFirst: vi.fn().mockResolvedValue(storedNotification({
          type: "support_pause.booking.updated",
          entityType: "SupportPauseBooking",
          entityId: "booking-1",
          href: "/pausas?bookingId=booking-1&slotId=legacy-wrong",
          targetType: "SUPPORT_PAUSE",
          targetParamsJson: JSON.stringify({ bookingId: "booking-1", slotId: "legacy-wrong" })
        }))
      },
      supportPauseBooking: {
        findFirst: vi.fn().mockResolvedValue({
          id: "booking-1",
          userId: "sac-1",
          status: "BOOKED",
          slot: { id: "slot-real", teamId: "team-1", startsAt: new Date("2026-07-18T15:00:00.000Z") }
        })
      }
    };

    const result = await resolveInAppNotificationTarget(prisma as never, admin, "notification-1");

    expect(prisma.supportPauseBooking.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      select: expect.objectContaining({ slot: { select: expect.objectContaining({ id: true }) } })
    }));
    expect(result.target).toMatchObject({
      type: "SUPPORT_PAUSE",
      status: "AVAILABLE",
      params: { bookingId: "booking-1", slotId: "slot-real", teamId: "team-1", date: "2026-07-18" },
      href: "/pausas?date=2026-07-18&teamId=team-1&slotId=slot-real&bookingId=booking-1"
    });
  });

  it("denies a typed support target before lookup when the actor role lacks access", async () => {
    const seller = { ...admin, id: "seller-1", role: "VENDEDOR" as const };
    const prisma = {
      inAppNotification: {
        findFirst: vi.fn().mockResolvedValue(storedNotification({
          type: "support_schedule.offer.received",
          entityType: "SupportShiftOffer",
          entityId: "offer-private",
          href: "/escalas?offerId=offer-private",
          targetType: "SUPPORT_SCHEDULE",
          targetParamsJson: JSON.stringify({ offerId: "offer-private" })
        }))
      },
      supportShiftOffer: { findFirst: vi.fn() }
    };

    const result = await resolveInAppNotificationTarget(prisma as never, seller, "notification-1");

    expect(prisma.supportShiftOffer.findFirst).not.toHaveBeenCalled();
    expect(result.target).toEqual({ type: "SUPPORT_SCHEDULE", status: "FORBIDDEN_OR_MISSING", params: {}, href: null, fallbackHref: null });
    expect(JSON.stringify(result)).not.toContain("offer-private");
  });

  it("recalculates SAC team scope before returning a support target", async () => {
    const sac = { ...admin, id: "sac-1", role: "SAC" as const };
    const prisma = {
      inAppNotification: {
        findFirst: vi.fn().mockResolvedValue(storedNotification({
          type: "support_schedule.offer.received",
          entityType: "SupportShiftOffer",
          entityId: "offer-outside-scope",
          href: "/escalas?offerId=offer-outside-scope",
          targetType: "SUPPORT_SCHEDULE",
          targetParamsJson: JSON.stringify({ offerId: "offer-outside-scope" })
        }))
      },
      supportShiftOffer: {
        findFirst: vi.fn().mockResolvedValue({
          id: "offer-outside-scope",
          teamId: "team-other",
          offeredById: "sac-other-1",
          targetUserId: "sac-other-2",
          status: "OPEN",
          occurrence: { localDate: "2026-07-18", startsAt: new Date("2026-07-18T12:00:00.000Z") }
        })
      },
      supportTeamMembership: { findFirst: vi.fn().mockResolvedValue(null) }
    };

    const result = await resolveInAppNotificationTarget(prisma as never, sac, "notification-1");

    expect(prisma.supportTeamMembership.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ organizationId: "org-1", teamId: "team-other", userId: "sac-1" })
    }));
    expect(result.target).toEqual({ type: "SUPPORT_SCHEDULE", status: "FORBIDDEN_OR_MISSING", params: {}, href: null, fallbackHref: null });
    expect(JSON.stringify(result)).not.toContain("offer-outside-scope");
  });
});
