import { describe, expect, it, vi } from "vitest";
import { hashPassword } from "./password.js";
import { assertBetaEmailAllowed, AuthError, loginUser, loginUserByVerifiedGoogleEmail } from "./auth.service.js";

describe("auth service", () => {
  it("enforces beta-local allowlist without affecting normal login modes", () => {
    expect(() => assertBetaEmailAllowed({ email: "admin@example.com", appMode: "local", allowedEmails: [] })).not.toThrow();
    expect(() =>
      assertBetaEmailAllowed({ email: "Admin@Example.com", appMode: "beta-local", allowedEmails: [" admin@example.com "] })
    ).not.toThrow();
    expect(() => assertBetaEmailAllowed({ email: "outsider@example.com", appMode: "beta-local", allowedEmails: ["admin@example.com"] })).toThrow(
      AuthError
    );
    expect(() => assertBetaEmailAllowed({ email: "admin@example.com", appMode: "beta-local", allowedEmails: [] })).toThrow(AuthError);
  });

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

  it("blocks password login outside beta-local allowlist before user lookup", async () => {
    const prisma = {
      user: {
        findUnique: vi.fn()
      }
    };

    await expect(
      loginUser(prisma as never, { email: "outsider@example.com", password: "secret" }, "secret", {
        appMode: "beta-local",
        allowedEmails: ["admin@example.com"]
      })
    ).rejects.toMatchObject({ code: "EMAIL_NOT_ALLOWED" });
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
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
      },
      auditLog: {
        create: vi.fn().mockResolvedValue({ id: "audit-1" })
      }
    };

    await expect(loginUser(prisma as never, { email: "admin@example.com", password: "secret" }, "secret")).rejects.toBeInstanceOf(
      AuthError
    );
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "auth.login_failed",
          actorId: "user-1",
          metadataJson: expect.stringContaining("inactive_user")
        })
      })
    );
  });

  it("audits failed password attempts for known users", async () => {
    const passwordHash = await hashPassword("secret");
    const prisma = {
      user: {
        findUnique: vi.fn().mockResolvedValue({
          id: "user-1",
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

    await expect(loginUser(prisma as never, { email: "admin@example.com", password: "wrong" }, "secret")).rejects.toMatchObject({
      code: "INVALID_CREDENTIALS"
    });
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "auth.login_failed",
          actorId: "user-1",
          metadataJson: expect.stringContaining("invalid_credentials")
        })
      })
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
      { email: "ADMIN@example.com", emailVerified: true, allowedDomains: ["EXAMPLE.com"], appMode: "beta-local", allowedEmails: ["admin@example.com"] },
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

    await expect(
      loginUserByVerifiedGoogleEmail(
        prisma as never,
        { email: "outsider@example.com", emailVerified: true, allowedDomains: ["example.com"], appMode: "beta-local", allowedEmails: ["admin@example.com"] },
        "secret"
      )
    ).rejects.toMatchObject({ code: "EMAIL_NOT_ALLOWED" });
  });

  it("audits inactive Google login attempts for known users", async () => {
    const prisma = {
      user: {
        findUnique: vi.fn().mockResolvedValue({
          id: "user-1",
          email: "admin@example.com",
          passwordHash: "unused",
          role: "ADMIN",
          active: false,
          organizationId: "org-1",
          unitScopeJson: null,
          sectorScopeJson: null
        })
      },
      auditLog: {
        create: vi.fn().mockResolvedValue({ id: "audit-1" })
      }
    };

    await expect(
      loginUserByVerifiedGoogleEmail(
        prisma as never,
        { email: "admin@example.com", emailVerified: true, allowedDomains: ["example.com"] },
        "secret"
      )
    ).rejects.toMatchObject({ code: "INACTIVE_USER" });
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "auth.google_login_failed",
          actorId: "user-1",
          metadataJson: expect.stringContaining("inactive_user")
        })
      })
    );
  });
});
