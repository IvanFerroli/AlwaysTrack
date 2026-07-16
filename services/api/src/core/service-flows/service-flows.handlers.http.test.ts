import type { RequestHandler } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { jsonEnvelope, requestHandler } from "../../test-support/http-handler-harness.js";
import { InputValidationError } from "../validation/input-validation.js";

const service = vi.hoisted(() => ({
  archiveServiceFlow: vi.fn(),
  completeServiceFlowSession: vi.fn(),
  createServiceFlow: vi.fn(),
  createServiceFlowSession: vi.fn(),
  getServiceFlow: vi.fn(),
  getServiceFlowSession: vi.fn(),
  listServiceFlows: vi.fn(),
  parseServiceFlowFilters: vi.fn((value) => value),
  parseServiceFlowGovernanceInput: vi.fn((value) => value),
  parseServiceFlowInput: vi.fn((value) => value),
  parseServiceFlowSessionCaseDataInput: vi.fn((value) => value),
  parseServiceFlowSessionRewindInput: vi.fn((value) => value),
  parseServiceFlowSessionStepInput: vi.fn((value) => value),
  publishServiceFlow: vi.fn(),
  rewindServiceFlowSessionStep: vi.fn(),
  serviceFlowMetrics: vi.fn(),
  updateServiceFlow: vi.fn(),
  updateServiceFlowSessionCaseData: vi.fn(),
  updateServiceFlowSessionStep: vi.fn()
}));

vi.mock("../db/prisma.js", () => ({ prisma: { mocked: true } }));
vi.mock("./service-flows.service.js", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./service-flows.service.js")>()),
  ...service
}));

import * as handlers from "./service-flows.handlers.js";
import { ServiceFlowError } from "./service-flows.service.js";

interface Scenario {
  handler: RequestHandler;
  operation: ReturnType<typeof vi.fn>;
  method?: "get" | "patch" | "post";
  path: string;
  route: string;
  status?: number;
  body?: unknown;
}

const scenarios: Scenario[] = [
  { handler: handlers.listServiceFlowsHandler, operation: service.listServiceFlows, path: "/v1/service-flows?status=published", route: "/v1/service-flows" },
  { handler: handlers.getServiceFlowHandler, operation: service.getServiceFlow, path: "/v1/service-flows/triagem", route: "/v1/service-flows/:flowIdOrSlug" },
  { handler: handlers.createServiceFlowHandler, operation: service.createServiceFlow, method: "post", path: "/v1/service-flows", route: "/v1/service-flows", body: { title: "Triagem" }, status: 201 },
  { handler: handlers.updateServiceFlowHandler, operation: service.updateServiceFlow, method: "patch", path: "/v1/service-flows/flow-1", route: "/v1/service-flows/:flowId", body: { title: "Atualizado" } },
  { handler: handlers.publishServiceFlowHandler, operation: service.publishServiceFlow, method: "post", path: "/v1/service-flows/flow-1/publish", route: "/v1/service-flows/:flowId/publish", body: { comment: "Revisado" } },
  { handler: handlers.archiveServiceFlowHandler, operation: service.archiveServiceFlow, method: "post", path: "/v1/service-flows/flow-1/archive", route: "/v1/service-flows/:flowId/archive", body: { comment: "Substituido" } },
  { handler: handlers.serviceFlowMetricsHandler, operation: service.serviceFlowMetrics, path: "/v1/service-flows/metrics", route: "/v1/service-flows/metrics" },
  { handler: handlers.createServiceFlowSessionHandler, operation: service.createServiceFlowSession, method: "post", path: "/v1/service-flows/triagem/sessions", route: "/v1/service-flows/:flowIdOrSlug/sessions", status: 201 },
  { handler: handlers.getServiceFlowSessionHandler, operation: service.getServiceFlowSession, path: "/v1/service-flow-sessions/session-1", route: "/v1/service-flow-sessions/:sessionId" },
  { handler: handlers.updateServiceFlowSessionCaseDataHandler, operation: service.updateServiceFlowSessionCaseData, method: "patch", path: "/v1/service-flow-sessions/session-1/case-data", route: "/v1/service-flow-sessions/:sessionId/case-data", body: { values: { "customer.name": "Ana" } } },
  { handler: handlers.updateServiceFlowSessionStepHandler, operation: service.updateServiceFlowSessionStep, method: "post", path: "/v1/service-flow-sessions/session-1/steps/step-1", route: "/v1/service-flow-sessions/:sessionId/steps/:stepId", body: { status: "DONE" } },
  { handler: handlers.rewindServiceFlowSessionStepHandler, operation: service.rewindServiceFlowSessionStep, method: "post", path: "/v1/service-flow-sessions/session-1/steps/step-1/rewind", route: "/v1/service-flow-sessions/:sessionId/steps/:stepId/rewind", body: { strategy: "RECONFIRM_FOLLOWING" } },
  { handler: handlers.completeServiceFlowSessionHandler, operation: service.completeServiceFlowSession, method: "post", path: "/v1/service-flow-sessions/session-1/complete", route: "/v1/service-flow-sessions/:sessionId/complete" }
];

