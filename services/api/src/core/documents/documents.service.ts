import { randomUUID } from "node:crypto";
import path from "node:path";
import type { PrismaClient } from "@prisma/client";
import type { CurrentUser } from "@alwaystrack/shared";
import { loadEnv } from "../../config/env.js";
import { recordAuditLog } from "../audit/audit.service.js";
import { canAccessScopedResource } from "../auth/access-policy.js";
import { recalculateLicenses } from "../licenses/licenses.service.js";
import type { StorageProvider } from "./storage.js";

export class DocumentError extends Error {
  constructor(
    public readonly code:
      | "NOT_FOUND"
      | "INVALID_INPUT"
      | "FORBIDDEN"
      | "UNSUPPORTED_TYPE"
      | "FILE_TOO_LARGE"
      | "ALREADY_VALIDATED"
  ) {
    super(code);
  }
}

export interface DocumentUploadInput {
  professionalId?: string;
  licenseId?: string;
  fileName?: string;
  mimeType?: string;
  body?: Buffer;
}

export interface DocumentFilters {
  status?: string;
  professionalId?: string;
  licenseId?: string;
}

export interface ValidateDocumentInput {
  status?: "APPROVED" | "REJECTED";
  rejectionReason?: string | null;
}

const allowedMimeTypes = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);

function cleanText(value: unknown) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function cleanOptionalText(value: unknown) {
  if (value === null) return null;
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function safeFileName(fileName: string) {
  return path.basename(fileName).replace(/[^\w.\- ]/g, "_").slice(0, 180) || "documento";
}

function extensionFor(mimeType: string) {
  if (mimeType === "application/pdf") return ".pdf";
  if (mimeType === "image/jpeg") return ".jpg";
  if (mimeType === "image/png") return ".png";
  if (mimeType === "image/webp") return ".webp";
  return "";
}

export function validateDocumentFile(input: { body: Buffer; mimeType: string }) {
  if (!allowedMimeTypes.has(input.mimeType)) {
    throw new DocumentError("UNSUPPORTED_TYPE");
  }

  const env = loadEnv();
  if (input.body.length > env.documentMaxBytes) {
    throw new DocumentError("FILE_TOO_LARGE");
  }
}

export function parseDocumentUploadInput(input: {
  query: Record<string, unknown>;
  headers: Record<string, unknown>;
  body: unknown;
}): DocumentUploadInput {
  const mimeType = cleanText(input.headers["content-type"])?.split(";")[0]?.trim().toLowerCase();
  return {
    professionalId: cleanText(input.query.professionalId),
    licenseId: cleanText(input.query.licenseId),
    fileName: cleanText(input.query.fileName) ?? cleanText(input.headers["x-file-name"]),
    mimeType,
    body: Buffer.isBuffer(input.body) ? input.body : undefined
  };
}

export function parseDocumentFilters(query: Record<string, unknown>): DocumentFilters {
  return {
    status: cleanText(query.status),
    professionalId: cleanText(query.professionalId),
    licenseId: cleanText(query.licenseId)
  };
}

export function parseValidateDocumentInput(payload: unknown): ValidateDocumentInput {
  const input = (payload ?? {}) as Record<string, unknown>;
  const status = input.status === "APPROVED" || input.status === "REJECTED" ? input.status : undefined;
  return {
    status,
    rejectionReason: cleanOptionalText(input.rejectionReason)
  };
}

async function ensureDocumentScope(prisma: PrismaClient, actor: CurrentUser, professionalId: string, licenseId: string) {
  const license = await prisma.license.findFirst({
    where: { id: licenseId, professionalId },
    include: {
      professional: true
    }
  });

  if (!license) {
    throw new DocumentError("INVALID_INPUT");
  }

  const decision = canAccessScopedResource(actor, {
    organizationId: license.professional.organizationId,
    responsibleRtId: license.professional.responsibleRtId,
    unitId: license.professional.unitId,
    sectorId: license.professional.sectorId
  });
  if (!decision.allowed) {
    throw new DocumentError("FORBIDDEN");
  }

  return license;
}

function scopedProfessionalWhere(actor: CurrentUser) {
  if (actor.role === "ADMIN") {
    return { organizationId: actor.organizationId };
  }

  if (actor.role === "RT") {
    return { organizationId: actor.organizationId, responsibleRtId: actor.id };
  }

  if (actor.role === "SUPERVISOR") {
    return {
      organizationId: actor.organizationId,
      OR: [
        actor.unitScopeIds.length ? { unitId: { in: actor.unitScopeIds } } : { id: "__no_unit_scope__" },
        actor.sectorScopeIds.length ? { sectorId: { in: actor.sectorScopeIds } } : { id: "__no_sector_scope__" }
      ]
    };
  }

  throw new DocumentError("FORBIDDEN");
}

function ensureCanValidate(actor: CurrentUser) {
  if (actor.role !== "ADMIN" && actor.role !== "RT") {
    throw new DocumentError("FORBIDDEN");
  }
}

export async function listDocuments(prisma: PrismaClient, actor: CurrentUser, filters: DocumentFilters) {
  const where = {
    status: filters.status,
    professionalId: filters.professionalId,
    licenseId: filters.licenseId,
    professional: scopedProfessionalWhere(actor)
  };
  const [items, total] = await Promise.all([
    prisma.document.findMany({
      where,
      include: {
        professional: {
          include: {
            unit: true,
            sector: true,
            responsibleRt: { select: { id: true, name: true, email: true, role: true } }
          }
        },
        license: { include: { licenseType: true } },
        uploadedByUser: { select: { id: true, name: true, email: true, role: true } },
        uploadToken: { select: { id: true, usedAt: true, expiresAt: true } },
        validatedBy: { select: { id: true, name: true, email: true, role: true } }
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }]
    }),
    prisma.document.count({ where })
  ]);

  return { items, total };
}

