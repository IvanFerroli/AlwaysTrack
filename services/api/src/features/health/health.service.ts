import type { ApiResult, HealthPayload } from "@olympus/shared-types";

export function makeHealthService(startedAt: number): () => ApiResult<HealthPayload> {
  return () => ({
    ok: true,
    data: {
      service: "api",
      status: "ok",
      timestamp: new Date().toISOString(),
      uptimeMs: Date.now() - startedAt
    }
  });
}
