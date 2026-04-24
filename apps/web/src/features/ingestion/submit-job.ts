import type {
  ApproveExecutionInput,
  ApproveExecutionResult,
  IngestJobPostingInput,
  IngestJobPostingResult,
  MatchScoreInput,
  MatchScoreResult,
  RejectExecutionInput,
  RejectExecutionResult,
  ResumeProfile,
  StrategyProposalInput,
  StrategyProposalResult,
  UpdateApplicationStatusInput,
  UpdateApplicationStatusResult
} from "@olympus/shared-types";
import { fetchJson, postJson } from "../../core/http/fetch-json.js";

export interface IngestionOutcome {
  ok: boolean;
  deduplicated?: boolean;
  score?: number;
  resumeProfileId?: string;
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
    resumeProfileId: resumeProfile.id,
    strategyProposed: strategy.data.proposed,
    approvalRequestId: strategy.data.approvalRequest?.id
  };
}

export function parseResumeSkills(raw: string): string[] {
  return parseSkills(raw);
}

export async function loadResumeProfileById(
  apiBaseUrl: string,
  resumeProfileId: string
): Promise<{ ok: true; profile: ResumeProfile } | { ok: false; errorCode: string }> {
  const response = await fetchJson<ResumeProfile>(
    `${apiBaseUrl}/v1/resume-profiles/get?id=${encodeURIComponent(resumeProfileId)}`
  );

  if (!response.ok) {
    return { ok: false, errorCode: response.error.code };
  }

  return { ok: true, profile: response.data };
}

export async function createResumeProfile(
  apiBaseUrl: string,
  headline: string,
  skillsRaw: string
): Promise<{ ok: true; resumeProfileId: string } | { ok: false; errorCode: string }> {
  const payload = {
    headline,
    skills: parseSkills(skillsRaw)
  };

  const response = await postJson<typeof payload, ResumeProfile>(`${apiBaseUrl}/v1/resume-profiles`, payload);
  if (!response.ok) {
    return { ok: false, errorCode: response.error.code };
  }

  return { ok: true, resumeProfileId: response.data.id };
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

export async function rejectExecution(
  apiBaseUrl: string,
  approvalRequestId: string,
  rejectedBy: string,
  reason: string
): Promise<{ ok: boolean; errorCode?: string }> {
  const payload: RejectExecutionInput = { approvalRequestId, rejectedBy, reason };
  const result = await postJson<RejectExecutionInput, RejectExecutionResult>(
    `${apiBaseUrl}/v1/approval-queue/reject`,
    payload
  );

  if (!result.ok) {
    return { ok: false, errorCode: result.error.code };
  }

  return { ok: true };
}

export async function updateApplicationStatus(
  apiBaseUrl: string,
  applicationId: string,
  status: "interview" | "rejected",
  updatedBy: string,
  reason: string
): Promise<{ ok: boolean; errorCode?: string }> {
  const payload: UpdateApplicationStatusInput = {
    applicationId,
    status,
    updatedBy,
    reason
  };
  const result = await postJson<UpdateApplicationStatusInput, UpdateApplicationStatusResult>(
    `${apiBaseUrl}/v1/applications/update-status`,
    payload
  );

  if (!result.ok) {
    return { ok: false, errorCode: result.error.code };
  }

  return { ok: true };
}
