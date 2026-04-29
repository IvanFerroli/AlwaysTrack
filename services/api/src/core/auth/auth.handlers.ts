import type { Request, Response } from "express";
import { serialize } from "cookie";
import { loadEnv } from "../../config/env.js";
import { recordAuditLog } from "../audit/audit.service.js";
import { prisma } from "../db/prisma.js";
import { sendError, sendOk } from "../http/responses.js";
import { AuthError, loginUser } from "./auth.service.js";
import { sessionCookieName } from "./session.js";

export async function loginHandler(request: Request, response: Response) {
  const body = request.body as Partial<{ email: string; password: string }>;
  if (!body.email || !body.password) {
    return sendError(response, 400, "INVALID_INPUT", "Email and password are required.");
  }

  try {
    const result = await loginUser(prisma, { email: body.email, password: body.password }, loadEnv().sessionSecret);
    response.setHeader(
      "set-cookie",
      serialize(sessionCookieName, result.token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 8
      })
    );
    return sendOk(response, { user: result.user });
  } catch (error) {
    if (error instanceof AuthError) {
      return sendError(response, 401, error.code, "Invalid email, password, or user status.");
    }
    throw error;
  }
}

export async function logoutHandler(request: Request, response: Response) {
  if (request.user) {
    await recordAuditLog(prisma, {
      organizationId: request.user.organizationId,
      actorId: request.user.id,
      action: "auth.logout",
      entityType: "User",
      entityId: request.user.id,
      metadata: { email: request.user.email }
    });
  }

  response.setHeader(
    "set-cookie",
    serialize(sessionCookieName, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0
    })
  );
  return sendOk(response, { loggedOut: true });
}

export function meHandler(request: Request, response: Response) {
  return sendOk(response, { user: request.user });
}
