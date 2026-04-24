import type { ResumeProfileCreateInput } from "@olympus/shared-types";

function hasValue(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function hasSkills(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string" && item.trim().length > 0);
}

export function validateResumeProfilePayload(payload: unknown): payload is ResumeProfileCreateInput {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  const candidate = payload as Record<string, unknown>;
  return hasValue(candidate.headline) && hasSkills(candidate.skills);
}
