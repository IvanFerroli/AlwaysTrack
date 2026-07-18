import { describe, expect, it } from "vitest";
import {
  SUPPORT_SCHEDULE_POLL_INTERVAL_MS,
  buildSupportCoverageIntervals,
  supportCoveragePosition,
  supportScheduleHref,
  supportScheduleLocalDateTimeIso,
  supportScheduleQuery,
  supportScheduleWeekDates,
  supportScheduleWeekStart,
  type SupportShiftOccurrence
} from "../src/support-scheduling";

const team = { id: "team-1", name: "Atendimento" };

function occurrence(id: string, userId: string, name: string, startsAt: string, endsAt: string): SupportShiftOccurrence {
  return {
    id,
    organizationId: "org-1",
    teamId: team.id,
    userId,
    assignmentId: `assignment-${id}`,
    patternVersionId: "pattern-1",
    ruleVersionId: "rule-1",
    localDate: "2026-07-20",
    startsAt,
    endsAt,
    kind: "REGULAR",
    status: "PUBLISHED",
    sourceType: "MATERIALIZED",
    sourceId: `assignment-${id}`,
    ruleSnapshotJson: JSON.stringify({ timezone: "America/Sao_Paulo" }),
    publishedAt: "2026-07-18T12:00:00.000Z",
    user: { id: userId, name },
    team,
    pauseBookings: []
  };
}

describe("support scheduling helpers", () => {
  it("anchors weeks on Monday without shifting local calendar dates", () => {
    expect(supportScheduleWeekStart("2026-07-19")).toBe("2026-07-13");
    expect(supportScheduleWeekDates("2026-07-19")).toEqual([
      "2026-07-13", "2026-07-14", "2026-07-15", "2026-07-16", "2026-07-17", "2026-07-18", "2026-07-19"
    ]);
  });

  it("preserves schedule scope and deep-link parameters", () => {
    expect(supportScheduleQuery({ date: "2026-07-22", scope: "TEAM", teamId: "team 1", userId: "sac-1" }))
      .toBe("/v1/support/schedules?from=2026-07-20&to=2026-07-26&scope=TEAM&teamId=team+1&userId=sac-1");
    expect(supportScheduleHref({ date: "2026-07-22", teamId: "team 1", offerId: "offer-7" }))
      .toBe("/escalas?date=2026-07-22&teamId=team+1&offerId=offer-7");
  });

  it("converts team-local times to UTC and keeps polling below one minute", () => {
    expect(supportScheduleLocalDateTimeIso("2026-07-20T08:00", "America/Sao_Paulo")).toBe("2026-07-20T11:00:00.000Z");
    expect(SUPPORT_SCHEDULE_POLL_INTERVAL_MS).toBeGreaterThan(0);
    expect(SUPPORT_SCHEDULE_POLL_INTERVAL_MS).toBeLessThanOrEqual(60_000);
  });

  it("creates complete overlap intervals for both the visual and table coverage", () => {
    const intervals = buildSupportCoverageIntervals([
      occurrence("occ-1", "sac-1", "Ana", "2026-07-20T11:00:00.000Z", "2026-07-20T19:00:00.000Z"),
      occurrence("occ-2", "sac-2", "Bruno", "2026-07-20T14:00:00.000Z", "2026-07-20T17:00:00.000Z")
    ]);

    expect(intervals.map((item) => ({ start: item.startsAt, end: item.endsAt, count: item.activeCount, agents: item.agents }))).toEqual([
      { start: "2026-07-20T11:00:00.000Z", end: "2026-07-20T14:00:00.000Z", count: 1, agents: ["Ana"] },
      { start: "2026-07-20T14:00:00.000Z", end: "2026-07-20T17:00:00.000Z", count: 2, agents: ["Ana", "Bruno"] },
      { start: "2026-07-20T17:00:00.000Z", end: "2026-07-20T19:00:00.000Z", count: 1, agents: ["Ana"] }
    ]);
    expect(supportCoveragePosition(intervals[1])).toEqual({ left: "45.83333333333333%", width: "12.5%" });
  });
});