describe("service flow HTTP handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const scenario of scenarios) scenario.operation.mockResolvedValue({ resource: scenario.path });
  });

  it.each(scenarios)("executes the tenant-bound workflow for $path", async (scenario) => {
    const response = await requestHandler(scenario);

    expect(response.status).toBe(scenario.status ?? 200);
    expect(await jsonEnvelope(response)).toMatchObject({ ok: true, data: { resource: scenario.path } });
    expect(scenario.operation).toHaveBeenCalledOnce();
    expect(scenario.operation.mock.calls[0][1]).toMatchObject({ id: "admin-1", organizationId: "org-1" });
  });

  it("rejects unauthenticated session creation before persistence", async () => {
    const response = await requestHandler({ handler: handlers.createServiceFlowSessionHandler, method: "post", user: null });
    expect(response.status).toBe(403);
    expect(await jsonEnvelope(response)).toMatchObject({ ok: false, error: { code: "FORBIDDEN" } });
    expect(service.createServiceFlowSession).not.toHaveBeenCalled();
  });

  it.each([
    [new ServiceFlowError("NOT_FOUND"), 404, "NOT_FOUND"],
    [new ServiceFlowError("SLUG_TAKEN"), 409, "SLUG_TAKEN"],
    [new ServiceFlowError("INVALID_INPUT"), 400, "INVALID_INPUT"]
  ])("maps workflow errors without leaking implementation details", async (error, status, code) => {
    service.publishServiceFlow.mockRejectedValueOnce(error);
    const response = await requestHandler({ handler: handlers.publishServiceFlowHandler, method: "post", body: { comment: "ok" } });
    expect(response.status).toBe(status);
    expect(await jsonEnvelope(response)).toMatchObject({ ok: false, error: { code } });
  });

  it("maps malformed case data payloads", async () => {
    service.parseServiceFlowSessionCaseDataInput.mockImplementationOnce(() => {
      throw new InputValidationError([{ field: "values", code: "TOO_MANY_ITEMS" }]);
    });
    const response = await requestHandler({ handler: handlers.updateServiceFlowSessionCaseDataHandler, method: "patch", body: { values: {} } });
    expect(response.status).toBe(400);
    expect(await jsonEnvelope(response)).toMatchObject({ ok: false, error: { code: "INVALID_INPUT" } });
  });

  it("returns only missing field keys for required facts", async () => {
    service.updateServiceFlowSessionStep.mockRejectedValueOnce(new ServiceFlowError("MISSING_REQUIRED_FACTS", ["customer.name"]));
    const response = await requestHandler({
      handler: handlers.updateServiceFlowSessionStepHandler,
      method: "post",
      path: "/sessions/session-1/steps/check",
      route: "/sessions/:sessionId/steps/:stepId",
      body: { status: "DONE" }
    });
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      ok: false,
      error: {
        code: "MISSING_REQUIRED_FACTS",
        message: "Required case data is missing.",
        details: { missingFieldKeys: ["customer.name"] }
      }
    });
  });
});
