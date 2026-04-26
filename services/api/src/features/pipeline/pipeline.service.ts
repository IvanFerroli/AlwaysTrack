import type {
  ApiResult,
  PipelineRunInput,
  PipelineRunResult,
  PipelineShortlistItem,
  PipelineSourceReport,
  RankedJobPosting
} from "@olympus/shared-types";
import type { StateStore } from "../../domain/state/store.js";
import { IngestionService } from "../ingestion/ingestion.service.js";
import { MatchService } from "../match/match.service.js";
import { SCRAPER_SOURCES, runScraper } from "../scraper/scraper.runner.js";
import type { ScraperRunResult, ScraperSourceConfig } from "../scraper/scraper.types.js";

const DEFAULT_SHORTLIST_SIZE = 10;
const MAX_SHORTLIST_SIZE = 20;
const ESTIMATED_LLM_JOB_COST_USD = 0.002;

const DEFAULT_MAX_LLM_JOBS = 3;
const DEFAULT_MAX_DURATION_MS = 20_000;
const DEFAULT_MAX_SOURCES = 8;
const DEFAULT_MAX_ESTIMATED_COST_USD = 0.02;

interface BudgetLimits {
  maxLlmJobs: number;
  maxDurationMs: number;
  maxSources: number;
  maxEstimatedCostUsd: number;
}

function ok<T>(data: T): ApiResult<T> {
  return { ok: true, data };
}

function fail(code: string, message: string): ApiResult<never> {
  return { ok: false, error: { code, message } };
}

function clampInt(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.floor(value)));
}

