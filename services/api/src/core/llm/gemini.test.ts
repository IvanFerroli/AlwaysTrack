import { strict as assert } from "node:assert";
import test from "node:test";
import { analyzeJobPostingWithLLM } from "./gemini.js";

test("analyzeJobPostingWithLLM returns typed enrichment from valid JSON", async () => {
  const result = await analyzeJobPostingWithLLM(
    "Senior Node Engineer",
    "Remote role with Node.js and TypeScript",
    {
      timeoutMs: 2000,
      generateText: async () => JSON.stringify({
        normalizedSkills: ["node", "typescript", "node"],
        seniority: "senior",
        language: "en",
        workModel: "remote",
        confidence: 0.87,
        signals: ["title:senior", "skills:node+ts"]
      })
    }
  );

  assert.equal(result.provider, "gemini");
  assert.deepEqual(result.normalizedSkills, ["node", "typescript"]);
  assert.equal(result.seniority, "senior");
  assert.equal(result.workModel, "remote");
  assert.equal(result.confidence, 0.87);
});

test("analyzeJobPostingWithLLM falls back on invalid JSON", async () => {
  const result = await analyzeJobPostingWithLLM(
    "Vaga Desenvolvedor Pleno React",
    "Modelo híbrido e requisitos de React",
    {
      timeoutMs: 2000,
      generateText: async () => "{not-valid-json"
    }
  );

  assert.equal(result.provider, "fallback");
  assert.equal(result.seniority, "mid");
  assert.equal(result.workModel, "hybrid");
  assert.equal(result.signals.some((item) => item.startsWith("fallback:")), true);
});

test("analyzeJobPostingWithLLM falls back on timeout", async () => {
  const result = await analyzeJobPostingWithLLM(
    "Principal Architect",
    "On-site position with Java",
    {
      timeoutMs: 1000,
      generateText: async () => {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        return "{}";
      }
    }
  );

  assert.equal(result.provider, "fallback");
  assert.equal(result.signals.some((item) => item.includes("timed out")), true);
});

test("analyzeJobPostingWithLLM falls back when API key is missing", async () => {
  const previous = process.env["GEMINI_API_KEY"];
  delete process.env["GEMINI_API_KEY"];

  try {
    const result = await analyzeJobPostingWithLLM(
      "Junior Backend Developer",
      "Remote role with Node and PostgreSQL"
    );
    assert.equal(result.provider, "fallback");
    assert.equal(result.signals.includes("fallback:missing-api-key"), true);
  } finally {
    if (previous) {
      process.env["GEMINI_API_KEY"] = previous;
    }
  }
});
