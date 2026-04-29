import type { CurrentUser } from "@sylembra/shared";

export interface ResourceScope {
  organizationId: string;
  responsibleRtId?: string | null;
  unitId?: string | null;
  sectorId?: string | null;
}

export type AccessDecision =
  | { allowed: true }
  | { allowed: false; reason: "ORG_MISMATCH" | "ROLE_SCOPE_MISMATCH" | "UNSUPPORTED_ROLE" };

export function canAccessScopedResource(user: CurrentUser, resource: ResourceScope): AccessDecision {
  if (user.organizationId !== resource.organizationId) {
    return { allowed: false, reason: "ORG_MISMATCH" };
  }

  if (user.role === "ADMIN") {
    return { allowed: true };
  }

  if (user.role === "RT") {
    return resource.responsibleRtId === user.id
      ? { allowed: true }
      : { allowed: false, reason: "ROLE_SCOPE_MISMATCH" };
  }

  if (user.role === "SUPERVISOR") {
    const unitAllowed = resource.unitId ? user.unitScopeIds.includes(resource.unitId) : false;
    const sectorAllowed = resource.sectorId ? user.sectorScopeIds.includes(resource.sectorId) : false;
    return unitAllowed || sectorAllowed ? { allowed: true } : { allowed: false, reason: "ROLE_SCOPE_MISMATCH" };
  }

  return { allowed: false, reason: "UNSUPPORTED_ROLE" };
}

export function scopedOrganizationWhere(user: CurrentUser) {
  return { organizationId: user.organizationId };
}
