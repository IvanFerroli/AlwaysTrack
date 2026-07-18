import { afterEach, describe, expect, it, vi } from "vitest";
import type { CurrentUser } from "@alwaystrack/shared";
import {
  SupportSchedulingError,
  acceptSupportShiftOffer,
  addSupportLocalDays,
  archiveSupportScheduleRuleDraft,
  archiveSupportScheduleRuleVersion,
  assignSupportShiftPattern,
  calculatePublishedOccurrenceCoverage,
  cancelSupportShiftOffer,
  checksumSupportScheduleRulePayload,
  claimSupportExtraShiftSlot,
  createSupportExtraShiftSlot,
  createSupportScheduleRuleDraft,
  createSupportScheduleRuleVersion,
  createSupportShiftOffer,
  createSupportShiftPatternVersion,
  decideSupportExtraShiftClaim,
  decideSupportShiftOffer,
  findPublishedOccurrenceCoveringInterval,
  isValidSupportLocalDate,
  listSupportScheduleCalendar,
  listSupportSchedulePlanning,
  materializeSupportShiftOccurrences,
  normalizeSupportScheduleRulePayload,
  previewSupportScheduleRuleDraft,
  publishSupportScheduleRuleDraft,
  stableSupportScheduleRuleJson,
  supportWorkloadViolations,
  supportZonedDateTimeToUtc,
  updateSupportScheduleRuleDraft,
} from "./support-scheduling.service.js";

const admin: CurrentUser = {
  id: "admin-1",
  name: "Admin",
  email: "admin@example.com",
  role: "ADMIN",
  organizationId: "org-1",
  unitScopeIds: [],
  sectorScopeIds: [],
};

const sac: CurrentUser = {
  ...admin,
  id: "sac-1",
  name: "SAC 1",
  email: "sac1@example.com",
  role: "SAC",
};
const sac2: CurrentUser = {
  ...sac,
  id: "sac-2",
  name: "SAC 2",
  email: "sac2@example.com",
};

function rule(overrides: Record<string, unknown> = {}) {
  return {
    id: "rule-1",
    organizationId: "org-1",
    teamId: "team-1",
    version: 1,
    timezone: "America/Sao_Paulo",
    maxDailyMinutes: 840,
    maxWeeklyMinutes: 3600,
    minimumRestMinutes: 600,
    minimumNoticeMinutes: 60,
    maxMonthlyExchanges: 8,
    autoApproveEligibleSwaps: true,
    requireManagerExtraApproval: true,
    active: true,
    effectiveFrom: new Date("2090-01-01T00:00:00.000Z"),
    effectiveTo: null,
    sourceDraftId: null,
    normalizedPayloadJson: null,
    checksum: null,
    archivedAt: null,
    createdById: "admin-1",
    createdAt: new Date("2090-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

function draft(overrides: Record<string, unknown> = {}) {
  const value = {
    id: "draft-1",
    organizationId: "org-1",
    teamId: "team-1",
    status: "DRAFT",
    revision: 1,
    baseVersionId: null,
    timezone: "America/Sao_Paulo",
    maxDailyMinutes: 840,
    maxWeeklyMinutes: 3600,
    minimumRestMinutes: 600,
    minimumNoticeMinutes: 60,
    maxMonthlyExchanges: 8,
    autoApproveEligibleSwaps: true,
    requireManagerExtraApproval: true,
    effectiveFrom: new Date("2099-02-01T00:00:00.000Z"),
    effectiveTo: null,
    createdById: "admin-1",
    updatedById: "admin-1",
    publishedVersionId: null,
    archivedAt: null,
    archivedById: null,
    createdAt: new Date("2099-01-01T00:00:00.000Z"),
    updatedAt: new Date("2099-01-01T00:00:00.000Z"),
    ...overrides,
  };
  const payload = normalizeSupportScheduleRulePayload(value as never);
  return {
    ...value,
    normalizedPayloadJson: stableSupportScheduleRuleJson(payload),
    checksum: checksumSupportScheduleRulePayload(payload),
    ...overrides,
  };
}

function auditMock() {
  return { create: vi.fn().mockResolvedValue({ id: "audit-1" }) };
}

function transactionClient<T extends Record<string, unknown>>(tx: T) {
  return {
    ...tx,
    $transaction: vi.fn((work: (client: T) => Promise<unknown>) => work(tx)),
  };
}

afterEach(() => {
  vi.useRealTimers();
});

describe("support scheduling date and coverage helpers", () => {
  it("validates February exactly and advances across leap day", () => {
    expect(isValidSupportLocalDate("2028-02-29")).toBe(true);
    expect(isValidSupportLocalDate("2027-02-29")).toBe(false);
    expect(isValidSupportLocalDate("2028-02-30")).toBe(false);
    expect(addSupportLocalDays("2028-02-28", 1)).toBe("2028-02-29");
    expect(addSupportLocalDays("2028-02-29", 1)).toBe("2028-03-01");
  });

  it("converts IANA local time with Intl and rejects a missing DST minute", () => {
    expect(
      supportZonedDateTimeToUtc(
        "2028-02-29",
        8 * 60,
        "America/Sao_Paulo",
      ).toISOString(),
    ).toBe("2028-02-29T11:00:00.000Z");
    expect(() =>
      supportZonedDateTimeToUtc("2026-03-08", 2 * 60 + 30, "America/New_York"),
    ).toThrow(
      new SupportSchedulingError("INVALID_INPUT", ["NON_EXISTENT_LOCAL_TIME"]),
    );
  });

  it("counts each published operator once only when the occurrence covers the full interval", () => {
    const startsAt = new Date("2028-02-29T14:00:00.000Z");
    const endsAt = new Date("2028-02-29T15:00:00.000Z");
    const coverage = calculatePublishedOccurrenceCoverage(
      [
        {
          id: "o1",
          userId: "u1",
          localDate: "2028-02-29",
          startsAt: new Date("2028-02-29T12:00:00.000Z"),
          endsAt: new Date("2028-02-29T18:00:00.000Z"),
          status: "PUBLISHED",
        },
        {
          id: "o2",
          userId: "u1",
          localDate: "2028-02-29",
          startsAt: new Date("2028-02-29T13:00:00.000Z"),
          endsAt: new Date("2028-02-29T17:00:00.000Z"),
          status: "PUBLISHED",
        },
        {
          id: "o3",
          userId: "u2",
          localDate: "2028-02-29",
          startsAt: new Date("2028-02-29T14:30:00.000Z"),
          endsAt: new Date("2028-02-29T18:00:00.000Z"),
          status: "PUBLISHED",
        },
        {
          id: "o4",
          userId: "u3",
          localDate: "2028-02-29",
          startsAt: new Date("2028-02-29T12:00:00.000Z"),
          endsAt: new Date("2028-02-29T18:00:00.000Z"),
          status: "CANCELLED",
        },
      ],
      startsAt,
      endsAt,
    );

    expect(coverage).toEqual({
      count: 1,
      userIds: ["u1"],
      occurrenceIds: ["o1", "o2"],
    });
  });

  it("queries a fully covering published occurrence with tenant and optional team", async () => {
    const findFirst = vi.fn().mockResolvedValue({ id: "occurrence-1" });
    const result = await findPublishedOccurrenceCoveringInterval(
      { supportShiftOccurrence: { findFirst } } as never,
      {
        organizationId: "org-1",
        teamId: "team-1",
        userId: "sac-1",
        startsAt: new Date("2028-02-29T14:00:00.000Z"),
        endsAt: new Date("2028-02-29T15:00:00.000Z"),
      },
    );

    expect(result).toEqual({ id: "occurrence-1" });
    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          organizationId: "org-1",
          teamId: "team-1",
          userId: "sac-1",
          status: "PUBLISHED",
          startsAt: { lte: new Date("2028-02-29T14:00:00.000Z") },
          endsAt: { gte: new Date("2028-02-29T15:00:00.000Z") },
        }),
      }),
    );
  });
});

