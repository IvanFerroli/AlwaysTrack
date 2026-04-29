import { describe, expect, it, vi } from "vitest";
import type { CurrentUser } from "@sylembra/shared";
import {
  createLicense,
  createLicenseType,
  LicenseManagementError,
  listLicenses,
  parseLicenseFilters,
  parseLicenseInput,
  parseLicenseTypeInput,
  updateLicense
} from "./licenses.service.js";

const admin: CurrentUser = {
  id: "admin-1",
  name: "Admin",
  email: "admin@example.com",
  role: "ADMIN",
  organizationId: "org-1",
  unitScopeIds: [],
  sectorScopeIds: []
};

const supervisor: CurrentUser = {
  id: "sup-1",
  name: "Supervisor",
  email: "sup@example.com",
  role: "SUPERVISOR",
  organizationId: "org-1",
  unitScopeIds: ["unit-1"],
  sectorScopeIds: []
};

describe("licenses service", () => {
  it("parses license type payload", () => {
    expect(
      parseLicenseTypeInput({
        name: " Registro ",
        description: "",
        defaultWarningDays: "90,30",
        active: false,
        ignored: true
      })
    ).toEqual({
      name: "Registro",
      description: null,
      defaultWarningDays: "90,30",
      active: false
    });
  });

  it("parses license payload with shared status contract", () => {
    expect(
      parseLicenseInput({
        professionalId: " pro-1 ",
        licenseTypeId: "type-1",
        number: " ABC ",
        uf: "sp",
        issuedAt: "2026-01-10",
        expiresAt: "invalid",
        status: "REGULAR"
      })
    ).toEqual({
      professionalId: "pro-1",
      licenseTypeId: "type-1",
      number: "ABC",
      issuer: undefined,
      uf: "SP",
      issuedAt: new Date("2026-01-10T00:00:00.000Z"),
      expiresAt: undefined,
      status: "REGULAR",
      notes: undefined
    });
  });

  it("parses supported license filters", () => {
    expect(parseLicenseFilters({ status: "EXPIRED", professionalId: " pro-1 ", query: " Ana " })).toEqual({
      professionalId: "pro-1",
      licenseTypeId: undefined,
      status: "EXPIRED",
      query: "Ana"
    });
  });

  it("creates license types with audit", async () => {
    const prisma = {
      licenseType: {
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({ id: "type-1", name: "Registro", active: true })
      },
      auditLog: { create: vi.fn().mockResolvedValue({ id: "audit-1" }) }
    };

    await createLicenseType(prisma as never, admin, { name: "Registro" });

    expect(prisma.licenseType.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ organizationId: "org-1", name: "Registro" }) })
    );
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: "license_type.create", entityType: "LicenseType" })
      })
    );
  });

  it("lists licenses inside supervisor scope", async () => {
    const prisma = {
      license: {
        findMany: vi.fn().mockResolvedValue([]),
        count: vi.fn().mockResolvedValue(0)
      }
    };

    await listLicenses(prisma as never, supervisor, { status: "REGULAR" });

    expect(prisma.license.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: "REGULAR",
          professional: expect.objectContaining({
            organizationId: "org-1",
            OR: [{ unitId: { in: ["unit-1"] } }, { id: "__no_sector_scope__" }]
          })
        })
      })
    );
  });

  it("creates licenses with references and audit", async () => {
    const prisma = {
      professional: { findFirst: vi.fn().mockResolvedValue({ id: "pro-1", organizationId: "org-1" }) },
      licenseType: { findFirst: vi.fn().mockResolvedValue({ id: "type-1", organizationId: "org-1" }) },
      license: {
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({
          id: "lic-1",
          professionalId: "pro-1",
          licenseTypeId: "type-1",
          number: "ABC",
          status: "REGULAR"
        })
      },
      auditLog: { create: vi.fn().mockResolvedValue({ id: "audit-1" }) }
    };

    await createLicense(prisma as never, admin, {
      professionalId: "pro-1",
      licenseTypeId: "type-1",
      number: "ABC",
      status: "REGULAR"
    });

    expect(prisma.license.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          professionalId: "pro-1",
          licenseTypeId: "type-1",
          number: "ABC",
          status: "REGULAR",
          validatedById: "admin-1"
        })
      })
    );
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: "license.create", entityType: "License" }) })
    );
  });

  it("rejects license creation for non-admin users", async () => {
    await expect(
      createLicense({} as never, supervisor, { professionalId: "pro-1", licenseTypeId: "type-1", status: "REGULAR" })
    ).rejects.toEqual(new LicenseManagementError("FORBIDDEN"));
  });

  it("audits inactive status as deactivation", async () => {
    const prisma = {
      license: {
        findFirst: vi.fn().mockResolvedValue({
          id: "lic-1",
          professionalId: "pro-1",
          licenseTypeId: "type-1",
          number: "ABC"
        }),
        update: vi.fn().mockResolvedValue({ id: "lic-1", status: "INACTIVE" })
      },
      auditLog: { create: vi.fn().mockResolvedValue({ id: "audit-1" }) }
    };

    await updateLicense(prisma as never, admin, "lic-1", { status: "INACTIVE" });

    expect(prisma.license.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "lic-1" },
        data: expect.objectContaining({ status: "INACTIVE", validatedById: "admin-1" })
      })
    );
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: "license.deactivate", entityType: "License" }) })
    );
  });
});
