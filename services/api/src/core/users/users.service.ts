import type { PrismaClient } from "@prisma/client";
import { commercialUserRoles, userRoles, type UserRole } from "@alwaystrack/shared";
import { recordAuditLog } from "../audit/audit.service.js";
import { hashPassword, validatePasswordPolicy } from "../auth/password.js";
import { parseScopeIds } from "../auth/scope.js";
import {
  optionalBoolean,
  optionalEnum,
  optionalString,
  optionalStringArray,
  parseObjectPayload
} from "../validation/input-validation.js";

export class UserManagementError extends Error {
  constructor(public readonly code: "NOT_FOUND" | "INVALID_INPUT" | "EMAIL_TAKEN" | "SELF_DEACTIVATE") {
    super(code);
  }
}

export interface ActorContext {
  id: string;
  organizationId: string;
}

export interface UserManagementInput {
  name?: string;
  email?: string;
  password?: string;
  role?: UserRole;
  phone?: string | null;
  avatarUrl?: string | null;
  active?: boolean;
  unitScopeIds?: string[];
  sectorScopeIds?: string[];
  sellerCode?: string;
  sellerDisplayName?: string;
  salesGroupId?: string | null;
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

function cleanAvatarUrl(value: unknown) {
  const avatarUrl = cleanOptionalText(value);
  if (avatarUrl === undefined || avatarUrl === null) return avatarUrl;
  if (avatarUrl.length > 500) return undefined;
  if (avatarUrl.startsWith("/")) return avatarUrl;
  try {
    const parsed = new URL(avatarUrl);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? avatarUrl : undefined;
  } catch {
    return undefined;
  }
}

function cleanBoolean(value: unknown) {
  return typeof value === "boolean" ? value : undefined;
}

function cleanScopeIds(value: unknown) {
  if (!Array.isArray(value)) return undefined;
  return [...new Set(value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean))];
}

function cleanRole(value: unknown) {
  return typeof value === "string" && userRoles.includes(value as UserRole) ? (value as UserRole) : undefined;
}

function cleanCommercialCreateRole(value: unknown) {
  const role = cleanRole(value);
  return role && ["ADMIN", "SAC", "VENDEDOR", "SUPERVISOR"].includes(role) ? role : undefined;
}

function isCommercialRole(role: string): role is UserRole {
  return commercialUserRoles.includes(role as (typeof commercialUserRoles)[number]);
}

function cleanPassword(value: unknown) {
  const password = cleanText(value);
  return password;
}

function serializeScopeIds(role: UserRole, scopeIds: string[] | undefined) {
  if (role === "ADMIN") return null;
  return JSON.stringify(scopeIds ?? []);
}

function sanitizeUser<T extends { passwordHash?: string; unitScopeJson: string | null; sectorScopeJson: string | null }>(user: T) {
  const { passwordHash: _passwordHash, unitScopeJson, sectorScopeJson, ...rest } = user;
  return {
    ...rest,
    unitScopeIds: parseScopeIds(unitScopeJson),
    sectorScopeIds: parseScopeIds(sectorScopeJson)
  };
}

function profileSelect() {
  return {
    id: true,
    name: true,
    email: true,
    avatarUrl: true,
    role: true,
    phone: true,
    active: true,
    organizationId: true,
    unitScopeJson: true,
    sectorScopeJson: true,
    createdAt: true,
    updatedAt: true,
    organization: { select: { id: true, name: true } },
    sellerProfile: { include: { salesGroup: true } },
    supervisedSalesGroups: true,
    googleConnection: { select: { id: true, connectedAt: true } }
  } as const;
}

export function parseCreateUserInput(payload: unknown): UserManagementInput {
  return parseObjectPayload(payload, (input) => ({
    name: optionalString(input, "name", { maxLength: 120 }),
    email: optionalString(input, "email", { maxLength: 320 })?.toLowerCase(),
    password: optionalString(input, "password", { maxLength: 256 }),
    role: cleanCommercialCreateRole(optionalEnum(input, "role", userRoles)),
    phone: optionalString(input, "phone", { maxLength: 40, nullable: true }),
    active: optionalBoolean(input, "active"),
    unitScopeIds: cleanScopeIds(optionalStringArray(input, "unitScopeIds", { maxItems: 100, itemMaxLength: 80 })),
    sectorScopeIds: cleanScopeIds(optionalStringArray(input, "sectorScopeIds", { maxItems: 100, itemMaxLength: 80 })),
    sellerCode: optionalString(input, "sellerCode", { maxLength: 40 }),
    sellerDisplayName: optionalString(input, "sellerDisplayName", { maxLength: 120 }),
    salesGroupId: optionalString(input, "salesGroupId", { maxLength: 80, nullable: true })
  }));
}

