import { readFile } from "node:fs/promises";

export type FixturePageKind =
  | "SEARCH_RESULT"
  | "EMPTY"
  | "LOGIN"
  | "CAPTCHA"
  | "TWO_FACTOR"
  | "TIMEOUT"
  | "UNEXPECTED_PAGE";

export interface OfflineConnectorFixture {
  id: string;
  connectorId: string;
  sanitized: true;
  pageKind: FixturePageKind;
  html: string;
  selectorMatches: Record<string, unknown>;
  payload: unknown;
  expectedOutcome: string;
}

export interface OfflineSelectorPolicy {
  primary: readonly string[];
  fallback: readonly string[];
  unexpectedPageSignals?: readonly string[];
}

export type SelectorResolution =
  | { source: "primary" | "fallback"; selector: string; value: unknown }
  | { source: "none"; selector: null; value: undefined };

export interface HarnessResult<T> {
  fixture: OfflineConnectorFixture;
  parsed: T;
  selector: SelectorResolution;
  driftDetected: boolean;
}

function requireString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim() === "") throw new TypeError(`${field} must be a non-empty string`);
  return value;
}

export function parseOfflineFixture(input: unknown): OfflineConnectorFixture {
  if (typeof input !== "object" || input === null || Array.isArray(input)) throw new TypeError("fixture must be an object");
  const value = input as Record<string, unknown>;
  if (value.sanitized !== true) throw new TypeError("fixture.sanitized must be true");
  if (typeof value.selectorMatches !== "object" || value.selectorMatches === null || Array.isArray(value.selectorMatches)) {
    throw new TypeError("fixture.selectorMatches must be an object");
  }
  return {
    id: requireString(value.id, "fixture.id"),
    connectorId: requireString(value.connectorId, "fixture.connectorId"),
    sanitized: true,
    pageKind: requireString(value.pageKind, "fixture.pageKind") as FixturePageKind,
    html: requireString(value.html, "fixture.html"),
    selectorMatches: value.selectorMatches as Record<string, unknown>,
    payload: value.payload,
    expectedOutcome: requireString(value.expectedOutcome, "fixture.expectedOutcome")
  };
}

export async function loadOfflineFixture(file: string): Promise<OfflineConnectorFixture> {
  return parseOfflineFixture(JSON.parse(await readFile(file, "utf8")) as unknown);
}

export function resolveFixtureSelector(fixture: OfflineConnectorFixture, policy: OfflineSelectorPolicy): SelectorResolution {
  for (const source of ["primary", "fallback"] as const) {
    for (const selector of policy[source]) {
      if (Object.hasOwn(fixture.selectorMatches, selector)) {
        return { source, selector, value: fixture.selectorMatches[selector] };
      }
    }
  }
  return { source: "none", selector: null, value: undefined };
}

export function runOfflineFixture<T>(
  fixture: OfflineConnectorFixture,
  parser: (payload: unknown) => T,
  policy: OfflineSelectorPolicy
): HarnessResult<T> {
  const selector = resolveFixtureSelector(fixture, policy);
  const hasUnexpectedSignal = policy.unexpectedPageSignals?.some((signal) => fixture.html.includes(signal)) ?? false;
  const driftDetected = fixture.pageKind === "SEARCH_RESULT" && selector.source === "none";

  if (driftDetected && fixture.expectedOutcome !== "FAILED_SELECTOR_DRIFT") {
    throw new Error(`${fixture.id}: no primary or fallback selector matched`);
  }
  if (fixture.pageKind === "UNEXPECTED_PAGE" && !hasUnexpectedSignal) {
    throw new Error(`${fixture.id}: unexpected page has no configured signal`);
  }

  return { fixture, parsed: parser(fixture.payload), selector, driftDetected };
}
