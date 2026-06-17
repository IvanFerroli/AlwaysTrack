import type { UserRole } from "@alwaystrack/shared";
import { createHmac, timingSafeEqual } from "node:crypto";
import { loadEnv, type ApiEnv } from "../../config/env.js";

export const sessionCookieName = "alwaystrack_session";
export const defaultSessionMaxAgeSeconds = 60 * 60 * 8;
export const maximumSessionMaxAgeSeconds = 60 * 60 * 12;

export function getSessionCookieName(env: ApiEnv = loadEnv()) {
  return env.sessionCookieName;
}

export interface SessionPayload {
  userId: string;
  organizationId: string;
  role: UserRole;
  issuedAt: number;
}

export interface ParseSessionOptions {
  now?: number;
  maxAgeSeconds?: number;
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

export function getSessionMaxAgeSeconds(source: Partial<Record<"SESSION_MAX_AGE_SECONDS", string | undefined>> = process.env) {
  const configured = Number(source.SESSION_MAX_AGE_SECONDS ?? "");
  if (!Number.isFinite(configured) || configured <= 0) {
    return defaultSessionMaxAgeSeconds;
  }
  return Math.min(Math.floor(configured), maximumSessionMaxAgeSeconds);
}

function isValidSessionPayload(value: unknown): value is SessionPayload {
  const payload = value as Partial<SessionPayload>;
  return (
    typeof payload.userId === "string" &&
    typeof payload.organizationId === "string" &&
    typeof payload.role === "string" &&
    typeof payload.issuedAt === "number" &&
    Number.isFinite(payload.issuedAt)
  );
}

export function parseSessionToken(token: string | undefined, secret: string, options: ParseSessionOptions = {}): SessionPayload | null {
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
    const payload = JSON.parse(base64UrlDecode(body));
    if (!isValidSessionPayload(payload)) {
      return null;
    }
    const maxAgeMs = (options.maxAgeSeconds ?? getSessionMaxAgeSeconds()) * 1000;
    const now = options.now ?? Date.now();
    if (payload.issuedAt > now || now - payload.issuedAt > maxAgeMs) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}
