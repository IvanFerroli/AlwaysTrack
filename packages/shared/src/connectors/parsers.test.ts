import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { alwaysChatIntakeToEvidenceFacts, parseAlwaysChatIntake } from "./alwayschat.js";
import { parseRastreioSearchResult, rastreioResultToEvidenceFacts } from "./rastreio.js";

const fixture = (path: string) => JSON.parse(readFileSync(fileURLToPath(new URL(`../../../../apps/companion-extension/src/connectors/${path}`, import.meta.url)), "utf8")) as unknown;
const context = { caseId: "case-demo", runId: "run-demo", observedAt: "2026-01-10T10:05:00.000Z" };

describe("AlwaysChat parser", () => {
  it("parses the complete sanitized intake and normalizes its core facts", () => {
    const intake = parseAlwaysChatIntake(fixture("alwayschat/fixtures/intake-complete.sanitized.json"));
    expect(intake.history).toHaveLength(1);
    expect(intake.visibleAttachments[0]?.mediaType).toBe("application/pdf");
    expect(alwaysChatIntakeToEvidenceFacts(intake, context).map((fact) => fact.key)).toContain("conversation.intentText");
  });

  it("rejects an intake without the required conversation identity", () => {
    expect(() => parseAlwaysChatIntake({ conversation: {}, customer: {} })).toThrow(TypeError);
  });
});

describe("Rastreio parser", () => {
  it("represents an empty source result without throwing", () => {
    expect(parseRastreioSearchResult(fixture("rastreio/fixtures/result-empty.sanitized.json"))).toEqual({ outcome: "NOT_FOUND_IN_SOURCE", searchedBy: "CPF", orders: [] });
  });

  it("preserves movements, reshipments and delivery from a single result", () => {
    const result = parseRastreioSearchResult(fixture("rastreio/fixtures/result-single.sanitized.json"));
    expect(result.outcome).toBe("FOUND");
    if (result.outcome !== "FOUND") throw new Error("Expected fixture to be found");
    expect(result.orders[0]?.movements).toHaveLength(2);
    expect(result.orders[0]?.reshipments).toHaveLength(1);
    expect(result.orders[0]?.delivery?.receiver).toBe("Recebedor Exemplo");
    const keys = rastreioResultToEvidenceFacts(result, context).map((fact) => fact.key);
    expect(keys).toEqual(expect.arrayContaining(["logistics.events", "logistics.reshipment", "logistics.deliveredAt"]));
  });

  it("parses multiple recent orders", () => {
    const result = parseRastreioSearchResult(fixture("rastreio/fixtures/result-multiple.sanitized.json"));
    expect(result.orders).toHaveLength(2);
  });
});
