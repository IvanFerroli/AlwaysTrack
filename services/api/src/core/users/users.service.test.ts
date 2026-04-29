import { describe, expect, it, vi } from "vitest";
import {
  createManagedUser,
  parseCreateUserInput,
  resetManagedUserPassword,
  updateManagedUser,
  UserManagementError
} from "./users.service.js";

const actor = { id: "admin-1", organizationId: "org-1" };

describe("users service", () => {
  it("parses user creation without unsupported fields", () => {
    expect(
      parseCreateUserInput({
        name: " Admin ",
        email: " ADMIN@EXAMPLE.COM ",
        password: "12345678",
        role: "RT",
        phone: "",
        unitScopeIds: ["unit-1", "unit-1", ""],
        ignored: true
      })
    ).toEqual({
      name: "Admin",
      email: "admin@example.com",
      password: "12345678",
      role: "RT",
      phone: null,
      active: undefined,
      unitScopeIds: ["unit-1"],
      sectorScopeIds: undefined
    });
  });

  it("creates users inside the actor organization and never returns passwordHash", async () => {
    const prisma = {
      user: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({
          id: "user-1",
          name: "RT",
          email: "rt@example.com",
          passwordHash: "secret",
          role: "RT",
          phone: null,
          active: true,
          organizationId: "org-1",
          unitScopeJson: JSON.stringify(["unit-1"]),
          sectorScopeJson: null,
          createdAt: new Date(),
          updatedAt: new Date()
        })
      },
      unit: { count: vi.fn().mockResolvedValue(1) },
      sector: { count: vi.fn().mockResolvedValue(0) },
      auditLog: { create: vi.fn().mockResolvedValue({ id: "audit-1" }) }
    };

    const user = await createManagedUser(prisma as never, actor, {
      name: "RT",
      email: "rt@example.com",
      password: "12345678",
      role: "RT",
      unitScopeIds: ["unit-1"]
    });

    expect(prisma.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        organizationId: "org-1",
        email: "rt@example.com",
        role: "RT",
        unitScopeJson: JSON.stringify(["unit-1"])
      })
    });
    expect(user).not.toHaveProperty("passwordHash");
    expect(user.unitScopeIds).toEqual(["unit-1"]);
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: "user.create", entityType: "User", actorId: "admin-1" })
      })
    );
  });

  it("rejects scopes outside the actor organization", async () => {
    const prisma = {
      user: { findUnique: vi.fn().mockResolvedValue(null), create: vi.fn() },
      unit: { count: vi.fn().mockResolvedValue(0) }
    };

    await expect(
      createManagedUser(prisma as never, actor, {
        name: "RT",
        email: "rt@example.com",
        password: "12345678",
        role: "RT",
        unitScopeIds: ["unit-out"]
      })
    ).rejects.toEqual(new UserManagementError("INVALID_INPUT"));
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it("does not allow an admin to deactivate itself", async () => {
    const prisma = {
      user: {
        findFirst: vi.fn().mockResolvedValue({ id: "admin-1", role: "ADMIN" }),
        update: vi.fn()
      }
    };

    await expect(updateManagedUser(prisma as never, actor, "admin-1", { active: false })).rejects.toEqual(
      new UserManagementError("SELF_DEACTIVATE")
    );
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it("resets password without requiring or returning the old password", async () => {
    const prisma = {
      user: {
        findFirst: vi.fn().mockResolvedValue({ id: "user-1" }),
        update: vi.fn().mockResolvedValue({
          id: "user-1",
          name: "Supervisor",
          email: "sup@example.com",
          passwordHash: "new-secret",
          role: "SUPERVISOR",
          phone: null,
          active: true,
          organizationId: "org-1",
          unitScopeJson: null,
          sectorScopeJson: null,
          createdAt: new Date(),
          updatedAt: new Date()
        })
      },
      auditLog: { create: vi.fn().mockResolvedValue({ id: "audit-1" }) }
    };

    const user = await resetManagedUserPassword(prisma as never, actor, "user-1", "12345678");

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { passwordHash: expect.stringMatching(/^scrypt:/) }
    });
    expect(user).not.toHaveProperty("passwordHash");
  });
});
