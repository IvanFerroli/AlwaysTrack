import { describe, expect, it } from "vitest";
import { hashPassword, validatePasswordPolicy, verifyPassword } from "./password.js";

describe("password hashing", () => {
  it("verifies the original password and rejects a different one", async () => {
    const hash = await hashPassword("secret");

    expect(hash).not.toContain("secret");
    await expect(verifyPassword("secret", hash)).resolves.toBe(true);
    await expect(verifyPassword("wrong", hash)).resolves.toBe(false);
  });

  it("rejects weak, obvious, and email-derived passwords", () => {
    expect(validatePasswordPolicy("short1!A").valid).toBe(false);
    expect(validatePasswordPolicy("Password123!").valid).toBe(false);
    expect(validatePasswordPolicy("AdminExample123!", { email: "admin@example.com" }).valid).toBe(false);
    expect(validatePasswordPolicy("Rastro#Seguro2026", { email: "admin@example.com" }).valid).toBe(true);
  });
});
