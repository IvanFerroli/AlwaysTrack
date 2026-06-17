import { randomUUID } from "node:crypto";
import path from "node:path";
import type { Prisma, PrismaClient } from "@prisma/client";
import type { CurrentUser } from "@alwaystrack/shared";
import { loadEnv } from "../../config/env.js";
import { recordAuditLog } from "../audit/audit.service.js";
import { logEvent } from "../diagnostics/logger.js";
import { emitInAppNotifications } from "../notifications/notifications.service.js";
import type { StorageProvider } from "../documents/storage.js";
import { extensionForAllowedFileKind, FileValidationError, validateAllowedFile } from "../documents/file-validation.js";
import type { DocumentAiProvider, SalesDocumentAiResult } from "../document-ai/provider.js";
import { extractDanfeDeterministic } from "./danfe-deterministic.js";

/** Domain error surfaced by DANFE upload, extraction, review and ranking flows. */
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

/** File payload accepted by the commercial DANFE upload service. */
export interface SalesDocumentUploadInput {
  sellerProfileId?: string;
  fileName?: string;
  mimeType?: string;
  body?: Buffer;
}

/** Common filters used by notes, ranking and statements queries. */
export interface SalesDocumentFilters {
  status?: string;
  sellerProfileId?: string;
  salesGroupId?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

export interface SalesPeriodFilters extends SalesDocumentFilters {
  campaignId?: string;
  from?: string;
  to?: string;
  bucket?: string;
}

export interface SalesCampaignInput {
  name?: string;
  description?: string | null;
  metric?: string;
  status?: string;
  startsAt?: string;
  endsAt?: string;
  salesGroupId?: string | null;
}

/** Mutable review payload used when an operator approves, rejects or corrects a DANFE. */
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
  reviewNote?: string | null;
  items?: Array<{
    sku?: string | null;
    description?: string | null;
    category?: string | null;
    quantity?: number | null;
    unitAmountCents?: number | null;
    totalAmountCents?: number | null;
  }>;
}

export interface SalesDocumentManualCorrectionInput extends SalesDocumentReviewInput {
  correctionNote?: string | null;
}

const allowedFileKinds = new Set(["pdf", "xml", "jpeg", "png", "webp"] as const);

