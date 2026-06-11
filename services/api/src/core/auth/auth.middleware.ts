import { userRoles, type CurrentUser, type UserRole } from "@alwaystrack/shared";
import type { NextFunction, Request, Response } from "express";
import { parse } from "cookie";
import { loadEnv } from "../../config/env.js";
import { prisma } from "../db/prisma.js";
import { sendError } from "../http/responses.js";
import { getSessionCookieName, parseSessionToken } from "./session.js";
import { parseScopeIds } from "./scope.js";

declare global {
  namespace Express {
    interface Request {
      user?: CurrentUser;
    }
  }
}

export async function requireAuth(request: Request, response: Response, next: NextFunction) {
  const env = loadEnv();
  const cookies = parse(request.header("cookie") ?? "");
  const session = parseSessionToken(cookies[getSessionCookieName(env)], env.sessionSecret);
  if (!session) {
    return sendError(response, 401, "UNAUTHENTICATED", "Login required.");
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user || !user.active) {
    return sendError(response, 401, "UNAUTHENTICATED", "Login required.");
  }

  if (!userRoles.includes(user.role as UserRole)) {
    return sendError(response, 401, "UNAUTHENTICATED", "Login required.");
  }

  request.user = {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl ?? null,
    role: user.role as UserRole,
    organizationId: user.organizationId,
    unitScopeIds: parseScopeIds(user.unitScopeJson),
    sectorScopeIds: parseScopeIds(user.sectorScopeJson)
  };
  next();
}


export function requireRole(roles: UserRole[]) {
  return (request: Request, response: Response, next: NextFunction) => {
    if (!request.user) {
      return sendError(response, 401, "UNAUTHENTICATED", "Login required.");
    }

    if (!roles.includes(request.user.role)) {
      return sendError(response, 403, "FORBIDDEN", "You do not have access to this resource.");
    }

    next();
  };
}
