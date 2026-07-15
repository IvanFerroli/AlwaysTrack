import type { RequestHandler } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { jsonEnvelope, requestHandler } from "../../test-support/http-handler-harness.js";

const service = vi.hoisted(() => {
  const operationNames = [
    "createPersonalScript", "createOperationalScript", "createOperationalScriptSuggestion", "createScriptPack", "createScriptCategory",
    "decideOperationalScriptSuggestion", "decideSmartScriptItem", "exportSmartScriptEspanso", "getSmartScriptMetrics", "importSmartScriptCandidates",
    "listScriptLibrary", "listPersonalScripts", "listSmartScriptItems", "obsoleteOperationalScript", "recertifyOperationalScript",
    "recordSmartScriptUse", "recordScriptCopy", "restoreOperationalScriptRevision", "suggestSmartScriptItemAsCanonical",
    "suggestPersonalScriptAsCanonical", "updateScriptPack", "updateOperationalScript", "validateOperationalScript"
  ] as const;
  const operations = Object.fromEntries(operationNames.map((name) => [name, vi.fn()]));
  return {
    ...operations,
    parseOperationalScriptInput: vi.fn((value) => value), parseScriptCategoryInput: vi.fn((value) => value),
    parseScriptCopyInput: vi.fn((value) => value), parseSmartScriptDecisionPayload: vi.fn((value) => value),
    parseSmartScriptImportPayload: vi.fn((value) => value), parseSmartScriptListFilters: vi.fn((value) => value),
    parseScriptFilters: vi.fn((value) => value), parseScriptPackInput: vi.fn((value) => value),
    parseScriptSuggestionInput: vi.fn((value) => value), parsePersonalScriptInput: vi.fn((value) => value)
  } as Record<string, ReturnType<typeof vi.fn>>;
});

vi.mock("../db/prisma.js", () => ({ prisma: { mocked: true } }));
vi.mock("./script-library.service.js", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./script-library.service.js")>()),
  ...service
}));

import * as handlers from "./script-library.handlers.js";
import { ScriptLibraryError } from "./script-library.service.js";

