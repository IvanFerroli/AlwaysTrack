import type { MatchScoreInput } from "@olympus/shared-types";

function hasValue(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function hasSkills(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string" && item.trim().length > 0);
}

export function validateMatchPayload(payload: unknown): payload is MatchScoreInput {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  const candidate = payload as Record<string, unknown>;
  const resume = candidate.resumeProfile as Record<string, unknown> | undefined;

  return (
    hasValue(candidate.jobPostingId) &&
    !!resume &&
    hasValue(resume.id) &&
    hasValue(resume.headline) &&
    hasSkills(resume.skills)
  );
}
