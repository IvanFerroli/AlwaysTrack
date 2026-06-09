import { describe, expect, it, vi } from "vitest";
import type { CurrentUser } from "@alwaystrack/shared";
import { createLicense } from "../licenses/licenses.service.js";
import { processNotificationJobs, scanNotificationJobs } from "../notifications/notifications.service.js";
import { FakeNotificationProvider } from "../notifications/provider.js";
import { uploadDocumentWithToken } from "../documents/upload-tokens.service.js";
import { validateDocument } from "../documents/documents.service.js";
import type { StorageProvider } from "../documents/storage.js";
import { getSalesRanking, getSalesStatements, reviewSalesDocument, uploadSalesDocument } from "../sales-documents/sales-documents.service.js";

vi.mock("pdf-parse", () => ({
  PDFParse: class {
    private readonly data: Buffer;

    constructor(input: { data: Buffer }) {
      this.data = input.data;
    }

    async getText() {
      return { text: this.data.toString("utf8") };
    }

    async destroy() {
      return undefined;
    }
  }
}));

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

const professional = {
  id: "pro-1",
  name: "Ana",
  email: "ana@example.com",
  phone: "+550000",
  cpf: "00000000000",
  organizationId: "org-1",
  unitId: "unit-1",
  sectorId: "sector-1",
  responsibleRtId: "rt-1",
  active: true,
  unit: { id: "unit-1", name: "Unidade" },
  sector: { id: "sector-1", name: "Setor" },
  responsibleRt: { id: "rt-1", name: "RT", email: "rt@example.com", role: "RT", phone: "+551111" }
};

const licenseType = {
  id: "type-1",
  name: "COREN",
  defaultWarningDays: "30",
  notificationRules: []
};

const salesGroup = { id: "sales-group-1", name: "Norte", supervisorId: "supervisor-1" };
const sellerProfile = {
  id: "seller-1",
  organizationId: "org-1",
  userId: "seller-user-1",
  displayName: "Ana Comercial",
  active: true,
  salesGroupId: "sales-group-1",
  salesGroup,
  user: { id: "seller-user-1", name: "Ana Comercial", email: "seller@example.com", role: "VENDEDOR" }
};

const sellerUser: CurrentUser = {
  id: "seller-user-1",
  name: "Ana Comercial",
  email: "seller@example.com",
  role: "VENDEDOR",
  organizationId: "org-1",
  unitScopeIds: [],
  sectorScopeIds: []
};

