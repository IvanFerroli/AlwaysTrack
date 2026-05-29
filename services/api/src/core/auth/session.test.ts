import { describe, expect, it } from "vitest";
import { createSessionToken, getSessionCookieName, parseSessionToken, sessionCookieName } from "./session.js";

describe("signed sessions", () => {
  it("parses a valid token", () => {
    const token = createSessionToken(
      {
        userId: "user-1",
        organizationId: "org-1",
        role: "ADMIN",
        issuedAt: 123
      },
      "secret"
    );

    expect(parseSessionToken(token, "secret")).toEqual({
      userId: "user-1",
      organizationId: "org-1",
      role: "ADMIN",
      issuedAt: 123
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

  it("resolves the configured cookie name", () => {
    expect(
      getSessionCookieName({
        databaseUrl: "file:./dev.db",
        sessionSecret: "secret",
        sessionCookieName: "custom_session",
        port: 3333,
        storageProvider: "local",
        storageLocalDir: ".storage/private",
        documentMaxBytes: 1024,
        notificationProvider: "fake",
        notificationJobLimit: 25,
        documentAiProvider: "fake",
        documentAiModel: "fake"
      })
    ).toBe("custom_session");
    expect(sessionCookieName).toBe("alwaystrack_session");
  });
});
