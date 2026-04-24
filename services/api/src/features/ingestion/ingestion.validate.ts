import type { IngestJobPostingInput } from "@olympus/shared-types";

function hasValue(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function validateIngestPayload(payload: unknown): payload is IngestJobPostingInput {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  const candidate = payload as Record<string, unknown>;

  return (
    hasValue(candidate.title) &&
    hasValue(candidate.companyName) &&
    hasValue(candidate.sourceName) &&
    hasValue(candidate.sourceUrl) &&
    hasValue(candidate.description)
  );
}
