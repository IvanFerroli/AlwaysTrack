import { describe, expect, it } from "vitest";
import type { CurrentUser } from "@sylembra/shared";
import { canAccessScopedResource, scopedOrganizationWhere } from "./access-policy.js";

function user(overrides: Partial<CurrentUser>): CurrentUser {
  return {
    id: "user-1",
    name: "User",
    email: "user@example.com",
    role: "ADMIN",
    organizationId: "org-1",
    unitScopeIds: [],
    sectorScopeIds: [],
    ...overrides
  };
}

describe("access policy", () => {
  it("allows ADMIN inside the same organization", () => {
    expect(canAccessScopedResource(user({ role: "ADMIN" }), { organizationId: "org-1" })).toEqual({ allowed: true });
  });

  it("rejects access across organizations", () => {
    expect(canAccessScopedResource(user({ role: "ADMIN" }), { organizationId: "org-2" })).toEqual({
      allowed: false,
      reason: "ORG_MISMATCH"
    });
  });

  it("allows RT only for resources under their responsibility", () => {
    const rt = user({ role: "RT", id: "rt-1" });

    expect(canAccessScopedResource(rt, { organizationId: "org-1", responsibleRtId: "rt-1" })).toEqual({ allowed: true });
    expect(canAccessScopedResource(rt, { organizationId: "org-1", responsibleRtId: "rt-2" })).toEqual({
      allowed: false,
      reason: "ROLE_SCOPE_MISMATCH"
    });
  });

  it("allows SUPERVISOR by unit or sector scope", () => {
    const supervisor = user({ role: "SUPERVISOR", unitScopeIds: ["unit-1"], sectorScopeIds: ["sector-1"] });

    expect(canAccessScopedResource(supervisor, { organizationId: "org-1", unitId: "unit-1" })).toEqual({ allowed: true });
    expect(canAccessScopedResource(supervisor, { organizationId: "org-1", sectorId: "sector-1" })).toEqual({
      allowed: true
    });
    expect(canAccessScopedResource(supervisor, { organizationId: "org-1", unitId: "unit-2" })).toEqual({
      allowed: false,
      reason: "ROLE_SCOPE_MISMATCH"
    });
  });

  it("returns reusable organization filters", () => {
    expect(scopedOrganizationWhere(user({ organizationId: "org-1" }))).toEqual({ organizationId: "org-1" });
  });
});
