import { beforeEach, describe, expect, it, vi } from "vitest";
import { requireRole } from "../auth/auth.middleware.js";
import { InputValidationError } from "../validation/input-validation.js";
import { adminUser, jsonEnvelope, requestHandler } from "../../test-support/http-handler-harness.js";

const service = vi.hoisted(() => ({
  createSector: vi.fn(),
  createUnit: vi.fn(),
  getOrganizationSettings: vi.fn(),
  getOrganizationTree: vi.fn(),
  parseOrganizationSettingsUpdate: vi.fn((body) => body),
  parseOrganizationUpdate: vi.fn((body) => body),
  parseSectorInput: vi.fn((body) => body),
  parseUnitInput: vi.fn((body) => body),
  updateCurrentOrganization: vi.fn(),
  updateOrganizationSettings: vi.fn(),
  updateSector: vi.fn(),
  updateUnit: vi.fn()
}));

vi.mock("../db/prisma.js", () => ({ prisma: { mocked: true } }));
vi.mock("./organizations.service.js", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./organizations.service.js")>()),
  ...service
}));

import {
  createSectorHandler,
  createUnitHandler,
  getOrganizationHandler,
  getOrganizationSettingsHandler,
  updateOrganizationHandler,
  updateOrganizationSettingsHandler,
  updateSectorHandler,
  updateUnitHandler
} from "./organizations.handlers.js";
import { OrganizationError } from "./organizations.service.js";

describe("organization HTTP handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const mock of [
      service.createSector,
      service.createUnit,
      service.getOrganizationSettings,
      service.getOrganizationTree,
      service.updateCurrentOrganization,
      service.updateOrganizationSettings,
      service.updateSector,
      service.updateUnit
    ]) mock.mockResolvedValue({ id: "result-1" });
  });

  it.each([
    ["get tree", getOrganizationHandler, service.getOrganizationTree, "get", "/v1/organization", "/v1/organization", undefined, 200],
    ["update organization", updateOrganizationHandler, service.updateCurrentOrganization, "patch", "/v1/organization", "/v1/organization", { name: "ACME" }, 200],
    ["get settings", getOrganizationSettingsHandler, service.getOrganizationSettings, "get", "/v1/organization/settings", "/v1/organization/settings", undefined, 200],
    ["update settings", updateOrganizationSettingsHandler, service.updateOrganizationSettings, "patch", "/v1/organization/settings", "/v1/organization/settings", { name: "ACME" }, 200],
    ["create unit", createUnitHandler, service.createUnit, "post", "/v1/organization/units", "/v1/organization/units", { name: "North" }, 201],
    ["update unit", updateUnitHandler, service.updateUnit, "patch", "/v1/organization/units/unit-1", "/v1/organization/units/:unitId", { name: "North" }, 200],
    ["create sector", createSectorHandler, service.createSector, "post", "/v1/organization/units/unit-1/sectors", "/v1/organization/units/:unitId/sectors", { name: "Sales" }, 201],
    ["update sector", updateSectorHandler, service.updateSector, "patch", "/v1/organization/sectors/sector-1", "/v1/organization/sectors/:sectorId", { name: "Sales" }, 200]
  ] as const)("returns a successful envelope for %s", async (_name, handler, mock, method, path, route, body, status) => {
    const response = await requestHandler({ handler, method, path, route, body });
    expect(response.status).toBe(status);
    expect(await jsonEnvelope(response)).toMatchObject({ ok: true });
    expect(mock.mock.calls[0]?.[1]).toEqual({ id: "admin-1", organizationId: "org-1" });
  });

  it("rejects an unauthenticated actor without reaching persistence", async () => {
    const response = await requestHandler({ handler: getOrganizationHandler, user: null });
    expect(response.status).toBe(404);
    expect(await jsonEnvelope(response)).toMatchObject({ ok: false, error: { code: "NOT_FOUND" } });
    expect(service.getOrganizationTree).not.toHaveBeenCalled();
  });

  it("enforces the route role before the handler", async () => {
    const response = await requestHandler({
      handler: getOrganizationHandler,
      middleware: [requireRole(["ADMIN"])],
      user: { ...adminUser, role: "SAC" }
    });
    expect(response.status).toBe(403);
    expect(await jsonEnvelope(response)).toMatchObject({ ok: false, error: { code: "FORBIDDEN" } });
    expect(service.getOrganizationTree).not.toHaveBeenCalled();
  });

  it.each([
    [new OrganizationError("NOT_FOUND"), 404, "NOT_FOUND"],
    [new OrganizationError("INVALID_INPUT"), 400, "INVALID_INPUT"],
    [new InputValidationError([{ field: "name", code: "INVALID_TYPE" }]), 400, "INVALID_INPUT"]
  ])("maps domain and validation failures to an envelope", async (error, status, code) => {
    service.updateCurrentOrganization.mockRejectedValueOnce(error);
    const response = await requestHandler({ handler: updateOrganizationHandler, method: "patch", body: {} });
    expect(response.status).toBe(status);
    expect(await jsonEnvelope(response)).toMatchObject({ ok: false, error: { code } });
  });

  it("maps an unexpected service failure through the HTTP error envelope", async () => {
    service.getOrganizationTree.mockRejectedValueOnce(new Error("database unavailable"));
    const response = await requestHandler({ handler: getOrganizationHandler });
    expect(response.status).toBe(500);
    expect(await jsonEnvelope(response)).toMatchObject({ ok: false, error: { code: "INTERNAL_ERROR" } });
  });
});
