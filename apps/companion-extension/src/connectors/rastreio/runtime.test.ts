import { describe, expect, it } from "vitest";
import fixture from "./fixtures/result-single.sanitized.json";
import { bestRastreioIdentifier, runRastreio } from "./runtime.js";

describe("Rastreio fake read-only runtime", () => {
  it("uses the documented identifier priority and parses normalized facts", async () => {
    expect(bestRastreioIdentifier({ phone: "3", order: "2", cpf: "1" })).toEqual({ key: "CPF", value: "1" });
    const result = await runRastreio(
      { mode: "READ_ONLY", search: async () => fixture }, { order: "ORDER-DEMO-2001" },
      { caseId: "case-1", runId: "run-rastreio", observedAt: "2026-01-10T10:03:00.000Z" }, new AbortController().signal
    );
    expect(result.status).toBe("COMPLETED");
    if (result.status === "COMPLETED") expect(result.facts.some((fact) => fact.key === "logistics.status")).toBe(true);
  });

  it("keeps login, timeout and drift explicit", async () => {
    const run = (state: string) => runRastreio({ mode: "READ_ONLY", search: async () => ({ state }) }, { order: "o" }, { caseId: "c", runId: "r", observedAt: "2026-01-01T00:00:00Z" }, new AbortController().signal);
    await expect(run("login")).resolves.toMatchObject({ status: "BLOCKED_LOGIN" });
    await expect(run("timeout")).resolves.toMatchObject({ status: "FAILED_TIMEOUT" });
    await expect(run("drift")).resolves.toMatchObject({ status: "FAILED_SELECTOR_DRIFT" });
  });
});