function cleanText(value: unknown) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function cleanPositiveInteger(value: unknown) {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number.parseInt(value, 10) : Number.NaN;
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function paginationFor(input: { page?: number; pageSize?: number }) {
  if (!input.page && !input.pageSize) return {};
  const page = input.page ?? 1;
  const pageSize = Math.min(Math.max(input.pageSize ?? 25, 1), 100);
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
}

function safeFileName(fileName: string) {
  return path.basename(fileName).replace(/[^\w.\- ]/g, "_").slice(0, 180) || "danfe";
}

function validateSalesDocumentFile(input: { body: Buffer; mimeType: string }) {
  try {
    return validateAllowedFile({
      body: input.body,
      mimeType: input.mimeType,
      allowedKinds: allowedFileKinds,
      configuredMaxBytes: loadEnv().documentMaxBytes
    });
  } catch (error) {
    if (error instanceof FileValidationError) {
      logEvent("warn", "sales_document.upload.rejected", {
        reason: error.code,
        mimeType: input.mimeType,
        size: input.body.length
      });
      throw new SalesDocumentError(error.code);
    }
    throw error;
  }
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

function parseRequiredDate(value: string | null | undefined) {
  return dateFromIso(normalizeDate(value));
}

function centsFrom(value: number | string | null | undefined) {
  if (typeof value === "number" && Number.isFinite(value)) return Math.round(value);
  const normalized = cleanString(value)?.replace(/\./g, "").replace(",", ".");
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : null;
}

function presentIds(values: Array<string | null | undefined>) {
  return values.filter((value): value is string => typeof value === "string" && value.length > 0);
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

function safeJson(value: string | null | undefined): Record<string, unknown> {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function extractedAccessKeyFromJson(value: string | null | undefined) {
  const parsed = safeJson(value);
  const fields = parsed.fields && typeof parsed.fields === "object" ? (parsed.fields as Record<string, unknown>) : {};
  const accessKeyField = fields.accessKey && typeof fields.accessKey === "object" ? (fields.accessKey as Record<string, unknown>) : {};
  const accessKey = accessKeyField.value;
  return typeof accessKey === "string" && accessKey.trim() ? accessKey.trim() : null;
}

function extractedFieldsFromJson(value: string | null | undefined) {
  const parsed = safeJson(value);
  const fields = parsed.fields && typeof parsed.fields === "object" ? (parsed.fields as Record<string, unknown>) : {};
  return Object.fromEntries(
    Object.entries(fields).map(([key, field]) => {
      const row = field && typeof field === "object" ? (field as Record<string, unknown>) : {};
      return [key, { value: row.value ?? null, confidence: row.confidence ?? null }];
    })
  );
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

export function uniqueSalesInvoicesByAccessKey(invoices: SalesDocumentAiResult[]) {
  const seen = new Set<string>();
  const unique: SalesDocumentAiResult[] = [];
  let skippedDuplicateAccessKeys = 0;

  for (const invoice of invoices) {
    const accessKey = digitsOnly(invoice.fields.accessKey.value);
    if (accessKey && seen.has(accessKey)) {
      skippedDuplicateAccessKeys += 1;
      continue;
    }
    if (accessKey) seen.add(accessKey);
    unique.push(invoice);
  }

  return { invoices: unique, skippedDuplicateAccessKeys };
}

function extractionSummary(result: SalesDocumentAiResult, source: { provider: string; model?: string }, input: { duplicate: boolean; accessKey: string | null; usedAi: boolean }) {
  return {
    provider: source.provider,
    model: source.model,
    usedAi: input.usedAi,
    duplicate: input.duplicate,
    status: undefined as string | undefined,
    accessKey: maskedAccessKey(input.accessKey),
    itemCount: result.items.length,
    warningCount: result.warnings.length,
    warnings: result.warnings
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

function assertCampaignManager(actor: CurrentUser) {
  if (["ADMIN", "GESTOR", "SUPERVISOR"].includes(actor.role)) return;
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
    salesGroupId: cleanText(query.salesGroupId),
    from: cleanText(query.from),
    to: cleanText(query.to),
    page: cleanPositiveInteger(query.page),
    pageSize: cleanPositiveInteger(query.pageSize)
  };
}

export function parseSalesPeriodFilters(query: Record<string, unknown>): SalesPeriodFilters {
  return {
    ...parseSalesDocumentFilters(query),
    campaignId: cleanText(query.campaignId),
    from: cleanText(query.from),
    to: cleanText(query.to),
    bucket: cleanText(query.bucket)
  };
}

export function parseSalesCampaignInput(body: unknown): SalesCampaignInput {
  if (!body || typeof body !== "object") return {};
  const input = body as Record<string, unknown>;
  return {
    name: cleanText(input.name),
    description: cleanText(input.description) ?? null,
    metric: cleanText(input.metric),
    status: cleanText(input.status),
    startsAt: cleanText(input.startsAt),
    endsAt: cleanText(input.endsAt),
    salesGroupId: cleanText(input.salesGroupId) ?? null
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
    reviewNote: cleanText(input.reviewNote) ?? null,
    items
  };
}

export function parseSalesDocumentManualCorrectionInput(body: unknown): SalesDocumentManualCorrectionInput {
  const input = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  return {
    ...parseSalesDocumentReviewInput(body),
    correctionNote: cleanText(input.correctionNote) ?? cleanText(input.reviewNote) ?? null
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
  const from = dateFromIso(normalizeDate(filters.from));
  const to = dateFromIso(normalizeDate(filters.to));
  if (to) to.setUTCHours(23, 59, 59, 999);
  return {
    organizationId: actor.organizationId,
    status: filters.status,
    createdAt: from || to ? { gte: from, lte: to } : undefined,
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
  const baseFilters: SalesDocumentFilters = {
    status: filters.status,
    sellerProfileId: filters.sellerProfileId,
    salesGroupId: filters.salesGroupId
  };
  return {
    ...salesDocumentWhere(actor, baseFilters),
    status: "APPROVED",
    issuedAt: from || to ? { gte: from, lte: to } : undefined
  };
}

function startOfUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function addUtcDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function startOfUtcMonth(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function startOfUtcWeek(date: Date) {
  const start = startOfUtcDay(date);
  const day = start.getUTCDay();
  const offset = day === 0 ? -6 : 1 - day;
  return addUtcDays(start, offset);
}

function chartBucketForRange(from: Date, to: Date, requested?: string) {
  if (requested === "day" || requested === "week" || requested === "month") return requested;
  const spanDays = Math.max(1, Math.ceil((startOfUtcDay(to).getTime() - startOfUtcDay(from).getTime()) / 86_400_000) + 1);
  if (spanDays > 120) return "month";
  if (spanDays > 45) return "week";
  return "day";
}

function chartBucketStart(date: Date, bucket: "day" | "week" | "month") {
  if (bucket === "month") return startOfUtcMonth(date);
  if (bucket === "week") return startOfUtcWeek(date);
  return startOfUtcDay(date);
}

function addChartBucket(date: Date, bucket: "day" | "week" | "month") {
  if (bucket === "month") {
    const next = new Date(date);
    next.setUTCMonth(next.getUTCMonth() + 1, 1);
    return next;
  }
  return addUtcDays(date, bucket === "week" ? 7 : 1);
}

function chartBucketLabel(date: Date, bucket: "day" | "week" | "month") {
  const iso = date.toISOString().slice(0, 10);
  if (bucket === "month") return iso.slice(0, 7);
  return iso;
}

function dashboardChartRange(filters: SalesPeriodFilters, today = new Date()) {
  const to = startOfUtcDay(dateFromIso(normalizeDate(filters.to)) ?? today);
  const from = startOfUtcDay(dateFromIso(normalizeDate(filters.from)) ?? addUtcDays(to, -29));
  if (from.getTime() > to.getTime()) throw new SalesDocumentError("INVALID_INPUT");
  return { from, to };
}

function dateFromCampaignInput(value: string | undefined) {
  const date = dateFromIso(normalizeDate(value));
  if (!date) throw new SalesDocumentError("INVALID_INPUT");
  return date;
}

async function assertCampaignGroupScope(prisma: PrismaClient, actor: CurrentUser, salesGroupId: string | null | undefined) {
  if (!salesGroupId) {
    if (actor.role === "SUPERVISOR") throw new SalesDocumentError("INVALID_INPUT");
    return null;
  }

  const salesGroup = await prisma.salesGroup.findFirst({
    where: {
      id: salesGroupId,
      organizationId: actor.organizationId,
      supervisorId: actor.role === "SUPERVISOR" ? actor.id : undefined
    }
  });
  if (!salesGroup) throw new SalesDocumentError("FORBIDDEN");
  return salesGroup;
}

async function getScopedCampaign(prisma: PrismaClient, actor: CurrentUser, campaignId: string) {
  const campaign = await prisma.salesCampaign.findFirst({
    where: {
      id: campaignId,
      organizationId: actor.organizationId,
      salesGroup: actor.role === "SUPERVISOR" ? { supervisorId: actor.id } : undefined
    },
    include: { salesGroup: true }
  });
  if (!campaign) throw new SalesDocumentError("NOT_FOUND");
  return campaign;
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
  const pagination = paginationFor(filters);
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
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      skip: pagination.skip,
      take: pagination.take
    }),
    prisma.salesDocument.count({ where })
  ]);
  return { items, total, page: pagination.page ?? 1, pageSize: pagination.pageSize ?? items.length };
}

export async function listSalesSellers(prisma: PrismaClient, actor: CurrentUser) {
  assertCommercialRole(actor);
  const items = await prisma.sellerProfile.findMany({
    where: { ...sellerScopeWhere(actor), active: true },
    include: { salesGroup: true, user: { select: { id: true, name: true, email: true, role: true } } },
    orderBy: [{ displayName: "asc" }]
  });
  return { items, total: items.length };
}

export async function getSalesDocumentTimeline(prisma: PrismaClient, actor: CurrentUser, documentId: string) {
  assertCommercialRole(actor);
  const document = await getScopedSalesDocument(prisma, actor, documentId);
  const auditLogs = await prisma.auditLog.findMany({
    where: { organizationId: actor.organizationId, entityType: "SalesDocument", entityId: document.id },
    include: { actor: { select: { id: true, name: true, email: true, role: true } } },
    orderBy: { createdAt: "asc" }
  });

  const events: Array<{
    id: string;
    at: Date;
    type: string;
    title: string;
    detail: string;
    actor: { id: string; name: string; email: string; role: string } | null;
    status?: string | null;
    metadata?: Record<string, unknown>;
  }> = [
    {
      id: `${document.id}:created`,
      at: document.createdAt,
      type: "upload",
      title: "DANFE enviada",
      detail: `${document.fileName} enviada para ${document.sellerProfile.displayName}.`,
      actor: document.uploadedBy,
      status: "UPLOADED",
      metadata: { fileName: document.fileName, mimeType: document.mimeType, size: document.size }
    }
  ];

  for (const extraction of [...document.extractions].reverse()) {
    events.push({
      id: extraction.id,
      at: extraction.createdAt,
      type: "extraction",
      title: "Dados extraidos",
      detail: `Provider ${extraction.provider}${extraction.confidence !== null ? ` com ${Math.round(extraction.confidence * 100)}% de confianca` : ""}.`,
      actor: null,
      status: document.status,
      metadata: { provider: extraction.provider, confidence: extraction.confidence }
    });
  }

  for (const log of auditLogs) {
    const metadata = safeJson(log.metadataJson);
    const status = typeof metadata.status === "string" ? metadata.status : undefined;
    const reviewNote = typeof metadata.reviewNote === "string" ? metadata.reviewNote : undefined;
    const rejectionReason = typeof metadata.rejectionReason === "string" ? metadata.rejectionReason : undefined;
    const actionMap: Record<string, { type: string; title: string; detail: string }> = {
      "sales_document.upload": { type: "upload", title: "Upload registrado", detail: "Arquivo salvo e auditado." },
      "sales_document.extract": { type: "extraction", title: "Extracao registrada", detail: "Campos e itens foram estruturados para revisao." },
      "sales_document.extract_duplicate": { type: "duplicate", title: "Duplicidade detectada", detail: "Chave de acesso ja existia em outra nota." },
      "sales_document.extract_failed": { type: "error", title: "Falha na extracao", detail: String(metadata.error ?? "Erro registrado durante a extracao.") },
      "sales_document.approve": {
        type: "review",
        title: "Nota aprovada",
        detail: reviewNote ? `Comentario: ${reviewNote}` : "Nota liberada para ranking, campanhas e extratos."
      },
      "sales_document.reject": {
        type: "review",
        title: status === "DUPLICATE" ? "Nota marcada como duplicada" : "Nota rejeitada",
        detail: rejectionReason ?? reviewNote ?? "Nota nao entrou no ranking."
      }
    };
    const mapped = actionMap[log.action] ?? { type: "audit", title: log.action, detail: "Evento de auditoria relacionado." };
    events.push({
      id: log.id,
      at: log.createdAt,
      type: mapped.type,
      title: mapped.title,
      detail: mapped.detail,
      actor: log.actor,
      status,
      metadata
    });
  }

  if (document.reviewedAt && document.reviewedBy) {
    events.push({
      id: `${document.id}:reviewed`,
      at: document.reviewedAt,
      type: "review",
      title: document.status === "APPROVED" ? "Impacto comercial liberado" : "Decisao final registrada",
      detail:
        document.status === "APPROVED"
          ? "Nota aprovada passa a compor ranking, campanhas ativas e extratos."
          : document.rejectionReason ?? "Nota ficou fora do ranking e dos extratos.",
      actor: document.reviewedBy,
      status: document.status,
      metadata: { invoiceNumber: document.invoiceNumber, totalAmountCents: document.totalAmountCents, itemCount: document.items.length }
    });
  }

  return {
    document: {
      id: document.id,
      fileName: document.fileName,
      status: document.status,
      invoiceNumber: document.invoiceNumber,
      accessKey: document.accessKey,
      issuedAt: document.issuedAt,
      totalAmountCents: document.totalAmountCents,
      sellerProfile: document.sellerProfile
    },
    events: events
      .sort((left, right) => left.at.getTime() - right.at.getTime())
      .map((event) => ({ ...event, at: event.at.toISOString() })),
    total: events.length
  };
}

export async function getSalesDocumentDiagnostics(prisma: PrismaClient, actor: CurrentUser, documentId: string) {
  assertCommercialRole(actor);
  const document = await getScopedSalesDocument(prisma, actor, documentId);
  const latestExtraction = document.extractions[0] ?? null;
  const extractedAccessKey = extractedAccessKeyFromJson(latestExtraction?.extractedJson);
  const accessKey = document.accessKey ?? extractedAccessKey;
  const [duplicateCandidates, extractionFailures] = await Promise.all([
    accessKey
      ? prisma.salesDocument.findMany({
          where: { organizationId: actor.organizationId, accessKey, id: { not: document.id } },
          include: { sellerProfile: { include: { salesGroup: true } } },
          orderBy: { createdAt: "desc" },
          take: 5
        })
      : Promise.resolve([]),
    prisma.auditLog.findMany({
      where: { organizationId: actor.organizationId, entityType: "SalesDocument", entityId: document.id, action: "sales_document.extract_failed" },
      include: { actor: { select: { id: true, name: true, email: true, role: true } } },
      orderBy: { createdAt: "desc" },
      take: 5
    })
  ]);

  const operationalStatus =
    extractionFailures.length > 0
      ? "EXTRACTION_FAILED"
      : document.status === "DUPLICATE" || duplicateCandidates.length > 0
        ? "DUPLICATE_REVIEW"
        : latestExtraction
          ? "EXTRACTED"
          : "WAITING_EXTRACTION";

  return {
    document: {
      id: document.id,
      fileName: document.fileName,
      mimeType: document.mimeType,
      size: document.size,
      status: document.status,
      accessKey: document.accessKey,
      invoiceNumber: document.invoiceNumber,
      series: document.series,
      issuedAt: document.issuedAt,
      issuerName: document.issuerName,
      buyerName: document.buyerName,
      totalAmountCents: document.totalAmountCents,
      rejectionReason: document.rejectionReason,
      createdAt: document.createdAt,
      reviewedAt: document.reviewedAt,
      sellerProfile: document.sellerProfile,
      uploadedBy: document.uploadedBy,
      reviewedBy: document.reviewedBy
    },
    operationalStatus,
    extraction: latestExtraction
      ? {
          id: latestExtraction.id,
          provider: latestExtraction.provider,
          confidence: latestExtraction.confidence,
          createdAt: latestExtraction.createdAt,
          fields: extractedFieldsFromJson(latestExtraction.extractedJson),
          accessKey: extractedAccessKey,
          rawTextAvailable: Boolean(latestExtraction.rawText)
        }
      : null,
    currentItems: document.items,
    duplicateCandidates: duplicateCandidates.map((candidate) => ({
      id: candidate.id,
      fileName: candidate.fileName,
      status: candidate.status,
      invoiceNumber: candidate.invoiceNumber,
      issuedAt: candidate.issuedAt,
      createdAt: candidate.createdAt,
      sellerProfile: candidate.sellerProfile
    })),
    extractionFailures: extractionFailures.map((failure) => ({
      id: failure.id,
      createdAt: failure.createdAt,
      actor: failure.actor,
      metadata: safeJson(failure.metadataJson),
      message: String(safeJson(failure.metadataJson).error ?? "Falha registrada durante extracao.")
    }))
  };
}

export async function correctSalesDocumentManually(
  prisma: PrismaClient,
  actor: CurrentUser,
  documentId: string,
  input: SalesDocumentManualCorrectionInput
) {
  assertCommercialReviewer(actor);
  const correctionNote = cleanString(input.correctionNote) ?? cleanString(input.reviewNote);
  if (!correctionNote) throw new SalesDocumentError("INVALID_INPUT");

  const document = await getScopedSalesDocument(prisma, actor, documentId);
  if (document.status === "APPROVED") throw new SalesDocumentError("INVALID_INPUT");
  const accessKey = digitsOnly(input.accessKey);
  if (accessKey) {
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

  const before = {
    status: document.status,
    accessKey: document.accessKey,
    invoiceNumber: document.invoiceNumber,
    series: document.series,
    issuedAt: document.issuedAt?.toISOString() ?? null,
    issuerName: document.issuerName,
    buyerName: document.buyerName,
    totalAmountCents: document.totalAmountCents,
    itemCount: document.items.length
  };

  const updated = await prisma.$transaction(async (tx) => {
    await tx.salesItem.deleteMany({ where: { salesDocumentId: document.id } });
    if (items.length > 0) {
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
        status: "PENDING_REVIEW",
        accessKey,
        invoiceNumber: cleanString(input.invoiceNumber),
        series: cleanString(input.series),
        issuedAt: dateFromIso(normalizeDate(input.issuedAt)),
        issuerName: cleanString(input.issuerName),
        buyerName: cleanString(input.buyerName),
        totalAmountCents: centsFrom(input.totalAmountCents),
        rejectionReason: correctionNote,
        reviewedById: null,
        reviewedAt: null
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
    action: "sales_document.manual_correction",
    entityType: "SalesDocument",
    entityId: document.id,
    metadata: {
      correctionNote,
      before,
      after: {
        status: updated.status,
        accessKey: maskedAccessKey(updated.accessKey),
        invoiceNumber: updated.invoiceNumber,
        series: updated.series,
        issuedAt: updated.issuedAt?.toISOString() ?? null,
        issuerName: updated.issuerName,
        buyerName: updated.buyerName,
        totalAmountCents: updated.totalAmountCents,
        itemCount: updated.items.length
      }
    }
  });

  return { document: updated };
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

    return {
      document: updated,
      duplicate: Boolean(duplicate),
      warnings: result.warnings,
      extraction: {
        ...extractionSummary(result, source, { duplicate: Boolean(duplicate), accessKey, usedAi: !deterministicResult }),
        status: updated.status,
        itemCount: updated.items.length
      }
    };
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
  if (!input.mimeType) throw new SalesDocumentError("UNSUPPORTED_TYPE");
  const validation = validateSalesDocumentFile({ body: input.body, mimeType: input.mimeType });

  const seller = await resolveSellerProfile(prisma, actor, input.sellerProfileId);
  const extension = extensionForAllowedFileKind(validation.kind);
  const fileName = safeFileName(input.fileName ?? `danfe${extension}`);
  const fileKey = `${actor.organizationId}/sales-documents/${seller.id}/${randomUUID()}${extension}`;

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
  const deterministicSelection = uniqueSalesInvoicesByAccessKey(deterministic?.invoices.filter(hasOperationalMinimum) ?? []);
  const deterministicInvoices = deterministicSelection.invoices;
  const documents = [];

  if (deterministic && deterministicInvoices.length > 0) {
    logEvent("info", "sales_document.upload.deterministic_detected", {
      actorId: actor.id,
      sellerProfileId: seller.id,
      provider: deterministic.provider,
      model: deterministic.model,
      invoiceCount: deterministicInvoices.length,
      skippedDuplicateAccessKeys: deterministicSelection.skippedDuplicateAccessKeys,
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
        metadata: {
          sellerProfileId: seller.id,
          fileName,
          mimeType: input.mimeType,
          size: input.body.length,
          invoiceIndex: index + 1,
          skippedDuplicateAccessKeys: deterministicSelection.skippedDuplicateAccessKeys
        }
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
      skippedDuplicateAccessKeys: deterministicSelection.skippedDuplicateAccessKeys,
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
        rejectionReason: status === "APPROVED" ? null : cleanString(input.rejectionReason) ?? cleanString(input.reviewNote),
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
    metadata: { status, itemCount: updated.items.length, reviewNote: cleanString(input.reviewNote), rejectionReason: cleanString(input.rejectionReason) }
  });
  const reviewNote = cleanString(input.reviewNote) ?? cleanString(input.rejectionReason);
  const notificationRecipients = presentIds([updated.uploadedById, updated.sellerProfile?.user?.id]);
  await emitInAppNotifications(prisma, actor.organizationId, {
    actorId: actor.id,
    recipientIds: notificationRecipients,
    type:
      status === "APPROVED"
        ? "sales_document.approved"
        : status === "DUPLICATE"
          ? "sales_document.reviewed"
          : "sales_document.rejected",
    title: status === "APPROVED" ? "Nota aprovada" : status === "DUPLICATE" ? "Nota revisada" : "Nota rejeitada",
    body: reviewNote ?? updated.invoiceNumber ?? updated.fileName,
    entityType: "SalesDocument",
    entityId: updated.id,
    href: "/notas",
    dedupeKey: `sales_document.reviewed:${updated.id}:${updated.status}:${updated.reviewedAt?.toISOString() ?? ""}`
  });
  if (reviewNote) {
    await emitInAppNotifications(prisma, actor.organizationId, {
      actorId: actor.id,
      recipientIds: notificationRecipients,
      type: "sales_document.commented",
      title: "Comentario na nota",
      body: reviewNote,
      entityType: "SalesDocument",
      entityId: updated.id,
      href: "/notas",
      dedupeKey: `sales_document.commented:${updated.id}:${updated.reviewedAt?.toISOString() ?? ""}`
    });
  }

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

export async function createSalesCampaign(prisma: PrismaClient, actor: CurrentUser, input: SalesCampaignInput) {
  assertCampaignManager(actor);
  if (!input.name || !input.startsAt || !input.endsAt) throw new SalesDocumentError("INVALID_INPUT");
  const startsAt = dateFromCampaignInput(input.startsAt);
  const endsAt = dateFromCampaignInput(input.endsAt);
  if (endsAt.getTime() < startsAt.getTime()) throw new SalesDocumentError("INVALID_INPUT");
  await assertCampaignGroupScope(prisma, actor, input.salesGroupId);

  const campaign = await prisma.salesCampaign.create({
    data: {
      organizationId: actor.organizationId,
      salesGroupId: input.salesGroupId ?? null,
      name: input.name,
      description: input.description ?? null,
      metric: input.metric ?? "totalAmountCents",
      status: input.status ?? "ACTIVE",
      startsAt,
      endsAt
    },
    include: { salesGroup: true }
  });

  await recordAuditLog(prisma, {
    organizationId: actor.organizationId,
    actorId: actor.id,
    action: "sales_campaign.create",
    entityType: "SalesCampaign",
    entityId: campaign.id,
    metadata: { status: campaign.status, salesGroupId: campaign.salesGroupId }
  });

  return { campaign };
}

export async function updateSalesCampaign(prisma: PrismaClient, actor: CurrentUser, campaignId: string, input: SalesCampaignInput) {
  assertCampaignManager(actor);
  const current = await getScopedCampaign(prisma, actor, campaignId);
  const startsAt = input.startsAt ? dateFromCampaignInput(input.startsAt) : current.startsAt;
  const endsAt = input.endsAt ? dateFromCampaignInput(input.endsAt) : current.endsAt;
  if (endsAt.getTime() < startsAt.getTime()) throw new SalesDocumentError("INVALID_INPUT");
  const nextSalesGroupId = input.salesGroupId === undefined ? current.salesGroupId : input.salesGroupId;
  await assertCampaignGroupScope(prisma, actor, nextSalesGroupId);

  const campaign = await prisma.salesCampaign.update({
    where: { id: current.id },
    data: {
      salesGroupId: nextSalesGroupId ?? null,
      name: input.name ?? current.name,
      description: input.description === undefined ? current.description : input.description,
      metric: input.metric ?? current.metric,
      status: input.status ?? current.status,
      startsAt,
      endsAt
    },
    include: { salesGroup: true }
  });

  await recordAuditLog(prisma, {
    organizationId: actor.organizationId,
    actorId: actor.id,
    action: "sales_campaign.update",
    entityType: "SalesCampaign",
    entityId: campaign.id,
    metadata: { status: campaign.status, salesGroupId: campaign.salesGroupId }
  });

  return { campaign };
}

export async function createRankingSnapshot(prisma: PrismaClient, actor: CurrentUser, campaignId: string) {
  assertCampaignManager(actor);
  const campaign = await getScopedCampaign(prisma, actor, campaignId);
  const ranking = await getSalesRanking(prisma, actor, { campaignId: campaign.id });
  const scopeType = campaign.salesGroupId ? "SALES_GROUP" : "ORGANIZATION";
  const snapshot = await prisma.rankingSnapshot.create({
    data: {
      organizationId: actor.organizationId,
      campaignId: campaign.id,
      periodStart: campaign.startsAt,
      periodEnd: campaign.endsAt,
      scopeType,
      scopeId: campaign.salesGroupId,
      payloadJson: JSON.stringify({ campaign: ranking.campaign, items: ranking.items, total: ranking.total })
    },
    include: { campaign: { include: { salesGroup: true } } }
  });

  await recordAuditLog(prisma, {
    organizationId: actor.organizationId,
    actorId: actor.id,
    action: "sales_ranking.snapshot",
    entityType: "RankingSnapshot",
    entityId: snapshot.id,
    metadata: { campaignId: campaign.id, total: ranking.total, scopeType, scopeId: campaign.salesGroupId }
  });

  return { snapshot };
}

export async function listRankingSnapshots(prisma: PrismaClient, actor: CurrentUser) {
  assertCommercialRole(actor);
  const snapshots = await prisma.rankingSnapshot.findMany({
    where: {
      organizationId: actor.organizationId,
      campaign: actor.role === "SUPERVISOR" ? { salesGroup: { supervisorId: actor.id } } : undefined
    },
    include: { campaign: { include: { salesGroup: true } } },
    orderBy: { createdAt: "desc" },
    take: 12
  });
  return { items: snapshots, total: snapshots.length };
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

export async function getSalesRankingExplanation(prisma: PrismaClient, actor: CurrentUser, sellerProfileId: string, filters: SalesPeriodFilters = {}) {
  assertCommercialRole(actor);
  const ranking = await getSalesRanking(prisma, actor, { ...filters, sellerProfileId });
  const row = ranking.items.find((item) => item.sellerId === sellerProfileId);
  if (!row) throw new SalesDocumentError("NOT_FOUND");

  const effectiveFilters = {
    ...filters,
    from: filters.from ?? ranking.campaign?.startsAt.toISOString().slice(0, 10),
    to: filters.to ?? ranking.campaign?.endsAt.toISOString().slice(0, 10),
    salesGroupId: filters.salesGroupId ?? ranking.campaign?.salesGroupId ?? undefined,
    sellerProfileId
  };
  const approvedWhere = periodDocumentWhere(actor, effectiveFilters);
  const relatedWhere = salesDocumentWhere(actor, {
    ...effectiveFilters,
    status: undefined
  });

  const [approvedDocuments, relatedDocuments, latestSnapshot] = await Promise.all([
    prisma.salesDocument.findMany({
      where: approvedWhere,
      include: { sellerProfile: { include: { salesGroup: true } }, items: true },
      orderBy: [{ issuedAt: "desc" }, { createdAt: "desc" }]
    }),
    prisma.salesDocument.findMany({
      where: { ...relatedWhere, status: { in: ["UPLOADED", "EXTRACTING", "PENDING_REVIEW", "REJECTED", "DUPLICATE"] } },
      include: { sellerProfile: { include: { salesGroup: true } }, items: true },
      orderBy: [{ createdAt: "desc" }],
      take: 20
    }),
    ranking.campaign
      ? prisma.rankingSnapshot.findFirst({
          where: { organizationId: actor.organizationId, campaignId: ranking.campaign.id },
          include: { campaign: { include: { salesGroup: true } } },
          orderBy: { createdAt: "desc" }
        })
      : Promise.resolve(null)
  ]);

  const documents = approvedDocuments.map((document) => {
    const itemsTotal = document.items.reduce((sum, item) => sum + item.totalAmountCents, 0);
    const quantity = document.items.reduce((sum, item) => sum + item.quantity, 0);
    return {
      id: document.id,
      fileName: document.fileName,
      status: document.status,
      invoiceNumber: document.invoiceNumber,
      accessKey: document.accessKey,
      issuedAt: document.issuedAt,
      reviewedAt: document.reviewedAt,
      totalAmountCents: document.totalAmountCents ?? itemsTotal,
      quantity,
      items: document.items.map((item) => ({
        id: item.id,
        sku: item.sku,
        description: item.description,
        quantity: item.quantity,
        totalAmountCents: item.totalAmountCents
      }))
    };
  });
  const related = relatedDocuments.map((document) => ({
    id: document.id,
    fileName: document.fileName,
    status: document.status,
    invoiceNumber: document.invoiceNumber,
    issuedAt: document.issuedAt,
    createdAt: document.createdAt,
    reviewedAt: document.reviewedAt,
    rejectionReason: document.rejectionReason,
    totalAmountCents: document.totalAmountCents ?? document.items.reduce((sum, item) => sum + item.totalAmountCents, 0)
  }));
  const totalAmountCents = documents.reduce((sum, document) => sum + document.totalAmountCents, 0);
  const quantity = documents.reduce((sum, document) => sum + document.quantity, 0);

  return {
    filters: effectiveFilters,
    campaign: ranking.campaign,
    ranking: row,
    summary: {
      totalAmountCents,
      quantity,
      documents: documents.length,
      averageTicketCents: documents.length ? Math.round(totalAmountCents / documents.length) : 0,
      pendingDocuments: related.filter((document) => ["UPLOADED", "EXTRACTING", "PENDING_REVIEW"].includes(document.status)).length,
      rejectedDocuments: related.filter((document) => document.status === "REJECTED").length,
      duplicateDocuments: related.filter((document) => document.status === "DUPLICATE").length
    },
    documents,
    relatedDocuments: related,
    snapshot: latestSnapshot
      ? {
          id: latestSnapshot.id,
          campaignId: latestSnapshot.campaignId,
          periodStart: latestSnapshot.periodStart,
          periodEnd: latestSnapshot.periodEnd,
          scopeType: latestSnapshot.scopeType,
          scopeId: latestSnapshot.scopeId,
          createdAt: latestSnapshot.createdAt
        }
      : null,
    generatedAt: new Date().toISOString()
  };
}

export async function getSalesStatements(prisma: PrismaClient, actor: CurrentUser, filters: SalesPeriodFilters = {}) {
  assertCommercialRole(actor);
  const where = periodDocumentWhere(actor, filters);
  const pagination = paginationFor(filters);
  const documents = await prisma.salesDocument.findMany({
    where,
    include: { sellerProfile: { include: { salesGroup: true } }, items: true },
    orderBy: [{ issuedAt: "desc" }, { createdAt: "desc" }]
  });
  const items =
    pagination.take === undefined
      ? documents
      : await prisma.salesDocument.findMany({
          where,
          include: { sellerProfile: { include: { salesGroup: true } }, items: true },
          orderBy: [{ issuedAt: "desc" }, { createdAt: "desc" }],
          skip: pagination.skip,
          take: pagination.take
        });

  const totalAmountCents = documents.reduce(
    (sum, document) => sum + (document.totalAmountCents ?? document.items.reduce((itemSum, item) => itemSum + item.totalAmountCents, 0)),
    0
  );
  const totalItems = documents.reduce((sum, document) => sum + document.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);

  return {
    filters,
    summary: { documents: documents.length, totalAmountCents, totalItems },
    consolidations: buildSalesStatementConsolidations(documents),
    items,
    itemsTotal: documents.length,
    page: pagination.page ?? 1,
    pageSize: pagination.pageSize ?? items.length
  };
}

type SalesStatementDocument = Prisma.SalesDocumentGetPayload<{
  include: { sellerProfile: { include: { salesGroup: true } }; items: true };
}>;

function buildSalesStatementConsolidations(documents: SalesStatementDocument[]) {
  const bySeller = new Map<
    string,
    {
      sellerId: string;
      sellerName: string;
      groupId: string | null;
      groupName: string | null;
      documents: number;
      quantity: number;
      totalAmountCents: number;
    }
  >();
  const byGroup = new Map<
    string,
    {
      groupId: string | null;
      groupName: string;
      documents: number;
      sellers: Set<string>;
      quantity: number;
      totalAmountCents: number;
    }
  >();

  for (const document of documents) {
    const quantity = document.items.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmountCents = document.items.reduce((sum, item) => sum + item.totalAmountCents, 0);
    const groupId = document.sellerProfile.salesGroup?.id ?? null;
    const groupName = document.sellerProfile.salesGroup?.name ?? null;

    const sellerTotal =
      bySeller.get(document.sellerProfileId) ??
      {
        sellerId: document.sellerProfileId,
        sellerName: document.sellerProfile.displayName,
        groupId,
        groupName,
        documents: 0,
        quantity: 0,
        totalAmountCents: 0
      };
    sellerTotal.documents += 1;
    sellerTotal.quantity += quantity;
    sellerTotal.totalAmountCents += totalAmountCents;
    bySeller.set(document.sellerProfileId, sellerTotal);

    const groupKey = groupId ?? "__ungrouped__";
    const groupTotal =
      byGroup.get(groupKey) ??
      {
        groupId,
        groupName: groupName ?? "Sem grupo",
        documents: 0,
        sellers: new Set<string>(),
        quantity: 0,
        totalAmountCents: 0
      };
    groupTotal.documents += 1;
    groupTotal.sellers.add(document.sellerProfileId);
    groupTotal.quantity += quantity;
    groupTotal.totalAmountCents += totalAmountCents;
    byGroup.set(groupKey, groupTotal);
  }

  return {
    bySeller: [...bySeller.values()].sort((a, b) => b.totalAmountCents - a.totalAmountCents || a.sellerName.localeCompare(b.sellerName)),
    byGroup: [...byGroup.values()]
      .map((group) => ({ ...group, sellers: group.sellers.size }))
      .sort((a, b) => b.totalAmountCents - a.totalAmountCents || a.groupName.localeCompare(b.groupName))
  };
}

export function salesStatementsCsv(statement: Awaited<ReturnType<typeof getSalesStatements>>) {
  const metadata = exportMetadataRows("extrato-comercial", statement.filters);
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
  return csvRows([...metadata, [], header, ...rows]);
}

export function salesRankingCsv(ranking: Awaited<ReturnType<typeof getSalesRanking>>, filters: SalesPeriodFilters = {}) {
  const metadata = exportMetadataRows("ranking-comercial", filters);
  const campaignRows = ranking.campaign
    ? [
        ["campanha", ranking.campaign.name],
        ["campanha_inicio", ranking.campaign.startsAt.toISOString().slice(0, 10)],
        ["campanha_fim", ranking.campaign.endsAt.toISOString().slice(0, 10)]
      ]
    : [];
  const header = ["posicao", "vendedor", "grupo", "total_centavos", "itens", "notas"];
  const rows = ranking.items.map((item) => [
    String(item.position),
    item.sellerName,
    item.groupName ?? "",
    String(item.totalAmountCents),
    String(item.quantity),
    String(item.documents)
  ]);
  return csvRows([...metadata, ...campaignRows, ["total_linhas", String(ranking.total)], [], header, ...rows]);
}

export function salesDashboardCsv(dashboard: Awaited<ReturnType<typeof getSalesDashboard>>, filters: SalesPeriodFilters = {}) {
  const metadata = exportMetadataRows("dashboard-comercial", {
    ...filters,
    from: filters.from ?? dashboard.chart.from,
    to: filters.to ?? dashboard.chart.to,
    bucket: filters.bucket ?? dashboard.chart.bucket
  });
  const metricRows = [
    ["metrica", "valor"],
    ["notas_enviadas", String(dashboard.metrics.totalDocuments)],
    ["notas_pendentes", String(dashboard.metrics.pendingDocuments)],
    ["notas_aprovadas", String(dashboard.metrics.approvedDocuments)],
    ["notas_recusadas_duplicadas", String(dashboard.metrics.rejectedDocuments)],
    ["vendedores_ativos", String(dashboard.metrics.activeSellers)],
    ["total_vendido_centavos", String(dashboard.metrics.totalAmountCents)]
  ];
  const seriesRows = dashboard.chart.series.map((item) => [
    item.key,
    item.from,
    item.to,
    String(item.documents),
    String(item.quantity),
    String(item.totalAmountCents),
    String(item.averageTicketCents)
  ]);
  const sellerRows = dashboard.queues.topSellers.map((item, index) => [
    String(index + 1),
    item.sellerName,
    item.groupName ?? "",
    String(item.totalAmountCents),
    String(item.quantity)
  ]);
  const groupRows = dashboard.queues.groups.map((item) => [item.groupName, String(item.totalAmountCents), String(item.quantity)]);

  return csvRows([
    ...metadata,
    [],
    ...metricRows,
    [],
    ["serie_periodo", "de", "ate", "notas", "itens", "total_centavos", "ticket_medio_centavos"],
    ...seriesRows,
    [],
    ["ranking_top_vendedores", "vendedor", "grupo", "total_centavos", "itens"],
    ...sellerRows,
    [],
    ["grupos", "total_centavos", "itens"],
    ...groupRows
  ]);
}

export function salesExportFileName(prefix: string, filters: SalesPeriodFilters = {}, generatedAt = new Date()) {
  const date = generatedAt.toISOString().slice(0, 10);
  const from = filters.from ? `-${filters.from}` : "";
  const to = filters.to ? `-a-${filters.to}` : "";
  return `${prefix}${from}${to}-${date}.csv`;
}

function exportMetadataRows(name: string, filters: SalesPeriodFilters) {
  return [
    ["relatorio", name],
    ["gerado_em", new Date().toISOString()],
    ["periodo_de", filters.from ?? ""],
    ["periodo_ate", filters.to ?? ""],
    ["campanha_id", filters.campaignId ?? ""],
    ["grupo_id", filters.salesGroupId ?? ""],
    ["vendedor_id", filters.sellerProfileId ?? ""],
    ["bucket", filters.bucket ?? ""]
  ];
}

function csvRows(rows: string[][]) {
  return rows.map((row) => row.map(csvCell).join(",")).join("\n");
}

function csvCell(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

export async function getSalesDashboard(prisma: PrismaClient, actor: CurrentUser, filters: SalesPeriodFilters = {}, today = new Date()) {
  assertCommercialRole(actor);
  const documentWhere = salesDocumentWhere(actor);
  const approvedWhere = { ...documentWhere, status: "APPROVED" };
  const chartRange = dashboardChartRange(filters, today);
  const chartDocumentWhere = periodDocumentWhere(actor, {
    ...filters,
    from: chartRange.from.toISOString().slice(0, 10),
    to: chartRange.to.toISOString().slice(0, 10)
  });
  const chartBucket = chartBucketForRange(chartRange.from, chartRange.to, filters.bucket) as "day" | "week" | "month";

  const [totalDocuments, pendingDocuments, approvedDocuments, rejectedDocuments, sellers, approvedItems, chartItems, pendingQueue] =
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
      prisma.salesItem.findMany({
        where: { salesDocument: chartDocumentWhere },
        include: {
          salesDocument: { select: { id: true, issuedAt: true } },
          sellerProfile: { include: { salesGroup: true } }
        }
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

  const chartBuckets = new Map<
    string,
    { key: string; label: string; from: string; to: string; documents: Set<string>; quantity: number; totalAmountCents: number }
  >();
  for (let cursor = chartBucketStart(chartRange.from, chartBucket); cursor.getTime() <= chartRange.to.getTime(); cursor = addChartBucket(cursor, chartBucket)) {
    const next = addChartBucket(cursor, chartBucket);
    const bucketEnd = addUtcDays(next, -1);
    const key = chartBucketLabel(cursor, chartBucket);
    chartBuckets.set(key, {
      key,
      label: key,
      from: cursor.toISOString().slice(0, 10),
      to: (bucketEnd.getTime() < chartRange.to.getTime() ? bucketEnd : chartRange.to).toISOString().slice(0, 10),
      documents: new Set<string>(),
      quantity: 0,
      totalAmountCents: 0
    });
  }

  for (const item of chartItems) {
    const issuedAt = item.salesDocument.issuedAt;
    if (!issuedAt) continue;
    const key = chartBucketLabel(chartBucketStart(issuedAt, chartBucket), chartBucket);
    const bucket = chartBuckets.get(key);
    if (!bucket) continue;
    bucket.documents.add(item.salesDocument.id);
    bucket.quantity += item.quantity;
    bucket.totalAmountCents += item.totalAmountCents;
  }

  const series = [...chartBuckets.values()].map((bucket) => {
    const documents = bucket.documents.size;
    return {
      key: bucket.key,
      label: bucket.label,
      from: bucket.from,
      to: bucket.to,
      documents,
      quantity: bucket.quantity,
      totalAmountCents: bucket.totalAmountCents,
      averageTicketCents: documents > 0 ? Math.round(bucket.totalAmountCents / documents) : 0
    };
  });

  return {
    metrics: {
      totalDocuments,
      pendingDocuments,
      approvedDocuments,
      rejectedDocuments,
      activeSellers: sellers.filter((seller) => seller.active).length,
      totalAmountCents: [...sellerTotals.values()].reduce((sum, item) => sum + item.totalAmountCents, 0)
    },
    chart: {
      bucket: chartBucket,
      from: chartRange.from.toISOString().slice(0, 10),
      to: chartRange.to.toISOString().slice(0, 10),
      series
    },
    queues: {
      pendingDocuments: pendingQueue,
      topSellers: [...sellerTotals.values()].sort((a, b) => b.totalAmountCents - a.totalAmountCents).slice(0, 10),
      groups: [...groupTotals.values()].sort((a, b) => b.totalAmountCents - a.totalAmountCents)
    }
  };
}
