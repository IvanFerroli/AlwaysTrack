import type { ApiResult, MetricsSnapshot } from "@olympus/shared-types";
import type { HttpHandler } from "../../core/http/types.js";
import { sendApiResult } from "../../core/http/send.js";
import { InMemoryStateStore } from "../../domain/state/store.js";

function ok(data: MetricsSnapshot): ApiResult<MetricsSnapshot> {
  return { ok: true, data };
}

export function createObservabilityHandlers(store: InMemoryStateStore): { metrics: HttpHandler } {
  const metrics: HttpHandler = ({ response }) => {
    sendApiResult(response, ok(store.snapshotMetrics()));
  };

  return { metrics };
}
