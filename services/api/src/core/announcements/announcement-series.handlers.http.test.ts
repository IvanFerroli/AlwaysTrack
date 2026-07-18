import type { RequestHandler } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  adminUser,
  jsonEnvelope,
  requestHandler,
} from "../../test-support/http-handler-harness.js";

const service = vi.hoisted(() => ({
  archiveAnnouncementSeries: vi.fn(),
  cancelAnnouncementOccurrence: vi.fn(),
  createAnnouncementSeries: vi.fn(),
  createFutureAnnouncementSeriesVersion: vi.fn(),
  getAnnouncementSeries: vi.fn(),
  listAnnouncementSeries: vi.fn(),
  materializeAnnouncementOccurrences: vi.fn(),
}));

vi.mock("../db/prisma.js", () => ({ prisma: { mocked: true } }));
vi.mock("./announcement-series.service.js", async (importOriginal) => ({
  ...(await importOriginal<
    typeof import("./announcement-series.service.js")
  >()),
  ...service,
}));

import * as handlers from "./announcement-series.handlers.js";
import { AnnouncementError } from "./announcements.service.js";

interface Scenario {
  name: string;
  handler: RequestHandler;
  operation: ReturnType<typeof vi.fn>;
  method?: "get" | "post";
  path: string;
  route: string;
  body?: unknown;
  status?: number;
}

const scenarios: Scenario[] = [
  {
    name: "list series",
    handler: handlers.listAnnouncementSeriesHandler,
    operation: service.listAnnouncementSeries,
    path: "/v1/announcement-series",
    route: "/v1/announcement-series",
  },
  {
    name: "get series",
    handler: handlers.getAnnouncementSeriesHandler,
    operation: service.getAnnouncementSeries,
    path: "/v1/announcement-series/series-1",
    route: "/v1/announcement-series/:seriesId",
  },
  {
    name: "create series",
    handler: handlers.createAnnouncementSeriesHandler,
    operation: service.createAnnouncementSeries,
    method: "post",
    path: "/v1/announcement-series",
    route: "/v1/announcement-series",
    body: { title: "Aviso recorrente" },
    status: 201,
  },
  {
    name: "create series version",
    handler: handlers.createAnnouncementSeriesVersionHandler,
    operation: service.createFutureAnnouncementSeriesVersion,
    method: "post",
    path: "/v1/announcement-series/series-1/versions",
    route: "/v1/announcement-series/:seriesId/versions",
    body: { title: "Nova versao" },
    status: 201,
  },
  {
    name: "archive series",
    handler: handlers.archiveAnnouncementSeriesHandler,
    operation: service.archiveAnnouncementSeries,
    method: "post",
    path: "/v1/announcement-series/series-1/archive",
    route: "/v1/announcement-series/:seriesId/archive",
    body: { reason: "Encerrada" },
  },
  {
    name: "materialize occurrences",
    handler: handlers.materializeAnnouncementOccurrencesHandler,
    operation: service.materializeAnnouncementOccurrences,
    method: "post",
    path: "/v1/announcement-series/materialize",
    route: "/v1/announcement-series/materialize",
    body: { horizonDays: 31 },
  },
  {
    name: "cancel occurrence",
    handler: handlers.cancelAnnouncementOccurrenceHandler,
    operation: service.cancelAnnouncementOccurrence,
    method: "post",
    path: "/v1/announcement-occurrences/occurrence-1/cancel",
    route: "/v1/announcement-occurrences/:occurrenceId/cancel",
    body: { reason: "Fora de contexto" },
  },
];

