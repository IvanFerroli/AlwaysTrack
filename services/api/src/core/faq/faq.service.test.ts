import { describe, expect, it, vi } from "vitest";
import type { CurrentUser } from "@sylembra/shared";
import {
  buildPublicHelpLink,
  createFaqItem,
  FaqError,
  listFaqItems,
  listPublicFaqItems,
  parseFaqFilters,
  parseFaqInput,
  parsePublicHelpInput,
  updateFaqItem
} from "./faq.service.js";

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

describe("faq service", () => {
  it("parses faq payloads and filters", () => {
    expect(parseFaqInput({ category: " Docs ", question: " Como? ", answer: " Assim ", order: "2", active: false })).toEqual({
      category: "Docs",
      question: "Como?",
      answer: "Assim",
      order: 2,
      active: false
    });
    expect(parseFaqFilters({ organizationId: " org-1 ", query: " envio ", activeOnly: "false" })).toEqual({
      organizationId: "org-1",
      category: undefined,
      query: "envio",
      activeOnly: false
    });
    expect(parsePublicHelpInput({ organizationId: " org-1 ", problemType: "Upload", message: " Nao consigo " })).toEqual({
      organizationId: "org-1",
      professionalId: undefined,
      licenseId: undefined,
      problemType: "Upload",
      message: "Nao consigo"
    });
  });

  it("lists admin faq items by organization and search", async () => {
    const prisma = {
      faqItem: {
        findMany: vi.fn().mockResolvedValue([]),
        count: vi.fn().mockResolvedValue(0)
      }
    };

    await listFaqItems(prisma as never, admin, { query: "documento" });

    expect(prisma.faqItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          organizationId: "org-1",
          OR: [{ question: { contains: "documento" } }, { answer: { contains: "documento" } }]
        })
      })
    );
  });

  it("lists only active public faq items for active organization", async () => {
    const prisma = {
      organization: { findFirst: vi.fn().mockResolvedValue({ id: "org-1", name: "Demo" }) },
      faqItem: {
        findMany: vi.fn().mockResolvedValue([{ id: "faq-1" }]),
        count: vi.fn().mockResolvedValue(1)
      }
    };

    const result = await listPublicFaqItems(prisma as never, { organizationId: "org-1", query: "envio" });

    expect(result.total).toBe(1);
    expect(prisma.faqItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ organizationId: "org-1", active: true }) })
    );
  });

  it("creates faq items with audit", async () => {
    const prisma = {
      faqItem: {
        create: vi.fn().mockResolvedValue({
          id: "faq-1",
          category: "Docs",
          question: "Como enviar?",
          active: true
        })
      },
      auditLog: { create: vi.fn().mockResolvedValue({ id: "audit-1" }) }
    };

    await createFaqItem(prisma as never, admin, { category: "Docs", question: "Como enviar?", answer: "Use o link." });

    expect(prisma.faqItem.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ organizationId: "org-1", category: "Docs" }) })
    );
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: "faq.create", entityType: "FaqItem" }) })
    );
  });

  it("blocks non-admin writes", async () => {
    await expect(
      createFaqItem({} as never, supervisor, { category: "Docs", question: "Q", answer: "A" })
    ).rejects.toEqual(new FaqError("FORBIDDEN"));
  });

  it("updates faq items and audits deactivation", async () => {
    const prisma = {
      faqItem: {
        findFirst: vi.fn().mockResolvedValue({ id: "faq-1", organizationId: "org-1" }),
        update: vi.fn().mockResolvedValue({ id: "faq-1", active: false })
      },
      auditLog: { create: vi.fn().mockResolvedValue({ id: "audit-1" }) }
    };

    await updateFaqItem(prisma as never, admin, "faq-1", { active: false });

    expect(prisma.faqItem.update).toHaveBeenCalledWith({ where: { id: "faq-1" }, data: { active: false } });
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: "faq.deactivate" }) })
    );
  });

  it("builds wa.me links prioritizing professional RT", async () => {
    const prisma = {
      organization: { findFirst: vi.fn().mockResolvedValue({ id: "org-1", name: "Demo" }) },
      professional: {
        findFirst: vi.fn().mockResolvedValue({
          id: "pro-1",
          name: "Ana",
          unitId: "unit-1",
          sectorId: "sector-1",
          responsibleRt: { phone: "+55 (83) 99999-0000" },
          unit: { name: "Unidade" },
          sector: { name: "Setor" },
          licenses: [{ number: "123", licenseType: { name: "Registro" } }]
        })
      },
      user: { findFirst: vi.fn() }
    };

    const result = await buildPublicHelpLink(prisma as never, {
      organizationId: "org-1",
      professionalId: "pro-1",
      licenseId: "lic-1",
      problemType: "Upload",
      message: "Nao consigo enviar"
    });

    expect(result.recipient).toBe("RT");
    expect(result.url).toContain("https://wa.me/5583999990000");
    expect(decodeURIComponent(result.url)).toContain("Profissional: Ana");
  });

  it("falls back to admin phone when no scoped recipient exists", async () => {
    const prisma = {
      organization: { findFirst: vi.fn().mockResolvedValue({ id: "org-1", name: "Demo" }) },
      professional: { findFirst: vi.fn().mockResolvedValue(null) },
      user: {
        findFirst: vi.fn().mockResolvedValue({ phone: "+55 11 90000-0000" })
      }
    };

    const result = await buildPublicHelpLink(prisma as never, {
      organizationId: "org-1",
      problemType: "Duvida",
      message: "Preciso de ajuda"
    });

    expect(result.recipient).toBe("ADMIN");
    expect(result.url).toContain("5511900000000");
  });
});