export function parseUpdateUserInput(payload: unknown): UserManagementInput {
  return parseObjectPayload(payload, (input) => ({
    name: optionalString(input, "name", { maxLength: 120 }),
    email: optionalString(input, "email", { maxLength: 320 })?.toLowerCase(),
    role: optionalEnum(input, "role", userRoles),
    phone: optionalString(input, "phone", { maxLength: 40, nullable: true }),
    active: optionalBoolean(input, "active"),
    unitScopeIds: cleanScopeIds(optionalStringArray(input, "unitScopeIds", { maxItems: 100, itemMaxLength: 80 })),
    sectorScopeIds: cleanScopeIds(optionalStringArray(input, "sectorScopeIds", { maxItems: 100, itemMaxLength: 80 })),
    sellerCode: optionalString(input, "sellerCode", { maxLength: 40 }),
    sellerDisplayName: optionalString(input, "sellerDisplayName", { maxLength: 120 }),
    salesGroupId: optionalString(input, "salesGroupId", { maxLength: 80, nullable: true })
  }));
}

export function parseProfileInput(payload: unknown): UserManagementInput {
  return parseObjectPayload(payload, (input) => ({
    name: optionalString(input, "name", { maxLength: 120 }),
    phone: optionalString(input, "phone", { maxLength: 40, nullable: true }),
    avatarUrl: cleanAvatarUrl(optionalString(input, "avatarUrl", { maxLength: 500, nullable: true }))
  }));
}

export function parseResetPasswordInput(payload: unknown) {
  return parseObjectPayload(payload, (input) => ({ password: optionalString(input, "password", { maxLength: 256 }) }));
}

async function ensureEmailAvailable(prisma: PrismaClient, email: string, exceptUserId?: string) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing && existing.id !== exceptUserId) {
    throw new UserManagementError("EMAIL_TAKEN");
  }
}

async function ensureScopesBelongToOrganization(
  prisma: PrismaClient,
  actor: ActorContext,
  role: UserRole,
  unitScopeIds: string[] | undefined,
  sectorScopeIds: string[] | undefined
) {
  if (role === "ADMIN") return;

  if (unitScopeIds?.length) {
    const count = await prisma.unit.count({
      where: {
        organizationId: actor.organizationId,
        id: { in: unitScopeIds }
      }
    });
    if (count !== unitScopeIds.length) throw new UserManagementError("INVALID_INPUT");
  }

  if (sectorScopeIds?.length) {
    const count = await prisma.sector.count({
      where: {
        id: { in: sectorScopeIds },
        unit: { organizationId: actor.organizationId }
      }
    });
    if (count !== sectorScopeIds.length) throw new UserManagementError("INVALID_INPUT");
  }
}

async function ensureSalesGroupBelongsToOrganization(prisma: PrismaClient, actor: ActorContext, salesGroupId: string | null | undefined) {
  if (!salesGroupId) return;
  const group = await prisma.salesGroup.findFirst({ where: { id: salesGroupId, organizationId: actor.organizationId } });
  if (!group) throw new UserManagementError("INVALID_INPUT");
}

function defaultSellerCode(input: UserManagementInput, userId: string) {
  return (input.sellerCode ?? input.email?.split("@")[0] ?? userId).replace(/[^\w.-]/g, "-").slice(0, 40);
}

