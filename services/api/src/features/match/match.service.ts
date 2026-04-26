import type { ApiResult, MatchScoreInput, MatchScoreResult, RankedJobPosting, JobUserStatus } from "@olympus/shared-types";
import { computeMatchScore, computeSkillOverlap } from "../../domain/matching/scoring.js";
import type { StateStore } from "../../domain/state/store.js";
import { analyzeJobMatch } from "../../core/llm/gemini.js";

export interface JobFilterOptions {
  q?: string[];
  minScore?: number;
  status?: JobUserStatus[];
  tags?: string[];
  location?: string[];
  sourceName?: string[];
}

function ok<T>(data: T): ApiResult<T> {
  return { ok: true, data };
}

function fail(code: string, message: string): ApiResult<never> {
  return { ok: false, error: { code, message } };
}

export class MatchService {
  constructor(private readonly store: StateStore) {}

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
  ): Promise<ApiResult<{ items: RankedJobPosting[] }>> {
    let jobs = await this.store.listJobPostings();

    if (filters) {
      if (filters.status && filters.status.length > 0) {
        jobs = jobs.filter(j => filters.status!.includes(j.userStatus));
      }
      if (filters.tags && filters.tags.length > 0) {
        jobs = jobs.filter(j => filters.tags!.every(tag => j.tags.includes(tag)));
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
      : profiles[0];

    if (!profile || jobs.length === 0) {
      let unranked: RankedJobPosting[] = jobs.map((j) => ({ ...j, score: 0, matchedSkills: [] }));
      if (filters?.minScore && filters.minScore > 0) {
        unranked = unranked.filter(j => j.score >= filters.minScore!);
      }
      return ok({ items: unranked });
    }

    let ranked: RankedJobPosting[] = jobs.map((job) => {
      const { matchedSkills } = computeSkillOverlap(profile.skills, job.normalizedTokens);
      const score = computeMatchScore(matchedSkills.length, profile.headline, job.title, matchedSkills);
      return { ...job, score, matchedSkills };
    });

    if (filters?.minScore && filters.minScore > 0) {
      ranked = ranked.filter(j => j.score >= filters.minScore!);
    }

    ranked.sort((a, b) => b.score - a.score);
    return ok({ items: ranked });
  }

  failValidation(): ApiResult<never> {
    return fail(
      "INVALID_MATCH_PAYLOAD",
      "Payload must include jobPostingId and resumeProfile { id, headline, skills[] }"
    );
  }
}
