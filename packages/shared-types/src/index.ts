export type HealthStatus = "ok" | "degraded";

export type ServiceId = "web" | "api";

export interface ApiErrorPayload {
  code: string;
  message: string;
}

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ApiErrorPayload };

export interface HealthPayload {
  service: ServiceId;
  status: HealthStatus;
  timestamp: string;
  uptimeMs: number;
}

export interface PingPayload {
  message: "pong";
  timestamp: string;
}

export interface ResumeProfile {
  id: string;
  headline: string;
  skills: string[];
}

export interface JobPosting {
  id: string;
  title: string;
  companyName: string;
  sourceName: string;
  sourceUrl: string;
  location?: string;
  description: string;
  normalizedTokens: string[];
  dedupeKey: string;
  createdAt: string;
}

export interface IngestJobPostingInput {
  title: string;
  companyName: string;
  sourceName: string;
  sourceUrl: string;
  location?: string;
  description: string;
}

export interface IngestJobPostingResult {
  jobPosting: JobPosting;
  deduplicated: boolean;
}

export interface MatchScoreInput {
  jobPostingId: string;
  resumeProfile: ResumeProfile;
}

export interface MatchScoreResult {
  jobPostingId: string;
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
  rationale: string;
}

export interface AgentRun {
  id: string;
  agent: string;
  capability: string;
  status: "started" | "completed" | "failed";
  startedAt: string;
  completedAt?: string;
}

export interface DecisionLog {
  id: string;
  agentRunId: string;
  summary: string;
  rationale: string;
  createdAt: string;
}

export interface SkillExecution {
  id: string;
  agentRunId: string;
  skillName: string;
  status: "success" | "failure";
  startedAt: string;
  finishedAt: string;
  evidence: string;
}

export interface ListPayload<T> {
  items: T[];
}
