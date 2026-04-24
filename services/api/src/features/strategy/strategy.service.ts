import type { ApiResult, StrategyProposalInput, StrategyProposalResult } from "@olympus/shared-types";
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

export class StrategyService {
  constructor(private readonly store: InMemoryStateStore) {}

  propose(input: StrategyProposalInput): ApiResult<StrategyProposalResult> {
    const jobPosting = this.store.findJobPostingById(input.jobPostingId);
    if (!jobPosting) {
      return fail("JOB_POSTING_NOT_FOUND", `Job posting ${input.jobPostingId} not found`);
    }

    const normalizedSkills = normalizeSkills(input.resumeProfile.skills);
    const tokenSet = new Set(jobPosting.normalizedTokens);
    const matchedSkills = normalizedSkills.filter((skill) => tokenSet.has(skill));
    const missingSkills = normalizedSkills.filter((skill) => !tokenSet.has(skill));
    const score = computeScore(matchedSkills.length, normalizedSkills.length);
    const minimumScore = input.minimumScore ?? 50;
    const requestedBy = input.requestedBy ?? "strategy-agent";
    const proposed = score >= minimumScore;

    const agentRun = this.store.createAgentRun("Strategy Agent", "Strategy");

    if (!proposed) {
      const rationale = `Score ${score} below threshold ${minimumScore}; recommendation is to not execute application`;
      this.store.createDecisionLog(agentRun.id, "Strategy rejected for low score", rationale);
      this.store.createSkillExecution(
        agentRun.id,
        "strategy-proposal-v1",
        "success",
        `job=${jobPosting.id};score=${score};proposed=false`
      );
      this.store.completeAgentRun(agentRun.id, "completed");
      return ok({
        jobPostingId: jobPosting.id,
        score,
        matchedSkills,
        missingSkills,
        proposed: false,
        rationale
      });
    }

    const approval = this.store.createApprovalRequest({
      actionType: "SEND_APPLICATION",
      jobPostingId: jobPosting.id,
      resumeProfileId: input.resumeProfile.id,
      requestedBy,
      reason: `Score ${score} met threshold ${minimumScore}; waiting human approval`
    });

    const rationale = `Score ${score} met threshold ${minimumScore}; approval request ${approval.id} opened`;
    this.store.createDecisionLog(agentRun.id, "Strategy proposed application", rationale);
    this.store.createSkillExecution(
      agentRun.id,
      "strategy-proposal-v1",
      "success",
      `job=${jobPosting.id};score=${score};approval=${approval.id}`
    );
    this.store.completeAgentRun(agentRun.id, "completed");

    return ok({
      jobPostingId: jobPosting.id,
      score,
      matchedSkills,
      missingSkills,
      proposed: true,
      approvalRequest: approval,
      rationale
    });
  }

  failValidation(): ApiResult<never> {
    return fail(
      "INVALID_STRATEGY_PAYLOAD",
      "Payload must include jobPostingId and resumeProfile { id, headline, skills[] }"
    );
  }
}
