import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parseCorreiosReverseResult, correiosReverseResultToEvidenceFacts } from "./correios-reversa.js";
import { parseJtVipResult, jtVipResultToEvidenceFacts } from "./jt-vip.js";
import { parseLancadorQueryResult, lancadorQueryResultToEvidenceFacts } from "./lancador.js";
import { parseLoggiResult, loggiResultToEvidenceFacts } from "./loggi.js";
import { parseOmieResult, omieResultToEvidenceFacts } from "./omie.js";
import { connectorDefinitions, createConnectorRegistry } from "./registry.js";
import { parseYampiResult, yampiResultToEvidenceFacts } from "./yampi.js";

const fixtureRoot = fileURLToPath(new URL("../../../../apps/companion-extension/src/connectors/", import.meta.url));
const fixture = (path: string) => JSON.parse(readFileSync(`${fixtureRoot}${path}`, "utf8")) as unknown;
const context = { caseId: "case-synthetic", runId: "run-synthetic", observedAt: "2026-07-12T10:00:00Z" };
const keys = (facts: ReturnType<typeof yampiResultToEvidenceFacts>) => facts.map((fact) => fact.key);

describe("declarative connector registry", () => {
  it("registers every requested connector without executable or credential fields", () => {
    expect([...createConnectorRegistry().keys()]).toEqual(["yampi", "omie-filial", "omie-pharma", "loggi", "jt-vip", "correios-reversa", "lancador-pedidos"]);
    for (const definition of connectorDefinitions) {
      expect(definition).not.toHaveProperty("execute");
      expect(definition).not.toHaveProperty("credentials");
      expect(definition.capabilities).not.toContain("SUBMIT");
      expect(definition.fixtures.every((item) => existsSync(`${fixtureRoot}${item.file}`))).toBe(true);
    }
  });

  it("keeps Pharma stricter than Filial and rejects duplicate ids", () => {
    const filial = connectorDefinitions.find((item) => item.id === "omie-filial")!;
    const pharma = connectorDefinitions.find((item) => item.id === "omie-pharma")!;
    expect(pharma.riskLevel).toBe("CRITICAL");
    expect(pharma.forbiddenCapabilities).toEqual(expect.arrayContaining(["CHANGE_PAYMENT", "CANCEL_ORDER"]));
    expect(filial.forbiddenCapabilities).not.toContain("CANCEL_ORDER");
    expect(() => createConnectorRegistry([filial, filial])).toThrow("Duplicate connector id");
  });
});

describe("Yampi parser", () => {
  it("preserves not-found as source absence and parses multiple purchase details", () => {
    expect(parseYampiResult(fixture("yampi/fixtures/result-empty.sanitized.json")).outcome).toBe("NOT_FOUND_IN_SOURCE");
    const result = parseYampiResult(fixture("yampi/fixtures/result-multiple.sanitized.json"));
    expect(result.records).toHaveLength(2);
    expect(keys(yampiResultToEvidenceFacts(result, context))).toEqual(expect.arrayContaining(["order.cashback", "order.upsell", "payment.boleto"]));
  });
});

describe("OMIE base parser", () => {
  it("uses one parser with distinct Filial and Pharma evidence sources", () => {
    const filial = omieResultToEvidenceFacts(parseOmieResult(fixture("omie/fixtures/filial.sanitized.json")), context);
    const pharma = omieResultToEvidenceFacts(parseOmieResult(fixture("omie/fixtures/pharma.sanitized.json")), context);
    expect(filial[0]?.sourceSystem).toBe("omie-filial");
    expect(pharma[0]?.sourceSystem).toBe("omie-pharma");
    expect(keys(filial)).toContain("invoice.danfeAvailable");
    expect(parseOmieResult(fixture("omie/fixtures/unexpected-page.sanitized.json")).outcome).toBe("FAILED_UNEXPECTED_PAGE");
  });
});

describe("logistics parsers", () => {
  it("normalizes Loggi delivery, return, empty and timeout independently", () => {
    const found = parseLoggiResult(fixture("loggi/fixtures/result-multiple.sanitized.json"));
    expect(found.records).toHaveLength(2);
    expect(keys(loggiResultToEvidenceFacts(found, context))).toEqual(expect.arrayContaining(["logistics.proof", "logistics.returnState"]));
    expect(parseLoggiResult(fixture("loggi/fixtures/result-empty.sanitized.json")).outcome).toBe("NOT_FOUND_IN_SOURCE");
    expect(parseLoggiResult(fixture("loggi/fixtures/timeout.sanitized.json")).outcome).toBe("FAILED_TIMEOUT");
  });

  it.each([["login", "BLOCKED_LOGIN"], ["captcha", "BLOCKED_CAPTCHA"], ["result-empty", "NOT_FOUND_IN_SOURCE"], ["timeout", "FAILED_TIMEOUT"]])("types J&T %s", (name, outcome) => {
    expect(parseJtVipResult(fixture(`jt-vip/fixtures/${name}.sanitized.json`)).outcome).toBe(outcome);
  });

  it("normalizes J&T tickets, attempts and multiple shipments", () => {
    const result = parseJtVipResult(fixture("jt-vip/fixtures/result-multiple.sanitized.json"));
    expect(result.records).toHaveLength(2);
    expect(keys(jtVipResultToEvidenceFacts(result, context))).toEqual(expect.arrayContaining(["treatment.openTickets", "logistics.retries"]));
  });
});

describe("Correios/Reversa parser", () => {
  it.each([["login", "BLOCKED_LOGIN"], ["2fa", "BLOCKED_2FA"], ["result-empty", "NOT_FOUND_IN_SOURCE"]])("types %s", (name, outcome) => {
    expect(parseCorreiosReverseResult(fixture(`correios-reversa/fixtures/${name}.sanitized.json`)).outcome).toBe(outcome);
  });
  it("normalizes multiple reverse states", () => {
    const result = parseCorreiosReverseResult(fixture("correios-reversa/fixtures/result-multiple.sanitized.json"));
    expect(result.records).toHaveLength(2);
    expect(keys(correiosReverseResultToEvidenceFacts(result, context))).toEqual(expect.arrayContaining(["treatment.reverseCode", "treatment.reverseValidity", "logistics.returnState"]));
  });
});

describe("Lancador query parser", () => {
  it("keeps query data separate from the draft contract", () => {
    const result = parseLancadorQueryResult(fixture("lancador/fixtures/result-multiple.sanitized.json"));
    expect(result.records).toHaveLength(2);
    expect(result.records[0]).not.toHaveProperty("reason");
    expect(keys(lancadorQueryResultToEvidenceFacts(result, context))).toEqual(expect.arrayContaining(["order.manualId", "order.responsible", "payment.method"]));
    expect(parseLancadorQueryResult(fixture("lancador/fixtures/result-empty.sanitized.json")).outcome).toBe("NOT_FOUND_IN_SOURCE");
  });
});

describe("shared parser envelope", () => {
  it("rejects records on a blocked state and empty FOUND results", () => {
    expect(() => parseYampiResult({ outcome: "BLOCKED_LOGIN", records: [{}] })).toThrow(TypeError);
    expect(() => parseYampiResult({ outcome: "FOUND", records: [] })).toThrow(TypeError);
    expect(() => parseYampiResult({ outcome: "UNKNOWN", records: [] })).toThrow(TypeError);
  });
});
