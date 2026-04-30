import { describe, expect, it, vi } from "vitest";
import type { CurrentUser } from "@sylembra/shared";
import {
  commitProfessionalsLicensesCsv,
  ImportError,
  professionalsLicensesCsvTemplate,
  validateProfessionalsLicensesCsv
} from "./professionals-licenses-import.service.js";

const admin: CurrentUser = {
  id: "admin-1",
  name: "Admin",
  email: "admin@example.com",
  role: "ADMIN",
  organizationId: "org-1",
  unitScopeIds: [],
  sectorScopeIds: []
};

const supervisor: CurrentUser = { ...admin, id: "sup-1", role: "SUPERVISOR" };

function basePrisma() {
  return {
    unit: {
      findMany: vi.fn().mockResolvedValue([{ id: "unit-1", name: "RH-GERAL", organizationId: "org-1", active: true }]),
      findFirst: vi.fn().mockResolvedValue({ id: "unit-1", name: "RH-GERAL" })
    },
    sector: {
      findMany: vi.fn().mockResolvedValue([{ id: "sector-1", unitId: "unit-1", name: "GOVERNANCA", active: true }]),
      findFirst: vi.fn().mockResolvedValue({ id: "sector-1", unitId: "unit-1", name: "GOVERNANCA" })
    },
    user: {
      findMany: vi.fn().mockResolvedValue([{ id: "rt-1", email: "rt@example.com", role: "RT", active: true }]),
      findFirst: vi.fn().mockResolvedValue({ id: "rt-1", email: "rt@example.com", role: "RT" })
    },
    licenseType: {
      findMany: vi.fn().mockResolvedValue([
        { id: "type-1", name: "Registro profissional demo", defaultWarningDays: "30", active: true }
      ]),
      findFirst: vi.fn().mockResolvedValue({ id: "type-1", name: "Registro profissional demo", defaultWarningDays: "30" })
    },
    professional: {
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: "pro-1" }),
      update: vi.fn()
    },
    license: {
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: "lic-1" }),
      update: vi.fn()
    },
    auditLog: { create: vi.fn().mockResolvedValue({ id: "audit-1" }) },
    $transaction: vi.fn(async (callback) => callback(basePrisma()))
  };
}

describe("professionals/licenses CSV import", () => {
  it("validates a CSV and reports planned creates", async () => {
    const prisma = basePrisma();
    const result = await validateProfessionalsLicensesCsv(prisma as never, admin, professionalsLicensesCsvTemplate);

    expect(result).toMatchObject({
      totalRows: 1,
      validRows: 1,
      errorRows: 0,
      willCreateProfessionals: 1,
      willCreateLicenses: 1
    });
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: "bulk_import.validate" }) })
    );
  });

  it("rejects non-admin users", async () => {
    await expect(validateProfessionalsLicensesCsv(basePrisma() as never, supervisor, professionalsLicensesCsvTemplate)).rejects.toEqual(
      new ImportError("FORBIDDEN")
    );
  });

  it("returns line errors for missing references", async () => {
    const prisma = basePrisma();
    prisma.unit.findMany.mockResolvedValue([]);

    const result = await validateProfessionalsLicensesCsv(prisma as never, admin, professionalsLicensesCsvTemplate);

    expect(result.errorRows).toBe(1);
    expect(result.rows[0].errors).toContain("Unidade não encontrada ou inativa.");
  });

  it("commits only after a clean validation", async () => {
    const prisma = basePrisma();

    const result = await commitProfessionalsLicensesCsv(prisma as never, admin, professionalsLicensesCsvTemplate);

    expect(result.professionalsCreated).toBe(1);
    expect(result.licensesCreated).toBe(1);
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: "bulk_import.commit" }) })
    );
  });
});
