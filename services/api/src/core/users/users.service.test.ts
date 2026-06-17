import { describe, expect, it, vi } from "vitest";
import {
  createManagedUser,
  getUserProfile,
  parseCreateUserInput,
  parseProfileInput,
  resetManagedUserPassword,
  updateUserProfile,
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
        password: "Rastro#Seguro2026",
        role: "VENDEDOR",
        phone: "",
        unitScopeIds: ["unit-1", "unit-1", ""],
        ignored: true
      })
    ).toEqual({
      name: "Admin",
      email: "admin@example.com",
      password: "Rastro#Seguro2026",
      role: "VENDEDOR",
      phone: null,
      active: undefined,
      unitScopeIds: ["unit-1"],
      sectorScopeIds: undefined,
      sellerCode: undefined,
      sellerDisplayName: undefined,
      salesGroupId: undefined
    });
  });

  it("parses profile payload without privileged fields", () => {
    expect(
      parseProfileInput({
        name: " Vendedor Demo ",
        phone: "",
        avatarUrl: " /favicon/favicon-512.png ",
        email: "root@example.com",
        role: "ADMIN",
        organizationId: "other"
      })
    ).toEqual({
      name: "Vendedor Demo",
      phone: null,
      avatarUrl: "/favicon/favicon-512.png"
    });
    expect(parseProfileInput({ avatarUrl: "javascript:alert(1)" })).toEqual({
      name: undefined,
      phone: undefined,
      avatarUrl: undefined
    });
  });

  it("creates users inside the actor organization and never returns passwordHash", async () => {
    const prisma = {
      user: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({
          id: "user-1",
          name: "SAC",
          email: "sac@example.com",
          passwordHash: "secret",
          role: "SAC",
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
      salesGroup: { findFirst: vi.fn() },
      auditLog: { create: vi.fn().mockResolvedValue({ id: "audit-1" }) }
    };

    const user = await createManagedUser(prisma as never, actor, {
      name: "SAC",
      email: "sac@example.com",
      password: "Rastro#Seguro2026",
      role: "SAC",
      unitScopeIds: ["unit-1"]
    });

    expect(prisma.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        organizationId: "org-1",
        email: "sac@example.com",
        role: "SAC",
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
        password: "Rastro#Seguro2026",
        role: "RT",
        unitScopeIds: ["unit-out"]
      })
    ).rejects.toEqual(new UserManagementError("INVALID_INPUT"));
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it("rejects weak user creation passwords before writing", async () => {
    const prisma = {
      user: { findUnique: vi.fn(), create: vi.fn() }
    };

    await expect(
      createManagedUser(prisma as never, actor, {
        name: "SAC",
        email: "sac@example.com",
        password: "password123",
        role: "SAC"
      })
    ).rejects.toEqual(new UserManagementError("INVALID_INPUT"));
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it("creates a seller profile when creating a seller user", async () => {
    const prisma = {
      user: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({
          id: "seller-user-1",
          name: "Ana",
          email: "ana@example.com",
          passwordHash: "secret",
          role: "VENDEDOR",
          phone: "+5583999999999",
          active: true,
          organizationId: "org-1",
          unitScopeJson: null,
          sectorScopeJson: null,
          createdAt: new Date(),
          updatedAt: new Date()
        })
      },
      salesGroup: { findFirst: vi.fn().mockResolvedValue({ id: "group-1", organizationId: "org-1" }) },
      sellerProfile: {
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({ id: "seller-1" })
      },
      auditLog: { create: vi.fn().mockResolvedValue({ id: "audit-1" }) }
    };

    await createManagedUser(prisma as never, actor, {
      name: "Ana",
      email: "ana@example.com",
      password: "Rastro#Seguro2026",
      role: "VENDEDOR",
      phone: "+5583999999999",
      sellerCode: "VD-004",
      sellerDisplayName: "Ana Vendas",
      salesGroupId: "group-1"
    });

    expect(prisma.sellerProfile.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        organizationId: "org-1",
        userId: "seller-user-1",
        code: "VD-004",
        displayName: "Ana Vendas",
        salesGroupId: "group-1",
        active: true
      })
    });
  });

  it("assigns a sales group when updating a supervisor", async () => {
    const prisma = {
      user: {
        findFirst: vi.fn().mockResolvedValue({ id: "sup-1", role: "SAC", organizationId: "org-1" }),
        update: vi.fn().mockResolvedValue({
          id: "sup-1",
          name: "Supervisor",
          email: "sup@example.com",
          passwordHash: "secret",
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
      salesGroup: {
        findFirst: vi.fn().mockResolvedValue({ id: "group-1", organizationId: "org-1" }),
        update: vi.fn().mockResolvedValue({ id: "group-1" })
      },
      auditLog: { create: vi.fn().mockResolvedValue({ id: "audit-1" }) }
    };

    await updateManagedUser(prisma as never, actor, "sup-1", { role: "SUPERVISOR", salesGroupId: "group-1" });

    expect(prisma.salesGroup.update).toHaveBeenCalledWith({
      where: { id: "group-1" },
      data: { supervisorId: "sup-1" }
    });
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
        findFirst: vi.fn().mockResolvedValue({ id: "user-1", email: "sup@example.com" }),
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

    const user = await resetManagedUserPassword(prisma as never, actor, "user-1", "Rastro#Seguro2026");

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { passwordHash: expect.stringMatching(/^scrypt:/), passwordChangedAt: expect.any(Date) }
    });
    expect(user).not.toHaveProperty("passwordHash");
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "user.password_reset",
          actorId: "admin-1",
          entityId: "user-1",
          metadataJson: expect.stringContaining("sup@example.com")
        })
      })
    );
  });

  it("rejects password resets with short passwords before writing", async () => {
    const prisma = {
      user: {
        findFirst: vi.fn(),
        update: vi.fn()
      }
    };

    await expect(resetManagedUserPassword(prisma as never, actor, "user-1", undefined)).rejects.toEqual(
      new UserManagementError("INVALID_INPUT")
    );
    expect(prisma.user.findFirst).not.toHaveBeenCalled();
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it("rejects weak password resets after loading the target email", async () => {
    const prisma = {
      user: {
        findFirst: vi.fn().mockResolvedValue({ id: "user-1", email: "user@example.com" }),
        update: vi.fn()
      }
    };

    await expect(resetManagedUserPassword(prisma as never, actor, "user-1", "user@example.com")).rejects.toEqual(
      new UserManagementError("INVALID_INPUT")
    );
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it("loads the current user profile with commercial readonly links", async () => {
    const prisma = {
      user: {
        findFirst: vi.fn().mockResolvedValue({
          id: "seller-user-1",
          name: "Ana",
          email: "ana@example.com",
          avatarUrl: "/avatar.png",
          passwordHash: "secret",
          role: "VENDEDOR",
          phone: "+5583999999999",
          active: true,
          organizationId: "org-1",
          unitScopeJson: null,
          sectorScopeJson: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          organization: { id: "org-1", name: "AlwaysTrack" },
          sellerProfile: { id: "seller-1", code: "VD-001", displayName: "Ana Vendas", salesGroup: { id: "group-1", name: "Vendas" } },
          supervisedSalesGroups: [],
          googleConnection: null
        })
      }
    };

    const result = await getUserProfile(prisma as never, { id: "seller-user-1", organizationId: "org-1" });

    expect(result.profile).not.toHaveProperty("passwordHash");
    expect(result.profile.avatarUrl).toBe("/avatar.png");
    expect(result.profile.sellerProfile?.salesGroup?.name).toBe("Vendas");
  });

  it("updates only self-service profile fields and audits the change", async () => {
    const prisma = {
      user: {
        findFirst: vi.fn().mockResolvedValue({
          id: "seller-user-1",
          organizationId: "org-1",
          role: "VENDEDOR"
        }),
        update: vi.fn().mockResolvedValue({
          id: "seller-user-1",
          name: "Ana Nova",
          email: "ana@example.com",
          avatarUrl: "https://cdn.example.com/ana.png",
          passwordHash: "secret",
          role: "VENDEDOR",
          phone: "+558300000000",
          active: true,
          organizationId: "org-1",
          unitScopeJson: null,
          sectorScopeJson: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          organization: { id: "org-1", name: "AlwaysTrack" },
          sellerProfile: { id: "seller-1", code: "VD-001", displayName: "Ana", phone: "+5583999999999", salesGroup: null },
          supervisedSalesGroups: [],
          googleConnection: null
        })
      },
      sellerProfile: { update: vi.fn().mockResolvedValue({ id: "seller-1" }) },
      auditLog: { create: vi.fn().mockResolvedValue({ id: "audit-1" }) }
    };

    await updateUserProfile(prisma as never, { id: "seller-user-1", organizationId: "org-1" }, {
      name: "Ana Nova",
      phone: "+558300000000",
      avatarUrl: "https://cdn.example.com/ana.png",
      email: "admin@example.com",
      role: "ADMIN",
      salesGroupId: "group-out"
    });

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "seller-user-1" },
        data: {
          name: "Ana Nova",
          phone: "+558300000000",
          avatarUrl: "https://cdn.example.com/ana.png"
        }
      })
    );
    expect(prisma.sellerProfile.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "seller-1" }, data: expect.objectContaining({ displayName: "Ana Nova" }) })
    );
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: "user.profile_update", entityId: "seller-user-1" }) })
    );
  });
});
