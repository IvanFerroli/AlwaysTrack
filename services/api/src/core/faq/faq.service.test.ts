import { describe, expect, it, vi } from "vitest";
import type { CurrentUser } from "@alwaystrack/shared";
import {
  addFaqComment,
  buildPublicHelpLink,
  createFaqThread,
  createFaqItem,
  FaqError,
  listFaqItems,
  listFaqThreads,
  promoteFaqThreadToWiki,
  listPublicFaqItems,
  parseFaqCommentInput,
  parseFaqFilters,
  parseFaqInput,
  parseFaqReactionInput,
  parseFaqThreadFilters,
  parseFaqThreadInput,
  parsePublicHelpInput,
  setFaqReaction,
  updateFaqThreadStatus,
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
    expect(parseFaqThreadInput({ title: " Como aprovar? ", body: "", status: "RESOLVED" })).toEqual({
      title: "Como aprovar?",
      body: null,
      status: "RESOLVED",
      tags: undefined
    });
    expect(parseFaqThreadInput({ title: " Como aprovar? ", body: "#Notas", tags: ["Vendas", "nota fiscal"] })).toEqual({
      title: "Como aprovar?",
      body: "#Notas",
      status: undefined,
      tags: ["nota-fiscal", "vendas"]
    });
    expect(parseFaqThreadFilters({ query: " nota ", status: "OPEN", tags: " vendas,nota fiscal ", recent: "30" })).toEqual({
      query: "nota",
      status: "OPEN",
      tags: ["nota-fiscal", "vendas"],
      recent: "30"
    });
    expect(parseFaqCommentInput({ body: " Resposta " })).toEqual({ body: "Resposta" });
    expect(parseFaqReactionInput({ targetType: "THREAD", targetId: "thread-1", type: "HELPFUL", active: false })).toEqual({
      targetType: "THREAD",
      targetId: "thread-1",
      type: "HELPFUL",
      active: false
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

  it("creates FAQ threads with tenant and audit", async () => {
    const thread = {
      id: "thread-1",
      title: "Como aprovar nota?",
      body: "Tenho duvida #notas",
      tagsJson: "[\"notas\",\"vendas\"]",
      status: "OPEN",
      author: { id: "admin-1", name: "Admin", email: "admin@example.com", role: "ADMIN" },
      wikiPage: null,
      promotedBy: null,
      comments: [],
      reactions: []
    };
    const prisma = {
      faqThread: { create: vi.fn().mockResolvedValue(thread) },
      auditLog: { create: vi.fn().mockResolvedValue({ id: "audit-1" }) }
    };

    const result = await createFaqThread(prisma as never, admin, { title: "Como aprovar nota?", body: "Tenho duvida #notas", tags: ["vendas"] });

    expect(result.tags).toEqual(["notas", "vendas"]);
    expect(prisma.faqThread.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          organizationId: "org-1",
          authorId: "admin-1",
          status: "OPEN",
          tagsJson: "[\"notas\",\"vendas\"]"
        })
      })
    );
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: "faq.thread.create", entityType: "FaqThread" }) })
    );
  });

  it("filters FAQ threads by query, tag, and recency", async () => {
    const prisma = {
      faqThread: { findMany: vi.fn().mockResolvedValue([]), count: vi.fn().mockResolvedValue(0) }
    };

    await listFaqThreads(prisma as never, admin, { query: "nota", tags: ["vendas"], recent: "30" });

    expect(prisma.faqThread.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          organizationId: "org-1",
          updatedAt: expect.objectContaining({ gte: expect.any(Date) }),
          AND: expect.arrayContaining([{ tagsJson: { contains: "\"vendas\"" } }]),
          OR: expect.arrayContaining([{ tagsJson: { contains: "nota" } }])
        })
      })
    );
  });

  it("adds comments and marks thread answered", async () => {
    const baseThread = { id: "thread-1", organizationId: "org-1", comments: [], reactions: [] };
    const prisma = {
      faqThread: {
        findFirst: vi.fn().mockResolvedValue(baseThread),
        update: vi.fn().mockResolvedValue({ ...baseThread, status: "ANSWERED" })
      },
      faqComment: { create: vi.fn().mockResolvedValue({ id: "comment-1" }) },
      auditLog: { create: vi.fn().mockResolvedValue({ id: "audit-1" }) }
    };

    await addFaqComment(prisma as never, admin, "thread-1", { body: "Revise os itens antes." });

    expect(prisma.faqComment.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ organizationId: "org-1", threadId: "thread-1", authorId: "admin-1" }) })
    );
    expect(prisma.faqThread.update).toHaveBeenCalledWith({ where: { id: "thread-1" }, data: { status: "ANSWERED" } });
  });

  it("upserts and removes FAQ reactions by target", async () => {
    const baseThread = { id: "thread-1", organizationId: "org-1", comments: [], reactions: [] };
    const prisma = {
      faqThread: { findFirst: vi.fn().mockResolvedValue(baseThread) },
      faqReaction: {
        upsert: vi.fn().mockResolvedValue({ id: "reaction-1" }),
        deleteMany: vi.fn().mockResolvedValue({ count: 1 })
      },
      auditLog: { create: vi.fn().mockResolvedValue({ id: "audit-1" }) }
    };

    await setFaqReaction(prisma as never, admin, "thread-1", { targetType: "THREAD", targetId: "thread-1", type: "HELPFUL" });
    await setFaqReaction(prisma as never, admin, "thread-1", { targetType: "THREAD", targetId: "thread-1", type: "HELPFUL", active: false });

    expect(prisma.faqReaction.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          organizationId_targetType_targetId_userId_type: {
            organizationId: "org-1",
            targetType: "THREAD",
            targetId: "thread-1",
            userId: "admin-1",
            type: "HELPFUL"
          }
        }
      })
    );
    expect(prisma.faqReaction.deleteMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ targetType: "THREAD", targetId: "thread-1", userId: "admin-1" }) })
    );
  });

  it("allows supervisors to update FAQ thread status", async () => {
    const prisma = {
      faqThread: {
        findFirst: vi.fn().mockResolvedValue({ id: "thread-1", organizationId: "org-1", comments: [], reactions: [] }),
        update: vi.fn().mockResolvedValue({ id: "thread-1", status: "RESOLVED", comments: [], reactions: [] })
      },
      auditLog: { create: vi.fn().mockResolvedValue({ id: "audit-1" }) }
    };

    await updateFaqThreadStatus(prisma as never, supervisor, "thread-1", { status: "RESOLVED" });

    expect(prisma.faqThread.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "thread-1" }, data: { status: "RESOLVED" } })
    );
  });

  it("blocks non-superior FAQ promotion to wiki", async () => {
    const seller: CurrentUser = { ...supervisor, id: "seller-1", role: "VENDEDOR" };

    await expect(promoteFaqThreadToWiki({} as never, seller, "thread-1")).rejects.toEqual(new FaqError("FORBIDDEN"));
  });

  it("promotes FAQ thread to wiki and stores backlink", async () => {
    const thread = {
      id: "thread-1",
      title: "Como aprovar nota?",
      body: "Preciso revisar itens",
      status: "ANSWERED",
      wikiPage: null,
      comments: [{ id: "comment-1", body: "Confira vendedor e total.", author: { name: "Supervisor" }, reactions: [] }],
      reactions: []
    };
    const prisma = {
      faqThread: {
        findFirst: vi.fn().mockResolvedValue(thread),
        update: vi.fn().mockResolvedValue({ ...thread, status: "RESOLVED", wikiPage: { id: "wiki-1", slug: "como-aprovar-nota" } })
      },
      wikiPage: {
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({
          id: "wiki-1",
          slug: "como-aprovar-nota",
          title: "Como aprovar nota?",
          content: "# Como aprovar nota?",
          version: 1
        })
      },
      wikiRevision: { create: vi.fn().mockResolvedValue({ id: "rev-1" }) },
      auditLog: { create: vi.fn().mockResolvedValue({ id: "audit-1" }) }
    };

    await promoteFaqThreadToWiki(prisma as never, admin, "thread-1");

    expect(prisma.wikiPage.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ organizationId: "org-1", slug: "como-aprovar-nota", createdById: "admin-1" })
      })
    );
    expect(prisma.faqThread.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "thread-1" },
        data: expect.objectContaining({ wikiPageId: "wiki-1", promotedById: "admin-1", status: "RESOLVED" })
      })
    );
  });
});
