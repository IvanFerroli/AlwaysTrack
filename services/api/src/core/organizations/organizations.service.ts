import type { PrismaClient } from "@prisma/client";
import { recordAuditLog } from "../audit/audit.service.js";

export class OrganizationError extends Error {
  constructor(public readonly code: "NOT_FOUND" | "INVALID_INPUT") {
    super(code);
  }
}

export interface ActorContext {
  id: string;
  organizationId: string;
}

export interface OrganizationUpdateInput {
  name?: string;
  document?: string | null;
  active?: boolean;
}

export interface UnitInput {
  name?: string;
  active?: boolean;
}

export interface SectorInput {
  unitId?: string;
  name?: string;
  active?: boolean;
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

export function parseOrganizationUpdate(payload: unknown): OrganizationUpdateInput {
  const input = (payload ?? {}) as Record<string, unknown>;
  return {
    name: cleanText(input.name),
    document: cleanOptionalText(input.document),
    active: cleanBoolean(input.active)
  };
}

export function parseUnitInput(payload: unknown): UnitInput {
  const input = (payload ?? {}) as Record<string, unknown>;
  return {
    name: cleanText(input.name),
    active: cleanBoolean(input.active)
  };
}

export function parseSectorInput(payload: unknown): SectorInput {
  const input = (payload ?? {}) as Record<string, unknown>;
  return {
    unitId: cleanText(input.unitId),
    name: cleanText(input.name),
    active: cleanBoolean(input.active)
  };
}

export async function getOrganizationTree(prisma: PrismaClient, actor: ActorContext) {
  const organization = await prisma.organization.findFirst({
    where: { id: actor.organizationId },
    include: {
      units: {
        orderBy: [{ active: "desc" }, { name: "asc" }],
        include: {
          sectors: {
            orderBy: [{ active: "desc" }, { name: "asc" }]
          }
        }
      }
    }
  });

  if (!organization) {
    throw new OrganizationError("NOT_FOUND");
  }

  return organization;
}

export async function updateCurrentOrganization(
  prisma: PrismaClient,
  actor: ActorContext,
  input: OrganizationUpdateInput
) {
  if (!input.name && input.document === undefined && input.active === undefined) {
    throw new OrganizationError("INVALID_INPUT");
  }

  const organization = await prisma.organization.update({
    where: { id: actor.organizationId },
    data: {
      name: input.name,
      document: input.document,
      active: input.active
    }
  });

  await recordAuditLog(prisma, {
    organizationId: actor.organizationId,
    actorId: actor.id,
    action: input.active === false ? "organization.deactivate" : "organization.update",
    entityType: "Organization",
    entityId: organization.id,
    metadata: input
  });

  return organization;
}

export async function createUnit(prisma: PrismaClient, actor: ActorContext, input: UnitInput) {
  if (!input.name) {
    throw new OrganizationError("INVALID_INPUT");
  }

  const unit = await prisma.unit.create({
    data: {
      organizationId: actor.organizationId,
      name: input.name,
      active: input.active ?? true
    }
  });

  await recordAuditLog(prisma, {
    organizationId: actor.organizationId,
    actorId: actor.id,
    action: "unit.create",
    entityType: "Unit",
    entityId: unit.id,
    metadata: { name: unit.name, active: unit.active }
  });

  return unit;
}

export async function updateUnit(prisma: PrismaClient, actor: ActorContext, unitId: string, input: UnitInput) {
  const existing = await prisma.unit.findFirst({ where: { id: unitId, organizationId: actor.organizationId } });
  if (!existing) {
    throw new OrganizationError("NOT_FOUND");
  }

  if (!input.name && input.active === undefined) {
    throw new OrganizationError("INVALID_INPUT");
  }

  const unit = await prisma.unit.update({
    where: { id: unitId },
    data: {
      name: input.name,
      active: input.active
    }
  });

  await recordAuditLog(prisma, {
    organizationId: actor.organizationId,
    actorId: actor.id,
    action: input.active === false ? "unit.deactivate" : "unit.update",
    entityType: "Unit",
    entityId: unit.id,
    metadata: input
  });

  return unit;
}

export async function createSector(prisma: PrismaClient, actor: ActorContext, input: SectorInput) {
  if (!input.unitId || !input.name) {
    throw new OrganizationError("INVALID_INPUT");
  }

  const unit = await prisma.unit.findFirst({ where: { id: input.unitId, organizationId: actor.organizationId } });
  if (!unit) {
    throw new OrganizationError("NOT_FOUND");
  }

  const sector = await prisma.sector.create({
    data: {
      unitId: input.unitId,
      name: input.name,
      active: input.active ?? true
    }
  });

  await recordAuditLog(prisma, {
    organizationId: actor.organizationId,
    actorId: actor.id,
    action: "sector.create",
    entityType: "Sector",
    entityId: sector.id,
    metadata: { unitId: sector.unitId, name: sector.name, active: sector.active }
  });

  return sector;
}

export async function updateSector(prisma: PrismaClient, actor: ActorContext, sectorId: string, input: SectorInput) {
  const existing = await prisma.sector.findFirst({
    where: {
      id: sectorId,
      unit: { organizationId: actor.organizationId }
    }
  });
  if (!existing) {
    throw new OrganizationError("NOT_FOUND");
  }

  if (input.unitId) {
    const unit = await prisma.unit.findFirst({ where: { id: input.unitId, organizationId: actor.organizationId } });
    if (!unit) {
      throw new OrganizationError("NOT_FOUND");
    }
  }

  if (!input.name && !input.unitId && input.active === undefined) {
    throw new OrganizationError("INVALID_INPUT");
  }

  const sector = await prisma.sector.update({
    where: { id: sectorId },
    data: {
      unitId: input.unitId,
      name: input.name,
      active: input.active
    }
  });

  await recordAuditLog(prisma, {
    organizationId: actor.organizationId,
    actorId: actor.id,
    action: input.active === false ? "sector.deactivate" : "sector.update",
    entityType: "Sector",
    entityId: sector.id,
    metadata: input
  });

  return sector;
}
