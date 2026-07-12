import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { defaultCaseFlowRules } from "../resolve.service.js";
import { evaluateHeuristics } from "./engine.js";
import type { HeuristicConflict, HeuristicFact } from "./rules.js";
import { applyLowConfidenceTriage } from "./triage.js";

type Fixture = { name: string; text: string; facts: HeuristicFact[]; conflicts: HeuristicConflict[]; expected: { primary: string; secondary?: string[]; lowConfidence?: boolean; missing?: string[]; riskGate?: string; reason?: string } };
const fixturesDirectory = fileURLToPath(new URL("../../../../../../tests/fixtures/caseflow/golden-cases/", import.meta.url));
const fixture = (name: string) => JSON.parse(readFileSync(resolve(fixturesDirectory, name), "utf8")) as Fixture;

describe("CaseFlow heuristic golden cases", () => {
  it.each(["conflict.json", "low-confidence.json", "missing-facts.json", "risk.json"])("matches %s", (file) => {
    const item = fixture(file);
    const result = applyLowConfidenceTriage(evaluateHeuristics(defaultCaseFlowRules, item));
    expect(result.primary?.flowId, item.name).toBe(item.expected.primary);
    if (item.expected.secondary) expect(result.secondary.map(({ flowId }) => flowId)).toEqual(expect.arrayContaining(item.expected.secondary));
    if (item.expected.lowConfidence !== undefined) expect(result.lowConfidence).toBe(item.expected.lowConfidence);
    if (item.expected.missing) expect(result.primary?.missingFactKeys).toEqual(item.expected.missing);
    if (item.expected.riskGate) expect(result.riskGates).toContainEqual(expect.objectContaining({ flowId: item.expected.riskGate, reasons: [item.expected.reason] }));
  });
});
