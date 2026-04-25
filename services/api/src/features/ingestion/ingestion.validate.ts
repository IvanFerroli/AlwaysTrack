import type { IngestJobPostingInput } from "@olympus/shared-types";

function hasValue(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function hasBoundedValue(value: unknown, maxLength: number): value is string {
  return hasValue(value) && value.trim().length <= maxLength;
}

function hasOptionalBoundedValue(value: unknown, maxLength: number): value is string | undefined {
  return value === undefined || (typeof value === "string" && value.trim().length <= maxLength);
}

function hasHttpUrl(value: unknown): value is string {
  if (!hasBoundedValue(value, 2048)) {
    return false;
  }

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function validateIngestPayload(payload: unknown): payload is IngestJobPostingInput {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  const candidate = payload as Record<string, unknown>;

  return (
    hasBoundedValue(candidate.title, 240) &&
    hasBoundedValue(candidate.companyName, 200) &&
    hasBoundedValue(candidate.sourceName, 80) &&
    hasHttpUrl(candidate.sourceUrl) &&
    hasOptionalBoundedValue(candidate.location, 200) &&
    hasBoundedValue(candidate.description, 10_000)
  );
}
