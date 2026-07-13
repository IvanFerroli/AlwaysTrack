import { describe, expect, it } from "vitest";
import fixture from "./fixtures/intake-complete.sanitized.json";
import { runAlwaysChatIntake } from "./runtime.js";

const context = { caseId: "case-1", runId: "run-alwayschat", observedAt: "2026-01-10T10:02:00.000Z" };

describe("AlwaysChat read-only runtime", () => {
  it("extracts a fixture without exposing any write capability", async () => {
    const source = { mode: "READ_ONLY" as const, read: async () => ({ intake: fixture, historyComplete: false }) };
    const result = await runAlwaysChatIntake(source, context, new AbortController().signal);
    expect(result.status).toBe("COMPLETED");
    if (result.status === "COMPLETED") {
      expect(result.needsMoreHistory).toBe(true);
      expect(result.facts.some((fact) => fact.key === "order.primaryId")).toBe(true);
    }
    expect(Object.keys(source)).not.toEqual(expect.arrayContaining(["submit", "send", "resolve", "transfer"]));
  });

  it.each([["login", "BLOCKED_LOGIN"], ["timeout", "FAILED_TIMEOUT"], ["drift", "FAILED_SELECTOR_DRIFT"]])("types %s", async (state, expected) => {
    expect((await runAlwaysChatIntake({ mode: "READ_ONLY", read: async () => ({ state }) }, context, new AbortController().signal)).status).toBe(expected);
  });
});