async function syncCommercialLinks(prisma: PrismaClient, actor: ActorContext, user: { id: string; name: string; email: string; phone: string | null; role: string }, input: UserManagementInput) {
  await ensureSalesGroupBelongsToOrganization(prisma, actor, input.salesGroupId);

  if (user.role === "VENDEDOR") {
    const existingSeller = await prisma.sellerProfile.findFirst({
      where: { organizationId: actor.organizationId, OR: [{ userId: user.id }, { code: defaultSellerCode(input, user.id) }] }
    });
    const sellerData = {
      userId: user.id,
      salesGroupId: input.salesGroupId ?? existingSeller?.salesGroupId ?? null,
      displayName: input.sellerDisplayName ?? user.name,
      email: user.email,
      phone: user.phone,
      active: true
    };
    if (existingSeller) {
      await prisma.sellerProfile.update({
        where: { id: existingSeller.id },
        data: sellerData
      });
    } else {
      await prisma.sellerProfile.create({
        data: {
          organizationId: actor.organizationId,
          code: defaultSellerCode(input, user.id),
          ...sellerData
        }
      });
    }
  }

  if (user.role === "SUPERVISOR" && input.salesGroupId) {
    await prisma.salesGroup.update({
      where: { id: input.salesGroupId },
      data: { supervisorId: user.id }
    });
  }
}

export async function listManagedUsers(prisma: PrismaClient, actor: ActorContext) {
  const users = await prisma.user.findMany({
    where: { organizationId: actor.organizationId },
    include: {
      sellerProfile: { include: { salesGroup: true } },
      supervisedSalesGroups: true
    },
    orderBy: [{ active: "desc" }, { role: "asc" }, { name: "asc" }]
  });

  return users.map(sanitizeUser);
}

export async function listCommercialUserOptions(prisma: PrismaClient, actor: ActorContext) {
  const [salesGroups, sellers] = await Promise.all([
    prisma.salesGroup.findMany({
      where: { organizationId: actor.organizationId },
      orderBy: [{ active: "desc" }, { name: "asc" }]
    }),
    prisma.sellerProfile.findMany({
      where: { organizationId: actor.organizationId },
      include: { salesGroup: true },
      orderBy: [{ active: "desc" }, { displayName: "asc" }]
    })
  ]);

  return { salesGroups, sellers };
}

export async function createManagedUser(prisma: PrismaClient, actor: ActorContext, input: UserManagementInput) {
  if (!input.name || !input.email || !input.password || !input.role) {
    throw new UserManagementError("INVALID_INPUT");
  }
  if (!validatePasswordPolicy(input.password, { email: input.email }).valid) {
    throw new UserManagementError("INVALID_INPUT");
  }
  if (!["ADMIN", "SAC", "VENDEDOR", "SUPERVISOR"].includes(input.role)) {
    throw new UserManagementError("INVALID_INPUT");
  }

  await ensureEmailAvailable(prisma, input.email);
  await ensureSalesGroupBelongsToOrganization(prisma, actor, input.salesGroupId);
  await ensureScopesBelongToOrganization(prisma, actor, input.role, input.unitScopeIds, input.sectorScopeIds);

  const user = await prisma.user.create({
    data: {
      organizationId: actor.organizationId,
      name: input.name,
      email: input.email,
      passwordHash: await hashPassword(input.password),
      role: input.role,
      phone: input.phone,
      active: input.active ?? true,
      unitScopeJson: serializeScopeIds(input.role, input.unitScopeIds),
      sectorScopeJson: serializeScopeIds(input.role, input.sectorScopeIds)
    }
  });

  await syncCommercialLinks(prisma, actor, user, input);

  await recordAuditLog(prisma, {
    organizationId: actor.organizationId,
    actorId: actor.id,
    action: "user.create",
    entityType: "User",
    entityId: user.id,
    metadata: { email: user.email, role: user.role, active: user.active }
  });

  return sanitizeUser(user);
}

