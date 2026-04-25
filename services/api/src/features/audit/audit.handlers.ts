import type { ApiResult, ListPayload } from "@olympus/shared-types";
import type { HttpHandler } from "../../core/http/types.js";
import { sendApiResult } from "../../core/http/send.js";
import type { StateStore } from "../../domain/state/store.js";

function ok<T>(items: T[]): ApiResult<ListPayload<T>> {
  return { ok: true, data: { items } };
}

export function createAuditHandlers(store: StateStore): {
  listRuns: HttpHandler;
  listDecisionLogs: HttpHandler;
  listSkillExecutions: HttpHandler;
} {
  const listRuns: HttpHandler = async ({ response }) => {
    sendApiResult(response, ok(await store.listAgentRuns()));
  };

  const listDecisionLogs: HttpHandler = async ({ response }) => {
    sendApiResult(response, ok(await store.listDecisionLogs()));
  };

  const listSkillExecutions: HttpHandler = async ({ response }) => {
    sendApiResult(response, ok(await store.listSkillExecutions()));
  };

  return { listRuns, listDecisionLogs, listSkillExecutions };
}
