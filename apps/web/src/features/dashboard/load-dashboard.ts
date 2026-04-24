import type {
  ApiResult,
  ApplicationRecord,
  ApprovalRequest,
  MainCvSource,
  DecisionLog,
  JobPosting,
  ListPayload,
  MemoryEntry,
  MetricsSnapshot,
  RankedJobPosting,
  ResumeProfile
} from "@olympus/shared-types";
import { fetchJson } from "../../core/http/fetch-json.js";

export interface DashboardData {
  jobs: ApiResult<ListPayload<JobPosting>>;
  rankedJobs: ApiResult<ListPayload<RankedJobPosting>>;
  decisions: ApiResult<ListPayload<DecisionLog>>;
  approvals: ApiResult<ListPayload<ApprovalRequest>>;
  applications: ApiResult<ListPayload<ApplicationRecord>>;
  memoryEntries: ApiResult<ListPayload<MemoryEntry>>;
  metrics: ApiResult<MetricsSnapshot>;
  resumeProfiles: ApiResult<ListPayload<ResumeProfile>>;
  cvSources: ApiResult<ListPayload<MainCvSource>>;
}

export async function loadDashboardData(apiBaseUrl: string): Promise<DashboardData> {
  const [jobs, rankedJobs, decisions, approvals, applications, memoryEntries, metrics, resumeProfiles, cvSources] =
    await Promise.all([
      fetchJson<ListPayload<JobPosting>>(`${apiBaseUrl}/v1/job-postings`),
      fetchJson<ListPayload<RankedJobPosting>>(`${apiBaseUrl}/v1/jobs/ranked`),
      fetchJson<ListPayload<DecisionLog>>(`${apiBaseUrl}/v1/decision-logs`),
      fetchJson<ListPayload<ApprovalRequest>>(`${apiBaseUrl}/v1/approval-queue`),
      fetchJson<ListPayload<ApplicationRecord>>(`${apiBaseUrl}/v1/applications`),
      fetchJson<ListPayload<MemoryEntry>>(`${apiBaseUrl}/v1/memory-entries`),
      fetchJson<MetricsSnapshot>(`${apiBaseUrl}/v1/metrics`),
      fetchJson<ListPayload<ResumeProfile>>(`${apiBaseUrl}/v1/resume-profiles`),
      fetchJson<ListPayload<MainCvSource>>(`${apiBaseUrl}/v1/main-cv/sources`)
    ]);

  return { jobs, rankedJobs, decisions, approvals, applications, memoryEntries, metrics, resumeProfiles, cvSources };
}
