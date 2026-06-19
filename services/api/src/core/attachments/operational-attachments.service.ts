import { randomUUID } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import type { CurrentUser } from "@alwaystrack/shared";
import { loadEnv } from "../../config/env.js";
import { recordAuditLog } from "../audit/audit.service.js";
import { FileValidationError, validateAllowedFile } from "../documents/file-validation.js";
import type { StorageProvider } from "../documents/storage.js";
import { logEvent } from "../diagnostics/logger.js";
import { parseObjectPayload } from "../validation/input-validation.js";

export class OperationalAttachmentError extends Error {
  constructor(public readonly code: "NOT_FOUND" | "INVALID_INPUT" | "FORBIDDEN" | "UNSUPPORTED_TYPE" | "FILE_TOO_LARGE") {
    super(code);
  }
}

export interface OperationalAttachmentUploadInput {
  surface?: string;
  entityId?: string;
  fileName?: string;
  mimeType?: string;
  body?: Buffer;
}

const allowedImageKinds = new Set(["png", "jpeg", "webp"] as const);
const allowedSurfaces = new Set(["announcement", "faq", "service-flow", "script-library", "profile", "settings"] as const);

function cleanSurface(value: unknown) {
  const surface = cleanOptionalString(value, 64)?.toLowerCase();
  return surface && allowedSurfaces.has(surface as never) ? surface : undefined;
}

function cleanOptionalString(value: unknown, maxLength: number) {
  if (value === undefined) return undefined;
  if (typeof value !== "string") throw new OperationalAttachmentError("INVALID_INPUT");
  const trimmed = value.trim();
  if (trimmed.length > maxLength) throw new OperationalAttachmentError("INVALID_INPUT");
  return trimmed.length ? trimmed : undefined;
}

function cleanHeader(value: unknown) {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return undefined;
}

function safeFileName(value: string) {
  return value.replace(/[^\w.\- ]+/g, "_").replace(/\s+/g, " ").trim().slice(0, 120) || "imagem";
}

function extensionFor(mimeType: string) {
  if (mimeType === "image/png") return ".png";
  if (mimeType === "image/jpeg") return ".jpg";
  if (mimeType === "image/webp") return ".webp";
  return "";
}

export function parseOperationalAttachmentUploadInput(input: {
  query: Record<string, unknown>;
  headers: Record<string, unknown>;
  body: unknown;
}): OperationalAttachmentUploadInput {
  const query = parseObjectPayload(input.query, (payload) => payload);
  const mimeType = cleanHeader(input.headers["content-type"])?.split(";")[0]?.trim().toLowerCase();
  return {
    surface: cleanSurface(query.surface),
    entityId: cleanOptionalString(query.entityId, 80),
    fileName: cleanHeader(input.headers["x-file-name"]),
    mimeType,
    body: Buffer.isBuffer(input.body) ? input.body : undefined
  };
}

export async function uploadOperationalAttachment(
  prisma: PrismaClient,
  storage: StorageProvider,
  actor: CurrentUser,
  input: OperationalAttachmentUploadInput
) {
  if (!input.surface) throw new OperationalAttachmentError("INVALID_INPUT");
  if (!input.body || input.body.length === 0) throw new OperationalAttachmentError("INVALID_INPUT");
  if (!input.mimeType) throw new OperationalAttachmentError("UNSUPPORTED_TYPE");
  try {
    validateAllowedFile({
      body: input.body,
      mimeType: input.mimeType,
      allowedKinds: allowedImageKinds,
      configuredMaxBytes: loadEnv().documentMaxBytes
    });
  } catch (error) {
    if (error instanceof FileValidationError) {
      logEvent("warn", "operational_attachment.upload.rejected", {
        reason: error.code,
        actorId: actor.id,
        surface: input.surface,
        mimeType: input.mimeType,
        size: input.body.length
      });
      throw new OperationalAttachmentError(error.code);
    }
    throw error;
  }

  const fileName = safeFileName(input.fileName ?? `imagem${extensionFor(input.mimeType)}`);
  const extension = extensionFor(input.mimeType);
  const fileKey = `${actor.organizationId}/operational-attachments/${input.surface}/${randomUUID()}${extension}`;
  await storage.put({ fileKey, body: input.body, mimeType: input.mimeType });
  const attachment = await prisma.operationalAttachment.create({
    data: {
      organizationId: actor.organizationId,
      uploadedById: actor.id,
      surface: input.surface,
      entityId: input.entityId,
      fileKey,
      fileName,
      mimeType: input.mimeType,
      size: input.body.length
    }
  });
  await recordAuditLog(prisma, {
    organizationId: actor.organizationId,
    actorId: actor.id,
    action: "operational_attachment.upload",
    entityType: "OperationalAttachment",
    entityId: attachment.id,
    metadata: { surface: input.surface, linkedEntityId: input.entityId ?? null, fileName, mimeType: input.mimeType, size: attachment.size }
  });
  return { ...attachment, markdownUrl: `/v1/attachments/operational/${attachment.id}/file` };
}

export async function getOperationalAttachmentFile(prisma: PrismaClient, storage: StorageProvider, actor: CurrentUser, attachmentId: string) {
  const attachment = await prisma.operationalAttachment.findFirst({
    where: { id: attachmentId, organizationId: actor.organizationId, archivedAt: null }
  });
  if (!attachment) throw new OperationalAttachmentError("NOT_FOUND");
  const stored = await storage.get(attachment.fileKey);
  return {
    body: stored.body,
    fileName: attachment.fileName,
    mimeType: attachment.mimeType,
    size: attachment.size
  };
}

export async function archiveOperationalAttachment(prisma: PrismaClient, actor: CurrentUser, attachmentId: string) {
  if (actor.role !== "ADMIN") throw new OperationalAttachmentError("FORBIDDEN");
  const attachment = await prisma.operationalAttachment.findFirst({
    where: { id: attachmentId, organizationId: actor.organizationId, archivedAt: null }
  });
  if (!attachment) throw new OperationalAttachmentError("NOT_FOUND");
  const archived = await prisma.operationalAttachment.update({
    where: { id: attachment.id },
    data: { archivedAt: new Date(), archivedById: actor.id }
  });
  await recordAuditLog(prisma, {
    organizationId: actor.organizationId,
    actorId: actor.id,
    action: "operational_attachment.archive",
    entityType: "OperationalAttachment",
    entityId: attachment.id,
    metadata: { surface: attachment.surface, linkedEntityId: attachment.entityId ?? null, fileName: attachment.fileName, storagePreserved: true }
  });
  return archived;
}
