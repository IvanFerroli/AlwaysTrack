import { randomUUID } from "node:crypto";
import path from "node:path";
import type { Prisma, PrismaClient } from "@prisma/client";
import type { CurrentUser } from "@alwaystrack/shared";
import { loadEnv } from "../../config/env.js";
import { recordAuditLog } from "../audit/audit.service.js";
import { logEvent } from "../diagnostics/logger.js";
import type { StorageProvider } from "../documents/storage.js";
import type { DocumentAiProvider, SalesDocumentAiResult } from "../document-ai/provider.js";
import { extractDanfeDeterministic } from "./danfe-deterministic.js";

export class SalesDocumentError extends Error {
  constructor(
    public readonly code:
      | "NOT_FOUND"
      | "INVALID_INPUT"
      | "FORBIDDEN"
      | "UNSUPPORTED_TYPE"
      | "FILE_TOO_LARGE"
      | "STORED_FILE_MISSING"
      | "PROVIDER_ERROR"
      | "DUPLICATE"
  ) {
    super(code);
  }
}

export interface SalesDocumentUploadInput {
  sellerProfileId?: string;
  fileName?: string;
  mimeType?: string;
  body?: Buffer;
}

export interface SalesDocumentFilters {
  status?: string;
  sellerProfileId?: string;
  salesGroupId?: string;
}

export interface SalesPeriodFilters extends SalesDocumentFilters {
  campaignId?: string;
  from?: string;
  to?: string;
}

export interface SalesDocumentReviewInput {
  status?: string;
  accessKey?: string | null;
  invoiceNumber?: string | null;
  series?: string | null;
  issuedAt?: string | null;
  issuerName?: string | null;
  buyerName?: string | null;
  totalAmountCents?: number | null;
  rejectionReason?: string | null;
  items?: Array<{
    sku?: string | null;
    description?: string | null;
    category?: string | null;
    quantity?: number | null;
    unitAmountCents?: number | null;
    totalAmountCents?: number | null;
  }>;
}

const allowedMimeTypes = new Set(["application/pdf", "application/xml", "text/xml", "image/jpeg", "image/png", "image/webp"]);

function cleanText(value: unknown) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function safeFileName(fileName: string) {
  return path.basename(fileName).replace(/[^\w.\- ]/g, "_").slice(0, 180) || "danfe";
}

function extensionFor(mimeType: string) {
  if (mimeType === "application/pdf") return ".pdf";
  if (mimeType === "application/xml" || mimeType === "text/xml") return ".xml";
  if (mimeType === "image/jpeg") return ".jpg";
  if (mimeType === "image/png") return ".png";
  if (mimeType === "image/webp") return ".webp";
  return "";
}

function digitsOnly(value: string | number | null | undefined) {
  const digits = String(value ?? "").replace(/\D/g, "");
  return digits.length > 0 ? digits : null;
}

