import { describe, expect, it, vi } from "vitest";
import {
  createGoogleLoginStart,
  GoogleLoginError,
  isGoogleLoginConfigured,
  resolveGoogleLoginProfile
} from "./google-login.service.js";

function baseEnv() {
  return {
    appName: "AlwaysTrack",
    appMode: "local" as const,
    databaseUrl: "file:./dev.db",
    sessionSecret: "secret",
    sessionCookieName: "alwaystrack_session",
    port: 3333,
    storageProvider: "local" as const,
    storageLocalDir: ".storage/private",
    documentMaxBytes: 1024,
    notificationProvider: "fake" as const,
    notificationJobLimit: 25,
    documentAiProvider: "fake" as const,
    documentAiModel: "fake",
    googleLoginClientId: "login-client-id",
    googleLoginClientSecret: "login-client-secret",
    googleLoginRedirectUri: "http://localhost:3333/v1/auth/google/callback",
    googleLoginAllowedDomains: []
  };
}

describe("google login service", () => {
  it("creates a Google login authorization URL with PKCE and minimal scopes", async () => {
    const result = createGoogleLoginStart(baseEnv());
    const url = new URL(result.url);

    expect(url.origin).toBe("https://accounts.google.com");
    expect(url.searchParams.get("scope")).toBe("openid email profile");
    expect(url.searchParams.get("code_challenge_method")).toBe("S256");
    expect(url.searchParams.get("prompt")).toBe("select_account");
    expect(result.stateCookie).toContain(".");
  });

  it("exchanges a valid callback for a verified Google profile", async () => {
    const env = baseEnv();
    const start = createGoogleLoginStart(env);
    const state = new URL(start.url).searchParams.get("state") ?? "";
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ access_token: "access-123" }), {
          status: 200,
          headers: { "content-type": "application/json" }
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ email: "Admin@Example.com", email_verified: true, name: "Admin" }), {
          status: 200,
          headers: { "content-type": "application/json" }
        })
      );

    const profile = await resolveGoogleLoginProfile(
      { code: "code-123", state, stateCookie: start.stateCookie },
      env,
      fetcher as never
    );

    expect(profile).toMatchObject({ email: "Admin@Example.com", emailVerified: true, name: "Admin" });
    expect(String(fetcher.mock.calls[0]?.[0])).toBe("https://oauth2.googleapis.com/token");
    expect(String(fetcher.mock.calls[0]?.[1]?.body)).toContain("code_verifier=");
    expect(String(fetcher.mock.calls[1]?.[0])).toBe("https://www.googleapis.com/oauth2/v3/userinfo");
  });

  it("rejects missing configuration and invalid state", async () => {
    expect(isGoogleLoginConfigured({ ...baseEnv(), googleLoginRedirectUri: undefined })).toBe(false);
    expect(() => createGoogleLoginStart({ ...baseEnv(), googleLoginRedirectUri: undefined })).toThrow(GoogleLoginError);

    await expect(
      resolveGoogleLoginProfile({ code: "code", state: "tampered", stateCookie: "tampered" }, baseEnv(), vi.fn() as never)
    ).rejects.toMatchObject({ code: "INVALID_STATE" });
  });
});