describe("support scheduling workload rules", () => {
  const baseRule = {
    maxDailyMinutes: 840,
    maxWeeklyMinutes: 3600,
    minimumRestMinutes: 600,
    minimumNoticeMinutes: 60,
  };

  it("reports overlap, daily load, rest and notice deterministically", () => {
    const existing = [
      {
        id: "regular",
        userId: "sac-1",
        localDate: "2028-02-29",
        startsAt: new Date("2028-02-29T11:00:00.000Z"),
        endsAt: new Date("2028-02-29T17:00:00.000Z"),
      },
    ];
    const proposed = [
      {
        userId: "sac-1",
        localDate: "2028-02-29",
        startsAt: new Date("2028-02-29T16:00:00.000Z"),
        endsAt: new Date("2028-03-01T02:00:00.000Z"),
      },
    ];

    expect(
      supportWorkloadViolations(existing, proposed, baseRule, {
        now: new Date("2028-02-29T15:30:00.000Z"),
      }),
    ).toEqual(["MAX_DAILY_MINUTES", "MINIMUM_NOTICE", "OVERLAPPING_SHIFT"]);
  });

  it("enforces weekly load and rest around an additional interval", () => {
    const existing = Array.from({ length: 6 }, (_, index) => ({
      id: `day-${index}`,
      userId: "sac-1",
      localDate: addSupportLocalDays("2028-02-28", index),
      startsAt: new Date(Date.UTC(2028, 1, 28 + index, 8)),
      endsAt: new Date(Date.UTC(2028, 1, 28 + index, 18)),
    }));
    const proposed = [
      {
        userId: "sac-1",
        localDate: "2028-03-05",
        startsAt: new Date("2028-03-05T20:00:00.000Z"),
        endsAt: new Date("2028-03-05T22:00:00.000Z"),
      },
    ];

    expect(
      supportWorkloadViolations(existing, proposed, baseRule, {
        now: new Date("2028-01-01T00:00:00.000Z"),
        enforceNotice: false,
      }),
    ).toEqual(["MAX_WEEKLY_MINUTES"]);
  });

  it("never combines load or rest windows from different operators", () => {
    const intervals = [
      {
        userId: "sac-1",
        localDate: "2028-02-29",
        startsAt: new Date("2028-02-29T08:00:00.000Z"),
        endsAt: new Date("2028-02-29T14:00:00.000Z"),
      },
      {
        userId: "sac-2",
        localDate: "2028-02-29",
        startsAt: new Date("2028-02-29T08:00:00.000Z"),
        endsAt: new Date("2028-02-29T14:00:00.000Z"),
      },
    ];

    expect(
      supportWorkloadViolations([], intervals, baseRule, {
        now: new Date("2028-01-01T00:00:00.000Z"),
      }),
    ).toEqual([]);
  });
});