type Operation = ReturnType<typeof vi.fn>;
const rows: Array<[RequestHandler, Operation, string, string, "get" | "patch" | "post", number]> = [
  [handlers.listScriptLibraryHandler, service.listScriptLibrary, "/v1/scripts?status=published", "/v1/scripts", "get", 200],
  [handlers.listPersonalScriptsHandler, service.listPersonalScripts, "/v1/personal-scripts", "/v1/personal-scripts", "get", 200],
  [handlers.createPersonalScriptHandler, service.createPersonalScript, "/v1/personal-scripts", "/v1/personal-scripts", "post", 201],
  [handlers.suggestPersonalScriptHandler, service.suggestPersonalScriptAsCanonical, "/v1/personal-scripts/personal-1/suggest", "/v1/personal-scripts/:personalScriptId/suggest", "post", 200],
  [handlers.listSmartScriptItemsHandler, service.listSmartScriptItems, "/v1/smartscript/items?status=pending", "/v1/smartscript/items", "get", 200],
  [handlers.importSmartScriptCandidatesHandler, service.importSmartScriptCandidates, "/v1/smartscript/import", "/v1/smartscript/import", "post", 201],
  [handlers.decideSmartScriptItemHandler, service.decideSmartScriptItem, "/v1/smartscript/items/item-1/decision", "/v1/smartscript/items/:smartScriptItemId/decision", "post", 200],
  [handlers.exportSmartScriptEspansoHandler, service.exportSmartScriptEspanso, "/v1/smartscript/export", "/v1/smartscript/export", "get", 200],
  [handlers.getSmartScriptMetricsHandler, service.getSmartScriptMetrics, "/v1/smartscript/metrics", "/v1/smartscript/metrics", "get", 200],
  [handlers.recordSmartScriptUseHandler, service.recordSmartScriptUse, "/v1/smartscript/items/item-1/use", "/v1/smartscript/items/:smartScriptItemId/use", "post", 200],
  [handlers.suggestSmartScriptCanonicalHandler, service.suggestSmartScriptItemAsCanonical, "/v1/smartscript/items/item-1/suggest", "/v1/smartscript/items/:smartScriptItemId/suggest", "post", 200],
  [handlers.createScriptCategoryHandler, service.createScriptCategory, "/v1/script-categories", "/v1/script-categories", "post", 201],
  [handlers.createScriptPackHandler, service.createScriptPack, "/v1/script-packs", "/v1/script-packs", "post", 201],
  [handlers.updateScriptPackHandler, service.updateScriptPack, "/v1/script-packs/pack-1", "/v1/script-packs/:packId", "patch", 200],
  [handlers.createOperationalScriptHandler, service.createOperationalScript, "/v1/scripts", "/v1/scripts", "post", 201],
  [handlers.createOperationalScriptSuggestionHandler, service.createOperationalScriptSuggestion, "/v1/script-suggestions", "/v1/script-suggestions", "post", 201],
  [handlers.decideOperationalScriptSuggestionHandler, service.decideOperationalScriptSuggestion, "/v1/script-suggestions/suggestion-1", "/v1/script-suggestions/:suggestionId", "post", 200],
  [handlers.updateOperationalScriptHandler, service.updateOperationalScript, "/v1/scripts/script-1", "/v1/scripts/:scriptId", "patch", 200],
  [handlers.validateOperationalScriptHandler, service.validateOperationalScript, "/v1/scripts/script-1/validate", "/v1/scripts/:scriptId/validate", "post", 200],
  [handlers.obsoleteOperationalScriptHandler, service.obsoleteOperationalScript, "/v1/scripts/script-1/obsolete", "/v1/scripts/:scriptId/obsolete", "post", 200],
  [handlers.recertifyOperationalScriptHandler, service.recertifyOperationalScript, "/v1/scripts/script-1/recertify", "/v1/scripts/:scriptId/recertify", "post", 200],
  [handlers.restoreOperationalScriptRevisionHandler, service.restoreOperationalScriptRevision, "/v1/scripts/script-1/revisions/revision-1/restore", "/v1/scripts/:scriptId/revisions/:revisionId/restore", "post", 200],
  [handlers.copyOperationalScriptHandler, service.recordScriptCopy, "/v1/scripts/script-1/copy", "/v1/scripts/:scriptId/copy", "post", 200]
];

describe("script library HTTP handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const [, operation, path] of rows) operation.mockResolvedValue({ resource: path });
  });

  it.each(rows)("executes a scoped Scriptoteca operation for %s", async (handler, operation, path, route, method, status) => {
    const response = await requestHandler({ handler, path, route, method, body: method === "get" ? undefined : { title: "Script seguro" } });
    expect(response.status).toBe(status);
    expect(await jsonEnvelope(response)).toMatchObject({ ok: true, data: { resource: path } });
    expect(operation.mock.calls[0][1]).toMatchObject({ id: "admin-1", organizationId: "org-1" });
  });

  it.each([
    [new ScriptLibraryError("FORBIDDEN"), 403, "FORBIDDEN"],
    [new ScriptLibraryError("NOT_FOUND"), 404, "NOT_FOUND"],
    [new ScriptLibraryError("TITLE_TAKEN"), 409, "TITLE_TAKEN"],
    [new ScriptLibraryError("INVALID_INPUT"), 400, "INVALID_INPUT"]
  ])("maps Scriptoteca domain failures", async (error, status, code) => {
    service.createOperationalScript.mockRejectedValueOnce(error);
    const response = await requestHandler({ handler: handlers.createOperationalScriptHandler, method: "post", body: { title: "x" } });
    expect(response.status).toBe(status);
    expect(await jsonEnvelope(response)).toMatchObject({ ok: false, error: { code } });
  });
});
