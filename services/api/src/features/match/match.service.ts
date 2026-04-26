import type {
  ApiResult,
  ListPayload,
  JobSeniority,
  JobUserStatus,
  MatchScoreInput,
  MatchScoreResult,
  RankedJobPosting
} from "@olympus/shared-types";
import { computeMatchScore, computeSkillOverlap } from "../../domain/matching/scoring.js";
import { inferJobSeniority, withSeniorityTag } from "../../domain/matching/seniority.js";
import type { StateStore } from "../../domain/state/store.js";
import { analyzeJobMatch } from "../../core/llm/gemini.js";

export interface JobFilterOptions {
  q?: string[];
  minScore?: number;
  status?: JobUserStatus[];
  tags?: string[];
  location?: string[];
  sourceName?: string[];
  seniority?: JobSeniority[];
  sortByDate?: "newest" | "oldest";
  page?: number;
  pageSize?: number;
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
  ): Promise<ApiResult<ListPayload<RankedJobPosting>>> {
    const sortByDate = filters?.sortByDate ?? "newest";
    const page = filters?.page ?? 1;
    const pageSize = filters?.pageSize ?? 20;
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

    let ranked: RankedJobPosting[] = jobs.map((job) => {
      const { matchedSkills } = computeSkillOverlap(profile.skills, job.normalizedTokens);
      const score = computeMatchScore(matchedSkills.length, profile.headline, job.title, matchedSkills);
      return { ...job, score, matchedSkills };
    });

    if (filters?.minScore && filters.minScore > 0) {
      ranked = ranked.filter(j => j.score >= filters.minScore!);
    }

    const queryTerms = filters?.q?.map((term) => term.toLowerCase()) ?? [];
    const sortDirection = sortByDate === "oldest" ? 1 : -1;
    const timestamp = (date: string | undefined): number => {
      if (!date) return 0;
      const parsed = Date.parse(date);
      return Number.isFinite(parsed) ? parsed : 0;
    };
    ranked.sort((a, b) => {
      const dateDelta = (timestamp(a.postedAt ?? a.createdAt) - timestamp(b.postedAt ?? b.createdAt)) * sortDirection;
      if (dateDelta !== 0) return dateDelta;
      const keywordDelta = keywordHitCount(b, queryTerms) - keywordHitCount(a, queryTerms);
      if (keywordDelta !== 0) return keywordDelta;
      return b.score - a.score;
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
