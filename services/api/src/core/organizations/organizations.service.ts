import type { PrismaClient } from "@prisma/client";
import type { ApiEnv } from "../../config/env.js";
import { loadEnv } from "../../config/env.js";
import { recordAuditLog } from "../audit/audit.service.js";
import { optionalBoolean, optionalString, parseObjectPayload } from "../validation/input-validation.js";

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

export interface OrganizationSettings {
  defaultTags: string[];
  dashboardDefaultRange: "7" | "30" | "90";
  dashboardDefaultBucket: "day" | "week" | "month";
}

export interface OrganizationSettingsUpdateInput {
  name?: string;
  document?: string | null;
  logoUrl?: string | null;
  defaultTags?: string[];
  dashboardDefaultRange?: OrganizationSettings["dashboardDefaultRange"];
  dashboardDefaultBucket?: OrganizationSettings["dashboardDefaultBucket"];
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

function cleanOptionalText(value: unknown) {
  if (value === null) return null;
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function cleanOptionalUrl(value: unknown) {
  const cleaned = cleanOptionalText(value);
  if (cleaned === undefined || cleaned === null) return cleaned;
  if (cleaned.length > 500) return undefined;
  if (cleaned.startsWith("/") || /^https?:\/\//i.test(cleaned)) return cleaned;
  return undefined;
}

function cleanTags(value: unknown) {
  if (!Array.isArray(value)) return undefined;
  const tags = new Set<string>();
  for (const item of value) {
    if (typeof item !== "string") continue;
    const tag = item.trim().replace(/^#/, "").toLowerCase();
    if (/^[a-z0-9][a-z0-9_-]{1,32}$/.test(tag)) {
      tags.add(tag);
    }
  }
  return [...tags].sort((left, right) => left.localeCompare(right)).slice(0, 30);
}

const fallbackSettings: OrganizationSettings = {
  defaultTags: ["campanhas", "notas", "processo", "ranking", "sac", "treinamento", "vendas"],
  dashboardDefaultRange: "30",
  dashboardDefaultBucket: "day"
};

function parseSettingsJson(value: string | null | undefined): OrganizationSettings {
  if (!value) return fallbackSettings;
  try {
    const parsed = JSON.parse(value) as Partial<OrganizationSettings>;
    return {
      defaultTags: cleanTags(parsed.defaultTags) ?? fallbackSettings.defaultTags,
      dashboardDefaultRange:
        parsed.dashboardDefaultRange === "7" || parsed.dashboardDefaultRange === "30" || parsed.dashboardDefaultRange === "90"
          ? parsed.dashboardDefaultRange
          : fallbackSettings.dashboardDefaultRange,
      dashboardDefaultBucket:
        parsed.dashboardDefaultBucket === "day" || parsed.dashboardDefaultBucket === "week" || parsed.dashboardDefaultBucket === "month"
          ? parsed.dashboardDefaultBucket
          : fallbackSettings.dashboardDefaultBucket
    };
  } catch {
    return fallbackSettings;
  }
}

function serializeSettings(currentSettingsJson: string | null | undefined, input: OrganizationSettingsUpdateInput) {
  const current = parseSettingsJson(currentSettingsJson);
  return JSON.stringify({
    defaultTags: input.defaultTags ?? current.defaultTags,
    dashboardDefaultRange: input.dashboardDefaultRange ?? current.dashboardDefaultRange,
    dashboardDefaultBucket: input.dashboardDefaultBucket ?? current.dashboardDefaultBucket
  } satisfies OrganizationSettings);
}

export function parseOrganizationUpdate(payload: unknown): OrganizationUpdateInput {
  return parseObjectPayload(payload ?? {}, (input) => ({
    name: optionalString(input, "name", { maxLength: 120 }),
    document: optionalString(input, "document", { maxLength: 40, nullable: true }),
    active: optionalBoolean(input, "active")
  }));
}

export function parseOrganizationSettingsUpdate(payload: unknown): OrganizationSettingsUpdateInput {
  return parseObjectPayload(payload ?? {}, (input) => ({
    name: optionalString(input, "name", { maxLength: 120 }),
    document: optionalString(input, "document", { maxLength: 40, nullable: true }),
    logoUrl: cleanOptionalUrl(optionalString(input, "logoUrl", { maxLength: 500, nullable: true })),
    defaultTags: cleanTags(input.defaultTags),
    dashboardDefaultRange:
      input.dashboardDefaultRange === "7" || input.dashboardDefaultRange === "30" || input.dashboardDefaultRange === "90"
        ? input.dashboardDefaultRange
        : undefined,
    dashboardDefaultBucket:
      input.dashboardDefaultBucket === "day" || input.dashboardDefaultBucket === "week" || input.dashboardDefaultBucket === "month"
        ? input.dashboardDefaultBucket
        : undefined
  }));
}

export function parseUnitInput(payload: unknown): UnitInput {
  return parseObjectPayload(payload ?? {}, (input) => ({
    name: optionalString(input, "name", { maxLength: 120 }),
    active: optionalBoolean(input, "active")
  }));
}

export function parseSectorInput(payload: unknown): SectorInput {
  return parseObjectPayload(payload ?? {}, (input) => ({
    unitId: optionalString(input, "unitId", { maxLength: 80 }),
    name: optionalString(input, "name", { maxLength: 120 }),
    active: optionalBoolean(input, "active")
  }));
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

export async function getOrganizationSettings(
  prisma: PrismaClient,
  actor: ActorContext,
  env: Pick<ApiEnv, "googleLoginAllowedDomains"> = loadEnv()
) {
  const organization = await prisma.organization.findFirst({
    where: { id: actor.organizationId },
    select: {
      id: true,
      name: true,
      document: true,
      logoUrl: true,
      settingsJson: true,
      active: true,
      updatedAt: true
    }
  });

  if (!organization) {
    throw new OrganizationError("NOT_FOUND");
  }

  return {
    organization: {
      id: organization.id,
      name: organization.name,
      document: organization.document,
      logoUrl: organization.logoUrl,
      active: organization.active,
      updatedAt: organization.updatedAt,
      settings: parseSettingsJson(organization.settingsJson)
    },
    googleLogin: {
      allowedDomains: env.googleLoginAllowedDomains ?? [],
      editable: false,
      source: "env" as const
    }
  };
}

export async function updateOrganizationSettings(
  prisma: PrismaClient,
  actor: ActorContext,
  input: OrganizationSettingsUpdateInput
) {
  const current = await prisma.organization.findFirst({
    where: { id: actor.organizationId },
    select: { id: true, settingsJson: true }
  });
  if (!current) {
    throw new OrganizationError("NOT_FOUND");
  }

  const hasSettingsChange =
    input.defaultTags !== undefined || input.dashboardDefaultRange !== undefined || input.dashboardDefaultBucket !== undefined;
  if (!input.name && input.document === undefined && input.logoUrl === undefined && !hasSettingsChange) {
    throw new OrganizationError("INVALID_INPUT");
  }

  const organization = await prisma.organization.update({
    where: { id: actor.organizationId },
    data: {
      name: input.name,
      document: input.document,
      logoUrl: input.logoUrl,
      settingsJson: hasSettingsChange ? serializeSettings(current.settingsJson, input) : undefined
    },
    select: {
      id: true,
      name: true,
      document: true,
      logoUrl: true,
      settingsJson: true,
      active: true,
      updatedAt: true
    }
  });

  await recordAuditLog(prisma, {
    organizationId: actor.organizationId,
    actorId: actor.id,
    action: "organization.settings_update",
    entityType: "Organization",
    entityId: organization.id,
    metadata: input
  });

  return {
    id: organization.id,
    name: organization.name,
    document: organization.document,
    logoUrl: organization.logoUrl,
    active: organization.active,
    updatedAt: organization.updatedAt,
    settings: parseSettingsJson(organization.settingsJson)
  };
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
