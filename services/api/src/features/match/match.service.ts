import type {
  ApiResult,
  JobPostingLLMEnrichment,
  ListPayload,
  JobSeniority,
  JobUserStatus,
  MatchScoreInput,
  MatchScoreResult,
  RankedJobPosting
} from "@olympus/shared-types";
import { computeMatchScore, computeSkillOverlap, computeWeightedMatchScore } from "../../domain/matching/scoring.js";
import { inferJobSeniority, inferProfileSeniority, seniorityDistance, withSeniorityTag } from "../../domain/matching/seniority.js";
import type { StateStore } from "../../domain/state/store.js";
import { analyzeJobMatch, analyzeJobPostingWithLLM } from "../../core/llm/gemini.js";

export interface JobFilterOptions {
  q?: string[];
  minScore?: number;
  status?: JobUserStatus[];
  tags?: string[];
  location?: string[];
  sourceName?: string[];
  seniority?: JobSeniority[];
  sortByDate?: "none" | "newest" | "oldest";
  page?: number;
  pageSize?: number;
  includeScoreBreakdown?: boolean;
  includeLlmEnrichment?: boolean;
}

function keywordHitCount(job: Pick<RankedJobPosting, "title" | "companyName" | "location" | "sourceName" | "description">, terms: string[]): number {
  if (terms.length === 0) return 0;
  const haystack = `${job.title} ${job.companyName} ${job.location ?? ""} ${job.sourceName} ${job.description}`.toLowerCase();
  const title = job.title.toLowerCase();
  let hits = 0;
  for (const term of terms) {
    if (title.includes(term)) {
      hits += 3;
      continue;
    }
    if (haystack.includes(term)) {
      hits += 1;
    }
  }
  return hits;
}

function ok<T>(data: T): ApiResult<T> {
  return { ok: true, data };
}

