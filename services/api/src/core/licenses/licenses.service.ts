import type { Prisma, PrismaClient } from "@prisma/client";
import { licenseStatuses, type CurrentUser, type LicenseStatus } from "@alwaystrack/shared";
import { recordAuditLog } from "../audit/audit.service.js";
import { calculateLicenseStatus } from "./status.js";

export class LicenseManagementError extends Error {
  constructor(
    public readonly code:
      | "NOT_FOUND"
      | "INVALID_INPUT"
      | "FORBIDDEN"
      | "LICENSE_TYPE_TAKEN"
      | "LICENSE_NUMBER_TAKEN"
  ) {
    super(code);
  }
}

export interface LicenseTypeInput {
  name?: string;
  description?: string | null;
  defaultWarningDays?: string | null;
  active?: boolean;
}

export interface LicenseInput {
  professionalId?: string;
  licenseTypeId?: string;
  number?: string | null;
  issuer?: string | null;
  uf?: string | null;
  issuedAt?: Date | null;
  expiresAt?: Date | null;
  status?: LicenseStatus;
  notes?: string | null;
}

export interface LicenseFilters {
  professionalId?: string;
  licenseTypeId?: string;
  status?: LicenseStatus;
  query?: string;
}

export interface RecalculateLicensesInput {
  licenseId?: string;
}

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

function cleanBoolean(value: unknown) {
  return typeof value === "boolean" ? value : undefined;
}

function cleanStatus(value: unknown) {
  return typeof value === "string" && licenseStatuses.includes(value as LicenseStatus)
    ? (value as LicenseStatus)
    : undefined;
}

