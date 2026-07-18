import { describe, expect, it } from "vitest";
import {
  buildRecurrenceCandidates,
  formatLocalDate,
  monthlyOccurrenceLocalDates,
  zonedLocalDateTimeToUtc
} from "./announcement-recurrence.js";

describe("announcement recurrence calendar", () => {
  it("keeps day 29 in leap February and explicitly skips it in non-leap February", () => {
    expect(monthlyOccurrenceLocalDates(2024, 2)).toEqual(["2024-02-14", "2024-02-29"]);
    expect(monthlyOccurrenceLocalDates(2025, 2)).toEqual(["2025-02-14"]);
  });

  it("converts local wall time with an IANA timezone into the correct instant", () => {
    expect(zonedLocalDateTimeToUtc("2026-07-14", "09:30", "America/Sao_Paulo").toISOString()).toBe(
      "2026-07-14T12:30:00.000Z"
    );
    expect(zonedLocalDateTimeToUtc("2026-01-14", "09:30", "America/New_York").toISOString()).toBe(
      "2026-01-14T14:30:00.000Z"
    );
    expect(formatLocalDate(new Date("2026-07-14T01:00:00.000Z"), "America/Sao_Paulo")).toBe("2026-07-13");
  });

  it("uses the immutable future version only from its effective local date", () => {
    const first = {
      id: "version-1",
      version: 1,
      effectiveFromDate: "2026-01-01",
      validFromDate: "2026-01-01",
      validToDate: null,
      recurrenceDaysJson: "[14,29]"
    };
    const future = {
      ...first,
      id: "version-2",
      version: 2,
      effectiveFromDate: "2026-03-20",
      recurrenceDaysJson: "[29]"
    };

    expect(buildRecurrenceCandidates([first, future], "2026-03-01", "2026-04-30")).toEqual([
      { localDate: "2026-03-14", version: first },
      { localDate: "2026-03-29", version: future },
      { localDate: "2026-04-29", version: future }
    ]);
  });

  it("prefers the newest immutable revision when two versions share the same future effective date", () => {
    const replaced = {
      id: "version-2",
      version: 2,
      effectiveFromDate: "2026-08-01",
      validFromDate: "2026-01-01",
      validToDate: null,
      recurrenceDaysJson: "[14]"
    };
    const replacement = { ...replaced, id: "version-3", version: 3, recurrenceDaysJson: "[29]" };
    expect(buildRecurrenceCandidates([replaced, replacement], "2026-08-01", "2026-08-31")).toEqual([
      { localDate: "2026-08-29", version: replacement }
    ]);
  });
});