function envInt(name: string, fallback: number, min: number, max: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

function envNumber(name: string, fallback: number, min: number, max: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number.parseFloat(raw);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

function resolveBudgetLimits(input: PipelineRunInput): BudgetLimits {
  return {
    maxLlmJobs: clampInt(
      input.maxLlmJobs ?? envInt("PIPELINE_MAX_LLM_JOBS", DEFAULT_MAX_LLM_JOBS, 0, 20),
      0,
      20
    ),
    maxDurationMs: clampInt(
      input.maxDurationMs ?? envInt("PIPELINE_MAX_DURATION_MS", DEFAULT_MAX_DURATION_MS, 500, 120_000),
      500,
      120_000
    ),
    maxSources: clampInt(
      input.maxSources ?? envInt("PIPELINE_MAX_SOURCES", DEFAULT_MAX_SOURCES, 1, 20),
      1,
      20
    ),
    maxEstimatedCostUsd: Number(
      (
        input.maxEstimatedCostUsd ??
        envNumber("PIPELINE_MAX_ESTIMATED_COST_USD", DEFAULT_MAX_ESTIMATED_COST_USD, 0, 5)
      ).toFixed(3)
    )
  };
}

function buildShortRationale(job: RankedJobPosting): string {
  const topSkills = job.matchedSkills.slice(0, 3);
  const skillsPart =
    topSkills.length > 0
      ? `skills: ${topSkills.join(", ")}`
      : "sem skills explícitas do profile";
  const llmPart = job.llmEnrichment ? `; LLM(${job.llmEnrichment.provider}) conf=${job.llmEnrichment.confidence.toFixed(2)}` : "";
  return `score ${job.score}% (${skillsPart})${llmPart}`;
}

function toShortlist(items: RankedJobPosting[]): PipelineShortlistItem[] {
  return items.map((job) => ({
    jobPostingId: job.id,
    title: job.title,
    companyName: job.companyName,
    sourceName: job.sourceName,
    score: job.score,
    matchedSkills: job.matchedSkills.slice(0, 8),
    rationale: buildShortRationale(job)
  }));
}

function splitKeyword(keyword?: string): string[] | undefined {
  const trimmed = keyword?.trim();
  if (!trimmed) return undefined;
  const terms = trimmed
    .split(/\s+/)
    .map((term) => term.trim())
    .filter(Boolean);
  return terms.length > 0 ? terms : undefined;
}

function sourceMode(source: ScraperSourceConfig): "auto" | "fallback" | "blocked" {
  if (source.mode) return source.mode;
  if (source.format === "unavailable-platform") return "fallback";
  return "auto";
}

function fallbackReportForSource(sourceKey: string, message: string): PipelineSourceReport {
  const source = SCRAPER_SOURCES[sourceKey];
  return {
    name: source?.name ?? sourceKey,
    mode: source ? sourceMode(source) : "blocked",
    latencyMs: 0,
    fetched: 0,
    parsed: 0,
    ingested: 0,
    deduplicated: 0,
    discarded: 0,
    fallbackMethod: source?.fallbackMethod,
    note: source?.unavailableReason,
    errors: [message]
  };
}

async function runScraperWithSourceLimit(
  ingestionService: IngestionService,
  sourceKey: string,
  keywordRequested: string | undefined,
  autoDiscard: boolean,
  maxSources: number,
  warnings: string[],
  cutsApplied: string[]
): Promise<ScraperRunResult> {
  if (sourceKey !== "all") {
    return runScraper(ingestionService, sourceKey, keywordRequested, { autoDiscard });
  }

  const defaultSourceKeys = Object.entries(SCRAPER_SOURCES)
    .filter(([, source]) => source.enabledByDefault !== false)
    .map(([key]) => key);

  const selectedKeys = defaultSourceKeys.slice(0, maxSources);
  if (selectedKeys.length < defaultSourceKeys.length) {
    warnings.push(`budget:maxSources limited from ${defaultSourceKeys.length} to ${selectedKeys.length}`);
    cutsApplied.push("max-sources");
  }

  const reports: PipelineSourceReport[] = [];
  const errors: string[] = [];
  let fetched = 0;
  let parsed = 0;
  let ingested = 0;
  let deduplicated = 0;
  let autoDiscarded = 0;
  let keywordEffective: string | undefined;

  for (const key of selectedKeys) {
    try {
      const result = await runScraper(ingestionService, key, keywordRequested, { autoDiscard });
      fetched += result.fetched;
      parsed += result.parsed;
      ingested += result.ingested;
      deduplicated += result.deduplicated;
      autoDiscarded += result.autoDiscarded;
      errors.push(...result.errors);
      if (!keywordEffective && result.keywordEffective) {
        keywordEffective = result.keywordEffective;
      }
      reports.push(...(result.sourceReports ?? []));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(message);
      reports.push(fallbackReportForSource(key, message));
    }
  }

  return {
    source: "All Sources",
    fetched,
    parsed,
    ingested,
    deduplicated,
    autoDiscarded,
    keywordRequested,
    keywordEffective,
    errors,
    sourceReports: reports,
    sources: reports
  };
}

export class PipelineService {
  constructor(
    private readonly store: StateStore,
    private readonly ingestionService: IngestionService,
    private readonly matchService: MatchService
  ) {}

  async run(input: PipelineRunInput): Promise<ApiResult<PipelineRunResult>> {
    const sourceKey = (input.source?.trim() || "all").toLowerCase();
    const sourceKnown = sourceKey === "all" || Object.hasOwn(SCRAPER_SOURCES, sourceKey);
    if (!sourceKnown) {
      return fail("INVALID_PIPELINE_SOURCE", `Unknown source "${sourceKey}"`);
    }

    const startedAt = Date.now();
    const warnings: string[] = [];
    const cutsApplied: string[] = [];
    const limits = resolveBudgetLimits(input);
    const agentRun = await this.store.createAgentRun("Pipeline Agent", "Pipeline");
    const includeLlmRequested = input.includeLlmEnrichment === true;
    const shortlistSize = clampInt(input.shortlistSize ?? DEFAULT_SHORTLIST_SIZE, 1, MAX_SHORTLIST_SIZE);
    const keywordRequested = input.keyword?.trim() || undefined;

    try {
      await this.store.createSkillExecution(
        agentRun.id,
        "pipeline-cycle-start",
        "success",
        `source=${sourceKey};shortlistSize=${shortlistSize};llmRequested=${includeLlmRequested};maxLlmJobs=${limits.maxLlmJobs};maxDurationMs=${limits.maxDurationMs};maxSources=${limits.maxSources};maxEstimatedCostUsd=${limits.maxEstimatedCostUsd}`
      );

      const scraperResult = await runScraperWithSourceLimit(
        this.ingestionService,
        sourceKey,
        keywordRequested,
        input.autoDiscard !== false,
        limits.maxSources,
        warnings,
        cutsApplied
      );

      if (scraperResult.errors.length > 0) {
        warnings.push(...scraperResult.errors.map((error) => `scraper: ${error}`));
      }

      await this.store.createSkillExecution(
        agentRun.id,
        "pipeline-scrape-run",
        "success",
        `source=${sourceKey};ingested=${scraperResult.ingested};deduplicated=${scraperResult.deduplicated};errors=${scraperResult.errors.length}`
      );

      const elapsedAfterScrape = Date.now() - startedAt;
      const maxJobsByCost = Math.floor(limits.maxEstimatedCostUsd / ESTIMATED_LLM_JOB_COST_USD);
      const effectiveMaxLlmJobs = Math.max(0, Math.min(limits.maxLlmJobs, maxJobsByCost));

      let includeLlmEnrichment = includeLlmRequested;
      if (includeLlmRequested && !process.env["GEMINI_API_KEY"]) {
        includeLlmEnrichment = false;
        warnings.push("budget: LLM requested but GEMINI_API_KEY is not configured");
        cutsApplied.push("llm-disabled-no-api-key");
      }
      if (includeLlmRequested && process.env["GEMINI_API_KEY"] && effectiveMaxLlmJobs <= 0) {
        includeLlmEnrichment = false;
        warnings.push("budget: LLM disabled because maxEstimatedCostUsd/maxLlmJobs reached zero capacity");
        cutsApplied.push("llm-disabled-budget-zero");
      }
      if (elapsedAfterScrape > limits.maxDurationMs) {
        warnings.push(`budget:maxDurationMs exceeded after scrape (${elapsedAfterScrape}ms > ${limits.maxDurationMs}ms)`);
        cutsApplied.push("max-duration-after-scrape");
      }

      let shortlist: PipelineShortlistItem[] = [];
      let estimatedLlmJobs = 0;
      let estimatedCostUsd = 0;

      if (elapsedAfterScrape <= limits.maxDurationMs) {
        const previousLlmMaxJobs = process.env["LLM_ENRICHMENT_MAX_JOBS_PER_ROUND"];
        if (includeLlmEnrichment) {
          process.env["LLM_ENRICHMENT_MAX_JOBS_PER_ROUND"] = String(effectiveMaxLlmJobs);
        }

        try {
          const ranked = await this.matchService.listRanked(input.resumeProfileId, {
            q: splitKeyword(scraperResult.keywordEffective ?? keywordRequested),
            includeLlmEnrichment,
            minScore: input.minScore,
            page: 1,
            pageSize: shortlistSize
          });

          if (!ranked.ok) {
            warnings.push(`ranking: ${ranked.error.message}`);
            await this.store.createSkillExecution(
              agentRun.id,
              "pipeline-rank-shortlist",
              "failure",
              `error=${ranked.error.code}`
            );
          }

          const rankedItems = ranked.ok ? ranked.data.items : [];
          shortlist = toShortlist(rankedItems.slice(0, shortlistSize));
          estimatedLlmJobs = rankedItems
            .filter((item) => item.llmEnrichment?.provider === "gemini")
            .slice(0, effectiveMaxLlmJobs)
            .length;
          estimatedCostUsd = includeLlmEnrichment
            ? Number((estimatedLlmJobs * ESTIMATED_LLM_JOB_COST_USD).toFixed(3))
            : 0;
        } finally {
          if (includeLlmEnrichment) {
            if (previousLlmMaxJobs === undefined) {
              delete process.env["LLM_ENRICHMENT_MAX_JOBS_PER_ROUND"];
            } else {
              process.env["LLM_ENRICHMENT_MAX_JOBS_PER_ROUND"] = previousLlmMaxJobs;
            }
          }
        }
      } else {
        await this.store.createSkillExecution(
          agentRun.id,
          "pipeline-rank-shortlist",
          "failure",
          `skipped=duration-limit;elapsedMs=${elapsedAfterScrape};maxDurationMs=${limits.maxDurationMs}`
        );
      }

      const result: PipelineRunResult = {
        runId: agentRun.id,
        status: warnings.length > 0 ? "completed-with-warnings" : "completed",
        durationMs: Date.now() - startedAt,
        source: scraperResult.source,
        keywordRequested,
        keywordEffective: scraperResult.keywordEffective,
        collected: scraperResult.fetched,
        parsed: scraperResult.parsed,
        ingested: scraperResult.ingested,
        deduplicated: scraperResult.deduplicated,
        autoDiscarded: scraperResult.autoDiscarded,
        sourceReports: scraperResult.sourceReports ?? [],
        warnings,
        shortlist,
        llm: {
          enabled: includeLlmEnrichment && !!process.env["GEMINI_API_KEY"],
          requested: includeLlmRequested,
          maxJobs: effectiveMaxLlmJobs,
          estimatedJobs: estimatedLlmJobs,
          estimatedCostUsd
        },
        budget: {
          maxLlmJobs: limits.maxLlmJobs,
          maxDurationMs: limits.maxDurationMs,
          maxSources: limits.maxSources,
          maxEstimatedCostUsd: limits.maxEstimatedCostUsd,
          cutsApplied: [...new Set(cutsApplied)]
        }
      };

      if (result.budget.cutsApplied.length > 0) {
        await this.store.createDecisionLog(
          agentRun.id,
          "Pipeline budget cuts applied",
          `cuts=${result.budget.cutsApplied.join(",")};warnings=${warnings.length}`
        );
        await this.store.createSkillExecution(
          agentRun.id,
          "pipeline-budget-guardrails",
          "success",
          `cuts=${result.budget.cutsApplied.join(",")}`
        );
      }

      await this.store.createDecisionLog(
        agentRun.id,
        "Pipeline cycle executed",
        `source=${result.source};warnings=${warnings.length};shortlist=${shortlist.length};durationMs=${result.durationMs}`
      );
      await this.store.createSkillExecution(
        agentRun.id,
        "pipeline-rank-shortlist",
        "success",
        `shortlist=${shortlist.length};llmRequested=${includeLlmRequested};llmEnabled=${result.llm.enabled};estimatedCostUsd=${estimatedCostUsd}`
      );
      await this.store.completeAgentRun(agentRun.id, "completed");
      return ok(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await this.store.createDecisionLog(agentRun.id, "Pipeline cycle failed", message);
      await this.store.createSkillExecution(agentRun.id, "pipeline-cycle-failed", "failure", message);
      await this.store.completeAgentRun(agentRun.id, "failed");
      return fail("PIPELINE_RUN_FAILED", message);
    }
  }
}
