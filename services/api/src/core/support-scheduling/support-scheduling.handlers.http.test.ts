import type { RequestHandler } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  adminUser,
  jsonEnvelope,
  requestHandler,
} from "../../test-support/http-handler-harness.js";

const service = vi.hoisted(() => ({
  acceptSupportShiftOffer: vi.fn(),
  assignSupportShiftPattern: vi.fn(),
  cancelSupportShiftOffer: vi.fn(),
  claimSupportExtraShiftSlot: vi.fn(),
  createSupportExtraShiftSlot: vi.fn(),
  createSupportScheduleRuleVersion: vi.fn(),
  createSupportShiftOffer: vi.fn(),
  createSupportShiftPatternVersion: vi.fn(),
  decideSupportExtraShiftClaim: vi.fn(),
  decideSupportShiftOffer: vi.fn(),
  listSupportScheduleCalendar: vi.fn(),
  listSupportSchedulePlanning: vi.fn(),
  materializeSupportShiftOccurrences: vi.fn(),
}));

vi.mock("../db/prisma.js", () => ({ prisma: { mocked: true } }));
vi.mock("./support-scheduling.service.js", async (importOriginal) => ({
  ...(await importOriginal<
    typeof import("./support-scheduling.service.js")
  >()),
  ...service,
}));

import * as handlers from "./support-scheduling.handlers.js";
import { SupportSchedulingError } from "./support-scheduling.service.js";

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
    name: "calendar",
    handler: handlers.listSupportScheduleCalendarHandler,
    operation: service.listSupportScheduleCalendar,
    path: "/v1/support/schedule?from=2026-07-01&to=2026-07-31",
    route: "/v1/support/schedule",
  },
  {
    name: "planning",
    handler: handlers.listSupportSchedulePlanningHandler,
    operation: service.listSupportSchedulePlanning,
    path: "/v1/support/schedule/planning?teamId=team-1",
    route: "/v1/support/schedule/planning",
  },
  {
    name: "rule version",
    handler: handlers.createSupportScheduleRuleVersionHandler,
    operation: service.createSupportScheduleRuleVersion,
    method: "post",
    path: "/v1/support/schedule/rules",
    route: "/v1/support/schedule/rules",
    body: { teamId: "team-1" },
    status: 201,
  },
  {
    name: "pattern version",
    handler: handlers.createSupportShiftPatternVersionHandler,
    operation: service.createSupportShiftPatternVersion,
    method: "post",
    path: "/v1/support/schedule/patterns",
    route: "/v1/support/schedule/patterns",
    body: { name: "Comercial" },
    status: 201,
  },
  {
    name: "pattern assignment",
    handler: handlers.assignSupportShiftPatternHandler,
    operation: service.assignSupportShiftPattern,
    method: "post",
    path: "/v1/support/schedule/assignments",
    route: "/v1/support/schedule/assignments",
    body: { patternId: "pattern-1" },
    status: 201,
  },
  {
    name: "occurrence materialization",
    handler: handlers.materializeSupportShiftOccurrencesHandler,
    operation: service.materializeSupportShiftOccurrences,
    method: "post",
    path: "/v1/support/schedule/materialize",
    route: "/v1/support/schedule/materialize",
    body: { teamId: "team-1", from: "2026-07-01", to: "2026-07-31" },
  },
  {
    name: "extra shift slot",
    handler: handlers.createSupportExtraShiftSlotHandler,
    operation: service.createSupportExtraShiftSlot,
    method: "post",
    path: "/v1/support/schedule/extra-shifts",
    route: "/v1/support/schedule/extra-shifts",
    body: { teamId: "team-1" },
    status: 201,
  },
  {
    name: "extra shift claim",
    handler: handlers.claimSupportExtraShiftSlotHandler,
    operation: service.claimSupportExtraShiftSlot,
    method: "post",
    path: "/v1/support/schedule/extra-shifts/slot-1/claim",
    route: "/v1/support/schedule/extra-shifts/:slotId/claim",
    body: { note: "Disponivel" },
  },
  {
    name: "extra shift decision",
    handler: handlers.decideSupportExtraShiftClaimHandler,
    operation: service.decideSupportExtraShiftClaim,
    method: "post",
    path: "/v1/support/schedule/extra-shift-claims/claim-1/decision",
    route: "/v1/support/schedule/extra-shift-claims/:claimId/decision",
    body: { decision: "APPROVED" },
  },
  {
    name: "shift offer",
    handler: handlers.createSupportShiftOfferHandler,
    operation: service.createSupportShiftOffer,
    method: "post",
    path: "/v1/support/schedule/offers",
    route: "/v1/support/schedule/offers",
    body: { occurrenceId: "occurrence-1" },
    status: 201,
  },
  {
    name: "shift offer acceptance",
    handler: handlers.acceptSupportShiftOfferHandler,
    operation: service.acceptSupportShiftOffer,
    method: "post",
    path: "/v1/support/schedule/offers/offer-1/accept",
    route: "/v1/support/schedule/offers/:offerId/accept",
    body: { note: "Aceito" },
  },
  {
    name: "shift offer decision",
    handler: handlers.decideSupportShiftOfferHandler,
    operation: service.decideSupportShiftOffer,
    method: "post",
    path: "/v1/support/schedule/offers/offer-1/decision",
    route: "/v1/support/schedule/offers/:offerId/decision",
    body: { decision: "APPROVED" },
  },
  {
    name: "shift offer cancellation",
    handler: handlers.cancelSupportShiftOfferHandler,
    operation: service.cancelSupportShiftOffer,
    method: "post",
    path: "/v1/support/schedule/offers/offer-1/cancel",
    route: "/v1/support/schedule/offers/:offerId/cancel",
    body: { reason: "Indisponivel" },
  },
];