describe("support schedule scope and versioning", () => {
  function calendarAssignment(
    options: {
      weekdays?: number[];
      assignment?: Record<string, unknown>;
      pattern?: Record<string, unknown>;
    } = {},
  ) {
    const pattern = {
      id: "pattern-calendar-1",
      organizationId: "org-1",
      teamId: "team-1",
      startMinute: 480,
      endMinute: 1020,
      weekdaysJson: JSON.stringify(options.weekdays ?? [1, 2, 3, 4, 5]),
      timezone: "America/Sao_Paulo",
      active: true,
      effectiveFrom: new Date("2028-01-01T00:00:00.000Z"),
      effectiveTo: null,
      ...options.pattern,
    };
    return {
      id: "assignment-calendar-1",
      organizationId: "org-1",
      teamId: "team-1",
      userId: "sac-1",
      patternVersionId: pattern.id,
      validFrom: new Date("2028-01-01T00:00:00.000Z"),
      validTo: null,
      active: true,
      ...options.assignment,
      patternVersion: pattern,
    };
  }

  function selfCalendarPrisma(
    options: {
      occurrences?: Array<Record<string, unknown>>;
      assignments?: Array<Record<string, unknown>>;
      memberships?: Array<{ teamId: string }>;
    } = {},
  ) {
    const findOccurrences = vi
      .fn()
      .mockResolvedValue(options.occurrences ?? []);
    const findAssignments = vi
      .fn()
      .mockResolvedValue(options.assignments ?? []);
    return {
      prisma: {
        supportTeamMembership: {
          findMany: vi
            .fn()
            .mockResolvedValue(options.memberships ?? [{ teamId: "team-1" }]),
        },
        supportShiftOccurrence: { findMany: findOccurrences },
        supportShiftAssignment: { findMany: findAssignments },
        supportExtraShiftSlot: { findMany: vi.fn().mockResolvedValue([]) },
        supportShiftOffer: { findMany: vi.fn().mockResolvedValue([]) },
      },
      findAssignments,
      findOccurrences,
    };
  }

  it("lists persisted planning data only inside the manager organization and team", async () => {
    const activeRule = rule();
    const pattern = {
      id: "pattern-1",
      organizationId: "org-1",
      teamId: "team-1",
      name: "Manhã",
      version: 1,
      startMinute: 480,
      endMinute: 885,
      weekdaysJson: "[1,2,3,4,5]",
      timezone: "America/Sao_Paulo",
      active: true,
      effectiveFrom: new Date("2090-01-01T00:00:00.000Z"),
      effectiveTo: null,
      createdById: "admin-1",
      createdAt: new Date("2090-01-01T00:00:00.000Z"),
    };
    const assignment = {
      id: "assignment-1",
      organizationId: "org-1",
      teamId: "team-1",
      userId: "sac-1",
      patternVersionId: "pattern-1",
      validFrom: new Date("2090-01-01T00:00:00.000Z"),
      validTo: null,
      active: true,
      user: { id: "sac-1", name: "SAC 1", email: "sac1@example.com" },
      patternVersion: pattern,
    };
    const prisma = {
      supportTeam: {
        findFirst: vi.fn().mockResolvedValue({ id: "team-1", name: "SAC" }),
      },
      supportScheduleRuleVersion: {
        findMany: vi
          .fn()
          .mockResolvedValueOnce([activeRule])
          .mockResolvedValueOnce([]),
      },
      supportScheduleRuleDraft: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      supportShiftPatternVersion: {
        findMany: vi.fn().mockResolvedValue([pattern]),
      },
      supportShiftAssignment: {
        findMany: vi.fn().mockResolvedValue([assignment]),
      },
    };

    await expect(
      listSupportSchedulePlanning(prisma as never, admin, { teamId: "team-1" }),
    ).resolves.toMatchObject({
      teamId: "team-1",
      rules: [{ id: "rule-1", snapshot: { id: "rule-1" } }],
      ruleDrafts: [],
      archivedRuleVersions: [],
      patterns: [{ id: "pattern-1", weekdays: [1, 2, 3, 4, 5] }],
      assignments: [{ id: "assignment-1", userId: "sac-1" }],
    });
    expect(prisma.supportShiftPatternVersion.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          organizationId: "org-1",
          teamId: "team-1",
          active: true,
        }),
      }),
    );
    await expect(
      listSupportSchedulePlanning({} as never, sac, { teamId: "team-1" }),
    ).rejects.toEqual(new SupportSchedulingError("FORBIDDEN"));
  });

  it("keeps SAC calendar self-scoped and limits open extras to effective memberships", async () => {
    const findOccurrences = vi.fn().mockResolvedValue([]);
    const findExtraSlots = vi.fn().mockResolvedValue([]);
    const prisma = {
      supportTeamMembership: {
        findMany: vi.fn().mockResolvedValue([{ teamId: "team-1" }]),
      },
      supportShiftOccurrence: { findMany: findOccurrences },
      supportShiftAssignment: { findMany: vi.fn().mockResolvedValue([]) },
      supportExtraShiftSlot: { findMany: findExtraSlots },
      supportShiftOffer: { findMany: vi.fn().mockResolvedValue([]) },
    };

    await expect(
      listSupportScheduleCalendar(prisma as never, sac, {
        from: "2028-02-01",
        to: "2028-02-29",
        scope: "SELF",
      }),
    ).resolves.toMatchObject({ scope: "SELF", userId: "sac-1" });
    expect(findOccurrences).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          organizationId: "org-1",
          userId: "sac-1",
          teamId: { in: ["team-1"] },
        }),
      }),
    );
    expect(findExtraSlots).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ teamId: { in: ["team-1"] } }),
      }),
    );
  });

  it("returns the golden WORKING day status for one published occurrence", async () => {
    const localDate = "2028-02-28";
    const { prisma } = selfCalendarPrisma({
      occurrences: [
        {
          id: "occurrence-regular",
          organizationId: "org-1",
          teamId: "team-1",
          userId: "sac-1",
          localDate,
          kind: "REGULAR",
          status: "PUBLISHED",
        },
      ],
    });

    const result = await listSupportScheduleCalendar(prisma as never, sac, {
      from: localDate,
      to: localDate,
      scope: "SELF",
    });

    expect(result.dayStatuses).toEqual([
      {
        localDate,
        status: "WORKING",
        occurrenceIds: ["occurrence-regular"],
      },
    ]);
  });

  it("returns the golden DOUBLE day status with every published occurrence id", async () => {
    const localDate = "2028-02-28";
    const { prisma } = selfCalendarPrisma({
      occurrences: [
        {
          id: "occurrence-regular",
          organizationId: "org-1",
          teamId: "team-1",
          userId: "sac-1",
          localDate,
          kind: "REGULAR",
          status: "PUBLISHED",
        },
        {
          id: "occurrence-double",
          organizationId: "org-1",
          teamId: "team-1",
          userId: "sac-1",
          localDate,
          kind: "DOUBLE",
          status: "PUBLISHED",
        },
      ],
    });

    const result = await listSupportScheduleCalendar(prisma as never, sac, {
      from: localDate,
      to: localDate,
      scope: "SELF",
    });

    expect(result.dayStatuses).toEqual([
      {
        localDate,
        status: "DOUBLE",
        occurrenceIds: ["occurrence-regular", "occurrence-double"],
      },
    ]);
  });

  it("returns the golden OFF status only for an effective non-working pattern weekday", async () => {
    const localDate = "2028-03-05";
    const { prisma } = selfCalendarPrisma({
      assignments: [calendarAssignment()],
    });

    const result = await listSupportScheduleCalendar(prisma as never, sac, {
      from: localDate,
      to: localDate,
      scope: "SELF",
    });

    expect(result.dayStatuses).toEqual([
      { localDate, status: "OFF", occurrenceIds: [] },
    ]);
  });

  it("returns the golden UNPUBLISHED status for missing work and missing assignment", async () => {
    const localDate = "2028-02-28";
    const withExpectedWork = selfCalendarPrisma({
      assignments: [calendarAssignment()],
    });
    const withoutAssignment = selfCalendarPrisma();

    const results = await Promise.all([
      listSupportScheduleCalendar(withExpectedWork.prisma as never, sac, {
        from: localDate,
        to: localDate,
        scope: "SELF",
      }),
      listSupportScheduleCalendar(withoutAssignment.prisma as never, sac, {
        from: localDate,
        to: localDate,
        scope: "SELF",
      }),
    ]);

    for (const result of results) {
      expect(result.dayStatuses).toEqual([
        { localDate, status: "UNPUBLISHED", occurrenceIds: [] },
      ]);
    }
  });

  it("keeps SELF day statuses tenant-scoped and excludes third-party occurrences", async () => {
    const localDate = "2028-03-05";
    const crossTenantAssignment = calendarAssignment({
      pattern: { organizationId: "org-2" },
    });
    const { prisma, findAssignments, findOccurrences } = selfCalendarPrisma({
      assignments: [crossTenantAssignment],
      occurrences: [
        {
          id: "occurrence-third-party",
          organizationId: "org-2",
          teamId: "team-1",
          userId: "sac-2",
          localDate,
          kind: "REGULAR",
          status: "PUBLISHED",
        },
      ],
    });

    const result = await listSupportScheduleCalendar(prisma as never, sac, {
      from: localDate,
      to: localDate,
      scope: "SELF",
    });

    expect(result.occurrences).toEqual([]);
    expect(result.dayStatuses).toEqual([
      { localDate, status: "UNPUBLISHED", occurrenceIds: [] },
    ]);
    expect(findOccurrences).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          organizationId: "org-1",
          userId: "sac-1",
        }),
      }),
    );
    expect(findAssignments).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          organizationId: "org-1",
          userId: "sac-1",
        }),
      }),
    );
  });

  it("keeps TEAM calendar responses backward compatible without day statuses", async () => {
    const prisma = {
      supportTeam: {
        findFirst: vi.fn().mockResolvedValue({ id: "team-1", name: "SAC" }),
      },
      supportShiftOccurrence: { findMany: vi.fn().mockResolvedValue([]) },
      supportExtraShiftSlot: { findMany: vi.fn().mockResolvedValue([]) },
      supportShiftOffer: { findMany: vi.fn().mockResolvedValue([]) },
    };

    const result = await listSupportScheduleCalendar(prisma as never, admin, {
      from: "2028-02-28",
      to: "2028-02-28",
      scope: "TEAM",
      teamId: "team-1",
      userId: "sac-1",
    });

    expect(result).not.toHaveProperty("dayStatuses");
  });

  it("rejects team scope and another operator id for SAC before querying data", async () => {
    await expect(
      listSupportScheduleCalendar({} as never, sac, {
        from: "2028-02-01",
        to: "2028-02-29",
        scope: "TEAM",
        teamId: "team-1",
      }),
    ).rejects.toEqual(new SupportSchedulingError("FORBIDDEN"));
    await expect(
      listSupportScheduleCalendar({} as never, sac, {
        from: "2028-02-01",
        to: "2028-02-29",
        scope: "SELF",
        userId: "sac-2",
      }),
    ).rejects.toEqual(new SupportSchedulingError("FORBIDDEN"));
  });

  it("creates the next immutable rule version and closes the previous window atomically", async () => {
    const previous = rule({
      id: "rule-1",
      version: 1,
      effectiveFrom: new Date("2090-01-01T00:00:00.000Z"),
    });
    const update = vi.fn().mockResolvedValue({
      ...previous,
      effectiveTo: new Date("2099-02-01T00:00:00.000Z"),
    });
    const create = vi
      .fn()
      .mockImplementation(({ data }) =>
        Promise.resolve({ id: "rule-2", createdAt: new Date(), ...data }),
      );
    let createdDraft = draft();
    const draftCreate = vi.fn().mockImplementation(({ data }) => {
      createdDraft = draft({ id: "draft-legacy", ...data });
      return Promise.resolve(createdDraft);
    });
    const draftUpdate = vi.fn().mockImplementation(({ data }) => {
      createdDraft = { ...createdDraft, ...data };
      return Promise.resolve(createdDraft);
    });
    const tx = {
      supportTeam: {
        findFirst: vi.fn().mockResolvedValue({ id: "team-1", name: "SAC" }),
      },
      supportScheduleRuleDraft: {
        create: draftCreate,
        findFirst: vi.fn().mockImplementation(() => createdDraft),
        update: draftUpdate,
      },
      supportScheduleRuleVersion: {
        findFirst: vi.fn().mockResolvedValue(previous),
        findMany: vi.fn().mockResolvedValue([previous]),
        update,
        create,
      },
      auditLog: auditMock(),
    };
    const prisma = transactionClient(tx);

    const result = await createSupportScheduleRuleVersion(
      prisma as never,
      admin,
      {
        teamId: "team-1",
        timezone: "America/Sao_Paulo",
        maxDailyMinutes: 720,
        maxWeeklyMinutes: 3000,
        minimumRestMinutes: 660,
        minimumNoticeMinutes: 120,
        maxMonthlyExchanges: 4,
        autoApproveEligibleSwaps: false,
        requireManagerExtraApproval: true,
        effectiveFrom: "2099-02-01T00:00:00.000Z",
      },
    );

    expect(result.rule).toMatchObject({
      id: "rule-2",
      version: 2,
      maxDailyMinutes: 720,
    });
    expect(result.snapshot).toMatchObject({
      id: "rule-2",
      version: 2,
      minimumNoticeMinutes: 120,
    });
    expect(update).toHaveBeenCalledWith({
      where: { id: "rule-1" },
      data: { effectiveTo: new Date("2099-02-01T00:00:00.000Z") },
    });
    expect(tx.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "support_schedule.rule_draft.published",
        }),
      }),
    );
    expect(draftCreate).toHaveBeenCalledOnce();
    expect(draftUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "PUBLISHED",
          publishedVersionId: "rule-2",
        }),
      }),
    );
  });

  it("creates a pattern version only against a matching effective timezone", async () => {
    const effectiveRule = rule({ maxDailyMinutes: 720 });
    const create = vi
      .fn()
      .mockImplementation(({ data }) =>
        Promise.resolve({ id: "pattern-1", createdAt: new Date(), ...data }),
      );
    const tx = {
      supportTeam: {
        findFirst: vi.fn().mockResolvedValue({ id: "team-1", name: "SAC" }),
      },
      supportScheduleRuleVersion: {
        findFirst: vi.fn().mockResolvedValue(effectiveRule),
      },
      supportShiftPatternVersion: {
        findFirst: vi.fn().mockResolvedValue(null),
        update: vi.fn(),
        create,
      },
      auditLog: auditMock(),
    };
    const prisma = transactionClient(tx);

    const result = await createSupportShiftPatternVersion(
      prisma as never,
      admin,
      {
        teamId: "team-1",
        name: "Manhã",
        startMinute: 8 * 60,
        endMinute: 14 * 60,
        weekdays: [5, 1, 3, 1],
        timezone: "America/Sao_Paulo",
        effectiveFrom: "2099-02-01T00:00:00.000Z",
      },
    );

    expect(result.pattern).toMatchObject({
      id: "pattern-1",
      version: 1,
      weekdaysJson: "[1,3,5]",
    });
    expect(result.weekdays).toEqual([1, 3, 5]);
  });

  it("assigns a pattern only when user, membership and validity all cover the assignment", async () => {
    const pattern = {
      id: "pattern-1",
      organizationId: "org-1",
      teamId: "team-1",
      active: true,
      effectiveFrom: new Date("2090-01-01T00:00:00.000Z"),
      effectiveTo: null,
    };
    const create = vi
      .fn()
      .mockImplementation(({ data }) =>
        Promise.resolve({ id: "assignment-1", ...data }),
      );
    const tx = {
      supportTeam: {
        findFirst: vi.fn().mockResolvedValue({ id: "team-1", name: "SAC" }),
      },
      user: {
        findFirst: vi.fn().mockResolvedValue({ id: "sac-1", name: "SAC 1" }),
      },
      supportShiftPatternVersion: {
        findFirst: vi.fn().mockResolvedValue(pattern),
      },
      supportTeamMembership: {
        findFirst: vi.fn().mockResolvedValue({
          id: "membership-1",
          validFrom: pattern.effectiveFrom,
          validTo: null,
        }),
      },
      supportShiftAssignment: {
        findFirst: vi.fn().mockResolvedValue(null),
        create,
      },
      auditLog: auditMock(),
    };
    const prisma = transactionClient(tx);

    await expect(
      assignSupportShiftPattern(prisma as never, admin, {
        teamId: "team-1",
        userId: "sac-1",
        patternVersionId: "pattern-1",
        validFrom: "2099-02-01T00:00:00.000Z",
      }),
    ).resolves.toMatchObject({
      assignment: { id: "assignment-1", userId: "sac-1" },
    });
    expect(create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        createdById: "admin-1",
        updatedById: "admin-1",
      }),
    });
  });
});

