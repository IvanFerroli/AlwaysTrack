import type { CurrentUser } from "@alwaystrack/shared";
import { userRoles, type UserRole } from "@alwaystrack/shared";
import type { PrismaClient } from "@prisma/client";
import { verifyPassword } from "./password.js";
import { createSessionToken } from "./session.js";
import { parseScopeIds } from "./scope.js";
import { recordAuditLog } from "../audit/audit.service.js";
import { optionalString, parseObjectPayload } from "../validation/input-validation.js";

export class AuthError extends Error {
  constructor(public readonly code: "INVALID_CREDENTIALS" | "INACTIVE_USER" | "EMAIL_NOT_VERIFIED" | "DOMAIN_NOT_ALLOWED" | "EMAIL_NOT_ALLOWED") {
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

function uniqueNormalizedEmails(values: string[] | undefined) {
  return [...new Set((values ?? []).map((email) => normalizeEmail(email)).filter(Boolean))];
}

export function assertBetaEmailAllowed(input: { email: string; appMode?: string; allowedEmails?: string[] }) {
  if (input.appMode !== "beta-local") return;
  const normalizedEmail = normalizeEmail(input.email);
  const allowedEmails = uniqueNormalizedEmails(input.allowedEmails);
  if (allowedEmails.length === 0 || !allowedEmails.includes(normalizedEmail)) {
    throw new AuthError("EMAIL_NOT_ALLOWED");
  }
}

export function parseLoginInput(payload: unknown): LoginInput {
  return parseObjectPayload(payload, (input) => ({
    email: optionalString(input, "email", { maxLength: 320 }) ?? "",
    password: optionalString(input, "password", { maxLength: 256 }) ?? ""
  }));
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

async function recordAuthFailure(
  prisma: PrismaClient,
  user: { id: string; email: string; organizationId: string },
  action: "auth.login_failed" | "auth.google_login_failed",
  reason: string
) {
  await recordAuditLog(prisma, {
    organizationId: user.organizationId,
    actorId: user.id,
    action,
    entityType: "User",
    entityId: user.id,
    metadata: { email: user.email, reason }
  });
}

export async function loginUser(prisma: PrismaClient, input: LoginInput, sessionSecret: string, options: { appMode?: string; allowedEmails?: string[] } = {}) {
  const normalizedEmail = normalizeEmail(input.email);
  assertBetaEmailAllowed({ email: normalizedEmail, appMode: options.appMode, allowedEmails: options.allowedEmails });
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  if (!user) {
    throw new AuthError("INVALID_CREDENTIALS");
  }

  if (!(await verifyPassword(input.password, user.passwordHash))) {
    await recordAuthFailure(prisma, user, "auth.login_failed", "invalid_credentials");
    throw new AuthError("INVALID_CREDENTIALS");
  }

  if (!user.active) {
    await recordAuthFailure(prisma, user, "auth.login_failed", "inactive_user");
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
  input: { email: string; emailVerified: boolean; allowedDomains?: string[]; appMode?: string; allowedEmails?: string[] },
  sessionSecret: string
) {
  const normalizedEmail = normalizeEmail(input.email);
  assertBetaEmailAllowed({ email: normalizedEmail, appMode: input.appMode, allowedEmails: input.allowedEmails });
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
    await recordAuthFailure(prisma, user, "auth.google_login_failed", "inactive_user");
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
