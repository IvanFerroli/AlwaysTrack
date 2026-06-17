import { describe, expect, it } from "vitest";
import {
  createSessionToken,
  defaultSessionMaxAgeSeconds,
  getSessionCookieName,
  getSessionMaxAgeSeconds,
  maximumSessionMaxAgeSeconds,
  parseSessionToken,
  sessionCookieName
} from "./session.js";

describe("signed sessions", () => {
  it("parses a valid token", () => {
    const issuedAt = Date.now();
    const token = createSessionToken(
      {
        userId: "user-1",
        organizationId: "org-1",
        role: "ADMIN",
        issuedAt
      },
      "secret"
    );

    expect(parseSessionToken(token, "secret")).toEqual({
      userId: "user-1",
      organizationId: "org-1",
      role: "ADMIN",
      issuedAt
    });
  });

  it("rejects tampered tokens", () => {
    const token = createSessionToken(
      {
        userId: "user-1",
        organizationId: "org-1",
        role: "ADMIN",
        issuedAt: 123
      },
      "secret"
    );

    expect(parseSessionToken(`${token}x`, "secret")).toBeNull();
  });

  it("rejects expired and future-issued tokens server-side", () => {
    const now = 2_000_000;
    const expiredToken = createSessionToken(
      {
        userId: "user-1",
        organizationId: "org-1",
        role: "ADMIN",
        issuedAt: now - 100_001
      },
      "secret"
    );
    const futureToken = createSessionToken(
      {
        userId: "user-1",
        organizationId: "org-1",
        role: "ADMIN",
        issuedAt: now + 1
      },
      "secret"
    );

    expect(parseSessionToken(expiredToken, "secret", { now, maxAgeSeconds: 100 })).toBeNull();
    expect(parseSessionToken(futureToken, "secret", { now, maxAgeSeconds: 100 })).toBeNull();
  });

  it("caps configured session max age", () => {
    expect(getSessionMaxAgeSeconds({ SESSION_MAX_AGE_SECONDS: undefined })).toBe(defaultSessionMaxAgeSeconds);
    expect(getSessionMaxAgeSeconds({ SESSION_MAX_AGE_SECONDS: "60" })).toBe(60);
    expect(getSessionMaxAgeSeconds({ SESSION_MAX_AGE_SECONDS: String(maximumSessionMaxAgeSeconds + 1) })).toBe(
      maximumSessionMaxAgeSeconds
    );
  });

  it("resolves the configured cookie name", () => {
    expect(
      getSessionCookieName({
        appName: "AlwaysTrack",
        databaseUrl: "file:./dev.db",
        sessionSecret: "secret",
        sessionCookieName: "custom_session",
        port: 3333,
        corsOrigins: [],
        storageProvider: "local",
        storageLocalDir: ".storage/private",
        documentMaxBytes: 1024,
        notificationProvider: "fake",
        notificationJobLimit: 25,
        documentAiProvider: "fake",
        documentAiModel: "fake",
        rateLimitWindowMs: 60_000,
        rateLimitLoginMax: 10,
        rateLimitUploadMax: 20,
        rateLimitAiMax: 10,
        rateLimitSearchMax: 120,
        rateLimitInteractionMax: 60,
        rateLimitAdminMax: 90
      })
    ).toBe("custom_session");
    expect(sessionCookieName).toBe("alwaystrack_session");
  });
});
