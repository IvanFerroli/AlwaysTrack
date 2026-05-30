import { describe, expect, it, vi } from "vitest";
import type { CurrentUser } from "@alwaystrack/shared";
import {
  analyzeSalesDocumentWithAi,
  getSalesDashboard,
  getSalesRanking,
  listSalesDocuments,
  parseSalesDocumentReviewInput,
  parseSalesDocumentUploadInput,
  reviewSalesDocument,
  uploadSalesDocument
} from "./sales-documents.service.js";

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

  it("parses manual review payload", () => {
    expect(
      parseSalesDocumentReviewInput({
        status: "APPROVED",
        accessKey: " 3526 0500 ",
        items: [{ description: "Whey", quantity: "2", totalAmountCents: "15990" }]
      })
    ).toEqual({
      status: "APPROVED",
      accessKey: "3526 0500",
      invoiceNumber: null,
      series: null,
      issuedAt: null,
      issuerName: null,
      buyerName: null,
      totalAmountCents: null,
      rejectionReason: null,
      items: [{ sku: null, description: "Whey", category: null, quantity: 2, unitAmountCents: null, totalAmountCents: 15990 }]
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

  it("extracts DANFE data into pending review using the configured provider", async () => {
    const prisma = {
      salesDocument: {
        findFirst: vi
          .fn()
          .mockResolvedValueOnce({
            id: "doc-1",
            organizationId: "org-1",
            sellerProfileId: "seller-1",
            fileKey: "file-key",
            fileName: "danfe.pdf",
            mimeType: "application/pdf",
            status: "UPLOADED",
            sellerProfile: { displayName: "Ana" },
            uploadedBy: {},
            reviewedBy: null,
            items: [],
            extractions: []
          })
          .mockResolvedValueOnce(null),
        update: vi
          .fn()
          .mockResolvedValueOnce({ id: "doc-1", status: "EXTRACTING" })
          .mockResolvedValueOnce({
            id: "doc-1",
            status: "PENDING_REVIEW",
            accessKey: "35260500000000000100550010000000011000000010",
            items: [{ id: "item-1" }]
          })
      },
      salesDocumentExtraction: { create: vi.fn().mockResolvedValue({ id: "ext-1" }) },
      salesItem: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }), createMany: vi.fn().mockResolvedValue({ count: 1 }) },
      auditLog: { create: vi.fn().mockResolvedValue({ id: "audit-1" }) },
      $transaction: vi.fn(async (callback) => callback(prisma))
    };
    const storage = { get: vi.fn().mockResolvedValue({ body: Buffer.from("pdf"), mimeType: "application/pdf" }), put: vi.fn() };
    const provider = {
      provider: "fake-sales",
      model: "test",
      analyze: vi.fn(),
      analyzeSalesDocument: vi.fn().mockResolvedValue({
        documentKind: "DANFE",
        rawText: "raw",
        fields: {
          accessKey: { value: "35260500000000000100550010000000011000000010", confidence: 0.99, evidence: null },
          invoiceNumber: { value: "1", confidence: 0.9, evidence: null },
          series: { value: "1", confidence: 0.9, evidence: null },
          issuedAt: { value: "2026-05-22", confidence: 0.9, evidence: null },
          issuerName: { value: "Suplementos LTDA", confidence: 0.8, evidence: null },
          buyerName: { value: "Cliente", confidence: 0.8, evidence: null },
          totalAmountCents: { value: 15990, confidence: 0.9, evidence: null }
        },
        items: [{ sku: "WHEY", description: "Whey", category: "Proteina", quantity: 1, unitAmountCents: 15990, totalAmountCents: 15990 }],
        warnings: []
      })
    };

    const result = await analyzeSalesDocumentWithAi(prisma as never, storage, provider, seller, "doc-1");

    expect(result.document.status).toBe("PENDING_REVIEW");
    expect(prisma.salesDocumentExtraction.create).toHaveBeenCalled();
    expect(prisma.salesItem.createMany).toHaveBeenCalledWith(expect.objectContaining({ data: [expect.objectContaining({ description: "Whey" })] }));
  });

  it("approves a reviewed DANFE and replaces commercial items", async () => {
    const prisma = {
      salesDocument: {
        findFirst: vi.fn().mockResolvedValueOnce({
          id: "doc-1",
          organizationId: "org-1",
          sellerProfileId: "seller-1",
          status: "PENDING_REVIEW",
          sellerProfile: { displayName: "Ana" },
          uploadedBy: {},
          reviewedBy: null,
          items: [],
          extractions: []
        }),
        update: vi.fn().mockResolvedValue({ id: "doc-1", status: "APPROVED", items: [{ id: "item-1" }] })
      },
      salesItem: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }), createMany: vi.fn().mockResolvedValue({ count: 1 }) },
      auditLog: { create: vi.fn().mockResolvedValue({ id: "audit-1" }) },
      $transaction: vi.fn(async (callback) => callback(prisma))
    };

    await reviewSalesDocument(prisma as never, admin, "doc-1", {
      status: "APPROVED",
      totalAmountCents: 15990,
      items: [{ description: "Whey", quantity: 1, totalAmountCents: 15990 }]
    });

    expect(prisma.salesDocument.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: "APPROVED", reviewedById: "admin-1" }) }));
    expect(prisma.salesItem.createMany).toHaveBeenCalled();
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

  it("builds real-time ranking from approved sales items", async () => {
    const prisma = {
      salesItem: {
        findMany: vi.fn().mockResolvedValue([
          {
            salesDocumentId: "doc-1",
            sellerProfileId: "seller-1",
            totalAmountCents: 20000,
            quantity: 2,
            sellerProfile: { displayName: "Ana", salesGroup: { name: "Norte" } }
          }
        ])
      }
    };

    const ranking = await getSalesRanking(prisma as never, admin, {});

    expect(ranking.items).toEqual([
      { position: 1, sellerId: "seller-1", sellerName: "Ana", groupName: "Norte", totalAmountCents: 20000, quantity: 2, documents: 1 }
    ]);
  });
});
