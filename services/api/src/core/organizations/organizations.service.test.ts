import { describe, expect, it, vi } from "vitest";
import {
  createSector,
  createUnit,
  OrganizationError,
  parseOrganizationUpdate,
  updateSector,
  updateUnit
} from "./organizations.service.js";

const actor = { id: "admin-1", organizationId: "org-1" };

describe("organizations service", () => {
  it("parses only supported organization fields", () => {
    expect(parseOrganizationUpdate({ name: " Demo ", document: "", active: false, ignored: true })).toEqual({
      name: "Demo",
      document: null,
      active: false
    });
  });

  it("creates units under the actor organization and audits the change", async () => {
    const create = vi.fn().mockResolvedValue({ id: "unit-1", name: "Unidade", active: true });
    const auditCreate = vi.fn().mockResolvedValue({ id: "audit-1" });
    const prisma = {
      unit: { create },
      auditLog: { create: auditCreate }
    };

    await createUnit(prisma as never, actor, { name: "Unidade" });

    expect(create).toHaveBeenCalledWith({
      data: {
        organizationId: "org-1",
        name: "Unidade",
        active: true
      }
    });
    expect(auditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "unit.create",
          entityType: "Unit",
          actorId: "admin-1"
        })
      })
    );
  });

  it("does not update units outside the actor organization", async () => {
    const prisma = {
      unit: {
        findFirst: vi.fn().mockResolvedValue(null),
        update: vi.fn()
      }
    };

    await expect(updateUnit(prisma as never, actor, "unit-2", { name: "Nova" })).rejects.toEqual(
      new OrganizationError("NOT_FOUND")
    );
    expect(prisma.unit.update).not.toHaveBeenCalled();
  });

  it("creates sectors only below units owned by the actor organization", async () => {
    const sectorCreate = vi.fn().mockResolvedValue({ id: "sector-1", unitId: "unit-1", name: "Setor", active: true });
    const auditCreate = vi.fn().mockResolvedValue({ id: "audit-1" });
    const prisma = {
      unit: { findFirst: vi.fn().mockResolvedValue({ id: "unit-1" }) },
      sector: { create: sectorCreate },
      auditLog: { create: auditCreate }
    };

    await createSector(prisma as never, actor, { unitId: "unit-1", name: "Setor" });

    expect(sectorCreate).toHaveBeenCalledWith({
      data: {
        unitId: "unit-1",
        name: "Setor",
        active: true
      }
    });
    expect(auditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: "sector.create", entityType: "Sector" })
      })
    );
  });

  it("allows moving sectors only to units inside the actor organization", async () => {
    const prisma = {
      sector: {
        findFirst: vi.fn().mockResolvedValue({ id: "sector-1" }),
        update: vi.fn()
      },
      unit: { findFirst: vi.fn().mockResolvedValue(null) }
    };

    await expect(updateSector(prisma as never, actor, "sector-1", { unitId: "unit-2" })).rejects.toEqual(
      new OrganizationError("NOT_FOUND")
    );
    expect(prisma.sector.update).not.toHaveBeenCalled();
  });
});
