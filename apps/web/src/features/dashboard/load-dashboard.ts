import type { ApiResult, DecisionLog, JobPosting, ListPayload } from "@olympus/shared-types";
import { fetchJson } from "../../core/http/fetch-json.js";

export interface DashboardData {
  jobs: ApiResult<ListPayload<JobPosting>>;
  decisions: ApiResult<ListPayload<DecisionLog>>;
}

export async function loadDashboardData(apiBaseUrl: string): Promise<DashboardData> {
  const [jobs, decisions] = await Promise.all([
    fetchJson<ListPayload<JobPosting>>(`${apiBaseUrl}/v1/job-postings`),
    fetchJson<ListPayload<DecisionLog>>(`${apiBaseUrl}/v1/decision-logs`)
  ]);

  return { jobs, decisions };
}
