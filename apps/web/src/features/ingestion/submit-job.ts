import type {
  IngestJobPostingInput,
  IngestJobPostingResult,
  MatchScoreInput,
  MatchScoreResult,
  ResumeProfile
} from "@olympus/shared-types";
import { postJson } from "../../core/http/fetch-json.js";

export interface IngestionOutcome {
  ok: boolean;
  deduplicated?: boolean;
  score?: number;
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

  return {
    ok: true,
    deduplicated: ingest.data.deduplicated,
    score: score.data.score
  };
}

export function parseResumeSkills(raw: string): string[] {
  return parseSkills(raw);
}
