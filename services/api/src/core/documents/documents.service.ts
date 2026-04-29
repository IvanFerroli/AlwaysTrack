import { randomUUID } from "node:crypto";
import path from "node:path";
import type { PrismaClient } from "@prisma/client";
import type { CurrentUser } from "@sylembra/shared";
import { loadEnv } from "../../config/env.js";
import { recordAuditLog } from "../audit/audit.service.js";
import { canAccessScopedResource } from "../auth/access-policy.js";
import type { StorageProvider } from "./storage.js";

export class DocumentError extends Error {
  constructor(public readonly code: "NOT_FOUND" | "INVALID_INPUT" | "FORBIDDEN" | "UNSUPPORTED_TYPE" | "FILE_TOO_LARGE") {
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

const allowedMimeTypes = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);

function cleanText(value: unknown) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
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
