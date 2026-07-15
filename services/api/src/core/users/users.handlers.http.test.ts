import { beforeEach, describe, expect, it, vi } from "vitest";
import { InputValidationError } from "../validation/input-validation.js";
import { jsonEnvelope, requestHandler } from "../../test-support/http-handler-harness.js";

const service = vi.hoisted(() => ({
  createManagedUser: vi.fn(),
  getUserProfile: vi.fn(),
  listCommercialUserOptions: vi.fn(),
  listManagedUsers: vi.fn(),
  parseCreateUserInput: vi.fn((body) => body),
  parseProfileInput: vi.fn((body) => body),
  parseResetPasswordInput: vi.fn((body) => body),
  parseUpdateUserInput: vi.fn((body) => body),
  resetManagedUserPassword: vi.fn(),
  updateUserProfile: vi.fn(),
  updateManagedUser: vi.fn()
}));

vi.mock("../db/prisma.js", () => ({ prisma: { mocked: true } }));
vi.mock("./users.service.js", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./users.service.js")>()),
  ...service
}));

import {
  createUserHandler,
  getProfileHandler,
  listCommercialUserOptionsHandler,
  listUsersHandler,
  resetUserPasswordHandler,
  updateProfileHandler,
  updateUserHandler
} from "./users.handlers.js";
import { UserManagementError } from "./users.service.js";

describe("user management HTTP handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const mock of [
      service.createManagedUser,
      service.getUserProfile,
      service.listCommercialUserOptions,
      service.listManagedUsers,
      service.resetManagedUserPassword,
      service.updateUserProfile,
      service.updateManagedUser
    ]) mock.mockResolvedValue({ id: "user-2" });
  });

  it.each([
    ["list users", listUsersHandler, service.listManagedUsers, "get", "/v1/users", "/v1/users", undefined, 200],
    ["get profile", getProfileHandler, service.getUserProfile, "get", "/v1/profile", "/v1/profile", undefined, 200],
    ["update profile", updateProfileHandler, service.updateUserProfile, "patch", "/v1/profile", "/v1/profile", { name: "Admin" }, 200],
    ["list options", listCommercialUserOptionsHandler, service.listCommercialUserOptions, "get", "/v1/users/commercial-options", "/v1/users/commercial-options", undefined, 200],
    ["create user", createUserHandler, service.createManagedUser, "post", "/v1/users", "/v1/users", { name: "Agent" }, 201],
    ["update user", updateUserHandler, service.updateManagedUser, "patch", "/v1/users/user-2", "/v1/users/:userId", { name: "Agent" }, 200],
    ["reset password", resetUserPasswordHandler, service.resetManagedUserPassword, "post", "/v1/users/user-2/reset-password", "/v1/users/:userId/reset-password", { password: "Strong#2026" }, 200]
  ] as const)("returns a successful envelope for %s", async (_name, handler, mock, method, path, route, body, status) => {
    const response = await requestHandler({ handler, method, path, route, body });
    expect(response.status).toBe(status);
    expect(await jsonEnvelope(response)).toMatchObject({ ok: true });
    expect(mock.mock.calls[0]?.[1]).toEqual({ id: "admin-1", organizationId: "org-1" });
  });

  it("does not allow a handler to run without an authenticated tenant", async () => {
    const response = await requestHandler({ handler: listUsersHandler, user: null });
    expect(response.status).toBe(404);
    expect(service.listManagedUsers).not.toHaveBeenCalled();
    expect(await jsonEnvelope(response)).toMatchObject({ ok: false, error: { code: "NOT_FOUND" } });
  });

  it.each([
    [new UserManagementError("NOT_FOUND"), 404, "NOT_FOUND"],
    [new UserManagementError("EMAIL_TAKEN"), 409, "EMAIL_TAKEN"],
    [new UserManagementError("SELF_DEACTIVATE"), 400, "SELF_DEACTIVATE"],
    [new UserManagementError("INVALID_INPUT"), 400, "INVALID_INPUT"],
    [new InputValidationError([{ field: "email", code: "INVALID_TYPE" }]), 400, "INVALID_INPUT"]
  ])("maps user domain failures to HTTP envelopes", async (error, status, code) => {
    service.createManagedUser.mockRejectedValueOnce(error);
    const response = await requestHandler({ handler: createUserHandler, method: "post", body: {} });
    expect(response.status).toBe(status);
    expect(await jsonEnvelope(response)).toMatchObject({ ok: false, error: { code } });
  });

  it("maps an unexpected service error to the standard 500 envelope", async () => {
    service.listManagedUsers.mockRejectedValueOnce(new Error("prisma failed"));
    const response = await requestHandler({ handler: listUsersHandler });
    expect(response.status).toBe(500);
    expect(await jsonEnvelope(response)).toMatchObject({ ok: false, error: { code: "INTERNAL_ERROR" } });
  });
});