function cleanString(value: string | number | null | undefined) {
  const trimmed = String(value ?? "").trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeDate(value: string | null | undefined) {
  const cleaned = cleanString(value);
  if (!cleaned) return null;
  const iso = cleaned.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const br = cleaned.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (br) return `${br[3]}-${br[2]}-${br[1]}`;
  return null;
}

function dateFromIso(value: string | null) {
  if (!value) return undefined;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function centsFrom(value: number | string | null | undefined) {
  if (typeof value === "number" && Number.isFinite(value)) return Math.round(value);
  const normalized = cleanString(value)?.replace(/\./g, "").replace(",", ".");
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : null;
}

function confidenceFrom(result: SalesDocumentAiResult) {
  const values = Object.values(result.fields)
    .map((field) => field.confidence)
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

function maskedAccessKey(value: string | null | undefined) {
  return value ? `${value.slice(0, 6)}...${value.slice(-6)}` : null;
}

function isMissingStoredFile(error: unknown) {
  return Boolean(error && typeof error === "object" && "code" in error && (error as { code?: unknown }).code === "ENOENT");
}

function hasOperationalMinimum(result: SalesDocumentAiResult) {
  return Boolean(result.fields.accessKey.value && result.fields.invoiceNumber.value && result.fields.totalAmountCents.value && result.items.length > 0);
}

async function tryDeterministicExtraction(input: { body: Buffer; mimeType: string }) {
  try {
    return await extractDanfeDeterministic(input);
  } catch (error) {
    logEvent("warn", "sales_document.extract.deterministic_failed", { mimeType: input.mimeType, size: input.body.length, error });
    return null;
  }
}

function normalizeSalesExtraction(result: SalesDocumentAiResult): SalesDocumentAiResult {
  return {
    ...result,
    fields: {
      accessKey: { ...result.fields.accessKey, value: digitsOnly(result.fields.accessKey.value) },
      invoiceNumber: { ...result.fields.invoiceNumber, value: cleanString(result.fields.invoiceNumber.value) },
      series: { ...result.fields.series, value: cleanString(result.fields.series.value) },
      issuedAt: { ...result.fields.issuedAt, value: normalizeDate(result.fields.issuedAt.value) },
      issuerName: { ...result.fields.issuerName, value: cleanString(result.fields.issuerName.value) },
      buyerName: { ...result.fields.buyerName, value: cleanString(result.fields.buyerName.value) },
      totalAmountCents: { ...result.fields.totalAmountCents, value: centsFrom(result.fields.totalAmountCents.value) }
    },
    items: (result.items ?? [])
      .map((item) => ({
        sku: cleanString(item.sku),
        description: cleanString(item.description),
        category: cleanString(item.category),
        quantity: typeof item.quantity === "number" && Number.isFinite(item.quantity) ? item.quantity : null,
        unitAmountCents: centsFrom(item.unitAmountCents),
        totalAmountCents: centsFrom(item.totalAmountCents)
      }))
      .filter((item) => item.description && item.quantity && item.totalAmountCents),
    warnings: result.warnings ?? []
  };
}

type SalesDocumentForExtraction = Prisma.SalesDocumentGetPayload<{
  include: {
    sellerProfile: { include: { salesGroup: true; user: { select: { id: true; name: true; email: true; role: true } } } };
    uploadedBy: { select: { id: true; name: true; email: true; role: true } };
    reviewedBy: { select: { id: true; name: true; email: true; role: true } };
    items: true;
    extractions: true;
  };
}>;

async function applySalesDocumentExtraction(
  prisma: PrismaClient,
  actor: CurrentUser,
  document: SalesDocumentForExtraction,
  source: { provider: string; model?: string },
  rawResult: SalesDocumentAiResult
) {
  const result = normalizeSalesExtraction(rawResult);
  const accessKey = result.fields.accessKey.value;
  const duplicate = accessKey
    ? await prisma.salesDocument.findFirst({
        where: { organizationId: actor.organizationId, accessKey, id: { not: document.id } },
        select: { id: true }
      })
    : null;

  const extractionConfidence = confidenceFrom(result);
  const data: Prisma.SalesDocumentUpdateInput = {
    status: duplicate ? "DUPLICATE" : hasOperationalMinimum(result) ? "PENDING_REVIEW" : "UPLOADED",
    accessKey: duplicate ? null : accessKey,
    invoiceNumber: result.fields.invoiceNumber.value,
    series: result.fields.series.value,
    issuedAt: dateFromIso(result.fields.issuedAt.value),
    issuerName: result.fields.issuerName.value,
    buyerName: result.fields.buyerName.value,
    totalAmountCents: result.fields.totalAmountCents.value,
    extractionConfidence,
    rejectionReason: duplicate ? "Chave de acesso duplicada." : null
  };

  const updated = await prisma.$transaction(async (tx) => {
    await tx.salesDocumentExtraction.create({
      data: {
        salesDocumentId: document.id,
        provider: source.provider,
        rawText: result.rawText,
        extractedJson: JSON.stringify(result),
        confidence: extractionConfidence
      }
    });
    await tx.salesItem.deleteMany({ where: { salesDocumentId: document.id } });
    if (!duplicate && result.items.length > 0) {
      await tx.salesItem.createMany({
        data: result.items.map((item) => ({
          salesDocumentId: document.id,
          sellerProfileId: document.sellerProfileId,
          sku: item.sku,
          description: item.description ?? "Item sem descricao",
          category: item.category,
          quantity: item.quantity ?? 0,
          unitAmountCents: item.unitAmountCents,
          totalAmountCents: item.totalAmountCents ?? 0
        }))
      });
    }
    return tx.salesDocument.update({
      where: { id: document.id },
      data,
      include: {
        sellerProfile: { include: { salesGroup: true, user: { select: { id: true, name: true, email: true, role: true } } } },
        uploadedBy: { select: { id: true, name: true, email: true, role: true } },
        reviewedBy: { select: { id: true, name: true, email: true, role: true } },
        items: true,
        extractions: { orderBy: { createdAt: "desc" }, take: 1 }
      }
    });
  });

  await recordAuditLog(prisma, {
    organizationId: actor.organizationId,
    actorId: actor.id,
    action: duplicate ? "sales_document.extract_duplicate" : "sales_document.extract",
    entityType: "SalesDocument",
    entityId: document.id,
    metadata: {
      provider: source.provider,
      model: source.model,
      status: updated.status,
      accessKey: maskedAccessKey(accessKey),
      itemCount: updated.items.length,
      warningCount: result.warnings.length
    }
  });

  return { document: updated, result, duplicate: Boolean(duplicate), accessKey };
}

function assertCommercialRole(actor: CurrentUser) {
  if (["ADMIN", "GESTOR", "SAC", "FINANCEIRO", "VENDEDOR", "SUPERVISOR"].includes(actor.role)) return;
  throw new SalesDocumentError("FORBIDDEN");
}

function assertCommercialReviewer(actor: CurrentUser) {
  if (["ADMIN", "GESTOR", "SAC", "FINANCEIRO"].includes(actor.role)) return;
  throw new SalesDocumentError("FORBIDDEN");
}

export function parseSalesDocumentUploadInput(input: {
  query: Record<string, unknown>;
  headers: Record<string, unknown>;
  body: unknown;
}): SalesDocumentUploadInput {
  const mimeType = cleanText(input.headers["content-type"])?.split(";")[0]?.trim().toLowerCase();
  return {
    sellerProfileId: cleanText(input.query.sellerProfileId),
    fileName: cleanText(input.query.fileName) ?? cleanText(input.headers["x-file-name"]),
    mimeType,
    body: Buffer.isBuffer(input.body) ? input.body : undefined
  };
}

export function parseSalesDocumentFilters(query: Record<string, unknown>): SalesDocumentFilters {
  return {
    status: cleanText(query.status),
    sellerProfileId: cleanText(query.sellerProfileId),
    salesGroupId: cleanText(query.salesGroupId)
  };
}

export function parseSalesPeriodFilters(query: Record<string, unknown>): SalesPeriodFilters {
  return {
    ...parseSalesDocumentFilters(query),
    campaignId: cleanText(query.campaignId),
    from: cleanText(query.from),
    to: cleanText(query.to)
  };
}

export function parseSalesDocumentReviewInput(body: unknown): SalesDocumentReviewInput {
  if (!body || typeof body !== "object") return {};
  const input = body as Record<string, unknown>;
  const items = Array.isArray(input.items)
    ? input.items.map((item) => {
        const row = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
        return {
          sku: cleanText(row.sku) ?? null,
          description: cleanText(row.description) ?? null,
          category: cleanText(row.category) ?? null,
          quantity: typeof row.quantity === "number" ? row.quantity : row.quantity ? Number(row.quantity) : null,
          unitAmountCents: typeof row.unitAmountCents === "number" ? row.unitAmountCents : row.unitAmountCents ? Number(row.unitAmountCents) : null,
          totalAmountCents: typeof row.totalAmountCents === "number" ? row.totalAmountCents : row.totalAmountCents ? Number(row.totalAmountCents) : null
        };
      })
    : undefined;

  return {
    status: cleanText(input.status),
    accessKey: cleanText(input.accessKey) ?? null,
    invoiceNumber: cleanText(input.invoiceNumber) ?? null,
    series: cleanText(input.series) ?? null,
    issuedAt: cleanText(input.issuedAt) ?? null,
    issuerName: cleanText(input.issuerName) ?? null,
    buyerName: cleanText(input.buyerName) ?? null,
    totalAmountCents: typeof input.totalAmountCents === "number" ? input.totalAmountCents : input.totalAmountCents ? Number(input.totalAmountCents) : null,
    rejectionReason: cleanText(input.rejectionReason) ?? null,
    items
  };
}

function sellerScopeWhere(actor: CurrentUser): Prisma.SellerProfileWhereInput {
  if (actor.role === "ADMIN" || actor.role === "GESTOR" || actor.role === "SAC" || actor.role === "FINANCEIRO") {
    return { organizationId: actor.organizationId };
  }

  if (actor.role === "VENDEDOR") {
    return { organizationId: actor.organizationId, userId: actor.id };
  }

  if (actor.role === "SUPERVISOR") {
    return { organizationId: actor.organizationId, salesGroup: { supervisorId: actor.id } };
  }

  throw new SalesDocumentError("FORBIDDEN");
}

function salesDocumentWhere(actor: CurrentUser, filters: SalesDocumentFilters = {}): Prisma.SalesDocumentWhereInput {
  return {
    organizationId: actor.organizationId,
    status: filters.status,
    sellerProfileId: filters.sellerProfileId,
    sellerProfile: {
      ...sellerScopeWhere(actor),
      salesGroupId: filters.salesGroupId
    }
  };
}

function periodDocumentWhere(actor: CurrentUser, filters: SalesPeriodFilters = {}): Prisma.SalesDocumentWhereInput {
  const from = dateFromIso(normalizeDate(filters.from));
  const to = dateFromIso(normalizeDate(filters.to));
  return {
    ...salesDocumentWhere(actor, filters),
    status: "APPROVED",
    issuedAt: from || to ? { gte: from, lte: to } : undefined
  };
}

async function getScopedSalesDocument(prisma: PrismaClient, actor: CurrentUser, documentId: string) {
  const document = await prisma.salesDocument.findFirst({
    where: { id: documentId, ...salesDocumentWhere(actor) },
    include: {
      sellerProfile: { include: { salesGroup: true, user: { select: { id: true, name: true, email: true, role: true } } } },
      uploadedBy: { select: { id: true, name: true, email: true, role: true } },
      reviewedBy: { select: { id: true, name: true, email: true, role: true } },
      items: true,
      extractions: { orderBy: { createdAt: "desc" }, take: 3 }
    }
  });
  if (!document) throw new SalesDocumentError("NOT_FOUND");
  return document;
}

async function resolveSellerProfile(prisma: PrismaClient, actor: CurrentUser, sellerProfileId?: string) {
  assertCommercialRole(actor);
  const where: Prisma.SellerProfileWhereInput =
    actor.role === "VENDEDOR"
      ? { organizationId: actor.organizationId, userId: actor.id, active: true }
      : { organizationId: actor.organizationId, id: sellerProfileId, active: true };

  if (actor.role !== "VENDEDOR" && !sellerProfileId) throw new SalesDocumentError("INVALID_INPUT");

  const seller = await prisma.sellerProfile.findFirst({
    where,
    include: { salesGroup: { include: { supervisor: { select: { id: true, name: true, email: true, role: true } } } }, user: true }
  });
  if (!seller) throw new SalesDocumentError("FORBIDDEN");
  return seller;
}

export async function listSalesDocuments(prisma: PrismaClient, actor: CurrentUser, filters: SalesDocumentFilters = {}) {
  assertCommercialRole(actor);
  const where = salesDocumentWhere(actor, filters);
  const [items, total] = await Promise.all([
    prisma.salesDocument.findMany({
      where,
      include: {
        sellerProfile: { include: { salesGroup: true, user: { select: { id: true, name: true, email: true, role: true } } } },
        uploadedBy: { select: { id: true, name: true, email: true, role: true } },
        reviewedBy: { select: { id: true, name: true, email: true, role: true } },
        items: true,
        extractions: { orderBy: { createdAt: "desc" }, take: 1 }
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }]
    }),
    prisma.salesDocument.count({ where })
  ]);
  return { items, total };
}

export async function analyzeSalesDocumentWithAi(
  prisma: PrismaClient,
  storage: StorageProvider,
  provider: DocumentAiProvider,
  actor: CurrentUser,
  documentId: string,
  options: { forceAi?: boolean } = {}
) {
  assertCommercialRole(actor);
  if (!provider.analyzeSalesDocument) throw new SalesDocumentError("PROVIDER_ERROR");

  const document = await getScopedSalesDocument(prisma, actor, documentId);
  if (document.status === "APPROVED" || document.status === "REJECTED") throw new SalesDocumentError("INVALID_INPUT");

  const startedAt = Date.now();
  logEvent("info", "sales_document.extract.start", {
    documentId: document.id,
    sellerProfileId: document.sellerProfileId,
    actorId: actor.id,
    role: actor.role,
    status: document.status,
    provider: provider.provider,
    model: provider.model,
    forceAi: Boolean(options.forceAi),
    mimeType: document.mimeType,
    size: document.size
  });

  await prisma.salesDocument.update({ where: { id: document.id }, data: { status: "EXTRACTING" } });

  try {
    const stored = await storage.get(document.fileKey);
    const deterministic = options.forceAi ? null : await tryDeterministicExtraction({ body: stored.body, mimeType: document.mimeType });
    const deterministicResult = deterministic?.invoices.find(hasOperationalMinimum);
    const deterministicSource = deterministic && deterministicResult ? { provider: deterministic.provider, model: deterministic.model } : null;
    const rawResult =
      deterministicResult ??
      (await provider.analyzeSalesDocument({
        body: stored.body,
        mimeType: document.mimeType,
        fileName: document.fileName
      }));
    const source = deterministicSource ?? { provider: provider.provider, model: provider.model };
    const { document: updated, result, duplicate, accessKey } = await applySalesDocumentExtraction(prisma, actor, document, source, rawResult);

    logEvent("info", deterministicResult ? "sales_document.extract.deterministic_complete" : duplicate ? "sales_document.extract.duplicate" : "sales_document.extract.complete", {
      documentId: document.id,
      sellerProfileId: document.sellerProfileId,
      actorId: actor.id,
      provider: source.provider,
      model: source.model,
      usedAi: !deterministicResult,
      forceAi: Boolean(options.forceAi),
      status: updated.status,
      accessKey: maskedAccessKey(accessKey),
      itemCount: updated.items.length,
      warningCount: result.warnings.length,
      durationMs: Date.now() - startedAt
    });

    return { document: updated, duplicate: Boolean(duplicate), warnings: result.warnings };
  } catch (error) {
    await prisma.salesDocument.update({ where: { id: document.id }, data: { status: document.status } });
    await recordAuditLog(prisma, {
      organizationId: actor.organizationId,
      actorId: actor.id,
      action: "sales_document.extract_failed",
      entityType: "SalesDocument",
      entityId: document.id,
      metadata: { provider: provider.provider, model: provider.model, error: error instanceof Error ? error.message.slice(0, 300) : "PROVIDER_ERROR" }
    });
    logEvent("error", "sales_document.extract.failed", {
      documentId: document.id,
      sellerProfileId: document.sellerProfileId,
      actorId: actor.id,
      provider: provider.provider,
      model: provider.model,
      restoredStatus: document.status,
      durationMs: Date.now() - startedAt,
      error
    });
    throw new SalesDocumentError(isMissingStoredFile(error) ? "STORED_FILE_MISSING" : "PROVIDER_ERROR");
  }
}

export async function uploadSalesDocument(
  prisma: PrismaClient,
  storage: StorageProvider,
  actor: CurrentUser,
  input: SalesDocumentUploadInput
) {
  if (!input.body || input.body.length === 0) throw new SalesDocumentError("INVALID_INPUT");
  if (!input.mimeType || !allowedMimeTypes.has(input.mimeType)) throw new SalesDocumentError("UNSUPPORTED_TYPE");
  if (input.body.length > loadEnv().documentMaxBytes) throw new SalesDocumentError("FILE_TOO_LARGE");

  const seller = await resolveSellerProfile(prisma, actor, input.sellerProfileId);
  const fileName = safeFileName(input.fileName ?? `danfe${extensionFor(input.mimeType)}`);
  const fileKey = `${actor.organizationId}/sales-documents/${seller.id}/${randomUUID()}${extensionFor(input.mimeType)}`;

  logEvent("info", "sales_document.upload.start", {
    actorId: actor.id,
    role: actor.role,
    sellerProfileId: seller.id,
    fileName,
    mimeType: input.mimeType,
    size: input.body.length
  });

  await storage.put({ fileKey, body: input.body, mimeType: input.mimeType });

  const include = {
    sellerProfile: { include: { salesGroup: true, user: { select: { id: true, name: true, email: true, role: true } } } },
    uploadedBy: { select: { id: true, name: true, email: true, role: true } },
    reviewedBy: { select: { id: true, name: true, email: true, role: true } },
    items: true,
    extractions: { orderBy: { createdAt: "desc" as const }, take: 1 }
  };

  const deterministic = await tryDeterministicExtraction({ body: input.body, mimeType: input.mimeType });
  const deterministicInvoices = deterministic?.invoices.filter(hasOperationalMinimum) ?? [];
  const documents = [];

  if (deterministic && deterministicInvoices.length > 0) {
    logEvent("info", "sales_document.upload.deterministic_detected", {
      actorId: actor.id,
      sellerProfileId: seller.id,
      provider: deterministic.provider,
      model: deterministic.model,
      invoiceCount: deterministicInvoices.length,
      textLength: deterministic.textLength,
      usedAi: false
    });

    for (const [index, invoice] of deterministicInvoices.entries()) {
      const created = await prisma.salesDocument.create({
        data: {
          organizationId: actor.organizationId,
          sellerProfileId: seller.id,
          uploadedById: actor.id,
          fileKey,
          fileName,
          mimeType: input.mimeType,
          size: input.body.length,
          status: "EXTRACTING"
        },
        include
      });
      const applied = await applySalesDocumentExtraction(
        prisma,
        actor,
        created,
        { provider: deterministic.provider, model: deterministic.model },
        invoice
      );
      await recordAuditLog(prisma, {
        organizationId: actor.organizationId,
        actorId: actor.id,
        action: "sales_document.upload",
        entityType: "SalesDocument",
        entityId: applied.document.id,
        metadata: { sellerProfileId: seller.id, fileName, mimeType: input.mimeType, size: input.body.length, invoiceIndex: index + 1 }
      });
      documents.push(applied.document);
    }

    logEvent("info", "sales_document.upload.complete", {
      documentId: documents[0]?.id,
      actorId: actor.id,
      sellerProfileId: seller.id,
      fileName,
      mimeType: input.mimeType,
      size: input.body.length,
      status: documents[0]?.status,
      createdDocuments: documents.length,
      extractionMethod: deterministic.provider
    });

    return documents[0];
  }

  const document = await prisma.salesDocument.create({
    data: {
      organizationId: actor.organizationId,
      sellerProfileId: seller.id,
      uploadedById: actor.id,
      fileKey,
      fileName,
      mimeType: input.mimeType,
      size: input.body.length,
      status: "UPLOADED"
    },
    include
  });

  await recordAuditLog(prisma, {
    organizationId: actor.organizationId,
    actorId: actor.id,
    action: "sales_document.upload",
    entityType: "SalesDocument",
    entityId: document.id,
    metadata: { sellerProfileId: seller.id, fileName, mimeType: input.mimeType, size: input.body.length }
  });

  logEvent("info", "sales_document.upload.complete", {
    documentId: document.id,
    actorId: actor.id,
    sellerProfileId: seller.id,
    fileName,
    mimeType: input.mimeType,
    size: input.body.length,
    status: document.status,
    extractionMethod: deterministic ? "deterministic_insufficient" : "none"
  });

  return document;
}

export async function reviewSalesDocument(
  prisma: PrismaClient,
  actor: CurrentUser,
  documentId: string,
  input: SalesDocumentReviewInput
) {
  assertCommercialReviewer(actor);
  const status = input.status === "APPROVED" || input.status === "REJECTED" || input.status === "DUPLICATE" ? input.status : undefined;
  if (!status) throw new SalesDocumentError("INVALID_INPUT");

  const document = await getScopedSalesDocument(prisma, actor, documentId);
  const accessKey = digitsOnly(input.accessKey);
  const startedAt = Date.now();
  logEvent("info", "sales_document.review.start", {
    documentId: document.id,
    actorId: actor.id,
    actorRole: actor.role,
    sellerProfileId: document.sellerProfileId,
    statusBefore: document.status,
    requestedStatus: status,
    itemCount: input.items?.length ?? 0,
    hasAccessKey: Boolean(accessKey)
  });
  if (accessKey && status === "APPROVED") {
    const duplicate = await prisma.salesDocument.findFirst({
      where: { organizationId: actor.organizationId, accessKey, id: { not: document.id } },
      select: { id: true }
    });
    if (duplicate) throw new SalesDocumentError("DUPLICATE");
  }

  const items = (input.items ?? [])
    .map((item) => ({
      sku: cleanString(item.sku),
      description: cleanString(item.description),
      category: cleanString(item.category),
      quantity: typeof item.quantity === "number" && Number.isFinite(item.quantity) ? item.quantity : null,
      unitAmountCents: centsFrom(item.unitAmountCents),
      totalAmountCents: centsFrom(item.totalAmountCents)
    }))
    .filter((item) => item.description && item.quantity !== null && item.totalAmountCents !== null);

  if (status === "APPROVED" && items.length === 0) throw new SalesDocumentError("INVALID_INPUT");

  const updated = await prisma.$transaction(async (tx) => {
    await tx.salesItem.deleteMany({ where: { salesDocumentId: document.id } });
    if (status === "APPROVED") {
      await tx.salesItem.createMany({
        data: items.map((item) => ({
          salesDocumentId: document.id,
          sellerProfileId: document.sellerProfileId,
          sku: item.sku,
          description: item.description ?? "Item sem descricao",
          category: item.category,
          quantity: item.quantity ?? 0,
          unitAmountCents: item.unitAmountCents,
          totalAmountCents: item.totalAmountCents ?? 0
        }))
      });
    }
    return tx.salesDocument.update({
      where: { id: document.id },
      data: {
        status,
        accessKey,
        invoiceNumber: cleanString(input.invoiceNumber),
        series: cleanString(input.series),
        issuedAt: dateFromIso(normalizeDate(input.issuedAt)),
        issuerName: cleanString(input.issuerName),
        buyerName: cleanString(input.buyerName),
        totalAmountCents: centsFrom(input.totalAmountCents),
        rejectionReason: status === "APPROVED" ? null : cleanString(input.rejectionReason),
        reviewedById: actor.id,
        reviewedAt: new Date()
      },
      include: {
        sellerProfile: { include: { salesGroup: true, user: { select: { id: true, name: true, email: true, role: true } } } },
        uploadedBy: { select: { id: true, name: true, email: true, role: true } },
        reviewedBy: { select: { id: true, name: true, email: true, role: true } },
        items: true,
        extractions: { orderBy: { createdAt: "desc" }, take: 1 }
      }
    });
  });

  await recordAuditLog(prisma, {
    organizationId: actor.organizationId,
    actorId: actor.id,
    action: status === "APPROVED" ? "sales_document.approve" : "sales_document.reject",
    entityType: "SalesDocument",
    entityId: document.id,
    metadata: { status, itemCount: updated.items.length }
  });

  logEvent("info", "sales_document.review.complete", {
    documentId: document.id,
    actorId: actor.id,
    actorRole: actor.role,
    sellerProfileId: document.sellerProfileId,
    statusBefore: document.status,
    statusAfter: updated.status,
    itemCount: updated.items.length,
    durationMs: Date.now() - startedAt
  });

  return { document: updated };
}

export async function listSalesCampaigns(prisma: PrismaClient, actor: CurrentUser) {
  assertCommercialRole(actor);
  const campaigns = await prisma.salesCampaign.findMany({
    where: {
      organizationId: actor.organizationId,
      salesGroup: actor.role === "SUPERVISOR" ? { supervisorId: actor.id } : undefined
    },
    include: { salesGroup: true },
    orderBy: [{ status: "asc" }, { startsAt: "desc" }]
  });
  return { items: campaigns, total: campaigns.length };
}

export async function getSalesRanking(prisma: PrismaClient, actor: CurrentUser, filters: SalesPeriodFilters = {}) {
  assertCommercialRole(actor);
  const campaign = filters.campaignId
    ? await prisma.salesCampaign.findFirst({ where: { id: filters.campaignId, organizationId: actor.organizationId } })
    : null;
  const periodFilters = {
    ...filters,
    from: filters.from ?? campaign?.startsAt.toISOString().slice(0, 10),
    to: filters.to ?? campaign?.endsAt.toISOString().slice(0, 10),
    salesGroupId: filters.salesGroupId ?? campaign?.salesGroupId ?? undefined
  };

  const items = await prisma.salesItem.findMany({
    where: { salesDocument: periodDocumentWhere(actor, periodFilters) },
    include: { sellerProfile: { include: { salesGroup: true } } }
  });

  const bySeller = new Map<
    string,
    { sellerId: string; sellerName: string; groupName: string | null; totalAmountCents: number; quantity: number; documents: Set<string> }
  >();
  for (const item of items) {
    const current =
      bySeller.get(item.sellerProfileId) ??
      {
        sellerId: item.sellerProfileId,
        sellerName: item.sellerProfile.displayName,
        groupName: item.sellerProfile.salesGroup?.name ?? null,
        totalAmountCents: 0,
        quantity: 0,
        documents: new Set<string>()
      };
    current.totalAmountCents += item.totalAmountCents;
    current.quantity += item.quantity;
    current.documents.add(item.salesDocumentId);
    bySeller.set(item.sellerProfileId, current);
  }

  const ranking = [...bySeller.values()]
    .sort((a, b) => b.totalAmountCents - a.totalAmountCents)
    .map((row, index) => ({ ...row, documents: row.documents.size, position: index + 1 }));

  return { campaign, items: ranking, total: ranking.length };
}

export async function getSalesStatements(prisma: PrismaClient, actor: CurrentUser, filters: SalesPeriodFilters = {}) {
  assertCommercialRole(actor);
  const documents = await prisma.salesDocument.findMany({
    where: periodDocumentWhere(actor, filters),
    include: { sellerProfile: { include: { salesGroup: true } }, items: true },
    orderBy: [{ issuedAt: "desc" }, { createdAt: "desc" }]
  });

  const totalAmountCents = documents.reduce(
    (sum, document) => sum + (document.totalAmountCents ?? document.items.reduce((itemSum, item) => itemSum + item.totalAmountCents, 0)),
    0
  );
  const totalItems = documents.reduce((sum, document) => sum + document.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);

  return {
    filters,
    summary: { documents: documents.length, totalAmountCents, totalItems },
    items: documents
  };
}

export function salesStatementsCsv(statement: Awaited<ReturnType<typeof getSalesStatements>>) {
  const header = ["data", "vendedor", "grupo", "nota", "serie", "emitente", "comprador", "produto", "quantidade", "total_centavos"];
  const rows = statement.items.flatMap((document) =>
    document.items.map((item) => [
      document.issuedAt?.toISOString().slice(0, 10) ?? "",
      document.sellerProfile.displayName,
      document.sellerProfile.salesGroup?.name ?? "",
      document.invoiceNumber ?? "",
      document.series ?? "",
      document.issuerName ?? "",
      document.buyerName ?? "",
      item.description,
      String(item.quantity),
      String(item.totalAmountCents)
    ])
  );
  return [header, ...rows].map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")).join("\n");
}

export async function getSalesDashboard(prisma: PrismaClient, actor: CurrentUser) {
  assertCommercialRole(actor);
  const documentWhere = salesDocumentWhere(actor);
  const approvedWhere = { ...documentWhere, status: "APPROVED" };

  const [totalDocuments, pendingDocuments, approvedDocuments, rejectedDocuments, sellers, approvedItems, pendingQueue] =
    await Promise.all([
      prisma.salesDocument.count({ where: documentWhere }),
      prisma.salesDocument.count({ where: { ...documentWhere, status: { in: ["UPLOADED", "EXTRACTING", "PENDING_REVIEW"] } } }),
      prisma.salesDocument.count({ where: approvedWhere }),
      prisma.salesDocument.count({ where: { ...documentWhere, status: { in: ["REJECTED", "DUPLICATE"] } } }),
      prisma.sellerProfile.findMany({ where: sellerScopeWhere(actor), include: { salesGroup: true } }),
      prisma.salesItem.findMany({
        where: { salesDocument: approvedWhere },
        include: { sellerProfile: { include: { salesGroup: true } } }
      }),
      prisma.salesDocument.findMany({
        where: { ...documentWhere, status: { in: ["UPLOADED", "EXTRACTING", "PENDING_REVIEW"] } },
        include: { sellerProfile: { include: { salesGroup: true } } },
        orderBy: { createdAt: "desc" },
        take: 10
      })
    ]);

  const sellerTotals = new Map<string, { sellerId: string; sellerName: string; groupName: string | null; totalAmountCents: number; quantity: number }>();
  const groupTotals = new Map<string, { groupName: string; totalAmountCents: number; quantity: number }>();
  for (const item of approvedItems) {
    const sellerTotal =
      sellerTotals.get(item.sellerProfileId) ??
      {
        sellerId: item.sellerProfileId,
        sellerName: item.sellerProfile.displayName,
        groupName: item.sellerProfile.salesGroup?.name ?? null,
        totalAmountCents: 0,
        quantity: 0
      };
    sellerTotal.totalAmountCents += item.totalAmountCents;
    sellerTotal.quantity += item.quantity;
    sellerTotals.set(item.sellerProfileId, sellerTotal);

    const groupName = item.sellerProfile.salesGroup?.name ?? "Sem grupo";
    const groupTotal = groupTotals.get(groupName) ?? { groupName, totalAmountCents: 0, quantity: 0 };
    groupTotal.totalAmountCents += item.totalAmountCents;
    groupTotal.quantity += item.quantity;
    groupTotals.set(groupName, groupTotal);
  }

  return {
    metrics: {
      totalDocuments,
      pendingDocuments,
      approvedDocuments,
      rejectedDocuments,
      activeSellers: sellers.filter((seller) => seller.active).length,
      totalAmountCents: [...sellerTotals.values()].reduce((sum, item) => sum + item.totalAmountCents, 0)
    },
    queues: {
      pendingDocuments: pendingQueue,
      topSellers: [...sellerTotals.values()].sort((a, b) => b.totalAmountCents - a.totalAmountCents).slice(0, 10),
      groups: [...groupTotals.values()].sort((a, b) => b.totalAmountCents - a.totalAmountCents)
    }
  };
}