function cleanDate(value: unknown) {
  if (value === null) return null;
  if (typeof value !== "string" || !value.trim()) return undefined;
  const date = new Date(`${value.trim()}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export function parseLicenseTypeInput(payload: unknown): LicenseTypeInput {
  const input = (payload ?? {}) as Record<string, unknown>;
  return {
    name: cleanText(input.name),
    description: cleanOptionalText(input.description),
    defaultWarningDays: cleanOptionalText(input.defaultWarningDays),
    active: cleanBoolean(input.active)
  };
}

export function parseLicenseInput(payload: unknown): LicenseInput {
  const input = (payload ?? {}) as Record<string, unknown>;
  return {
    professionalId: cleanText(input.professionalId),
    licenseTypeId: cleanText(input.licenseTypeId),
    number: cleanOptionalText(input.number),
    issuer: cleanOptionalText(input.issuer),
    uf: cleanOptionalText(input.uf)?.toUpperCase() ?? cleanOptionalText(input.uf),
    issuedAt: cleanDate(input.issuedAt),
    expiresAt: cleanDate(input.expiresAt),
    status: cleanStatus(input.status),
    notes: cleanOptionalText(input.notes)
  };
}

export function parseLicenseFilters(query: Record<string, unknown>): LicenseFilters {
  return {
    professionalId: cleanText(query.professionalId),
    licenseTypeId: cleanText(query.licenseTypeId),
    status: cleanStatus(query.status),
    query: cleanText(query.query)
  };
}

export function parseRecalculateLicensesInput(payload: unknown): RecalculateLicensesInput {
  const input = (payload ?? {}) as Record<string, unknown>;
  return { licenseId: cleanText(input.licenseId) };
}

function scopedProfessionalWhere(actor: CurrentUser): Prisma.ProfessionalWhereInput {
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

  throw new LicenseManagementError("FORBIDDEN");
}

function licenseWhere(actor: CurrentUser, filters: LicenseFilters): Prisma.LicenseWhereInput {
  return {
    professional: scopedProfessionalWhere(actor),
    professionalId: filters.professionalId,
    licenseTypeId: filters.licenseTypeId,
    status: filters.status,
    OR: filters.query
      ? [
          { number: { contains: filters.query } },
          { issuer: { contains: filters.query } },
          { uf: { contains: filters.query } },
          { professional: { name: { contains: filters.query } } },
          { professional: { cpf: { contains: filters.query } } },
          { licenseType: { name: { contains: filters.query } } }
        ]
      : undefined
  };
}

function includeLicenseRelations() {
  return {
    licenseType: true,
    professional: {
      include: {
        unit: true,
        sector: true,
        responsibleRt: { select: { id: true, name: true, email: true, role: true } }
      }
    },
    validatedBy: { select: { id: true, name: true, email: true, role: true } },
    _count: { select: { documents: true, notificationJobs: true } }
  };
}

function includeLicenseStatusRelations() {
  return {
    licenseType: {
      include: {
        notificationRules: true
      }
    },
    documents: {
      select: { status: true }
    }
  };
}

type LicenseForStatus = Prisma.LicenseGetPayload<{ include: ReturnType<typeof includeLicenseStatusRelations> }>;

function deriveLicenseStatus(license: LicenseForStatus) {
  return calculateLicenseStatus({
    currentStatus: license.status,
    expiresAt: license.expiresAt,
    defaultWarningDays: license.licenseType.defaultWarningDays,
    documents: license.documents,
    notificationRules: license.licenseType.notificationRules
  });
}

async function ensureAdmin(actor: CurrentUser) {
  if (actor.role !== "ADMIN") {
    throw new LicenseManagementError("FORBIDDEN");
  }
}

async function ensureLicenseTypeNameAvailable(
  prisma: PrismaClient,
  actor: CurrentUser,
  name: string | undefined,
  exceptId?: string
) {
  if (!name) return;
  const existing = await prisma.licenseType.findFirst({ where: { organizationId: actor.organizationId, name } });
  if (existing && existing.id !== exceptId) {
    throw new LicenseManagementError("LICENSE_TYPE_TAKEN");
  }
}

async function ensureLicenseNumberAvailable(
  prisma: PrismaClient,
  professionalId: string | undefined,
  licenseTypeId: string | undefined,
  number: string | null | undefined,
  exceptId?: string
) {
  if (!professionalId || !licenseTypeId || !number) return;
  const existing = await prisma.license.findFirst({ where: { professionalId, licenseTypeId, number } });
  if (existing && existing.id !== exceptId) {
    throw new LicenseManagementError("LICENSE_NUMBER_TAKEN");
  }
}

async function ensureProfessional(prisma: PrismaClient, actor: CurrentUser, professionalId: string | undefined) {
  if (!professionalId) throw new LicenseManagementError("INVALID_INPUT");
  const professional = await prisma.professional.findFirst({
    where: { id: professionalId, organizationId: actor.organizationId }
  });
  if (!professional) throw new LicenseManagementError("INVALID_INPUT");
  return professional;
}

async function ensureLicenseType(prisma: PrismaClient, actor: CurrentUser, licenseTypeId: string | undefined) {
  if (!licenseTypeId) throw new LicenseManagementError("INVALID_INPUT");
  const licenseType = await prisma.licenseType.findFirst({
    where: { id: licenseTypeId, organizationId: actor.organizationId }
  });
  if (!licenseType) throw new LicenseManagementError("INVALID_INPUT");
  return licenseType;
}

export async function listLicenseTypes(prisma: PrismaClient, actor: CurrentUser) {
  const items = await prisma.licenseType.findMany({
    where: { organizationId: actor.organizationId },
    orderBy: [{ active: "desc" }, { name: "asc" }]
  });
  return { items, total: items.length };
}

export async function createLicenseType(prisma: PrismaClient, actor: CurrentUser, input: LicenseTypeInput) {
  await ensureAdmin(actor);
  if (!input.name) throw new LicenseManagementError("INVALID_INPUT");
  await ensureLicenseTypeNameAvailable(prisma, actor, input.name);

  const licenseType = await prisma.licenseType.create({
    data: {
      organizationId: actor.organizationId,
      name: input.name,
      description: input.description,
      defaultWarningDays: input.defaultWarningDays,
      active: input.active ?? true
    }
  });

  await recordAuditLog(prisma, {
    organizationId: actor.organizationId,
    actorId: actor.id,
    action: "license_type.create",
    entityType: "LicenseType",
    entityId: licenseType.id,
    metadata: { name: licenseType.name, active: licenseType.active }
  });

  return licenseType;
}

export async function updateLicenseType(
  prisma: PrismaClient,
  actor: CurrentUser,
  licenseTypeId: string,
  input: LicenseTypeInput
) {
  await ensureAdmin(actor);
  const existing = await prisma.licenseType.findFirst({ where: { id: licenseTypeId, organizationId: actor.organizationId } });
  if (!existing) throw new LicenseManagementError("NOT_FOUND");

  if (!input.name && input.description === undefined && input.defaultWarningDays === undefined && input.active === undefined) {
    throw new LicenseManagementError("INVALID_INPUT");
  }

  await ensureLicenseTypeNameAvailable(prisma, actor, input.name, licenseTypeId);

  const licenseType = await prisma.licenseType.update({
    where: { id: licenseTypeId },
    data: input
  });

  await recordAuditLog(prisma, {
    organizationId: actor.organizationId,
    actorId: actor.id,
    action: input.active === false ? "license_type.deactivate" : "license_type.update",
    entityType: "LicenseType",
    entityId: licenseType.id,
    metadata: input
  });

  return licenseType;
}

export async function listLicenses(prisma: PrismaClient, actor: CurrentUser, filters: LicenseFilters) {
  const where = licenseWhere(actor, filters);
  const [items, total] = await Promise.all([
    prisma.license.findMany({
      where,
      include: includeLicenseRelations(),
      orderBy: [{ expiresAt: "asc" }, { createdAt: "desc" }]
    }),
    prisma.license.count({ where })
  ]);

  return { items, total };
}

export async function createLicense(prisma: PrismaClient, actor: CurrentUser, input: LicenseInput) {
  await ensureAdmin(actor);
  if (!input.professionalId || !input.licenseTypeId) {
    throw new LicenseManagementError("INVALID_INPUT");
  }
  await ensureProfessional(prisma, actor, input.professionalId);
  await ensureLicenseType(prisma, actor, input.licenseTypeId);
  await ensureLicenseNumberAvailable(prisma, input.professionalId, input.licenseTypeId, input.number);

  const initialStatus = input.status ?? "PENDING_DOCUMENT";
  const created = await prisma.license.create({
    data: {
      professionalId: input.professionalId,
      licenseTypeId: input.licenseTypeId,
      number: input.number,
      issuer: input.issuer,
      uf: input.uf,
      issuedAt: input.issuedAt,
      expiresAt: input.expiresAt,
      status: initialStatus,
      notes: input.notes,
      validatedById: actor.id,
      lastValidatedAt: new Date()
    },
    include: includeLicenseStatusRelations()
  });

  const derivedStatus = input.status ?? deriveLicenseStatus(created);
  const license = await prisma.license.update({
    where: { id: created.id },
    data: { status: derivedStatus },
    include: includeLicenseRelations()
  });

  await recordAuditLog(prisma, {
    organizationId: actor.organizationId,
    actorId: actor.id,
    action: "license.create",
    entityType: "License",
    entityId: license.id,
    metadata: {
      professionalId: license.professionalId,
      licenseTypeId: license.licenseTypeId,
      number: license.number,
      status: license.status
    }
  });

  return license;
}

export async function updateLicense(prisma: PrismaClient, actor: CurrentUser, licenseId: string, input: LicenseInput) {
  await ensureAdmin(actor);
  const existing = await prisma.license.findFirst({
    where: { id: licenseId, professional: { organizationId: actor.organizationId } }
  });
  if (!existing) throw new LicenseManagementError("NOT_FOUND");

  if (
    input.professionalId === undefined &&
    input.licenseTypeId === undefined &&
    input.number === undefined &&
    input.issuer === undefined &&
    input.uf === undefined &&
    input.issuedAt === undefined &&
    input.expiresAt === undefined &&
    input.status === undefined &&
    input.notes === undefined
  ) {
    throw new LicenseManagementError("INVALID_INPUT");
  }

  const professionalId = input.professionalId ?? existing.professionalId;
  const licenseTypeId = input.licenseTypeId ?? existing.licenseTypeId;
  const number = input.number === undefined ? existing.number : input.number;
  if (input.professionalId) await ensureProfessional(prisma, actor, input.professionalId);
  if (input.licenseTypeId) await ensureLicenseType(prisma, actor, input.licenseTypeId);
  await ensureLicenseNumberAvailable(prisma, professionalId, licenseTypeId, number, licenseId);

  const license = await prisma.license.update({
    where: { id: licenseId },
    data: {
      professionalId: input.professionalId,
      licenseTypeId: input.licenseTypeId,
      number: input.number,
      issuer: input.issuer,
      uf: input.uf,
      issuedAt: input.issuedAt,
      expiresAt: input.expiresAt,
      status: input.status,
      notes: input.notes,
      validatedById: input.status ? actor.id : undefined,
      lastValidatedAt: input.status ? new Date() : undefined
    },
    include: includeLicenseRelations()
  });

  await recordAuditLog(prisma, {
    organizationId: actor.organizationId,
    actorId: actor.id,
    action: input.status === "INACTIVE" ? "license.deactivate" : "license.update",
    entityType: "License",
    entityId: license.id,
    metadata: input
  });

  return license;
}

export async function recalculateLicenses(
  prisma: PrismaClient,
  actor: CurrentUser,
  input: RecalculateLicensesInput = {}
) {
  if (actor.role !== "ADMIN" && !input.licenseId) {
    throw new LicenseManagementError("FORBIDDEN");
  }

  const licenses = await prisma.license.findMany({
    where: {
      id: input.licenseId,
      professional: scopedProfessionalWhere(actor)
    },
    include: includeLicenseStatusRelations(),
    orderBy: { createdAt: "asc" }
  });

  if (input.licenseId && licenses.length === 0) {
    throw new LicenseManagementError("NOT_FOUND");
  }

  let changed = 0;
  const items = [];
  for (const license of licenses) {
    const nextStatus = deriveLicenseStatus(license);
    if (nextStatus === license.status) {
      items.push({ id: license.id, previousStatus: license.status, status: nextStatus, changed: false });
      continue;
    }

    await prisma.license.update({
      where: { id: license.id },
      data: { status: nextStatus }
    });
    await recordAuditLog(prisma, {
      organizationId: actor.organizationId,
      actorId: actor.id,
      action: "license.status_recalculate",
      entityType: "License",
      entityId: license.id,
      metadata: { previousStatus: license.status, status: nextStatus }
    });
    changed += 1;
    items.push({ id: license.id, previousStatus: license.status, status: nextStatus, changed: true });
  }

  return { total: licenses.length, changed, items };
}
