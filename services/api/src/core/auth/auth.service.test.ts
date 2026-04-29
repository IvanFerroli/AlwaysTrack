import { describe, expect, it, vi } from "vitest";
import { hashPassword } from "./password.js";
import { AuthError, loginUser } from "./auth.service.js";

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
          organizationId: "org-1"
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
          organizationId: "org-1"
        })
      }
    };

    await expect(loginUser(prisma as never, { email: "admin@example.com", password: "secret" }, "secret")).rejects.toBeInstanceOf(
      AuthError
    );
  });
});
