import { describe, expect, it } from "vitest";
import { loadEnv } from "./env.js";

describe("api env", () => {
  it("loads app identity defaults and overrides", () => {
    expect(loadEnv({}).appName).toBe("AlwaysTrack");
    expect(loadEnv({ APP_NAME: " Compliance Desk " }).appName).toBe("Compliance Desk");
  });
});
