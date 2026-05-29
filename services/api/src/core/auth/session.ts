import type { UserRole } from "@alwaystrack/shared";
import { createHmac, timingSafeEqual } from "node:crypto";
import { loadEnv, type ApiEnv } from "../../config/env.js";

export const sessionCookieName = "alwaystrack_session";

export function getSessionCookieName(env: ApiEnv = loadEnv()) {
  return env.sessionCookieName;
}

export interface SessionPayload {
  userId: string;
  organizationId: string;
  role: UserRole;
  issuedAt: number;
}

function base64UrlEncode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

export function createSessionToken(payload: SessionPayload, secret: string) {
  const body = base64UrlEncode(JSON.stringify(payload));
  return `${body}.${sign(body, secret)}`;
}

export function parseSessionToken(token: string | undefined, secret: string): SessionPayload | null {
  if (!token) {
    return null;
  }

  const [body, signature] = token.split(".");
  if (!body || !signature) {
    return null;
  }

  const expected = sign(body, secret);
  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(signature);
  if (expectedBuffer.length !== signatureBuffer.length || !timingSafeEqual(expectedBuffer, signatureBuffer)) {
    return null;
  }

  try {
    return JSON.parse(base64UrlDecode(body)) as SessionPayload;
  } catch {
    return null;
  }
}
