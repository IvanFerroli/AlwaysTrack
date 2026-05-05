import type { Prisma, PrismaClient } from "@prisma/client";
import type { CurrentUser } from "@sylembra/shared";
import { recordAuditLog } from "../audit/audit.service.js";
import { canAccessScopedResource } from "../auth/access-policy.js";
import { recalculateLicenses } from "../licenses/licenses.service.js";
import type { StorageProvider } from "../documents/storage.js";
import type { DocumentAiProvider, DocumentAiResult, ExtractedField } from "./provider.js";

export class DocumentAiError extends Error {
  constructor(public readonly code: "NOT_FOUND" | "INVALID_INPUT" | "FORBIDDEN" | "PROVIDER_ERROR") {
    super(code);
  }
}

type DocumentWithScope = Prisma.DocumentGetPayload<{
  include: {
    professional: true;
    license: { include: { licenseType: true } };
  };
}>;

function ensureCanAnalyze(actor: CurrentUser, document: DocumentWithScope) {
  const decision = canAccessScopedResource(actor, {
    organizationId: document.professional.organizationId,
    responsibleRtId: document.professional.responsibleRtId,
    unitId: document.professional.unitId,
    sectorId: document.professional.sectorId
  });
  if (!decision.allowed || actor.role === "SUPERVISOR") {
    throw new DocumentAiError("FORBIDDEN");
  }
}