describe("support scheduling HTTP handlers", () => {
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
    expect(scenario.operation.mock.calls[0]?.[1]).toEqual(adminUser);
  });

  it("parses and normalizes calendar query values", async () => {
    const response = await requestHandler({
      handler: handlers.listSupportScheduleCalendarHandler,
      path: "/schedule?from=%202026-07-01%20&to=%202026-07-31%20&scope=team&teamId=%20team-1%20&userId=%20user-1%20",
      route: "/schedule",
    });

    expect(response.status).toBe(200);
    expect(service.listSupportScheduleCalendar).toHaveBeenCalledWith(
      { mocked: true },
      adminUser,
      {
        from: "2026-07-01",
        to: "2026-07-31",
        scope: "TEAM",
        teamId: "team-1",
        userId: "user-1",
      },
    );
  });

  it("parses the required planning team and returns its service result", async () => {
    service.listSupportSchedulePlanning.mockResolvedValueOnce({
      team: { id: "team-1" },
      gaps: [{ localDate: "2026-07-20" }],
    });
    const response = await requestHandler({
      handler: handlers.listSupportSchedulePlanningHandler,
      path: "/planning?teamId=%20team-1%20",
      route: "/planning",
    });

    expect(response.status).toBe(200);
    expect(await jsonEnvelope(response)).toEqual({
      ok: true,
      data: {
        team: { id: "team-1" },
        gaps: [{ localDate: "2026-07-20" }],
      },
    });
    expect(service.listSupportSchedulePlanning).toHaveBeenCalledWith(
      { mocked: true },
      adminUser,
      { teamId: "team-1" },
    );
  });

  it.each([
    ["missing", "/planning"],
    ["blank", "/planning?teamId=%20%20"],
    ["repeated", "/planning?teamId=team-1&teamId=team-2"],
  ])("rejects a %s planning team before calling the service", async (_name, path) => {
    const response = await requestHandler({
      handler: handlers.listSupportSchedulePlanningHandler,
      path,
      route: "/planning",
    });

    expect(response.status).toBe(400);
    expect(await jsonEnvelope(response)).toEqual({
      ok: false,
      error: {
        code: "INVALID_INPUT",
        message: "Dados inválidos para a operação de Escalas.",
      },
    });
    expect(service.listSupportSchedulePlanning).not.toHaveBeenCalled();
  });

  it("rejects an unauthenticated planning request before calling the service", async () => {
    const response = await requestHandler({
      handler: handlers.listSupportSchedulePlanningHandler,
      path: "/planning?teamId=team-1",
      route: "/planning",
      user: null,
    });

    expect(response.status).toBe(403);
    expect(await jsonEnvelope(response)).toEqual({
      ok: false,
      error: {
        code: "FORBIDDEN",
        message: "Ação não permitida para este perfil ou escopo.",
      },
    });
    expect(service.listSupportSchedulePlanning).not.toHaveBeenCalled();
  });

  it("parses materialization fields and only accepts literal true for dryRun", async () => {
    const firstResponse = await requestHandler({
      handler: handlers.materializeSupportShiftOccurrencesHandler,
      method: "post",
      body: {
        teamId: " team-1 ",
        from: " 2026-07-01 ",
        to: " 2026-07-31 ",
        dryRun: true,
      },
    });
    const secondResponse = await requestHandler({
      handler: handlers.materializeSupportShiftOccurrencesHandler,
      method: "post",
      body: {
        teamId: "team-1",
        from: "2026-07-01",
        to: "2026-07-31",
        dryRun: "true",
      },
    });

    expect(firstResponse.status).toBe(200);
    expect(secondResponse.status).toBe(200);
    expect(service.materializeSupportShiftOccurrences).toHaveBeenNthCalledWith(
      1,
      { mocked: true },
      adminUser,
      {
        teamId: "team-1",
        from: "2026-07-01",
        to: "2026-07-31",
        dryRun: true,
      },
    );
    expect(service.materializeSupportShiftOccurrences).toHaveBeenNthCalledWith(
      2,
      { mocked: true },
      adminUser,
      {
        teamId: "team-1",
        from: "2026-07-01",
        to: "2026-07-31",
        dryRun: false,
      },
    );
  });

  it.each([
    ["absent", undefined],
    ["array", []],
  ])("rejects an %s materialization body before calling the service", async (_name, body) => {
    const response = await requestHandler({
      handler: handlers.materializeSupportShiftOccurrencesHandler,
      method: "post",
      body,
    });

    expect(response.status).toBe(400);
    expect(service.materializeSupportShiftOccurrences).not.toHaveBeenCalled();
  });

  it.each([
    [
      "rule version",
      handlers.createSupportScheduleRuleVersionHandler,
      service.createSupportScheduleRuleVersion,
      { teamId: "team-1", maxDailyMinutes: 480 },
    ],
    [
      "pattern version",
      handlers.createSupportShiftPatternVersionHandler,
      service.createSupportShiftPatternVersion,
      { name: "Horario comercial", weekdays: [1, 2, 3, 4, 5] },
    ],
    [
      "pattern assignment",
      handlers.assignSupportShiftPatternHandler,
      service.assignSupportShiftPattern,
      { patternId: "pattern-1", userId: "user-1" },
    ],
    [
      "extra shift slot",
      handlers.createSupportExtraShiftSlotHandler,
      service.createSupportExtraShiftSlot,
      { teamId: "team-1", localDate: "2026-07-20" },
    ],
    [
      "shift offer",
      handlers.createSupportShiftOfferHandler,
      service.createSupportShiftOffer,
      { occurrenceId: "occurrence-1", offeredToId: "user-2" },
    ],
  ] as const)("passes the %s body through unchanged", async (_name, handler, operation, body) => {
    const response = await requestHandler({ handler, method: "post", body });

    expect(response.status).toBe(201);
    expect(operation).toHaveBeenCalledWith({ mocked: true }, adminUser, body);
  });

  it.each([
    [
      "claim",
      handlers.claimSupportExtraShiftSlotHandler,
      service.claimSupportExtraShiftSlot,
      "/slots/%20slot-1%20/claim",
      "/slots/:slotId/claim",
      "slot-1",
    ],
    [
      "extra decision",
      handlers.decideSupportExtraShiftClaimHandler,
      service.decideSupportExtraShiftClaim,
      "/claims/%20claim-1%20/decision",
      "/claims/:claimId/decision",
      "claim-1",
    ],
    [
      "accept",
      handlers.acceptSupportShiftOfferHandler,
      service.acceptSupportShiftOffer,
      "/offers/%20offer-1%20/accept",
      "/offers/:offerId/accept",
      "offer-1",
    ],
    [
      "offer decision",
      handlers.decideSupportShiftOfferHandler,
      service.decideSupportShiftOffer,
      "/offers/%20offer-1%20/decision",
      "/offers/:offerId/decision",
      "offer-1",
    ],
    [
      "cancel",
      handlers.cancelSupportShiftOfferHandler,
      service.cancelSupportShiftOffer,
      "/offers/%20offer-1%20/cancel",
      "/offers/:offerId/cancel",
      "offer-1",
    ],
  ] as const)("trims the route parameter for %s", async (_name, handler, operation, path, route, expectedId) => {
    const body = { note: "body" };
    const response = await requestHandler({
      handler,
      method: "post",
      path,
      route,
      body,
    });

    expect(response.status).toBe(200);
    expect(operation).toHaveBeenCalledWith(
      { mocked: true },
      adminUser,
      expectedId,
      body,
    );
  });

  it.each([
    [
      "claim",
      handlers.claimSupportExtraShiftSlotHandler,
      service.claimSupportExtraShiftSlot,
      "/slots/slot-1/claim",
      "/slots/:slotId/claim",
    ],
    [
      "accept",
      handlers.acceptSupportShiftOfferHandler,
      service.acceptSupportShiftOffer,
      "/offers/offer-1/accept",
      "/offers/:offerId/accept",
    ],
    [
      "cancel",
      handlers.cancelSupportShiftOfferHandler,
      service.cancelSupportShiftOffer,
      "/offers/offer-1/cancel",
      "/offers/:offerId/cancel",
    ],
  ] as const)("defaults an absent %s body to an empty object", async (_name, handler, operation, path, route) => {
    const response = await requestHandler({
      handler,
      method: "post",
      path,
      route,
    });

    expect(response.status).toBe(200);
    expect(operation.mock.calls[0]?.[3]).toEqual({});
  });

  it.each([
    [
      new SupportSchedulingError("NOT_FOUND"),
      404,
      "NOT_FOUND",
      "Entidade de Escalas não encontrada.",
    ],
    [
      new SupportSchedulingError("FORBIDDEN"),
      403,
      "FORBIDDEN",
      "Ação não permitida para este perfil ou escopo.",
    ],
    [
      new SupportSchedulingError("CONFLICT"),
      409,
      "CONFLICT",
      "A operação conflita com o estado atual da Escala.",
    ],
    [
      new SupportSchedulingError("RULE_VIOLATION"),
      422,
      "RULE_VIOLATION",
      "A operação viola as regras vigentes de jornada.",
    ],
    [
      new SupportSchedulingError("INVALID_INPUT"),
      400,
      "INVALID_INPUT",
      "Dados inválidos para a operação de Escalas.",
    ],
  ])("maps scheduling errors to %s", async (error, status, code, message) => {
    service.listSupportSchedulePlanning.mockRejectedValueOnce(error);
    const response = await requestHandler({
      handler: handlers.listSupportSchedulePlanningHandler,
      path: "/planning?teamId=team-1",
      route: "/planning",
    });

    expect(response.status).toBe(status);
    expect(await jsonEnvelope(response)).toEqual({
      ok: false,
      error: { code, message },
    });
  });

  it.each(scenarios)("maps an unexpected $name failure without leaking the cause", async (scenario) => {
    scenario.operation.mockRejectedValueOnce(new Error("database unavailable"));
    const response = await requestHandler(scenario);

    expect(response.status).toBe(500);
    expect(await jsonEnvelope(response)).toEqual({
      ok: false,
      error: {
        code: "SUPPORT_SCHEDULING_FAILED",
        message: "Falha na operação de Escalas SAC.",
      },
    });
  });
});
