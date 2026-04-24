import type { ApiResult, ListPayload } from "@olympus/shared-types";
import type { HttpHandler } from "../../core/http/types.js";
import { sendApiResult } from "../../core/http/send.js";
import { InMemoryStateStore } from "../../domain/state/store.js";

function ok<T>(items: T[]): ApiResult<ListPayload<T>> {
  return { ok: true, data: { items } };
}

export function createAuditHandlers(store: InMemoryStateStore): {
  listRuns: HttpHandler;
  listDecisionLogs: HttpHandler;
  listSkillExecutions: HttpHandler;
} {
  const listRuns: HttpHandler = ({ response }) => {
    sendApiResult(response, ok(store.listAgentRuns()));
  };

  const listDecisionLogs: HttpHandler = ({ response }) => {
    sendApiResult(response, ok(store.listDecisionLogs()));
  };

  const listSkillExecutions: HttpHandler = ({ response }) => {
    sendApiResult(response, ok(store.listSkillExecutions()));
  };

  return { listRuns, listDecisionLogs, listSkillExecutions };
}
