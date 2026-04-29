import { userRoles, type CurrentUser, type UserRole } from "@sylembra/shared";
import type { NextFunction, Request, Response } from "express";
import { parse } from "cookie";
import { loadEnv } from "../../config/env.js";
import { prisma } from "../db/prisma.js";
import { sendError } from "../http/responses.js";
import { parseSessionToken, sessionCookieName } from "./session.js";

declare global {
  namespace Express {
    interface Request {
      user?: CurrentUser;
    }
  }
}

export async function requireAuth(request: Request, response: Response, next: NextFunction) {
  const cookies = parse(request.header("cookie") ?? "");
  const session = parseSessionToken(cookies[sessionCookieName], loadEnv().sessionSecret);
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
    role: user.role as UserRole,
    organizationId: user.organizationId
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
