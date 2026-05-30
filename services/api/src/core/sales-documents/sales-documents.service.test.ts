import { describe, expect, it, vi } from "vitest";
import type { CurrentUser } from "@alwaystrack/shared";
import { getSalesDashboard, listSalesDocuments, parseSalesDocumentUploadInput, uploadSalesDocument } from "./sales-documents.service.js";

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
  id: "seller-user-1",
  name: "Vendedor",
  email: "vendedor@example.com",
  role: "VENDEDOR",
  organizationId: "org-1",
  unitScopeIds: [],
  sectorScopeIds: []
};

describe("sales documents service", () => {
  it("parses binary DANFE upload input", () => {
    expect(
      parseSalesDocumentUploadInput({
        query: { sellerProfileId: " seller-1 ", fileName: "danfe.pdf" },
        headers: { "content-type": "application/pdf; charset=utf-8" },
        body: Buffer.from("pdf")
      })
    ).toEqual({
      sellerProfileId: "seller-1",
      fileName: "danfe.pdf",
      mimeType: "application/pdf",
      body: Buffer.from("pdf")
    });
  });

  it("lists documents scoped to the logged seller", async () => {
    const prisma = {
      salesDocument: { findMany: vi.fn().mockResolvedValue([]), count: vi.fn().mockResolvedValue(0) }
    };

    await listSalesDocuments(prisma as never, seller, {});

    expect(prisma.salesDocument.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          organizationId: "org-1",
          sellerProfile: expect.objectContaining({ userId: "seller-user-1" })
        })
      })
    );
  });

  it("uploads a DANFE for the seller profile and audits it", async () => {
    const prisma = {
      sellerProfile: {
        findFirst: vi.fn().mockResolvedValue({
          id: "seller-1",
          organizationId: "org-1",
          userId: "seller-user-1",
          salesGroup: null,
          user: { id: "seller-user-1" }
        })
      },
      salesDocument: {
        create: vi.fn().mockResolvedValue({
          id: "doc-1",
          sellerProfileId: "seller-1",
          fileName: "danfe.pdf",
          status: "UPLOADED"
        })
      },
      auditLog: { create: vi.fn().mockResolvedValue({ id: "audit-1" }) }
    };
    const storage = { put: vi.fn().mockResolvedValue(undefined), get: vi.fn() };

    const result = await uploadSalesDocument(prisma as never, storage, seller, {
      fileName: "../danfe.pdf",
      mimeType: "application/pdf",
      body: Buffer.from("pdf")
    });

    expect(result.status).toBe("UPLOADED");
    expect(storage.put).toHaveBeenCalledWith(expect.objectContaining({ fileKey: expect.stringContaining("org-1/sales-documents/seller-1/") }));
    expect(prisma.salesDocument.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ organizationId: "org-1", sellerProfileId: "seller-1", fileName: "danfe.pdf" })
      })
    );
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: "sales_document.upload", entityType: "SalesDocument" }) })
    );
  });

  it("builds commercial dashboard metrics from approved items", async () => {
    const prisma = {
      salesDocument: {
        count: vi.fn().mockResolvedValueOnce(3).mockResolvedValueOnce(1).mockResolvedValueOnce(1).mockResolvedValueOnce(1),
        findMany: vi.fn().mockResolvedValue([{ id: "doc-1", sellerProfile: { displayName: "Ana", salesGroup: { name: "Norte" } } }])
      },
      sellerProfile: { findMany: vi.fn().mockResolvedValue([{ id: "seller-1", active: true, salesGroup: { name: "Norte" } }]) },
      salesItem: {
        findMany: vi.fn().mockResolvedValue([
          {
            sellerProfileId: "seller-1",
            totalAmountCents: 15000,
            quantity: 2,
            sellerProfile: { displayName: "Ana", salesGroup: { name: "Norte" } }
          }
        ])
      }
    };

    const dashboard = await getSalesDashboard(prisma as never, admin);

    expect(dashboard.metrics.totalDocuments).toBe(3);
    expect(dashboard.metrics.totalAmountCents).toBe(15000);
    expect(dashboard.queues.topSellers).toEqual([
      { sellerId: "seller-1", sellerName: "Ana", groupName: "Norte", totalAmountCents: 15000, quantity: 2 }
    ]);
  });
});
