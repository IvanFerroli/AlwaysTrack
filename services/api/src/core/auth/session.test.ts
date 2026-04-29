import { describe, expect, it } from "vitest";
import { createSessionToken, parseSessionToken } from "./session.js";

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
});
