import { describe, expect, it, vi } from "vitest";
import type { CurrentUser } from "@alwaystrack/shared";
import { extractDanfeFromText, extractNfeFromXml } from "./danfe-deterministic.js";
import {
  analyzeSalesDocumentWithAi,
  createRankingSnapshot,
  createSalesCampaign,
  getSalesDashboard,
  getSalesRanking,
  getSalesStatements,
  listSalesDocuments,
  listSalesSellers,
  parseSalesCampaignInput,
  parseSalesDocumentReviewInput,
  parseSalesDocumentUploadInput,
  reviewSalesDocument,
  uniqueSalesInvoicesByAccessKey,
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
  it("extracts searchable DANFE text without AI", () => {
    const text = `
RECEBEMOS DE ALWAYS FIT SUPLEMENTOS ALIMENTICIOS LTDA OS PRODUTOS CONSTANTES DA NOTA FISCAL
NF-e
Nº 703.444
Série 2
IDENTIFICAÇÃO DO EMITENTE
ALWAYS FIT SUPLEMENTOS ALIMENTICIOS LTDA
DANFE
CHAVE DE ACESSO
3126 0530 4170 9400 0240 5500 2000 7034 4414 0219 9743
DESTINATÁRIO / REMETENTE
NOME / RAZÃO SOCIAL
ADRIANA GORETE LOHN
DATA DA EMISSÃO
05/05/2026
VALOR TOTAL DA NOTA
174,53
DADOS DOS PRODUTOS / SERVIÇOS
CÓDIGO PRODUTO DESCRIÇÃO DO PRODUTO / SERVIÇO NCM/SH O/CST CFOP UN QUANT VALOR UNIT VALOR TOTAL B.CÁLC
HAIR1 FitHair - POTE 21069030 000 6108 1 UNID 3 44,91 134,73 131,58 15,79 12,00
ALW-G-B6B9B12-0 Metil-B9B12 21069030 000 6108 1 UNID 2 29,95 59,90 42,95 5,15 12,00
DADOS ADICIONAIS
INFORMAÇÕES COMPLEMENTARES
`.repeat(3);

    const extraction = extractDanfeFromText(text);

    expect(extraction?.provider).toBe("deterministic-pdf-text");
    expect(extraction?.invoices[0].fields.accessKey.value).toBe("31260530417094000240550020007034441402199743");
    expect(extraction?.invoices[0].fields.invoiceNumber.value).toBe("703.444");
    expect(extraction?.invoices[0].fields.totalAmountCents.value).toBe(17453);
    expect(extraction?.invoices[0].items).toHaveLength(2);
  });

  it("extracts NF-e XML without AI", () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <NFe>
    <infNFe Id="NFe31260530417094000240550020007034441402199743" versao="4.00">
      <ide>
        <serie>2</serie>
        <nNF>703444</nNF>
        <dhEmi>2026-05-05T09:40:33-03:00</dhEmi>
      </ide>
      <emit><xNome>ALWAYS FIT SUPLEMENTOS ALIMENTICIOS LTDA</xNome></emit>
      <dest><xNome>ADRIANA GORETE LOHN</xNome></dest>
      <det nItem="1">
        <prod>
          <cProd>HAIR1</cProd>
          <xProd>FitHair - POTE</xProd>
          <NCM>21069030</NCM>
          <qCom>3.0000</qCom>
          <vUnCom>44.91</vUnCom>
          <vProd>134.73</vProd>
        </prod>
      </det>
      <det nItem="2">
        <prod>
          <cProd>ALW-G-B6B9B12-0</cProd>
          <xProd>Metil-B9B12</xProd>
          <NCM>21069030</NCM>
          <qCom>2.0000</qCom>
          <vUnCom>29.90</vUnCom>
          <vProd>59.80</vProd>
        </prod>
      </det>
      <total><ICMSTot><vNF>194.53</vNF></ICMSTot></total>
    </infNFe>
  </NFe>
</nfeProc>`;

    const extraction = extractNfeFromXml(xml);

    expect(extraction?.provider).toBe("deterministic-nfe-xml");
    expect(extraction?.model).toBe("xml-v1");
    expect(extraction?.invoices[0].fields.accessKey.value).toBe("31260530417094000240550020007034441402199743");
    expect(extraction?.invoices[0].fields.invoiceNumber.value).toBe("703444");
    expect(extraction?.invoices[0].fields.issuedAt.value).toBe("2026-05-05");
    expect(extraction?.invoices[0].fields.totalAmountCents.value).toBe(19453);
    expect(extraction?.invoices[0].items).toHaveLength(2);
    expect(extraction?.invoices[0].items[0]).toMatchObject({ sku: "HAIR1", description: "FitHair - POTE", quantity: 3, totalAmountCents: 13473 });
  });

  it("parses binary DANFE upload input", () => {
    expect(
      parseSalesDocumentUploadInput({
        query: { sellerProfileId: " seller-1 ", fileName: "danfe.pdf" },
        headers: { "content-type": "application/xml; charset=utf-8" },
        body: Buffer.from("pdf")
      })
    ).toEqual({
      sellerProfileId: "seller-1",
      fileName: "danfe.pdf",
      mimeType: "application/xml",
      body: Buffer.from("pdf")
    });
  });

  it("parses manual review payload", () => {
    expect(
      parseSalesDocumentReviewInput({
        status: "APPROVED",
        accessKey: " 3526 0500 ",
        reviewNote: " Conferido pelo financeiro ",
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
      reviewNote: "Conferido pelo financeiro",
      items: [{ sku: null, description: "Whey", category: null, quantity: 2, unitAmountCents: null, totalAmountCents: 15990 }]
    });
  });

  it("parses campaign payload", () => {
    expect(
      parseSalesCampaignInput({
        name: " Campanha Proteina ",
        description: " ranking mensal ",
        metric: "totalAmountCents",
        status: "ACTIVE",
        startsAt: "2026-06-01",
        endsAt: "2026-06-30",
        salesGroupId: " group-1 "
      })
    ).toEqual({
      name: "Campanha Proteina",
      description: "ranking mensal",
      metric: "totalAmountCents",
      status: "ACTIVE",
      startsAt: "2026-06-01",
      endsAt: "2026-06-30",
      salesGroupId: "group-1"
    });
  });

  it("deduplicates repeated access keys inside the same deterministic package", () => {
    const baseInvoice = {
      documentKind: "DANFE",
      rawText: "raw",
      fields: {
        accessKey: { value: "3526 0500 0000 0000 0100 5500 1000 0000 0110 0000 0010", confidence: 0.99, evidence: null },
        invoiceNumber: { value: "1", confidence: 0.9, evidence: null },
        series: { value: "1", confidence: 0.9, evidence: null },
        issuedAt: { value: "2026-05-22", confidence: 0.9, evidence: null },
        issuerName: { value: "Suplementos LTDA", confidence: 0.8, evidence: null },
        buyerName: { value: "Cliente", confidence: 0.8, evidence: null },
        totalAmountCents: { value: 15990, confidence: 0.9, evidence: null }
      },
      items: [{ sku: "WHEY", description: "Whey", category: "Proteina", quantity: 1, unitAmountCents: 15990, totalAmountCents: 15990 }],
      warnings: []
    };

    const result = uniqueSalesInvoicesByAccessKey([
      baseInvoice,
      { ...baseInvoice, fields: { ...baseInvoice.fields, invoiceNumber: { value: "1 copia", confidence: 0.9, evidence: null } } },
      { ...baseInvoice, fields: { ...baseInvoice.fields, accessKey: { value: "35260500000000000100550010000000021000000020", confidence: 0.99, evidence: null } } }
    ]);

    expect(result.skippedDuplicateAccessKeys).toBe(1);
    expect(result.invoices).toHaveLength(2);
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

  it("lists documents with operational queue filters", async () => {
    const prisma = {
      salesDocument: { findMany: vi.fn().mockResolvedValue([]), count: vi.fn().mockResolvedValue(0) }
    };

    await listSalesDocuments(prisma as never, admin, {
      status: "PENDING_REVIEW",
      sellerProfileId: "seller-1",
      from: "2026-06-01",
      to: "2026-06-08"
    });

    expect(prisma.salesDocument.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          organizationId: "org-1",
          status: "PENDING_REVIEW",
          sellerProfileId: "seller-1",
          createdAt: expect.objectContaining({ gte: expect.any(Date), lte: expect.any(Date) }),
          sellerProfile: expect.objectContaining({ organizationId: "org-1" })
        })
      })
    );
  });

  it("lists active sellers in the commercial scope", async () => {
    const prisma = {
      sellerProfile: { findMany: vi.fn().mockResolvedValue([{ id: "seller-1", displayName: "Ana", active: true }]) }
    };

    const result = await listSalesSellers(prisma as never, admin);

    expect(result.total).toBe(1);
    expect(prisma.sellerProfile.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ organizationId: "org-1", active: true }),
        include: expect.objectContaining({ salesGroup: true }),
        orderBy: [{ displayName: "asc" }]
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
    expect(result.extraction).toMatchObject({
      provider: "fake-sales",
      model: "test",
      usedAi: true,
      duplicate: false,
      status: "PENDING_REVIEW",
      itemCount: 1,
      warningCount: 0
    });
    expect(prisma.salesDocumentExtraction.create).toHaveBeenCalled();
    expect(prisma.salesItem.createMany).toHaveBeenCalledWith(expect.objectContaining({ data: [expect.objectContaining({ description: "Whey" })] }));
  });

  it("reports missing stored files separately from provider failures", async () => {
    const prisma = {
      salesDocument: {
        findFirst: vi.fn().mockResolvedValue({
          id: "doc-1",
          organizationId: "org-1",
          sellerProfileId: "seller-1",
          fileKey: "missing-file",
          fileName: "danfe.pdf",
          mimeType: "application/pdf",
          status: "UPLOADED",
          sellerProfile: { displayName: "Ana" },
          uploadedBy: {},
          reviewedBy: null,
          items: [],
          extractions: []
        }),
        update: vi.fn().mockResolvedValue({ id: "doc-1", status: "UPLOADED" })
      },
      auditLog: { create: vi.fn().mockResolvedValue({ id: "audit-1" }) }
    };
    const storage = { get: vi.fn().mockRejectedValue(Object.assign(new Error("missing"), { code: "ENOENT" })), put: vi.fn() };
    const provider = { provider: "fake-sales", model: "test", analyze: vi.fn(), analyzeSalesDocument: vi.fn() };

    await expect(analyzeSalesDocumentWithAi(prisma as never, storage, provider, seller, "doc-1")).rejects.toMatchObject({
      code: "STORED_FILE_MISSING"
    });
  });

  it("reprocesses the same document access key without marking itself as duplicate", async () => {
    const accessKey = "35260500000000000100550010000000011000000010";
    const prisma = {
      salesDocument: {
        findFirst: vi
          .fn()
          .mockResolvedValueOnce({
            id: "doc-1",
            organizationId: "org-1",
            sellerProfileId: "seller-1",
            uploadedById: "seller-user-1",
            fileKey: "doc-1.pdf",
            fileName: "danfe.pdf",
            mimeType: "application/pdf",
            size: 3,
            status: "PENDING_REVIEW",
            accessKey,
            sellerProfile: { displayName: "Ana", user: { id: "seller-user-1" } },
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
            accessKey,
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
          accessKey: { value: accessKey, confidence: 0.99, evidence: null },
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

    const result = await analyzeSalesDocumentWithAi(prisma as never, storage, provider, seller, "doc-1", { forceAi: true });

    expect(result.duplicate).toBe(false);
    expect(result.document.status).toBe("PENDING_REVIEW");
    expect(prisma.salesDocument.findFirst).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ where: expect.objectContaining({ accessKey, id: { not: "doc-1" } }) })
    );
    expect(prisma.salesDocument.update).toHaveBeenLastCalledWith(expect.objectContaining({ data: expect.objectContaining({ accessKey, status: "PENDING_REVIEW" }) }));
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
      reviewNote: "Conferido e aceito.",
      totalAmountCents: 15990,
      items: [{ description: "Whey", quantity: 1, totalAmountCents: 15990 }]
    });

    expect(prisma.salesDocument.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: "APPROVED", reviewedById: "admin-1" }) }));
    expect(prisma.salesItem.createMany).toHaveBeenCalled();
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "sales_document.approve",
          entityType: "SalesDocument",
          metadataJson: expect.stringContaining("Conferido e aceito.")
        })
      })
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
        findMany: vi
          .fn()
          .mockResolvedValueOnce([
            {
              sellerProfileId: "seller-1",
              totalAmountCents: 15000,
              quantity: 2,
              sellerProfile: { displayName: "Ana", salesGroup: { name: "Norte" } }
            }
          ])
          .mockResolvedValueOnce([
            {
              salesDocumentId: "doc-1",
              sellerProfileId: "seller-1",
              totalAmountCents: 15000,
              quantity: 2,
              salesDocument: { id: "doc-1", issuedAt: new Date("2026-04-10T00:00:00.000Z") },
              sellerProfile: { displayName: "Ana", salesGroup: { name: "Norte" } }
            }
          ])
      }
    };

    const dashboard = await getSalesDashboard(
      prisma as never,
      admin,
      { from: "2026-04-01", to: "2026-04-30", salesGroupId: "group-1", sellerProfileId: "seller-1" },
      new Date("2026-04-30T00:00:00.000Z")
    );

    expect(dashboard.metrics.totalDocuments).toBe(3);
    expect(dashboard.metrics.totalAmountCents).toBe(15000);
    expect(dashboard.queues.topSellers).toEqual([
      { sellerId: "seller-1", sellerName: "Ana", groupName: "Norte", totalAmountCents: 15000, quantity: 2 }
    ]);
    expect(dashboard.chart).toMatchObject({ bucket: "day", from: "2026-04-01", to: "2026-04-30" });
    expect(dashboard.chart.series.find((item) => item.key === "2026-04-10")).toMatchObject({
      documents: 1,
      quantity: 2,
      totalAmountCents: 15000,
      averageTicketCents: 15000
    });
    expect(prisma.salesItem.findMany).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: expect.objectContaining({
          salesDocument: expect.objectContaining({
            status: "APPROVED",
            sellerProfileId: "seller-1",
            sellerProfile: expect.objectContaining({ salesGroupId: "group-1" })
          })
        })
      })
    );
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
          },
          {
            salesDocumentId: "doc-2",
            sellerProfileId: "seller-2",
            totalAmountCents: 45000,
            quantity: 3,
            sellerProfile: { displayName: "Bruno", salesGroup: { name: "Norte" } }
          },
          {
            salesDocumentId: "doc-3",
            sellerProfileId: "seller-3",
            totalAmountCents: 45000,
            quantity: 1,
            sellerProfile: { displayName: "Carla", salesGroup: { name: "Sul" } }
          },
          {
            salesDocumentId: "doc-4",
            sellerProfileId: "seller-3",
            totalAmountCents: 5000,
            quantity: 1,
            sellerProfile: { displayName: "Carla", salesGroup: { name: "Sul" } }
          }
        ])
      }
    };

    const ranking = await getSalesRanking(prisma as never, admin, {});

    expect(ranking.items).toEqual([
      { position: 1, sellerId: "seller-3", sellerName: "Carla", groupName: "Sul", totalAmountCents: 50000, quantity: 2, documents: 2 },
      { position: 2, sellerId: "seller-2", sellerName: "Bruno", groupName: "Norte", totalAmountCents: 45000, quantity: 3, documents: 1 },
      { position: 3, sellerId: "seller-1", sellerName: "Ana", groupName: "Norte", totalAmountCents: 20000, quantity: 2, documents: 1 }
    ]);
    expect(prisma.salesItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ salesDocument: expect.objectContaining({ status: "APPROVED" }) }) })
    );
  });

  it("builds approved statement consolidations by seller and group", async () => {
    const issuedAt = new Date("2026-06-10T00:00:00.000Z");
    const prisma = {
      salesDocument: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "doc-1",
            sellerProfileId: "seller-1",
            issuedAt,
            totalAmountCents: null,
            sellerProfile: { displayName: "Ana", salesGroup: { id: "group-1", name: "Norte" } },
            items: [
              { quantity: 2, totalAmountCents: 15000 },
              { quantity: 1, totalAmountCents: 5000 }
            ]
          },
          {
            id: "doc-2",
            sellerProfileId: "seller-1",
            issuedAt,
            totalAmountCents: 7000,
            sellerProfile: { displayName: "Ana", salesGroup: { id: "group-1", name: "Norte" } },
            items: [{ quantity: 1, totalAmountCents: 7000 }]
          },
          {
            id: "doc-3",
            sellerProfileId: "seller-2",
            issuedAt,
            totalAmountCents: 12000,
            sellerProfile: { displayName: "Bia", salesGroup: { id: "group-1", name: "Norte" } },
            items: [{ quantity: 3, totalAmountCents: 12000 }]
          },
          {
            id: "doc-4",
            sellerProfileId: "seller-3",
            issuedAt,
            totalAmountCents: 18000,
            sellerProfile: { displayName: "Lia", salesGroup: { id: "group-2", name: "Sul" } },
            items: [{ quantity: 2, totalAmountCents: 18000 }]
          }
        ])
      }
    };

    const statements = await getSalesStatements(prisma as never, admin, { from: "2026-06-01", to: "2026-06-30" });

    expect(prisma.salesDocument.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          organizationId: "org-1",
          status: "APPROVED",
          issuedAt: expect.objectContaining({ gte: expect.any(Date), lte: expect.any(Date) }),
          sellerProfile: expect.objectContaining({ organizationId: "org-1" })
        })
      })
    );
    expect(statements.summary).toEqual({ documents: 4, totalAmountCents: 57000, totalItems: 9 });
    expect(statements.consolidations.bySeller).toEqual([
      { sellerId: "seller-1", sellerName: "Ana", groupId: "group-1", groupName: "Norte", documents: 2, quantity: 4, totalAmountCents: 27000 },
      { sellerId: "seller-3", sellerName: "Lia", groupId: "group-2", groupName: "Sul", documents: 1, quantity: 2, totalAmountCents: 18000 },
      { sellerId: "seller-2", sellerName: "Bia", groupId: "group-1", groupName: "Norte", documents: 1, quantity: 3, totalAmountCents: 12000 }
    ]);
    expect(statements.consolidations.byGroup).toEqual([
      { groupId: "group-1", groupName: "Norte", documents: 3, sellers: 2, quantity: 7, totalAmountCents: 39000 },
      { groupId: "group-2", groupName: "Sul", documents: 1, sellers: 1, quantity: 2, totalAmountCents: 18000 }
    ]);
  });

  it("keeps statement consolidations scoped to the logged seller", async () => {
    const prisma = {
      salesDocument: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "doc-1",
            sellerProfileId: "seller-1",
            issuedAt: new Date("2026-06-10T00:00:00.000Z"),
            totalAmountCents: 15000,
            sellerProfile: { displayName: "Ana", salesGroup: { id: "group-1", name: "Norte" } },
            items: [{ quantity: 2, totalAmountCents: 15000 }]
          }
        ])
      }
    };

    const statements = await getSalesStatements(prisma as never, seller, {});

    expect(prisma.salesDocument.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          organizationId: "org-1",
          status: "APPROVED",
          sellerProfile: expect.objectContaining({ organizationId: "org-1", userId: "seller-user-1" })
        })
      })
    );
    expect(statements.consolidations.bySeller).toEqual([
      { sellerId: "seller-1", sellerName: "Ana", groupId: "group-1", groupName: "Norte", documents: 1, quantity: 2, totalAmountCents: 15000 }
    ]);
    expect(statements.consolidations.byGroup).toEqual([
      { groupId: "group-1", groupName: "Norte", documents: 1, sellers: 1, quantity: 2, totalAmountCents: 15000 }
    ]);
  });

  it("creates campaigns and writes an audit trail", async () => {
    const startsAt = new Date("2026-06-01T00:00:00.000Z");
    const endsAt = new Date("2026-06-30T00:00:00.000Z");
    const prisma = {
      salesGroup: { findFirst: vi.fn().mockResolvedValue({ id: "group-1", organizationId: "org-1" }) },
      salesCampaign: {
        create: vi.fn().mockResolvedValue({
          id: "campaign-1",
          organizationId: "org-1",
          salesGroupId: "group-1",
          name: "Campanha Proteina",
          description: null,
          metric: "totalAmountCents",
          status: "ACTIVE",
          startsAt,
          endsAt,
          salesGroup: { id: "group-1", name: "Norte" }
        })
      },
      auditLog: { create: vi.fn().mockResolvedValue({ id: "audit-1" }) }
    };

    const result = await createSalesCampaign(prisma as never, admin, {
      name: "Campanha Proteina",
      metric: "totalAmountCents",
      startsAt: "2026-06-01",
      endsAt: "2026-06-30",
      salesGroupId: "group-1"
    });

    expect(result.campaign.id).toBe("campaign-1");
    expect(prisma.salesCampaign.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ organizationId: "org-1", salesGroupId: "group-1", status: "ACTIVE" }) })
    );
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: "sales_campaign.create", entityType: "SalesCampaign" }) })
    );
  });

  it("stores ranking snapshots from campaign ranking", async () => {
    const startsAt = new Date("2026-06-01T00:00:00.000Z");
    const endsAt = new Date("2026-06-30T00:00:00.000Z");
    const prisma = {
      salesCampaign: {
        findFirst: vi
          .fn()
          .mockResolvedValueOnce({
            id: "campaign-1",
            organizationId: "org-1",
            salesGroupId: "group-1",
            name: "Campanha Proteina",
            metric: "totalAmountCents",
            status: "ACTIVE",
            startsAt,
            endsAt,
            salesGroup: { id: "group-1", name: "Norte" }
          })
          .mockResolvedValueOnce({
            id: "campaign-1",
            organizationId: "org-1",
            salesGroupId: "group-1",
            name: "Campanha Proteina",
            metric: "totalAmountCents",
            status: "ACTIVE",
            startsAt,
            endsAt
          })
      },
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
      },
      rankingSnapshot: {
        create: vi.fn().mockResolvedValue({ id: "snapshot-1", campaignId: "campaign-1" })
      },
      auditLog: { create: vi.fn().mockResolvedValue({ id: "audit-1" }) }
    };

    const result = await createRankingSnapshot(prisma as never, admin, "campaign-1");

    expect(result.snapshot.id).toBe("snapshot-1");
    expect(prisma.rankingSnapshot.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          organizationId: "org-1",
          campaignId: "campaign-1",
          scopeType: "SALES_GROUP",
          scopeId: "group-1",
          payloadJson: expect.stringContaining("\"sellerName\":\"Ana\"")
        })
      })
    );
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: "sales_ranking.snapshot", entityType: "RankingSnapshot" }) })
    );
  });
});
