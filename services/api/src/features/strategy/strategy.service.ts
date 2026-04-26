import type { ApiResult, StrategyProposalInput, StrategyProposalResult } from "@olympus/shared-types";
import { computeMatchScore, computeSkillOverlap } from "../../domain/matching/scoring.js";
import type { StateStore } from "../../domain/state/store.js";

function ok<T>(data: T): ApiResult<T> {
  return { ok: true, data };
}

function fail(code: string, message: string): ApiResult<never> {
  return { ok: false, error: { code, message } };
}

export class StrategyService {
  constructor(private readonly store: StateStore) {}

  async propose(input: StrategyProposalInput): Promise<ApiResult<StrategyProposalResult>> {
    const jobPosting = await this.store.findJobPostingById(input.jobPostingId);
    if (!jobPosting) {
      return fail("JOB_POSTING_NOT_FOUND", `Job posting ${input.jobPostingId} not found`);
    }

    const { matchedSkills, missingSkills } = computeSkillOverlap(
      input.resumeProfile.skills,
      jobPosting.normalizedTokens
    );
    const score = computeMatchScore(matchedSkills.length, input.resumeProfile.headline, jobPosting.title);
    const minimumScore = input.minimumScore ?? 50;
    const requestedBy = input.requestedBy ?? "strategy-agent";
    const proposed = score >= minimumScore;
    await this.store.recordStrategyProposal();

    const agentRun = await this.store.createAgentRun("Strategy Agent", "Strategy");

    if (!proposed) {
      const rationale = `Score ${score} below threshold ${minimumScore}; recommendation is to not execute application`;
      await this.store.createDecisionLog(agentRun.id, "Strategy rejected for low score", rationale);
      await this.store.createSkillExecution(
        agentRun.id,
        "strategy-proposal-v1",
        "success",
        `job=${jobPosting.id};score=${score};proposed=false`
      );
      await this.store.completeAgentRun(agentRun.id, "completed");
      return ok({
        jobPostingId: jobPosting.id,
        score,
        matchedSkills,
        missingSkills,
        proposed: false,
        rationale
      });
    }

    const existingApplication = await this.store.findSubmittedApplication(jobPosting.id, input.resumeProfile.id);
    if (existingApplication) {
      const rationale = `Application ${existingApplication.id} already submitted for this job and resume profile; no new approval required`;
      await this.store.createDecisionLog(agentRun.id, "Strategy skipped duplicated execution", rationale);
      await this.store.createSkillExecution(
        agentRun.id,
        "strategy-proposal-v1",
        "success",
        `job=${jobPosting.id};score=${score};proposed=false;reason=already-submitted`
      );
      await this.store.completeAgentRun(agentRun.id, "completed");
      return ok({
        jobPostingId: jobPosting.id,
        score,
        matchedSkills,
        missingSkills,
        proposed: false,
        rationale
      });
    }

    const existingPending = await this.store.findPendingApprovalRequest(jobPosting.id, input.resumeProfile.id);
    if (existingPending) {
      const rationale = `Score ${score} met threshold ${minimumScore}; reusing existing pending approval ${existingPending.id}`;
      await this.store.createDecisionLog(agentRun.id, "Strategy reused pending approval", rationale);
      await this.store.createSkillExecution(
        agentRun.id,
        "strategy-proposal-v1",
        "success",
        `job=${jobPosting.id};score=${score};approval=${existingPending.id};reused=true`
      );
      await this.store.completeAgentRun(agentRun.id, "completed");
      return ok({
        jobPostingId: jobPosting.id,
        score,
        matchedSkills,
        missingSkills,
        proposed: true,
        approvalRequest: existingPending,
        rationale
      });
    }

    const approval = await this.store.createApprovalRequest({
      actionType: "SEND_APPLICATION",
      jobPostingId: jobPosting.id,
      resumeProfileId: input.resumeProfile.id,
      requestedBy,
      reason: `Score ${score} met threshold ${minimumScore}; waiting human approval`
    });

    const rationale = `Score ${score} met threshold ${minimumScore}; approval request ${approval.id} opened`;
    await this.store.createDecisionLog(agentRun.id, "Strategy proposed application", rationale);
    await this.store.createSkillExecution(
      agentRun.id,
      "strategy-proposal-v1",
      "success",
      `job=${jobPosting.id};score=${score};approval=${approval.id}`
    );
    await this.store.completeAgentRun(agentRun.id, "completed");

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
