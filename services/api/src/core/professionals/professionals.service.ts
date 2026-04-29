import type { Prisma, PrismaClient } from "@prisma/client";
import type { CurrentUser } from "@sylembra/shared";
import { recordAuditLog } from "../audit/audit.service.js";

export class ProfessionalError extends Error {
  constructor(public readonly code: "NOT_FOUND" | "INVALID_INPUT" | "FORBIDDEN" | "CPF_TAKEN" | "USER_LINKED") {
    super(code);
  }
}

export interface ProfessionalInput {
  unitId?: string;
  sectorId?: string;
  responsibleRtId?: string | null;
  userId?: string | null;
  name?: string;
  cpf?: string | null;
  email?: string | null;
  phone?: string | null;
  position?: string | null;
  active?: boolean;
  notes?: string | null;
}

export interface ProfessionalFilters {
  active?: boolean;
  unitId?: string;
  sectorId?: string;
  responsibleRtId?: string;
  query?: string;
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

function cleanCpf(value: unknown) {
  const text = cleanOptionalText(value);
  if (text === undefined || text === null) return text;
  const digits = text.replace(/\D/g, "");
  return digits.length > 0 ? digits : null;
}

export function parseProfessionalInput(payload: unknown): ProfessionalInput {
  const input = (payload ?? {}) as Record<string, unknown>;
  return {
    unitId: cleanText(input.unitId),
    sectorId: cleanText(input.sectorId),
    responsibleRtId: cleanOptionalText(input.responsibleRtId),
    userId: cleanOptionalText(input.userId),
    name: cleanText(input.name),
    cpf: cleanCpf(input.cpf),
    email: cleanOptionalText(input.email)?.toLowerCase() ?? cleanOptionalText(input.email),
    phone: cleanOptionalText(input.phone),
    position: cleanOptionalText(input.position),
    active: cleanBoolean(input.active),
    notes: cleanOptionalText(input.notes)
  };
}

export function parseProfessionalFilters(query: Record<string, unknown>): ProfessionalFilters {
  const active = query.active === "true" ? true : query.active === "false" ? false : undefined;
  return {
    active,
    unitId: cleanText(query.unitId),
    sectorId: cleanText(query.sectorId),
    responsibleRtId: cleanText(query.responsibleRtId),
    query: cleanText(query.query)
  };
}

function scopedWhere(actor: CurrentUser): Prisma.ProfessionalWhereInput {
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

  throw new ProfessionalError("FORBIDDEN");
}

function applyFilters(filters: ProfessionalFilters): Prisma.ProfessionalWhereInput {
  return {
    active: filters.active,
    unitId: filters.unitId,
    sectorId: filters.sectorId,
    responsibleRtId: filters.responsibleRtId,
    OR: filters.query
      ? [
          { name: { contains: filters.query } },
          { cpf: { contains: filters.query } },
          { email: { contains: filters.query } },
          { position: { contains: filters.query } }
        ]
      : undefined
  };
}

function includeProfessionalRelations() {
  return {
    unit: true,
    sector: true,
    responsibleRt: { select: { id: true, name: true, email: true, role: true } },
    user: { select: { id: true, name: true, email: true, role: true, active: true } },
    licenses: {
      include: { licenseType: true },
      orderBy: [{ expiresAt: "asc" as const }, { createdAt: "desc" as const }]
    },
    documents: { orderBy: { createdAt: "desc" as const } },
    notificationJobs: { orderBy: { createdAt: "desc" as const }, take: 10 }
  };
}

async function ensureAdmin(actor: CurrentUser) {
  if (actor.role !== "ADMIN") {
    throw new ProfessionalError("FORBIDDEN");
  }
}

async function ensureReferences(prisma: PrismaClient, actor: CurrentUser, input: ProfessionalInput) {
  if (input.unitId) {
    const unit = await prisma.unit.findFirst({ where: { id: input.unitId, organizationId: actor.organizationId } });
    if (!unit) throw new ProfessionalError("INVALID_INPUT");
  }

  if (input.sectorId) {
    const sector = await prisma.sector.findFirst({
      where: {
        id: input.sectorId,
        unit: {
          organizationId: actor.organizationId,
          id: input.unitId
        }
      }
    });
    if (!sector) throw new ProfessionalError("INVALID_INPUT");
  }

  if (input.responsibleRtId) {
    const rt = await prisma.user.findFirst({
      where: { id: input.responsibleRtId, organizationId: actor.organizationId, role: "RT", active: true }
    });
    if (!rt) throw new ProfessionalError("INVALID_INPUT");
  }

  if (input.userId) {
    const linkedUser = await prisma.user.findFirst({ where: { id: input.userId, organizationId: actor.organizationId } });
    if (!linkedUser) throw new ProfessionalError("INVALID_INPUT");
  }
}

async function ensureCpfAvailable(prisma: PrismaClient, actor: CurrentUser, cpf: string | null | undefined, exceptId?: string) {
  if (!cpf) return;
  const existing = await prisma.professional.findFirst({ where: { organizationId: actor.organizationId, cpf } });
  if (existing && existing.id !== exceptId) {
    throw new ProfessionalError("CPF_TAKEN");
  }
}

async function ensureUserAvailable(
  prisma: PrismaClient,
  actor: CurrentUser,
  userId: string | null | undefined,
  exceptId?: string
) {
  if (!userId) return;
  const existing = await prisma.professional.findFirst({ where: { organizationId: actor.organizationId, userId } });
  if (existing && existing.id !== exceptId) {
    throw new ProfessionalError("USER_LINKED");
  }
}

export async function listProfessionals(prisma: PrismaClient, actor: CurrentUser, filters: ProfessionalFilters) {
  const where = { AND: [scopedWhere(actor), applyFilters(filters)] };
  const [items, total] = await Promise.all([
    prisma.professional.findMany({
      where,
      include: {
        unit: true,
        sector: true,
        responsibleRt: { select: { id: true, name: true, email: true, role: true } },
        user: { select: { id: true, name: true, email: true, role: true, active: true } },
        _count: { select: { licenses: true, documents: true, notificationJobs: true } }
      },
      orderBy: [{ active: "desc" }, { name: "asc" }]
    }),
    prisma.professional.count({ where })
  ]);

  return { items, total };
}

export async function getProfessional(prisma: PrismaClient, actor: CurrentUser, professionalId: string) {
  const professional = await prisma.professional.findFirst({
    where: { AND: [scopedWhere(actor), { id: professionalId }] },
    include: includeProfessionalRelations()
  });
  if (!professional) {
    throw new ProfessionalError("NOT_FOUND");
  }
  return professional;
}

export async function createProfessional(prisma: PrismaClient, actor: CurrentUser, input: ProfessionalInput) {
  await ensureAdmin(actor);
  if (!input.name || !input.unitId || !input.sectorId) {
    throw new ProfessionalError("INVALID_INPUT");
  }
  await ensureReferences(prisma, actor, input);
  await ensureCpfAvailable(prisma, actor, input.cpf);
  await ensureUserAvailable(prisma, actor, input.userId);

  const professional = await prisma.professional.create({
    data: {
      organizationId: actor.organizationId,
      unitId: input.unitId,
      sectorId: input.sectorId,
      responsibleRtId: input.responsibleRtId,
      userId: input.userId,
      name: input.name,
      cpf: input.cpf,
      email: input.email,
      phone: input.phone,
      position: input.position,
      active: input.active ?? true,
      notes: input.notes
    },
    include: includeProfessionalRelations()
  });

  await recordAuditLog(prisma, {
    organizationId: actor.organizationId,
    actorId: actor.id,
    action: "professional.create",
    entityType: "Professional",
    entityId: professional.id,
    metadata: { name: professional.name, cpf: professional.cpf, unitId: professional.unitId, sectorId: professional.sectorId }
  });

  return professional;
}

export async function updateProfessional(
  prisma: PrismaClient,
  actor: CurrentUser,
  professionalId: string,
  input: ProfessionalInput
) {
  await ensureAdmin(actor);
  const existing = await prisma.professional.findFirst({
    where: { id: professionalId, organizationId: actor.organizationId }
  });
  if (!existing) throw new ProfessionalError("NOT_FOUND");

  if (
    !input.name &&
    input.unitId === undefined &&
    input.sectorId === undefined &&
    input.responsibleRtId === undefined &&
    input.userId === undefined &&
    input.cpf === undefined &&
    input.email === undefined &&
    input.phone === undefined &&
    input.position === undefined &&
    input.active === undefined &&
    input.notes === undefined
  ) {
    throw new ProfessionalError("INVALID_INPUT");
  }

  const normalizedInput = {
    ...input,
    unitId: input.unitId ?? existing.unitId,
    sectorId: input.sectorId ?? existing.sectorId
  };
  await ensureReferences(prisma, actor, normalizedInput);
  await ensureCpfAvailable(prisma, actor, input.cpf, professionalId);
  await ensureUserAvailable(prisma, actor, input.userId, professionalId);

  const professional = await prisma.professional.update({
    where: { id: professionalId },
    data: input,
    include: includeProfessionalRelations()
  });

  await recordAuditLog(prisma, {
    organizationId: actor.organizationId,
    actorId: actor.id,
    action: input.active === false ? "professional.deactivate" : "professional.update",
    entityType: "Professional",
    entityId: professional.id,
    metadata: input
  });

  return professional;
}
