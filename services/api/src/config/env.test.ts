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

  it("parses s3-compatible storage settings without changing local defaults", () => {
    expect(loadEnv({}).storageProvider).toBe("local");

    const env = loadEnv({
      STORAGE_PROVIDER: "s3",
      STORAGE_S3_ENDPOINT: "https://s3.example.com",
      STORAGE_S3_BUCKET: "alwaystrack-private",
      STORAGE_S3_REGION: "sa-east-1",
      STORAGE_S3_ACCESS_KEY_ID: "access",
      STORAGE_S3_SECRET_ACCESS_KEY: "secret",
      STORAGE_S3_FORCE_PATH_STYLE: "false"
    });

    expect(env.storageProvider).toBe("s3");
    expect(env.storageS3Endpoint).toBe("https://s3.example.com");
    expect(env.storageS3Bucket).toBe("alwaystrack-private");
    expect(env.storageS3Region).toBe("sa-east-1");
    expect(env.storageS3ForcePathStyle).toBe(false);
  });
});
