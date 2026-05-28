import { describe, expect, it, vi } from "vitest";
import type { CurrentUser } from "@alwaystrack/shared";
import {
  createProfessional,
  listProfessionals,
  parseProfessionalFilters,
  parseProfessionalInput,
  ProfessionalError,
  updateProfessional
} from "./professionals.service.js";

const admin: CurrentUser = {
  id: "admin-1",
  name: "Admin",
  email: "admin@example.com",
  role: "ADMIN",
  organizationId: "org-1",
  unitScopeIds: [],
  sectorScopeIds: []
};

describe("professionals service", () => {
  it("parses professional payload without unsupported fields", () => {
    expect(
      parseProfessionalInput({
        name: " Profissional ",
        cpf: "000.000.000-00",
        email: " TESTE@EXAMPLE.COM ",
        phone: "",
        active: false,
        ignored: true
      })
    ).toEqual({
      unitId: undefined,
      sectorId: undefined,
      responsibleRtId: undefined,
      userId: undefined,
      name: "Profissional",
      cpf: "00000000000",
      email: "teste@example.com",
      phone: null,
      position: undefined,
      active: false,
      notes: undefined
    });
  });

  it("parses supported filters", () => {
    expect(parseProfessionalFilters({ active: "true", unitId: " unit-1 ", query: " Ana " })).toEqual({
      active: true,
      unitId: "unit-1",
      sectorId: undefined,
      responsibleRtId: undefined,
      query: "Ana"
    });
  });

  it("lists professionals inside scoped organization", async () => {
    const prisma = {
      professional: {
        findMany: vi.fn().mockResolvedValue([]),
        count: vi.fn().mockResolvedValue(0)
      }
    };

    await listProfessionals(prisma as never, admin, { active: true, unitId: "unit-1" });

    expect(prisma.professional.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          AND: [
            { organizationId: "org-1" },
            expect.objectContaining({ active: true, unitId: "unit-1" })
          ]
        }
      })
    );
  });

  it("creates professionals with organization links and audit", async () => {
    const prisma = {
      unit: { findFirst: vi.fn().mockResolvedValue({ id: "unit-1" }) },
      sector: { findFirst: vi.fn().mockResolvedValue({ id: "sector-1" }) },
      user: { findFirst: vi.fn().mockResolvedValue({ id: "rt-1", role: "RT" }) },
      professional: {
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({
          id: "pro-1",
          organizationId: "org-1",
          unitId: "unit-1",
          sectorId: "sector-1",
          responsibleRtId: "rt-1",
          name: "Ana",
          cpf: "00000000000"
        })
      },
      auditLog: { create: vi.fn().mockResolvedValue({ id: "audit-1" }) }
    };

    await createProfessional(prisma as never, admin, {
      name: "Ana",
      cpf: "00000000000",
      unitId: "unit-1",
      sectorId: "sector-1",
      responsibleRtId: "rt-1"
    });

    expect(prisma.professional.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          organizationId: "org-1",
          unitId: "unit-1",
          sectorId: "sector-1",
          responsibleRtId: "rt-1"
        })
      })
    );
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: "professional.create", entityType: "Professional" })
      })
    );
  });

  it("rejects creation when sector does not belong to unit and organization", async () => {
    const prisma = {
      unit: { findFirst: vi.fn().mockResolvedValue({ id: "unit-1" }) },
      sector: { findFirst: vi.fn().mockResolvedValue(null) },
      professional: { create: vi.fn() }
    };

    await expect(
      createProfessional(prisma as never, admin, { name: "Ana", unitId: "unit-1", sectorId: "sector-out" })
    ).rejects.toEqual(new ProfessionalError("INVALID_INPUT"));
    expect(prisma.professional.create).not.toHaveBeenCalled();
  });

  it("keeps deactivation as audited update", async () => {
    const prisma = {
      professional: {
        findFirst: vi.fn().mockResolvedValue({
          id: "pro-1",
          organizationId: "org-1",
          unitId: "unit-1",
          sectorId: "sector-1"
        }),
        update: vi.fn().mockResolvedValue({ id: "pro-1", active: false })
      },
      unit: { findFirst: vi.fn().mockResolvedValue({ id: "unit-1" }) },
      sector: { findFirst: vi.fn().mockResolvedValue({ id: "sector-1" }) },
      auditLog: { create: vi.fn().mockResolvedValue({ id: "audit-1" }) }
    };

    await updateProfessional(prisma as never, admin, "pro-1", { active: false });

    expect(prisma.professional.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "pro-1" }, data: { active: false } })
    );
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: "professional.deactivate", entityType: "Professional" })
      })
    );
  });
});
