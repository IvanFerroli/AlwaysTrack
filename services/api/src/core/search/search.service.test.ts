import { describe, expect, it, vi } from "vitest";
import type { CurrentUser } from "@alwaystrack/shared";
import { globalSearch, parseGlobalSearchInput } from "./search.service.js";

const admin: CurrentUser = {
  id: "admin-1",
  name: "Admin",
  email: "admin@example.com",
  role: "ADMIN",
  organizationId: "org-1",
  unitScopeIds: [],
  sectorScopeIds: []
};

const seller: CurrentUser = {
  ...admin,
  id: "seller-user-1",
  role: "VENDEDOR"
};

function prismaMock() {
  return {
    salesDocument: {
      findMany: vi.fn().mockResolvedValue([
        {
          id: "doc-1",
          fileName: "danfe.pdf",
          invoiceNumber: "703444",
          status: "APPROVED",
          totalAmountCents: 15990,
          sellerProfile: { displayName: "Ana", salesGroup: { name: "Vendas" } }
        }
      ])
    },
    sellerProfile: {
      findMany: vi.fn().mockResolvedValue([{ id: "seller-1", displayName: "Ana", code: "ANA", salesGroup: { name: "Vendas" } }])
    },
    salesCampaign: {
      findMany: vi.fn().mockResolvedValue([{ id: "campaign-1", name: "Junho", status: "ACTIVE", description: "Whey", salesGroup: null }])
    },
    wikiPage: {
      findMany: vi.fn().mockResolvedValue([{ id: "wiki-1", title: "Conferência DANFE", slug: "conferencia-danfe", active: true }])
    },
    faqThread: {
      findMany: vi.fn().mockResolvedValue([{ id: "faq-1", title: "Como conferir DANFE?", body: "Confira NF", status: "OPEN" }])
    }
  };
}

describe("global search service", () => {
  it("parses safe query and limit", () => {
    expect(parseGlobalSearchInput({ q: " danfe ", limit: "20" })).toEqual({ query: "danfe", limit: 8 });
    expect(parseGlobalSearchInput({ q: "x", limit: "0" })).toEqual({ query: undefined, limit: 1 });
  });

  it("returns grouped scoped results", async () => {
    const prisma = prismaMock();
    const result = await globalSearch(prisma as never, admin, { query: "danfe", limit: 5 });

    expect(result.total).toBe(5);
    expect(result.groups.map((group) => group.key)).toEqual(["notes", "sellers", "campaigns", "wiki", "faq"]);
    expect(result.groups[0].items[0]).toMatchObject({ type: "note", title: "NF 703444", href: "/notas" });
    expect(prisma.salesDocument.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 5 }));
  });

  it("scopes seller results to the logged seller profile", async () => {
    const prisma = prismaMock();
    await globalSearch(prisma as never, seller, { query: "ana", limit: 5 });

    expect(prisma.salesDocument.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          sellerProfile: expect.objectContaining({ userId: "seller-user-1" })
        })
      })
    );
    expect(prisma.sellerProfile.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: "seller-user-1" })
      })
    );
  });
});
