import { describe, expect, it, vi } from "vitest";
import type { CurrentUser } from "@alwaystrack/shared";
import {
  archiveWikiPage,
  approveWikiEditRequest,
  createWikiEditRequest,
  createWikiPage,
  heartbeatWikiPresence,
  getWikiPageBySlug,
  listWikiEditRequests,
  listWikiPages,
  markWikiRead,
  getWikiAttachmentFile,
  parseWikiAttachmentUploadInput,
  parseWikiEditRequestInput,
  parseWikiPageInput,
  restoreWikiRevision,
  rejectWikiEditRequest,
  unarchiveWikiPage,
  updateWikiPage,
  uploadWikiAttachment,
  WikiError
} from "./wiki.service.js";

const admin: CurrentUser = {
  id: "admin-1",
  name: "Admin",
  email: "admin@example.com",
  role: "ADMIN",
  organizationId: "org-1",
  unitScopeIds: [],
  sectorScopeIds: []
};

const rt: CurrentUser = {
  id: "rt-1",
  name: "RT",
  email: "rt@example.com",
  role: "RT",
  organizationId: "org-1",
  unitScopeIds: [],
  sectorScopeIds: []
};

describe("wiki service", () => {
  it("parses page and request payloads", () => {
    expect(parseWikiPageInput({ title: " Guia ", content: " Conteudo ", baseVersion: "2" })).toEqual({
      title: "Guia",
      content: "Conteudo",
      slug: undefined,
      baseVersion: 2,
      tags: undefined
    });
    expect(parseWikiPageInput({ title: " Guia ", content: " Conteudo ", tags: [" #Vendas ", "Vendas", "Nota Fiscal"] })).toEqual({
      title: "Guia",
      content: "Conteudo",
      slug: undefined,
      baseVersion: undefined,
      tags: ["nota-fiscal", "vendas"]
    });
    expect(parseWikiEditRequestInput({ pageId: " page-1 ", title: " Novo ", content: " Texto ", baseVersion: 1 })).toEqual({
      pageId: "page-1",
      title: "Novo",
      content: "Texto",
      baseVersion: 1
    });
    expect(
      parseWikiAttachmentUploadInput({
        query: { pageId: " page-1 " },
        headers: { "content-type": "image/png; charset=binary", "x-file-name": "foto.png" },
        body: Buffer.from("file")
      })
    ).toEqual({
      pageId: "page-1",
      requestId: undefined,
      fileName: "foto.png",
      mimeType: "image/png",
      body: Buffer.from("file")
    });
  });

  it("lists pages scoped by organization", async () => {
    const prisma = {
      wikiPage: { findMany: vi.fn().mockResolvedValue([]), count: vi.fn().mockResolvedValue(0) }
    };

    await listWikiPages(prisma as never, admin, { query: "processo" });

    expect(prisma.wikiPage.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          organizationId: "org-1",
          active: true,
          OR: expect.arrayContaining([{ title: { contains: "processo" } }])
        })
      })
    );
  });

  it("filters pages by combined query, tag, and recency", async () => {
    const prisma = {
      wikiPage: { findMany: vi.fn().mockResolvedValue([]), count: vi.fn().mockResolvedValue(0) }
    };

    await listWikiPages(prisma as never, admin, { query: "processo", tags: ["vendas"], recent: "7" });

    expect(prisma.wikiPage.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          organizationId: "org-1",
          active: true,
          updatedAt: expect.objectContaining({ gte: expect.any(Date) }),
          AND: expect.arrayContaining([{ tagsJson: { contains: "\"vendas\"" } }]),
          OR: expect.arrayContaining([{ tagsJson: { contains: "processo" } }])
        })
      })
    );
  });

  it("lets admins include archived wiki pages in administration lists", async () => {
    const prisma = {
      wikiPage: { findMany: vi.fn().mockResolvedValue([]), count: vi.fn().mockResolvedValue(0) }
    };

    await listWikiPages(prisma as never, admin, { pageStatus: "ARCHIVED" });

    expect(prisma.wikiPage.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          organizationId: "org-1",
          active: false
        })
      })
    );
  });

  it("gets a wiki page by slug scoped to the actor organization", async () => {
    const prisma = {
      wikiPage: {
        findFirst: vi.fn().mockResolvedValue({
          id: "page-1",
          slug: "primeira-wiki",
          title: "Primeira Wiki",
          content: "Conteudo #wiki",
          version: 1,
          active: true,
          updatedBy: null,
          readReceipts: [],
          presences: [],
          editRequests: [],
          revisions: []
        })
      }
    };

    const result = await getWikiPageBySlug(prisma as never, admin, " Primeira Wiki ");

    expect(result.page.slug).toBe("primeira-wiki");
    expect(result.page.tags).toEqual(["wiki"]);
    expect(prisma.wikiPage.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          organizationId: "org-1",
          slug: "primeira-wiki"
        })
      })
    );
  });

  it("does not expose archived wiki pages by slug to non-admin users", async () => {
    const prisma = {
      wikiPage: { findFirst: vi.fn().mockResolvedValue(null) }
    };

    await expect(getWikiPageBySlug(prisma as never, { ...admin, role: "VENDEDOR" }, "arquivada")).rejects.toEqual(new WikiError("NOT_FOUND"));
    expect(prisma.wikiPage.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          organizationId: "org-1",
          slug: "arquivada",
          active: true
        })
      })
    );
  });

  it("lets admins create and publish pages directly", async () => {
    const prisma = {
      wikiPage: {
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({ id: "page-1", slug: "primeiros-passos", title: "Primeiros passos", content: "Use. #onboarding", version: 1 })
      },
      wikiRevision: { create: vi.fn().mockResolvedValue({ id: "rev-1" }) },
      auditLog: { create: vi.fn().mockResolvedValue({ id: "audit-1" }) }
    };

    const page = await createWikiPage(prisma as never, admin, { title: "Primeiros passos", content: "Use.", tags: ["processo"] });

    expect(page.id).toBe("page-1");
    expect(page.contentFormat).toBe("MARKDOWN");
    expect(page.tags).toEqual(["onboarding"]);
    expect(prisma.wikiPage.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          organizationId: "org-1",
          slug: "primeiros-passos",
          tagsJson: "[\"processo\"]"
        })
      })
    );
    expect(prisma.wikiRevision.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ pageId: "page-1", version: 1 }) })
    );
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: "wiki.page.create", entityType: "WikiPage" }) })
    );
  });

  it("lets admins update a page slug when it stays unique in the organization", async () => {
    const prisma = {
      wikiPage: {
        findFirst: vi
          .fn()
          .mockResolvedValueOnce({ id: "page-1", slug: "guia-antigo", title: "Guia", content: "Conteudo", version: 2, organizationId: "org-1" })
          .mockResolvedValueOnce(null),
        update: vi.fn().mockResolvedValue({ id: "page-1", slug: "guia-novo", title: "Guia", content: "Conteudo", version: 3 })
      },
      wikiRevision: { create: vi.fn().mockResolvedValue({ id: "rev-3" }) },
      auditLog: { create: vi.fn().mockResolvedValue({ id: "audit-1" }) }
    };

    const page = await updateWikiPage(prisma as never, admin, "page-1", {
      title: "Guia",
      slug: " Guia Novo ",
      content: "Conteudo",
      baseVersion: 2
    });

    expect(page.slug).toBe("guia-novo");
    expect(prisma.wikiPage.findFirst).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ where: expect.objectContaining({ organizationId: "org-1", slug: "guia-novo", id: { not: "page-1" } }) })
    );
    expect(prisma.wikiPage.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ slug: "guia-novo" }) }));
  });

  it("turns non-admin edits into pending requests", async () => {
    const prisma = {
      wikiPage: { findFirst: vi.fn().mockResolvedValue({ id: "page-1", version: 2, organizationId: "org-1" }) },
      wikiEditRequest: {
        create: vi.fn().mockResolvedValue({ id: "req-1", pageId: "page-1", status: "PENDING" })
      },
      auditLog: { create: vi.fn().mockResolvedValue({ id: "audit-1" }) }
    };

    const request = await createWikiEditRequest(prisma as never, rt, {
      pageId: "page-1",
      title: "Novo titulo",
      content: "Novo texto",
      baseVersion: 2
    });

    expect(request.status).toBe("PENDING");
    expect(request.contentFormat).toBe("MARKDOWN");
    expect(prisma.wikiEditRequest.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ organizationId: "org-1", authorId: "rt-1", baseVersion: 2, status: "PENDING" })
      })
    );
  });

  it("filters edit requests by page, author, and content query", async () => {
    const prisma = {
      wikiEditRequest: { findMany: vi.fn().mockResolvedValue([]), count: vi.fn().mockResolvedValue(0) }
    };

    await listWikiEditRequests(prisma as never, admin, { status: "PENDING", query: "protocolo" });

    expect(prisma.wikiEditRequest.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          organizationId: "org-1",
          status: "PENDING",
          OR: expect.arrayContaining([{ title: { contains: "protocolo" } }])
        })
      })
    );
  });

  it("blocks stale edit requests", async () => {
    const prisma = {
      wikiPage: { findFirst: vi.fn().mockResolvedValue({ id: "page-1", version: 3, organizationId: "org-1" }) }
    };

    await expect(
      createWikiEditRequest(prisma as never, rt, { pageId: "page-1", title: "T", content: "C", baseVersion: 2 })
    ).rejects.toEqual(new WikiError("VERSION_CONFLICT"));
  });

  it("approves pending requests and publishes a new version", async () => {
    const prisma = {
      wikiEditRequest: {
        findFirst: vi.fn().mockResolvedValue({
          id: "req-1",
          organizationId: "org-1",
          pageId: "page-1",
          authorId: "rt-1",
          baseVersion: 2,
          title: "Aprovado",
          content: "Conteudo",
          status: "PENDING",
          page: { id: "page-1", version: 2 }
        }),
        update: vi.fn().mockResolvedValue({ id: "req-1", status: "APPROVED" })
      },
      wikiPage: {
        update: vi.fn().mockResolvedValue({ id: "page-1", title: "Aprovado", content: "Conteudo", version: 3 })
      },
      wikiRevision: { create: vi.fn().mockResolvedValue({ id: "rev-3" }) },
      auditLog: { create: vi.fn().mockResolvedValue({ id: "audit-1" }) }
    };

    const result = await approveWikiEditRequest(prisma as never, admin, "req-1", { decisionNote: "ok" });

    expect(result.page.version).toBe(3);
    expect(prisma.wikiEditRequest.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "APPROVED", reviewerId: "admin-1", decisionNote: "ok" }) })
    );
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: "wiki.request.approve" }) })
    );
  });

  it("stores decision notes when rejecting wiki edit requests", async () => {
    const prisma = {
      wikiEditRequest: {
        findFirst: vi.fn().mockResolvedValue({
          id: "req-1",
          organizationId: "org-1",
          pageId: "page-1",
          authorId: "rt-1",
          baseVersion: 2,
          title: "Rejeitado",
          content: "Conteudo",
          status: "PENDING",
          page: { id: "page-1", version: 2 }
        }),
        update: vi.fn().mockResolvedValue({ id: "req-1", status: "REJECTED", decisionNote: "precisa ajustar" })
      },
      auditLog: { create: vi.fn().mockResolvedValue({ id: "audit-1" }) }
    };

    await rejectWikiEditRequest(prisma as never, admin, "req-1", { decisionNote: "precisa ajustar" });

    expect(prisma.wikiEditRequest.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "REJECTED", reviewerId: "admin-1", decisionNote: "precisa ajustar" }) })
    );
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: "wiki.request.reject", metadataJson: expect.stringContaining("precisa ajustar") }) })
    );
  });

  it("archives and unarchives pages without deleting history", async () => {
    const prisma = {
      wikiPage: {
        findFirst: vi
          .fn()
          .mockResolvedValueOnce({ id: "page-1", slug: "guia", content: "Conteudo", version: 2, active: true })
          .mockResolvedValueOnce({ id: "page-1", slug: "guia", content: "Conteudo", version: 2, active: false }),
        update: vi
          .fn()
          .mockResolvedValueOnce({ id: "page-1", slug: "guia", content: "Conteudo", version: 2, active: false })
          .mockResolvedValueOnce({ id: "page-1", slug: "guia", content: "Conteudo", version: 2, active: true })
      },
      auditLog: { create: vi.fn().mockResolvedValue({ id: "audit-1" }) }
    };

    const archived = await archiveWikiPage(prisma as never, admin, "page-1");
    const unarchived = await unarchiveWikiPage(prisma as never, admin, "page-1");

    expect(archived.active).toBe(false);
    expect(unarchived.active).toBe(true);
    expect(prisma.wikiPage.update).toHaveBeenNthCalledWith(1, expect.objectContaining({ data: expect.objectContaining({ active: false }) }));
    expect(prisma.wikiPage.update).toHaveBeenNthCalledWith(2, expect.objectContaining({ data: expect.objectContaining({ active: true }) }));
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: "wiki.page.archive" }) })
    );
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: "wiki.page.unarchive" }) })
    );
  });

  it("restores an old revision as a new page version", async () => {
    const prisma = {
      wikiPage: {
        findFirst: vi.fn().mockResolvedValue({ id: "page-1", version: 4, organizationId: "org-1" }),
        update: vi.fn().mockResolvedValue({ id: "page-1", title: "Antigo", content: "Conteudo antigo", version: 5, active: true })
      },
      wikiRevision: {
        findFirst: vi.fn().mockResolvedValue({ id: "rev-2", title: "Antigo", content: "Conteudo antigo", version: 2 }),
        create: vi.fn().mockResolvedValue({ id: "rev-5" })
      },
      auditLog: { create: vi.fn().mockResolvedValue({ id: "audit-1" }) }
    };

    const page = await restoreWikiRevision(prisma as never, admin, "page-1", "rev-2");

    expect(page.version).toBe(5);
    expect(prisma.wikiPage.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ title: "Antigo", content: "Conteudo antigo", version: 5, active: true }) })
    );
    expect(prisma.wikiRevision.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ pageId: "page-1", version: 5 }) })
    );
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: "wiki.revision.restore" }) })
    );
  });

  it("tracks reads and presence per page/user", async () => {
    const prisma = {
      wikiPage: { findFirst: vi.fn().mockResolvedValue({ id: "page-1", version: 1 }) },
      wikiReadReceipt: { upsert: vi.fn().mockResolvedValue({ id: "read-1" }) },
      wikiPresence: { upsert: vi.fn().mockResolvedValue({ id: "presence-1", mode: "EDITING" }) },
      auditLog: { create: vi.fn().mockResolvedValue({ id: "audit-1" }) }
    };

    await markWikiRead(prisma as never, rt, "page-1");
    await heartbeatWikiPresence(prisma as never, rt, "page-1", { mode: "EDITING" });

    expect(prisma.wikiReadReceipt.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { pageId_userId: { pageId: "page-1", userId: "rt-1" } } })
    );
    expect(prisma.wikiPresence.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ update: expect.objectContaining({ mode: "EDITING" }) })
    );
  });

  it("uploads wiki image attachments into private organization storage", async () => {
    const prisma = {
      wikiPage: { findFirst: vi.fn().mockResolvedValue({ id: "page-1", organizationId: "org-1" }) },
      wikiEditRequest: { findFirst: vi.fn() },
      wikiAttachment: {
        create: vi.fn().mockResolvedValue({
          id: "att-1",
          fileName: "foto.png",
          fileKey: "org-1/wiki-attachments/file.png",
          mimeType: "image/png",
          size: 4
        })
      },
      auditLog: { create: vi.fn().mockResolvedValue({ id: "audit-1" }) }
    };
    const storage = { put: vi.fn().mockResolvedValue(undefined), get: vi.fn() };

    const attachment = await uploadWikiAttachment(prisma as never, storage as never, admin, {
      pageId: "page-1",
      fileName: "foto.png",
      mimeType: "image/png",
      body: Buffer.from("file")
    });

    expect(attachment.markdownUrl).toBe("/v1/wiki/attachments/att-1/file");
    expect(storage.put).toHaveBeenCalledWith(expect.objectContaining({ fileKey: expect.stringContaining("org-1/wiki-attachments/") }));
    expect(prisma.wikiAttachment.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ organizationId: "org-1", uploadedById: "admin-1", pageId: "page-1" }) })
    );
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: "wiki.attachment.upload" }) })
    );
  });

  it("downloads wiki attachments only from the actor organization", async () => {
    const prisma = {
      wikiAttachment: {
        findFirst: vi.fn().mockResolvedValue({
          id: "att-1",
          fileName: "foto.png",
          fileKey: "org-1/wiki-attachments/file.png",
          mimeType: "image/png",
          size: 4,
          page: { active: true }
        })
      }
    };
    const storage = { put: vi.fn(), get: vi.fn().mockResolvedValue({ body: Buffer.from("file"), mimeType: "image/png" }) };

    const file = await getWikiAttachmentFile(prisma as never, storage as never, admin, "att-1");

    expect(file.fileName).toBe("foto.png");
    expect(prisma.wikiAttachment.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "att-1", organizationId: "org-1" }, include: expect.objectContaining({ page: expect.any(Object) }) })
    );
  });

  it("requires admin for direct publishing", async () => {
    await expect(updateWikiPage({} as never, rt, "page-1", { title: "T", content: "C", baseVersion: 1 })).rejects.toEqual(
      new WikiError("FORBIDDEN")
    );
  });
});