describe("announcement series HTTP handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const scenario of scenarios) {
      scenario.operation.mockResolvedValue({ id: `${scenario.name}-result` });
    }
  });

  it.each(scenarios)("returns the standard envelope for $name", async (scenario) => {
    const response = await requestHandler(scenario);

    expect(response.status).toBe(scenario.status ?? 200);
    expect(await jsonEnvelope(response)).toEqual({
      ok: true,
      data: { id: `${scenario.name}-result` },
    });
    expect(scenario.operation).toHaveBeenCalledOnce();
    expect(scenario.operation.mock.calls[0]?.[0]).toEqual({ mocked: true });
  });

  it("parses and normalizes series filters", async () => {
    const response = await requestHandler({
      handler: handlers.listAnnouncementSeriesHandler,
      path: "/series?status=%20active%20&fromDate=%202026-07-01%20&toDate=%202026-07-31%20",
      route: "/series",
    });

    expect(response.status).toBe(200);
    expect(service.listAnnouncementSeries).toHaveBeenCalledWith(
      { mocked: true },
      adminUser,
      {
        status: "ACTIVE",
        fromDate: "2026-07-01",
        toDate: "2026-07-31",
      },
    );
  });

  it("passes the parsed series route parameter", async () => {
    const response = await requestHandler({
      handler: handlers.getAnnouncementSeriesHandler,
      path: "/series/series-1",
      route: "/series/:seriesId",
    });

    expect(response.status).toBe(200);
    expect(service.getAnnouncementSeries).toHaveBeenCalledWith(
      { mocked: true },
      adminUser,
      "series-1",
    );
  });

  it("normalizes the create-series body before calling the service", async () => {
    const response = await requestHandler({
      handler: handlers.createAnnouncementSeriesHandler,
      method: "post",
      body: {
        slug: " aviso-mensal ",
        effectiveFromDate: " 2026-08-01 ",
        validFromDate: " 2026-08-01 ",
        validToDate: null,
        timezone: " America/Sao_Paulo ",
        localTime: " 09:30 ",
        recurrenceDays: [29, 14],
        missingDayPolicy: "skip",
        durationMinutes: "60",
        title: " Aviso mensal ",
        summary: " Resumo ",
        content: " Conteudo ",
        tags: [" #Avisos ", "SAC", "SAC"],
        links: [
          {
            type: "url",
            label: " Politica ",
            href: " https://example.com/politica ",
          },
        ],
        targetRoles: ["SAC"],
        priority: "high",
        pinned: true,
        requiresAck: false,
      },
    });

    expect(response.status).toBe(201);
    expect(service.createAnnouncementSeries).toHaveBeenCalledWith(
      { mocked: true },
      adminUser,
      {
        slug: "aviso-mensal",
        effectiveFromDate: "2026-08-01",
        validFromDate: "2026-08-01",
        validToDate: null,
        timezone: "America/Sao_Paulo",
        localTime: "09:30",
        recurrenceDays: [14, 29],
        missingDayPolicy: "SKIP",
        durationMinutes: 60,
        title: "Aviso mensal",
        summary: "Resumo",
        content: "Conteudo",
        tags: ["avisos", "sac"],
        links: [
          {
            type: "URL",
            label: "Politica",
            href: "https://example.com/politica",
          },
        ],
        targetRoles: ["SAC"],
        priority: "HIGH",
        pinned: true,
        requiresAck: false,
      },
    );
  });

  it("rejects an explicitly empty or partially invalid series audience", async () => {
    for (const targetRoles of [[], ["SAC", "INVALID_ROLE"]]) {
      const response = await requestHandler({
        handler: handlers.createAnnouncementSeriesHandler,
        method: "post",
        body: { targetRoles }
      });

      expect(response.status).toBe(400);
      expect(await jsonEnvelope(response)).toMatchObject({ ok: false, error: { code: "INVALID_INPUT" } });
    }
    expect(service.createAnnouncementSeries).not.toHaveBeenCalled();
  });

  it("removes slug and parses the series-version body", async () => {
    const response = await requestHandler({
      handler: handlers.createAnnouncementSeriesVersionHandler,
      method: "post",
      path: "/series/series-1/versions",
      route: "/series/:seriesId/versions",
      body: {
        slug: "ignored-slug",
        effectiveFromDate: " 2026-09-01 ",
        title: " Versao futura ",
        pinned: false,
      },
    });

    expect(response.status).toBe(201);
    expect(service.createFutureAnnouncementSeriesVersion).toHaveBeenCalledWith(
      { mocked: true },
      adminUser,
      "series-1",
      {
        effectiveFromDate: "2026-09-01",
        title: "Versao futura",
        pinned: false,
        validFromDate: undefined,
        validToDate: undefined,
        timezone: undefined,
        localTime: undefined,
        recurrenceDays: undefined,
        missingDayPolicy: undefined,
        durationMinutes: undefined,
        summary: undefined,
        content: undefined,
        tags: undefined,
        links: undefined,
        targetRoles: undefined,
        priority: undefined,
        requiresAck: undefined,
      },
    );
  });

  it.each([
    ["custom", { reason: " Encerrada pelo gestor " }, "Encerrada pelo gestor"],
    ["default", {}, "SERIES_ARCHIVED"],
    ["blank", { reason: "   " }, "SERIES_ARCHIVED"],
  ])("uses the %s archive reason", async (_name, body, expectedReason) => {
    const response = await requestHandler({
      handler: handlers.archiveAnnouncementSeriesHandler,
      method: "post",
      path: "/series/series-1/archive",
      route: "/series/:seriesId/archive",
      body,
    });

    expect(response.status).toBe(200);
    expect(service.archiveAnnouncementSeries).toHaveBeenCalledWith(
      { mocked: true },
      adminUser,
      "series-1",
      expectedReason,
    );
  });

  it("parses materialization options and merges the authenticated actor", async () => {
    const response = await requestHandler({
      handler: handlers.materializeAnnouncementOccurrencesHandler,
      method: "post",
      body: {
        fromDate: " 2026-07-01 ",
        toDate: " 2026-07-31 ",
        horizonDays: "45",
        catchUpDays: 5,
        publishDue: true,
        dryRun: false,
      },
    });

    expect(response.status).toBe(200);
    expect(service.materializeAnnouncementOccurrences).toHaveBeenCalledWith(
      { mocked: true },
      {
        actor: adminUser,
        fromDate: "2026-07-01",
        toDate: "2026-07-31",
        horizonDays: 45,
        catchUpDays: 5,
        publishDue: true,
        dryRun: false,
      },
    );
  });

  it("parses the occurrence parameter and cancellation reason", async () => {
    const response = await requestHandler({
      handler: handlers.cancelAnnouncementOccurrenceHandler,
      method: "post",
      path: "/occurrences/occurrence-1/cancel",
      route: "/occurrences/:occurrenceId/cancel",
      body: { reason: " Fora de contexto " },
    });

    expect(response.status).toBe(200);
    expect(service.cancelAnnouncementOccurrence).toHaveBeenCalledWith(
      { mocked: true },
      adminUser,
      "occurrence-1",
      "Fora de contexto",
    );
  });

  it("rejects an unauthenticated actor before calling the series service", async () => {
    const response = await requestHandler({
      handler: handlers.listAnnouncementSeriesHandler,
      user: null,
    });

    expect(response.status).toBe(403);
    expect(await jsonEnvelope(response)).toEqual({
      ok: false,
      error: { code: "FORBIDDEN", message: "Access denied." },
    });
    expect(service.listAnnouncementSeries).not.toHaveBeenCalled();
  });

  it.each([
    [
      new AnnouncementError("FORBIDDEN"),
      403,
      "FORBIDDEN",
      "Access denied.",
    ],
    [
      new AnnouncementError("NOT_FOUND"),
      404,
      "NOT_FOUND",
      "Announcement schedule not found.",
    ],
    [
      new AnnouncementError("SLUG_TAKEN"),
      409,
      "SLUG_TAKEN",
      "Announcement series slug already exists.",
    ],
    [
      new AnnouncementError("CONFLICT"),
      409,
      "CONFLICT",
      "Announcement schedule state conflicts with this operation.",
    ],
    [
      new AnnouncementError("INVALID_INPUT"),
      400,
      "INVALID_INPUT",
      "Invalid announcement schedule payload.",
    ],
  ])("maps series errors to %s", async (error, status, code, message) => {
    service.getAnnouncementSeries.mockRejectedValueOnce(error);
    const response = await requestHandler({
      handler: handlers.getAnnouncementSeriesHandler,
      path: "/series/series-1",
      route: "/series/:seriesId",
    });

    expect(response.status).toBe(status);
    expect(await jsonEnvelope(response)).toEqual({
      ok: false,
      error: { code, message },
    });
  });

  it.each([
    ["non-object body", handlers.createAnnouncementSeriesHandler, "post", "/resource", "/resource", []],
    ["invalid filters", handlers.listAnnouncementSeriesHandler, "get", "/series?status=unknown", "/series", undefined],
    ["invalid materialization", handlers.materializeAnnouncementOccurrencesHandler, "post", "/resource", "/resource", { horizonDays: 367 }],
  ] as const)("maps %s validation failures", async (_name, handler, method, path, route, body) => {
    const response = await requestHandler({
      handler,
      method,
      path,
      route,
      body,
    });

    expect(response.status).toBe(400);
    expect(await jsonEnvelope(response)).toMatchObject({
      ok: false,
      error: { code: "INVALID_INPUT" },
    });
  });

  it.each(scenarios)("passes an unexpected $name failure to the HTTP error boundary", async (scenario) => {
    scenario.operation.mockRejectedValueOnce(new Error("database unavailable"));
    const response = await requestHandler(scenario);

    expect(response.status).toBe(500);
    expect(await jsonEnvelope(response)).toEqual({
      ok: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Unexpected server error.",
      },
    });
  });
});
