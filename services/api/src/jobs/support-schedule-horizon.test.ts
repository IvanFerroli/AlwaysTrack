import { beforeEach, describe, expect, it, vi } from "vitest";

const { materializeMock } = vi.hoisted(() => ({ materializeMock: vi.fn() }));

vi.mock("../core/db/prisma.js", () => ({ prisma: { $disconnect: vi.fn() } }));
vi.mock("../core/support-scheduling/support-scheduling.service.js", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../core/support-scheduling/support-scheduling.service.js")>()),
  materializeSupportShiftOccurrences: materializeMock
}));

import {
  runSupportScheduleHorizonWorker,
  supportScheduleHorizonLogMetadata
} from "./support-schedule-horizon.js";

const now = new Date("2026-07-18T02:30:00.000Z");

function adminFixture(id: string, organizationId: string) {
  return {
    id,
    organizationId,
    name: `Admin ${id}`,
    email: `${id}@example.com`,
    unitScopeJson: null,
    sectorScopeJson: null
  };
}

function ruleFixture(timezone: string, version = 1) {
  return {
    timezone,
    version,
    effectiveFrom: new Date("2026-01-01T00:00:00.000Z"),
    effectiveTo: null
  };
}

function materializationResult(createdCount = 1) {
  return {
    candidates: createdCount,
    conflicts: [],
    createdCount,
    updatedCount: 0,
    reusedCount: 0,
    preservedCount: 0,
    dryRun: false
  };
}

describe("support schedule horizon worker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    materializeMock.mockResolvedValue(materializationResult());
  });

  it("materializes every eligible tenant team with its first active admin and rule timezone", async () => {
    const database = {
      supportTeam: {
        findMany: vi.fn().mockResolvedValue([
          { id: "team-sp", organizationId: "org-1" },
          { id: "team-tokyo", organizationId: "org-2" }
        ])
      },
      user: {
        findMany: vi.fn().mockResolvedValue([
          adminFixture("admin-first", "org-1"),
          adminFixture("admin-second", "org-1"),
          adminFixture("admin-tokyo", "org-2")
        ])
      },
      supportScheduleRuleVersion: {
        findMany: vi
          .fn()
          .mockResolvedValueOnce([ruleFixture("America/Sao_Paulo")])
          .mockResolvedValueOnce([ruleFixture("Asia/Tokyo")])
      }
    };

    const result = await runSupportScheduleHorizonWorker(database as never, 30, now);

    expect(database.supportTeam.findMany).toHaveBeenCalledWith({
      where: {
        active: true,
        organization: { active: true },
        shiftAssignments: { some: { active: true } }
      },
      select: { id: true, organizationId: true },
      orderBy: [{ organizationId: "asc" }, { id: "asc" }]
    });
    expect(database.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ role: "ADMIN", active: true, organization: { active: true } }),
        orderBy: [{ organizationId: "asc" }, { createdAt: "asc" }, { id: "asc" }]
      })
    );
    expect(database.supportScheduleRuleVersion.findMany).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: expect.objectContaining({
          organizationId: "org-1",
          teamId: "team-sp",
          active: true,
          effectiveFrom: { lt: new Date("2026-08-19T02:30:00.000Z") },
          OR: [{ effectiveTo: null }, { effectiveTo: { gt: now } }]
        })
      })
    );
    expect(materializeMock).toHaveBeenNthCalledWith(
      1,
      database,
      expect.objectContaining({ id: "admin-first", organizationId: "org-1", role: "ADMIN" }),
      { teamId: "team-sp", from: "2026-07-17", to: "2026-08-16" }
    );
    expect(materializeMock).toHaveBeenNthCalledWith(
      2,
      database,
      expect.objectContaining({ id: "admin-tokyo", organizationId: "org-2", role: "ADMIN" }),
      { teamId: "team-tokyo", from: "2026-07-18", to: "2026-08-17" }
    );
    expect(result).toMatchObject({
      horizonDays: 30,
      teams: 2,
      succeeded: 2,
      failed: 0,
      createdCount: 2,
      failures: []
    });
  });

  it("keeps team failures visible and continues sequentially", async () => {
    const database = {
      supportTeam: {
        findMany: vi.fn().mockResolvedValue([
          { id: "team-no-admin", organizationId: "org-no-admin" },
          { id: "team-no-rule", organizationId: "org-no-rule" },
          { id: "team-broken", organizationId: "org-broken" },
          { id: "team-ok", organizationId: "org-ok" }
        ])
      },
      user: {
        findMany: vi.fn().mockResolvedValue([
          adminFixture("admin-no-rule", "org-no-rule"),
          adminFixture("admin-broken", "org-broken"),
          adminFixture("admin-ok", "org-ok")
        ])
      },
      supportScheduleRuleVersion: {
        findMany: vi
          .fn()
          .mockResolvedValueOnce([])
          .mockResolvedValueOnce([ruleFixture("UTC")])
          .mockResolvedValueOnce([ruleFixture("UTC")])
      }
    };
    let activeCalls = 0;
    let maximumActiveCalls = 0;
    materializeMock.mockImplementation(async (_database, _actor, input) => {
      activeCalls += 1;
      maximumActiveCalls = Math.max(maximumActiveCalls, activeCalls);
      await Promise.resolve();
      activeCalls -= 1;
      if (input.teamId === "team-broken") throw new Error("contains private database details");
      return materializationResult(2);
    });

    const result = await runSupportScheduleHorizonWorker(database as never, 10, now);

    expect(maximumActiveCalls).toBe(1);
    expect(materializeMock.mock.calls.map((call) => call[2].teamId)).toEqual(["team-broken", "team-ok"]);
    expect(result).toMatchObject({ teams: 4, succeeded: 1, failed: 3, createdCount: 2 });
    expect(result.failures).toEqual([
      { organizationId: "org-no-admin", teamId: "team-no-admin", code: "NO_ACTIVE_ADMIN" },
      { organizationId: "org-no-rule", teamId: "team-no-rule", code: "NO_RULE_FOR_HORIZON" },
      { organizationId: "org-broken", teamId: "team-broken", code: "MATERIALIZATION_FAILED" }
    ]);

    const metadata = supportScheduleHorizonLogMetadata(result, 125);
    expect(metadata).toMatchObject({
      durationMs: 125,
      teams: 4,
      succeeded: 1,
      failed: 3,
      failureCodes: {
        NO_ACTIVE_ADMIN: 1,
        NO_RULE_FOR_HORIZON: 1,
        MATERIALIZATION_FAILED: 1
      }
    });
    expect(JSON.stringify(metadata)).not.toMatch(/org-|team-|admin|example\.com|private database details/);
  });

  it.each([0, 1.5, 62])("rejects an out-of-range horizon before querying: %s", async (horizonDays) => {
    const findMany = vi.fn();
    await expect(
      runSupportScheduleHorizonWorker({ supportTeam: { findMany } } as never, horizonDays, now)
    ).rejects.toThrow("SUPPORT_SCHEDULE_HORIZON_DAYS must be an integer between 1 and 61.");
    expect(findMany).not.toHaveBeenCalled();
  });
});
