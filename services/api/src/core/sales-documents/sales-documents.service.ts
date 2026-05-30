import { randomUUID } from "node:crypto";
import path from "node:path";
import type { Prisma, PrismaClient } from "@prisma/client";
import type { CurrentUser } from "@alwaystrack/shared";
import { loadEnv } from "../../config/env.js";
import { recordAuditLog } from "../audit/audit.service.js";
import type { StorageProvider } from "../documents/storage.js";

export class SalesDocumentError extends Error {
  constructor(public readonly code: "NOT_FOUND" | "INVALID_INPUT" | "FORBIDDEN" | "UNSUPPORTED_TYPE" | "FILE_TOO_LARGE") {
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

const allowedMimeTypes = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);

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
  if (mimeType === "image/jpeg") return ".jpg";
  if (mimeType === "image/png") return ".png";
  if (mimeType === "image/webp") return ".webp";
  return "";
}

function assertCommercialRole(actor: CurrentUser) {
  if (["ADMIN", "GESTOR", "SAC", "FINANCEIRO", "VENDEDOR", "SUPERVISOR"].includes(actor.role)) return;
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
        items: true
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }]
    }),
    prisma.salesDocument.count({ where })
  ]);
  return { items, total };
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

  await storage.put({ fileKey, body: input.body, mimeType: input.mimeType });

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
    include: {
      sellerProfile: { include: { salesGroup: true, user: { select: { id: true, name: true, email: true, role: true } } } },
      uploadedBy: { select: { id: true, name: true, email: true, role: true } },
      reviewedBy: { select: { id: true, name: true, email: true, role: true } },
      items: true
    }
  });

  await recordAuditLog(prisma, {
    organizationId: actor.organizationId,
    actorId: actor.id,
    action: "sales_document.upload",
    entityType: "SalesDocument",
    entityId: document.id,
    metadata: { sellerProfileId: seller.id, fileName, mimeType: input.mimeType, size: input.body.length }
  });

  return document;
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
