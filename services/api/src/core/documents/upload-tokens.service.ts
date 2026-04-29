import { createHash, randomBytes } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import type { CurrentUser } from "@sylembra/shared";
import { recordAuditLog } from "../audit/audit.service.js";
import { canAccessScopedResource } from "../auth/access-policy.js";
import type { StorageProvider } from "./storage.js";
import { DocumentError, validateDocumentFile } from "./documents.service.js";

export class UploadTokenError extends Error {
  constructor(public readonly code: "NOT_FOUND" | "INVALID_INPUT" | "FORBIDDEN" | "EXPIRED" | "USED" | "INACTIVE") {
    super(code);
  }
}

export interface CreateUploadTokenInput {
  professionalId?: string;
  licenseId?: string;
  expiresAt?: Date;
}

export interface PublicUploadInput {
  token?: string;
  fileName?: string;
  mimeType?: string;
  body?: Buffer;
}

function cleanText(value: unknown) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function cleanDate(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export function hashUploadToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function createRawUploadToken() {
  return randomBytes(32).toString("base64url");
}

export function parseCreateUploadTokenInput(payload: unknown): CreateUploadTokenInput {
  const input = (payload ?? {}) as Record<string, unknown>;
  const defaultExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  return {
    professionalId: cleanText(input.professionalId),
    licenseId: cleanText(input.licenseId),
    expiresAt: cleanDate(input.expiresAt) ?? defaultExpiresAt
  };
}

export function parsePublicUploadInput(input: {
  token: string | string[] | undefined;
  query: Record<string, unknown>;
  headers: Record<string, unknown>;
  body: unknown;
}): PublicUploadInput {
  const mimeType = cleanText(input.headers["content-type"])?.split(";")[0]?.trim().toLowerCase();
  return {
    token: typeof input.token === "string" ? input.token : undefined,
    fileName: cleanText(input.query.fileName) ?? cleanText(input.headers["x-file-name"]),
    mimeType,
    body: Buffer.isBuffer(input.body) ? input.body : undefined
  };
}

async function findToken(prisma: PrismaClient, token: string) {
  return prisma.uploadToken.findUnique({
    where: { tokenHash: hashUploadToken(token) },
    include: {
      professional: true,
      license: {
        include: {
          licenseType: true
        }
      }
    }
  });
}

function assertTokenUsable(uploadToken: Awaited<ReturnType<typeof findToken>>) {
  if (!uploadToken) throw new UploadTokenError("NOT_FOUND");
  if (!uploadToken.active) throw new UploadTokenError("INACTIVE");
  if (uploadToken.usedAt) throw new UploadTokenError("USED");
  if (uploadToken.expiresAt.getTime() <= Date.now()) throw new UploadTokenError("EXPIRED");
  return uploadToken;
}

export async function createUploadToken(prisma: PrismaClient, actor: CurrentUser, input: CreateUploadTokenInput) {
  if (!input.professionalId || !input.licenseId || !input.expiresAt) {
    throw new UploadTokenError("INVALID_INPUT");
  }

  const license = await prisma.license.findFirst({
    where: { id: input.licenseId, professionalId: input.professionalId },
    include: { professional: true }
  });
  if (!license) throw new UploadTokenError("INVALID_INPUT");

  const decision = canAccessScopedResource(actor, {
    organizationId: license.professional.organizationId,
    responsibleRtId: license.professional.responsibleRtId,
    unitId: license.professional.unitId,
    sectorId: license.professional.sectorId
  });
  if (!decision.allowed || actor.role !== "ADMIN") throw new UploadTokenError("FORBIDDEN");

  const rawToken = createRawUploadToken();
  const uploadToken = await prisma.uploadToken.create({
    data: {
      professionalId: input.professionalId,
      licenseId: input.licenseId,
      tokenHash: hashUploadToken(rawToken),
      expiresAt: input.expiresAt,
      active: true
    }
  });

  await recordAuditLog(prisma, {
    organizationId: license.professional.organizationId,
    actorId: actor.id,
    action: "upload_token.create",
    entityType: "UploadToken",
    entityId: uploadToken.id,
    metadata: { professionalId: input.professionalId, licenseId: input.licenseId, expiresAt: input.expiresAt }
  });

  return { uploadToken, token: rawToken };
}

export async function getPublicUploadToken(prisma: PrismaClient, token: string | undefined) {
  if (!token) throw new UploadTokenError("INVALID_INPUT");
  const uploadToken = assertTokenUsable(await findToken(prisma, token));

  return {
    id: uploadToken.id,
    expiresAt: uploadToken.expiresAt,
    professional: { name: uploadToken.professional.name },
    license: {
      number: uploadToken.license.number,
      expiresAt: uploadToken.license.expiresAt,
      licenseType: { name: uploadToken.license.licenseType.name }
    }
  };
}

export async function uploadDocumentWithToken(
  prisma: PrismaClient,
  storage: StorageProvider,
  input: PublicUploadInput
) {
  if (!input.token || !input.body || input.body.length === 0 || !input.mimeType) {
    throw new UploadTokenError("INVALID_INPUT");
  }

  const uploadToken = assertTokenUsable(await findToken(prisma, input.token));
  validateDocumentFile({ body: input.body, mimeType: input.mimeType });

  const fileName = (input.fileName ?? "documento").replace(/[^\w.\- ]/g, "_").slice(0, 180) || "documento";
  const extension = input.mimeType === "application/pdf" ? ".pdf" : input.mimeType.split("/")[1] ? `.${input.mimeType.split("/")[1]}` : "";
  const fileKey = `${uploadToken.professional.organizationId}/${uploadToken.professionalId}/${uploadToken.licenseId}/${uploadToken.id}${extension}`;

  await storage.put({ fileKey, body: input.body, mimeType: input.mimeType });

  const document = await prisma.document.create({
    data: {
      professionalId: uploadToken.professionalId,
      licenseId: uploadToken.licenseId,
      fileKey,
      fileName,
      mimeType: input.mimeType,
      size: input.body.length,
      status: "UPLOADED",
      uploadTokenId: uploadToken.id
    }
  });

  await prisma.uploadToken.update({
    where: { id: uploadToken.id },
    data: { usedAt: new Date(), active: false }
  });

  if (uploadToken.license.status !== "INACTIVE") {
    await prisma.license.update({
      where: { id: uploadToken.licenseId },
      data: { status: "PENDING_VALIDATION" }
    });
  }

  await recordAuditLog(prisma, {
    organizationId: uploadToken.professional.organizationId,
    actorId: null,
    action: "upload_token.use",
    entityType: "UploadToken",
    entityId: uploadToken.id,
    metadata: { documentId: document.id, professionalId: uploadToken.professionalId, licenseId: uploadToken.licenseId }
  });
  await recordAuditLog(prisma, {
    organizationId: uploadToken.professional.organizationId,
    actorId: null,
    action: "document.public_upload",
    entityType: "Document",
    entityId: document.id,
    metadata: { uploadTokenId: uploadToken.id, fileName, mimeType: input.mimeType, size: document.size }
  });

  return document;
}

export async function invalidateUploadToken(prisma: PrismaClient, actor: CurrentUser, uploadTokenId: string) {
  const uploadToken = await prisma.uploadToken.findFirst({
    where: { id: uploadTokenId },
    include: { professional: true }
  });
  if (!uploadToken) throw new UploadTokenError("NOT_FOUND");
  if (actor.role !== "ADMIN" || uploadToken.professional.organizationId !== actor.organizationId) {
    throw new UploadTokenError("FORBIDDEN");
  }

  const updated = await prisma.uploadToken.update({
    where: { id: uploadTokenId },
    data: { active: false }
  });

  await recordAuditLog(prisma, {
    organizationId: uploadToken.professional.organizationId,
    actorId: actor.id,
    action: "upload_token.invalidate",
    entityType: "UploadToken",
    entityId: uploadToken.id,
    metadata: { professionalId: uploadToken.professionalId, licenseId: uploadToken.licenseId }
  });

  return updated;
}

export function toDocumentError(error: unknown) {
  return error instanceof DocumentError ? error : null;
}
