import { beforeEach, describe, expect, it, vi } from "vitest";
import { InputValidationError } from "../validation/input-validation.js";
import { adminUser, jsonEnvelope, requestHandler } from "../../test-support/http-handler-harness.js";

const auth = vi.hoisted(() => ({
  loginUser: vi.fn(),
  loginUserByVerifiedGoogleEmail: vi.fn(),
  parseLoginInput: vi.fn((body) => body)
}));
const google = vi.hoisted(() => ({
  createGoogleLoginStart: vi.fn(),
  isGoogleLoginConfigured: vi.fn(),
  resolveGoogleLoginProfile: vi.fn()
}));
const audit = vi.hoisted(() => ({ recordAuditLog: vi.fn() }));
const env = {
  appMode: "internal",
  appName: "AlwaysTrack <Suite>",
  betaAllowedEmails: [],
  corsOrigin: "http://localhost:5173",
  googleLoginAllowedDomains: ["example.com"],
  sessionCookieName: "at_session",
  sessionSecret: "test-secret-with-at-least-32-characters"
};

vi.mock("../../config/env.js", () => ({ loadEnv: () => env }));
vi.mock("../audit/audit.service.js", () => audit);
vi.mock("../db/prisma.js", () => ({ prisma: { mocked: true } }));
vi.mock("./auth.service.js", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./auth.service.js")>()),
  ...auth
}));
vi.mock("./google-login.service.js", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./google-login.service.js")>()),
  ...google
}));

import {
  googleLoginCallbackHandler,
  googleLoginStartHandler,
  googleLoginStatusHandler,
  loginHandler,
  logoutHandler,
  meHandler
} from "./auth.handlers.js";
import { AuthError } from "./auth.service.js";
import { GoogleLoginError } from "./google-login.service.js";

describe("auth HTTP handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    env.googleLoginAllowedDomains = ["example.com"];
    auth.parseLoginInput.mockImplementation((body) => body);
    auth.loginUser.mockResolvedValue({ token: "signed-token", user: adminUser });
    auth.loginUserByVerifiedGoogleEmail.mockResolvedValue({ token: "google-token", user: adminUser });
    google.isGoogleLoginConfigured.mockReturnValue(true);
    google.createGoogleLoginStart.mockReturnValue({ url: "https://accounts.example/auth", stateCookie: "state-cookie" });
    google.resolveGoogleLoginProfile.mockResolvedValue({ email: "admin@example.com", emailVerified: true });
    audit.recordAuditLog.mockResolvedValue(undefined);
  });

  it("logs in and returns the documented session envelope", async () => {
    const response = await requestHandler({ handler: loginHandler, method: "post", path: "/v1/auth/login", route: "/v1/auth/login", body: { email: "admin@example.com", password: "secret" } });
    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toContain("at_session=signed-token");
    expect(await jsonEnvelope(response)).toMatchObject({ ok: true, data: { user: { id: "admin-1" } } });
  });

  it.each([
    [undefined, 400, "INVALID_INPUT"],
    [new AuthError("INVALID_CREDENTIALS"), 401, "INVALID_CREDENTIALS"],
    [new InputValidationError([{ field: "email", code: "INVALID_TYPE" }]), 400, "INVALID_INPUT"]
  ])("maps login validation and authentication failures", async (error, status, code) => {
    if (error === undefined) auth.parseLoginInput.mockReturnValueOnce({ email: "" });
    else if (error instanceof InputValidationError) auth.parseLoginInput.mockImplementationOnce(() => { throw error; });
    else auth.loginUser.mockRejectedValueOnce(error);
    const response = await requestHandler({ handler: loginHandler, method: "post", body: { email: "bad", password: "bad" } });
    expect(response.status).toBe(status);
    expect(await jsonEnvelope(response)).toMatchObject({ ok: false, error: { code } });
  });

  it("reports Google configuration without exposing secrets", async () => {
    const response = await requestHandler({ handler: googleLoginStatusHandler, path: "/v1/auth/google/status", route: "/v1/auth/google/status" });
    expect(await jsonEnvelope(response)).toEqual({ ok: true, data: { configured: true } });
  });

  it("starts Google login with state cookie and redirect", async () => {
    const response = await requestHandler({ handler: googleLoginStartHandler, path: "/v1/auth/google/start", route: "/v1/auth/google/start" });
    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe("https://accounts.example/auth");
    expect(response.headers.get("set-cookie")).toContain("alwaystrack_google_login_state=state-cookie");
  });

  it.each([
    ["domains", null],
    ["provider", new GoogleLoginError("NOT_CONFIGURED", "missing client")]
  ])("maps Google startup configuration failures", async (kind, error) => {
    if (kind === "domains") env.googleLoginAllowedDomains = [];
    else google.createGoogleLoginStart.mockImplementationOnce(() => { throw error; });
    const response = await requestHandler({ handler: googleLoginStartHandler });
    expect(response.status).toBe(503);
    expect(await jsonEnvelope(response)).toMatchObject({ ok: false, error: { code: "NOT_CONFIGURED" } });
  });

  it("completes Google login with escaped callback HTML and session cookies", async () => {
    const response = await requestHandler({
      handler: googleLoginCallbackHandler,
      path: "/v1/auth/google/callback?code=ok&state=state",
      route: "/v1/auth/google/callback",
      headers: { cookie: "alwaystrack_google_login_state=state-cookie" }
    });
    const html = await response.text();
    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toContain("at_session=google-token");
    expect(html).toContain("AlwaysTrack &lt;Suite&gt;");
    expect(auth.loginUserByVerifiedGoogleEmail).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ email: "admin@example.com" }), env.sessionSecret);
  });

  it("returns a safe HTML callback for rejected Google identities", async () => {
    auth.loginUserByVerifiedGoogleEmail.mockRejectedValueOnce(new AuthError("DOMAIN_NOT_ALLOWED"));
    const response = await requestHandler({ handler: googleLoginCallbackHandler });
    expect(await response.text()).toContain("Google account domain is not allowed.");
    expect(response.status).toBe(200);
  });

  it("logs out an authenticated user and clears the session", async () => {
    const response = await requestHandler({ handler: logoutHandler, method: "post", path: "/v1/auth/logout", route: "/v1/auth/logout" });
    expect(await jsonEnvelope(response)).toEqual({ ok: true, data: { loggedOut: true } });
    expect(audit.recordAuditLog).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ organizationId: "org-1", action: "auth.logout" }));
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
  });

  it("returns the current user envelope", async () => {
    const response = await requestHandler({ handler: meHandler, path: "/v1/auth/me", route: "/v1/auth/me" });
    expect(await jsonEnvelope(response)).toMatchObject({ ok: true, data: { user: { id: "admin-1", organizationId: "org-1" } } });
  });
});
