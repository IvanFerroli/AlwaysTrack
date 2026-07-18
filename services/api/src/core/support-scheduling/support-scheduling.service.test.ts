import { afterEach, describe, expect, it, vi } from "vitest";
import type { CurrentUser } from "@alwaystrack/shared";
import {
  SupportSchedulingError,
  acceptSupportShiftOffer,
  addSupportLocalDays,
  assignSupportShiftPattern,
  calculatePublishedOccurrenceCoverage,
  cancelSupportShiftOffer,
  claimSupportExtraShiftSlot,
  createSupportExtraShiftSlot,
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
  supportWorkloadViolations,
  supportZonedDateTimeToUtc,
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
    createdById: "admin-1",
    createdAt: new Date("2090-01-01T00:00:00.000Z"),
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
        findMany: vi.fn().mockResolvedValue([activeRule]),
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
    const tx = {
      supportTeam: {
        findFirst: vi.fn().mockResolvedValue({ id: "team-1", name: "SAC" }),
      },
      supportScheduleRuleVersion: {
        findFirst: vi.fn().mockResolvedValue(previous),
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
          action: "support_schedule.rule.version_created",
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
