import type { PrismaClient } from "@prisma/client";
import type { CurrentUser } from "@alwaystrack/shared";
import { describe, expect, it, vi } from "vitest";
import {
  createFutureAnnouncementSeriesVersion,
  materializeAnnouncementOccurrences
} from "./announcement-series.service.js";

const manager: CurrentUser = {
  id: "manager-1",
  organizationId: "org-1",
  name: "Manager",
  email: "manager@example.com",
  role: "ADMIN",
  unitScopeIds: [],
  sectorScopeIds: []
};

function version(overrides: Record<string, unknown> = {}) {
  return {
    id: "version-1",
    organizationId: "org-1",
    seriesId: "series-1",
    version: 1,
    effectiveFromDate: "2026-01-01",
    validFromDate: "2026-01-01",
    validToDate: null,
    recurrenceType: "MONTHLY_DAYS",
    timezone: "America/Sao_Paulo",
    localTime: "09:30",
    recurrenceDaysJson: "[14,29]",
    missingDayPolicy: "SKIP",
    durationMinutes: 1440,
    title: "Aviso recorrente",
    summary: "Resumo",
    content: "Conteudo",
    tagsJson: "[]",
    linksJson: "[]",
    targetRolesJson: "[\"ADMIN\"]",
    priority: "NORMAL",
    pinned: false,
    requiresAck: false,
    createdById: manager.id,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides
  };
}

function materializerPrisma(selectedVersionId = "version-1") {
  const scheduleVersion = version();
  const series = {
    id: "series-1",
    organizationId: "org-1",
    slug: "aviso-recorrente",
    status: "ACTIVE",
    archivedAt: null,
    createdById: manager.id,
    updatedById: manager.id,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    versions: [scheduleVersion]
  };
  const announcements: Array<Record<string, any>> = [];
  const occurrences: Array<Record<string, any>> = [];
  const notifications: Array<Record<string, any>> = [];
  let announcementSequence = 0;
  let occurrenceSequence = 0;

  const fake: Record<string, any> = {};
  fake.announcementSeries = {
    findMany: vi.fn(async () => [series])
  };
  fake.announcementSeriesVersion = {
    findFirst: vi.fn(async () => ({ ...scheduleVersion, id: selectedVersionId }))
  };
  fake.announcement = {
    create: vi.fn(async ({ data }) => {
      const item = {
        id: `announcement-${++announcementSequence}`,
        publishedAt: null,
        archivedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...data
      };
      announcements.push(item);
      return item;
    }),
    update: vi.fn(async ({ where, data }) => {
      const item = announcements.find((candidate) => candidate.id === where.id);
      if (!item) throw new Error("announcement not found");
      Object.assign(item, data, { updatedAt: new Date() });
      return item;
    })
  };
  fake.announcementOccurrence = {
    findUnique: vi.fn(async ({ where }) => occurrences.find((item) => item.idempotencyKey === where.idempotencyKey) ?? null),
    create: vi.fn(async ({ data }) => {
      const item = {
        id: `occurrence-${++occurrenceSequence}`,
        status: "SCHEDULED",
        materializedAt: new Date(),
        lastAttemptAt: null,
        publishedAt: null,
        cancelledAt: null,
        cancelledById: null,
        cancellationReason: null,
        failureMessage: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...data
      };
      occurrences.push(item);
      return item;
    }),
    findMany: vi.fn(async ({ where }) => {
      const matches = occurrences.filter(
        (item) =>
          where.status.in.includes(item.status) &&
          item.cancelledAt === null &&
          (!where.scheduledFor || item.scheduledFor <= where.scheduledFor.lte) &&
          (!where.expiresAt?.lte || item.expiresAt <= where.expiresAt.lte) &&
          (!where.expiresAt?.gt || item.expiresAt > where.expiresAt.gt) &&
          item.announcementId !== null
      );
      if (where.expiresAt?.lte) return matches;
      return matches.map((item) => ({
        ...item,
        announcement: announcements.find((announcement) => announcement.id === item.announcementId) ?? null,
        version: scheduleVersion
      }));
    }),
    updateMany: vi.fn(async ({ where, data }) => {
      const item = occurrences.find((candidate) => candidate.id === where.id);
      if (
        !item ||
        !where.status.in.includes(item.status) ||
        item.cancelledAt !== null ||
        (where.scheduledFor && item.scheduledFor > where.scheduledFor.lte) ||
        (where.expiresAt?.lte && item.expiresAt > where.expiresAt.lte) ||
        (where.expiresAt?.gt && item.expiresAt <= where.expiresAt.gt)
      ) {
        return { count: 0 };
      }
      Object.assign(item, data, { updatedAt: new Date() });
      return { count: 1 };
    }),
    update: vi.fn(async ({ where, data }) => {
      const item = occurrences.find((candidate) => candidate.id === where.id);
      if (!item) throw new Error("occurrence not found");
      Object.assign(item, data, { updatedAt: new Date() });
      return item;
    })
  };
  fake.user = { findMany: vi.fn(async () => [{ id: "recipient-1" }]) };
  fake.inAppNotification = {
    upsert: vi.fn(async ({ where, create, update }) => {
      const key = where.organizationId_recipientId_dedupeKey.dedupeKey;
      const existing = notifications.find((item) => item.dedupeKey === key);
      if (existing) {
        Object.assign(existing, update);
        return existing;
      }
      const item = { id: `notification-${notifications.length + 1}`, ...create };
      notifications.push(item);
      return item;
    })
  };
  fake.auditLog = { create: vi.fn(async ({ data }) => ({ id: `audit-${Math.random()}`, ...data })) };
  fake.$transaction = vi.fn(async (callback) => callback(fake));

  return { prisma: fake as PrismaClient, announcements, occurrences, notifications };
}

