import type {
  ApiResult,
  ApplicationRecord,
  ApprovalRequest,
  DecisionLog,
  JobPosting,
  ListPayload,
  MemoryEntry,
  MetricsSnapshot,
  ResumeProfile
} from "@olympus/shared-types";
import { fetchJson } from "../../core/http/fetch-json.js";

export interface DashboardData {
  jobs: ApiResult<ListPayload<JobPosting>>;
  decisions: ApiResult<ListPayload<DecisionLog>>;
  approvals: ApiResult<ListPayload<ApprovalRequest>>;
  applications: ApiResult<ListPayload<ApplicationRecord>>;
  memoryEntries: ApiResult<ListPayload<MemoryEntry>>;
  metrics: ApiResult<MetricsSnapshot>;
  resumeProfiles: ApiResult<ListPayload<ResumeProfile>>;
}

export async function loadDashboardData(apiBaseUrl: string): Promise<DashboardData> {
  const [jobs, decisions, approvals, applications, memoryEntries, metrics, resumeProfiles] = await Promise.all([
    fetchJson<ListPayload<JobPosting>>(`${apiBaseUrl}/v1/job-postings`),
    fetchJson<ListPayload<DecisionLog>>(`${apiBaseUrl}/v1/decision-logs`),
    fetchJson<ListPayload<ApprovalRequest>>(`${apiBaseUrl}/v1/approval-queue`),
    fetchJson<ListPayload<ApplicationRecord>>(`${apiBaseUrl}/v1/applications`),
    fetchJson<ListPayload<MemoryEntry>>(`${apiBaseUrl}/v1/memory-entries`),
    fetchJson<MetricsSnapshot>(`${apiBaseUrl}/v1/metrics`),
    fetchJson<ListPayload<ResumeProfile>>(`${apiBaseUrl}/v1/resume-profiles`)
  ]);

  return { jobs, decisions, approvals, applications, memoryEntries, metrics, resumeProfiles };
}
