import { describe, expect, it, vi } from "vitest";
import type { CurrentUser } from "@alwaystrack/shared";
import { extractDanfeFromText, extractNfeFromXml } from "./danfe-deterministic.js";
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
