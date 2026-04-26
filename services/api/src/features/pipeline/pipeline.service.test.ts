import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { InMemoryStateStore } from "../../domain/state/store.js";
import { IngestionService } from "../ingestion/ingestion.service.js";
import { MatchService } from "../match/match.service.js";
import { PipelineService } from "./pipeline.service.js";

function makeService() {
  const store = new InMemoryStateStore();
  const ingestionService = new IngestionService(store);
  const matchService = new MatchService(store);
  const pipelineService = new PipelineService(store, ingestionService, matchService);
  return { store, pipelineService };
}

describe("PipelineService.run", () => {
  it("executes consolidated cycle and persists observability evidence", async () => {
    const { store, pipelineService } = makeService();
    const originalFetch = globalThis.fetch;

    globalThis.fetch = async (input: string | URL | globalThis.Request): Promise<Response> => {
      const url = String(input);
      if (!url.includes("remotive.com")) {
        throw new Error(`unexpected URL in test: ${url}`);
      }

      return new Response(
        JSON.stringify({
          jobs: [
            {
              title: "Junior Node Engineer",
              company_name: "Acme",
              url: "https://example.com/jobs/node-junior",
              candidate_required_location: "Remote",
              publication_date: "2026-04-26T00:00:00Z",
              description: "Node.js TypeScript APIs"
            }
          ]
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    };

    try {
      const result = await pipelineService.run({
        source: "remotive",
        keyword: "node",
        shortlistSize: 5,
        includeLlmEnrichment: false
      });

      assert.equal(result.ok, true);
      if (result.ok) {
        assert.equal(result.data.status, "completed");
        assert.equal(result.data.source, "Remotive");
        assert.ok(result.data.collected >= 1);
        assert.ok(result.data.ingested >= 1);
        assert.ok(result.data.shortlist.length >= 1);
        assert.equal(result.data.sourceReports[0]?.mode, "auto");
        assert.equal(result.data.llm.requested, false);
        assert.equal(result.data.budget.cutsApplied.length, 0);
      }

      const runs = await store.listAgentRuns();
      const pipelineRun = runs.find((item) => item.agent === "Pipeline Agent");
      assert.ok(pipelineRun);

      const decisions = await store.listDecisionLogs();
      assert.ok(decisions.some((item) => item.agentRunId === pipelineRun?.id));

      const executions = await store.listSkillExecutions();
      assert.ok(executions.some((item) => item.agentRunId === pipelineRun?.id));
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("keeps response complete under scraper partial failure", async () => {
    const { pipelineService } = makeService();
    const originalFetch = globalThis.fetch;

    globalThis.fetch = async (): Promise<Response> => {
      throw new Error("network timeout");
    };

    try {
      const result = await pipelineService.run({
        source: "remotive",
        shortlistSize: 3
      });

      assert.equal(result.ok, true);
      if (result.ok) {
        assert.equal(result.data.status, "completed-with-warnings");
        assert.ok(result.data.warnings.some((item) => item.includes("scraper:")));
        assert.equal(Array.isArray(result.data.shortlist), true);
      }
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("applies maxSources guardrail when source=all", async () => {
    const { pipelineService } = makeService();
    const originalFetch = globalThis.fetch;

    globalThis.fetch = async (input: string | URL | globalThis.Request): Promise<Response> => {
      const url = String(input);
      if (!url.includes("remotive.com")) {
        throw new Error(`unexpected URL in test: ${url}`);
      }

      return new Response(
        JSON.stringify({
          jobs: [
            {
              title: "Backend Engineer",
              company_name: "Acme",
              url: "https://example.com/jobs/backend",
              candidate_required_location: "Remote",
              publication_date: "2026-04-26T00:00:00Z",
              description: "Node.js TypeScript APIs"
            }
          ]
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    };

    try {
      const result = await pipelineService.run({
        source: "all",
        maxSources: 1,
        includeLlmEnrichment: false
      });

      assert.equal(result.ok, true);
      if (result.ok) {
        assert.equal(result.data.status, "completed-with-warnings");
        assert.equal(result.data.sourceReports.length, 1);
        assert.ok(result.data.warnings.some((item) => item.includes("budget:maxSources")));
        assert.ok(result.data.budget.cutsApplied.includes("max-sources"));
      }
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("applies maxDuration and llm budget cuts without failing cycle", async () => {
    const { pipelineService } = makeService();
    const originalFetch = globalThis.fetch;
    const originalGeminiKey = process.env["GEMINI_API_KEY"];
    process.env["GEMINI_API_KEY"] = "fake-key-for-budget-test";

    globalThis.fetch = async (input: string | URL | globalThis.Request): Promise<Response> => {
      const url = String(input);
      if (!url.includes("remotive.com")) {
        throw new Error(`unexpected URL in test: ${url}`);
      }
      await new Promise((resolve) => setTimeout(resolve, 650));
      return new Response(
        JSON.stringify({
          jobs: [
            {
              title: "Backend Engineer",
              company_name: "Acme",
              url: "https://example.com/jobs/backend-duration",
              candidate_required_location: "Remote",
              publication_date: "2026-04-26T00:00:00Z",
              description: "Node.js TypeScript APIs"
            }
          ]
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    };

    try {
      const result = await pipelineService.run({
        source: "remotive",
        includeLlmEnrichment: true,
        maxLlmJobs: 3,
        maxEstimatedCostUsd: 0,
        maxDurationMs: 500
      });

      assert.equal(result.ok, true);
      if (result.ok) {
        assert.equal(result.data.status, "completed-with-warnings");
        assert.equal(result.data.llm.enabled, false);
        assert.equal(result.data.llm.requested, true);
        assert.ok(result.data.budget.cutsApplied.includes("llm-disabled-budget-zero"));
        assert.ok(
          result.data.budget.cutsApplied.includes("max-duration-after-scrape") ||
          result.data.durationMs > result.data.budget.maxDurationMs
        );
      }
    } finally {
      globalThis.fetch = originalFetch;
      if (originalGeminiKey === undefined) {
        delete process.env["GEMINI_API_KEY"];
      } else {
        process.env["GEMINI_API_KEY"] = originalGeminiKey;
      }
    }
  });
});
