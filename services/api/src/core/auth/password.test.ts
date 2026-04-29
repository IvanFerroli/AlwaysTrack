import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password.js";

describe("password hashing", () => {
  it("verifies the original password and rejects a different one", async () => {
    const hash = await hashPassword("secret");

    expect(hash).not.toContain("secret");
    await expect(verifyPassword("secret", hash)).resolves.toBe(true);
    await expect(verifyPassword("wrong", hash)).resolves.toBe(false);
  });
});
