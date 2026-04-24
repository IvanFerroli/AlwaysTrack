import type { ApiResult, HealthPayload } from "@olympus/shared-types";
import { fetchJson } from "../../core/http/fetch-json.js";

export function loadApiHealth(apiBaseUrl: string): Promise<ApiResult<HealthPayload>> {
  return fetchJson<HealthPayload>(`${apiBaseUrl}/health`);
}
