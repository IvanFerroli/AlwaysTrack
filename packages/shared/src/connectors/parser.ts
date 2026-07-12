import type { EvidenceFact, EvidenceSensitivity, NormalizedEvidenceKey } from "../case-flow/evidence.js";
import { connectorId } from "../case-flow/evidence.js";
import type { ParserFactContext } from "./alwayschat.js";

export type JsonObject = Record<string, unknown>;
export const parserOutcomes = ["FOUND", "NOT_FOUND_IN_SOURCE", "BLOCKED_LOGIN", "BLOCKED_CAPTCHA", "BLOCKED_2FA", "FAILED_SELECTOR_DRIFT", "FAILED_TIMEOUT", "FAILED_UNEXPECTED_PAGE"] as const;
export type ParserOutcome = (typeof parserOutcomes)[number];
export type ParsedSearchResult<T> =
  | { outcome: "FOUND"; records: T[] }
  | { outcome: Exclude<ParserOutcome, "FOUND">; records: []; message?: string };

export function object(value: unknown, path: string): JsonObject {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new TypeError(`${path} must be an object`);
  return value as JsonObject;
}
export function string(value: unknown, path: string): string {
  if (typeof value !== "string" || !value.trim()) throw new TypeError(`${path} must be a non-empty string`);
  return value.trim();
}
export function optionalString(value: unknown, path: string): string | undefined {
  return value === undefined || value === null || value === "" ? undefined : string(value, path);
}
export function number(value: unknown, path: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) throw new TypeError(`${path} must be a finite number`);
  return value;
}
export function positiveInteger(value: unknown, path: string): number {
  const parsed = number(value, path);
  if (!Number.isInteger(parsed) || parsed < 1) throw new TypeError(`${path} must be a positive integer`);
  return parsed;
}
export function array(value: unknown, path: string): unknown[] {
  if (!Array.isArray(value)) throw new TypeError(`${path} must be an array`);
  return value;
}
export function strings(value: unknown, path: string): string[] {
  return array(value, path).map((item, index) => string(item, `${path}[${index}]`));
}
export function parseResult<T>(input: unknown, name: string, parseRecord: (value: unknown, path: string) => T): ParsedSearchResult<T> {
  const raw = object(input, name);
  const outcome = string(raw.outcome, `${name}.outcome`) as ParserOutcome;
  if (!parserOutcomes.includes(outcome)) throw new TypeError(`${name}.outcome is invalid`);
  const records = array(raw.records, `${name}.records`);
  if (outcome !== "FOUND") {
    if (records.length) throw new TypeError(`${name}.records must be empty for ${outcome}`);
    return { outcome, records: [], message: optionalString(raw.message, `${name}.message`) };
  }
  if (!records.length) throw new TypeError(`${name}.records must not be empty for FOUND`);
  return { outcome, records: records.map((record, index) => parseRecord(record, `${name}.records[${index}]`)) };
}

export function evidenceBuilder(source: string, reference: string, context: ParserFactContext, recordIndex = 0) {
  const facts: EvidenceFact[] = [];
  return {
    add(key: NormalizedEvidenceKey, value: unknown, sensitivity: EvidenceSensitivity = "INTERNAL") {
      if (value === undefined || value === "" || (Array.isArray(value) && value.length === 0)) return;
      facts.push({ id: `${context.runId}:${recordIndex}:${key}`, caseId: context.caseId, key, value, normalizedValue: value, sourceSystem: connectorId(source), sourceReference: reference, observedAt: context.observedAt, collectedAt: context.collectedAt ?? context.observedAt, confidence: 1, freshness: "FRESH", sensitivity, acquisition: "SCRAPED", connectorRunId: context.runId });
    },
    facts
  };
}