describe("support schedule rule governance", () => {
  it("normalizes stable JSON and checksum without identity metadata", () => {
    const first = draft({ id: "draft-a", updatedById: "admin-a" });
    const second = draft({ id: "draft-b", updatedById: "admin-b" });
    const firstPayload = normalizeSupportScheduleRulePayload(first as never);
    const secondPayload = normalizeSupportScheduleRulePayload(second as never);

    expect(stableSupportScheduleRuleJson(firstPayload)).toBe(
      stableSupportScheduleRuleJson({
        timezone: firstPayload.timezone,
        requireManagerExtraApproval:
          firstPayload.requireManagerExtraApproval,
        minimumRestMinutes: firstPayload.minimumRestMinutes,
        minimumNoticeMinutes: firstPayload.minimumNoticeMinutes,
        maxWeeklyMinutes: firstPayload.maxWeeklyMinutes,
        maxMonthlyExchanges: firstPayload.maxMonthlyExchanges,
        maxDailyMinutes: firstPayload.maxDailyMinutes,
        effectiveTo: firstPayload.effectiveTo,
        effectiveFrom: firstPayload.effectiveFrom,
        autoApproveEligibleSwaps: firstPayload.autoApproveEligibleSwaps,
      }),
    );
    expect(checksumSupportScheduleRulePayload(firstPayload)).toBe(
      checksumSupportScheduleRulePayload(secondPayload),
    );
    expect(checksumSupportScheduleRulePayload(firstPayload)).toMatch(
      /^[a-f0-9]{64}$/,
    );
  });

  it("creates a tenant-scoped draft and rejects a foreign base version", async () => {
    const draftCreate = vi
      .fn()
      .mockImplementation(({ data }) => Promise.resolve(draft(data)));
    const tx = {
      supportTeam: {
        findFirst: vi.fn().mockResolvedValue({ id: "team-1", name: "SAC" }),
      },
      supportScheduleRuleVersion: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
      supportScheduleRuleDraft: { create: draftCreate },
      auditLog: auditMock(),
    };
    const prisma = transactionClient(tx);

    await expect(
      createSupportScheduleRuleDraft(prisma as never, admin, {
        teamId: "team-1",
        baseVersionId: "foreign-rule",
        effectiveFrom: "2099-02-01T00:00:00.000Z",
      }),
    ).rejects.toEqual(new SupportSchedulingError("NOT_FOUND"));
    expect(tx.supportScheduleRuleVersion.findFirst).toHaveBeenCalledWith({
      where: {
        id: "foreign-rule",
        organizationId: "org-1",
        teamId: "team-1",
      },
    });
    expect(draftCreate).not.toHaveBeenCalled();
  });

  it.each([
    [
      "timezone",
      { timezone: "Mars/Olympus" },
      new SupportSchedulingError("INVALID_INPUT"),
    ],
    [
      "weekly limit",
      { maxDailyMinutes: 720, maxWeeklyMinutes: 600 },
      new SupportSchedulingError("INVALID_INPUT"),
    ],
    [
      "future effective date",
      { effectiveFrom: "2020-01-01T00:00:00.000Z" },
      new SupportSchedulingError("RULE_VIOLATION", [
        "RETROACTIVE_RULE_VERSION",
      ]),
    ],
  ])("rejects invalid draft %s", async (_name, overrides, expected) => {
    const tx = {
      supportTeam: {
        findFirst: vi.fn().mockResolvedValue({ id: "team-1", name: "SAC" }),
      },
      supportScheduleRuleDraft: { create: vi.fn() },
      auditLog: auditMock(),
    };

    await expect(
      createSupportScheduleRuleDraft(
        transactionClient(tx) as never,
        admin,
        {
          teamId: "team-1",
          effectiveFrom: "2099-02-01T00:00:00.000Z",
          ...overrides,
        },
      ),
    ).rejects.toEqual(expected);
    expect(tx.supportScheduleRuleDraft.create).not.toHaveBeenCalled();
  });

  it("rejects a stale patch before updating the draft", async () => {
    const update = vi.fn();
    const tx = {
      supportScheduleRuleDraft: {
        findFirst: vi.fn().mockResolvedValue(draft({ revision: 2 })),
        update,
      },
      auditLog: auditMock(),
    };
    const prisma = transactionClient(tx);

    await expect(
      updateSupportScheduleRuleDraft(prisma as never, admin, "draft-1", {
        expectedRevision: 1,
        maxDailyMinutes: 720,
      }),
    ).rejects.toEqual(
      new SupportSchedulingError("CONFLICT", ["STALE_REVISION"]),
    );
    expect(update).not.toHaveBeenCalled();
  });

  it("archives a draft with CAS and records the archiver", async () => {
    const current = draft();
    const update = vi.fn().mockImplementation(({ data }) =>
      Promise.resolve({
        ...current,
        ...data,
        revision: current.revision + 1,
      }),
    );
    const tx = {
      supportScheduleRuleDraft: {
        findFirst: vi.fn().mockResolvedValue(current),
        update,
      },
      auditLog: auditMock(),
    };

    await expect(
      archiveSupportScheduleRuleDraft(
        transactionClient(tx) as never,
        admin,
        current.id,
        { expectedRevision: 1 },
      ),
    ).resolves.toMatchObject({
      draft: {
        status: "ARCHIVED",
        revision: 2,
        archivedById: "admin-1",
      },
    });
  });

  it("previews with the draft override and performs no writes", async () => {
    const previewDraft = draft({ maxDailyMinutes: 60 });
    const persistedRule = rule({
      effectiveFrom: new Date("2098-01-01T00:00:00.000Z"),
    });
    const assignment = {
      id: "assignment-1",
      organizationId: "org-1",
      teamId: "team-1",
      userId: "sac-1",
      validFrom: new Date("2098-01-01T00:00:00.000Z"),
      validTo: null,
      active: true,
      patternVersion: {
        id: "pattern-1",
        active: true,
        startMinute: 8 * 60,
        endMinute: 10 * 60,
        weekdaysJson: "[0,1,2,3,4,5,6]",
        timezone: "America/Sao_Paulo",
        effectiveFrom: new Date("2098-01-01T00:00:00.000Z"),
        effectiveTo: null,
      },
      user: { id: "sac-1", active: true, role: "SAC" },
    };
    const occurrenceCreate = vi.fn();
    const auditCreate = vi.fn();
    const tx = {
      supportScheduleRuleDraft: {
        findFirst: vi.fn().mockResolvedValue(previewDraft),
      },
      supportScheduleRuleVersion: {
        findFirst: vi.fn().mockResolvedValue(persistedRule),
        findMany: vi.fn().mockResolvedValue([persistedRule]),
      },
      supportTeam: {
        findFirst: vi.fn().mockResolvedValue({ id: "team-1", name: "SAC" }),
      },
      supportShiftAssignment: {
        findMany: vi.fn().mockResolvedValue([assignment]),
      },
      supportTeamMembership: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "membership-1",
            userId: "sac-1",
            validFrom: new Date("2098-01-01T00:00:00.000Z"),
            validTo: null,
          },
        ]),
      },
      supportShiftOccurrence: {
        findMany: vi.fn().mockResolvedValue([]),
        create: occurrenceCreate,
        update: vi.fn(),
      },
      auditLog: { create: auditCreate },
    };
    const prisma = transactionClient(tx);

    const result = await previewSupportScheduleRuleDraft(
      prisma as never,
      admin,
      previewDraft.id,
      {
        expectedRevision: previewDraft.revision,
        checksum: previewDraft.checksum,
        from: "2099-02-02",
        to: "2099-02-02",
      },
    );

    expect(result.materialization).toMatchObject({
      dryRun: true,
      candidates: 0,
      conflicts: [
        expect.objectContaining({ reason: "PATTERN_RULE_MISMATCH" }),
      ],
    });
    expect(occurrenceCreate).not.toHaveBeenCalled();
    expect(auditCreate).not.toHaveBeenCalled();
  });

  it("returns the same published version on a matching retry", async () => {
    const publishedDraft = draft({
      status: "PUBLISHED",
      publishedVersionId: "rule-published",
    });
    const publishedRule = rule({
      id: "rule-published",
      sourceDraftId: "draft-1",
      checksum: publishedDraft.checksum,
    });
    const create = vi.fn();
    const tx = {
      supportScheduleRuleDraft: {
        findFirst: vi.fn().mockResolvedValue(publishedDraft),
      },
      supportScheduleRuleVersion: {
        findFirst: vi.fn().mockResolvedValue(publishedRule),
        create,
      },
      auditLog: auditMock(),
    };

    await expect(
      publishSupportScheduleRuleDraft(
        transactionClient(tx) as never,
        admin,
        publishedDraft.id,
        {
          expectedRevision: publishedDraft.revision,
          checksum: publishedDraft.checksum,
        },
      ),
    ).resolves.toMatchObject({
      idempotent: true,
      rule: { id: "rule-published" },
    });
    expect(create).not.toHaveBeenCalled();
    expect(tx.auditLog.create).not.toHaveBeenCalled();
  });

  it("rejects overlapping publication before creating a version", async () => {
    const currentDraft = draft({
      effectiveTo: new Date("2099-04-01T00:00:00.000Z"),
    });
    const previous = rule({
      id: "rule-previous",
      effectiveFrom: new Date("2098-01-01T00:00:00.000Z"),
      effectiveTo: new Date("2099-02-01T00:00:00.000Z"),
    });
    const future = rule({
      id: "rule-future",
      version: 2,
      effectiveFrom: new Date("2099-03-01T00:00:00.000Z"),
    });
    const create = vi.fn();
    const tx = {
      supportScheduleRuleDraft: {
        findFirst: vi.fn().mockResolvedValue(currentDraft),
      },
      supportScheduleRuleVersion: {
        findFirst: vi.fn().mockResolvedValue(future),
        findMany: vi.fn().mockResolvedValue([previous, future]),
        create,
      },
      auditLog: auditMock(),
    };

    await expect(
      publishSupportScheduleRuleDraft(
        transactionClient(tx) as never,
        admin,
        currentDraft.id,
        {
          expectedRevision: currentDraft.revision,
          checksum: currentDraft.checksum,
        },
      ),
    ).rejects.toEqual(
      new SupportSchedulingError("CONFLICT", [
        "OVERLAPPING_RULE_VERSION",
      ]),
    );
    expect(create).not.toHaveBeenCalled();
  });

  it("archives an unreferenced future version and reconnects its neighbors", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2099-01-01T00:00:00.000Z"));
    const previous = rule({
      id: "rule-previous",
      effectiveFrom: new Date("2098-01-01T00:00:00.000Z"),
      effectiveTo: new Date("2099-02-01T00:00:00.000Z"),
    });
    const target = rule({
      id: "rule-target",
      version: 2,
      effectiveFrom: new Date("2099-02-01T00:00:00.000Z"),
      effectiveTo: new Date("2099-03-01T00:00:00.000Z"),
    });
    const next = rule({
      id: "rule-next",
      version: 3,
      effectiveFrom: new Date("2099-03-01T00:00:00.000Z"),
    });
    const update = vi.fn().mockImplementation(({ where, data }) =>
      Promise.resolve(
        where.id === target.id ? { ...target, ...data } : { ...previous, ...data },
      ),
    );
    const tx = {
      supportScheduleRuleVersion: {
        findFirst: vi
          .fn()
          .mockResolvedValueOnce(target)
          .mockResolvedValueOnce(previous)
          .mockResolvedValueOnce(next),
        update,
      },
      supportShiftOccurrence: { count: vi.fn().mockResolvedValue(0) },
      supportShiftOffer: { count: vi.fn().mockResolvedValue(0) },
      supportExtraShiftSlot: { count: vi.fn().mockResolvedValue(0) },
      auditLog: auditMock(),
    };

    await expect(
      archiveSupportScheduleRuleVersion(
        transactionClient(tx) as never,
        admin,
        target.id,
      ),
    ).resolves.toMatchObject({ rule: { id: target.id, active: false } });
    expect(update).toHaveBeenNthCalledWith(2, {
      where: { id: previous.id },
      data: { effectiveTo: next.effectiveFrom },
    });
  });

  it("refuses to archive a future version referenced by an occurrence", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2099-01-01T00:00:00.000Z"));
    const target = rule({
      id: "rule-target",
      effectiveFrom: new Date("2099-02-01T00:00:00.000Z"),
    });
    const update = vi.fn();
    const tx = {
      supportScheduleRuleVersion: {
        findFirst: vi
          .fn()
          .mockResolvedValueOnce(target)
          .mockResolvedValue(null),
        update,
      },
      supportShiftOccurrence: { count: vi.fn().mockResolvedValue(1) },
      supportShiftOffer: { count: vi.fn().mockResolvedValue(0) },
      supportExtraShiftSlot: { count: vi.fn().mockResolvedValue(0) },
      auditLog: auditMock(),
    };

    await expect(
      archiveSupportScheduleRuleVersion(
        transactionClient(tx) as never,
        admin,
        target.id,
      ),
    ).rejects.toEqual(
      new SupportSchedulingError("CONFLICT", ["RULE_VERSION_REFERENCED"]),
    );
    expect(update).not.toHaveBeenCalled();
    expect(tx.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "support_schedule.rule_version.conflict",
          metadataJson: expect.stringContaining("RULE_VERSION_REFERENCED"),
        }),
      }),
    );
  });
});

