import type {
  ApproveExecutionInput,
  ApproveExecutionResult,
  IngestJobPostingInput,
  IngestJobPostingResult,
  MatchScoreInput,
  MatchScoreResult,
  ResumeProfile,
  StrategyProposalInput,
  StrategyProposalResult
} from "@olympus/shared-types";
import { postJson } from "../../core/http/fetch-json.js";

export interface IngestionOutcome {
  ok: boolean;
  deduplicated?: boolean;
  score?: number;
  approvalRequestId?: string;
  strategyProposed?: boolean;
  errorCode?: string;
}

function parseSkills(raw: string): string[] {
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

export async function submitJobPosting(
  apiBaseUrl: string,
  payload: IngestJobPostingInput,
  resumeProfile: ResumeProfile
): Promise<IngestionOutcome> {
  const ingest = await postJson<IngestJobPostingInput, IngestJobPostingResult>(
    `${apiBaseUrl}/v1/job-postings/ingest`,
    payload
  );

  if (!ingest.ok) {
    return { ok: false, errorCode: ingest.error.code };
  }

  const matchPayload: MatchScoreInput = {
    jobPostingId: ingest.data.jobPosting.id,
    resumeProfile
  };

  const score = await postJson<MatchScoreInput, MatchScoreResult>(`${apiBaseUrl}/v1/match/score`, matchPayload);
  if (!score.ok) {
    return { ok: false, errorCode: score.error.code };
  }

  const strategyInput: StrategyProposalInput = {
    jobPostingId: ingest.data.jobPosting.id,
    resumeProfile,
    minimumScore: 50,
    requestedBy: "web-dashboard"
  };
  const strategy = await postJson<StrategyProposalInput, StrategyProposalResult>(
    `${apiBaseUrl}/v1/strategy/propose`,
    strategyInput
  );
  if (!strategy.ok) {
    return { ok: false, errorCode: strategy.error.code };
  }

  return {
    ok: true,
    deduplicated: ingest.data.deduplicated,
    score: score.data.score,
    strategyProposed: strategy.data.proposed,
    approvalRequestId: strategy.data.approvalRequest?.id
  };
}

export function parseResumeSkills(raw: string): string[] {
  return parseSkills(raw);
}

export async function approveExecution(
  apiBaseUrl: string,
  approvalRequestId: string,
  approvedBy: string
): Promise<{ ok: boolean; applicationId?: string; errorCode?: string }> {
  const payload: ApproveExecutionInput = { approvalRequestId, approvedBy };
  const result = await postJson<ApproveExecutionInput, ApproveExecutionResult>(
    `${apiBaseUrl}/v1/approval-queue/approve`,
    payload
  );

  if (!result.ok) {
    return { ok: false, errorCode: result.error.code };
  }

  return { ok: true, applicationId: result.data.application.id };
}
