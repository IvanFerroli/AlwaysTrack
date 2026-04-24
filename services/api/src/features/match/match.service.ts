import type { ApiResult, MatchScoreInput, MatchScoreResult } from "@olympus/shared-types";
import { InMemoryStateStore } from "../../domain/state/store.js";

function ok<T>(data: T): ApiResult<T> {
  return { ok: true, data };
}

function fail(code: string, message: string): ApiResult<never> {
  return { ok: false, error: { code, message } };
}

function normalizeSkills(skills: string[]): string[] {
  return skills
    .map((item) => item.trim().toLowerCase())
    .filter((item) => item.length > 0);
}

function computeScore(matched: number, total: number): number {
  if (total <= 0) {
    return 0;
  }
  return Math.round((matched / total) * 100);
}

export class MatchService {
  constructor(private readonly store: InMemoryStateStore) {}

  score(input: MatchScoreInput): ApiResult<MatchScoreResult> {
    const jobPosting = this.store.findJobPostingById(input.jobPostingId);
    if (!jobPosting) {
      return fail("JOB_POSTING_NOT_FOUND", `Job posting ${input.jobPostingId} not found`);
    }

    const normalizedSkills = normalizeSkills(input.resumeProfile.skills);
    const tokenSet = new Set(jobPosting.normalizedTokens);
    const matchedSkills = normalizedSkills.filter((skill) => tokenSet.has(skill));
    const missingSkills = normalizedSkills.filter((skill) => !tokenSet.has(skill));
    const score = computeScore(matchedSkills.length, normalizedSkills.length);

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

  failValidation(): ApiResult<never> {
    return fail(
      "INVALID_MATCH_PAYLOAD",
      "Payload must include jobPostingId and resumeProfile { id, headline, skills[] }"
    );
  }
}