describe("support shift materialization", () => {
  it("materializes leap-February occurrences idempotently with frozen rule snapshots", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2027-12-01T12:00:00.000Z"));
    const occurrences: Array<Record<string, unknown>> = [];
    const effectiveRule = rule({
      effectiveFrom: new Date("2027-01-01T00:00:00.000Z"),
      minimumRestMinutes: 0,
    });
    const assignment = {
      id: "assignment-1",
      organizationId: "org-1",
      teamId: "team-1",
      userId: "sac-1",
      validFrom: new Date("2027-01-01T00:00:00.000Z"),
      validTo: null,
      active: true,
      patternVersion: {
        id: "pattern-1",
        active: true,
        startMinute: 8 * 60,
        endMinute: 14 * 60,
        weekdaysJson: "[1,2]",
        timezone: "America/Sao_Paulo",
        effectiveFrom: new Date("2027-01-01T00:00:00.000Z"),
        effectiveTo: null,
      },
      user: { id: "sac-1", active: true, role: "SAC" },
    };
    const occurrenceCreate = vi.fn().mockImplementation(({ data }) => {
      const item = {
        id: `occurrence-${occurrences.length + 1}`,
        ...data,
        cancelledAt: null,
        cancellationReason: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      occurrences.push(item);
      return Promise.resolve(item);
    });
    const tx = {
      supportTeam: {
        findFirst: vi.fn().mockResolvedValue({ id: "team-1", name: "SAC" }),
      },
      supportShiftAssignment: {
        findMany: vi.fn().mockResolvedValue([assignment]),
      },
      supportScheduleRuleVersion: {
        findMany: vi.fn().mockResolvedValue([effectiveRule]),
      },
      supportTeamMembership: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "membership-1",
            userId: "sac-1",
            validFrom: new Date("2027-01-01T00:00:00.000Z"),
            validTo: null,
          },
        ]),
      },
      supportShiftOccurrence: {
        findMany: vi
          .fn()
          .mockImplementation(() => Promise.resolve([...occurrences])),
        create: occurrenceCreate,
        update: vi.fn(),
      },
      auditLog: auditMock(),
    };
    const prisma = transactionClient(tx);

    const first = await materializeSupportShiftOccurrences(
      prisma as never,
      admin,
      {
        teamId: "team-1",
        from: "2028-02-28",
        to: "2028-02-29",
      },
    );
    const second = await materializeSupportShiftOccurrences(
      prisma as never,
      admin,
      {
        teamId: "team-1",
        from: "2028-02-28",
        to: "2028-02-29",
      },
    );

    expect(first).toMatchObject({
      createdCount: 2,
      reusedCount: 0,
      conflicts: [],
    });
    expect(second).toMatchObject({
      createdCount: 0,
      reusedCount: 2,
      conflicts: [],
    });
    expect(occurrenceCreate).toHaveBeenCalledTimes(2);
    expect(occurrences.map((item) => item.localDate)).toEqual([
      "2028-02-28",
      "2028-02-29",
    ]);
    expect(occurrences[1]).toMatchObject({
      startsAt: new Date("2028-02-29T11:00:00.000Z"),
      endsAt: new Date("2028-02-29T17:00:00.000Z"),
      ruleVersionId: "rule-1",
      sourceType: "MATERIALIZED",
    });
    expect(JSON.parse(occurrences[1].ruleSnapshotJson as string)).toMatchObject(
      { id: "rule-1", version: 1 },
    );
  });
});