describe("announcement occurrence materializer", () => {
  it("does not notify before local time and remains idempotent across repeated executions", async () => {
    const state = materializerPrisma();
    const common = { organizationId: "org-1", fromDate: "2026-07-14", toDate: "2026-07-14" };

    const before = await materializeAnnouncementOccurrences(state.prisma, {
      ...common,
      now: new Date("2026-07-14T12:29:00.000Z")
    });
    expect(before.created).toHaveLength(1);
    expect(before.publication.published).toHaveLength(0);
    expect(state.notifications).toHaveLength(0);

    const onTime = await materializeAnnouncementOccurrences(state.prisma, {
      ...common,
      now: new Date("2026-07-14T12:30:00.000Z")
    });
    expect(onTime.created).toHaveLength(0);
    expect(onTime.skipped).toHaveLength(1);
    expect(onTime.publication.published).toEqual(["occurrence-1"]);
    expect(state.announcements).toHaveLength(1);
    expect(state.occurrences).toHaveLength(1);
    expect(state.notifications).toHaveLength(1);

    const repeated = await materializeAnnouncementOccurrences(state.prisma, {
      ...common,
      now: new Date("2026-07-14T12:31:00.000Z")
    });
    expect(repeated.skipped).toHaveLength(1);
    expect(repeated.publication.due).toBe(0);
    expect(state.notifications).toHaveLength(1);

    const elapsed = await materializeAnnouncementOccurrences(state.prisma, {
      ...common,
      now: new Date("2026-07-15T12:30:00.000Z")
    });
    expect(elapsed.expiration.expired).toEqual(["occurrence-1"]);
    expect(state.occurrences[0].status).toBe("EXPIRED");
    expect(state.notifications).toHaveLength(1);
  });

  it("drops a stale candidate when a future edit wins before the materialization transaction", async () => {
    const state = materializerPrisma("version-2");
    const result = await materializeAnnouncementOccurrences(state.prisma, {
      organizationId: "org-1",
      fromDate: "2026-07-14",
      toDate: "2026-07-14",
      publishDue: false,
      now: new Date("2026-07-01T12:00:00.000Z")
    });

    expect(result.staleCandidates).toEqual([{ seriesId: "series-1", versionId: "version-1", localDate: "2026-07-14" }]);
    expect(state.announcements).toHaveLength(0);
    expect(state.occurrences).toHaveLength(0);
  });
});

describe("future announcement series edits", () => {
  function futureEditPrisma() {
    const previous = version();
    const superseded = {
      id: "occurrence-future",
      localDate: "2026-08-14",
      versionId: previous.id,
      announcementId: "announcement-future"
    };
    const fake: Record<string, any> = {};
    fake.announcementSeries = {
      findFirst: vi.fn(async () => ({ id: "series-1", organizationId: "org-1", status: "ACTIVE", versions: [previous] })),
      update: vi.fn(async ({ data }) => ({ id: "series-1", ...data }))
    };
    fake.announcementSeriesVersion = {
      create: vi.fn(async ({ data }) => ({ id: "version-2", createdAt: new Date(), ...data }))
    };
    fake.announcementOccurrence = {
      findMany: vi.fn(async () => [superseded]),
      updateMany: vi.fn(async () => ({ count: 1 }))
    };
    fake.announcement = { updateMany: vi.fn(async () => ({ count: 1 })) };
    fake.auditLog = { create: vi.fn(async ({ data }) => ({ id: `audit-${Math.random()}`, ...data })) };
    fake.$transaction = vi.fn(async (callback) => callback(fake));
    return fake as PrismaClient;
  }

  it("creates an immutable next version and audits cancellation of superseded future occurrences", async () => {
    const prisma = futureEditPrisma();
    const result = await createFutureAnnouncementSeriesVersion(
      prisma,
      manager,
      "series-1",
      { effectiveFromDate: "2026-08-01", title: "Conteudo revisado" },
      new Date("2026-07-17T12:00:00.000Z")
    );

    expect(result.version).toMatchObject({ version: 2, effectiveFromDate: "2026-08-01", title: "Conteudo revisado" });
    expect(result.changedFields).toEqual(expect.arrayContaining(["effectiveFromDate", "title"]));
    expect(result.supersededOccurrences).toBe(1);
    expect(prisma.announcementOccurrence.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "CANCELLED", cancellationReason: "SUPERSEDED_BY_VERSION:2" })
      })
    );
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: "announcement-occurrence.cancel" }) })
    );
  });

  it("rejects a version whose effective date is not strictly in the future", async () => {
    await expect(
      createFutureAnnouncementSeriesVersion(
        futureEditPrisma(),
        manager,
        "series-1",
        { effectiveFromDate: "2026-07-17", title: "Nao pode" },
        new Date("2026-07-17T12:00:00.000Z")
      )
    ).rejects.toMatchObject({ code: "INVALID_INPUT" });
  });
});
