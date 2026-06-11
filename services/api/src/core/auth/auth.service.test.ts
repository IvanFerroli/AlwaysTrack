import { describe, expect, it, vi } from "vitest";
import { hashPassword } from "./password.js";
import { AuthError, loginUser, loginUserByVerifiedGoogleEmail } from "./auth.service.js";

describe("auth service", () => {
  it("logs in active users and records audit", async () => {
    const passwordHash = await hashPassword("secret");
    const prisma = {
      user: {
        findUnique: vi.fn().mockResolvedValue({
          id: "user-1",
          name: "Admin",
          email: "admin@example.com",
          passwordHash,
          role: "ADMIN",
          active: true,
          organizationId: "org-1",
          unitScopeJson: null,
          sectorScopeJson: null
        })
      },
      auditLog: {
        create: vi.fn().mockResolvedValue({ id: "audit-1" })
      }
    };

    const result = await loginUser(
      prisma as never,
      {
        email: "ADMIN@example.com",
        password: "secret"
      },
      "secret"
    );

    expect(result.user.email).toBe("admin@example.com");
    expect(result.user.unitScopeIds).toEqual([]);
    expect(result.user.sectorScopeIds).toEqual([]);
    expect(result.token).toContain(".");
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "auth.login",
          actorId: "user-1"
        })
      })
    );
  });

  it("rejects inactive users", async () => {
    const passwordHash = await hashPassword("secret");
    const prisma = {
      user: {
        findUnique: vi.fn().mockResolvedValue({
          id: "user-1",
          email: "admin@example.com",
          passwordHash,
          role: "ADMIN",
          active: false,
          organizationId: "org-1",
          unitScopeJson: null,
          sectorScopeJson: null
        })
      }
    };

    await expect(loginUser(prisma as never, { email: "admin@example.com", password: "secret" }, "secret")).rejects.toBeInstanceOf(
      AuthError
    );
  });

  it("logs in a user by verified Google email without creating accounts", async () => {
    const prisma = {
      user: {
        findUnique: vi.fn().mockResolvedValue({
          id: "user-1",
          name: "Admin",
          email: "admin@example.com",
          passwordHash: "unused",
          role: "ADMIN",
          active: true,
          organizationId: "org-1",
          unitScopeJson: null,
          sectorScopeJson: null
        })
      },
      auditLog: {
        create: vi.fn().mockResolvedValue({ id: "audit-1" })
      }
    };

    const result = await loginUserByVerifiedGoogleEmail(
      prisma as never,
      { email: "ADMIN@example.com", emailVerified: true, allowedDomains: ["EXAMPLE.com"] },
      "secret"
    );

    expect(result.user.email).toBe("admin@example.com");
    expect(result.token).toContain(".");
    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: "admin@example.com" } });
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "auth.google_login",
          actorId: "user-1"
        })
      })
    );
  });

  it("rejects unverified, unauthorized-domain, unconfigured-domain or unknown Google users", async () => {
    const prisma = {
      user: { findUnique: vi.fn().mockResolvedValue(null) }
    };

    await expect(
      loginUserByVerifiedGoogleEmail(prisma as never, { email: "admin@example.com", emailVerified: false }, "secret")
    ).rejects.toMatchObject({ code: "EMAIL_NOT_VERIFIED" });

    await expect(
      loginUserByVerifiedGoogleEmail(prisma as never, { email: "admin@other.com", emailVerified: true, allowedDomains: ["example.com"] }, "secret")
    ).rejects.toMatchObject({ code: "DOMAIN_NOT_ALLOWED" });

    await expect(
      loginUserByVerifiedGoogleEmail(prisma as never, { email: "admin@example.com", emailVerified: true, allowedDomains: [] }, "secret")
    ).rejects.toMatchObject({ code: "DOMAIN_NOT_ALLOWED" });

    await expect(
      loginUserByVerifiedGoogleEmail(prisma as never, { email: "admin@example.com", emailVerified: true, allowedDomains: ["example.com"] }, "secret")
    ).rejects.toMatchObject({ code: "INVALID_CREDENTIALS" });
  });
});
