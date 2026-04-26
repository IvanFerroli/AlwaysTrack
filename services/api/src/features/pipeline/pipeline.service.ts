import type { ApiResult, PipelineRunInput, PipelineRunResult, PipelineShortlistItem, RankedJobPosting } from "@olympus/shared-types";
import type { StateStore } from "../../domain/state/store.js";
import { IngestionService } from "../ingestion/ingestion.service.js";
import { MatchService } from "../match/match.service.js";
import { SCRAPER_SOURCES, runScraper } from "../scraper/scraper.runner.js";

const DEFAULT_SHORTLIST_SIZE = 10;
const MAX_SHORTLIST_SIZE = 20;

function ok<T>(data: T): ApiResult<T> {
  return { ok: true, data };
}

function fail(code: string, message: string): ApiResult<never> {
  return { ok: false, error: { code, message } };
}

function clampInt(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.floor(value)));
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
    const agentRun = await this.store.createAgentRun("Pipeline Agent", "Pipeline");
    const includeLlmEnrichment = input.includeLlmEnrichment === true;
    const shortlistSize = clampInt(input.shortlistSize ?? DEFAULT_SHORTLIST_SIZE, 1, MAX_SHORTLIST_SIZE);
    const keywordRequested = input.keyword?.trim() || undefined;
    let scraperResult:
      | Awaited<ReturnType<typeof runScraper>>
      | undefined;

    try {
      await this.store.createSkillExecution(
        agentRun.id,
        "pipeline-cycle-start",
        "success",
        `source=${sourceKey};shortlistSize=${shortlistSize};llm=${includeLlmEnrichment}`
      );

      try {
        scraperResult = await runScraper(this.ingestionService, sourceKey, keywordRequested, {
          autoDiscard: input.autoDiscard !== false
        });
        if (scraperResult.errors.length > 0) {
          warnings.push(...scraperResult.errors.map((error) => `scraper: ${error}`));
        }
        await this.store.createSkillExecution(
          agentRun.id,
          "pipeline-scrape-run",
          "success",
          `source=${sourceKey};ingested=${scraperResult.ingested};deduplicated=${scraperResult.deduplicated};errors=${scraperResult.errors.length}`
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        warnings.push(`scraper: ${message}`);
        await this.store.createSkillExecution(
          agentRun.id,
          "pipeline-scrape-run",
          "failure",
          `source=${sourceKey};error=${message}`
        );
      }

      const ranked = await this.matchService.listRanked(input.resumeProfileId, {
        q: splitKeyword(scraperResult?.keywordEffective ?? keywordRequested),
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
      const shortlist = toShortlist(rankedItems.slice(0, shortlistSize));
      const llmEnabled = !!process.env["GEMINI_API_KEY"] && includeLlmEnrichment;
      const estimatedCostUsd = llmEnabled ? Number((shortlist.length * 0.002).toFixed(3)) : 0;

      const result: PipelineRunResult = {
        runId: agentRun.id,
        status: warnings.length > 0 ? "completed-with-warnings" : "completed",
        durationMs: Date.now() - startedAt,
        source: scraperResult?.source ?? sourceKey,
        keywordRequested,
        keywordEffective: scraperResult?.keywordEffective,
        collected: scraperResult?.fetched ?? 0,
        parsed: scraperResult?.parsed ?? 0,
        ingested: scraperResult?.ingested ?? 0,
        deduplicated: scraperResult?.deduplicated ?? 0,
        autoDiscarded: scraperResult?.autoDiscarded ?? 0,
        sourceReports: scraperResult?.sourceReports ?? [],
        warnings,
        shortlist,
        llm: {
          enabled: llmEnabled,
          estimatedCostUsd
        }
      };

      await this.store.createDecisionLog(
        agentRun.id,
        "Pipeline cycle executed",
        `source=${result.source};warnings=${warnings.length};shortlist=${shortlist.length};durationMs=${result.durationMs}`
      );
      await this.store.createSkillExecution(
        agentRun.id,
        "pipeline-rank-shortlist",
        "success",
        `shortlist=${shortlist.length};llm=${includeLlmEnrichment};estimatedCostUsd=${estimatedCostUsd}`
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
