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
  createdAt: string;
}

export interface ResumeProfileCreateInput {
  headline: string;
  skills: string[];
}

export interface MainCvSource {
  fileName: string;
  relativePath: string;
  sizeBytes: number;
  updatedAt: string;
}

export interface MainCvAnalyzeInput {
  sourceFile: string;
  headline: string;
  extraSkills?: string[];
}

export interface MainCvAnalyzeResult {
  source: MainCvSource;
  extractedSkills: string[];
  resumeProfile: ResumeProfile;
}

export type JobUserStatus = "new" | "applied" | "discarded";
export type JobSeniority = "junior" | "mid" | "senior" | "lead";
export type JobWorkModel = "remote" | "hybrid" | "on-site" | "unknown";

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
  postedAt?: string;
  userStatus: JobUserStatus;
  tags: string[];
}

export interface IngestJobPostingInput {
  title: string;
  companyName: string;
  sourceName: string;
  sourceUrl: string;
  location?: string;
  description: string;
  postedAt?: string;
}

export interface IngestJobPostingResult {
  jobPosting: JobPosting;
  deduplicated: boolean;
}

export type JobAcquisitionMethod =
  | "smart-paste"
  | "url-import"
  | "ats-adapter"
  | "browser-capture"
  | "email-alert"
  | "provider-json";

export interface JobAcquisitionInput {
  method: JobAcquisitionMethod;
  sourceUrl?: string;
  sourceName?: string;
  rawText?: string;
  html?: string;
  providerPayload?: unknown;
}

export interface JobAcquisitionEvidence {
  method: JobAcquisitionMethod;
  sourceName: string;
  sourceUrl: string;
  parser: string;
  confidence: "high" | "medium" | "low";
  notes: string[];
}

export interface JobAcquisitionResult {
  input: IngestJobPostingInput;
  ingestion: IngestJobPostingResult;
  evidence: JobAcquisitionEvidence;
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

export interface RankedScoreBreakdown {
  weights: {
    strongSkills: number;
    weakSkills: number;
    titleHit: number;
    keywordHit: number;
    seniorityAlignment: number;
  };
  signals: {
    strongMatched: number;
    strongTotal: number;
    weakMatched: number;
    weakTotal: number;
    titleSignal: number;
    keywordHits: number;
    keywordTerms: number;
    seniorityDistance: number;
  };
  contributions: {
    strongSkills: number;
    weakSkills: number;
    titleHit: number;
    keywordHit: number;
    seniorityAlignment: number;
  };
  penalties: {
    seniorityMismatch: number;
  };
  finalScore: number;
}

export interface JobPostingLLMEnrichment {
  normalizedSkills: string[];
  seniority: JobSeniority;
  language: string;
  workModel: JobWorkModel;
  confidence: number;
  signals: string[];
  provider: "gemini" | "fallback";
  latencyMs: number;
  generatedAt: string;
}

export interface RankedJobPosting extends JobPosting {
  score: number;
  matchedSkills: string[];
  seniority: JobSeniority;
  scoreBreakdown?: RankedScoreBreakdown;
  llmEnrichment?: JobPostingLLMEnrichment;
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
  total?: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
  sortByDate?: "none" | "newest" | "oldest";
}

export type ApprovalStatus = "pending" | "approved" | "rejected";

export interface ApprovalRequest {
  id: string;
  actionType: "SEND_APPLICATION";
  jobPostingId: string;
  resumeProfileId: string;
  requestedBy: string;
  status: ApprovalStatus;
  reason: string;
  createdAt: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectedAt?: string;
  rejectedBy?: string;
  rejectionReason?: string;
}

export interface StrategyProposalInput {
  jobPostingId: string;
  resumeProfile: ResumeProfile;
  minimumScore?: number;
  requestedBy?: string;
}

export interface StrategyProposalResult {
  jobPostingId: string;
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
  proposed: boolean;
  approvalRequest?: ApprovalRequest;
  rationale: string;
}

export interface ApproveExecutionInput {
  approvalRequestId: string;
  approvedBy: string;
}

export interface RejectExecutionInput {
  approvalRequestId: string;
  rejectedBy: string;
  reason: string;
}

export interface ApplicationRecord {
  id: string;
  jobPostingId: string;
  resumeProfileId: string;
  status: "submitted" | "interview" | "rejected";
  approvalRequestId: string;
  submittedAt: string;
  evidence: string;
  outcomeAt?: string;
  outcomeBy?: string;
  outcomeReason?: string;
}

export interface ApproveExecutionResult {
  approvalRequest: ApprovalRequest;
  application: ApplicationRecord;
}

export interface RejectExecutionResult {
  approvalRequest: ApprovalRequest;
}

export interface UpdateApplicationStatusInput {
  applicationId: string;
  status: "interview" | "rejected";
  updatedBy: string;
  reason: string;
}

export interface UpdateApplicationStatusResult {
  application: ApplicationRecord;
}

export interface MemoryEntry {
  id: string;
  type: "APPLICATION_RESULT" | "STRATEGY_HINT" | "APPROVAL_RESULT";
  key: string;
  value: string;
  tags: string[];
  createdAt: string;
}

export interface MetricsSnapshot {
  totalJobPostings: number;
  totalResumeProfiles: number;
  ingestionAttempts: number;
  dedupeHits: number;
  dedupeRate: number;
  strategyProposals: number;
  pendingApprovals: number;
  submittedApplications: number;
}

export interface PipelineRunInput {
  source?: string;
  keyword?: string;
  autoDiscard?: boolean;
  includeLlmEnrichment?: boolean;
  resumeProfileId?: string;
  shortlistSize?: number;
  minScore?: number;
  maxLlmJobs?: number;
  maxDurationMs?: number;
  maxSources?: number;
  maxEstimatedCostUsd?: number;
}

export interface PipelineSourceReport {
  name: string;
  mode: "auto" | "fallback" | "blocked";
  latencyMs: number;
  fetched: number;
  parsed: number;
  ingested: number;
  deduplicated: number;
  discarded: number;
  fallbackMethod?: "url-import" | "browser-capture";
  note?: string;
  failureType?: "timeout" | "http" | "parse" | "security-check" | "unknown";
  keywordEffective?: string;
  errors: string[];
}

export interface PipelineShortlistItem {
  jobPostingId: string;
  title: string;
  companyName: string;
  sourceName: string;
  score: number;
  matchedSkills: string[];
  rationale: string;
}

export interface PipelineRunResult {
  runId: string;
  status: "completed" | "completed-with-warnings";
  durationMs: number;
  source: string;
  keywordRequested?: string;
  keywordEffective?: string;
  collected: number;
  parsed: number;
  ingested: number;
  deduplicated: number;
  autoDiscarded: number;
  sourceReports: PipelineSourceReport[];
  warnings: string[];
  shortlist: PipelineShortlistItem[];
  llm: {
    enabled: boolean;
    requested: boolean;
    maxJobs: number;
    estimatedJobs: number;
    estimatedCostUsd: number;
  };
  budget: {
    maxLlmJobs: number;
    maxDurationMs: number;
    maxSources: number;
    maxEstimatedCostUsd: number;
    cutsApplied: string[];
  };
}
