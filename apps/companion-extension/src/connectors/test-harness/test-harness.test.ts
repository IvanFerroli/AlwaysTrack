import { readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  parseCorreiosReverseResult,
  parseJtVipResult,
  parseLancadorQueryResult,
  parseLoggiResult,
  parseOmieResult,
  parseYampiResult
} from "@alwaystrack/shared";
import { loadOfflineFixture, runOfflineFixture, type OfflineSelectorPolicy } from "./index.js";
import { auditSanitizedFixture } from "./sanitization.js";

const fixtureRoot = resolve(import.meta.dirname, "../../../../../tests/fixtures/connectors");
const fixture = (name: string) => loadOfflineFixture(resolve(fixtureRoot, `${name}.sanitized.json`));
const policy: OfflineSelectorPolicy = {
  primary: ["[data-testid=shipment-results]", "[data-testid=orders-empty]"],
  fallback: [".legacy-empty"],
  unexpectedPageSignals: ["Synthetic unexpected page"]
};

const outcomeOf = (parsed: unknown) => (parsed as { outcome: string }).outcome;
const parserCases: ReadonlyArray<readonly [string, (input: unknown) => unknown]> = [
  ["yampi-empty", parseYampiResult],
  ["omie-unexpected", parseOmieResult],
  ["loggi-timeout", parseLoggiResult],
  ["jt-login", parseJtVipResult],
  ["jt-captcha", parseJtVipResult],
  ["jt-multiple-primary", parseJtVipResult],
  ["correios-2fa", parseCorreiosReverseResult],
  ["lancador-empty-fallback", parseLancadorQueryResult]
];

describe("offline connector fixture harness", () => {
  it.each(parserCases)("runs %s through its parser without a browser", async (name, parser) => {
    const loaded = await fixture(name);
    const result = runOfflineFixture(loaded, parser, policy);
    expect(outcomeOf(result.parsed)).toBe(loaded.expectedOutcome);
  });

  it("resolves primary selectors before fallback selectors", async () => {
    const primary = runOfflineFixture(await fixture("jt-multiple-primary"), parseJtVipResult, policy);
    const fallback = runOfflineFixture(await fixture("lancador-empty-fallback"), parseLancadorQueryResult, policy);
    expect(primary.selector.source).toBe("primary");
    expect(fallback.selector.source).toBe("fallback");
  });

  it("makes selector drift directly testable", async () => {
    const result = runOfflineFixture(await fixture("selector-drift"), parseJtVipResult, policy);
    expect(result.driftDetected).toBe(true);
    expect(outcomeOf(result.parsed)).toBe("FAILED_SELECTOR_DRIFT");
  });

  it("rejects an unexpected page without a configured detector signal", async () => {
    const loaded = await fixture("omie-unexpected");
    expect(() => runOfflineFixture(loaded, parseOmieResult, { ...policy, unexpectedPageSignals: ["missing"] })).toThrow("no configured signal");
  });
});

describe("sanitized fixture audit", () => {
  it("keeps every connector fixture free of secrets, PII, active HTML and cookies", async () => {
    for (const name of await readdir(fixtureRoot)) {
      const loaded = await loadOfflineFixture(resolve(fixtureRoot, name));
      expect(auditSanitizedFixture(loaded), name).toEqual([]);
    }
  });

  it.each([
    ["SECRET", { token: "api_key=live-secret-value" }],
    ["PII", { customer: "real.person@company.com" }],
    ["UNSAFE_HTML", { html: "<script src='bad.js'></script>" }],
    ["COOKIE", { headers: "Set-Cookie: session=fake" }]
  ] as const)("detects %s leaks recursively", (kind, unsafe) => {
    expect(auditSanitizedFixture(unsafe).map((finding) => finding.kind)).toContain(kind);
  });
});
