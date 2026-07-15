import type { RequestHandler } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { jsonEnvelope, requestHandler } from "../../test-support/http-handler-harness.js";

const service = vi.hoisted(() => {
  const names = ["archiveWikiAttachment", "archiveWikiPage", "approveWikiEditRequest", "createWikiEditRequest", "createWikiPage", "getWikiPage",
    "getWikiPageBySlug", "heartbeatWikiPresence", "getWikiAttachmentFile", "listWikiEditRequests", "listWikiPages", "markWikiRead",
    "rejectWikiEditRequest", "restoreWikiRevision", "unarchiveWikiPage", "updateWikiPage", "uploadWikiAttachment"] as const;
  return {
    ...Object.fromEntries(names.map((name) => [name, vi.fn()])),
    parseWikiAttachmentUploadInput: vi.fn((value) => value), parseWikiDecisionInput: vi.fn((value) => value),
    parseWikiEditRequestInput: vi.fn((value) => value), parseWikiFilters: vi.fn((value) => value),
    parseWikiPageInput: vi.fn((value) => value), parseWikiPresenceInput: vi.fn((value) => value)
  } as Record<string, ReturnType<typeof vi.fn>>;
});

vi.mock("../db/prisma.js", () => ({ prisma: { mocked: true } }));
vi.mock("../documents/storage.provider.js", () => ({ getStorageProvider: () => ({ mocked: true }) }));
vi.mock("./wiki.service.js", async (importOriginal) => ({ ...(await importOriginal<typeof import("./wiki.service.js")>()), ...service }));

import * as handlers from "./wiki.handlers.js";
import { WikiError } from "./wiki.service.js";

type Operation = ReturnType<typeof vi.fn>;
const rows: Array<[RequestHandler, Operation, string, string, "get" | "patch" | "post", number]> = [
  [handlers.listWikiPagesHandler, service.listWikiPages, "/v1/wiki?query=seguro", "/v1/wiki", "get", 200],
  [handlers.getWikiPageHandler, service.getWikiPage, "/v1/wiki/page-1", "/v1/wiki/:pageId", "get", 200],
  [handlers.getWikiPageBySlugHandler, service.getWikiPageBySlug, "/v1/wiki/by-slug/triagem", "/v1/wiki/by-slug/:slug", "get", 200],
  [handlers.createWikiPageHandler, service.createWikiPage, "/v1/wiki", "/v1/wiki", "post", 201],
  [handlers.updateWikiPageHandler, service.updateWikiPage, "/v1/wiki/page-1", "/v1/wiki/:pageId", "patch", 200],
  [handlers.archiveWikiPageHandler, service.archiveWikiPage, "/v1/wiki/page-1/archive", "/v1/wiki/:pageId/archive", "post", 200],
  [handlers.unarchiveWikiPageHandler, service.unarchiveWikiPage, "/v1/wiki/page-1/unarchive", "/v1/wiki/:pageId/unarchive", "post", 200],
  [handlers.restoreWikiRevisionHandler, service.restoreWikiRevision, "/v1/wiki/page-1/revisions/revision-1/restore", "/v1/wiki/:pageId/revisions/:revisionId/restore", "post", 200],
  [handlers.listWikiEditRequestsHandler, service.listWikiEditRequests, "/v1/wiki/edit-requests", "/v1/wiki/edit-requests", "get", 200],
  [handlers.createWikiEditRequestHandler, service.createWikiEditRequest, "/v1/wiki/edit-requests", "/v1/wiki/edit-requests", "post", 201],
  [handlers.approveWikiEditRequestHandler, service.approveWikiEditRequest, "/v1/wiki/edit-requests/request-1/approve", "/v1/wiki/edit-requests/:requestId/approve", "post", 200],
  [handlers.rejectWikiEditRequestHandler, service.rejectWikiEditRequest, "/v1/wiki/edit-requests/request-1/reject", "/v1/wiki/edit-requests/:requestId/reject", "post", 200],
  [handlers.markWikiReadHandler, service.markWikiRead, "/v1/wiki/page-1/read", "/v1/wiki/:pageId/read", "post", 200],
  [handlers.heartbeatWikiPresenceHandler, service.heartbeatWikiPresence, "/v1/wiki/page-1/presence", "/v1/wiki/:pageId/presence", "post", 200],
  [handlers.uploadWikiAttachmentHandler, service.uploadWikiAttachment, "/v1/wiki/attachments", "/v1/wiki/attachments", "post", 201],
  [handlers.archiveWikiAttachmentHandler, service.archiveWikiAttachment, "/v1/wiki/attachments/attachment-1/archive", "/v1/wiki/attachments/:attachmentId/archive", "post", 200]
];

describe("wiki HTTP handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const [, operation, path] of rows) operation.mockResolvedValue({ id: path });
    service.getWikiAttachmentFile.mockResolvedValue({ mimeType: "image/png", size: 4, fileName: "safe.png", body: Buffer.from("wiki") });
  });

  it.each(rows)("executes a tenant-scoped Wiki operation for %s", async (handler, operation, path, route, method, status) => {
    const response = await requestHandler({ handler, path, route, method, body: method === "get" ? undefined : { title: "Base" } });
    expect(response.status).toBe(status);
    expect((await jsonEnvelope(response)).ok).toBe(true);
    expect(operation.mock.calls[0].some((value: unknown) => typeof value === "object" && value !== null && "organizationId" in value)).toBe(true);
  });

  it("streams an attachment with hardened inspection headers", async () => {
    const response = await requestHandler({ handler: handlers.getWikiAttachmentFileHandler, path: "/v1/wiki/attachments/attachment-1/file", route: "/v1/wiki/attachments/:attachmentId/file" });
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("image/png");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(await response.text()).toBe("wiki");
  });

  it.each([
    [new WikiError("VERSION_CONFLICT"), 409, "VERSION_CONFLICT"],
    [new WikiError("UNSUPPORTED_TYPE"), 415, "UNSUPPORTED_TYPE"],
    [new WikiError("FILE_TOO_LARGE"), 413, "FILE_TOO_LARGE"],
    [new WikiError("NOT_FOUND"), 404, "NOT_FOUND"]
  ])("maps Wiki workflow failures", async (error, status, code) => {
    service.updateWikiPage.mockRejectedValueOnce(error);
    const response = await requestHandler({ handler: handlers.updateWikiPageHandler, method: "patch", body: { title: "x" } });
    expect(response.status).toBe(status);
    expect(await jsonEnvelope(response)).toMatchObject({ ok: false, error: { code } });
  });
});
