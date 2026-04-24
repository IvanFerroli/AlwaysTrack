import type { ApiErrorPayload, ApiResult } from "@olympus/shared-types";

function toNetworkError(message: string): ApiResult<never> {
  const error: ApiErrorPayload = {
    code: "NETWORK_ERROR",
    message
  };
  return { ok: false, error };
}

export async function fetchJson<T>(url: string): Promise<ApiResult<T>> {
  try {
    const response = await fetch(url);
    const data = (await response.json()) as ApiResult<T>;
    if (!response.ok) {
      return {
        ok: false,
        error: data.ok
          ? { code: "UPSTREAM_ERROR", message: "Unexpected successful payload on error status" }
          : data.error
      };
    }
    return data;
  } catch (error) {
    return toNetworkError(error instanceof Error ? error.message : "Unknown network error");
  }
}

export async function postJson<TInput, TOutput>(
  url: string,
  payload: TInput
): Promise<ApiResult<TOutput>> {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = (await response.json()) as ApiResult<TOutput>;
    if (!response.ok) {
      return {
        ok: false,
        error: data.ok
          ? { code: "UPSTREAM_ERROR", message: "Unexpected successful payload on error status" }
          : data.error
      };
    }
    return data;
  } catch (error) {
    return toNetworkError(error instanceof Error ? error.message : "Unknown network error");
  }
}
