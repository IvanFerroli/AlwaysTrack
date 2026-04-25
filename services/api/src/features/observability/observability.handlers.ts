import type { ApiResult, MetricsSnapshot } from "@olympus/shared-types";
import type { HttpHandler } from "../../core/http/types.js";
import { sendApiResult } from "../../core/http/send.js";
import type { StateStore } from "../../domain/state/store.js";

function ok(data: MetricsSnapshot): ApiResult<MetricsSnapshot> {
  return { ok: true, data };
}

export function createObservabilityHandlers(store: StateStore): { metrics: HttpHandler } {
  const metrics: HttpHandler = async ({ response }) => {
    sendApiResult(response, ok(await store.snapshotMetrics()));
  };

  return { metrics };
}