describe("support extra shifts", () => {
  it("creates a future extra slot from the effective rule snapshot", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2099-01-01T12:00:00.000Z"));
    const slotRule = rule({
      effectiveFrom: new Date("2098-01-01T00:00:00.000Z"),
    });
    const slotCreate = vi
      .fn()
      .mockImplementation(({ data }) =>
        Promise.resolve({ id: "extra-slot-1", ...data }),
      );
    const tx = {
      supportTeam: {
        findFirst: vi.fn().mockResolvedValue({ id: "team-1", name: "SAC" }),
      },
      supportScheduleRuleVersion: {
        findFirst: vi.fn().mockResolvedValue(slotRule),
      },
      supportExtraShiftSlot: { create: slotCreate },
      supportTeamMembership: { findMany: vi.fn().mockResolvedValue([]) },
      auditLog: auditMock(),
    };
    const prisma = transactionClient(tx);

    const result = await createSupportExtraShiftSlot(prisma as never, admin, {
      teamId: "team-1",
      startsAt: "2099-01-03T11:00:00.000Z",
      endsAt: "2099-01-03T17:00:00.000Z",
      capacity: 2,
    });

    expect(result.slot).toMatchObject({
      id: "extra-slot-1",
      ruleVersionId: "rule-1",
      capacity: 2,
      status: "OPEN",
    });
    expect(
      JSON.parse(slotCreate.mock.calls[0][0].data.policySnapshotJson),
    ).toMatchObject({ id: "rule-1", version: 1 });
  });

  it("auto-approves an eligible extra claim and creates an auditable effective occurrence", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2099-01-01T12:00:00.000Z"));
    const slotRule = rule({
      effectiveFrom: new Date("2098-01-01T00:00:00.000Z"),
      minimumRestMinutes: 0,
      requireManagerExtraApproval: false,
    });
    const slot = {
      id: "extra-slot-1",
      organizationId: "org-1",
      teamId: "team-1",
      ruleVersionId: "rule-1",
      startsAt: new Date("2099-01-03T11:00:00.000Z"),
      endsAt: new Date("2099-01-03T17:00:00.000Z"),
      capacity: 1,
      status: "OPEN",
      ruleVersion: slotRule,
    };
    const claim = {
      id: "claim-1",
      organizationId: "org-1",
      teamId: "team-1",
      slotId: slot.id,
      userId: sac.id,
      status: "PENDING",
      note: null,
    };
    const claimUpdate = vi
      .fn()
      .mockImplementation(({ data }) => Promise.resolve({ ...claim, ...data }));
    const occurrenceCreate = vi
      .fn()
      .mockImplementation(({ data }) =>
        Promise.resolve({ id: "extra-occurrence-1", ...data }),
      );
    const tx = {
      supportExtraShiftSlot: {
        findFirst: vi.fn().mockResolvedValue(slot),
        update: vi.fn().mockResolvedValue({ ...slot, status: "FILLED" }),
      },
      user: {
        findFirst: vi.fn().mockResolvedValue({ id: sac.id, name: sac.name }),
      },
      supportTeamMembership: {
        findFirst: vi.fn().mockResolvedValue({ id: "membership-1" }),
      },
      supportExtraShiftClaim: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue(claim),
        count: vi.fn().mockResolvedValue(0),
        update: claimUpdate,
      },
      supportShiftOccurrence: {
        findMany: vi.fn().mockResolvedValue([]),
        count: vi.fn().mockResolvedValue(0),
        create: occurrenceCreate,
      },
      auditLog: auditMock(),
    };
    const prisma = transactionClient(tx);

    const result = await claimSupportExtraShiftSlot(
      prisma as never,
      sac,
      slot.id,
      {},
    );

    expect(result).toMatchObject({
      claim: { id: "claim-1", status: "APPROVED" },
      occurrence: { id: "extra-occurrence-1", kind: "EXTRA" },
    });
    expect(occurrenceCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "sac-1",
        sourceType: "EXTRA_SLOT",
        sourceId: "claim-1",
        ruleSnapshotJson: expect.stringContaining("minimumNoticeMinutes"),
      }),
    });
    expect(tx.supportExtraShiftSlot.update).toHaveBeenCalledWith({
      where: { id: slot.id },
      data: { status: "FILLED" },
    });
    expect(tx.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "support_schedule.extra_claim.auto_approved",
        }),
      }),
    );
  });

  it("keeps an idempotent pending claim from reopening manager notifications", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2099-01-01T12:00:00.000Z"));
    const slotRule = rule({
      effectiveFrom: new Date("2098-01-01T00:00:00.000Z"),
      requireManagerExtraApproval: true,
    });
    const slot = {
      id: "extra-slot-1",
      organizationId: "org-1",
      teamId: "team-1",
      ruleVersionId: slotRule.id,
      startsAt: new Date("2099-01-03T11:00:00.000Z"),
      endsAt: new Date("2099-01-03T17:00:00.000Z"),
      capacity: 1,
      status: "OPEN",
      ruleVersion: slotRule,
    };
    const pendingClaim = {
      id: "claim-1",
      organizationId: "org-1",
      teamId: "team-1",
      slotId: slot.id,
      userId: sac.id,
      status: "PENDING",
      note: null,
    };
    const notificationUpsert = vi.fn();
    const tx = {
      supportExtraShiftSlot: { findFirst: vi.fn().mockResolvedValue(slot) },
      user: {
        findFirst: vi.fn().mockResolvedValue({ id: sac.id, name: sac.name }),
        findMany: vi.fn().mockResolvedValue([{ id: admin.id }]),
      },
      supportTeamMembership: {
        findFirst: vi.fn().mockResolvedValue({ id: "membership-1" }),
      },
      supportExtraShiftClaim: {
        findUnique: vi.fn().mockResolvedValue(pendingClaim),
      },
      inAppNotification: { upsert: notificationUpsert },
      auditLog: auditMock(),
    };
    const prisma = transactionClient(tx);

    await expect(
      claimSupportExtraShiftSlot(prisma as never, sac, slot.id, {}),
    ).resolves.toMatchObject({ claim: pendingClaim, idempotent: true });
    expect(notificationUpsert).not.toHaveBeenCalled();
    expect(tx.auditLog.create).not.toHaveBeenCalled();
  });

  it("requires a manager rejection reason and preserves a terminal rejected claim", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2099-01-01T12:00:00.000Z"));
    const slotRule = rule({
      effectiveFrom: new Date("2098-01-01T00:00:00.000Z"),
    });
    const slot = {
      id: "extra-slot-1",
      organizationId: "org-1",
      teamId: "team-1",
      ruleVersionId: "rule-1",
      startsAt: new Date("2099-01-03T11:00:00.000Z"),
      endsAt: new Date("2099-01-03T17:00:00.000Z"),
      capacity: 1,
      status: "OPEN",
      ruleVersion: slotRule,
    };
    const claim = {
      id: "claim-1",
      organizationId: "org-1",
      teamId: "team-1",
      slotId: slot.id,
      userId: sac.id,
      status: "PENDING",
      slot,
    };
    const update = vi
      .fn()
      .mockImplementation(({ data }) => Promise.resolve({ ...claim, ...data }));
    const tx = {
      supportExtraShiftClaim: {
        findFirst: vi.fn().mockResolvedValue(claim),
        update,
      },
      auditLog: auditMock(),
    };
    const prisma = transactionClient(tx);

    await expect(
      decideSupportExtraShiftClaim(prisma as never, admin, claim.id, {
        decision: "REJECTED",
      }),
    ).rejects.toEqual(new SupportSchedulingError("INVALID_INPUT"));
    const result = await decideSupportExtraShiftClaim(
      prisma as never,
      admin,
      claim.id,
      {
        decision: "REJECTED",
        reason: "Carga semanal já comprometida",
      },
    );

    expect(result).toMatchObject({
      claim: {
        id: "claim-1",
        status: "REJECTED",
        decisionReason: "Carga semanal já comprometida",
      },
      occurrence: null,
    });
    expect(tx.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "support_schedule.extra_claim.rejected",
        }),
      }),
    );
  });
});

