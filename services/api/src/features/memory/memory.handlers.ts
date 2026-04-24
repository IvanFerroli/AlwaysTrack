import type { ApiResult, ListPayload, MemoryEntry } from "@olympus/shared-types";
import type { HttpHandler } from "../../core/http/types.js";
import { sendApiResult } from "../../core/http/send.js";
import { InMemoryStateStore } from "../../domain/state/store.js";

function ok<T>(items: T[]): ApiResult<ListPayload<T>> {
  return { ok: true, data: { items } };
}

export function createMemoryHandlers(store: InMemoryStateStore): { listMemory: HttpHandler } {
  const listMemory: HttpHandler = ({ response }) => {
    const items: MemoryEntry[] = store.listMemoryEntries();
    sendApiResult(response, ok(items));
  };

  return { listMemory };
}
