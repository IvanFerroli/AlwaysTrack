import type { ApiResult, ListPayload, MemoryEntry } from "@olympus/shared-types";
import type { HttpHandler } from "../../core/http/types.js";
import { sendApiResult } from "../../core/http/send.js";
import type { StateStore } from "../../domain/state/store.js";

function ok<T>(items: T[]): ApiResult<ListPayload<T>> {
  return { ok: true, data: { items } };
}

export function createMemoryHandlers(store: StateStore): { listMemory: HttpHandler } {
  const listMemory: HttpHandler = async ({ response }) => {
    const items: MemoryEntry[] = await store.listMemoryEntries();
    sendApiResult(response, ok(items));
  };

  return { listMemory };
}
