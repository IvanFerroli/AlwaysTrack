import { describe, expect, it, vi } from "vitest";
import { InputValidationError } from "../validation/input-validation.js";
import {
  createSector,
  createUnit,
  getOrganizationSettings,
  OrganizationError,
  parseOrganizationSettingsUpdate,
  parseOrganizationUpdate,
  updateOrganizationSettings,
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

  it("rejects malformed organization input before service execution", () => {
    expect(() => parseOrganizationUpdate("bad")).toThrow(InputValidationError);
    expect(() => parseOrganizationUpdate({ name: "x".repeat(121) })).toThrow(InputValidationError);
    expect(() => parseOrganizationSettingsUpdate({ logoUrl: "x".repeat(501) })).toThrow(InputValidationError);
  });

  it("parses editable organization settings without allowing invalid urls or env fields", () => {
    expect(
      parseOrganizationSettingsUpdate({
        name: " AlwaysTrack Comercial ",
        document: "",
        logoUrl: "https://cdn.example.com/logo.png",
        defaultTags: ["#Vendas", "ia", "x", "ia"],
        dashboardDefaultRange: "90",
        dashboardDefaultBucket: "week",
        googleLoginAllowedDomains: ["evil.example"]
      })
    ).toEqual({
      name: "AlwaysTrack Comercial",
      document: null,
      logoUrl: "https://cdn.example.com/logo.png",
      defaultTags: ["ia", "vendas"],
      dashboardDefaultRange: "90",
      dashboardDefaultBucket: "week"
    });

    expect(parseOrganizationSettingsUpdate({ logoUrl: "javascript:alert(1)" })).toEqual({
      name: undefined,
      document: undefined,
      logoUrl: undefined,
      defaultTags: undefined,
      dashboardDefaultRange: undefined,
      dashboardDefaultBucket: undefined
    });
  });

  it("returns organization settings with google domains as readonly env data", async () => {
    const findFirst = vi.fn().mockResolvedValue({
      id: "org-1",
      name: "AlwaysTrack",
      document: null,
      logoUrl: "/logo.png",
      settingsJson: JSON.stringify({ defaultTags: ["vendas"], dashboardDefaultRange: "7", dashboardDefaultBucket: "day" }),
      active: true,
      updatedAt: new Date("2026-06-11T12:00:00.000Z")
    });
    const prisma = { organization: { findFirst } };

    const result = await getOrganizationSettings(prisma as never, actor, {
      googleLoginAllowedDomains: ["alwaysfit.com.br"]
    });

    expect(result.organization.settings.defaultTags).toEqual(["vendas"]);
    expect(result.googleLogin).toEqual({
      allowedDomains: ["alwaysfit.com.br"],
      editable: false,
      source: "env"
    });
  });

  it("updates organization settings and audits the allowed fields", async () => {
    const update = vi.fn().mockResolvedValue({
      id: "org-1",
      name: "AlwaysTrack Comercial",
      document: null,
      logoUrl: "/assets/logo.png",
      settingsJson: JSON.stringify({ defaultTags: ["notas"], dashboardDefaultRange: "30", dashboardDefaultBucket: "day" }),
      active: true,
      updatedAt: new Date("2026-06-11T12:00:00.000Z")
    });
    const auditCreate = vi.fn().mockResolvedValue({ id: "audit-1" });
    const prisma = {
      organization: {
        findFirst: vi.fn().mockResolvedValue({ id: "org-1", settingsJson: null }),
        update
      },
      auditLog: { create: auditCreate }
    };

    const result = await updateOrganizationSettings(prisma as never, actor, {
      name: "AlwaysTrack Comercial",
      logoUrl: "/assets/logo.png",
      defaultTags: ["notas"]
    });

    expect(result.settings.defaultTags).toEqual(["notas"]);
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: "AlwaysTrack Comercial",
          logoUrl: "/assets/logo.png",
          settingsJson: expect.any(String)
        })
      })
    );
    expect(auditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "organization.settings_update",
          entityType: "Organization",
          actorId: "admin-1"
        })
      })
    );
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