describe("support shift offers", () => {
  it("creates a directed offer with a frozen policy snapshot and precise deep-link data", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2099-01-01T12:00:00.000Z"));
    const sourceRule = rule({
      effectiveFrom: new Date("2098-01-01T00:00:00.000Z"),
      minimumRestMinutes: 0,
    });
    const source = {
      id: "occurrence-1",
      organizationId: "org-1",
      teamId: "team-1",
      userId: sac.id,
      assignmentId: "assignment-1",
      patternVersionId: "pattern-1",
      ruleVersionId: "rule-1",
      localDate: "2099-01-05",
      startsAt: new Date("2099-01-05T11:00:00.000Z"),
      endsAt: new Date("2099-01-05T17:00:00.000Z"),
      kind: "REGULAR",
      status: "PUBLISHED",
      ruleSnapshotJson: JSON.stringify({ id: "rule-1" }),
      ruleVersion: sourceRule,
    };
    const create = vi.fn().mockImplementation(({ data }) =>
      Promise.resolve({
        id: "offer-1",
        createdAt: new Date(),
        updatedAt: new Date(),
        ...data,
      }),
    );
    const notificationUpsert = vi
      .fn()
      .mockResolvedValue({ id: "notification-1" });
    const offerCount = vi.fn().mockResolvedValue(0);
    const tx = {
      supportShiftOccurrence: { findFirst: vi.fn().mockResolvedValue(source) },
      user: {
        findFirst: vi.fn().mockResolvedValue({ id: sac2.id, name: sac2.name }),
        findMany: vi.fn().mockResolvedValue([{ id: sac2.id }]),
      },
      supportShiftOffer: {
        findFirst: vi.fn().mockResolvedValue(null),
        count: offerCount,
        create,
      },
      supportTeamMembership: {
        findFirst: vi.fn().mockResolvedValue({ id: "membership-2" }),
      },
      inAppNotification: { upsert: notificationUpsert },
      auditLog: auditMock(),
    };
    const prisma = transactionClient(tx);

    const result = await createSupportShiftOffer(prisma as never, sac, {
      occurrenceId: source.id,
      type: "OFFER",
      targetUserId: sac2.id,
      note: "Disponível para cobertura",
    });

    expect(result.offer).toMatchObject({
      id: "offer-1",
      type: "OFFER",
      targetUserId: "sac-2",
      status: "OPEN",
    });
    expect(
      JSON.parse(create.mock.calls[0][0].data.policySnapshotJson),
    ).toMatchObject({
      rule: { id: "rule-1", version: 1 },
      source: { id: "occurrence-1", localDate: "2099-01-05" },
    });
    expect(offerCount).toHaveBeenCalledWith({
      where: expect.objectContaining({
        appliedAt: {
          gte: new Date("2099-01-01T03:00:00.000Z"),
          lt: new Date("2099-02-01T03:00:00.000Z"),
        },
      }),
    });
    expect(notificationUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          href: expect.stringMatching(
            /^\/escalas\?date=2099-01-05&teamId=team-1&offerId=offer-1&at=.*&tab=trocas$/,
          ),
        }),
      }),
    );
  });

  it("auto-applies an accepted one-way offer as replacement snapshots and marks linked pauses for rescheduling", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2099-01-01T12:00:00.000Z"));
    const sourceRule = rule({
      effectiveFrom: new Date("2098-01-01T00:00:00.000Z"),
      minimumRestMinutes: 0,
      autoApproveEligibleSwaps: true,
    });
    const source = {
      id: "occurrence-1",
      organizationId: "org-1",
      teamId: "team-1",
      userId: sac.id,
      assignmentId: "assignment-1",
      patternVersionId: "pattern-1",
      ruleVersionId: "rule-1",
      localDate: "2099-01-05",
      startsAt: new Date("2099-01-05T11:00:00.000Z"),
      endsAt: new Date("2099-01-05T17:00:00.000Z"),
      kind: "REGULAR",
      status: "PUBLISHED",
      ruleSnapshotJson: JSON.stringify({ id: "rule-1" }),
      ruleVersion: sourceRule,
    };
    const offer = {
      id: "offer-1",
      organizationId: "org-1",
      teamId: "team-1",
      occurrenceId: source.id,
      targetOccurrenceId: null,
      offeredById: sac.id,
      targetUserId: sac2.id,
      ruleVersionId: "rule-1",
      type: "OFFER",
      status: "OPEN",
      expiresAt: new Date("2099-01-04T00:00:00.000Z"),
      occurrence: source,
      targetOccurrence: null,
      ruleVersion: sourceRule,
    };
    const offerUpdate = vi
      .fn()
      .mockImplementation(({ data }) => Promise.resolve({ ...offer, ...data }));
    const occurrenceUpdateMany = vi.fn().mockResolvedValue({ count: 1 });
    const pauseUpdateMany = vi.fn().mockResolvedValue({ count: 1 });
    const tx = {
      supportShiftOffer: {
        findFirst: vi.fn().mockResolvedValue(offer),
        update: offerUpdate,
        count: vi.fn().mockResolvedValue(0),
      },
      user: {
        findFirst: vi.fn().mockResolvedValue({ id: sac2.id, name: sac2.name }),
      },
      supportTeamMembership: {
        findFirst: vi.fn().mockResolvedValue({ id: "membership-2" }),
      },
      supportShiftOccurrence: {
        findMany: vi.fn().mockResolvedValue([]),
        create: vi
          .fn()
          .mockImplementation(({ data }) =>
            Promise.resolve({ id: "replacement-1", ...data }),
          ),
        updateMany: occurrenceUpdateMany,
      },
      supportPauseBooking: { updateMany: pauseUpdateMany },
      auditLog: auditMock(),
    };
    const prisma = transactionClient(tx);

    const result = await acceptSupportShiftOffer(
      prisma as never,
      sac2,
      offer.id,
      {},
    );

    expect(result).toMatchObject({
      offer: { id: "offer-1", status: "APPLIED" },
      pending: false,
      occurrences: [{ id: "replacement-1", userId: "sac-2" }],
    });
    expect(
      JSON.parse(offerUpdate.mock.calls[0][0].data.policySnapshotJson),
    ).toMatchObject({
      rule: { id: "rule-1", version: 1 },
      source: { id: "occurrence-1", localDate: "2099-01-05" },
      target: null,
    });
    expect(occurrenceUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          organizationId: "org-1",
          id: { in: ["occurrence-1"] },
          status: "PUBLISHED",
        },
        data: expect.objectContaining({
          status: "CANCELLED",
          cancellationReason: "SHIFT_OFFER:offer-1",
        }),
      }),
    );
    expect(pauseUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          shiftOccurrenceId: { in: ["occurrence-1"] },
          status: "BOOKED",
        }),
        data: expect.objectContaining({
          rescheduleReason: "SHIFT_OFFER:offer-1",
        }),
      }),
    );
    expect(tx.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "support_schedule.offer.applied",
        }),
      }),
    );
  });

  it("lets an independent manager reject a peer-accepted negotiation", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2099-01-01T12:00:00.000Z"));
    const sourceRule = rule({
      effectiveFrom: new Date("2098-01-01T00:00:00.000Z"),
      autoApproveEligibleSwaps: false,
    });
    const source = {
      id: "occurrence-1",
      organizationId: "org-1",
      teamId: "team-1",
      userId: sac.id,
      assignmentId: "assignment-1",
      patternVersionId: "pattern-1",
      ruleVersionId: "rule-1",
      localDate: "2099-01-05",
      startsAt: new Date("2099-01-05T11:00:00.000Z"),
      endsAt: new Date("2099-01-05T17:00:00.000Z"),
      kind: "REGULAR",
      status: "PUBLISHED",
      ruleSnapshotJson: "{}",
      ruleVersion: sourceRule,
    };
    const offer = {
      id: "offer-1",
      organizationId: "org-1",
      teamId: "team-1",
      occurrenceId: source.id,
      targetOccurrenceId: null,
      offeredById: sac.id,
      targetUserId: sac2.id,
      ruleVersionId: "rule-1",
      type: "OFFER",
      status: "MANAGER_PENDING",
      expiresAt: new Date("2099-01-04T00:00:00.000Z"),
      occurrence: source,
      targetOccurrence: null,
      ruleVersion: sourceRule,
    };
    const update = vi
      .fn()
      .mockImplementation(({ data }) => Promise.resolve({ ...offer, ...data }));
    const tx = {
      supportShiftOffer: {
        findFirst: vi.fn().mockResolvedValue(offer),
        update,
      },
      auditLog: auditMock(),
    };
    const prisma = transactionClient(tx);

    const result = await decideSupportShiftOffer(
      prisma as never,
      admin,
      offer.id,
      {
        decision: "REJECTED",
        reason: "Cobertura do turno de origem",
      },
    );

    expect(result).toMatchObject({
      offer: {
        id: "offer-1",
        status: "REJECTED",
        decisionReason: "Cobertura do turno de origem",
      },
      occurrences: [],
    });
    expect(tx.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "support_schedule.offer.rejected",
        }),
      }),
    );
  });

  it("allows only an involved operator or manager to cancel an active offer", async () => {
    const offer = {
      id: "offer-1",
      organizationId: "org-1",
      teamId: "team-1",
      occurrenceId: "occurrence-1",
      targetOccurrenceId: null,
      offeredById: sac.id,
      targetUserId: sac2.id,
      type: "OFFER",
      status: "OPEN",
      occurrence: {
        localDate: "2099-01-05",
        startsAt: new Date("2099-01-05T11:00:00.000Z"),
      },
    };
    const update = vi
      .fn()
      .mockImplementation(({ data }) => Promise.resolve({ ...offer, ...data }));
    const tx = {
      supportShiftOffer: {
        findFirst: vi.fn().mockResolvedValue(offer),
        update,
      },
      auditLog: auditMock(),
    };
    const prisma = transactionClient(tx);

    await expect(
      cancelSupportShiftOffer(
        prisma as never,
        { ...sac, id: "sac-3" },
        offer.id,
      ),
    ).rejects.toEqual(new SupportSchedulingError("FORBIDDEN"));
    await expect(
      cancelSupportShiftOffer(prisma as never, sac, offer.id, {
        reason: "Mudança de necessidade",
      }),
    ).resolves.toMatchObject({ offer: { id: "offer-1", status: "CANCELLED" } });
    expect(tx.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "support_schedule.offer.cancelled",
        }),
      }),
    );
  });
});
