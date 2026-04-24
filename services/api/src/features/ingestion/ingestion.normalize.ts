import { createHash } from "node:crypto";
import type { IngestJobPostingInput } from "@olympus/shared-types";

function normalizeSpaces(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function normalizeText(value: string): string {
  return normalizeSpaces(value).toLowerCase();
}

export function tokenizeJobText(payload: IngestJobPostingInput): string[] {
  const source = `${payload.title} ${payload.companyName} ${payload.description}`.toLowerCase();
  const tokens = source
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .map((item) => item.trim())
    .filter((item) => item.length >= 2);

  return [...new Set(tokens)];
}

export function computeDedupeKey(payload: IngestJobPostingInput): string {
  const seed = [
    normalizeText(payload.sourceName),
    normalizeText(payload.sourceUrl),
    normalizeText(payload.title),
    normalizeText(payload.companyName)
  ].join("|");

  return createHash("sha256").update(seed).digest("hex").slice(0, 16);
}

export function normalizeIngestPayload(payload: IngestJobPostingInput): IngestJobPostingInput {
  return {
    ...payload,
    title: normalizeSpaces(payload.title),
    companyName: normalizeSpaces(payload.companyName),
    sourceName: normalizeSpaces(payload.sourceName),
    sourceUrl: normalizeSpaces(payload.sourceUrl),
    location: payload.location ? normalizeSpaces(payload.location) : undefined,
    description: normalizeSpaces(payload.description)
  };
}