export async function updateManagedUser(
  prisma: PrismaClient,
  actor: ActorContext,
  userId: string,
  input: UserManagementInput
) {
  const existing = await prisma.user.findFirst({ where: { id: userId, organizationId: actor.organizationId } });
  if (!existing) {
    throw new UserManagementError("NOT_FOUND");
  }

  if (
    !input.name &&
    !input.email &&
    !input.role &&
    input.phone === undefined &&
    input.active === undefined &&
    input.unitScopeIds === undefined &&
    input.sectorScopeIds === undefined &&
    input.sellerCode === undefined &&
    input.sellerDisplayName === undefined &&
    input.salesGroupId === undefined
  ) {
    throw new UserManagementError("INVALID_INPUT");
  }

  if (userId === actor.id && input.active === false) {
    throw new UserManagementError("SELF_DEACTIVATE");
  }

  const role = input.role ?? (existing.role as UserRole);
  if (!isCommercialRole(role)) {
    throw new UserManagementError("INVALID_INPUT");
  }

  if (input.email) {
    await ensureEmailAvailable(prisma, input.email, userId);
  }
  await ensureSalesGroupBelongsToOrganization(prisma, actor, input.salesGroupId);
  await ensureScopesBelongToOrganization(prisma, actor, role, input.unitScopeIds, input.sectorScopeIds);

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      name: input.name,
      email: input.email,
      role: input.role,
      phone: input.phone,
      active: input.active,
      unitScopeJson: input.role || input.unitScopeIds !== undefined ? serializeScopeIds(role, input.unitScopeIds) : undefined,
      sectorScopeJson:
        input.role || input.sectorScopeIds !== undefined ? serializeScopeIds(role, input.sectorScopeIds) : undefined
    }
  });

  await syncCommercialLinks(prisma, actor, user, input);

  await recordAuditLog(prisma, {
    organizationId: actor.organizationId,
    actorId: actor.id,
    action: input.active === false ? "user.deactivate" : "user.update",
    entityType: "User",
    entityId: user.id,
    metadata: {
      name: input.name,
      email: input.email,
      role: input.role,
      phone: input.phone,
      active: input.active,
      unitScopeIds: input.unitScopeIds,
      sectorScopeIds: input.sectorScopeIds,
      sellerCode: input.sellerCode,
      sellerDisplayName: input.sellerDisplayName,
      salesGroupId: input.salesGroupId
    }
  });

  return sanitizeUser(user);
}

export async function resetManagedUserPassword(
  prisma: PrismaClient,
  actor: ActorContext,
  userId: string,
  password: string | undefined
) {
  if (!password) {
    throw new UserManagementError("INVALID_INPUT");
  }

  const existing = await prisma.user.findFirst({ where: { id: userId, organizationId: actor.organizationId } });
  if (!existing) {
    throw new UserManagementError("NOT_FOUND");
  }
  if (!validatePasswordPolicy(password, { email: existing.email }).valid) {
    throw new UserManagementError("INVALID_INPUT");
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await hashPassword(password), passwordChangedAt: new Date() }
  });

  await recordAuditLog(prisma, {
    organizationId: actor.organizationId,
    actorId: actor.id,
    action: "user.password_reset",
    entityType: "User",
    entityId: user.id,
    metadata: { email: user.email }
  });

  return sanitizeUser(user);
}

export async function getUserProfile(prisma: PrismaClient, actor: ActorContext) {
  const user = await prisma.user.findFirst({
    where: { id: actor.id, organizationId: actor.organizationId },
    select: profileSelect()
  });
  if (!user) throw new UserManagementError("NOT_FOUND");
  return { profile: sanitizeUser(user) };
}

export async function updateUserProfile(prisma: PrismaClient, actor: ActorContext, input: UserManagementInput) {
  if (!input.name && input.phone === undefined && input.avatarUrl === undefined) {
    throw new UserManagementError("INVALID_INPUT");
  }

  const existing = await prisma.user.findFirst({ where: { id: actor.id, organizationId: actor.organizationId } });
  if (!existing) throw new UserManagementError("NOT_FOUND");

  const user = await prisma.user.update({
    where: { id: actor.id },
    data: {
      name: input.name,
      phone: input.phone,
      avatarUrl: input.avatarUrl
    },
    select: profileSelect()
  });

  if (user.sellerProfile && (input.name || input.phone !== undefined)) {
    await prisma.sellerProfile.update({
      where: { id: user.sellerProfile.id },
      data: {
        displayName: input.name ?? user.sellerProfile.displayName,
        phone: input.phone === undefined ? user.sellerProfile.phone : input.phone
      }
    });
  }

  await recordAuditLog(prisma, {
    organizationId: actor.organizationId,
    actorId: actor.id,
    action: "user.profile_update",
    entityType: "User",
    entityId: actor.id,
    metadata: { name: input.name, phone: input.phone, avatarUrl: input.avatarUrl }
  });

  return { profile: sanitizeUser(user) };
}
