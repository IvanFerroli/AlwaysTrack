import { describe, expect, it } from "vitest";
import { loadEnv } from "./env.js";

describe("api env", () => {
  it("loads app identity defaults and overrides", () => {
    expect(loadEnv({}).appName).toBe("AlwaysTrack");
    expect(loadEnv({ APP_NAME: " Compliance Desk " }).appName).toBe("Compliance Desk");
  });

  it("parses perimeter origin and rate limit settings", () => {
    const env = loadEnv({
      CORS_ORIGIN: "https://app.example.com, https://admin.example.com ",
      RATE_LIMIT_LOGIN_MAX: "4"
    });

    expect(env.corsOrigins).toEqual(["https://app.example.com", "https://admin.example.com"]);
    expect(env.rateLimitLoginMax).toBe(4);
    expect(env.rateLimitSearchMax).toBe(120);
  });
});