function cleanString(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function digitsOnly(value: string | null | undefined) {
  const digits = value?.replace(/\D/g, "");
  return digits ? digits : null;
}

function normalizeUf(value: string | null | undefined) {
  const cleaned = cleanString(value)?.toUpperCase();
  return cleaned && /^[A-Z]{2}$/.test(cleaned) ? cleaned : null;
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

function fieldValue(field: ExtractedField | undefined) {
  return cleanString(field?.value);
}

function normalizeResult(result: DocumentAiResult): DocumentAiResult {
  return {
    ...result,
    fields: {
      ...result.fields,
      professionalName: { ...result.fields.professionalName, value: cleanString(result.fields.professionalName.value) },
      cpf: { ...result.fields.cpf, value: digitsOnly(result.fields.cpf.value) },
      licenseTypeName: { ...result.fields.licenseTypeName, value: cleanString(result.fields.licenseTypeName.value) },
      licenseNumber: { ...result.fields.licenseNumber, value: cleanString(result.fields.licenseNumber.value) },
      issuer: { ...result.fields.issuer, value: cleanString(result.fields.issuer.value)?.toUpperCase() ?? null },
      uf: { ...result.fields.uf, value: normalizeUf(result.fields.uf.value) },
      issuedAt: { ...result.fields.issuedAt, value: normalizeDate(result.fields.issuedAt.value) },
      expiresAt: { ...result.fields.expiresAt, value: normalizeDate(result.fields.expiresAt.value) }
    },
    warnings: result.warnings ?? []
  };
}

async function getScopedDocument(prisma: PrismaClient, actor: CurrentUser, documentId: string) {
  const document = await prisma.document.findFirst({
    where: { id: documentId },
    include: { professional: true, license: { include: { licenseType: true } } }
  });
  if (!document) throw new DocumentAiError("NOT_FOUND");
  ensureCanAnalyze(actor, document);
  return document;
}

export async function listDocumentAnalyses(prisma: PrismaClient, actor: CurrentUser, documentId: string) {
  await getScopedDocument(prisma, actor, documentId);
  const items = await prisma.documentAiExtraction.findMany({
    where: { documentId, organizationId: actor.organizationId },
    include: { appliedBy: { select: { id: true, name: true, email: true, role: true } } },
    orderBy: { createdAt: "desc" },
    take: 10
  });
  return { items };
}

export async function analyzeDocumentWithAi(
  prisma: PrismaClient,
  storage: StorageProvider,
  provider: DocumentAiProvider,
  actor: CurrentUser,
  documentId: string
) {
  const document = await getScopedDocument(prisma, actor, documentId);
  const extraction = await prisma.documentAiExtraction.create({
    data: {
      organizationId: actor.organizationId,
      documentId,
      provider: provider.provider,
      model: provider.model,
      status: "PROCESSING"
    }
  });

  try {
    const stored = await storage.get(document.fileKey);
    const result = normalizeResult(
      await provider.analyze({
        body: stored.body,
        mimeType: document.mimeType,
        fileName: document.fileName
      })
    );
    const updated = await prisma.documentAiExtraction.update({
      where: { id: extraction.id },
      data: { status: "COMPLETED", resultJson: JSON.stringify(result), errorMessage: null }
    });
    await recordAuditLog(prisma, {
      organizationId: actor.organizationId,
      actorId: actor.id,
      action: "document_ai.analyze",
      entityType: "Document",
      entityId: documentId,
      metadata: { extractionId: updated.id, provider: updated.provider, model: updated.model, status: updated.status }
    });
    return { extraction: updated };
  } catch (error) {
    const failed = await prisma.documentAiExtraction.update({
      where: { id: extraction.id },
      data: {
        status: "FAILED",
        errorMessage: error instanceof Error ? error.message.slice(0, 900) : "PROVIDER_ERROR"
      }
    });
    throw Object.assign(new DocumentAiError("PROVIDER_ERROR"), { extraction: failed });
  }
}

export async function applyDocumentAnalysis(
  prisma: PrismaClient,
  actor: CurrentUser,
  documentId: string,
  extractionId?: string
) {
  const document = await getScopedDocument(prisma, actor, documentId);
  const extraction = await prisma.documentAiExtraction.findFirst({
    where: {
      id: extractionId,
      documentId,
      organizationId: actor.organizationId,
      status: "COMPLETED"
    },
    orderBy: { createdAt: "desc" }
  });
  if (!extraction?.resultJson) throw new DocumentAiError("NOT_FOUND");

  const result = JSON.parse(extraction.resultJson) as DocumentAiResult;
  const professionalData: Prisma.ProfessionalUpdateInput = {};
  const licenseData: Prisma.LicenseUpdateInput = {};
  const changed: Record<string, { from: unknown; to: unknown }> = {};
  const warnings: string[] = [];

  const professionalName = fieldValue(result.fields.professionalName);
  const cpf = digitsOnly(result.fields.cpf.value);
  if (professionalName && professionalName !== document.professional.name) {
    professionalData.name = professionalName;
    changed.professionalName = { from: document.professional.name, to: professionalName };
  }
  if (cpf && cpf !== document.professional.cpf) {
    professionalData.cpf = cpf;
    changed.cpf = { from: document.professional.cpf, to: cpf };
  }

  const licenseNumber = fieldValue(result.fields.licenseNumber);
  const issuer = fieldValue(result.fields.issuer)?.toUpperCase() ?? null;
  const uf = normalizeUf(result.fields.uf.value);
  const issuedAt = dateFromIso(normalizeDate(result.fields.issuedAt.value));
  const expiresAt = dateFromIso(normalizeDate(result.fields.expiresAt.value));
  if (licenseNumber && licenseNumber !== document.license.number) {
    licenseData.number = licenseNumber;
    changed.licenseNumber = { from: document.license.number, to: licenseNumber };
  }
  if (issuer && issuer !== document.license.issuer) {
    licenseData.issuer = issuer;
    changed.issuer = { from: document.license.issuer, to: issuer };
  }
  if (uf && uf !== document.license.uf) {
    licenseData.uf = uf;
    changed.uf = { from: document.license.uf, to: uf };
  }
  if (issuedAt && issuedAt.toISOString() !== document.license.issuedAt?.toISOString()) {
    licenseData.issuedAt = issuedAt;
    changed.issuedAt = { from: document.license.issuedAt?.toISOString() ?? null, to: issuedAt.toISOString() };
  }
  if (expiresAt && expiresAt.toISOString() !== document.license.expiresAt?.toISOString()) {
    licenseData.expiresAt = expiresAt;
    changed.expiresAt = { from: document.license.expiresAt?.toISOString() ?? null, to: expiresAt.toISOString() };
  }

  const licenseTypeName = fieldValue(result.fields.licenseTypeName);
  if (licenseTypeName && licenseTypeName.toLowerCase() !== document.license.licenseType.name.toLowerCase()) {
    const licenseType = await prisma.licenseType.findFirst({
      where: { organizationId: actor.organizationId, name: { equals: licenseTypeName } }
    });
    if (licenseType) {
      licenseData.licenseType = { connect: { id: licenseType.id } };
      changed.licenseTypeName = { from: document.license.licenseType.name, to: licenseType.name };
    } else {
      warnings.push(`Tipo de licenca "${licenseTypeName}" nao encontrado; cadastre ou ajuste manualmente.`);
    }
  }

  if (Object.keys(professionalData).length) {
    await prisma.professional.update({ where: { id: document.professionalId }, data: professionalData });
  }
  if (Object.keys(licenseData).length) {
    await prisma.license.update({ where: { id: document.licenseId }, data: licenseData });
    await recalculateLicenses(prisma, actor, { licenseId: document.licenseId });
  }

  const applied = await prisma.documentAiExtraction.update({
    where: { id: extraction.id },
    data: { appliedAt: new Date(), appliedById: actor.id }
  });
  await recordAuditLog(prisma, {
    organizationId: actor.organizationId,
    actorId: actor.id,
    action: "document_ai.apply",
    entityType: "Document",
    entityId: documentId,
    metadata: { extractionId: extraction.id, changed, warnings }
  });

  return { extraction: applied, changed, warnings };
}