function fail(code: string, message: string): ApiResult<never> {
  return { ok: false, error: { code, message } };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function envInt(name: string, fallback: number, min: number, max: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

export class MatchService {
  constructor(private readonly store: StateStore) {}

  private enrichmentKey(jobId: string): string {
    return `job-enrichment:${jobId}`;
  }

  private parseEnrichment(raw: string): JobPostingLLMEnrichment | undefined {
    try {
      const parsed = JSON.parse(raw) as Partial<JobPostingLLMEnrichment>;
      if (!parsed || typeof parsed !== "object") return undefined;
      if (!Array.isArray(parsed.normalizedSkills)) return undefined;
      if (!parsed.seniority || !parsed.language || !parsed.workModel || typeof parsed.confidence !== "number") return undefined;
      if (!Array.isArray(parsed.signals) || !parsed.provider || typeof parsed.latencyMs !== "number" || !parsed.generatedAt) return undefined;
      return parsed as JobPostingLLMEnrichment;
    } catch {
      return undefined;
    }
  }

  private async loadPersistedEnrichmentByJobId(): Promise<Map<string, JobPostingLLMEnrichment>> {
    const entries = await this.store.listMemoryEntries();
    const map = new Map<string, JobPostingLLMEnrichment>();
    for (const entry of entries) {
      if (entry.type !== "STRATEGY_HINT") continue;
      if (!entry.key.startsWith("job-enrichment:")) continue;
      const jobId = entry.key.slice("job-enrichment:".length);
      if (!jobId || map.has(jobId)) continue;
      const parsed = this.parseEnrichment(entry.value);
      if (!parsed) continue;
      map.set(jobId, parsed);
    }
    return map;
  }

  private async persistEnrichment(jobId: string, enrichment: JobPostingLLMEnrichment): Promise<void> {
    await this.store.createMemoryEntry({
      type: "STRATEGY_HINT",
      key: this.enrichmentKey(jobId),
      value: JSON.stringify(enrichment),
      tags: ["llm-enrichment", `job:${jobId}`, `provider:${enrichment.provider}`]
    });
  }

  private async ensureLlmEnrichment(
    jobs: Array<Pick<RankedJobPosting, "id" | "title" | "description">>,
    includeLlmEnrichment: boolean
  ): Promise<Map<string, JobPostingLLMEnrichment>> {
    if (!includeLlmEnrichment) {
      return new Map();
    }

    const persisted = await this.loadPersistedEnrichmentByJobId();
    const timeoutMs = envInt("LLM_ENRICHMENT_TIMEOUT_MS", 6000, 1000, 30000);
    const maxJobs = envInt("LLM_ENRICHMENT_MAX_JOBS_PER_ROUND", 3, 0, 20);

    let processed = 0;
    for (const job of jobs) {
      if (persisted.has(job.id)) continue;
      if (processed >= maxJobs) break;
      processed += 1;

      const enrichment = await analyzeJobPostingWithLLM(job.title, job.description, { timeoutMs });
      persisted.set(job.id, enrichment);
      await this.persistEnrichment(job.id, enrichment);
    }

    return persisted;
  }

  async score(input: MatchScoreInput): Promise<ApiResult<MatchScoreResult>> {
    const jobPosting = await this.store.findJobPostingById(input.jobPostingId);
    if (!jobPosting) {
      return fail("JOB_POSTING_NOT_FOUND", `Job posting ${input.jobPostingId} not found`);
    }

    const { normalizedSkills, matchedSkills, missingSkills } = computeSkillOverlap(
      input.resumeProfile.skills,
      jobPosting.normalizedTokens
    );
    const score = computeMatchScore(matchedSkills.length, input.resumeProfile.headline, jobPosting.title, matchedSkills);

    const agentRun = await this.store.createAgentRun("Match Agent", "Match");
    const result: MatchScoreResult = {
      jobPostingId: jobPosting.id,
      score,
      matchedSkills,
      missingSkills,
      rationale: `Matched ${matchedSkills.length} of ${normalizedSkills.length} provided skills against normalized job tokens`
    };

    await this.store.createDecisionLog(agentRun.id, "Match score computed", result.rationale);
    await this.store.createSkillExecution(
      agentRun.id,
      "match-score-v1",
      "success",
      `posting=${jobPosting.id};score=${score}`
    );
    await this.store.completeAgentRun(agentRun.id, "completed");

    return ok(result);
  }

  async deepScore(input: MatchScoreInput): Promise<ApiResult<MatchScoreResult>> {
    const jobPosting = await this.store.findJobPostingById(input.jobPostingId);
    if (!jobPosting) {
      return fail("JOB_POSTING_NOT_FOUND", `Job posting ${input.jobPostingId} not found`);
    }

    const hasApiKey = !!process.env["GEMINI_API_KEY"];
    if (!hasApiKey) {
      return fail("MISSING_API_KEY", "A avaliação profunda (Deep Score) requer a variável GEMINI_API_KEY.");
    }

    const { score, rationale } = await analyzeJobMatch(
      input.resumeProfile.headline,
      input.resumeProfile.skills,
      jobPosting.title,
      jobPosting.description
    );

    const agentRun = await this.store.createAgentRun("Match Agent (LLM)", "DeepMatch");
    const result: MatchScoreResult = {
      jobPostingId: jobPosting.id,
      score,
      matchedSkills: [],
      missingSkills: [],
      rationale: `[Deep AI Analysis]: ${rationale}`
    };

    await this.store.createDecisionLog(agentRun.id, "LLM Deep Score computed", result.rationale);
    await this.store.createSkillExecution(
      agentRun.id,
      "deep-match-score-v1",
      "success",
      `posting=${jobPosting.id};score=${score}`
    );
    await this.store.completeAgentRun(agentRun.id, "completed");

    return ok(result);
  }

  async listRanked(
    resumeProfileId?: string,
    filters?: JobFilterOptions
  ): Promise<ApiResult<ListPayload<RankedJobPosting>>> {
    const sortByDate = filters?.sortByDate ?? "none";
    const page = filters?.page ?? 1;
    const pageSize = filters?.pageSize ?? 20;
    const queryTerms = filters?.q?.map((term) => term.toLowerCase()) ?? [];
    let jobs = (await this.store.listJobPostings()).map((job) => {
      const seniority = inferJobSeniority(job);
      return {
        ...job,
        seniority,
        tags: withSeniorityTag(job.tags, seniority)
      };
    });

    if (filters) {
      if (filters.status && filters.status.length > 0) {
        jobs = jobs.filter(j => filters.status!.includes(j.userStatus));
      }
      if (filters.seniority && filters.seniority.length > 0) {
        jobs = jobs.filter((j) => filters.seniority!.includes(j.seniority));
      }
      if (filters.tags && filters.tags.length > 0) {
        jobs = jobs.filter(j => filters.tags!.some(tag => {
          const lowerTag = tag.toLowerCase();
          return j.tags.some((item) => item.toLowerCase() === lowerTag) || j.normalizedTokens.includes(lowerTag);
        }));
      }
      if (filters.location && filters.location.length > 0) {
        const locations = filters.location.map((item) => item.toLowerCase());
        jobs = jobs.filter(j => j.location && locations.some((loc) => j.location!.toLowerCase().includes(loc)));
      }
      if (filters.sourceName && filters.sourceName.length > 0) {
        const sources = filters.sourceName.map((item) => item.toLowerCase());
        jobs = jobs.filter(j => sources.some((sourceName) => j.sourceName.toLowerCase().includes(sourceName)));
      }
      if (filters.q && filters.q.length > 0) {
        const terms = filters.q.map((item) => item.toLowerCase());
        jobs = jobs.filter(j => {
          const haystack = `${j.title} ${j.companyName} ${j.location ?? ""} ${j.sourceName} ${j.description}`.toLowerCase();
          return terms.every((term) => haystack.includes(term));
        });
      }
    }

    const profiles = await this.store.listResumeProfiles();
    const profile = resumeProfileId
      ? profiles.find((p) => p.id === resumeProfileId)
      : profiles.find((p) => p.id === "resume-000001") ?? profiles[0];

    if (!profile || jobs.length === 0) {
      let unranked: RankedJobPosting[] = jobs.map((j) => ({ ...j, score: 0, matchedSkills: [] }));
      if (filters?.minScore && filters.minScore > 0) {
        unranked = unranked.filter(j => j.score >= filters.minScore!);
      }
      if (sortByDate !== "none") {
        const sortDirection = sortByDate === "oldest" ? 1 : -1;
        const timestamp = (date: string | undefined): number => {
          if (!date) return 0;
          const parsed = Date.parse(date);
          return Number.isFinite(parsed) ? parsed : 0;
        };
        unranked.sort(
          (a, b) =>
            (timestamp(a.postedAt ?? a.createdAt) - timestamp(b.postedAt ?? b.createdAt)) * sortDirection
        );
      }
      const total = unranked.length;
      const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);
      const start = (page - 1) * pageSize;
      return ok({
        items: unranked.slice(start, start + pageSize),
        total,
        page,
        pageSize,
        totalPages,
        sortByDate
      });
    }

    const includeLlmEnrichment = filters?.includeLlmEnrichment === true;
    const llmEnrichmentByJobId = await this.ensureLlmEnrichment(jobs, includeLlmEnrichment);
    const profileSeniority = inferProfileSeniority(profile.headline, profile.skills);
    let ranked: RankedJobPosting[] = jobs.map((job) => {
      const { normalizedSkills, matchedSkills, missingSkills } = computeSkillOverlap(profile.skills, job.normalizedTokens);
      const computed = computeWeightedMatchScore({
        normalizedSkills,
        matchedSkills,
        missingSkills,
        profileHeadline: profile.headline,
        jobTitle: job.title,
        keywordHits: keywordHitCount(job, queryTerms),
        keywordTermsCount: queryTerms.length,
        seniorityDistance: seniorityDistance(profileSeniority, job.seniority)
      });

      const llmEnrichment = llmEnrichmentByJobId.get(job.id);
      const llmSignal = (() => {
        if (!llmEnrichment) return 0;
        const llmOverlap = computeSkillOverlap(profile.skills, llmEnrichment.normalizedSkills).matchedSkills.length;
        const overlapSignal = Math.min(8, llmOverlap * 2);
        const confidenceSignal = clamp(llmEnrichment.confidence, 0, 1);
        return Math.round(overlapSignal * confidenceSignal);
      })();
      const score = clamp(computed.score + llmSignal, 0, 100);

      return {
        ...job,
        score,
        matchedSkills,
        scoreBreakdown: filters?.includeScoreBreakdown ? { ...computed.breakdown, finalScore: score } : undefined,
        llmEnrichment: includeLlmEnrichment ? llmEnrichment : undefined
      };
    });

    if (filters?.minScore && filters.minScore > 0) {
      ranked = ranked.filter(j => j.score >= filters.minScore!);
    }

    const timestamp = (date: string | undefined): number => {
      if (!date) return 0;
      const parsed = Date.parse(date);
      return Number.isFinite(parsed) ? parsed : 0;
    };
    ranked.sort((a, b) => {
      if (sortByDate !== "none") {
        const sortDirection = sortByDate === "oldest" ? 1 : -1;
        const dateDelta = (timestamp(a.postedAt ?? a.createdAt) - timestamp(b.postedAt ?? b.createdAt)) * sortDirection;
        if (dateDelta !== 0) return dateDelta;
      }
      const keywordDelta = keywordHitCount(b, queryTerms) - keywordHitCount(a, queryTerms);
      if (keywordDelta !== 0) return keywordDelta;
      const scoreDelta = b.score - a.score;
      if (scoreDelta !== 0) return scoreDelta;
      return timestamp(b.postedAt ?? b.createdAt) - timestamp(a.postedAt ?? a.createdAt);
    });
    const total = ranked.length;
    const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);
    const start = (page - 1) * pageSize;
    return ok({
      items: ranked.slice(start, start + pageSize),
      total,
      page,
      pageSize,
      totalPages,
      sortByDate
    });
  }

  failValidation(): ApiResult<never> {
    return fail(
      "INVALID_MATCH_PAYLOAD",
      "Payload must include jobPostingId and resumeProfile { id, headline, skills[] }"
    );
  }
}