const nfeXml = `<?xml version="1.0" encoding="UTF-8"?>
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

const danfeText = `
RECEBEMOS DE ALWAYS FIT SUPLEMENTOS ALIMENTICIOS LTDA OS PRODUTOS CONSTANTES DA NOTA FISCAL
NF-e
Nº 900.001
Série 3
IDENTIFICAÇÃO DO EMITENTE
ALWAYS FIT SUPLEMENTOS ALIMENTICIOS LTDA
DANFE
CHAVE DE ACESSO
3526 0500 0000 0000 0100 5500 3000 9000 0110 0000 0010
DESTINATÁRIO / REMETENTE
NOME / RAZÃO SOCIAL
CLIENTE PENDENTE LTDA
DATA DA EMISSÃO
06/05/2026
VALOR TOTAL DA NOTA
174,53
DADOS DOS PRODUTOS / SERVIÇOS
CÓDIGO PRODUTO DESCRIÇÃO DO PRODUTO / SERVIÇO NCM/SH O/CST CFOP UN QUANT VALOR UNIT VALOR TOTAL B.CÁLC
HAIR1 FitHair - POTE 21069030 000 6108 1 UNID 3 44,91 134,73 131,58 15,79 12,00
ALW-MAG Metil Magnesio 21069030 000 6108 1 UNID 2 19,90 39,80 39,80 4,77 12,00
DADOS ADICIONAIS
INFORMAÇÕES COMPLEMENTARES
`.repeat(3);

function commercialDocumentView(document: Record<string, unknown>, items: Array<Record<string, unknown>>, extractions: Array<Record<string, unknown>>) {
  return {
    ...document,
    sellerProfile,
    uploadedBy: sellerProfile.user,
    reviewedBy: document.reviewedById ? admin : null,
    items: items.filter((item) => item.salesDocumentId === document.id),
    extractions: extractions.filter((extraction) => extraction.salesDocumentId === document.id).slice(-3).reverse()
  };
}

function matchesApprovedPeriod(document: Record<string, unknown>, where: Record<string, unknown> = {}) {
  if (where.organizationId && document.organizationId !== where.organizationId) return false;
  if (where.status && document.status !== where.status) return false;
  const issuedAt = document.issuedAt instanceof Date ? document.issuedAt : null;
  const range = where.issuedAt as { gte?: Date; lte?: Date } | undefined;
  if (range?.gte && (!issuedAt || issuedAt.getTime() < range.gte.getTime())) return false;
  if (range?.lte && (!issuedAt || issuedAt.getTime() > range.lte.getTime())) return false;
  return true;
}

function createCommercialFlowPrisma() {
  const documents: Array<Record<string, unknown>> = [];
  const items: Array<Record<string, unknown>> = [];
  const extractions: Array<Record<string, unknown>> = [];
  let documentSequence = 0;
  let itemSequence = 0;
  const prisma = {
    sellerProfile: { findFirst: vi.fn().mockResolvedValue(sellerProfile) },
    salesDocument: {
      create: vi.fn().mockImplementation(({ data }) => {
        const document = { id: `sales-doc-${++documentSequence}`, createdAt: new Date("2026-06-04T12:00:00.000Z"), ...data };
        documents.push(document);
        return Promise.resolve(commercialDocumentView(document, items, extractions));
      }),
      findFirst: vi.fn().mockImplementation(({ where, select }) => {
        const document = where?.id
          ? documents.find((candidate) => candidate.id === where.id)
          : documents.find(
              (candidate) =>
                candidate.organizationId === where?.organizationId &&
                candidate.accessKey === where?.accessKey &&
                candidate.id !== where?.id?.not
            );
        if (!document) return Promise.resolve(null);
        return Promise.resolve(select?.id ? { id: document.id } : commercialDocumentView(document, items, extractions));
      }),
      update: vi.fn().mockImplementation(({ where, data }) => {
        const document = documents.find((candidate) => candidate.id === where.id);
        if (!document) throw new Error(`missing sales document ${where.id}`);
        Object.assign(document, data);
        return Promise.resolve(commercialDocumentView(document, items, extractions));
      }),
      findMany: vi.fn().mockImplementation(({ where }) =>
        Promise.resolve(documents.filter((document) => matchesApprovedPeriod(document, where)).map((document) => commercialDocumentView(document, items, extractions)))
      )
    },
    salesDocumentExtraction: {
      create: vi.fn().mockImplementation(({ data }) => {
        const extraction = { id: `sales-extraction-${extractions.length + 1}`, createdAt: new Date("2026-06-04T12:00:00.000Z"), ...data };
        extractions.push(extraction);
        return Promise.resolve(extraction);
      })
    },
    salesItem: {
      deleteMany: vi.fn().mockImplementation(({ where }) => {
        const before = items.length;
        for (let index = items.length - 1; index >= 0; index -= 1) {
          if (items[index].salesDocumentId === where.salesDocumentId) items.splice(index, 1);
        }
        return Promise.resolve({ count: before - items.length });
      }),
      createMany: vi.fn().mockImplementation(({ data }) => {
        for (const item of data) items.push({ id: `sales-item-${++itemSequence}`, ...item });
        return Promise.resolve({ count: data.length });
      }),
      findMany: vi.fn().mockImplementation(({ where }) =>
        Promise.resolve(
          items
            .filter((item) => {
              const document = documents.find((candidate) => candidate.id === item.salesDocumentId);
              return Boolean(document && matchesApprovedPeriod(document, where?.salesDocument));
            })
            .map((item) => ({ ...item, sellerProfile }))
        )
      )
    },
    auditLog: { create: vi.fn().mockResolvedValue({ id: "audit-sales-1" }) },
    $transaction: vi.fn(async (callback) => callback(prisma))
  };
  return { prisma, documents, items, extractions };
}

describe("main operational flow", () => {
  it("covers license status, notification job, public upload and RT validation", async () => {
    const expiresAt = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000);
    const prisma = {
      professional: { findFirst: vi.fn().mockResolvedValue(professional) },
      licenseType: { findFirst: vi.fn().mockResolvedValue(licenseType) },
      license: {
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({
          id: "lic-1",
          professionalId: "pro-1",
          licenseTypeId: "type-1",
          number: "COREN-1",
          status: "PENDING_DOCUMENT",
          expiresAt,
          licenseType,
          documents: []
        }),
        update: vi
          .fn()
          .mockResolvedValueOnce({
            id: "lic-1",
            professionalId: "pro-1",
            licenseTypeId: "type-1",
            number: "COREN-1",
            status: "EXPIRING",
            professional,
            licenseType,
            validatedBy: { id: "admin-1", name: "Admin", email: "admin@example.com", role: "ADMIN" },
            _count: { documents: 0, notificationJobs: 0 }
          })
          .mockResolvedValueOnce({ id: "lic-1", status: "PENDING_VALIDATION" })
          .mockResolvedValueOnce({ id: "lic-1", status: "EXPIRING" }),
        findMany: vi
          .fn()
          .mockResolvedValueOnce([
            {
              id: "lic-1",
              professionalId: "pro-1",
              licenseTypeId: "type-1",
              number: "COREN-1",
              status: "EXPIRING",
              expiresAt,
              licenseType,
              professional
            }
          ])
          .mockResolvedValueOnce([
            {
              id: "lic-1",
              status: "PENDING_VALIDATION",
              expiresAt,
              licenseType,
              documents: [{ status: "APPROVED" }]
            }
          ])
      },
      notificationRule: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "rule-1",
            licenseTypeId: "type-1",
            daysBeforeExpiration: 30,
            repeatAfterExpiredDays: null,
            channel: "WHATSAPP",
            templateKey: "vencimento",
            notifyProfessional: true,
            notifyRt: false,
            licenseType
          }
        ])
      },
      notificationJob: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: "job-1", attempts: 0, maxAttempts: 3, ...data })),
        findMany: vi.fn().mockResolvedValue([
          {
            id: "job-1",
            templateKey: "vencimento",
            recipientPhone: "+550000",
            payloadJson: "{}",
            attempts: 0,
            maxAttempts: 3
          }
        ]),
        update: vi
          .fn()
          .mockResolvedValueOnce({ id: "job-1", attempts: 1, maxAttempts: 3 })
          .mockResolvedValueOnce({ id: "job-1", status: "SENT" })
      },
      notificationTemplate: {
        findFirst: vi.fn().mockResolvedValue({ key: "vencimento", language: "pt_BR", metaTemplateName: "vencimento_tpl" })
      },
      notificationLog: { create: vi.fn().mockResolvedValue({ id: "log-1" }) },
      uploadToken: {
        findUnique: vi.fn().mockResolvedValue({
          id: "tok-1",
          professionalId: "pro-1",
          licenseId: "lic-1",
          active: true,
          usedAt: null,
          expiresAt: new Date("2026-06-30T00:00:00.000Z"),
          professional,
          license: {
            id: "lic-1",
            status: "EXPIRING",
            number: "COREN-1",
            expiresAt,
            licenseType,
            professional
          }
        }),
        update: vi.fn().mockResolvedValue({ id: "tok-1", active: false })
      },
      document: {
        create: vi.fn().mockResolvedValue({ id: "doc-1", professionalId: "pro-1", licenseId: "lic-1", size: 4 }),
        findFirst: vi.fn().mockResolvedValue({
          id: "doc-1",
          status: "UPLOADED",
          professionalId: "pro-1",
          licenseId: "lic-1",
          professional,
          license: { id: "lic-1", status: "PENDING_VALIDATION" }
        }),
        update: vi.fn().mockResolvedValue({
          id: "doc-1",
          status: "APPROVED",
          professionalId: "pro-1",
          licenseId: "lic-1",
          professional,
          license: { id: "lic-1", licenseType },
          validatedBy: { id: "rt-1", name: "RT", email: "rt@example.com", role: "RT" }
        })
      },
      auditLog: { create: vi.fn().mockResolvedValue({ id: "audit-1" }) }
    };
    const storage: StorageProvider = { put: vi.fn().mockResolvedValue(undefined), get: vi.fn() };

    const license = await createLicense(prisma as never, admin, {
      professionalId: "pro-1",
      licenseTypeId: "type-1",
      number: "COREN-1",
      expiresAt
    });
    const scan = await scanNotificationJobs(prisma as never, admin, { today: new Date(expiresAt.getTime() - 30 * 24 * 60 * 60 * 1000) });
    const process = await processNotificationJobs(prisma as never, admin, new FakeNotificationProvider());
    const document = await uploadDocumentWithToken(prisma as never, storage, {
      token: "raw-token",
      fileName: "registro.pdf",
      mimeType: "application/pdf",
      body: Buffer.from("file")
    });
    const validation = await validateDocument(prisma as never, rt, "doc-1", { status: "APPROVED" });

    expect(license.status).toBe("EXPIRING");
    expect(scan.created).toHaveLength(1);
    expect(process.processed[0]).toEqual(expect.objectContaining({ status: "SENT" }));
    expect(document.id).toBe("doc-1");
    expect(validation.status).toBe("APPROVED");
    expect(storage.put).toHaveBeenCalledWith({
      fileKey: "org-1/pro-1/lic-1/tok-1.pdf",
      body: Buffer.from("file"),
      mimeType: "application/pdf"
    });
    expect(prisma.license.update).toHaveBeenLastCalledWith({ where: { id: "lic-1" }, data: { status: "EXPIRING" } });
    expect(prisma.notificationLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ notificationJobId: "job-1", provider: "fake", status: "SENT" }) })
    );
    expect(prisma.auditLog.create.mock.calls.map(([entry]) => entry.data.action)).toEqual([
      "license.create",
      "upload_token.use",
      "document.public_upload",
      "document.approve",
      "license.status_recalculate"
    ]);
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "license.create",
          entityType: "License",
          metadataJson: expect.stringContaining('"status":"EXPIRING"')
        })
      })
    );
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "document.approve",
          entityType: "Document",
          metadataJson: expect.stringContaining('"previousStatus":"UPLOADED"')
        })
      })
    );
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "license.status_recalculate",
          entityType: "License",
          metadataJson: expect.stringContaining('"previousStatus":"PENDING_VALIDATION"')
        })
      })
    );
  });

  it("covers commercial XML and textual PDF DANFE upload through review, ranking and statements without external providers", async () => {
    const { prisma, documents, items, extractions } = createCommercialFlowPrisma();
    const storedFiles = new Map<string, { body: Buffer; mimeType: string }>();
    const storage: StorageProvider = {
      put: vi.fn().mockImplementation(({ fileKey, body, mimeType }) => {
        storedFiles.set(fileKey, { body, mimeType });
        return Promise.resolve();
      }),
      get: vi.fn().mockImplementation((fileKey) => Promise.resolve(storedFiles.get(fileKey)))
    };

    const xmlDocument = await uploadSalesDocument(prisma as never, storage, sellerUser, {
      fileName: "nfe.xml",
      mimeType: "application/xml",
      body: Buffer.from(nfeXml)
    });
    const pdfDocument = await uploadSalesDocument(prisma as never, storage, sellerUser, {
      fileName: "danfe.pdf",
      mimeType: "application/pdf",
      body: Buffer.from(`%PDF-1.7\n${danfeText}`)
    });
    const approval = await reviewSalesDocument(prisma as never, admin, xmlDocument.id, {
      status: "APPROVED",
      accessKey: xmlDocument.accessKey,
      invoiceNumber: xmlDocument.invoiceNumber,
      series: xmlDocument.series,
      issuedAt: "2026-05-05",
      issuerName: xmlDocument.issuerName,
      buyerName: xmlDocument.buyerName,
      totalAmountCents: xmlDocument.totalAmountCents,
      items: xmlDocument.items
    });
    const ranking = await getSalesRanking(prisma as never, admin, { from: "2026-05-01", to: "2026-05-31" });
    const statements = await getSalesStatements(prisma as never, admin, { from: "2026-05-01", to: "2026-05-31" });

    expect(xmlDocument.status).toBe("PENDING_REVIEW");
    expect(pdfDocument.status).toBe("PENDING_REVIEW");
    expect(xmlDocument.accessKey).toBe("31260530417094000240550020007034441402199743");
    expect(pdfDocument.accessKey).toBe("35260500000000000100550030009000011000000010");
    expect(approval.document.status).toBe("APPROVED");
    expect(ranking.items).toEqual([
      { position: 1, sellerId: "seller-1", sellerName: "Ana Comercial", groupName: "Norte", totalAmountCents: 19453, quantity: 5, documents: 1 }
    ]);
    expect(statements.summary).toEqual({ documents: 1, totalAmountCents: 19453, totalItems: 5 });
    expect(statements.items.map((document) => document.id)).toEqual([xmlDocument.id]);
    expect(documents.find((document) => document.id === pdfDocument.id)?.status).toBe("PENDING_REVIEW");
    expect(items.filter((item) => item.salesDocumentId === pdfDocument.id)).toHaveLength(2);
    expect(extractions.map((extraction) => extraction.provider)).toEqual(["deterministic-nfe-xml", "deterministic-pdf-text"]);
    expect(storage.put).toHaveBeenCalledTimes(2);
    expect(prisma.auditLog.create.mock.calls.map(([entry]) => entry.data.action)).toEqual([
      "sales_document.extract",
      "sales_document.upload",
      "sales_document.extract",
      "sales_document.upload",
      "sales_document.approve"
    ]);
  });
});
