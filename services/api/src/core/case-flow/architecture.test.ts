import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const caseFlowRoot = dirname(fileURLToPath(import.meta.url));
const coreFiles = ["heuristics/engine.ts", "heuristics/rules.ts", "heuristics/text.ts", "heuristics/triage.ts", "plan-compiler.ts"];

describe("CaseFlow architecture", () => {
  it("keeps the deterministic core independent from AI providers and credentials", () => {
    for (const relativePath of coreFiles) {
      const source = readFileSync(join(caseFlowRoot, relativePath), "utf8");
      expect(source, relativePath).not.toMatch(/OPENAI|ANTHROPIC|CHATGPT|DOCUMENT_AI|document-ai|fetch\s*\(/i);
    }
  });
});
