import type { ApiResult, MatchScoreInput, MatchScoreResult, RankedJobPosting, JobUserStatus } from "@olympus/shared-types";
import { computeMatchScore, computeSkillOverlap } from "../../domain/matching/scoring.js";
import { InMemoryStateStore } from "../../domain/state/store.js";
import { analyzeJobMatch } from "../../core/llm/gemini.js";

export interface JobFilterOptions {
  q?: string;
  minScore?: number;
  status?: JobUserStatus;
  tags?: string[];
  location?: string;
  sourceName?: string;
}

function ok<T>(data: T): ApiResult<T> {
  return { ok: true, data };
}

function fail(code: string, message: string): ApiResult<never> {
  return { ok: false, error: { code, message } };
}

export class MatchService {
  constructor(private readonly store: InMemoryStateStore) {}

  score(input: MatchScoreInput): ApiResult<MatchScoreResult> {
    const jobPosting = this.store.findJobPostingById(input.jobPostingId);
    if (!jobPosting) {
      return fail("JOB_POSTING_NOT_FOUND", `Job posting ${input.jobPostingId} not found`);
    }

    const { normalizedSkills, matchedSkills, missingSkills } = computeSkillOverlap(
      input.resumeProfile.skills,
      jobPosting.normalizedTokens
    );
    const score = computeMatchScore(matchedSkills.length, input.resumeProfile.headline, jobPosting.title);

    const agentRun = this.store.createAgentRun("Match Agent", "Match");
    const result: MatchScoreResult = {
      jobPostingId: jobPosting.id,
      score,
      matchedSkills,
      missingSkills,
      rationale: `Matched ${matchedSkills.length} of ${normalizedSkills.length} provided skills against normalized job tokens`
    };

    this.store.createDecisionLog(agentRun.id, "Match score computed", result.rationale);
    this.store.createSkillExecution(
      agentRun.id,
      "match-score-v1",
      "success",
      `posting=${jobPosting.id};score=${score}`
    );
    this.store.completeAgentRun(agentRun.id, "completed");

    return ok(result);
  }

  async deepScore(input: MatchScoreInput): Promise<ApiResult<MatchScoreResult>> {
    const jobPosting = this.store.findJobPostingById(input.jobPostingId);
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

    const agentRun = this.store.createAgentRun("Match Agent (LLM)", "DeepMatch");
    const result: MatchScoreResult = {
      jobPostingId: jobPosting.id,
      score,
      matchedSkills: [],
      missingSkills: [],
      rationale: `[Deep AI Analysis]: ${rationale}`
    };

    this.store.createDecisionLog(agentRun.id, "LLM Deep Score computed", result.rationale);
    this.store.createSkillExecution(
      agentRun.id,
      "deep-match-score-v1",
      "success",
      `posting=${jobPosting.id};score=${score}`
    );
    this.store.completeAgentRun(agentRun.id, "completed");

    return ok(result);
  }

  listRanked(
    resumeProfileId?: string,
    filters?: JobFilterOptions
  ): ApiResult<{ items: RankedJobPosting[] }> {
    let jobs = this.store.listJobPostings();

    if (filters) {
      if (filters.status) {
        jobs = jobs.filter(j => j.userStatus === filters.status);
      }
      if (filters.tags && filters.tags.length > 0) {
        jobs = jobs.filter(j => filters.tags!.every(tag => j.tags.includes(tag)));
      }
      if (filters.location) {
        const locLower = filters.location.toLowerCase();
        jobs = jobs.filter(j => j.location && j.location.toLowerCase().includes(locLower));
      }
      if (filters.sourceName) {
        const srcLower = filters.sourceName.toLowerCase();
        jobs = jobs.filter(j => j.sourceName.toLowerCase().includes(srcLower));
      }
      if (filters.q) {
        const qLower = filters.q.toLowerCase();
        jobs = jobs.filter(j => 
          j.title.toLowerCase().includes(qLower) || 
          j.companyName.toLowerCase().includes(qLower) ||
          j.description.toLowerCase().includes(qLower)
        );
      }
    }

    const profiles = this.store.listResumeProfiles();
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
      const score = computeMatchScore(matchedSkills.length, profile.headline, job.title);
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
