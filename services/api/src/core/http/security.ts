import type { NextFunction, Request, Response } from "express";
import type { ApiEnv } from "../../config/env.js";
import { sendError } from "./responses.js";

const unsafeMethods = new Set(["POST", "PATCH", "PUT", "DELETE"]);

const localOriginHosts = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1"]);

export const securityHeaders = {
  "content-security-policy": [
    "default-src 'self'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "object-src 'none'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "connect-src 'self'",
    "font-src 'self' data:",
    "upgrade-insecure-requests"
  ].join("; "),
  "cross-origin-opener-policy": "same-origin",
  "cross-origin-resource-policy": "same-site",
  "permissions-policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  "referrer-policy": "no-referrer",
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY"
};

function normalizeOrigin(value?: string) {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return url.origin;
  } catch {
    return undefined;
  }
}

function isLocalOrigin(origin: string) {
  try {
    const url = new URL(origin);
    return ["http:", "https:"].includes(url.protocol) && (localOriginHosts.has(url.hostname) || url.hostname.endsWith(".localhost"));
  } catch {
    return false;
  }
}

function isAllowedOrigin(origin: string | undefined, env: ApiEnv) {
  if (!origin) return false;
  const normalized = normalizeOrigin(origin);
  if (!normalized) return false;
  const allowedOrigins = (env.corsOrigins ?? (env.corsOrigin ? [env.corsOrigin] : []))
    .map((value) => normalizeOrigin(value))
    .filter(Boolean);
  if (allowedOrigins.includes(normalized)) return true;
  return process.env.NODE_ENV !== "production" && isLocalOrigin(normalized);
}

function originFromReferer(request: Request) {
  const referer = request.header("referer");
  if (!referer) return undefined;
  return normalizeOrigin(referer);
}

function isPublicMutationException(request: Request) {
  const path = request.path;
  return (
    path === "/v1/webhooks/meta-whatsapp" ||
    path === "/v1/public-help/wa-link" ||
    path.startsWith("/v1/public-upload/")
  );
}

export function securityHeadersMiddleware(_request: Request, response: Response, next: NextFunction) {
  for (const [name, value] of Object.entries(securityHeaders)) {
    response.setHeader(name, value);
  }
  next();
}

export function createCorsMiddleware(env: ApiEnv) {
  return (request: Request, response: Response, next: NextFunction) => {
    const origin = request.header("origin");
    if (isAllowedOrigin(origin, env)) {
      response.header("access-control-allow-origin", normalizeOrigin(origin));
      response.header("vary", "Origin");
      response.header("access-control-allow-credentials", "true");
      response.header("access-control-allow-headers", "content-type,x-file-name,x-request-id");
      response.header("access-control-allow-methods", "GET,POST,PATCH,DELETE,OPTIONS");
    }

    if (request.method === "OPTIONS") {
      return isAllowedOrigin(origin, env) ? response.sendStatus(204) : sendError(response, 403, "ORIGIN_NOT_ALLOWED", "Origin is not allowed.");
    }

    return next();
  };
}

export function createOriginGuard(env: ApiEnv) {
  return (request: Request, response: Response, next: NextFunction) => {
    if (!unsafeMethods.has(request.method) || isPublicMutationException(request)) {
      return next();
    }

    const origin = request.header("origin") ?? originFromReferer(request);
    if (isAllowedOrigin(origin, env)) {
      return next();
    }

    if (process.env.NODE_ENV !== "production" && !origin) {
      return next();
    }

    return sendError(response, 403, "ORIGIN_NOT_ALLOWED", "Mutating requests must come from a trusted origin.");
  };
}
