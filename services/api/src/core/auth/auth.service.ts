import type { CurrentUser } from "@alwaystrack/shared";
import { userRoles, type UserRole } from "@alwaystrack/shared";
import type { PrismaClient } from "@prisma/client";
import { verifyPassword } from "./password.js";
import { createSessionToken } from "./session.js";
import { parseScopeIds } from "./scope.js";
import { recordAuditLog } from "../audit/audit.service.js";

export class AuthError extends Error {
  constructor(public readonly code: "INVALID_CREDENTIALS" | "INACTIVE_USER") {
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

export async function loginUser(prisma: PrismaClient, input: LoginInput, sessionSecret: string) {
  const normalizedEmail = input.email.trim().toLowerCase();
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

  const currentUser: CurrentUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: toUserRole(user.role),
    organizationId: user.organizationId,
    unitScopeIds: parseScopeIds(user.unitScopeJson),
    sectorScopeIds: parseScopeIds(user.sectorScopeJson)
  };

  return {
    user: currentUser,
    token: createSessionToken(
      {
        userId: user.id,
        organizationId: user.organizationId,
        role: toUserRole(user.role),
        issuedAt: Date.now()
      },
      sessionSecret
    )
  };
}