export async function uploadDocument(
  prisma: PrismaClient,
  storage: StorageProvider,
  actor: CurrentUser,
  input: DocumentUploadInput
) {
  if (!input.professionalId || !input.licenseId || !input.body || input.body.length === 0) {
    throw new DocumentError("INVALID_INPUT");
  }

  const mimeType = input.mimeType;
  if (!mimeType) {
    throw new DocumentError("UNSUPPORTED_TYPE");
  }
  validateDocumentFile({ body: input.body, mimeType });

  const license = await ensureDocumentScope(prisma, actor, input.professionalId, input.licenseId);
  const fileName = safeFileName(input.fileName ?? `documento${extensionFor(mimeType)}`);
  const fileKey = `${license.professional.organizationId}/${input.professionalId}/${input.licenseId}/${randomUUID()}${extensionFor(
    mimeType
  )}`;

  await storage.put({ fileKey, body: input.body, mimeType });

  const document = await prisma.document.create({
    data: {
      professionalId: input.professionalId,
      licenseId: input.licenseId,
      fileKey,
      fileName,
      mimeType,
      size: input.body.length,
      status: "UPLOADED",
      uploadedByUserId: actor.id
    }
  });

  await recordAuditLog(prisma, {
    organizationId: license.professional.organizationId,
    actorId: actor.id,
    action: "document.upload",
    entityType: "Document",
    entityId: document.id,
    metadata: { professionalId: document.professionalId, licenseId: document.licenseId, fileName, mimeType, size: document.size }
  });

  return document;
}

export async function getDocumentDownload(
  prisma: PrismaClient,
  storage: StorageProvider,
  actor: CurrentUser,
  documentId: string
) {
  const document = await prisma.document.findFirst({
    where: { id: documentId },
    include: {
      professional: true
    }
  });

  if (!document) {
    throw new DocumentError("NOT_FOUND");
  }

  const decision = canAccessScopedResource(actor, {
    organizationId: document.professional.organizationId,
    responsibleRtId: document.professional.responsibleRtId,
    unitId: document.professional.unitId,
    sectorId: document.professional.sectorId
  });
  if (!decision.allowed) {
    throw new DocumentError("FORBIDDEN");
  }

  const stored = await storage.get(document.fileKey);
  return {
    body: stored.body,
    fileName: document.fileName,
    mimeType: document.mimeType,
    size: document.size
  };
}

export async function validateDocument(
  prisma: PrismaClient,
  actor: CurrentUser,
  documentId: string,
  input: ValidateDocumentInput
) {
  ensureCanValidate(actor);
  if (!input.status || (input.status === "REJECTED" && !input.rejectionReason)) {
    throw new DocumentError("INVALID_INPUT");
  }

  const existing = await prisma.document.findFirst({
    where: { id: documentId },
    include: {
      professional: true,
      license: true
    }
  });
  if (!existing) throw new DocumentError("NOT_FOUND");

  const decision = canAccessScopedResource(actor, {
    organizationId: existing.professional.organizationId,
    responsibleRtId: existing.professional.responsibleRtId,
    unitId: existing.professional.unitId,
    sectorId: existing.professional.sectorId
  });
  if (!decision.allowed) {
    throw new DocumentError("FORBIDDEN");
  }

  if (existing.status === "APPROVED" || existing.status === "REJECTED") {
    throw new DocumentError("ALREADY_VALIDATED");
  }

  const document = await prisma.document.update({
    where: { id: documentId },
    data: {
      status: input.status,
      validatedById: actor.id,
      validatedAt: new Date(),
      rejectionReason: input.status === "REJECTED" ? input.rejectionReason : null
    },
    include: {
      professional: true,
      license: { include: { licenseType: true } },
      validatedBy: { select: { id: true, name: true, email: true, role: true } }
    }
  });

  await recordAuditLog(prisma, {
    organizationId: existing.professional.organizationId,
    actorId: actor.id,
    action: input.status === "APPROVED" ? "document.approve" : "document.reject",
    entityType: "Document",
    entityId: document.id,
    metadata: {
      previousStatus: existing.status,
      status: document.status,
      rejectionReason: document.rejectionReason,
      licenseId: document.licenseId,
      professionalId: document.professionalId
    }
  });

  await recalculateLicenses(prisma, actor, { licenseId: document.licenseId });

  return document;
}
