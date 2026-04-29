import { describe, expect, it } from "vitest";
import { calculateLicenseStatus, parseWarningDays } from "./status.js";

const today = new Date("2026-04-29T12:00:00.000Z");

describe("license status rules", () => {
  it("keeps inactive licenses inactive", () => {
    expect(calculateLicenseStatus({ currentStatus: "INACTIVE", today })).toBe("INACTIVE");
  });

  it("uses document states before expiration states", () => {
    expect(calculateLicenseStatus({ documents: [{ status: "UPLOADED" }], expiresAt: "2026-04-28", today })).toBe(
      "PENDING_VALIDATION"
    );
    expect(calculateLicenseStatus({ documents: [], expiresAt: "2026-04-28", today })).toBe("PENDING_DOCUMENT");
  });

  it("marks approved expired licenses as expired", () => {
    expect(
      calculateLicenseStatus({
        documents: [{ status: "APPROVED" }],
        expiresAt: "2026-04-28",
        defaultWarningDays: "90,60,30",
        today
      })
    ).toBe("EXPIRED");
  });

  it("marks licenses inside configurable warning window as expiring", () => {
    expect(
      calculateLicenseStatus({
        documents: [{ status: "APPROVED" }],
        expiresAt: "2026-06-01",
        defaultWarningDays: "15",
        notificationRules: [{ active: true, daysBeforeExpiration: 45 }],
        today
      })
    ).toBe("EXPIRING");
  });

  it("marks approved licenses outside warning window as regular", () => {
    expect(
      calculateLicenseStatus({
        documents: [{ status: "APPROVED" }],
        expiresAt: "2026-07-01",
        defaultWarningDays: "15",
        today
      })
    ).toBe("REGULAR");
  });

  it("parses warning days from type and active rules", () => {
    expect(
      parseWarningDays("90,invalid,30", [
        { active: false, daysBeforeExpiration: 120 },
        { active: true, daysBeforeExpiration: 60 }
      ])
    ).toBe(90);
  });
});
