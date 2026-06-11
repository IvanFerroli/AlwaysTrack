import type { CurrentUser } from "@alwaystrack/shared";
import { userRoles, type UserRole } from "@alwaystrack/shared";
import type { PrismaClient } from "@prisma/client";
import { verifyPassword } from "./password.js";
import { createSessionToken } from "./session.js";
import { parseScopeIds } from "./scope.js";
import { recordAuditLog } from "../audit/audit.service.js";

export class AuthError extends Error {
  constructor(public readonly code: "INVALID_CREDENTIALS" | "INACTIVE_USER" | "EMAIL_NOT_VERIFIED" | "DOMAIN_NOT_ALLOWED") {
    super(code);
  }
}

export interface LoginInput {
  email: string;
  password: string;
}

function toUserRole(value: string): UserRole {
  if (userRoles.includes(value as UserRole)) {
    return value as UserRole;
  }

  throw new AuthError("INVALID_CREDENTIALS");
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function currentUserFromRecord(user: {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  role: string;
  organizationId: string;
  unitScopeJson: string | null;
  sectorScopeJson: string | null;
}): CurrentUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl ?? null,
    role: toUserRole(user.role),
    organizationId: user.organizationId,
    unitScopeIds: parseScopeIds(user.unitScopeJson),
    sectorScopeIds: parseScopeIds(user.sectorScopeJson)
  };
}

function sessionForUser(user: { id: string; organizationId: string; role: string }, sessionSecret: string) {
  return createSessionToken(
    {
      userId: user.id,
      organizationId: user.organizationId,
      role: toUserRole(user.role),
      issuedAt: Date.now()
    },
    sessionSecret
  );
}

export async function loginUser(prisma: PrismaClient, input: LoginInput, sessionSecret: string) {
  const normalizedEmail = normalizeEmail(input.email);
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
    throw new AuthError("INVALID_CREDENTIALS");
  }

  if (!user.active) {
    throw new AuthError("INACTIVE_USER");
  }

  await recordAuditLog(prisma, {
    organizationId: user.organizationId,
    actorId: user.id,
    action: "auth.login",
    entityType: "User",
    entityId: user.id,
    metadata: { email: user.email }
  });

  return {
    user: currentUserFromRecord(user),
    token: sessionForUser(user, sessionSecret)
  };
}

export async function loginUserByVerifiedGoogleEmail(
  prisma: PrismaClient,
  input: { email: string; emailVerified: boolean; allowedDomains?: string[] },
  sessionSecret: string
) {
  const normalizedEmail = normalizeEmail(input.email);
  const allowedDomains = [...new Set((input.allowedDomains ?? []).map((domain) => domain.trim().toLowerCase()).filter(Boolean))];
  if (!input.emailVerified) {
    throw new AuthError("EMAIL_NOT_VERIFIED");
  }

  const domain = normalizedEmail.split("@")[1] ?? "";
  if (allowedDomains.length === 0 || !allowedDomains.includes(domain)) {
    throw new AuthError("DOMAIN_NOT_ALLOWED");
  }

  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user) {
    throw new AuthError("INVALID_CREDENTIALS");
  }

  if (!user.active) {
    throw new AuthError("INACTIVE_USER");
  }

  await recordAuditLog(prisma, {
    organizationId: user.organizationId,
    actorId: user.id,
    action: "auth.google_login",
    entityType: "User",
    entityId: user.id,
    metadata: { email: user.email }
  });

  return {
    user: currentUserFromRecord(user),
    token: sessionForUser(user, sessionSecret)
  };
}
